import { Inventory } from '../../catalog/src';
import { Clock, IdSource } from '../../core/src';
import { Outbox } from '../../fulfillment/src';
import { CancellationService } from './cancellation-service';
import { CheckoutService } from './checkout-service';
import { FakePaymentGateway } from './fake-payment';
import { CheckoutAttemptRepository } from './checkout-attempt-repository';
import { IdempotencyRepository } from './idempotency-repository';
import { OrderRepository } from './order-repository';

export function createCommerceSystem(dependencies: { now: () => number; ids: IdSource }) {
  const inventory = new Inventory();
  const payments = new FakePaymentGateway();
  const orders = new OrderRepository();
  const outbox = new Outbox();
  const idempotency = new IdempotencyRepository();
  const attempts = new CheckoutAttemptRepository();
  const clock: Clock = { now: dependencies.now };
  return {
    inventory,
    payments,
    orders,
    outbox,
    idempotency,
    attempts,
    checkout: new CheckoutService(inventory, payments, orders, outbox, clock, dependencies.ids, idempotency, attempts),
    cancellation: new CancellationService(orders, payments, inventory),
  };
}
