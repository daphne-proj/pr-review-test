import { OrderListItem, toOrderListItem } from './order-read-model';
import { OrderRepository } from './order-repository';

export interface OrderFilters {
  state?: 'paid' | 'cancelled';
  minimumTotalCents?: number;
}

export class OrderQueryService {
  constructor(private readonly orders: OrderRepository) {}

  list(tenantId: string, filters: OrderFilters = {}): OrderListItem[] {
    return this.orders
      .forTenant(tenantId)
      .filter((order) => !filters.state || order.state === filters.state)
      .filter((order) => filters.minimumTotalCents === undefined || order.totalCents >= filters.minimumTotalCents)
      .sort((left, right) => right.placedAt - left.placedAt)
      .map(toOrderListItem);
  }
}
