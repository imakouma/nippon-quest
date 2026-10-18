import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import { midBossFlag } from '../../src/core/progression/route';
import {
  areaMapView,
  mapBaseFromTiled,
  mapPlaces,
  parseRegionPartition,
  regionMiniMapView,
  visitedAreaIds,
  worldMapRegionViews,
  type MapBase,
} from '../../src/scenes/overworld/mapModels';
import type { WorldMapData } from '../../src/ui/field/worldMapModel';
import { areaMarkAccessibleLabel } from '../../src/ui/field/AreaMap';
import { stripRuby } from '../../src/ui/ruby';
import { content } from './helpers';

const game = () => createNewGame({ name: 'ハル', grade: 3 }, 1_000);

describe('地図表示モデル', () => {
  it('県境マーカーの種類・行先・開閉状態を読み上げる', () => {
    expect(
      areaMarkAccessibleLabel({
        x: 0,
        y: 0,
        kind: 'bridge',
        destination: '香川県[かがわけん]',
        open: false,
      }),
    ).toBe('香川県へ向かう橋、閉鎖中');
    expect(areaMarkAccessibleLabel({ x: 0, y: 0, kind: 'rail', destination: '岡山県', open: true })).toBe(
      '岡山県へ向かう鉄道、通行可能',
    );
    expect(areaMarkAccessibleLabel({ x: 0, y: 0, kind: 'town' })).toBe('まち');
  });

  it('regions プロパティは壊れていても例外にせず、正しい文字列配列だけ受け取る', () => {
    expect(parseRegionPartition('{broken')).toBeNull();
    expect(parseRegionPartition('{"ids":[1],"rows":["a"]}')).toBeNull();
    expect(parseRegionPartition('{"ids":["north"],"rows":["a."]}')).toEqual({
      ids: ['north'],
      rows: ['a.'],
    });
  });

  it('現在地と訪問記録から解放済み県を作る', async () => {
    const c = await content();
    const state = game();
    state.progress.counters['visit:iwate-town'] = 1;
    expect([...visitedAreaIds('aomori', state, c, false)].sort()).toEqual(['aomori', 'iwate']);
    expect(visitedAreaIds('aomori', state, c, true).size).toBe(c.areas.size);
  });

  it('Tiled の地形と objects レイヤーから地図の基礎データを作る', () => {
    const base = mapBaseFromTiled('sample-field', {
      width: 3,
      height: 2,
      layers: [
        { name: 'background', data: [3, 1, 3, 3, 1, 1] },
        { name: 'objects', objects: [{ type: 'transition', x: 16, y: 0 }] },
      ],
    });
    expect(base).toMatchObject({ key: 'sample-field', land: [1, 0, 2, 1] });
    expect(base?.objects).toEqual([{ type: 'transition', x: 16, y: 0 }]);
    expect(mapBaseFromTiled('missing', { width: 1, height: 1, layers: [] })).toBeNull();
  });

  it('県地図では陸表示の県外マスを現在県の詳細地形に含めない', () => {
    const base = mapBaseFromTiled('sample-field', {
      width: 3,
      height: 1,
      layers: [
        { name: 'background', data: [1, 1, 3] },
        { name: 'collision', data: [0, 3, 3] },
      ],
    });
    expect(base?.tiles).toEqual([1, 3, 3]);
    expect(base?.land).toEqual([0, 0, 0, 0]);
  });

  it('地方ミニマップに現在県の詳細地形と主人公位置を重ねる', () => {
    const data: WorldMapData = {
      regions: [
        {
          id: 'tohoku',
          width: 2,
          height: 1,
          panels: [
            {
              bbox: [140, 40, 142, 41],
              proj: { lon0: 140, lat0: 41, kx: 1, ky: 1, ox: 0, oy: 0 },
            },
          ],
          rows: ['ab'],
          areas: [
            { id: 'aomori', capital: [0, 0], stamps: [] },
            { id: 'iwate', capital: [1, 0], stamps: [] },
          ],
        },
      ],
    };
    const view = regionMiniMapView({
      data,
      areaId: 'aomori',
      visited: new Set(['aomori']),
      base: { key: 'aomori-field', width: 4, height: 2, tiles: Array(8).fill(1), land: [0, 0, 3, 1] },
      heroOnBase: [3, 1],
    });
    expect(view).toMatchObject({ id: 'tohoku', here: 0, visited: [true, false] });
    expect(view?.hero).toEqual([0.875, 0.75]);
  });

  it('全国地図に島の進行と県のロック状態を出す', async () => {
    const c = await content();
    const data = JSON.parse(
      readFileSync(new URL('../../public/worldmap.json', import.meta.url), 'utf8'),
    ) as WorldMapData;
    const regions = worldMapRegionViews({
      data,
      content: c,
      game: game(),
      visited: new Set(['aomori']),
      kana: (value) => stripRuby(value, 'kana'),
    });
    const tohoku = regions.find((region) => region.id === 'tohoku');
    expect(tohoku?.areas.find((area) => area.id === 'aomori')?.visited).toBe(true);
    expect(tohoku?.areas.find((area) => area.id === 'iwate')?.visited).toBe(false);
  });

  it('県地図の印とワープ先を、Tiled オブジェクトと進行データから作る', async () => {
    const c = await content();
    const area = c.areas.get('aomori')!;
    const state = game();
    state.progress.counters['visit:aomori-town'] = 1;
    state.dex.motifs.push('aomori.ringo');
    const base: MapBase = {
      key: 'aomori-field',
      width: 4,
      height: 2,
      tiles: Array(8).fill(1),
      land: [0, 0, 3, 1],
      objects: [
        { type: 'transition', x: 16, y: 0, properties: [{ name: 'targetMap', value: 'aomori-town' }] },
        { type: 'event', name: 'ev_ringoen', x: 32, y: 0 },
        { type: 'specialty', x: 48, y: 0, properties: [{ name: 'motifId', value: 'ringo' }] },
        { type: 'midboss', x: 0, y: 16 },
      ],
    };
    const view = areaMapView({
      base,
      area,
      game: state,
      currentMapKey: 'aomori-town',
      heroTile: null,
      region: null,
    });
    expect(view?.hero).toEqual([1, 0]);
    expect(view?.marks.map((mark) => mark.kind)).toEqual(['town', 'sign-todo', 'box-open', 'boss']);
    expect(
      mapPlaces({
        base,
        area,
        game: state,
        revealAll: false,
        enclaves: [],
        labels: { town: 'まち', dungeon: 'ダンジョン' },
      }).map((place) => place.id),
    ).toEqual(['map:aomori-town', 'sign:aomori.ringo', 'box:aomori.ringo']);
  });

  it('中ボス撃破後は跡地をワープ表示せず、実際の県境門・交通入口を表示する', async () => {
    const c = await content();
    const area = c.areas.get('hokkaido')!;
    const state = game();
    state.progress.eventsDone.push(midBossFlag('hokkaido'));
    const base: MapBase = {
      key: 'hokkaido-field',
      width: 4,
      height: 2,
      tiles: Array(8).fill(1),
      land: [0, 0, 3, 1],
      objects: [
        { type: 'midboss', x: 0, y: 0 },
        {
          type: 'interPrefectureLink',
          x: 16,
          y: 0,
          properties: [
            { name: 'linkId', value: 'aomori-hokkaido-seikan' },
            { name: 'targetArea', value: 'aomori' },
            { name: 'targetMap', value: 'aomori-field' },
            { name: 'targetSpawn', value: 'from_aomori-hokkaido-seikan' },
            { name: 'firstTargetSpawn', value: 'from_aomori-hokkaido-seikan' },
            { name: 'infrastructure', value: 'tunnel' },
            { name: 'travelMode', value: 'rail' },
            { name: 'unlockRole', value: 'chapter' },
          ],
        },
        {
          type: 'interPrefectureLink',
          x: 32,
          y: 0,
          properties: [
            { name: 'linkId', value: 'hokkaido-ibaraki-ferry' },
            { name: 'targetArea', value: 'ibaraki' },
            { name: 'targetMap', value: 'ibaraki-field' },
            { name: 'targetSpawn', value: 'from_hokkaido-ibaraki-ferry' },
            { name: 'firstTargetSpawn', value: 'from_hokkaido-ibaraki-ferry' },
            { name: 'infrastructure', value: 'seaRoute' },
            { name: 'travelMode', value: 'ferry' },
            { name: 'unlockRole', value: 'chapter' },
          ],
        },
      ],
    };

    const view = areaMapView({
      base,
      area,
      game: state,
      content: c,
      currentMapKey: base.key,
      heroTile: [0, 1],
      region: null,
    });

    expect(view?.marks).toEqual([
      {
        x: 1,
        y: 0,
        kind: 'rail',
        open: false,
        destination: c.areas.get('aomori')?.name,
      },
      {
        x: 2,
        y: 0,
        kind: 'ship',
        open: false,
        destination: c.areas.get('ibaraki')?.name,
      },
    ]);
  });

  it.each([
    ['aomori', 'iwate', 'land-aomori-iwate', 'landBorder', 'walk', undefined, 'gate'],
    ['hiroshima', 'ehime', 'hiroshima-ehime-bridge', 'bridge', 'roadVehicle', 'chapter', 'bridge'],
    ['yamaguchi', 'fukuoka', 'yamaguchi-fukuoka-kanmon', 'tunnel', 'walk', 'chapter', 'tunnel'],
    ['aomori', 'hokkaido', 'aomori-hokkaido-seikan', 'tunnel', 'rail', 'chapter', 'rail'],
    ['hokkaido', 'ibaraki', 'hokkaido-ibaraki-ferry', 'seaRoute', 'ferry', 'chapter', 'ship'],
  ] as const)(
    '県境リンク %s → %s を交通種別・開閉状態・行先つきで表示する',
    async (current, target, id, infrastructure, travelMode, unlockRole, kind) => {
      const c = await content();
      const properties = [
        { name: 'linkId', value: id },
        { name: 'targetArea', value: target },
        { name: 'targetMap', value: `${target}-field` },
        { name: 'targetSpawn', value: `from_${id}` },
        { name: 'firstTargetSpawn', value: `from_${id}` },
        { name: 'infrastructure', value: infrastructure },
        { name: 'travelMode', value: travelMode },
        ...(unlockRole ? [{ name: 'unlockRole', value: unlockRole }] : []),
      ];
      const base: MapBase = {
        key: `${current}-field`,
        width: 1,
        height: 1,
        tiles: [1],
        land: [0, 0, 0, 0],
        objects: [{ type: 'interPrefectureLink', x: 0, y: 0, properties }],
      };

      expect(
        areaMapView({
          base,
          area: c.areas.get(current),
          game: game(),
          content: c,
          currentMapKey: base.key,
          heroTile: null,
          region: null,
          revealAll: true,
        })?.marks,
      ).toEqual([
        {
          x: 0,
          y: 0,
          kind,
          open: true,
          destination: c.areas.get(target)?.name,
        },
      ]);
    },
  );
});
