const test = require('node:test');
const assert = require('node:assert/strict');
const { CheckoutHandler, CancelHandler } = require('../../../dist/apps/api/src');
const { createCommerceSystem, sequenceIds } = require('../../../dist/packages/checkout/src');

const input = { customerId: 'customer', sku: 'widget', quantity: 1, unitPriceCents: 6000, promotionBps: 0 };
const principal = { tenantId: 'acme', userId: 'user' };
function setup() {
  const system = createCommerceSystem({ now: () => 1000, ids: sequenceIds('api') });
  system.inventory.stock('widget', 3);
  return { ...system, place: new CheckoutHandler(system.checkout), cancel: new CancelHandler(system.cancellation) };
}

test('checkout binds tenant to the authenticated principal despite forged input', () => {
  const system = setup();
  const result = system.place.handle(principal, { ...input, tenantId: 'beta' });
  assert.equal(result.ok, true);
  assert.equal(system.orders.findForTenant('acme', result.orderId).tenantId, 'acme');
  assert.equal(system.orders.findForTenant('beta', result.orderId), undefined);
  assert.equal(system.payments.attempts()[0].tenantId, 'acme');
});

test('cross-tenant cancellation cannot refund or release an order', () => {
  const system = setup();
  const result = system.place.handle(principal, input);
  assert.throws(() => system.cancel.handle({ ...principal, tenantId: 'beta' }, result.orderId), { code: 'order_not_found' });
  assert.equal(system.orders.findForTenant('acme', result.orderId).state, 'paid');
  assert.deepEqual(system.payments.refunds(), []);
  assert.equal(system.payments.attempts()[0].state, 'captured');
  assert.equal(system.inventory.reservations()[0].state, 'committed');
  assert.equal(system.inventory.available('widget'), 2);
  assert.deepEqual(system.cancel.handle(principal, result.orderId), { cancelled: true });
  assert.equal(system.inventory.available('widget'), 3);
});

test('unauthenticated checkout and cancellation have no side effects', () => {
  const system = setup();
  assert.throws(() => system.place.handle(undefined, input), /unauthorized/);
  assert.deepEqual(system.payments.attempts(), []);
  assert.deepEqual(system.orders.all(), []);
  assert.deepEqual(system.outbox.pending(), []);
  assert.equal(system.inventory.available('widget'), 3);
  const result = system.place.handle(principal, input);
  assert.throws(() => system.cancel.handle(undefined, result.orderId), /unauthorized/);
  assert.deepEqual(system.payments.refunds(), []);
  assert.equal(system.orders.findForTenant('acme', result.orderId).state, 'paid');
  assert.equal(system.inventory.available('widget'), 2);
});
