import { DomainEvent } from '../../core/src';

interface OutboxRecord {
  event: DomainEvent;
  delivered: boolean;
}

export class Outbox {
  private readonly records: OutboxRecord[] = [];

  append(event: DomainEvent): void {
    if (this.records.some((record) => record.event.id === event.id)) return;
    this.records.push({ event, delivered: false });
  }

  pending(): DomainEvent[] {
    return this.records.filter((record) => !record.delivered).map((record) => record.event);
  }

  markDelivered(eventId: string): void {
    const record = this.records.find((candidate) => candidate.event.id === eventId);
    if (!record) throw new Error('outbox event not found');
    record.delivered = true;
  }
}
