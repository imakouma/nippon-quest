import { describe, expect, it } from 'vitest';
import { regionBossFlag } from '../../src/core/progression/route';
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
});
