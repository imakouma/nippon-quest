import type { MapPanel, WorldMapData } from './worldMapModel';

export const NATIONAL_MAP_SIZE = 200;

type NationalMapSource = Pick<WorldMapData['regions'][number], 'id' | 'width' | 'height' | 'panels' | 'rows'>;

export interface NationalMapRaster {
  width: number;
  height: number;
  sourceIds: string[];
  /** public/worldmap.json の regions 配列上の番号。海は -1。 */
  regionAt: Int16Array;
  /** 各 region.areas 配列上の番号。海は -1。 */
  areaAt: Int16Array;
}

export interface NationalMapHighlight {
  selected: Uint8Array;
  /** 選択地方のすぐ外側にある、実形状どおりの1マス輪郭。 */
  outline: Uint8Array;
  /** 輪郭を1として外側へ4マスまで広がる発光距離。 */
  glowDistance: Uint8Array;
}

const MAIN = {
  lon0: 129.2,
  lat0: 45.8,
  x: 24,
  y: 6,
  scale: 11.6,
  cos: 0.786,
};

/** 沖縄は本土を読みやすい大きさに保つため、南西の海へ小さく移して表示する。 */
const OKINAWA = {
  lon0: 127.5,
  lat0: 27,
  x: 8,
  y: 174,
  scale: 14,
  cos: 0.899,
};

const isOkinawaPanel = (panel: MapPanel): boolean => panel.bbox[3] < 30;

function nationalToLonLat(x: number, y: number, inset: boolean): [number, number] {
  const view = inset ? OKINAWA : MAIN;
  return [view.lon0 + (x - view.x) / (view.scale * view.cos), view.lat0 - (y - view.y) / view.scale];
}

function cellAt(region: NationalMapSource, panel: MapPanel, lon: number, lat: number): number {
  const [left, bottom, right, top] = panel.bbox;
  if (lon < left || lon > right || lat < bottom || lat > top) return -1;
  const x = Math.floor((lon - panel.proj.lon0) * panel.proj.kx + panel.proj.ox);
  const y = Math.floor((panel.proj.lat0 - lat) * panel.proj.ky + panel.proj.oy);
  const value = region.rows[y]?.[x];
  return value && value !== '.' ? value.charCodeAt(0) - 97 : -1;
}

function sourceCellAt(
  regions: readonly NationalMapSource[],
  lon: number,
  lat: number,
  inset: boolean,
): [number, number] | null {
  for (let regionIndex = 0; regionIndex < regions.length; regionIndex++) {
    const region = regions[regionIndex]!;
    for (const panel of region.panels) {
      if (isOkinawaPanel(panel) !== inset) continue;
      const areaIndex = cellAt(region, panel, lon, lat);
      if (areaIndex >= 0) return [regionIndex, areaIndex];
    }
  }
  return null;
}

function sampleNationalPixel(
  regions: readonly NationalMapSource[],
  x: number,
  y: number,
): [number, number] | null {
  const votes = new Map<number, { count: number; value: [number, number] }>();
  for (const offsetY of [0.25, 0.75])
    for (const offsetX of [0.25, 0.75]) {
      let value: [number, number] | null = null;
      const insetLonLat = nationalToLonLat(x + offsetX, y + offsetY, true);
      value = sourceCellAt(regions, insetLonLat[0], insetLonLat[1], true);
      if (!value) {
        const mainLonLat = nationalToLonLat(x + offsetX, y + offsetY, false);
        value = sourceCellAt(regions, mainLonLat[0], mainLonLat[1], false);
      }
      if (!value) continue;
      const key = value[0] * 64 + value[1];
      const vote = votes.get(key);
      if (vote) vote.count++;
      else votes.set(key, { count: 1, value });
    }
  let best: { count: number; value: [number, number] } | undefined;
  for (const vote of votes.values()) if (!best || vote.count > best.count) best = vote;
  return best?.value ?? null;
}

/**
 * 地方ごとに異なる縮尺の格子を、緯度経度を経由して同じ全国座標へ合成する。
 * 手調整の矩形へ引き伸ばさないため、隣接する地方の海岸線・県境がずれない。
 */
export function buildNationalMapRaster(
  regions: readonly NationalMapSource[],
  size = NATIONAL_MAP_SIZE,
): NationalMapRaster {
  const regionAt = new Int16Array(size * size).fill(-1);
  const areaAt = new Int16Array(size * size).fill(-1);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const value = sampleNationalPixel(
        regions,
        (x / size) * NATIONAL_MAP_SIZE,
        (y / size) * NATIONAL_MAP_SIZE,
      );
      if (!value) continue;
      const index = y * size + x;
      regionAt[index] = value[0];
      areaAt[index] = value[1];
    }
  return {
    width: size,
    height: size,
    sourceIds: regions.map((region) => region.id),
    regionAt,
    areaAt,
  };
}

const neighbourIndexes = (index: number, width: number, height: number): number[] => {
  const x = index % width;
  const y = Math.floor(index / width);
  return [
    ...(x > 0 ? [index - 1] : []),
    ...(x < width - 1 ? [index + 1] : []),
    ...(y > 0 ? [index - width] : []),
    ...(y < height - 1 ? [index + width] : []),
  ];
};

export function buildNationalMapHighlight(
  raster: NationalMapRaster,
  selectedSourceIds: readonly string[],
): NationalMapHighlight {
  const selectedIndexes = new Set(
    selectedSourceIds.map((id) => raster.sourceIds.indexOf(id)).filter((index) => index >= 0),
  );
  const selected = Uint8Array.from(raster.regionAt, (regionIndex) =>
    selectedIndexes.has(regionIndex) ? 1 : 0,
  );
  const outline = new Uint8Array(selected.length);
  const glowDistance = new Uint8Array(selected.length);
  const queue: number[] = [];
  for (let index = 0; index < selected.length; index++) {
    if (selected[index]) continue;
    if (!neighbourIndexes(index, raster.width, raster.height).some((next) => selected[next])) continue;
    outline[index] = 1;
    glowDistance[index] = 1;
    queue.push(index);
  }
  for (let head = 0; head < queue.length; head++) {
    const index = queue[head]!;
    const distance = glowDistance[index]!;
    if (distance >= 4) continue;
    for (const next of neighbourIndexes(index, raster.width, raster.height)) {
      if (selected[next] || glowDistance[next]) continue;
      glowDistance[next] = distance + 1;
      queue.push(next);
    }
  }
  return { selected, outline, glowDistance };
}
