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

## Background order cancellation

Operators can submit between 1 and 20 distinct orders for background cancellation.
The API derives the tenant and requesting user from the authenticated principal,
checks every selected order belongs to that tenant, and returns a batch ID without
performing refunds. Submission captures the selected order IDs so callers can
reuse their request objects after it returns.

`createCommerceSystem` exposes `cancellationBatches`. Pass it to
`CancellationBatchHandler` for submission and tenant-scoped progress queries, and
to `CancellationBatchRunner` with a stable worker owner for execution. The host
scheduler invokes `run(batchId)` separately from the request; this workspace does
not start a server or background timer.

Status includes the submission time, operator, selected orders, queue state,
cancelled and skipped orders, and the most recent item failure. Responses are
detached snapshots. Already-cancelled orders are skipped without another refund.
Completion means all selected orders were processed; a failed item should leave
unfinished work eligible for another execution after its lease expires. Bulk
cancellation is intended to preserve the refund and stock-restoration behavior of
the existing single-order operation, which remains available.

Batch processing is sequential and can make partial progress. It is not an
all-or-nothing transaction. The queue and progress are in memory, and the fixture
does not promise restart durability, distributed coordination, or exactly-once
external effects. Use the same commerce instance for the API and worker.
