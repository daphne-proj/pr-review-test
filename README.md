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

## Leased fulfillment jobs

`createCommerceSystem({ now, ids, jobPolicy })` returns `fulfillment`, `jobs`, and
`jobWorker` alongside checkout. After checkout, pass a paid order to
`fulfillment.schedule(order, delayMs)`; the injected ID source supplies its job ID.
Scheduling validates the order identity, paid state, delay, and clock before
allocating an ID. It records the order ID as the delivery payload.

`jobWorker.runNext(owner, send)` claims the first eligible job in insertion order,
awaits the sender, then uses the injected clock again to complete it or record a
failure. `JobRunner` in the worker app processes a bounded batch of up to 100 jobs.
The caller explicitly drives each run; the fixture starts no background timers.

Each claim increments its generation and attempt count. `renew`, `complete`, and
`fail` require the current owner, generation, and a time within the lease, including
for successive claims by the same owner. A renewal must extend the deadline and
does not consume another attempt. Completion and renewal at exact expiry fail;
reacquisition is allowed there. Sender failures and stale transitions are distinct:
a stale worker cannot reschedule the newer worker's attempt.

The default policy permits three attempts, with a 30-second lease and exponential
retry delays starting at one second and capped at one minute. Explicit failures
become pending until the retry deadline; the final failure becomes `exhausted`.
`claimNext` recovers expired leases before selecting work. Expired attempts can be
reacquired immediately, while expired final attempts become exhausted. Terminal
jobs remain inspectable and are never selected again. `list()` and `summary()`
expose detached state and the next pending/lease deadline for caller scheduling.

Payloads support cloneable primitives, records, arrays, Map, Set, Date, RegExp,
ArrayBuffer, and typed views, including cyclic containers. SharedArrayBuffer and
its views are rejected anywhere in those containers, as are opaque native objects.
Enqueue validates before retaining data; claim and inspection isolate nested
payload changes from retained queue state. Lease/retry arithmetic and policy
inputs are validated before transitions. Time is caller supplied in milliseconds
and must be trustworthy. Sending can perform an external effect before its lease
expires, so fencing does not promise exactly-once external delivery. Queue state is
in memory, with no persistence, automatic lease renewal, or cross-process locking.
