import { OrderListItem } from '../../../packages/checkout/src';
import { escapeHtml } from './html';
import { formatMoney } from './money-view';
import { renderStatusBadge } from './status-badge';

export function renderOrderTable(orders: OrderListItem[]): string {
  if (orders.length === 0) return '<div class="empty">No orders match these filters.</div>';
  const rows = orders.map((order) => `<tr>
    <td>${escapeHtml(order.id)}</td>
    <td>${escapeHtml(order.customerId)}</td>
    <td>${escapeHtml(order.sku)} × ${order.quantity}</td>
    <td>${formatMoney(order.totalCents)}</td>
    <td>${renderStatusBadge(order.state)}</td>
    <td><time datetime="${new Date(order.placedAt).toISOString()}">${new Date(order.placedAt).toLocaleString('en-US')}</time></td>
  </tr>`).join('');
  return `<table><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Placed</th></tr></thead><tbody>${rows}</tbody></table>`;
}
