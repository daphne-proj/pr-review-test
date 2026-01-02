import { IdempotencyRecord } from './idempotency-record';

export class IdempotencyRepository {
  private readonly records = new Map<string, IdempotencyRecord>();

  find(tenantId: string, key: string): IdempotencyRecord | undefined {
    return this.records.get(`${tenantId}:${key}`);
  }

  save(record: IdempotencyRecord): void {
    this.records.set(`${record.tenantId}:${record.key}`, record);
  }

  all(): IdempotencyRecord[] {
    return [...this.records.values()];
  }
}
