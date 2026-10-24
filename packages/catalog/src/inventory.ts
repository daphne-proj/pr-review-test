import { Sku } from '../../core/src';
import { Reservation, ReserveInput } from './reservation';
import { StockLedger } from './stock-ledger';
import {
  StockAdjustment,
  StockAdjustmentReceipt,
  validateStockAdjustment,
} from './stock-adjustment';
import {
  ReservationQuery,
  validateReservationQuery,
  matchesReservation,
  compareReservations,
} from './reservation-query';

export class Inventory {
  private readonly counts = new Map<Sku, number>();
  private readonly held = new Map<string, Reservation>();
  readonly ledger = new StockLedger();

  stock(sku: Sku, quantity: number): void {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new Error('invalid stock quantity');
    }

    const total = this.checkedTotal(this.available(sku), quantity);

    this.counts.set(sku, total);
    this.ledger.record({ sku, delta: quantity, reason: 'stocked' });
  }

  available(sku: Sku): number {
    return this.counts.get(sku) ?? 0;
  }

  applyAdjustments(
    adjustments: readonly StockAdjustment[],
  ): StockAdjustmentReceipt[] {
    if (adjustments.length === 0) {
      throw new Error('adjustments must not be empty');
    }

    const pendingCounts = new Map<Sku, number>();
    const receipts: StockAdjustmentReceipt[] = [];

    for (const adjustment of adjustments) {
      validateStockAdjustment(adjustment);

      const before =
        pendingCounts.get(adjustment.sku) ?? this.available(adjustment.sku);
      const after = this.checkedTotal(before, adjustment.delta);
      pendingCounts.set(adjustment.sku, after);
      receipts.push({ ...adjustment, before, after });
    }

    /* The ledger rejects duplicate IDs before either collection changes. */
    this.ledger.recordMany(
      receipts.map((receipt) => ({
        ...receipt,
        reason: 'adjusted',
        adjustmentReason: receipt.reason,
      })),
    );

    for (const [sku, quantity] of pendingCounts) {
      this.counts.set(sku, quantity);
    }

    return receipts;
  }

  private checkedTotal(before: number, delta: number): number {
    const total = before + delta;

    if (
      !Number.isSafeInteger(delta) ||
      !Number.isSafeInteger(total) ||
      total < 0
    ) {
      throw new Error('stock total outside safe integer range');
    }

    return total;
  }

  reserve(input: ReserveInput): Reservation | undefined {
    if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) throw new Error('invalid reservation quantity');
    if (this.available(input.sku) < input.quantity) return undefined;
    const reservation: Reservation = { ...input, state: 'active' };
    this.counts.set(input.sku, this.available(input.sku) - input.quantity);
    this.held.set(input.id, reservation);
    this.ledger.record({ sku: input.sku, delta: -input.quantity, reason: 'reserved' });
    return reservation;
  }

  commit(id: string): void {
    const reservation = this.held.get(id);
    if (reservation?.state === 'active') reservation.state = 'committed';
  }

  release(id: string): boolean {
    const reservation = this.held.get(id);
    if (!reservation || reservation.state !== 'active') return false;

    const total = this.checkedTotal(
      this.available(reservation.sku),
      reservation.quantity,
    );

    reservation.state = 'released';
    this.counts.set(reservation.sku, total);
    this.ledger.record({
      sku: reservation.sku,
      delta: reservation.quantity,
      reason: 'released',
    });
    return true;
  }

  releaseCommitted(id: string): boolean {
    const reservation = this.held.get(id);
    if (!reservation || reservation.state !== 'committed') return false;

    const total = this.checkedTotal(
      this.available(reservation.sku),
      reservation.quantity,
    );

    reservation.state = 'released';
    this.counts.set(reservation.sku, total);
    this.ledger.record({
      sku: reservation.sku,
      delta: reservation.quantity,
      reason: 'released',
    });
    return true;
  }

  expire(now: number): Reservation[] {
    const expired: Reservation[] = [];
    for (const reservation of this.held.values()) {
      if (reservation.state === 'active' && reservation.expiresAt <= now) {
        this.release(reservation.id);
        expired.push(reservation);
      }
    }
    return expired;
  }

  reservations(): Reservation[] {
    return [...this.held.values()].map((reservation) => ({ ...reservation }));
  }

  queryReservations(query: ReservationQuery = {}): Reservation[] {
    validateReservationQuery(query);
    const rows = this.reservations();

    for (const reservation of rows) {
      if (!Number.isFinite(reservation.expiresAt)) {
        throw new Error('invalid reservation expiry');
      }
    }

    return rows
      .filter((reservation) => matchesReservation(reservation, query))
      .sort(compareReservations);
  }
}
