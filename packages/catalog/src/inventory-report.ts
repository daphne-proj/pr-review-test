import { Inventory } from './inventory';
import { Reservation, ReservationState } from './reservation';
import { ReservationQuery } from './reservation-query';

export function lowStock(inventory: Inventory, skus: string[], threshold: number): string[] {
  return skus.filter((sku) => inventory.available(sku) <= threshold);
}

export interface ReservationTotals {
  count: number;
  quantity: number;
}

export interface ReservationReport {
  asOf: number;
  rows: Reservation[];
  byState: Record<ReservationState, ReservationTotals>;
  expiredActive: ReservationTotals;
  nextExpiry: number | undefined;
}

function addReservation(totals: ReservationTotals, quantity: number): void {
  const count = totals.count + 1;
  const totalQuantity = totals.quantity + quantity;

  if (
    !Number.isSafeInteger(quantity) ||
    quantity <= 0 ||
    !Number.isSafeInteger(totalQuantity) ||
    !Number.isSafeInteger(count)
  ) {
    throw new Error('reservation summary exceeds safe integer range');
  }

  totals.count = count;
  totals.quantity = totalQuantity;
}

export function reservationReport(
  inventory: Inventory,
  now: number,
  query: ReservationQuery = {},
): ReservationReport {
  if (!Number.isFinite(now)) {
    throw new Error('invalid report time');
  }

  const rows = inventory.queryReservations(query);
  const byState: ReservationReport['byState'] = {
    active: { count: 0, quantity: 0 },
    committed: { count: 0, quantity: 0 },
    released: { count: 0, quantity: 0 },
  };
  const expiredActive = { count: 0, quantity: 0 };
  let nextExpiry: number | undefined;

  for (const reservation of rows) {
    addReservation(byState[reservation.state], reservation.quantity);

    if (reservation.state !== 'active') {
      continue;
    }

    if (reservation.expiresAt <= now) {
      addReservation(expiredActive, reservation.quantity);
    } else if (nextExpiry === undefined || reservation.expiresAt < nextExpiry) {
      nextExpiry = reservation.expiresAt;
    }
  }

  return { asOf: now, rows, byState, expiredActive, nextExpiry };
}
