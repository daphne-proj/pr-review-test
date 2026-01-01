import { OrderRepository } from './order-repository';

export function capturedRevenue(orders: OrderRepository): number {
  return orders.all().filter((order) => order.state === 'paid').reduce((sum, order) => sum + order.totalCents, 0);
}
