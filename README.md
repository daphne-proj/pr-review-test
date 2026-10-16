# Commerce operations PR review repository

This deterministic TypeScript workspace models checkout, inventory reservations,
payments, cancellation, outbox delivery, job leases, and reservation expiry. It
uses in-memory state and injected clocks and IDs so pull-request analysis is
stable.

```sh
npm ci
npm run build
npm test
npm run package:deployment
```

The repository is intentionally outside Daphne's tracked source. Its local Git
history supplies exact BASE and HEAD commits and can later be published for a
real pull-request run. Scenario tooling and answer keys live in the sibling
`commerce-fixture/` directory so Daphne cannot see them in analyzed source.

The model exercises explicit interleavings only. It does not claim database
transaction isolation or distributed delivery guarantees.

Shared TypeScript defaults live in the `tooling/tsconfig` workspace. Apps,
packages, and the root build inherit `@daphne-test/tsconfig/base.json`; run
`npm ci` after switching to this layout to refresh workspace links.

The deployment bundle contains compiled modules and documentation. See the
[deployment instructions](docs/deployment.md) for prerequisites, extraction,
artifact checks, and CI behavior. No production TypeScript or runtime behavior
changes as part of this configuration migration.
