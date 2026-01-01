import { CheckoutService, PlaceOrderInput } from '../../../packages/checkout/src';
import { Principal, requirePrincipal } from './auth';

export class CheckoutHandler {
  constructor(private readonly checkout: CheckoutService) {}

  handle(principal: Principal | undefined, input: Omit<PlaceOrderInput, 'tenantId'>) {
    const actor = requirePrincipal(principal);
    return this.checkout.place({ ...input, tenantId: actor.tenantId });
  }
}
