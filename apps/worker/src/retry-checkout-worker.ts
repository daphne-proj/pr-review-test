import { CheckoutService, RetryableCheckoutRequest } from '../../../packages/checkout/src';

export class RetryCheckoutWorker {
  constructor(private readonly checkout: CheckoutService) {}

  run(request: RetryableCheckoutRequest) {
    return this.checkout.place(request);
  }
}
