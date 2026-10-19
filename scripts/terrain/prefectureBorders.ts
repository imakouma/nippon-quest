import type { LonLat } from '../data/geo.js';
import type { Ring } from './raster.js';

export interface LandBorderLink {
  id: string;
  areas: [string, string];
  anchor: LonLat;
  infrastructure: 'landBorder';
  travelMode: 'walk';
}

interface PrefectureIdentity {
  code: string;
  id: string;
}

interface Segment {
  a: LonLat;
  b: LonLat;
  owners: Set<string>;
}

const pointKey = ([lon, lat]: LonLat): string => `${lon},${lat}`;

function segmentKey(a: LonLat, b: LonLat): string {
  const ak = pointKey(a);
  const bk = pointKey(b);
  return ak < bk ? `${ak}|${bk}` : `${bk}|${ak}`;
}

function representativeAnchor(segments: readonly Segment[]): LonLat {
  const vertices = new Map<string, LonLat>();
  for (const { a, b } of segments) {
    vertices.set(pointKey(a), a);
    vertices.set(pointKey(b), b);
  }
  const points = [...vertices.values()];
  if (points.length < 2) throw new Error('共有県境の頂点が2点未満です');
  const center: LonLat = [
    points.reduce((sum, point) => sum + point[0], 0) / points.length,
    points.reduce((sum, point) => sum + point[1], 0) / points.length,
  ];
  return points.sort(
    (a, b) =>
      (a[0] - center[0]) ** 2 +
        (a[1] - center[1]) ** 2 -
        ((b[0] - center[0]) ** 2 + (b[1] - center[1]) ** 2) ||
      a[0] - b[0] ||
      a[1] - b[1],
  )[0]!;
}

/**
 * 国土地理院由来の同一線分を共有する県だけを陸上隣接とする。
 * 点で触れるだけの県は含めない。岡山―香川の海上境界は瀬戸大橋リンクへ分離する。
 */
export function deriveLandBorderLinks(
  raw: ReadonlyMap<number, Ring[][]>,
  prefectures: readonly PrefectureIdentity[],
  excludedPairs: readonly (readonly [string, string])[] = [['okayama', 'kagawa']],
): LandBorderLink[] {
  const rank = new Map(prefectures.map((prefecture, index) => [prefecture.id, index]));
  const segments = new Map<string, Segment>();

  for (const prefecture of prefectures) {
    const polygons = raw.get(Number(prefecture.code));
    if (!polygons) throw new Error(`${prefecture.id}: 県境データがありません`);
    for (const polygon of polygons)
      for (const ring of polygon)
        for (let index = 0; index + 1 < ring.length; index += 1) {
          const a = ring[index]!;
          const b = ring[index + 1]!;
          if (a[0] === b[0] && a[1] === b[1]) continue;
          const key = segmentKey(a, b);
          const segment = segments.get(key) ?? { a, b, owners: new Set<string>() };
          segment.owners.add(prefecture.id);
          segments.set(key, segment);
        }
  }

  const canonicalPair = (a: string, b: string): [string, string] =>
    (rank.get(a) ?? Infinity) <= (rank.get(b) ?? Infinity) ? [a, b] : [b, a];
  const excluded = new Set(excludedPairs.map(([a, b]) => canonicalPair(a, b).join('|')));
  const byPair = new Map<string, Segment[]>();
  for (const segment of segments.values()) {
    const owners = [...segment.owners].sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0));
    for (let a = 0; a < owners.length; a += 1)
      for (let b = a + 1; b < owners.length; b += 1) {
        const pair = canonicalPair(owners[a]!, owners[b]!);
        const key = pair.join('|');
        if (!excluded.has(key)) byPair.set(key, [...(byPair.get(key) ?? []), segment]);
      }
  }

  return [...byPair.entries()]
    .map(([key, shared]): LandBorderLink => {
      const areas = key.split('|') as [string, string];
      return {
        id: `land-${areas[0]}-${areas[1]}`,
        areas,
        anchor: representativeAnchor(shared),
        infrastructure: 'landBorder',
        travelMode: 'walk',
      };
    })
    .sort(
      (a, b) =>
        (rank.get(a.areas[0]) ?? 0) - (rank.get(b.areas[0]) ?? 0) ||
        (rank.get(a.areas[1]) ?? 0) - (rank.get(b.areas[1]) ?? 0),
    );
}
