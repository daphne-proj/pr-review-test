export interface DomainEvent<T = unknown> {
  id: string;
  type: string;
  occurredAt?: number;
  payload: T;
}
