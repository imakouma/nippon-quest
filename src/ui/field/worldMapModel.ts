export interface MapProjection {
  lon0: number;
  lat0: number;
  kx: number;
  ky: number;
  ox: number;
  oy: number;
}

export interface MapPanel {
  bbox: [number, number, number, number];
  proj: MapProjection;
}

/** public/worldmap.json の形 */
export interface WorldMapData {
  regions: {
    id: string;
    width: number;
    height: number;
    /** 地方ごとに異なる格子を全国共通の地理座標へ戻すための投影情報 */
    panels: MapPanel[];
    /** '.' は海、'a' + i は areas[i] の県 */
    rows: string[];
    areas: { id: string; capital: [number, number]; stamps: string[] }[];
  }[];
}

export interface MapAreaInfo {
  id: string;
  name: string;
  capital: [number, number];
  stamps: { name: string | null; box: boolean }[];
  boss: 'done' | 'yet' | 'none';
  visited: boolean;
}

export interface MapRegionInfo {
  id: string;
  name: string;
  width: number;
  height: number;
  panels: MapPanel[];
  rows: string[];
  areas: MapAreaInfo[];
  status: 'playable' | 'stub';
  islandBoss: {
    name: string;
    state: 'locked' | 'ready' | 'done';
    foundSigns: number;
    requiredSigns: number;
  };
}

export interface RegionGrid {
  width: number;
  height: number;
  rows: string[];
  areas: { capital: [number, number] }[];
}

/** rows の 1 文字 → 県の番号（海は -1） */
export function areaAt(region: RegionGrid, x: number, y: number): number {
  const cell = region.rows[y]?.[x];
  return cell && cell !== '.' ? cell.charCodeAt(0) - 97 : -1;
}
