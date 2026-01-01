import { CancellationService } from '../../../packages/checkout/src';
import { Principal, requirePrincipal } from './auth';

export class CancelHandler {
  constructor(private readonly cancellation: CancellationService) {}

  handle(principal: Principal | undefined, orderId: string) {
    const actor = requirePrincipal(principal);
    return this.cancellation.cancel({ tenantId: actor.tenantId, orderId });
  }
}
