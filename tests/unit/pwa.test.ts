import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('../../', import.meta.url);
const indexHtml = readFileSync(new URL('index.html', root), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('public/manifest.webmanifest', root), 'utf8')) as {
  id?: string;
  start_url: string;
  scope: string;
  icons: Array<{ src: string; sizes: string; type: string; purpose?: string }>;
};
const serviceWorker = readFileSync(new URL('public/sw.js', root), 'utf8');

describe('PWA package', () => {
  it('keeps install URLs relative to the deployment directory', () => {
    expect(manifest.id).toBe('./');
    expect(manifest.start_url).toBe('./');
    expect(manifest.scope).toBe('./');
    expect(manifest.icons.every((icon) => !icon.src.startsWith('/'))).toBe(true);
    expect(indexHtml).toContain('href="%BASE_URL%manifest.webmanifest"');
  });

  it('ships install icons for Android and iOS home screens', () => {
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: '192x192', type: 'image/png' }),
        expect.objectContaining({ sizes: '512x512', type: 'image/png' }),
      ]),
    );
    expect(existsSync(new URL('public/icons/icon-192.png', root))).toBe(true);
    expect(existsSync(new URL('public/icons/icon-512.png', root))).toBe(true);
    expect(existsSync(new URL('public/icons/apple-touch-icon.png', root))).toBe(true);
    expect(indexHtml).toContain('rel="apple-touch-icon"');
  });

  it('caches the app shell and falls back to it for offline navigation', () => {
    expect(serviceWorker).toContain('caches.open(APP_CACHE)');
    expect(serviceWorker).toContain('cache.addAll(APP_SHELL)');
    expect(serviceWorker).toContain("fetch(APP_ROOT, { cache: 'reload' })");
    expect(serviceWorker).toContain('extractShellUrls');
    expect(serviceWorker).toContain('fetchAndCache(request)');
    expect(serviceWorker).toContain("request.mode === 'navigate'");
    expect(serviceWorker).toContain('caches.match(APP_ROOT)');
  });
});
