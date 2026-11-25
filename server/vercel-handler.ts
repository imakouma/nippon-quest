import { api } from './runtime';
import { MAX_CLOUD_BYTES } from '../src/core/state/cloudProtocol';

export default {
  async fetch(request: Request): Promise<Response> {
    const length = Number(request.headers.get('content-length') ?? 0);
    if (!Number.isFinite(length) || length > MAX_CLOUD_BYTES) return new Response(null, { status: 413 });
    try {
      if (request.body) {
        const body = await request.arrayBuffer();
        if (body.byteLength > MAX_CLOUD_BYTES) return new Response(null, { status: 413 });
        request = new Request(request.url, { method: request.method, headers: request.headers, body });
      }
      return await api(request);
    } catch {
      return new Response(null, { status: 503 });
    }
  },
};
