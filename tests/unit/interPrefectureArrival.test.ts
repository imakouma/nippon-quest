import { describe, expect, it } from 'vitest';
import { DEV_ALL_KEY } from '../../src/core/progression/developerTravel';
import {
  applyInterPrefectureArrival,
  interPrefectureArrivalKey,
} from '../../src/core/progression/interPrefectureArrival';
import { createNewGame } from '../../src/core/state/newGame';
import { content } from './helpers';

describe('県境・実在交通の到着保存', () => {
  it('通常横断は地方・県・マップ・座標と訪問を一つの状態で更新する', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.areaSigns = ['aomori'];
    game.progress.eventsDone = ['midboss.aomori'];
    game.progress.islandsCleared = ['tohoku'];
    game.progress.counters['visit:aomori-field'] = 1;
    game.progress.counters.keep = 7;
    const before = structuredClone(game);

    const arrived = applyInterPrefectureArrival(
      game,
      world,
      {
        targetArea: 'hokkaido',
        targetMap: 'hokkaido-field',
        targetTile: [11, 12],
      },
      2_000,
    );

    expect(arrived).not.toBe(game);
    expect(arrived).toMatchObject({
      updatedAt: 2_000,
      progress: {
        currentIsland: 'hokkaido',
        currentArea: 'hokkaido',
        currentMap: 'hokkaido-field',
        position: { x: 16 * 11, y: 16 * 12 },
        areaSigns: ['aomori'],
        eventsDone: ['midboss.aomori'],
        islandsCleared: ['tohoku'],
        counters: {
          'visit:aomori-field': 1,
          'visit:hokkaido-field': 1,
          [interPrefectureArrivalKey('hokkaido')]: 1,
          keep: 7,
        },
      },
    });
    expect(game).toEqual(before);
  });

  it('dev横断は現在地だけを更新し、visitと攻略状態を変更しない', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.areaSigns = ['aomori'];
    game.progress.eventsDone = ['midboss.aomori'];
    game.progress.islandsCleared = ['tohoku'];
    game.progress.counters['visit:aomori-field'] = 1;
    game.progress.counters[DEV_ALL_KEY] = 1;
    const before = structuredClone(game);

    const arrived = applyInterPrefectureArrival(
      game,
      world,
      {
        targetArea: 'okinawa',
        targetMap: 'okinawa-field',
        targetTile: [8, 9],
      },
      3_000,
    );

    expect(arrived.updatedAt).toBe(3_000);
    expect(arrived.progress).toEqual({
      ...game.progress,
      currentIsland: 'kyushu-okinawa',
      currentArea: 'okinawa',
      currentMap: 'okinawa-field',
      position: { x: 16 * 8, y: 16 * 9 },
    });
    expect(arrived.progress.counters['visit:okinawa-field']).toBeUndefined();
    expect(arrived.progress.counters[interPrefectureArrivalKey('okinawa')]).toBeUndefined();
    expect(game).toEqual(before);
  });

  it('worldに属さない県を現在地として保存しない', async () => {
    const { world } = await content();
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    expect(() =>
      applyInterPrefectureArrival(game, world, {
        targetArea: 'missing-area',
        targetMap: 'missing-area-field',
        targetTile: [1, 2],
      }),
    ).toThrow(/missing-area/);
  });
});
