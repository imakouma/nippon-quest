import { describe, expect, it } from 'vitest';
import {
  allRegionBossesDefeated,
  midBossFlag,
  regionBossDefeated,
  regionBossFlag,
} from '../../src/core/progression/route';
import { createNewGame } from '../../src/core/state/newGame';
import { areaMapView, type MapBase } from '../../src/scenes/overworld/mapModels';
import { LOCKED_REGION_TILE } from '../../src/shared/regionVisibility';
import { content } from './helpers';

describe('青森の未解放エリア表示', () => {
  it('未解放エリアを影にし、ぬし撃破後は次のエリアを表示する', async () => {
    const area = (await content()).areas.get('aomori')!;
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    const base: MapBase = {
      key: 'aomori-field',
      width: 2,
      height: 1,
      tiles: [4, 4],
      land: [0, 0, 1, 0],
      objects: [],
      regions: { ids: ['nebuta', 'sannai'], rows: ['ab'] },
    };

    expect(
      areaMapView({ base, area, game, currentMapKey: base.key, heroTile: [0, 0], region: null })?.tiles,
    ).toEqual([4, LOCKED_REGION_TILE]);

    game.progress.eventsDone.push(regionBossFlag('aomori', 'nebuta'));
    expect(
      areaMapView({ base, area, game, currentMapKey: base.key, heroTile: [0, 0], region: null })?.tiles,
    ).toEqual([4, 4]);
  });

  it('地域制の追加前に県をクリアしたセーブでは全地域を表示する', async () => {
    const area = (await content()).areas.get('aomori')!;
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.areaSigns.push(area.id);
    const base: MapBase = {
      key: 'aomori-field',
      width: 2,
      height: 1,
      tiles: [4, 4],
      land: [0, 0, 1, 0],
      objects: [],
      regions: { ids: ['nebuta', 'sannai'], rows: ['ab'] },
    };

    expect(
      areaMapView({ base, area, game, currentMapKey: base.key, heroTile: [0, 0], region: null })?.tiles,
    ).toEqual([4, 4]);
  });
});

describe('地域ボスの既存セーブ互換', () => {
  it('地域ボス撃破フラグまたは県のしるしがあれば撃破済みとして扱う', () => {
    expect(
      regionBossDefeated(
        { areaSigns: [], eventsDone: [regionBossFlag('iwate', 'morioka')] },
        'iwate',
        'morioka',
      ),
    ).toBe(true);
    expect(regionBossDefeated({ areaSigns: ['iwate'], eventsDone: [] }, 'iwate', 'morioka')).toBe(true);
    expect(
      regionBossDefeated({ areaSigns: [], eventsDone: [midBossFlag('iwate')] }, 'iwate', 'morioka'),
    ).toBe(true);
    expect(regionBossDefeated({ areaSigns: [], eventsDone: [] }, 'iwate', 'morioka')).toBe(false);
  });

  it('県内すべての地域ボスを倒すまで次県を開く中ボスへ進めない', () => {
    const regionIds = ['start', 'middle', 'last'];
    const progress = {
      areaSigns: [] as string[],
      eventsDone: [regionBossFlag('iwate', 'start'), regionBossFlag('iwate', 'middle')],
    };

    expect(allRegionBossesDefeated(progress, 'iwate', regionIds)).toBe(false);
    progress.eventsDone.push(regionBossFlag('iwate', 'last'));
    expect(allRegionBossesDefeated(progress, 'iwate', regionIds)).toBe(true);
    expect(allRegionBossesDefeated({ areaSigns: ['iwate'], eventsDone: [] }, 'iwate', regionIds)).toBe(true);
    expect(
      allRegionBossesDefeated({ areaSigns: [], eventsDone: [midBossFlag('iwate')] }, 'iwate', regionIds),
    ).toBe(true);
    expect(allRegionBossesDefeated(progress, 'iwate', [])).toBe(true);
  });
});
