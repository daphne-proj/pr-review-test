export type TenantId = string;
export type CustomerId = string;
export type OrderId = string;
export type PaymentId = string;
export type ReservationId = string;
export type Sku = string;

export interface Clock {
  now(): number;
}
