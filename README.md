# Commerce operations PR review repository

This deterministic TypeScript workspace models checkout, inventory reservations,
payments, cancellation, outbox delivery, job leases, and reservation expiry. It
uses in-memory state and injected clocks and IDs so pull-request analysis is
stable.

```sh
npm ci
npm run build
```

The repository is intentionally outside Daphne's tracked source. Its local Git
history supplies exact BASE and HEAD commits and can later be published for a
real pull-request run. Scenario tooling and answer keys live in the sibling
`commerce-fixture/` directory so Daphne cannot see them in analyzed source.

The model exercises explicit interleavings only. It does not claim database
transaction isolation or distributed delivery guarantees.

Checkout retries are scoped by tenant and idempotency key. Reusing a key with a
different payload is rejected before inventory or payment state changes.

The admin application renders a tenant-scoped order operations dashboard from
the checkout read model. SQL migrations document the persisted order and
idempotency constraints used by the same flow.
