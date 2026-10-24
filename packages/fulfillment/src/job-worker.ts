import { Clock } from '../../core/src';
import { DeliveryJob, DeliverySender } from './job';
import { JobQueue } from './job-queue';

function failureMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return 'delivery failed';
}

export class JobWorker {
  constructor(
    private readonly jobs: JobQueue,
    private readonly clock: Clock,
  ) {}

  async runNext(
    owner: string,
    send: DeliverySender,
  ): Promise<DeliveryJob | undefined> {
    if (typeof send !== 'function') {
      throw new Error('invalid delivery sender');
    }

    const claimed = this.jobs.claimNext(owner, this.clock.now());

    if (!claimed) {
      return undefined;
    }

    const { id, leaseGeneration } = claimed;

    /* Only sender failures schedule retries; clock and lease errors must escape. */
    try {
      await send(claimed);
    } catch (error) {
      return this.jobs.fail(
        id,
        owner,
        leaseGeneration,
        this.clock.now(),
        failureMessage(error),
      );
    }

    return this.jobs.complete(id, owner, leaseGeneration, this.clock.now());
  }
}
