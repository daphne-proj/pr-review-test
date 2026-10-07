import { OrderSummary } from '../../../packages/checkout/src';
import { formatMoney } from './money-view';

export function renderSummaryCards(summary: OrderSummary): string {
  return `<section class="summary">
    <article><strong>${summary.orderCount}</strong><span>Orders</span></article>
    <article><strong>${summary.paidCount}</strong><span>Paid</span></article>
    <article><strong>${summary.cancelledCount}</strong><span>Cancelled</span></article>
    <article><strong>${formatMoney(summary.paidRevenueCents)}</strong><span>Paid revenue</span></article>
  </section>`;
}
