import { DomainEvent } from '../../core/src';
import { DeliveryAuditLog } from './delivery-audit-log';
import { DeliveryLog } from './delivery-log';
import { Outbox, pendingEventsForTenant } from './outbox';

export class DeliveryWorker {
  constructor(
    private readonly outbox: Outbox,
    private readonly deliveries: DeliveryLog,
    private readonly audit: DeliveryAuditLog,
  ) {}

  deliverNext(tenantId: string, send: (event: DomainEvent) => string): string | undefined {
    const event = pendingEventsForTenant(this.outbox, tenantId).find((candidate) => !this.deliveries.has(tenantId, candidate.id));
    if (!event) return undefined;
    const result = send(event);
    this.deliveries.record({ tenantId, eventId: event.id, result });
    this.outbox.markDelivered(tenantId, event.id);
    this.audit.record({ tenantId, eventId: event.id, result });
    return result;
  }
}
