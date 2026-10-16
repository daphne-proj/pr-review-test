export interface DomainEvent<T = unknown> {
  id: string;
  tenantId: string;
  type: string;
  occurredAt?: number;
  payload: T;
}
