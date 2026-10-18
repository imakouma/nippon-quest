import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PREFECTURES } from '../../scripts/data/prefectures';
import { TRANSPORT_LINKS } from '../../scripts/data/interPrefectureLinks';
import type { Ring } from '../../scripts/terrain/raster';
import { deriveLandBorderLinks, type LandBorderLink } from '../../scripts/terrain/prefectureBorders';

const terrain = JSON.parse(
  readFileSync(new URL('../../scripts/data/terrain.json', import.meta.url), 'utf8'),
) as { interPrefectureBorders?: LandBorderLink[] };

const EXPECTED_LAND_BORDER_IDS = [
  'land-aomori-iwate',
  'land-aomori-akita',
  'land-iwate-miyagi',
  'land-iwate-akita',
  'land-miyagi-akita',
  'land-miyagi-yamagata',
  'land-miyagi-fukushima',
  'land-akita-yamagata',
  'land-yamagata-fukushima',
  'land-yamagata-niigata',
  'land-fukushima-ibaraki',
  'land-fukushima-tochigi',
  'land-fukushima-gunma',
  'land-fukushima-niigata',
  'land-ibaraki-tochigi',
  'land-ibaraki-saitama',
  'land-ibaraki-chiba',
  'land-tochigi-gunma',
  'land-tochigi-saitama',
  'land-gunma-saitama',
  'land-gunma-niigata',
  'land-gunma-nagano',
  'land-saitama-chiba',
  'land-saitama-tokyo',
  'land-saitama-yamanashi',
  'land-saitama-nagano',
  'land-chiba-tokyo',
  'land-tokyo-kanagawa',
  'land-tokyo-yamanashi',
  'land-kanagawa-yamanashi',
  'land-kanagawa-shizuoka',
  'land-niigata-toyama',
  'land-niigata-nagano',
  'land-toyama-ishikawa',
  'land-toyama-nagano',
  'land-toyama-gifu',
  'land-ishikawa-fukui',
  'land-ishikawa-gifu',
  'land-fukui-gifu',
  'land-fukui-shiga',
  'land-fukui-kyoto',
  'land-yamanashi-nagano',
  'land-yamanashi-shizuoka',
  'land-nagano-gifu',
  'land-nagano-shizuoka',
  'land-nagano-aichi',
  'land-gifu-aichi',
  'land-gifu-mie',
  'land-gifu-shiga',
  'land-shizuoka-aichi',
  'land-aichi-mie',
  'land-mie-shiga',
  'land-mie-kyoto',
  'land-mie-nara',
  'land-mie-wakayama',
  'land-shiga-kyoto',
  'land-kyoto-osaka',
  'land-kyoto-hyogo',
  'land-kyoto-nara',
  'land-osaka-hyogo',
  'land-osaka-nara',
  'land-osaka-wakayama',
  'land-hyogo-tottori',
  'land-hyogo-okayama',
  'land-nara-wakayama',
  'land-tottori-shimane',
  'land-tottori-okayama',
  'land-tottori-hiroshima',
  'land-shimane-hiroshima',
  'land-shimane-yamaguchi',
  'land-okayama-hiroshima',
  'land-hiroshima-yamaguchi',
  'land-tokushima-kagawa',
  'land-tokushima-ehime',
  'land-tokushima-kochi',
  'land-kagawa-ehime',
  'land-ehime-kochi',
  'land-fukuoka-saga',
  'land-fukuoka-kumamoto',
  'land-fukuoka-oita',
  'land-saga-nagasaki',
  'land-kumamoto-oita',
  'land-kumamoto-miyazaki',
  'land-kumamoto-kagoshima',
  'land-oita-miyazaki',
  'land-miyazaki-kagoshima',
] as const;

