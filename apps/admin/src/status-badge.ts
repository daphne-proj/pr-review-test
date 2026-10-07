export function renderStatusBadge(state: 'paid' | 'cancelled'): string {
  return `<span class="status status--${state}">${state}</span>`;
}
