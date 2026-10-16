export type TenantId = string;
export type CustomerId = string;
export type OrderId = string;
export type PaymentId = string;
export type ReservationId = string;
export type Sku = string;

export function assertTenantId(value: TenantId): TenantId {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error('invalid tenant');
  return value;
}

export interface Clock {
  now(): number;
}
