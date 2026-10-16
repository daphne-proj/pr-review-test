import { assertTenantId } from '../../core/src';
import { Order } from './order';

export class OrderRepository {
  private readonly orders = new Map<string, Order>();

  save(order: Order): void {
    this.orders.set(JSON.stringify([assertTenantId(order.tenantId), order.id]), order);
  }

  findForTenant(tenantId: string, orderId: string): Order | undefined {
    const order = this.orders.get(JSON.stringify([assertTenantId(tenantId), orderId]));
    return order?.tenantId === tenantId ? order : undefined;
  }

  all(): Order[] {
    return [...this.orders.values()];
  }
}
