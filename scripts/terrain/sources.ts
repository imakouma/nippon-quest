/**
 * gen-terrain.ts が使う元データの取得。ダウンロードしたものは .cache/terrain/ に置き、2回目からはネットに行かない。
 *   - 県境・海岸線: 地球地図日本（国土地理院）を dataofjapan/land が GeoJSON にしたもの
 *   - 琵琶湖の形: Natural Earth（パブリックドメイン）
 *   - 標高: 国土地理院 標高タイル（DEM10B, ズーム8）
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BBox } from '../data/geo.js';
import type { Ring } from './raster.js';

const CACHE = fileURLToPath(new URL('../../.cache/terrain/', import.meta.url));

const PREFECTURES_URL = 'https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson';
const LAKES_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_lakes.geojson';
const DEM_URL = (z: number, x: number, y: number) =>
  `https://cyberjapandata.gsi.go.jp/xyz/dem/${z}/${x}/${y}.txt`;
const DEM_ZOOM = 8;

export const ATTRIBUTION = [
  '県境・海岸線: 地球地図日本（国土地理院） https://www.gsi.go.jp/kankyochiri/gm_jpn.html を dataofjapan/land が変換したもの',
  '標高: 国土地理院 標高タイル（DEM10B） https://maps.gsi.go.jp/development/ichiran.html',
  '琵琶湖: Natural Earth（パブリックドメイン）',
];

/** キャッシュにあればそれを、なければ取得して保存。404 は null */
async function fetchCached(url: string, file: string): Promise<string | null> {
  const path = `${CACHE}${file}`;
  if (existsSync(path)) {
    const text = readFileSync(path, 'utf8');
    return text === '' ? null : text;
  }
  const res = await fetch(url);
  if (res.status === 404) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, '');
    return null;
  }
  if (!res.ok) throw new Error(`${url} の取得に失敗しました (${res.status})`);
  const text = await res.text();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  return text;
}

interface Feature {
  properties: Record<string, unknown>;
  geometry: { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] };
}

const ringsOf = (g: Feature['geometry']): Ring[][] =>
  g.type === 'Polygon' ? [g.coordinates] : g.coordinates;

/** 都道府県コード（1〜47）→ その県のポリゴン（外周＋穴のリング）の一覧 */
export async function loadPrefectures(): Promise<Map<number, Ring[][]>> {
  const text = await fetchCached(PREFECTURES_URL, 'japan.geojson');
  if (!text) throw new Error('japan.geojson が見つかりません');
  const out = new Map<number, Ring[][]>();
  for (const f of (JSON.parse(text) as { features: Feature[] }).features) {
    out.set(Number(f.properties.id), ringsOf(f.geometry));
  }
  return out;
}

/** 琵琶湖のリング */
export async function loadBiwa(): Promise<Ring[]> {
  const text = await fetchCached(LAKES_URL, 'ne_10m_lakes.geojson');
  if (!text) throw new Error('ne_10m_lakes.geojson が見つかりません');
  const biwa = (JSON.parse(text) as { features: Feature[] }).features.find(
    (f) => f.properties.name === 'Biwa Ko',
  );
  if (!biwa) throw new Error('Natural Earth に琵琶湖がありません');
  return ringsOf(biwa.geometry).flat();
}

const tileX = (lon: number, z: number) => ((lon + 180) / 360) * 2 ** z;
const tileY = (lat: number, z: number) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2) * 2 ** z;
};

/** bbox 群を覆う標高タイルを読み、(経度, 緯度) → 標高m（海や欠測は NaN）を返す */
export async function loadDem(bboxes: BBox[]): Promise<(lon: number, lat: number) => number> {
  const z = DEM_ZOOM;
  const keys = new Set<string>();
  for (const [w, s, e, n] of bboxes) {
    for (let x = Math.floor(tileX(w, z)); x <= Math.floor(tileX(e, z)); x++) {
      for (let y = Math.floor(tileY(n, z)); y <= Math.floor(tileY(s, z)); y++) keys.add(`${x}/${y}`);
    }
  }
  const tiles = new Map<string, Float32Array | null>();
  let done = 0;
  for (const key of keys) {
    const [x, y] = key.split('/').map(Number) as [number, number];
    const text = await fetchCached(DEM_URL(z, x, y), `dem/${z}/${x}/${y}.txt`);
    done++;
    if (done % 20 === 0) console.log(`  標高タイル ${done}/${keys.size}`);
    if (!text) {
      tiles.set(key, null);
      continue;
    }
    const grid = new Float32Array(256 * 256).fill(NaN);
    text
      .trim()
      .split('\n')
      .forEach((line, row) =>
        line.split(',').forEach((v, col) => {
          if (row < 256 && col < 256 && v !== 'e') grid[row * 256 + col] = Number(v);
        }),
      );
    tiles.set(key, grid);
  }
  return (lon, lat) => {
    const fx = tileX(lon, z);
    const fy = tileY(lat, z);
    const grid = tiles.get(`${Math.floor(fx)}/${Math.floor(fy)}`);
    if (!grid) return NaN;
    const px = Math.min(255, Math.floor((fx - Math.floor(fx)) * 256));
    const py = Math.min(255, Math.floor((fy - Math.floor(fy)) * 256));
    return grid[py * 256 + px] ?? NaN;
  };
}
