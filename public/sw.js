const APP_CACHE_PREFIX = 'nihonquest-app-';
const APP_CACHE = `${APP_CACHE_PREFIX}v1`;
const APP_ROOT = new URL('./', self.registration.scope).href;
const APP_SHELL = [
  new URL('manifest.webmanifest', APP_ROOT).href,
  new URL('favicon.svg', APP_ROOT).href,
  new URL('icons/icon-192.png', APP_ROOT).href,
  new URL('icons/icon-512.png', APP_ROOT).href,
  new URL('icons/apple-touch-icon.png', APP_ROOT).href,
];

function extractShellUrls(html) {
  return [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => new URL(match[1], APP_ROOT))
    .filter((url) => url.origin === self.location.origin && url.href.startsWith(APP_ROOT))
    .map((url) => url.href);
}

async function precacheAppShell() {
  const cache = await caches.open(APP_CACHE);
  const appResponse = await fetch(APP_ROOT, { cache: 'reload' });
  if (!appResponse.ok) throw new Error(`App shell request failed: ${appResponse.status}`);

  const html = await appResponse.clone().text();
  await cache.put(APP_ROOT, appResponse);
  await cache.addAll(APP_SHELL);
  await cache.addAll([...new Set(extractShellUrls(html))]);
}

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(APP_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith(APP_CACHE_PREFIX) && name !== APP_CACHE)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('range')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetchAndCache(request).catch(async () => {
        return (await caches.match(request)) ?? (await caches.match(APP_ROOT)) ?? Response.error();
      }),
    );
    return;
  }

  event.respondWith(
    fetchAndCache(request).catch(async () => (await caches.match(request)) ?? Response.error()),
  );
});
