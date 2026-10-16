const test = require('node:test');
const assert = require('node:assert/strict');
const { Outbox, DeliveryLog, DeliveryAuditLog, DeliveryWorker, pendingEventsForTenant } = require('../../../dist/packages/fulfillment/src');
const { createCommerceSystem, sequenceIds } = require('../../../dist/packages/checkout/src');

const event = (tenantId, id = 'shared') => ({ tenantId, id, type: 'order.placed', payload: { orderId: 'order' } });
function setup() {
  assert.equal(typeof DeliveryAuditLog, 'function', 'independent audit log is exported');
  const outbox = new Outbox();
  const deliveries = new DeliveryLog();
  const audit = new DeliveryAuditLog();
  return { outbox, deliveries, audit, worker: new DeliveryWorker(outbox, deliveries, audit) };
}

test('checkout tags its event with the order tenant', () => {
  const system = createCommerceSystem({ now: () => 1000, ids: sequenceIds('events') });
  system.inventory.stock('widget', 1);
  const result = system.checkout.place({ tenantId: 'acme', customerId: 'customer', sku: 'widget', quantity: 1, unitPriceCents: 6000, promotionBps: 0 });
  assert.equal(result.ok, true);
  assert.equal(system.outbox.pending()[0].tenantId, 'acme');
  assert.deepEqual(system.outbox.pending()[0].payload, { orderId: result.orderId });
});

test('outbox deduplicates only the same tenant and event ID', () => {
  const outbox = new Outbox();
  outbox.append(event('acme'));
  outbox.append(event('beta'));
  outbox.append(event('acme'));
  assert.deepEqual(outbox.pending().map(e => e.tenantId), ['acme', 'beta']);
});

test('marking one tenant delivered leaves the same event ID pending for another', () => {
  const outbox = new Outbox();
  outbox.append(event('acme'));
  outbox.append(event('beta'));
  outbox.markDelivered('acme', 'shared');
  assert.deepEqual(outbox.pending().map(e => e.tenantId), ['beta']);
  assert.throws(() => outbox.markDelivered('other', 'shared'), /outbox event not found/);
  assert.deepEqual(outbox.pending().map(e => e.tenantId), ['beta']);
});

test('delivery identity preserves delimiter-containing and exact tenant strings', () => {
  const outbox = new Outbox();
  const deliveries = new DeliveryLog();
  const pairs = [['a:b', 'c'], ['a', 'b:c'], [' acme ', 'shared'], ['acme', 'shared']];
  for (const [tenantId, id] of pairs) {
    outbox.append(event(tenantId, id));
    deliveries.record({ tenantId, eventId: id, result: 'sent' });
  }
  assert.equal(outbox.pending().length, 4);
  assert.equal(deliveries.all().length, 4);
  for (const [tenantId, id] of pairs) assert.equal(deliveries.has(tenantId, id), true);
  outbox.markDelivered('a:b', 'c');
  assert.deepEqual(outbox.pending().map(e => [e.tenantId, e.id]), [['a', 'b:c'], [' acme ', 'shared'], ['acme', 'shared']]);
});

test('worker sends and audits only its tenant even when another tenant is first', () => {
  const { outbox, deliveries, audit, worker } = setup();
  outbox.append(event('beta'));
  outbox.append(event('acme'));
  const sent = [];
  const send = e => { sent.push(e.tenantId); return 'sent'; };
  assert.equal(worker.deliverNext('acme', send), 'sent');
  assert.deepEqual(sent, ['acme']);
  assert.deepEqual(outbox.pending().map(e => e.tenantId), ['beta']);
  assert.equal(deliveries.has('acme', 'shared'), true);
  assert.equal(deliveries.has('beta', 'shared'), false);
  assert.deepEqual(audit.forTenant('acme'), [{ tenantId: 'acme', eventId: 'shared', result: 'sent' }]);
  assert.deepEqual(audit.forTenant('beta'), []);
  assert.equal(worker.deliverNext('acme', send), undefined);
  assert.deepEqual(sent, ['acme']);
  assert.equal(audit.forTenant('acme').length, 1);
  assert.equal(worker.deliverNext('beta', send), 'sent');
  assert.deepEqual(sent, ['acme', 'beta']);
  assert.equal(deliveries.has('beta', 'shared'), true);
  assert.deepEqual(audit.forTenant('beta'), [{ tenantId: 'beta', eventId: 'shared', result: 'sent' }]);
  assert.deepEqual(outbox.pending(), []);
});

