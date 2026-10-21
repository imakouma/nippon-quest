import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import {
  isTransitionLocked,
  syncTransitionLocks,
  transitionLock,
} from '../../src/scenes/overworld/transitionLock';
import { content } from './helpers';

describe('県ダンジョン入口のロック', () => {
  it('マップに明示されたロックを優先する', () => {
    expect(
      transitionLock({
        explicitLock: 'areaSign',
        mapKind: 'field',
        targetMap: 'aomori-dungeon',
        areaId: 'aomori',
        hasRegionBosses: true,
      }),
    ).toBe('areaSign');
  });

  it('旧形式のフィールドでも地域ボスがいる県のダンジョンをロックする', () => {
    expect(
      transitionLock({
        explicitLock: undefined,
        mapKind: 'field',
        targetMap: 'aomori-dungeon',
        areaId: 'aomori',
        hasRegionBosses: true,
      }),
    ).toBe('regionBosses');
  });

  it('地域ボスのない県や別種の入口には補完しない', () => {
    const base = {
      explicitLock: undefined,
      mapKind: 'field' as const,
      targetMap: 'aomori-town',
      areaId: 'aomori',
      hasRegionBosses: true,
    };
    expect(transitionLock(base)).toBeNull();
    expect(transitionLock({ ...base, targetMap: 'aomori-dungeon', hasRegionBosses: false })).toBeNull();
    expect(transitionLock({ ...base, mapKind: 'dungeon', targetMap: 'aomori-dungeon' })).toBeNull();
  });

  it('地域進行・県ボス進行・開発者モードに応じてロック状態を返す', async () => {
    const area = (await content()).areas.get('aomori')!;
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    expect(isTransitionLocked('regionBosses', area, game.progress, false)).toBe(true);
    expect(isTransitionLocked('regionBosses', area, game.progress, true)).toBe(false);
    expect(isTransitionLocked('areaSign', area, game.progress, false)).toBe(true);
    game.progress.eventsDone.push(`boss.${area.id}`);
    expect(isTransitionLocked('areaSign', area, game.progress, false)).toBe(false);
  });

  it('入口画像をロック状態へ両方向に同期し、地域ダンジョンの解禁だけを通知する', () => {
    const icon = {
      isTinted: true,
      setTint() {
        this.isTinted = true;
      },
      clearTint() {
        this.isTinted = false;
      },
    };
    expect(syncTransitionLocks(new Map([[1, 'regionBosses']]), new Map([[1, icon]]), () => false)).toBe(true);
    expect(icon.isTinted).toBe(false);
    expect(syncTransitionLocks(new Map([[1, 'regionBosses']]), new Map([[1, icon]]), () => true)).toBe(false);
    expect(icon.isTinted).toBe(true);
  });
});
