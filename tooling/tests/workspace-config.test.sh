#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"

node <<'NODE'
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadConfig(file) {
  const absolute = path.resolve(file);
  const loaded = ts.readConfigFile(absolute, ts.sys.readFile);
  assert.equal(loaded.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(loaded.config, ts.sys, path.dirname(absolute));
  assert.deepEqual(parsed.errors, []);
  return parsed;
}

function checkDefaults(options) {
  assert.equal(options.target, ts.ScriptTarget.ES2022);
  assert.equal(options.module, ts.ModuleKind.CommonJS);
  assert.equal(options.moduleResolution, ts.ModuleResolutionKind.Node10);
  assert.equal(options.strict, true);
  assert.equal(options.declaration, true);
  assert.equal(options.skipLibCheck, true);
}

test('npm resolves the shared config from the tooling workspace', () => {
  assert.equal(fs.realpathSync('node_modules/@daphne-test/tsconfig'), path.resolve('tooling/tsconfig'));
});

for (const workspace of ['apps/api', 'apps/worker', 'packages/catalog', 'packages/checkout', 'packages/core', 'packages/fulfillment']) {
  test(`${workspace} inherits compiler defaults and keeps local source/output paths`, () => {
    const config = loadConfig(`${workspace}/tsconfig.json`);
    checkDefaults(config.options);
    assert.equal(config.options.composite, true);
    assert.equal(config.options.rootDir, path.resolve(workspace, 'src'));
    assert.equal(config.options.outDir, path.resolve(workspace, 'lib'));
    assert.ok(config.fileNames.includes(path.resolve(workspace, 'src/index.ts')));
    assert.ok(config.fileNames.every(file => file.startsWith(path.resolve(workspace, 'src') + path.sep)));
  });
}

test('root build includes every application and package source with existing output layout', () => {
  const config = loadConfig('tsconfig.build.json');
  checkDefaults(config.options);
  assert.equal(!!config.options.composite, false);
  assert.equal(config.options.esModuleInterop, true);
  assert.equal(config.options.rootDir, process.cwd());
  assert.equal(config.options.outDir, path.resolve('dist'));
  const sources = ['apps', 'packages'].flatMap(root => fs.readdirSync(root).flatMap(name => {
    const source = path.join(root, name, 'src');
    if (!fs.existsSync(source)) return [];
    return fs.readdirSync(source).filter(file => file.endsWith('.ts')).map(file => path.resolve(source, file));
  }));
  assert.deepEqual(config.fileNames.sort(), sources.sort());
});
NODE
