import { DomainEvent } from '../../core/src';
import { DeliveryLog } from './delivery-log';
import { Outbox } from './outbox';

export class DeliveryWorker {
  constructor(
    private readonly outbox: Outbox,
    private readonly deliveries: DeliveryLog,
  ) {}

  deliverNext(send: (event: DomainEvent) => string): string | undefined {
    const event = this.outbox.pending().find((candidate) => !this.deliveries.has(candidate.id));
    if (!event) return undefined;
    const result = send(event);
    this.deliveries.record({ eventId: event.id, result });
    this.outbox.markDelivered(event.id);
    return result;
  }
}
