import { describe, expect, it, vi } from 'vitest';
import { createAccountApi } from '../../server/account-api';
import { createNewGame } from '../../src/core/state/newGame';

const origin = 'http://localhost:8787';
function setup(userId: string | null = 'alice') {
  const repository = {
    list: vi.fn(async () => []),
    write: vi.fn(async () => null),
    allow: vi.fn(async () => true),
    deleteAccount: vi.fn(async () => {}),
  };
  const api = createAccountApi({
    origin,
    providers: ['google', 'line'],
    repository,
    session: async () => (userId ? { userId, createdAt: new Date() } : null),
  });
  const request = (path: string, method = 'GET', body?: unknown, headers: Record<string, string> = {}) =>
    api(
      new Request(origin + '/api/account' + path, {
        method,
        headers: { origin, 'content-type': 'application/json', 'x-nq-owner': 'alice', ...headers },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
    );
  return { request, repository };
}
describe('account API security', () => {
  it('rejects unauthenticated reads', async () => {
    const { request, repository } = setup(null);
    expect((await request('/slots')).status).toBe(401);
    expect(repository.list).not.toHaveBeenCalled();
  });
  it('rejects a stale tab belonging to another account', async () => {
    const { request, repository } = setup('bob');
    expect(
      (
        await request('/slots/1', 'PUT', {
          revision: 0,
          mutation: crypto.randomUUID(),
          state: createNewGame({ name: 'ハル', grade: 3 }),
        })
      ).status,
    ).toBe(401);
    expect(repository.write).not.toHaveBeenCalled();
  });
  it('rejects cross-origin writes', async () => {
    const { request } = setup();
    expect((await request('/slots/1', 'PUT', {}, { origin: 'https://evil.example' })).status).toBe(403);
  });
  it('rejects unknown fields, invalid slots and corrupt saves', async () => {
    const { request, repository } = setup();
    expect((await request('/slots/4', 'PUT', {})).status).toBe(404);
    expect(
      (await request('/slots/1', 'PUT', { revision: 0, mutation: crypto.randomUUID(), state: {} })).status,
    ).toBe(422);
    expect(repository.write).not.toHaveBeenCalled();
  });
  it('rejects future save versions without stripping them into an old save', async () => {
    const { request, repository } = setup();
    const state = createNewGame({ name: 'ハル', grade: 3 });
    state.schemaVersion += 1;
    expect(
      (await request('/slots/1', 'PUT', { revision: 0, mutation: crypto.randomUUID(), state })).status,
    ).toBe(422);
    expect(repository.write).not.toHaveBeenCalled();
  });
  it('returns a conflict without overwriting', async () => {
    const { request, repository } = setup();
    const state = createNewGame({ name: 'ハル', grade: 3 });
    const mutation = crypto.randomUUID();
    expect((await request('/slots/1', 'PUT', { revision: 3, mutation, state })).status).toBe(409);
    expect(repository.write).toHaveBeenCalledWith('alice', 1, { revision: 3, mutation, state });
  });
  it('applies rate limits before reading saves', async () => {
    const { request, repository } = setup();
    repository.allow.mockResolvedValue(false);
    expect((await request('/slots')).status).toBe(429);
    expect(repository.list).not.toHaveBeenCalled();
  });
});
