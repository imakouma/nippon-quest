import { describe, expect, it } from 'vitest';
import {
  interPrefectureDestinationSpawn,
  parseInterPrefectureLinkObject,
} from '../../src/scenes/overworld/interPrefectureLink';

const property = (name: string, value: unknown) => ({ name, value });

const linkObject = {
  type: 'interPrefectureLink',
  name: 'interpref_aomori-hokkaido-seikan',
  properties: [
    property('linkId', 'aomori-hokkaido-seikan'),
    property('targetArea', 'hokkaido'),
    property('targetMap', 'hokkaido-field'),
    property('targetSpawn', 'from_aomori-hokkaido-seikan'),
    property('firstTargetSpawn', 'spawn'),
    property('infrastructure', 'tunnel'),
    property('travelMode', 'rail'),
    property('unlockRole', 'chapter'),
    property('labelKey', 'field.interPrefecture.links.aomori-hokkaido-seikan.label'),
    property('placeId', 'shin-aomori-station'),
    property('endpointNameKey', 'field.interPrefecture.links.aomori-hokkaido-seikan.aomori'),
  ],
} as const;

const untouchedProgress = {
  areaSigns: [] as string[],
  eventsDone: [] as string[],
  counters: {} as Record<string, number>,
};

describe('県境・実在交通のランタイムモデル', () => {
  it('生成済みTiledオブジェクトを、現在県を含む双方向リンクへ変換する', () => {
    expect(parseInterPrefectureLinkObject('aomori', linkObject)).toEqual({
      id: 'aomori-hokkaido-seikan',
      currentArea: 'aomori',
      targetArea: 'hokkaido',
      areas: ['aomori', 'hokkaido'],
      targetMap: 'hokkaido-field',
      targetSpawn: 'from_aomori-hokkaido-seikan',
      firstTargetSpawn: 'spawn',
      infrastructure: 'tunnel',
      travelMode: 'rail',
      unlockRole: 'chapter',
      labelKey: 'field.interPrefecture.links.aomori-hokkaido-seikan.label',
      placeId: 'shin-aomori-station',
      endpointNameKey: 'field.interPrefecture.links.aomori-hokkaido-seikan.aomori',
    });
  });

  it('陸続きの門では任意の表示キーを要求せず、対象外オブジェクトは無視する', () => {
    const land = {
      type: 'interPrefectureLink',
      properties: [
        property('linkId', 'land-02-03'),
        property('targetArea', 'iwate'),
        property('targetMap', 'iwate-field'),
        property('targetSpawn', 'from_land-02-03'),
        property('firstTargetSpawn', 'spawn'),
        property('infrastructure', 'landBorder'),
        property('travelMode', 'walk'),
      ],
    };
    expect(parseInterPrefectureLinkObject('aomori', land)).toEqual({
      id: 'land-02-03',
      currentArea: 'aomori',
      targetArea: 'iwate',
      areas: ['aomori', 'iwate'],
      targetMap: 'iwate-field',
      targetSpawn: 'from_land-02-03',
      firstTargetSpawn: 'spawn',
      infrastructure: 'landBorder',
      travelMode: 'walk',
    });
    expect(parseInterPrefectureLinkObject('aomori', { type: 'transition' })).toBeNull();
  });

  it('壊れた生成データを黙って移動先に使わない', () => {
    expect(() =>
      parseInterPrefectureLinkObject('aomori', {
        ...linkObject,
        properties: linkObject.properties.map((entry) =>
          entry.name === 'travelMode' ? property('travelMode', 'airplane') : entry,
        ),
      }),
    ).toThrow('travelMode');
    expect(() =>
      parseInterPrefectureLinkObject('aomori', {
        ...linkObject,
        properties: linkObject.properties.filter((entry) => entry.name !== 'targetSpawn'),
      }),
    ).toThrow('targetSpawn');
    expect(() => parseInterPrefectureLinkObject('hokkaido', linkObject)).toThrow('同じ県');
  });

  it('初訪問だけ開始地域へ送り、開発者・訪問済み・攻略済みは県境の相互到着地点へ送る', () => {
    const link = parseInterPrefectureLinkObject('aomori', linkObject)!;
    expect(interPrefectureDestinationSpawn(link, untouchedProgress, false)).toBe('spawn');
    expect(interPrefectureDestinationSpawn(link, untouchedProgress, true)).toBe(
      'from_aomori-hokkaido-seikan',
    );
    expect(
      interPrefectureDestinationSpawn(
        link,
        { ...untouchedProgress, counters: { 'visit:hokkaido-town': 1 } },
        false,
      ),
    ).toBe('from_aomori-hokkaido-seikan');
    expect(
      interPrefectureDestinationSpawn(link, { ...untouchedProgress, areaSigns: ['hokkaido'] }, false),
    ).toBe('from_aomori-hokkaido-seikan');
    expect(
      interPrefectureDestinationSpawn(
        link,
        { ...untouchedProgress, eventsDone: ['midboss.hokkaido'] },
        false,
      ),
    ).toBe('from_aomori-hokkaido-seikan');
  });
});
