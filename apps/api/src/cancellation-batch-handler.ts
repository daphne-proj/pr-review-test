import { CancellationBatchService } from '../../../packages/checkout/src';
import { Principal, requirePrincipal } from './auth';

/** Binds submission and progress queries to the authenticated operator's tenant. */
export class CancellationBatchHandler {
  constructor(private readonly batches: CancellationBatchService) {}

  submit(principal: Principal | undefined, input: { orderIds: string[] }) {
    const actor = requirePrincipal(principal);

    return this.batches.submit({
      tenantId: actor.tenantId,
      requestedBy: actor.userId,
      orderIds: input.orderIds,
    });
  }

  status(principal: Principal | undefined, batchId: string) {
    const actor = requirePrincipal(principal);

    return this.batches.status(actor.tenantId, batchId);
  }
}
