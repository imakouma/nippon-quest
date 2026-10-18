import { describe, expect, it } from 'vitest';
import { DEV_ALL_KEY } from '../../src/core/progression/developerTravel';
import { createNewGame } from '../../src/core/state/newGame';
import { persistOverworldLocation } from '../../src/scenes/overworld/locationPersistence';
import { content } from './helpers';

describe('フィールド現在地の保存', () => {
  it('通常のマップ到着は現在地と初回訪問を同じ状態に保存する', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    const before = structuredClone(game);

    const persisted = persistOverworldLocation(game, world, {
      mapKey: 'aomori-town',
      areaId: 'aomori',
      islandId: 'tohoku',
      areaExists: true,
      tile: [5, 6],
      devAll: false,
      interPrefectureArrival: false,
      now: 2_000,
    });

    expect(persisted).toMatchObject({
      updatedAt: 2_000,
      progress: {
        currentIsland: 'tohoku',
        currentArea: 'aomori',
        currentMap: 'aomori-town',
        position: { x: 16 * 5, y: 16 * 6 },
        counters: { 'visit:aomori-town': 1 },
      },
    });
    expect(game).toEqual(before);
  });

  it('通常の県間到着はworldから地方も更新し、高速移動用の訪問を開く', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);

    const persisted = persistOverworldLocation(game, world, {
      mapKey: 'hokkaido-field',
      areaId: 'hokkaido',
      islandId: 'wrong-caller-value',
      areaExists: true,
      tile: [8, 9],
      devAll: false,
      interPrefectureArrival: true,
      now: 2_000,
    });

    expect(persisted.progress).toMatchObject({
      currentIsland: 'hokkaido',
      currentArea: 'hokkaido',
      currentMap: 'hokkaido-field',
      position: { x: 16 * 8, y: 16 * 9 },
      counters: { 'visit:hokkaido-field': 1 },
    });
  });

  it('dev中は通常入口と県間横断のどちらもvisit・攻略状態を汚さない', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.areaSigns = ['aomori'];
    game.progress.eventsDone = ['midboss.aomori'];
    game.progress.islandsCleared = ['tohoku'];
    game.progress.counters[DEV_ALL_KEY] = 1;
    const protectedProgress = {
      areaSigns: [...game.progress.areaSigns],
      eventsDone: [...game.progress.eventsDone],
      islandsCleared: [...game.progress.islandsCleared],
      counters: { ...game.progress.counters },
    };

    const town = persistOverworldLocation(game, world, {
      mapKey: 'aomori-town',
      areaId: 'aomori',
      islandId: 'tohoku',
      areaExists: true,
      tile: [5, 6],
      devAll: true,
      interPrefectureArrival: false,
      now: 2_000,
    });
    const crossed = persistOverworldLocation(town, world, {
      mapKey: 'okinawa-field',
      areaId: 'okinawa',
      islandId: 'kyushu-okinawa',
      areaExists: true,
      tile: [8, 9],
      devAll: true,
      interPrefectureArrival: true,
      now: 3_000,
    });

    expect(crossed.progress).toMatchObject({
      currentIsland: 'kyushu-okinawa',
      currentArea: 'okinawa',
      currentMap: 'okinawa-field',
      position: { x: 16 * 8, y: 16 * 9 },
      ...protectedProgress,
    });
    expect(crossed.progress.counters['visit:aomori-town']).toBeUndefined();
    expect(crossed.progress.counters['visit:okinawa-field']).toBeUndefined();
  });
});
