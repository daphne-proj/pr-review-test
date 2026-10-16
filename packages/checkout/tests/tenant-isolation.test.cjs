const test = require('node:test');
const assert = require('node:assert/strict');
const { OrderRepository, createCommerceSystem, sequenceIds } = require('../../../dist/packages/checkout/src');

const input = { customerId: 'customer', sku: 'widget', quantity: 1, unitPriceCents: 6000, promotionBps: 0 };
const order = (tenantId, id = 'shared') => ({
  id, tenantId, customerId: 'customer', sku: 'widget', quantity: 1, totalCents: 6000,
  paymentId: `${tenantId}-payment`, reservationId: `${tenantId}-reservation`,
  eventId: `${tenantId}-event`, state: 'paid',
});

test('equal order IDs in different tenants do not overwrite each other', () => {
  const orders = new OrderRepository();
  orders.save(order('acme'));
  orders.save(order('beta'));
  assert.equal(orders.findForTenant('acme', 'shared')?.tenantId, 'acme');
  assert.equal(orders.findForTenant('beta', 'shared')?.tenantId, 'beta');
  assert.equal(orders.all().length, 2);
  assert.equal(orders.findForTenant('other', 'shared'), undefined);
});

test('tenant and order keys preserve delimiters, escaping and whitespace', () => {
  const orders = new OrderRepository();
  const keys = [['a:b', 'c'], ['a', 'b:c'], ['a"', '\\b'], ['a', '"\\b'], [' acme ', 'shared'], ['acme', 'shared']];
  for (const [tenantId, id] of keys) orders.save(order(tenantId, id));
  for (const [tenantId, id] of keys) assert.equal(orders.findForTenant(tenantId, id)?.tenantId, tenantId);
  assert.equal(orders.all().length, keys.length);
});

test('saving the same tenant and order ID updates that order', () => {
  const orders = new OrderRepository();
  orders.save(order('acme'));
  orders.save({ ...order('acme'), state: 'cancelled' });
  assert.equal(orders.findForTenant('acme', 'shared').state, 'cancelled');
  assert.equal(orders.all().length, 1);
});

test('cancelling one of two equal order IDs leaves the other tenant paid and reserved', () => {
  const system = createCommerceSystem({ now: () => 1000, ids: sequenceIds('cancel') });
  system.inventory.stock('widget', 3);
  for (const tenantId of ['acme', 'beta']) {
    const entry = order(tenantId);
    system.payments.charge({ tenantId, paymentId: entry.paymentId, amountCents: 6000 });
    system.inventory.reserve({ id: entry.reservationId, sku: 'widget', quantity: 1, expiresAt: 2000 });
    system.inventory.commit(entry.reservationId);
    system.orders.save(entry);
  }
  assert.deepEqual(system.cancellation.cancel({ tenantId: 'acme', orderId: 'shared' }), { cancelled: true });
  assert.equal(system.orders.findForTenant('acme', 'shared').state, 'cancelled');
  assert.equal(system.orders.findForTenant('beta', 'shared').state, 'paid');
  assert.deepEqual(system.payments.refunds(), [{ paymentId: 'acme-payment', amountCents: 6000 }]);
  assert.deepEqual(system.payments.attempts().map(p => p.state), ['refunded', 'captured']);
  assert.deepEqual(system.inventory.reservations().map(r => r.state), ['released', 'committed']);
  assert.equal(system.inventory.available('widget'), 2);
  assert.deepEqual(system.cancellation.cancel({ tenantId: 'acme', orderId: 'shared' }), { cancelled: false });
  assert.equal(system.payments.refunds().length, 1);
});

for (const tenantId of [undefined, null, '', '  ', 123]) {
  test(`repository rejects invalid tenant ${JSON.stringify(tenantId)} without writes`, () => {
    const orders = new OrderRepository();
    assert.throws(() => orders.save(order(tenantId)), /invalid tenant/);
    assert.throws(() => orders.findForTenant(tenantId, 'shared'), /invalid tenant/);
    assert.deepEqual(orders.all(), []);
  });

  test(`checkout rejects invalid tenant ${JSON.stringify(tenantId)} before side effects`, () => {
    let allocated = 0;
    const system = createCommerceSystem({ now: () => 1000, ids: { next: kind => `${kind}-${++allocated}` } });
    system.inventory.stock('widget', 3);
    assert.throws(() => system.checkout.place({ ...input, tenantId }), /invalid tenant/);
    assert.equal(allocated, 0);
    assert.equal(system.inventory.available('widget'), 3);
    assert.deepEqual(system.inventory.reservations(), []);
    assert.deepEqual(system.payments.attempts(), []);
    assert.deepEqual(system.orders.all(), []);
    assert.deepEqual(system.outbox.pending(), []);
  });
}
