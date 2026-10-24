import { Order } from '../../checkout/src/order';
import { Clock, IdSource } from '../../core/src';
import { JobQueue } from './job-queue';
import { assertJobIdentifier, assertJobTime } from './job-validation';

export class FulfillmentService {
  constructor(
    private readonly jobs: JobQueue,
    private readonly ids: IdSource,
    private readonly clock: Clock,
  ) {}

  schedule(order: Order, delayMs: number = 0): string {
    assertJobIdentifier(order.id, 'order id');
    assertJobIdentifier(order.eventId, 'event id');

    if (order.state !== 'paid') {
      throw new Error('only paid orders can be scheduled');
    }

    if (!Number.isSafeInteger(delayMs) || delayMs < 0) {
      throw new Error('invalid delivery delay');
    }

    const now = this.clock.now();
    const availableAt = now + delayMs;
    assertJobTime(now);
    assertJobTime(availableAt);

    if (delayMs > 0 && availableAt <= now) {
      throw new Error('invalid delivery deadline');
    }

    const id = this.ids.next('job');
    this.jobs.enqueue(
      {
        id,
        eventId: order.eventId,
        payload: { orderId: order.id },
        availableAt,
      },
      now,
    );

    return id;
  }
}
