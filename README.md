# Commerce operations PR review repository

This deterministic TypeScript workspace models checkout, inventory reservations,
payments, cancellation, outbox delivery, job leases, and reservation expiry. It
uses in-memory state and injected clocks and IDs so pull-request analysis is
stable.

```sh
npm ci
npm run build
npm test
```

The repository is intentionally outside Daphne's tracked source. Its local Git
history supplies exact BASE and HEAD commits and can later be published for a
real pull-request run. Scenario tooling and answer keys live in the sibling
`commerce-fixture/` directory so Daphne cannot see them in analyzed source.

The model exercises explicit interleavings only. It does not claim database
transaction isolation or distributed delivery guarantees.

## Tenant boundaries and delivery audits

Orders are identified by `(tenantId, orderId)`. Outbox events and delivery
bookkeeping use `(tenantId, eventId)`, so tenants can reuse local IDs without
overwriting or suppressing each other's records. Tenant identifiers must be
nonblank strings and are compared exactly. Checkout validates the tenant before
reserving stock or charging a payment. API handlers take the tenant from the
authenticated principal, including when a request contains a forged tenant field.

Every `DomainEvent` now requires `tenantId`. Delivery callers must migrate to:

```ts
const worker = new DeliveryWorker(outbox, deliveries, audit);
worker.deliverNext(tenantId, send);
runner.run(tenantId, send);
outbox.markDelivered(tenantId, eventId);
deliveries.has(tenantId, eventId);
```

Pass a `DeliveryAuditLog` as `audit` and include `tenantId` in delivery records.
`pendingEventsForTenant(outbox, tenantId)` selects only that tenant's events.
The existing global `pending()`, order `all()`, and delivery `all()` methods are
internal diagnostics; they are not tenant-authorized endpoints. Worker and audit
callers must obtain tenant context from a trusted source.

`DeliveryAuditLog.forTenant(tenantId)` returns copies of that tenant's successful
delivery observations. Audit storage is independent of delivery deduplication:
recording the same observation twice retains both entries. The worker appends an
audit only after `send` returns and delivery bookkeeping completes. A thrown send
leaves the event pending and creates neither a success audit nor a delivery entry.
Audit records are in memory and are lost on restart; the worker is synchronous
and does not provide atomic, concurrent, or exactly-once delivery guarantees.
