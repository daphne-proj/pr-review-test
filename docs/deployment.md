# Deployment module bundle

Use Node 22, npm, a POSIX shell, and tar/gzip on macOS or Linux. From the
repository root:

```sh
npm ci
npm test
npm run package:deployment
```

The shared TypeScript configuration now lives in `tooling/tsconfig`. All apps,
packages, and the root build resolve it as `@daphne-test/tsconfig/base.json`
through the npm workspace link. Run `npm ci` after switching from the old layout.
The root build still emits CommonJS JavaScript and declarations under `dist/`;
source behavior and effective compiler settings are unchanged.

`package:deployment` performs a clean build, then writes
`releases/commerce.tar.gz` containing only compiled `dist/` modules and this
documentation. `deploy/README.md` is a relative symlink to this file; the archive
preserves it. Sources, node_modules, Git metadata, and old build files are excluded.
The executable `deploy/package.sh` also works from another working directory.
A failed build or archive operation exits nonzero and leaves the previous
successful archive intact. Only use the archive after a successful command.

Extract the bundle into an empty directory and smoke-test it:

```sh
mkdir release
tar -xzf releases/commerce.tar.gz -C release
node -e "console.log(require('./release/dist/apps/api/src').health())"
```

The API and worker are reusable modules, not running services. Consumers load
`dist/apps/api/src/index.js` or `dist/apps/worker/src/index.js`; they require no
runtime npm dependencies. This process does not deploy a server or provision
infrastructure. Run one packaging process per checkout because the build output
is shared.

The build workflow runs on pull requests, pushes to main, and manual dispatch.
It installs dependencies, runs config and packaging checks, and uploads the tar
archive as a GitHub Actions artifact with seven-day retention. It has read-only
repository contents permissions and performs no environment deployment.
