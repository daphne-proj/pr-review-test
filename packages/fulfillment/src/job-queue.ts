import { requireEntry } from '../../core/src';
import { DeliveryJob, NewDeliveryJob } from './job';

export class JobQueue {
  private readonly jobs = new Map<string, DeliveryJob>();

  enqueue(job: NewDeliveryJob): void {
    if (!this.jobs.has(job.id)) this.jobs.set(job.id, { ...job, status: 'pending' });
  }

  claim(id: string, owner: string, now: number, duration: number): DeliveryJob {
    const job = requireEntry(this.jobs, id, 'job not found');
    if (job.status === 'complete') throw new Error('job complete');
    if (job.status === 'leased' && (job.leaseUntil ?? 0) > now) throw new Error('job already leased');
    job.status = 'leased';
    job.leaseOwner = owner;
    job.leaseUntil = now + duration;
    return { ...job };
  }

  complete(id: string, owner: string): void {
    const job = requireEntry(this.jobs, id, 'job not found');
    if (job.status !== 'leased' || job.leaseOwner !== owner) throw new Error('lease owner mismatch');
    job.status = 'complete';
  }

  get(id: string): DeliveryJob {
    return { ...requireEntry(this.jobs, id, 'job not found') };
  }
}
