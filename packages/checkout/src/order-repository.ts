import { Order } from './order';

export class OrderRepository {
  private readonly orders = new Map<string, Order>();

  save(order: Order): void {
    this.orders.set(order.id, order);
  }

  findForTenant(tenantId: string, orderId: string): Order | undefined {
    const order = this.orders.get(orderId);
    return order?.tenantId === tenantId ? order : undefined;
  }

  all(): Order[] {
    return [...this.orders.values()];
  }
}
