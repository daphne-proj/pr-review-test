import { CheckoutService, PlaceOrderInput } from '../../../packages/checkout/src';
import { Principal, requirePrincipal } from './auth';
import { requireIdempotencyKey } from './idempotency-header';

export class CheckoutHandler {
  constructor(private readonly checkout: CheckoutService) {}

  handle(principal: Principal | undefined, input: Omit<PlaceOrderInput, 'tenantId' | 'idempotencyKey'>, headers: Record<string, string | undefined>) {
    const actor = requirePrincipal(principal);
    const idempotencyKey = requireIdempotencyKey(headers);
    return this.checkout.place({ ...input, tenantId: actor.tenantId, idempotencyKey });
  }
}
