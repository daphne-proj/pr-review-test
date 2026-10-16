import { assertTenantId, DomainEvent } from '../../core/src';

interface OutboxRecord {
  event: DomainEvent;
  delivered: boolean;
}

export class Outbox {
  private readonly records: OutboxRecord[] = [];

  append(event: DomainEvent): void {
    assertTenantId(event.tenantId);
    if (this.records.some((record) => record.event.tenantId === event.tenantId && record.event.id === event.id)) return;
    this.records.push({ event, delivered: false });
  }

  pending(): DomainEvent[] {
    return this.records.filter((record) => !record.delivered).map((record) => record.event);
  }

  markDelivered(tenantId: string, eventId: string): void {
    assertTenantId(tenantId);
    const record = this.records.find((candidate) => candidate.event.tenantId === tenantId && candidate.event.id === eventId);
    if (!record) throw new Error('outbox event not found');
    record.delivered = true;
  }
}

export function pendingEventsForTenant(outbox: Outbox, tenantId: string): DomainEvent[] {
  assertTenantId(tenantId);
  return outbox.pending().filter((event) => event.tenantId === tenantId);
}
