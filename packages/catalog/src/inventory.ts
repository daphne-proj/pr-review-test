import { Sku } from '../../core/src';
import { Reservation, ReserveInput } from './reservation';
import { StockLedger } from './stock-ledger';

export class Inventory {
  private readonly counts = new Map<Sku, number>();
  private readonly held = new Map<string, Reservation>();
  readonly ledger = new StockLedger();

  stock(sku: Sku, quantity: number): void {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new Error('invalid stock quantity');
    this.counts.set(sku, this.available(sku) + quantity);
    this.ledger.record({ sku, delta: quantity, reason: 'stocked' });
  }

  available(sku: Sku): number {
    return this.counts.get(sku) ?? 0;
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
    reservation.state = 'released';
    this.counts.set(reservation.sku, this.available(reservation.sku) + reservation.quantity);
    this.ledger.record({ sku: reservation.sku, delta: reservation.quantity, reason: 'released' });
    return true;
  }

  releaseCommitted(id: string): boolean {
    const reservation = this.held.get(id);
    if (!reservation || reservation.state !== 'committed') return false;
    reservation.state = 'released';
    this.counts.set(reservation.sku, this.available(reservation.sku) + reservation.quantity);
    this.ledger.record({ sku: reservation.sku, delta: reservation.quantity, reason: 'released' });
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
    return [...this.held.values()];
  }
}
