import { OrderFilters } from '../../../packages/checkout/src';

export function renderOrderFilters(filters: OrderFilters): string {
  const selected = (state: string) => filters.state === state ? ' selected' : '';
  return `<form class="filters" method="get">
    <label>Status <select name="state">
      <option value="">All</option>
      <option value="paid"${selected('paid')}>Paid</option>
      <option value="cancelled"${selected('cancelled')}>Cancelled</option>
    </select></label>
    <label>Minimum total <input name="minimumTotalCents" type="number" min="0" value="${filters.minimumTotalCents ?? ''}"></label>
    <button type="submit">Apply</button>
  </form>`;
}
