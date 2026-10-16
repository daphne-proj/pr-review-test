import { DeliveryWorker } from '../../../packages/fulfillment/src';

export class DeliveryRunner {
  constructor(private readonly worker: DeliveryWorker) {}

  run(tenantId: string, send: Parameters<DeliveryWorker['deliverNext']>[1]): string | undefined {
    return this.worker.deliverNext(tenantId, send);
  }
}
