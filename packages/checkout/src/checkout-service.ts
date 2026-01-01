import { Inventory } from '../../catalog/src';
import { Clock, IdSource, TenantId } from '../../core/src';
import { Outbox } from '../../fulfillment/src/outbox';
import { OrderRepository } from './order-repository';
import { PaymentGateway } from './payment';
import { price } from './pricing';

export interface PlaceOrderInput {
  tenantId: TenantId;
  customerId: string;
  sku: string;
  quantity: number;
  unitPriceCents: number;
  promotionBps: number;
}

export type PlaceOrderResult =
  | { ok: true; orderId: string; totalCents: number }
  | { ok: false; reason: string };

export class CheckoutService {
  constructor(
    private readonly inventory: Inventory,
    private readonly payments: PaymentGateway,
    private readonly orders: OrderRepository,
    private readonly outbox: Outbox,
    private readonly clock: Clock,
    private readonly ids: IdSource,
  ) {}

  place(input: PlaceOrderInput): PlaceOrderResult {
    const total = price(input);
    const reservationId = this.ids.next('reservation');
    const reservation = this.inventory.reserve({
      id: reservationId,
      sku: input.sku,
      quantity: input.quantity,
      expiresAt: this.clock.now() + 15 * 60_000,
    });
    if (!reservation) return { ok: false, reason: 'insufficient_stock' };

    const paymentId = this.ids.next('payment');
    const charge = this.payments.charge({ paymentId, tenantId: input.tenantId, amountCents: total.totalCents });
    if (!charge.ok) {
      this.inventory.release(reservationId);
      return charge;
    }

    const orderId = this.ids.next('order');
    const eventId = this.ids.next('event');
    this.inventory.commit(reservationId);
    this.orders.save({
      id: orderId,
      tenantId: input.tenantId,
      customerId: input.customerId,
      sku: input.sku,
      quantity: input.quantity,
      totalCents: total.totalCents,
      paymentId,
      reservationId,
      eventId,
      state: 'paid',
    });
    this.outbox.append({ id: eventId, type: 'order.placed', occurredAt: this.clock.now(), payload: { orderId } });
    return { ok: true, orderId, totalCents: total.totalCents };
  }
}
