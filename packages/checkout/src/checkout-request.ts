import { PlaceOrderInput } from './checkout-service';

export interface RetryableCheckoutRequest extends PlaceOrderInput {
  idempotencyKey: string;
}

export function requestFingerprint(input: PlaceOrderInput): string {
  return JSON.stringify([
    input.customerId,
    input.sku,
    input.quantity,
    input.unitPriceCents,
    input.promotionBps,
  ]);
}
