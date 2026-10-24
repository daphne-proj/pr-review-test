import {
  DeliveryJob,
  DeliverySender,
  JobWorker,
} from '../../../packages/fulfillment/src';

export class JobRunner {
  constructor(private readonly worker: JobWorker) {}

  async run(
    owner: string,
    send: DeliverySender,
    maxJobs: number = 1,
  ): Promise<DeliveryJob[]> {
    if (!Number.isSafeInteger(maxJobs) || maxJobs < 1 || maxJobs > 100) {
      throw new Error('job batch size must be between 1 and 100');
    }

    const results: DeliveryJob[] = [];

    for (let index = 0; index < maxJobs; index += 1) {
      const result = await this.worker.runNext(owner, send);

      if (!result) {
        break;
      }

      results.push(result);
    }

    return results;
  }
}
