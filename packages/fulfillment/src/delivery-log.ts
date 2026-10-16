import { assertTenantId } from '../../core/src';

export interface DeliveryRecord {
  tenantId: string;
  eventId: string;
  result: string;
}

export class DeliveryLog {
  private readonly records: DeliveryRecord[] = [];

  record(entry: DeliveryRecord): void {
    if (!this.has(entry.tenantId, entry.eventId)) this.records.push(entry);
  }

  has(tenantId: string, eventId: string): boolean {
    assertTenantId(tenantId);
    return this.records.some((record) => record.tenantId === tenantId && record.eventId === eventId);
  }

  all(): DeliveryRecord[] {
    return [...this.records];
  }
}
