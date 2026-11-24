import { createHash } from 'node:crypto';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import type { Pool } from 'pg';

// Better Auth requires an email-shaped unique key. This reserved-domain alias is never mailed.
export function privateProfile(provider: 'google', subject: string) {
  if (!subject) throw new Error('Missing provider subject');
  return {
    name: provider,
    image: undefined,
    emailVerified: false,
    email: `${createHash('sha256').update(`${provider}:${subject}`).digest('hex')}@accounts.invalid`,
  };
}
export function authOptions(db: Pool, env: NodeJS.ProcessEnv): BetterAuthOptions {
  const baseURL = env.NQ_ORIGIN;
  const secret = env.BETTER_AUTH_SECRET;
  if (!baseURL || !secret || secret.length < 32)
    throw new Error('NQ_ORIGIN and a 32+ character BETTER_AUTH_SECRET are required');
  const url = new URL(baseURL);
  if (
    url.origin !== baseURL ||
    (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname))
  )
    throw new Error('Use an HTTPS origin (HTTP is local-only)');
  return {
    database: db,
    baseURL,
    secret,
    trustedOrigins: [baseURL],
    emailAndPassword: { enabled: false },
    socialProviders: {
      ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
              disableDefaultScope: true,
              scope: ['openid'],
              prompt: 'select_account',
              mapProfileToUser: (profile) => privateProfile('google', profile.sub),
            },
          }
        : {}),
    },
    session: { expiresIn: 60 * 60 * 24 * 7, freshAge: 300, cookieCache: { enabled: false } },
    account: { accountLinking: { enabled: false, disableImplicitLinking: true }, encryptOAuthTokens: true },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 100,
      customRules: { '/sign-in/social': { window: 900, max: 10 } },
    },
    advanced: {
      useSecureCookies: url.protocol === 'https:',
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax' },
    },
    databaseHooks: {
      account: {
        create: {
          before: async (account) => ({
            data: { ...account, accessToken: null, refreshToken: null, idToken: null },
          }),
        },
        update: {
          before: async (account) => ({
            data: { ...account, accessToken: null, refreshToken: null, idToken: null },
          }),
        },
      },
    },
    logger: { disabled: true },
  };
}
export function createAuth(db: Pool, env: NodeJS.ProcessEnv) {
  return betterAuth(authOptions(db, env));
}