describe('陸上の県境リンク', () => {
  it('線を共有する県だけを隣接とし、点接触を除外する', () => {
    const raw = new Map<number, Ring[][]>([
      [
        1,
        [
          [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        ],
      ],
      [
        2,
        [
          [
            [
              [1, 0],
              [2, 0],
              [2, 1],
              [1, 1],
              [1, 0],
            ],
          ],
        ],
      ],
      [
        3,
        [
          [
            [
              [0, 1],
              [-1, 2],
              [0, 2],
              [0, 1],
            ],
          ],
        ],
      ],
    ]);

    expect(
      deriveLandBorderLinks(raw, [
        { code: '01', id: 'one' },
        { code: '02', id: 'two' },
        { code: '03', id: 'three' },
      ]),
    ).toEqual([
      {
        id: 'land-one-two',
        areas: ['one', 'two'],
        anchor: [1, 0],
        infrastructure: 'landBorder',
        travelMode: 'walk',
      },
    ]);
  });

  it('国土地理院由来の生成データに86組がある', () => {
    const links = terrain.interPrefectureBorders ?? [];
    const pairs = links.map((link) => link.areas.join('-'));
    expect(links).toHaveLength(86);
    expect(links.map((link) => link.id)).toEqual(EXPECTED_LAND_BORDER_IDS);
    expect(new Set(links.map((link) => link.id)).size).toBe(86);
    expect(new Set(pairs).size).toBe(86);
    expect(pairs).not.toContain('okayama-kagawa');
    expect(pairs).not.toContain('kagawa-okayama');
    for (const link of links) {
      expect(link.infrastructure).toBe('landBorder');
      expect(link.travelMode).toBe('walk');
      expect(link.anchor.every(Number.isFinite)).toBe(true);
    }
  });
});

describe('実在交通リンク', () => {
  it('承認済みの9組と2軸モデルが一致する', () => {
    expect(
      TRANSPORT_LINKS.map(({ id, areas, infrastructure, travelMode }) => ({
        id,
        areas,
        infrastructure,
        travelMode,
      })),
    ).toEqual([
      {
        id: 'aomori-hokkaido-seikan',
        areas: ['aomori', 'hokkaido'],
        infrastructure: 'tunnel',
        travelMode: 'rail',
      },
      {
        id: 'hokkaido-ibaraki-ferry',
        areas: ['hokkaido', 'ibaraki'],
        infrastructure: 'seaRoute',
        travelMode: 'ferry',
      },
      {
        id: 'hyogo-tokushima-bridge',
        areas: ['hyogo', 'tokushima'],
        infrastructure: 'bridge',
        travelMode: 'roadVehicle',
      },
      {
        id: 'okayama-kagawa-bridge',
        areas: ['okayama', 'kagawa'],
        infrastructure: 'bridge',
        travelMode: 'rail',
      },
      {
        id: 'hiroshima-ehime-bridge',
        areas: ['hiroshima', 'ehime'],
        infrastructure: 'bridge',
        travelMode: 'bicycle',
      },
      {
        id: 'ehime-oita-ferry',
        areas: ['ehime', 'oita'],
        infrastructure: 'seaRoute',
        travelMode: 'ferry',
      },
      {
        id: 'yamaguchi-fukuoka-kanmon',
        areas: ['yamaguchi', 'fukuoka'],
        infrastructure: 'tunnel',
        travelMode: 'walk',
      },
      {
        id: 'nagasaki-kumamoto-ferry',
        areas: ['nagasaki', 'kumamoto'],
        infrastructure: 'seaRoute',
        travelMode: 'ferry',
      },
      {
        id: 'kagoshima-okinawa-ferry',
        areas: ['kagoshima', 'okinawa'],
        infrastructure: 'seaRoute',
        travelMode: 'ferry',
      },
    ]);
  });

  it('県・両端・配置・表示キーが完全で、廃止済み航路を含まない', () => {
    const prefectures = new Set(PREFECTURES.map((prefecture) => prefecture.id));
    expect(TRANSPORT_LINKS).toHaveLength(9);
    expect(new Set(TRANSPORT_LINKS.map((link) => link.id)).size).toBe(9);
    expect(TRANSPORT_LINKS.some((link) => link.id.includes('matsuyama-kokura'))).toBe(false);
    for (const link of TRANSPORT_LINKS) {
      expect(link.endpoints.map((endpoint) => endpoint.areaId)).toEqual(link.areas);
      expect(link.labelKey).toBe(`field.interPrefecture.links.${link.id}.label`);
      for (const endpoint of link.endpoints) {
        expect(prefectures.has(endpoint.areaId)).toBe(true);
        expect(endpoint.at.every(Number.isFinite)).toBe(true);
        expect(['land', 'coast']).toContain(endpoint.placement);
        expect(endpoint.placeId).toMatch(/^[a-z0-9-]+$/);
        expect(endpoint.nameKey).toBe(`field.interPrefecture.links.${link.id}.${endpoint.areaId}`);
      }
    }
  });
});
