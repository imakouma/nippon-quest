/* ニホンクエストをホーム画面からブラウザ枠なしで起動可能にする最小のService Worker。 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => event.respondWith(fetch(event.request)));
