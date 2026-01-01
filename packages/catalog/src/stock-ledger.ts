import { Sku } from '../../core/src';

export interface StockEntry {
  sku: Sku;
  delta: number;
  reason: 'stocked' | 'reserved' | 'released';
}

export class StockLedger {
  private readonly entries: StockEntry[] = [];

  record(entry: StockEntry): void {
    this.entries.push(entry);
  }

  all(): StockEntry[] {
    return [...this.entries];
  }
}
