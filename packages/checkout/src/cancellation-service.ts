import { Inventory } from '../../catalog/src';
import { orderNotFound } from '../../core/src';
import { OrderRepository } from './order-repository';
import { PaymentGateway } from './payment';

export class CancellationService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly payments: PaymentGateway,
    private readonly inventory: Inventory,
  ) {}

  cancel(input: { tenantId: string; orderId: string }): { cancelled: boolean } {
    const order = this.orders.findForTenant(input.tenantId, input.orderId);
    if (!order) throw orderNotFound();
    if (order.state === 'cancelled') return { cancelled: false };
    this.payments.refund(order.paymentId, order.totalCents);
    this.inventory.releaseCommitted(order.reservationId);
    order.state = 'cancelled';
    return { cancelled: true };
  }
}
