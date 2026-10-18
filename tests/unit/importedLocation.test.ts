import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import {
  isExactSpawnValid,
  isImportedLocationValid,
  isSavedFieldTileWalkable,
  rememberLocationState,
  resolveSpawn,
} from '../../src/scenes/overworld/importedLocation';

const areas = new Map([
  [
    'aomori',
    {
      id: 'aomori',
      island: 'tohoku',
      mapKeys: {
        field: 'aomori-field',
        town: 'aomori-town',
        dungeon: 'aomori-dungeon',
      },
      secret: { name: '弘前城', boss: 'tsugaru-tamenobu' },
    },
  ],
  [
    'niigata',
    {
      id: 'niigata',
      island: 'hokuriku',
      mapKeys: {
        field: 'niigata-field',
        town: 'niigata-town',
        dungeon: 'niigata-dungeon',
      },
    },
  ],
]);

const enclaves = [{ prefId: 'niigata', enclaveId: 'niigata-enclave' }];

describe('インポートした現在地の参照整合性', () => {
  it.each([
    ['aomori-field', 'tohoku', 'aomori'],
    ['aomori-town', 'tohoku', 'aomori'],
    ['aomori-dungeon', 'tohoku', 'aomori'],
    ['aomori-secret', 'tohoku', 'aomori'],
    ['niigata-enclave', 'hokuriku', 'niigata'],
  ])('%s は読み込める', (currentMap, currentIsland, currentArea) => {
    expect(isImportedLocationValid({ currentIsland, currentArea, currentMap }, areas, enclaves)).toBe(true);
  });

  it.each([
    ['missing-map', 'tohoku', 'aomori'],
    ['aomori-field', 'kanto', 'aomori'],
    ['iwate-field', 'tohoku', 'aomori'],
    ['aomori-enclave', 'tohoku', 'aomori'],
    ['niigata-secret', 'hokuriku', 'niigata'],
  ])('%s と現在地が食い違うセーブを拒否する', (currentMap, currentIsland, currentArea) => {
    expect(isImportedLocationValid({ currentIsland, currentArea, currentMap }, areas, enclaves)).toBe(false);
  });

  it('実在する町の宿屋復帰先は、現在の県と違っても読み込める', () => {
    expect(
      isImportedLocationValid(
        {
          currentIsland: 'tohoku',
          currentArea: 'aomori',
          currentMap: 'aomori-field',
          lastInn: { map: 'niigata-town' },
        },
        areas,
        enclaves,
      ),
    ).toBe(true);
  });

  it.each(['missing-map', 'aomori-field'])('宿屋ではない復帰先 %s を拒否する', (map) => {
    expect(
      isImportedLocationValid(
        {
          currentIsland: 'tohoku',
          currentArea: 'aomori',
          currentMap: 'aomori-field',
          lastInn: { map },
        },
        areas,
        enclaves,
      ),
    ).toBe(false);
  });
});

describe('保存された正確なスポーン座標', () => {
  it('マップ内の歩ける整数座標だけを許可する', () => {
    expect(isExactSpawnValid([10, 20], 128, 124, false)).toBe(true);
    expect(isExactSpawnValid([-1, 20], 128, 124, false)).toBe(false);
    expect(isExactSpawnValid([128, 20], 128, 124, false)).toBe(false);
    expect(isExactSpawnValid([10, 124], 128, 124, false)).toBe(false);
    expect(isExactSpawnValid([10, 20], 128, 124, true)).toBe(false);
    expect(isExactSpawnValid([10.5, 20], 128, 124, false)).toBe(false);
  });

  it('フィールドでは海など地面として歩けない場所を復帰先にしない', () => {
    // 報告された aomori-field の保存座標 [63, 64] は海タイル (3) だった。
    expect(isSavedFieldTileWalkable(3)).toBe(false);
    expect(isSavedFieldTileWalkable(1)).toBe(true);
    expect(isExactSpawnValid([10, 20], 128, 124, false, isSavedFieldTileWalkable(3))).toBe(false);
  });

  it('保存座標、地図ワープの隣、既定spawnの順に出現位置を決める', () => {
    const base = {
      width: 20,
      height: 20,
      fieldGroundRequired: true,
      terrainAt: () => 1,
      blocked: (x: number, y: number) => x < 0 || y < 0 || x >= 20 || y >= 20,
      objects: [{ name: 'spawn', type: 'spawn', x: 32, y: 48 }],
      spawnName: 'spawn',
    };
    expect(resolveSpawn({ ...base, spawnTile: [7, 8], exactSpawn: true })).toEqual({
      tile: [7, 8],
      faceUp: false,
    });
    expect(resolveSpawn({ ...base, spawnTile: [7, 8], exactSpawn: false })).toEqual({
      tile: [7, 9],
      faceUp: true,
    });
    expect(resolveSpawn({ ...base, spawnTile: null, exactSpawn: false })).toEqual({
      tile: [2, 3],
      faceUp: false,
    });
  });

  it('歩行位置が変わったときだけ保存状態を更新する', () => {
    const game = createNewGame({ name: 'ハル', grade: 3 }, 1_000);
    game.progress.currentArea = 'aomori';
    game.progress.currentMap = 'aomori-field';
    game.progress.position = { x: 16, y: 32 };
    expect(
      rememberLocationState(game, {
        mapKey: 'aomori-field',
        areaId: 'aomori',
        islandId: 'tohoku',
        areaExists: true,
        x: 1,
        y: 2,
        now: 2_000,
      }),
    ).toBe(game);
    expect(
      rememberLocationState(game, {
        mapKey: 'niigata-field',
        areaId: 'niigata',
        islandId: 'hokuriku',
        areaExists: true,
        x: 3,
        y: 4,
        now: 2_000,
      }),
    ).toMatchObject({
      updatedAt: 2_000,
      progress: {
        currentIsland: 'hokuriku',
        currentMap: 'niigata-field',
        currentArea: 'niigata',
        position: { x: 48, y: 64 },
      },
    });
  });
});
