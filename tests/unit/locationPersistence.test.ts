import { describe, expect, it } from 'vitest';
import {
  DEV_ALL_KEY,
  developerInnQuarantined,
  developerVisitQuarantined,
  normalizeUnavailableDeveloperTravel,
} from '../../src/core/progression/developerTravel';
import { createNewGame } from '../../src/core/state/newGame';
import { accessibleLastInn, persistOverworldLocation } from '../../src/scenes/overworld/locationPersistence';
import { content } from './helpers';

describe('フィールド現在地の保存', () => {
  it('未解放県の宿記録は消さずに復帰先から除外する', async () => {
    const c = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.lastInn = { map: 'niigata-town', x: 80, y: 96 };

    expect(accessibleLastInn(game, c.world, c.areas)).toBeNull();
    expect(game.progress.lastInn).toEqual({ map: 'niigata-town', x: 80, y: 96 });

    game.progress.areaSigns.push('aomori');
    game.progress.lastInn = { map: 'iwate-town', x: 80, y: 96 };
    expect(accessibleLastInn(game, c.world, c.areas)).toEqual({ map: 'iwate-town', x: 80, y: 96 });

    game.progress.areaSigns = ['gifu'];
    game.progress.islandsCleared = ['tohoku', 'hokkaido', 'kanto', 'hokuriku', 'koshinetsu'];
    game.progress.lastInn = { map: 'gifu-town', x: 80, y: 96 };
    expect(accessibleLastInn(game, c.world, c.areas)).toEqual({ map: 'gifu-town', x: 80, y: 96 });
  });

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

  it('正規到着は隔離した訪問・宿を入力を壊さず解除し、必ず保存対象の新状態を返す', async () => {
    const c = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.counters['visit:iwate-town'] = 1;
    game.progress.lastInn = { map: 'iwate-town', x: 80, y: 96 };
    const quarantined = normalizeUnavailableDeveloperTravel(game, c.world, true, 2_000);
    quarantined.progress.areaSigns.push('aomori');
    quarantined.progress.currentArea = 'iwate';
    quarantined.progress.currentMap = 'iwate-town';
    quarantined.progress.position = { x: 80, y: 96 };
    const before = structuredClone(quarantined);

    expect(accessibleLastInn(quarantined, c.world, c.areas)).toBeNull();
    const persisted = persistOverworldLocation(quarantined, c.world, {
      mapKey: 'iwate-town',
      areaId: 'iwate',
      islandId: 'tohoku',
      areaExists: true,
      tile: [5, 6],
      devAll: false,
      interPrefectureArrival: false,
      now: 3_000,
    });

    expect(persisted).not.toBe(quarantined);
    expect(quarantined).toEqual(before);
    expect(developerVisitQuarantined(quarantined.progress.counters, 'iwate-town')).toBe(true);
    expect(developerInnQuarantined(quarantined.progress.counters, 'iwate-town')).toBe(true);
    expect(developerVisitQuarantined(persisted.progress.counters, 'iwate-town')).toBe(false);
    expect(developerInnQuarantined(persisted.progress.counters, 'iwate-town')).toBe(false);
    expect(accessibleLastInn(persisted, c.world, c.areas)).toEqual({
      map: 'iwate-town',
      x: 80,
      y: 96,
    });
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
