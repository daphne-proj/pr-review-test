import { Order } from '../../checkout/src/order';
import { IdSource } from '../../core/src';
import { JobQueue } from './job-queue';

export class FulfillmentService {
  constructor(
    private readonly jobs: JobQueue,
    private readonly ids: IdSource,
  ) {}

  schedule(order: Order): string {
    const id = this.ids.next('job');
    this.jobs.enqueue({ id, eventId: order.eventId, payload: { orderId: order.id } });
    return id;
  }
}
