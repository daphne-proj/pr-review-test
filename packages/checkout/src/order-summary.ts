import { OrderListItem } from './order-read-model';

export interface OrderSummary {
  orderCount: number;
  paidCount: number;
  cancelledCount: number;
  paidRevenueCents: number;
}

export function summarizeOrders(orders: OrderListItem[]): OrderSummary {
  return {
    orderCount: orders.length,
    paidCount: orders.filter((order) => order.state === 'paid').length,
    cancelledCount: orders.filter((order) => order.state === 'cancelled').length,
    paidRevenueCents: orders
      .filter((order) => order.state === 'paid')
      .reduce((total, order) => total + order.totalCents, 0),
  };
}
