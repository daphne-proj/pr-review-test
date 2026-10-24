import { Inventory } from './inventory';
import {
  StockAdjustment,
  StockAdjustmentReason,
  StockAdjustmentReceipt,
} from './stock-adjustment';

export interface AdjustmentHistoryQuery {
  sku?: string;
  reason?: StockAdjustmentReason;
}

export class StockAdjustmentService {
  constructor(private readonly inventory: Inventory) {}

  apply(adjustments: readonly StockAdjustment[]): StockAdjustmentReceipt[] {
    return this.inventory.applyAdjustments(adjustments);
  }

  history(query: AdjustmentHistoryQuery = {}): StockAdjustmentReceipt[] {
    return this.inventory.ledger.adjustments().filter((receipt) => {
      if (query.sku !== undefined && receipt.sku !== query.sku) {
        return false;
      }

      if (query.reason !== undefined && receipt.reason !== query.reason) {
        return false;
      }

      return true;
    });
  }

  find(id: string): StockAdjustmentReceipt | undefined {
    return this.history().find((receipt) => receipt.id === id);
  }
}
