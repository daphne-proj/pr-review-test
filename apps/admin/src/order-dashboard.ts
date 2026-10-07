import { OrderFilters, OrderQueryService, summarizeOrders } from '../../../packages/checkout/src';
import { renderOrderFilters } from './order-filters';
import { renderOrderTable } from './order-table';
import { renderPage } from './page-shell';
import { renderSummaryCards } from './summary-cards';

export class OrderDashboard {
  constructor(private readonly queries: OrderQueryService) {}

  render(tenantId: string, filters: OrderFilters = {}): string {
    const orders = this.queries.list(tenantId, filters);
    return renderPage('Order operations', `<header><p>Commerce operations</p><h1>Orders</h1></header>${renderSummaryCards(summarizeOrders(orders))}${renderOrderFilters(filters)}${renderOrderTable(orders)}`);
  }
}
