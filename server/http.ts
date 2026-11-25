import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { clientIp } from './client-ip';
import { api, configured, db } from './runtime';
import { MAX_CLOUD_BYTES } from '../src/core/state/cloudProtocol';

const origin = process.env.NQ_ORIGIN ?? 'http://127.0.0.1:4175';
const port = Number(process.env.PORT ?? 8787);
async function handleApi(req: IncomingMessage, res: ServerResponse) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers))
    if (value) headers.set(key, Array.isArray(value) ? value.join(',') : value);
  // This server terminates the request boundary; forwarded IP headers are never accepted from clients.
  const ip = clientIp(
    req.socket.remoteAddress,
    headers.get('x-forwarded-for'),
    process.env.NQ_TRUSTED_PROXY_IP,
  );
  headers.delete('x-forwarded-for');
  headers.delete('x-real-ip');
  headers.set('x-forwarded-for', ip);
  let body: Buffer | undefined;
  if (!['GET', 'HEAD'].includes(req.method ?? 'GET')) {
    const chunks: Buffer[] = [];
    let bytes = 0;
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > MAX_CLOUD_BYTES) {
        res.writeHead(413);
        res.end();
        return;
      }
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks);
  }
  const request = new Request(new URL(req.url ?? '/', origin), {
    method: req.method,
    headers,
    ...(body ? { body: new Uint8Array(body).buffer } : {}),
  });
  const result = await api(request);
  res.statusCode = result.status;
  result.headers.forEach((value, key) => {
    if (key !== 'set-cookie') res.setHeader(key, value);
  });
  const cookies = result.headers.getSetCookie();
  if (cookies.length) res.setHeader('set-cookie', cookies);
  res.end(Buffer.from(await result.arrayBuffer()));
}
const staticRoot = resolve('dist');
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.tmj': 'application/json',
  '.tsj': 'application/json',
};
async function staticFile(req: IncomingMessage, res: ServerResponse) {
  if (!['GET', 'HEAD'].includes(req.method ?? '')) {
    res.writeHead(405);
    res.end();
    return;
  }
  const path = decodeURIComponent(new URL(req.url ?? '/', origin).pathname);
  const file = await realpath(resolve(staticRoot, `.${path === '/' ? '/index.html' : path}`));
  if (!file.startsWith(staticRoot + sep) || !(await stat(file)).isFile()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-cache');
  if (req.method === 'HEAD') res.end();
  else createReadStream(file).pipe(res);
}
const server = createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  if (origin.startsWith('https:')) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
  );
  try {
    if ((req.url ?? '').startsWith('/api/')) await handleApi(req, res);
    else await staticFile(req, res);
  } catch {
    if (!res.headersSent) res.writeHead(503);
    res.end();
  }
});
server.requestTimeout = 15_000;
server.headersTimeout = 10_000;
server.listen(port, process.env.HOST ?? '127.0.0.1', () =>
  console.info(
    `NIHON QUEST server listening on port ${port}; auth ${configured ? 'configured' : 'unconfigured'}`,
  ),
);
for (const signal of ['SIGTERM', 'SIGINT'] as const)
  process.on(signal, () => {
    server.close();
    void db?.end();
  });
