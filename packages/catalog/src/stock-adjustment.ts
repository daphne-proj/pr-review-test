import { Sku } from '../../core/src';

export type StockAdjustmentReason = 'correction' | 'damage' | 'return';

export interface StockAdjustment {
  id: string;
  sku: Sku;
  delta: number;
  reason: StockAdjustmentReason;
}

export interface StockAdjustmentReceipt extends StockAdjustment {
  before: number;
  after: number;
}

export function validateStockAdjustment(input: StockAdjustment): void {
  if (input.id.trim().length === 0 || input.sku.trim().length === 0) {
    throw new Error('adjustment ID and SKU are required');
  }

  if (!Number.isSafeInteger(input.delta) || input.delta === 0) {
    throw new Error('invalid adjustment quantity');
  }

  if (
    input.reason !== 'correction' &&
    input.reason !== 'damage' &&
    input.reason !== 'return'
  ) {
    throw new Error('invalid adjustment reason');
  }

  if (input.reason === 'damage' && input.delta > 0) {
    throw new Error('damage must remove stock');
  }

  if (input.reason === 'return' && input.delta < 0) {
    throw new Error('return must add stock');
  }
}
