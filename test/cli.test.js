import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
test('cli --help exits 0', () => {
  const out = execSync('node bin/cli.js --help', { encoding: 'utf8' });
  assert.match(out, /parity-kit/);
});
test('config defaults', async () => {
  const { DEFAULT_CONFIG } = await import('../src/config.js');
  assert.equal(typeof DEFAULT_CONFIG.threshold, 'number');
  assert.ok(Array.isArray(DEFAULT_CONFIG.viewports));
});
