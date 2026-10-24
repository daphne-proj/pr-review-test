import { DeliveryJob } from './job';

export interface JobQueueSummary {
  total: number;
  pending: number;
  leased: number;
  complete: number;
  exhausted: number;
  nextWakeAt?: number;
}

export function summarizeJobs(jobs: Iterable<DeliveryJob>): JobQueueSummary {
  const summary: JobQueueSummary = {
    total: 0,
    pending: 0,
    leased: 0,
    complete: 0,
    exhausted: 0,
  };

  for (const job of jobs) {
    summary.total += 1;
    summary[job.status] += 1;

    let nextWakeAt: number | undefined;

    if (job.status === 'pending') {
      nextWakeAt = job.availableAt;
    } else if (job.status === 'leased') {
      nextWakeAt = job.leaseUntil;
    }

    if (
      nextWakeAt !== undefined &&
      (summary.nextWakeAt === undefined || nextWakeAt < summary.nextWakeAt)
    ) {
      summary.nextWakeAt = nextWakeAt;
    }
  }

  return summary;
}
