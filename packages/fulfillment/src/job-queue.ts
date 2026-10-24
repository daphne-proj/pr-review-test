import { requireEntry } from '../../core/src';
import {
  ClaimedDeliveryJob,
  CompletedDeliveryJob,
  DeliveryJob,
  ExhaustedDeliveryJob,
  NewDeliveryJob,
  PendingDeliveryJob,
} from './job';
import { JobQueueSummary, summarizeJobs } from './job-inspection';
import { JobPolicy, resolveJobPolicy, retryAvailableAt } from './job-policy';
import { cloneJobPayload, jobDetails, snapshotJob } from './job-snapshot';
import {
  assertFailureReason,
  assertJobIdentifier,
  assertJobTime,
  assertLeaseCredentials,
  leaseDeadline,
} from './job-validation';

export class JobQueue {
  private readonly jobs = new Map<string, DeliveryJob>();
  private readonly policy: JobPolicy;

  constructor(policy: Partial<JobPolicy> = {}) {
    this.policy = resolveJobPolicy(policy);
  }

  enqueue(job: NewDeliveryJob, now: number = 0): void {
    assertJobIdentifier(job.id, 'job id');
    assertJobIdentifier(job.eventId, 'event id');
    assertJobTime(now);

    const availableAt = job.availableAt === undefined ? now : job.availableAt;
    assertJobTime(availableAt);

    if (availableAt < now) {
      throw new Error('job availability precedes creation');
    }

    const existing = this.jobs.get(job.id);

    if (existing) {
      if (existing.eventId !== job.eventId) {
        throw new Error('job id already belongs to another event');
      }

      return;
    }

    const pending: PendingDeliveryJob = {
      id: job.id,
      eventId: job.eventId,
      payload: cloneJobPayload(job.payload),
      createdAt: now,
      attempts: 0,
      leaseGeneration: 0,
      status: 'pending',
      availableAt,
    };
    this.jobs.set(job.id, pending);
  }

  claim(
    id: string,
    owner: string,
    now: number,
    duration: number,
  ): ClaimedDeliveryJob {
    assertJobIdentifier(owner, 'lease owner');

    const leaseUntil = leaseDeadline(now, duration);
    const job = requireEntry(this.jobs, id, 'job not found');

    if (job.status === 'complete' || job.status === 'exhausted') {
      throw new Error('job is terminal');
    }

    if (job.status === 'pending' && job.availableAt > now) {
      throw new Error('job is not ready');
    }

    if (job.status === 'leased' && job.leaseUntil > now) {
      throw new Error('job already leased');
    }

    if (job.attempts >= this.policy.maxAttempts) {
      throw new Error('job attempts exhausted');
    }

    const leaseGeneration = job.leaseGeneration + 1;

    if (!Number.isSafeInteger(leaseGeneration)) {
      throw new Error('lease generation exhausted');
    }

    const claimed: ClaimedDeliveryJob = {
      ...jobDetails(job),
      status: 'leased',
      leaseOwner: owner,
      leaseUntil,
      claimedAt: now,
      attempts: job.attempts + 1,
      leaseGeneration,
    };
    this.jobs.set(id, claimed);

    return snapshotJob(claimed);
  }

  claimNext(owner: string, now: number): ClaimedDeliveryJob | undefined {
    assertJobIdentifier(owner, 'lease owner');
    leaseDeadline(now, this.policy.leaseDurationMs);

    this.expireLeases(now);

    for (const job of this.jobs.values()) {
      if (job.status === 'pending' && job.availableAt <= now) {
        return this.claim(job.id, owner, now, this.policy.leaseDurationMs);
      }
    }

    return undefined;
  }

  renew(
    id: string,
    owner: string,
    generation: number,
    now: number,
    duration: number = this.policy.leaseDurationMs,
  ): ClaimedDeliveryJob {
    const job = this.currentLease(id, owner, generation, now);
    const leaseUntil = leaseDeadline(now, duration);

    if (leaseUntil <= job.leaseUntil) {
      throw new Error('renewal must extend the lease');
    }

    const renewed: ClaimedDeliveryJob = { ...job, leaseUntil };
    this.jobs.set(id, renewed);

    return snapshotJob(renewed);
  }

  complete(
    id: string,
    owner: string,
    generation: number,
    now: number,
  ): CompletedDeliveryJob {
    const job = this.currentLease(id, owner, generation, now);
    const completed: CompletedDeliveryJob = {
      ...jobDetails(job),
      status: 'complete',
      completedAt: now,
    };
    this.jobs.set(id, completed);

    return snapshotJob(completed);
  }

  fail(
    id: string,
    owner: string,
    generation: number,
    now: number,
    reason: string,
  ): PendingDeliveryJob | ExhaustedDeliveryJob {
    assertFailureReason(reason);

    const job = this.currentLease(id, owner, generation, now);
    const details = { ...jobDetails(job), lastError: reason };
    const failed: PendingDeliveryJob | ExhaustedDeliveryJob =
      job.attempts >= this.policy.maxAttempts
        ? { ...details, status: 'exhausted', exhaustedAt: now }
        : {
            ...details,
            status: 'pending',
            availableAt: retryAvailableAt(now, job.attempts, this.policy),
          };
    this.jobs.set(id, failed);

    return snapshotJob(failed);
  }

  expireLeases(now: number): DeliveryJob[] {
    assertJobTime(now);

    const expired: DeliveryJob[] = [];

    for (const job of this.jobs.values()) {
      if (job.status !== 'leased' || job.leaseUntil > now) {
        continue;
      }

      /* Recovery counts the crashed attempt without adding transport backoff. */
      const details = { ...jobDetails(job), lastError: 'lease expired' };
      const recovered: PendingDeliveryJob | ExhaustedDeliveryJob =
        job.attempts >= this.policy.maxAttempts
          ? { ...details, status: 'exhausted', exhaustedAt: now }
          : { ...details, status: 'pending', availableAt: now };
      this.jobs.set(job.id, recovered);
      expired.push(snapshotJob(recovered));
    }

    return expired;
  }

  get(id: string): DeliveryJob {
    return snapshotJob(requireEntry(this.jobs, id, 'job not found'));
  }

  list(): DeliveryJob[] {
    return [...this.jobs.values()].map((job) => snapshotJob(job));
  }

  summary(): JobQueueSummary {
    return summarizeJobs(this.jobs.values());
  }

  private currentLease(
    id: string,
    owner: string,
    generation: number,
    now: number,
  ): ClaimedDeliveryJob {
    assertLeaseCredentials(owner, generation, now);

    const job = requireEntry(this.jobs, id, 'job not found');

    if (
      job.status !== 'leased' ||
      job.leaseOwner !== owner ||
      job.leaseGeneration !== generation
    ) {
      throw new Error('lease owner or generation mismatch');
    }

    if (job.leaseUntil <= now) {
      throw new Error('lease expired');
    }

    if (now < job.claimedAt) {
      throw new Error('job time precedes claim');
    }

    return job;
  }
}
