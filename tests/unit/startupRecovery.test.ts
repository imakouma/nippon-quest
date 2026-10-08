// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('localforage', () => ({
  default: {
    createInstance: () => ({
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }),
  },
}));

import {
  clearStaleChunkReloadChance,
  storeStartupRetryAction,
  takeStaleChunkReloadChance,
  takeStartupRetryAction,
} from '../../src/core/state/save';

beforeEach(() => sessionStorage.clear());

describe('起動復帰用の一時データ', () => {
  it('壊れた再試行データを捨て、次回起動を妨げない', () => {
    sessionStorage.setItem('nq:retry-title-action', '{broken');

    expect(takeStartupRetryAction()).toBeUndefined();
    expect(sessionStorage.getItem('nq:retry-title-action')).toBeNull();
  });

  it.each([
    null,
    [],
    { type: 'delete', slot: 1 },
    { type: 'continue', slot: 4 },
    { type: 'start', slot: 1 },
    { type: 'start', slot: 1, options: { name: '', grade: 1 } },
    { type: 'start', slot: 1, options: { name: 'ハル', grade: 7 } },
    {
      type: 'start',
      slot: 1,
      options: { name: 'ハル', grade: 3, appearance: { hair: 8, skin: 0, cloth: 0 } },
    },
  ])('JSONとして読めても契約外の再試行データは捨てる: %j', (action) => {
    sessionStorage.setItem('nq:retry-title-action', JSON.stringify(action));

    expect(takeStartupRetryAction()).toBeUndefined();
    expect(sessionStorage.getItem('nq:retry-title-action')).toBeNull();
  });

  it.each([
    { type: 'continue', slot: 2 },
    {
      type: 'start',
      slot: 3,
      options: {
        name: 'ハル',
        grade: 3,
        appearance: { hair: 7, skin: 6, cloth: 9, hairStyle: 3, eyes: 2 },
      },
    },
  ])('契約内の再試行データは一度だけ取り出せる: %j', (action) => {
    sessionStorage.setItem('nq:retry-title-action', JSON.stringify(action));

    expect(takeStartupRetryAction()).toEqual(action);
    expect(takeStartupRetryAction()).toBeUndefined();
  });

  it('古いチャンクによる自動再読込は、成功して明示的に解除するまで一度だけにする', () => {
    expect(takeStaleChunkReloadChance()).toBe(true);
    expect(takeStaleChunkReloadChance()).toBe(false);
    expect(takeStaleChunkReloadChance()).toBe(false);

    clearStaleChunkReloadChance();
    expect(takeStaleChunkReloadChance()).toBe(true);
  });

  it('sessionStorage が利用できなくても起動処理へ例外を漏らさない', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    expect(() => storeStartupRetryAction({ type: 'continue', slot: 1 })).not.toThrow();
    expect(takeStartupRetryAction()).toBeUndefined();
    expect(takeStaleChunkReloadChance()).toBe(false);
    expect(() => clearStaleChunkReloadChance()).not.toThrow();

    getItem.mockRestore();
    setItem.mockRestore();
  });
});
