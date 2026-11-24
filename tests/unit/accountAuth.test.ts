import { describe, expect, it } from 'vitest';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import type { Pool } from 'pg';
import { authOptions, privateProfile } from '../../server/auth';
const env = {
  NQ_ORIGIN: 'http://localhost:8787',
  BETTER_AUTH_SECRET: 'test-secret-with-at-least-thirty-two-characters',
  GOOGLE_CLIENT_ID: 'google-id',
  GOOGLE_CLIENT_SECRET: 'google-secret',
  LINE_CLIENT_ID: 'line-id',
  LINE_CLIENT_SECRET: 'line-secret',
};
describe('OAuth configuration', () => {
  it('uses distinct internal identifiers without requesting email or storing profile data', () => {
    expect(privateProfile('line', 'abc').email).toMatch(/^[a-f0-9]{64}@accounts.invalid$/);
    expect(privateProfile('line', 'abc').email).not.toBe(privateProfile('google', 'abc').email);
    expect(privateProfile('line', 'abc').name).toBe('line');
    expect(privateProfile('line', 'abc').image).toBeUndefined();
    expect(() => privateProfile('line', '')).toThrow();
  });
  it('requires secure production origin and a real session secret', () => {
    expect(() => authOptions({} as Pool, {})).toThrow();
    expect(() => authOptions({} as Pool, { ...env, NQ_ORIGIN: 'http://example.com' })).toThrow();
    expect(authOptions({} as Pool, env).account?.accountLinking?.enabled).toBe(false);
  });
  for (const provider of ['google', 'line'])
    it(`starts ${provider} with state and PKCE, only OpenID scope`, async () => {
      const options = authOptions({} as Pool, env);
      const auth = betterAuth({ ...options, database: memoryAdapter({}), rateLimit: { enabled: false } });
      const response = await auth.handler(
        new Request(`${env.NQ_ORIGIN}/api/auth/sign-in/social`, {
          method: 'POST',
          headers: { origin: env.NQ_ORIGIN, 'content-type': 'application/json' },
          body: JSON.stringify({
            provider,
            callbackURL: `${env.NQ_ORIGIN}/?account=1`,
            disableRedirect: true,
          }),
        }),
      );
      expect(response.status).toBe(200);
      const { url } = await response.json();
      const redirect = new URL(url);
      expect(redirect.searchParams.get('scope')).toBe('openid');
      expect(redirect.searchParams.get('state')).toBeTruthy();
      expect(redirect.searchParams.get('code_challenge')).toBeTruthy();
      expect(redirect.searchParams.get('code_challenge_method')).toBe('S256');
      expect(response.headers.getSetCookie().join(';')).toMatch(/httponly/i);
      const invalid = await auth.handler(
        new Request(`${env.NQ_ORIGIN}/api/auth/callback/${provider}?code=invalid&state=invalid`),
      );
      expect(invalid.headers.get('location')).toContain('error=');
    });
});
