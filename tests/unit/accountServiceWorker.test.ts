import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it, vi } from 'vitest';
it('never intercepts account/session requests, including OAuth navigation and offline reads', () => {
  const handlers = new Map<string, (event: unknown) => void>();
  const fetch = vi.fn(async () => ({ ok: false }));
  runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    URL,
    Response,
    fetch,
    self: {
      registration: { scope: 'https://game.example/' },
      location: { origin: 'https://game.example' },
      addEventListener: (name: string, handler: (event: unknown) => void) => handlers.set(name, handler),
    },
  });
  for (const path of [
    '/api/account/session',
    '/api/account/slots',
    '/api/auth/callback/google?code=private',
  ]) {
    const respondWith = vi.fn();
    handlers.get('fetch')!({
      request: {
        url: `https://game.example${path}`,
        method: 'GET',
        mode: 'navigate',
        headers: new Headers(),
      },
      respondWith,
    });
    expect(respondWith).not.toHaveBeenCalled();
  }
  expect(fetch).not.toHaveBeenCalled();
});
