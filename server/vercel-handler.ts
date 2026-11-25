import { api } from './runtime';
import { MAX_CLOUD_BYTES } from '../src/core/state/cloudProtocol';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/dispatch') {
      const path = url.searchParams.getAll('nqPath');
      if (path.length !== 1 || !/^(account|auth)\/[a-z0-9/-]+$/.test(path[0] ?? ''))
        return new Response(null, { status: 404 });
      url.pathname = '/api/' + path[0];
    }
    url.searchParams.delete('nqPath');
    const length = Number(request.headers.get('content-length') ?? 0);
    if (!Number.isFinite(length) || length > MAX_CLOUD_BYTES) return new Response(null, { status: 413 });
    try {
      if (request.body) {
        const body = await request.arrayBuffer();
        if (body.byteLength > MAX_CLOUD_BYTES) return new Response(null, { status: 413 });
        request = new Request(url, { method: request.method, headers: request.headers, body });
      } else request = new Request(url, { method: request.method, headers: request.headers });
      return await api(request);
    } catch {
      return new Response(null, { status: 503 });
    }
  },
};
