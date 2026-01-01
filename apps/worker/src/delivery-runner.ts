import { DeliveryWorker } from '../../../packages/fulfillment/src';

export class DeliveryRunner {
  constructor(private readonly worker: DeliveryWorker) {}

  run(send: Parameters<DeliveryWorker['deliverNext']>[0]): string | undefined {
    return this.worker.deliverNext(send);
  }
}
