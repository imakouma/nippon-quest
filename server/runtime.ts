import { Pool } from 'pg';
import { createAuth } from './auth';
import { createAccountApi, json } from './account-api';
import { saveRepository } from './save-repository';

const origin = process.env.NQ_ORIGIN ?? 'http://127.0.0.1:4175';
export const configured = Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET);
export const db = configured
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 5000,
      statement_timeout: 10_000,
    })
  : null;
const auth = db ? createAuth(db, { ...process.env, NQ_ORIGIN: origin }) : null;
const providers = ['google'].filter(
  (provider) =>
    process.env[`${provider.toUpperCase()}_CLIENT_ID`] &&
    process.env[`${provider.toUpperCase()}_CLIENT_SECRET`],
);
const accountApi =
  db && auth
    ? createAccountApi({
        origin,
        providers,
        repository: saveRepository(db),
        session: async (request) => {
          const session = await auth.api.getSession({ headers: request.headers });
          return session ? { userId: session.user.id, createdAt: new Date(session.session.createdAt) } : null;
        },
      })
    : null;
const allowedAuth = /^\/api\/auth\/(sign-in\/social|sign-out|callback\/google)$/;
export async function api(request: Request): Promise<Response> {
  if (!auth || !accountApi) return json({ error: 'unconfigured' }, 503);
  const path = new URL(request.url).pathname;
  if (path.startsWith('/api/account/')) return accountApi(request);
  if (allowedAuth.test(path)) return auth.handler(request);
  return json({ error: 'not_found' }, 404);
}
