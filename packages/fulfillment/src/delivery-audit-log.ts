import { assertTenantId } from '../../core/src';

export interface DeliveryAuditRecord {
  tenantId: string;
  eventId: string;
  result: string;
}

export class DeliveryAuditLog {
  private readonly records: DeliveryAuditRecord[] = [];

  record(entry: DeliveryAuditRecord): void {
    assertTenantId(entry.tenantId);
    this.records.push({ ...entry });
  }

  forTenant(tenantId: string): DeliveryAuditRecord[] {
    assertTenantId(tenantId);
    return this.records.filter((record) => record.tenantId === tenantId).map((record) => ({ ...record }));
  }
}
