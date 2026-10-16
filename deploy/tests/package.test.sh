#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"

node <<'NODE'
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const repo = process.cwd();
const run = (command, args, cwd = repo) => execFileSync(command, args, { cwd, encoding: 'utf8', stdio: 'pipe' });

test('release contains fresh dependency-free modules and a resolvable documentation symlink', t => {
  const extracted = fs.mkdtempSync(path.join(os.tmpdir(), 'commerce-extracted-'));
  t.after(() => fs.rmSync(extracted, { recursive: true, force: true }));
  fs.mkdirSync('dist', { recursive: true });
  fs.writeFileSync('dist/stale.txt', 'must not ship');
  run('npm', ['run', 'package:deployment']);
  const archive = path.resolve('releases/commerce.tar.gz');
  const entries = run('tar', ['-tzf', archive]).trim().split('\n');
  assert.ok(entries.every(entry => entry.startsWith('dist/') || entry === 'docs/deployment.md' || entry === 'deploy/README.md'));
  assert.ok(!entries.includes('dist/stale.txt'));
  run('tar', ['-xzf', archive, '-C', extracted]);
  assert.equal(fs.existsSync(path.join(extracted, 'node_modules')), false);
  assert.deepEqual(require(path.join(extracted, 'dist/apps/api/src')).health(), { status: 'ok' });
  const worker = require(path.join(extracted, 'dist/apps/worker/src'));
  assert.equal(typeof worker.DeliveryRunner, 'function');
  assert.equal(typeof worker.ExpiryWorker, 'function');
  const link = path.join(extracted, 'deploy/README.md');
  assert.ok(fs.lstatSync(link).isSymbolicLink());
  assert.equal(fs.realpathSync(link), fs.realpathSync(path.join(extracted, 'docs/deployment.md')));
});

test('packaging handles spaces and alternate cwd, preserving the last release on failures', t => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'commerce-package-'));
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  const copy = path.join(scratch, 'workspace with spaces');
  fs.cpSync(repo, copy, {
    recursive: true,
    verbatimSymlinks: true,
    filter: source => !['.git', '.superpowers', 'node_modules', 'dist', 'releases'].includes(path.relative(repo, source).split(path.sep)[0]),
  });
  fs.symlinkSync(path.join(repo, 'node_modules'), path.join(copy, 'node_modules'), 'dir');
  const script = path.join(copy, 'deploy/package.sh');
  run(script, [], scratch);
  const archive = path.join(copy, 'releases/commerce.tar.gz');
  const previous = fs.readFileSync(archive);
  const invalidSource = path.join(copy, 'apps/api/src/invalid-build-fixture.ts');
  fs.writeFileSync(invalidSource, 'const broken: string = 123;\n');
  assert.throws(() => run(script, [], scratch), error => error.status !== 0 && error.stdout.includes('invalid-build-fixture.ts'));
  assert.deepEqual(fs.readFileSync(archive), previous);
  fs.unlinkSync(invalidSource);
  fs.unlinkSync(path.join(copy, 'docs/deployment.md'));
  assert.throws(() => run(script, [], scratch), error => error.status !== 0 && error.stderr.includes('docs/deployment.md'));
  assert.deepEqual(fs.readFileSync(archive), previous);
  assert.deepEqual(fs.readdirSync(path.join(copy, 'releases')), ['commerce.tar.gz']);
});
NODE