test('existing delivery bookkeeping skips a send without adding an audit', () => {
  const { outbox, deliveries, audit, worker } = setup();
  outbox.append(event('acme'));
  deliveries.record({ tenantId: 'acme', eventId: 'shared', result: 'sent' });
  assert.equal(worker.deliverNext('acme', () => assert.fail('already delivered')), undefined);
  assert.deepEqual(audit.forTenant('acme'), []);
});

test('failed sends stay pending and a later successful retry is audited once', () => {
  const { outbox, deliveries, audit, worker } = setup();
  outbox.append(event('acme'));
  assert.throws(() => worker.deliverNext('acme', () => { throw new Error('send failed'); }), /send failed/);
  assert.equal(outbox.pending().length, 1);
  assert.deepEqual(deliveries.all(), []);
  assert.deepEqual(audit.forTenant('acme'), []);
  assert.equal(worker.deliverNext('acme', () => 'retried'), 'retried');
  assert.deepEqual(outbox.pending(), []);
  assert.deepEqual(deliveries.all(), [{ tenantId: 'acme', eventId: 'shared', result: 'retried' }]);
  assert.deepEqual(audit.forTenant('acme'), [{ tenantId: 'acme', eventId: 'shared', result: 'retried' }]);
});

test('audit preserves independent observations while delivery bookkeeping deduplicates', () => {
  const { deliveries, audit } = setup();
  const entry = { tenantId: 'acme', eventId: 'shared', result: 'sent' };
  deliveries.record(entry);
  deliveries.record(entry);
  audit.record(entry);
  audit.record(entry);
  audit.record({ ...entry, tenantId: 'beta' });
  assert.equal(deliveries.all().length, 1);
  assert.equal(audit.forTenant('acme').length, 2);
  assert.equal(audit.forTenant('beta').length, 1);
  assert.deepEqual(audit.forTenant('other'), []);
});

test('audit input and output mutations cannot rewrite stored tenant history', () => {
  const { audit } = setup();
  const entry = { tenantId: 'acme', eventId: 'shared', result: 'sent' };
  audit.record(entry);
  entry.tenantId = 'beta';
  entry.result = 'changed';
  const entries = audit.forTenant('acme');
  assert.equal(entries.length, 1);
  entries[0].tenantId = 'beta';
  entries[0].result = 'changed';
  entries.push({ tenantId: 'acme', eventId: 'injected', result: 'sent' });
  assert.deepEqual(audit.forTenant('acme'), [{ tenantId: 'acme', eventId: 'shared', result: 'sent' }]);
  assert.deepEqual(audit.forTenant('beta'), []);
});

for (const tenantId of [undefined, null, '', '  ', 123]) {
  test(`outbox rejects invalid tenant ${JSON.stringify(tenantId)} without mutation`, () => {
    const outbox = new Outbox();
    outbox.append(event('acme'));
    assert.throws(() => outbox.append(event(tenantId)), /invalid tenant/);
    assert.throws(() => outbox.markDelivered(tenantId, 'shared'), /invalid tenant/);
    assert.equal(typeof pendingEventsForTenant, 'function');
    assert.throws(() => pendingEventsForTenant(outbox, tenantId), /invalid tenant/);
    assert.deepEqual(pendingEventsForTenant(outbox, 'acme').map(e => e.id), ['shared']);
    assert.deepEqual(pendingEventsForTenant(outbox, 'beta'), []);
  });

  test(`delivery and audit reject invalid tenant ${JSON.stringify(tenantId)} without side effects`, () => {
    const { outbox, deliveries, audit, worker } = setup();
    outbox.append(event('acme'));
    assert.throws(() => deliveries.record({ tenantId, eventId: 'shared', result: 'sent' }), /invalid tenant/);
    assert.throws(() => deliveries.has(tenantId, 'shared'), /invalid tenant/);
    assert.throws(() => audit.record({ tenantId, eventId: 'shared', result: 'sent' }), /invalid tenant/);
    assert.throws(() => audit.forTenant(tenantId), /invalid tenant/);
    assert.throws(() => worker.deliverNext(tenantId, () => assert.fail('invalid scope must not send')), /invalid tenant/);
    assert.equal(outbox.pending().length, 1);
    assert.deepEqual(deliveries.all(), []);
    assert.deepEqual(audit.forTenant('acme'), []);
  });
}
