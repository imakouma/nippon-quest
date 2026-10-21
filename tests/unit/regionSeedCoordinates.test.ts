import { describe, expect, it } from 'vitest';
import {
  deriveRegionSeedCoordinates,
  filterRegionSeedCoordinates,
} from '../../scripts/regions/seedCoordinates';

describe('deriveRegionSeedCoordinates', () => {
  it('地域の明示seedを優先しつつ、実在する名所とeventの座標もhard anchorとして残す', () => {
    const explicit = [
      [140.1, 39.1],
      [140.2, 39.2],
    ] as [number, number][];

    expect(
      deriveRegionSeedCoordinates(
        'akita',
        { id: 'akita-city', motifs: ['kanto'], start: true },
        {
          explicitSeeds: { 'akita-city': explicit },
          landmarkSpots: { kanto: [140.3, 39.3] },
          events: [{ motifId: 'kanto', trigger: { objectName: 'event_akita_kanto' } }],
          eventSpots: { event_akita_kanto: [140.4, 39.4] },
          capital: [140.5, 39.5],
        },
      ),
    ).toEqual([...explicit, [140.5, 39.5], [140.3, 39.3], [140.4, 39.4]]);
  });

  it('motif順に名所とeventの両方を集め、同じ地域の実オブジェクトをすべてanchorにする', () => {
    expect(
      deriveRegionSeedCoordinates(
        'iwate',
        { id: 'sanriku', motifs: ['jodogahama', 'chusonji', 'tono'] },
        {
          landmarkSpots: {
            jodogahama: [141.98, 39.64],
            tono: [141.53, 39.32],
          },
          events: [
            { motifId: 'jodogahama', trigger: { objectName: 'event_jodogahama' } },
            { motifId: 'chusonji', trigger: { objectName: 'event_chusonji' } },
          ],
          eventSpots: {
            event_jodogahama: [999, 999],
            event_chusonji: [141.1, 38.99],
          },
        },
      ),
    ).toEqual([
      [141.98, 39.64],
      [999, 999],
      [141.1, 38.99],
      [141.53, 39.32],
    ]);
  });

  it('start地域は県庁所在地を先頭に追加し、同じ座標を重複させない', () => {
    const capital: [number, number] = [140.87, 38.26];

    expect(
      deriveRegionSeedCoordinates(
        'miyagi',
        { id: 'sendai', motifs: ['sendai', 'matsushima'], start: true },
        {
          landmarkSpots: {
            sendai: capital,
            matsushima: [141.06, 38.37],
          },
          events: [],
          eventSpots: {},
          capital,
        },
      ),
    ).toEqual([capital, [141.06, 38.37]]);
  });

  it('明示seedが空なら自動候補に戻さず、県と地域を示す例外にする', () => {
    expect(() =>
      deriveRegionSeedCoordinates(
        'fukushima',
        { id: 'hamadori', motifs: ['soma'] },
        {
          explicitSeeds: { hamadori: [] },
          landmarkSpots: { soma: [140.9, 37.8] },
          events: [],
          eventSpots: {},
        },
      ),
    ).toThrow('fukushima: エリア hamadori のたねの座標がありません');
  });

  it('本土外や離島の自動候補を本土へ投影せず、非start地域は例外にする', () => {
    const islandSpot: [number, number] = [129.1, 32.7];
    const candidates = deriveRegionSeedCoordinates(
      'nagasaki',
      { id: 'goto', motifs: ['goto-retto'] },
      {
        landmarkSpots: { 'goto-retto': islandSpot },
        events: [],
        eventSpots: {},
      },
    );

    expect(() =>
      filterRegionSeedCoordinates(
        'nagasaki',
        { id: 'goto', motifs: ['goto-retto'] },
        candidates,
        () => false,
      ),
    ).toThrow('nagasaki: エリア goto のフィールド本土内にたねの座標がありません');
  });

  it('全候補がフィールド外のstart地域は、利用可能な県庁所在地へ戻す', () => {
    const capital: [number, number] = [135.18, 34.69];
    const islandSpot: [number, number] = [134.8, 34.3];

    expect(
      filterRegionSeedCoordinates(
        'hyogo',
        { id: 'kobe', motifs: ['awaji'], start: true },
        [islandSpot],
        ([lon]) => lon === capital[0],
        capital,
      ),
    ).toEqual([capital]);
  });
});
