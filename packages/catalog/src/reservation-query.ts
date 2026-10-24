import { Reservation, ReservationState } from './reservation';

export interface ReservationQuery {
  sku?: string;
  state?: ReservationState;
  expiresAtOrBefore?: number;
}

export function validateReservationQuery(query: ReservationQuery): void {
  if (query.sku !== undefined && query.sku.trim().length === 0) {
    throw new Error('invalid reservation SKU');
  }

  if (
    query.state !== undefined &&
    query.state !== 'active' &&
    query.state !== 'committed' &&
    query.state !== 'released'
  ) {
    throw new Error('invalid reservation state');
  }

  if (
    query.expiresAtOrBefore !== undefined &&
    !Number.isFinite(query.expiresAtOrBefore)
  ) {
    throw new Error('invalid reservation expiry cutoff');
  }
}

export function matchesReservation(
  reservation: Reservation,
  query: ReservationQuery,
): boolean {
  if (query.sku !== undefined && reservation.sku !== query.sku) {
    return false;
  }

  if (query.state !== undefined && reservation.state !== query.state) {
    return false;
  }

  return (
    query.expiresAtOrBefore === undefined ||
    reservation.expiresAt <= query.expiresAtOrBefore
  );
}

export function compareReservations(
  left: Reservation,
  right: Reservation,
): number {
  if (left.expiresAt !== right.expiresAt) {
    return left.expiresAt < right.expiresAt ? -1 : 1;
  }

  if (left.id === right.id) {
    return 0;
  }

  return left.id < right.id ? -1 : 1;
}
