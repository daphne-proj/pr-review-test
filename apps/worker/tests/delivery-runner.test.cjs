const test = require('node:test');
const assert = require('node:assert/strict');
const { DeliveryRunner } = require('../../../dist/apps/worker/src');
const { Outbox, DeliveryLog, DeliveryAuditLog, DeliveryWorker } = require('../../../dist/packages/fulfillment/src');

test('runner forwards the tenant so delivery and audit remain scoped', () => {
  assert.equal(typeof DeliveryAuditLog, 'function', 'independent audit log is exported');
  const outbox = new Outbox();
  const audit = new DeliveryAuditLog();
  const runner = new DeliveryRunner(new DeliveryWorker(outbox, new DeliveryLog(), audit));
  for (const tenantId of ['beta', 'acme']) outbox.append({ tenantId, id: 'shared', type: 'order.placed', payload: {} });
  assert.equal(runner.run('other', () => assert.fail('wrong tenant')), undefined);
  assert.throws(() => runner.run('', () => assert.fail('invalid scope')), /invalid tenant/);
  const sent = [];
  assert.equal(runner.run('acme', e => { sent.push(e.tenantId); return 'sent'; }), 'sent');
  assert.deepEqual(sent, ['acme']);
  assert.deepEqual(outbox.pending().map(e => e.tenantId), ['beta']);
  assert.equal(audit.forTenant('acme').length, 1);
  assert.deepEqual(audit.forTenant('beta'), []);
});
