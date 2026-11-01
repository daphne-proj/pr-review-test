import { maximumCancellationBatchSize } from './cancellation-batch';

/** Validates both API selections and the untyped payload returned by JobQueue. */
export function readCancellationOrderIds(value: unknown): string[] {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > maximumCancellationBatchSize ||
    !value.every((id): id is string => typeof id === 'string' && id.trim().length > 0) ||
    new Set(value).size !== value.length
  ) {
    throw new Error(`select between 1 and ${maximumCancellationBatchSize} distinct order IDs`);
  }

  return value;
}

export function readCancellationBatchPayload(value: unknown): { orderIds: string[] } {
  if (typeof value !== 'object' || value === null || !('orderIds' in value)) {
    throw new Error('invalid cancellation batch payload');
  }

  return { orderIds: readCancellationOrderIds(value.orderIds) };
}
