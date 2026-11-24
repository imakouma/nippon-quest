import { z } from 'zod/v3';
import { AccountSaves, type AccountDisk } from './accountSaves';
import { cloudSlotSchema } from './cloudProtocol';
import type { LoginProvider } from '../../shared/account';

const sessionSchema = z.object({
  userId: z.string().min(1).nullable(),
  providers: z.array(z.literal('google')),
});
let active: AccountSaves | null = null;
let available = false;
let blocked = false;
let releaseTab: (() => void) | undefined;
let providers: LoginProvider[] = [];
let initialized: Promise<void> | null = null;
const listeners = new Set<() => void>();
const changed = () => {
  for (const listener of listeners) listener();
};
export const accountSession = () => ({ saves: active, available, providers, blocked });
export function subscribeAccount(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export async function accountRequest(path: string, init?: RequestInit, owner?: string) {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
    headers: {
      'content-type': 'application/json',
      ...(owner ? { 'x-nq-owner': owner } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) throw new Error(`Account request: ${response.status}`);
  return response.json() as Promise<unknown>;
}
export function initializeAccount(disk: AccountDisk): Promise<void> {
  if (initialized) return initialized;
  initialized = (async () => {
    try {
      const session = sessionSchema.parse(await accountRequest('/api/account/session'));
      available = true;
      providers = session.providers;
      if (session.userId) {
        const owner = session.userId;
        const locks = globalThis.navigator?.locks;
        const acquired = locks
          ? await new Promise<boolean>((resolve) => {
              void locks
                .request(`nihonquest-account:${owner}`, { ifAvailable: true }, async (lock) => {
                  if (!lock) {
                    resolve(false);
                    return;
                  }
                  await new Promise<void>((release) => {
                    releaseTab = release;
                    resolve(true);
                  });
                })
                .catch(() => resolve(false));
            })
          : false;
        if (!acquired) {
          blocked = true;
          changed();
          return;
        }
        active = new AccountSaves(
          owner,
          disk,
          {
            list: async () =>
              z.array(cloudSlotSchema).parse(await accountRequest('/api/account/slots', undefined, owner)),
            write: async (slot, value) =>
              cloudSlotSchema.parse(
                await accountRequest(
                  `/api/account/slots/${slot}`,
                  { method: 'PUT', body: JSON.stringify(value) },
                  owner,
                ),
              ),
          },
          changed,
        );
        await active.sync(true);
      }
    } catch {
      available = false;
    }
    changed();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        void active?.sync();
      });
      // Retry pending acknowledgements even when no new game save occurs.
      window.setInterval(() => {
        void active?.sync();
      }, 30_000);
    }
  })();
  return initialized;
}
export async function signIn(provider: LoginProvider): Promise<string> {
  if (!providers.includes(provider)) throw new Error('Provider unavailable');
  const result = z.object({ url: z.string().url() }).parse(
    await accountRequest('/api/auth/sign-in/social', {
      method: 'POST',
      body: JSON.stringify({
        provider,
        callbackURL: `${location.origin}/?account=1`,
        errorCallbackURL: `${location.origin}/?account=1`,
        disableRedirect: true,
      }),
    }),
  );
  const url = new URL(result.url);
  if (url.protocol !== 'https:' || url.hostname !== 'accounts.google.com')
    throw new Error('Unexpected authorization URL');
  return url.href;
}
export async function signOut() {
  await accountRequest('/api/auth/sign-out', { method: 'POST', body: '{}' });
  active?.stop();
  active = null;
  releaseTab?.();
  releaseTab = undefined;
  changed();
}
export async function deleteCloudAccount() {
  if (!active) throw new Error('Not signed in');
  await accountRequest('/api/account/delete', { method: 'POST', body: '{}' }, active.owner);
  await active.clear();
  active = null;
  releaseTab?.();
  releaseTab = undefined;
  changed();
}
