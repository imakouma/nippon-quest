import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = resolve('scripts/import-google-oauth.mjs');
const paths: string[] = [];
const secret = 'fixture-secret-not-real-123456789';
const original =
  'NQ_ORIGIN=http://127.0.0.1:4177\nBETTER_AUTH_SECRET=keep-me\nGOOGLE_CLIENT_ID=\nGOOGLE_CLIENT_SECRET=\n';
function setup(overrides = {}) {
  const cwd = mkdtempSync(join(tmpdir(), 'nq-oauth-import-'));
  paths.push(cwd);
  const web = {
    client_id: '123-fixture.apps.googleusercontent.com',
    client_secret: secret,
    redirect_uris: ['http://127.0.0.1:4177/api/auth/callback/google'],
    ...overrides,
  };
  writeFileSync(join(cwd, '.env'), original);
  writeFileSync(join(cwd, 'google.json'), JSON.stringify({ web }));
  return {
    cwd,
    run: () => spawnSync(process.execPath, [script, 'google.json'], { cwd, encoding: 'utf8' }),
    env: () => readFileSync(join(cwd, '.env'), 'utf8'),
  };
}
afterEach(() => {
  for (const path of paths.splice(0)) rmSync(path, { recursive: true, force: true });
});
test('imports privately and preserves unrelated settings and repeatability', () => {
  const f = setup();
  const result = f.run();
  expect(result.status).toBe(0);
  expect(result.stdout + result.stderr).not.toContain(secret);
  expect(f.env()).toContain('BETTER_AUTH_SECRET=keep-me');
  expect(f.env()).toContain(`GOOGLE_CLIENT_SECRET=${secret}`);
  expect(statSync(join(f.cwd, '.env')).mode & 0o777).toBe(0o600);
  const once = f.env();
  expect(f.run().status).toBe(0);
  expect(f.env()).toBe(once);
});
test('rejects mismatched callback without modifying the environment', () => {
  const f = setup({ redirect_uris: ['https://other.example/api/auth/callback/google'] });
  expect(f.run().status).toBe(1);
  expect(f.env()).toBe(original);
});
test('does not replace existing credentials', () => {
  const f = setup();
  const existing = original.replace('GOOGLE_CLIENT_SECRET=', 'GOOGLE_CLIENT_SECRET=existing');
  writeFileSync(join(f.cwd, '.env'), existing);
  expect(f.run().status).toBe(1);
  expect(f.env()).toBe(existing);
});
test('rejects malformed JSON without echoing its content', () => {
  const f = setup();
  writeFileSync(join(f.cwd, 'google.json'), secret);
  const result = f.run();
  expect(result.status).toBe(1);
  expect(result.stdout + result.stderr).not.toContain(secret);
  expect(f.env()).toBe(original);
});
test('requires callback array, not a substring match', () => {
  const f = setup({
    redirect_uris: 'https://evil.example/?next=http://127.0.0.1:4177/api/auth/callback/google',
  });
  expect(f.run().status).toBe(1);
  expect(f.env()).toBe(original);
});
