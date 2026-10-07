import { Order } from './order';

export interface OrderListItem {
  id: string;
  customerId: string;
  sku: string;
  quantity: number;
  totalCents: number;
  state: Order['state'];
  placedAt: number;
}

export function toOrderListItem(order: Order): OrderListItem {
  return {
    id: order.id,
    customerId: order.customerId,
    sku: order.sku,
    quantity: order.quantity,
    totalCents: order.totalCents,
    state: order.state,
    placedAt: order.placedAt,
  };
}
