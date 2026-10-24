import { Sku } from '../../core/src';
import {
  StockAdjustmentReason,
  StockAdjustmentReceipt,
} from './stock-adjustment';

interface StockMovementEntry {
  sku: Sku;
  delta: number;
  reason: 'stocked' | 'reserved' | 'released';
}

export interface StockAdjustmentEntry extends Omit<
  StockAdjustmentReceipt,
  'reason'
> {
  reason: 'adjusted';
  adjustmentReason: StockAdjustmentReason;
}

export type StockEntry = StockMovementEntry | StockAdjustmentEntry;

export class StockLedger {
  private readonly entries: StockEntry[] = [];
  private readonly adjustmentIds = new Set<string>();

  record(entry: StockEntry): void {
    this.recordMany([entry]);
  }

  recordMany(entries: readonly StockEntry[]): void {
    const pendingIds = new Set<string>();
    const copies = entries.map((entry) => ({ ...entry }));

    for (const entry of copies) {
      if (entry.reason !== 'adjusted') {
        continue;
      }

      if (this.adjustmentIds.has(entry.id) || pendingIds.has(entry.id)) {
        throw new Error('adjustment ID already used');
      }

      pendingIds.add(entry.id);
    }

    for (const entry of copies) {
      this.entries.push(entry);
    }

    for (const id of pendingIds) {
      this.adjustmentIds.add(id);
    }
  }

  all(): StockEntry[] {
    return this.entries.map((entry) => ({ ...entry }));
  }

  adjustments(): StockAdjustmentReceipt[] {
    const receipts: StockAdjustmentReceipt[] = [];

    for (const entry of this.entries) {
      if (entry.reason !== 'adjusted') {
        continue;
      }

      receipts.push({
        id: entry.id,
        sku: entry.sku,
        delta: entry.delta,
        reason: entry.adjustmentReason,
        before: entry.before,
        after: entry.after,
      });
    }

    return receipts;
  }
}
