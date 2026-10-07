import { Cents, CustomerId, OrderId, PaymentId, ReservationId, Sku, TenantId } from '../../core/src';

export interface Order {
  id: OrderId;
  tenantId: TenantId;
  customerId: CustomerId;
  sku: Sku;
  quantity: number;
  totalCents: Cents;
  paymentId: PaymentId;
  reservationId: ReservationId;
  eventId: string;
  placedAt: number;
  state: 'paid' | 'cancelled';
}
