import {
  AdjustmentHistoryQuery,
  StockAdjustment,
} from '../../../packages/catalog/src';

function parseAdjustment(value: unknown): StockAdjustment {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('invalid adjustment row');
  }

  if (
    !('id' in value) ||
    typeof value.id !== 'string' ||
    !('sku' in value) ||
    typeof value.sku !== 'string' ||
    !('delta' in value) ||
    typeof value.delta !== 'number' ||
    !('reason' in value) ||
    (value.reason !== 'correction' &&
      value.reason !== 'damage' &&
      value.reason !== 'return')
  ) {
    throw new Error('invalid adjustment fields');
  }

  if (
    Object.keys(value).some(
      (key) => !['id', 'sku', 'delta', 'reason'].includes(key),
    )
  ) {
    throw new Error('unknown adjustment field');
  }

  return {
    id: value.id,
    sku: value.sku,
    delta: value.delta,
    reason: value.reason,
  };
}

export function parseStockAdjustmentRequest(value: unknown): StockAdjustment[] {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    !('adjustments' in value) ||
    !Array.isArray(value.adjustments)
  ) {
    throw new Error('adjustments array is required');
  }

  if (Object.keys(value).some((key) => key !== 'adjustments')) {
    throw new Error('unknown adjustment request field');
  }

  return value.adjustments.map(parseAdjustment);
}

export function parseAdjustmentHistoryQuery(
  value: unknown,
): AdjustmentHistoryQuery {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('invalid adjustment history query');
  }

  if (Object.keys(value).some((key) => key !== 'sku' && key !== 'reason')) {
    throw new Error('unknown adjustment history filter');
  }

  const query: AdjustmentHistoryQuery = {};

  if ('sku' in value) {
    if (typeof value.sku !== 'string' || value.sku.trim().length === 0) {
      throw new Error('invalid adjustment history SKU');
    }

    query.sku = value.sku;
  }

  if ('reason' in value) {
    if (
      value.reason !== 'correction' &&
      value.reason !== 'damage' &&
      value.reason !== 'return'
    ) {
      throw new Error('invalid adjustment history reason');
    }

    query.reason = value.reason;
  }

  return query;
}
