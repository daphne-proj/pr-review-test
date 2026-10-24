import { requireEntry } from '../../core/src';
import { DeliveryJob, NewDeliveryJob } from './job';

export class JobQueue {
  private readonly jobs = new Map<string, DeliveryJob>();

  enqueue(job: NewDeliveryJob): void {
    if (!this.jobs.has(job.id)) this.jobs.set(job.id, { ...job, status: 'pending' });
  }

  claim(
    id: string,
    owner: string,
    now: number,
    duration: number,
  ): DeliveryJob & { leaseGeneration: number } {
    const leaseUntil = now + duration;

    if (
      typeof owner !== 'string' ||
      owner.length === 0 ||
      !Number.isFinite(now) ||
      !Number.isFinite(duration) ||
      duration <= 0 ||
      !Number.isFinite(leaseUntil) ||
      leaseUntil <= now
    ) {
      throw new Error('invalid lease');
    }

    const job = requireEntry(this.jobs, id, 'job not found');

    if (job.status === 'complete') {
      throw new Error('job complete');
    }

    if (job.status === 'leased' && (job.leaseUntil ?? 0) > now) {
      throw new Error('job already leased');
    }

    const leaseGeneration = (job.leaseGeneration ?? 0) + 1;

    if (!Number.isSafeInteger(leaseGeneration)) {
      throw new Error('lease generation exhausted');
    }

    job.status = 'leased';
    job.leaseOwner = owner;
    job.leaseUntil = leaseUntil;
    job.leaseGeneration = leaseGeneration;

    return { ...job, leaseGeneration };
  }

  complete(
    id: string,
    owner: string,
    leaseGeneration: number,
    now: number,
  ): void {
    if (
      !Number.isSafeInteger(leaseGeneration) ||
      leaseGeneration <= 0 ||
      !Number.isFinite(now)
    ) {
      throw new Error('invalid lease completion');
    }

    const job = requireEntry(this.jobs, id, 'job not found');

    if (
      job.status !== 'leased' ||
      job.leaseOwner !== owner ||
      job.leaseGeneration !== leaseGeneration
    ) {
      throw new Error('lease owner or generation mismatch');
    }

    if (job.leaseUntil === undefined || job.leaseUntil <= now) {
      throw new Error('lease expired');
    }

    job.status = 'complete';
  }

  get(id: string): DeliveryJob {
    return { ...requireEntry(this.jobs, id, 'job not found') };
  }
}
