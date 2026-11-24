import {
  cloudWriteSchema,
  MAX_CLOUD_BYTES,
  type CloudSlot,
  type CloudWrite,
} from '../src/core/state/cloudProtocol';
import type { SlotId } from '../src/core/state/slots';

export interface SaveRepository {
  list(owner: string): Promise<CloudSlot[]>;
  write(owner: string, slot: SlotId, value: CloudWrite): Promise<CloudSlot | null>;
  allow(owner: string): Promise<boolean>;
  deleteAccount(owner: string): Promise<void>;
}
export interface AccountSession {
  userId: string;
  createdAt: Date;
}
export function json(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
  });
}
export function createAccountApi(options: {
  origin: string;
  providers: string[];
  repository: SaveRepository;
  session(request: Request): Promise<AccountSession | null>;
}) {
  return async (request: Request): Promise<Response> => {
    try {
      const path = new URL(request.url).pathname;
      if (request.method !== 'GET' && request.headers.get('origin') !== options.origin)
        return json({ error: 'origin' }, 403);
      const session = await options.session(request);
      if (path === '/api/account/session' && request.method === 'GET')
        return json({ userId: session?.userId ?? null, providers: options.providers });
      if (!session || request.headers.get('x-nq-owner') !== session.userId)
        return json({ error: 'session' }, 401);
      const owner = session.userId;
      if (!(await options.repository.allow(owner))) return json({ error: 'rate_limit' }, 429);
      if (path === '/api/account/slots' && request.method === 'GET')
        return json(await options.repository.list(owner));
      if (path === '/api/account/delete' && request.method === 'POST') {
        if (Date.now() - session.createdAt.getTime() > 5 * 60_000)
          return json({ error: 'reauthenticate' }, 403);
        await options.repository.deleteAccount(owner);
        return json({ ok: true });
      }
      const match = /^\/api\/account\/slots\/([123])$/.exec(path);
      if (!match || request.method !== 'PUT') return json({ error: 'not_found' }, 404);
      if (!request.headers.get('content-type')?.startsWith('application/json'))
        return json({ error: 'content_type' }, 415);
      const body = await request.text();
      if (new TextEncoder().encode(body).byteLength > MAX_CLOUD_BYTES) return json({ error: 'size' }, 413);
      let input: unknown;
      try {
        input = JSON.parse(body);
      } catch {
        return json({ error: 'json' }, 422);
      }
      const parsed = cloudWriteSchema.safeParse(input);
      if (!parsed.success) return json({ error: 'invalid_save' }, 422);
      const result = await options.repository.write(owner, Number(match[1]) as SlotId, parsed.data);
      return result ? json(result) : json({ error: 'conflict' }, 409);
    } catch {
      // Never return database details, OAuth tokens or saved player data in errors.
      return json({ error: 'unavailable' }, 503);
    }
  };
}
