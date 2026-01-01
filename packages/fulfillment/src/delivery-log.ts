export interface DeliveryRecord {
  eventId: string;
  result: string;
}

export class DeliveryLog {
  private readonly records: DeliveryRecord[] = [];

  record(entry: DeliveryRecord): void {
    if (!this.has(entry.eventId)) this.records.push(entry);
  }

  has(eventId: string): boolean {
    return this.records.some((record) => record.eventId === eventId);
  }

  all(): DeliveryRecord[] {
    return [...this.records];
  }
}
