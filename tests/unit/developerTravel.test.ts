import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import {
  DEV_ALL_KEY,
  disableDeveloperTravel,
  enableDeveloperTravel,
  toggleDeveloperTravel,
} from '../../src/core/progression/developerTravel';
import { content } from './helpers';

describe('開発者モードの移動を進行から分離する', () => {
  it('開始位置を保存し、dev中の現在地からoffにすると元の位置へ戻す', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.currentIsland = 'tohoku';
    game.progress.currentArea = 'aomori';
    game.progress.currentMap = 'aomori-field';
    game.progress.position = { x: 16 * 12, y: 16 * 34 };
    game.progress.areaSigns = ['aomori'];
    game.progress.eventsDone = ['midboss.aomori'];
    game.progress.islandsCleared = ['tohoku'];
    const originalCounters = { ...game.progress.counters };

    const enabled = enableDeveloperTravel(game, 2_000);
    expect(enabled.progress.counters[DEV_ALL_KEY]).toBe(1);
    const traveled = structuredClone(enabled);
    traveled.progress.currentIsland = 'kyushu-okinawa';
    traveled.progress.currentArea = 'okinawa';
    traveled.progress.currentMap = 'okinawa-field';
    traveled.progress.position = { x: 16 * 8, y: 16 * 9 };

    const disabled = disableDeveloperTravel(traveled, world, 3_000);
    expect(disabled.progress).toMatchObject({
      currentIsland: 'tohoku',
      currentArea: 'aomori',
      currentMap: 'aomori-field',
      position: { x: 16 * 12, y: 16 * 34 },
      areaSigns: ['aomori'],
      eventsDone: ['midboss.aomori'],
      islandsCleared: ['tohoku'],
    });
    expect(
      Object.keys(disabled.progress.counters).filter(
        (key) => key === DEV_ALL_KEY || key.startsWith('dev:return:'),
      ),
    ).toEqual([]);
    expect(game.progress.counters).toEqual(originalCounters);
  });

  it('二重enableで復帰位置を上書きせず、攻略配列とvisit記録を変更しない', () => {
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.currentMap = 'aomori-field';
    game.progress.position = { x: 32, y: 48 };
    game.progress.counters['visit:aomori-field'] = 1;
    const once = enableDeveloperTravel(game, 2_000);
    once.progress.currentMap = 'iwate-field';
    once.progress.currentArea = 'iwate';
    once.progress.position = { x: 160, y: 176 };
    const twice = enableDeveloperTravel(once, 3_000);
    expect(twice).toBe(once);
    expect(twice.progress.counters['visit:aomori-field']).toBe(1);
    expect(twice.progress.counters['visit:iwate-field']).toBeUndefined();
    expect(twice.progress.areaSigns).toEqual(game.progress.areaSigns);
    expect(twice.progress.eventsDone).toEqual(game.progress.eventsDone);
    expect(twice.progress.islandsCleared).toEqual(game.progress.islandsCleared);
  });

  it('古いdevセーブは訪問済み現在県、攻略順最初の訪問県、青森の順で安全復帰する', async () => {
    const { world } = await content();
    const base = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    base.progress.counters[DEV_ALL_KEY] = 1;
    base.progress.currentIsland = 'hokuriku';
    base.progress.currentArea = 'niigata';
    base.progress.currentMap = 'niigata-field';
    base.progress.position = { x: 320, y: 480 };

    const currentVisited = structuredClone(base);
    currentVisited.progress.counters['visit:niigata-field'] = 1;
    expect(disableDeveloperTravel(currentVisited, world, 2_000).progress).toMatchObject({
      currentIsland: 'hokuriku',
      currentArea: 'niigata',
      currentMap: 'niigata-field',
      position: { x: 320, y: 480 },
    });

    const earlierVisited = structuredClone(base);
    earlierVisited.progress.counters['visit:tokyo-field'] = 1;
    earlierVisited.progress.counters['visit:iwate-field'] = 1;
    expect(disableDeveloperTravel(earlierVisited, world, 2_000).progress).toMatchObject({
      currentIsland: 'tohoku',
      currentArea: 'iwate',
      currentMap: 'iwate-field',
    });

    expect(disableDeveloperTravel(base, world, 2_000).progress).toMatchObject({
      currentIsland: 'tohoku',
      currentArea: 'aomori',
      currentMap: 'aomori-field',
    });
  });

  it('toggleは画面の再読込先も一緒に返し、off時は開始タイルへ戻す', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.currentMap = 'aomori-field';
    game.progress.currentArea = 'aomori';
    game.progress.currentIsland = 'tohoku';
    game.progress.position = { x: 16 * 12, y: 16 * 34 };
    game.progress.counters['visit:aomori-field'] = 1;
    const before = structuredClone(game);

    const enabled = toggleDeveloperTravel(game, world, 'aomori-field', [12, 34]);
    expect(enabled).toMatchObject({
      enabled: true,
      targetMap: 'aomori-field',
      targetTile: [12, 34],
    });
    expect(enabled.game.progress.counters[DEV_ALL_KEY]).toBe(1);
    expect(game).toEqual(before);

    const traveled = structuredClone(enabled.game);
    traveled.progress.currentIsland = 'kyushu-okinawa';
    traveled.progress.currentArea = 'okinawa';
    traveled.progress.currentMap = 'okinawa-field';
    traveled.progress.position = { x: 16 * 8, y: 16 * 9 };
    const disabled = toggleDeveloperTravel(traveled, world, 'okinawa-field', [8, 9]);

    expect(disabled).toMatchObject({
      enabled: false,
      targetMap: 'aomori-field',
      targetTile: [12, 34],
      game: {
        progress: {
          currentIsland: 'tohoku',
          currentArea: 'aomori',
          currentMap: 'aomori-field',
          position: { x: 16 * 12, y: 16 * 34 },
          counters: { 'visit:aomori-field': 1 },
        },
      },
    });
    expect(
      Object.keys(disabled.game.progress.counters).filter(
        (key) => key === DEV_ALL_KEY || key.startsWith('dev:return:'),
      ),
    ).toEqual([]);
  });
});
