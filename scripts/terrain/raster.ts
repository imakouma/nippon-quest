/**
 * 緯度経度のポリゴンをタイル格子に落とすための幾何ユーティリティ（gen-terrain.ts 専用）。
 * 座標はすべて [x, y]。緯度経度のときは [経度, 緯度]、タイル座標のときは [列, 行]（行は下向き）。
 */
import type { BBox, LonLat } from '../data/geo.js';

export type Pt = [number, number];
export type Ring = Pt[];

const KM_PER_DEG_LAT = 110.95;
const KM_PER_DEG_LON_EQ = 111.32;

export const kmPerDegLon = (lat: number): number => KM_PER_DEG_LON_EQ * Math.cos((lat * Math.PI) / 180);
export const kmPerDegLat = (): number => KM_PER_DEG_LAT;

/** 緯度経度 → タイル座標。x = (lon - lon0) * kx + ox, y = (lat0 - lat) * ky + oy */
export interface Proj {
  lon0: number;
  lat0: number;
  kx: number;
  ky: number;
  ox: number;
  oy: number;
}

export const project = (p: Proj, [lon, lat]: LonLat): Pt => [
  (lon - p.lon0) * p.kx + p.ox,
  (p.lat0 - lat) * p.ky + p.oy,
];
export const unproject = (p: Proj, x: number, y: number): LonLat => [
  (x - p.ox) / p.kx + p.lon0,
  p.lat0 - (y - p.oy) / p.ky,
];

/** 1タイル t km になる投影。bbox の北西の角がタイル (ox, oy) に来る */
export function projFor(bbox: BBox, kmPerTile: number, ox: number, oy: number): Proj {
  const latc = (bbox[1] + bbox[3]) / 2;
  return {
    lon0: bbox[0],
    lat0: bbox[3],
    kx: kmPerDegLon(latc) / kmPerTile,
    ky: KM_PER_DEG_LAT / kmPerTile,
    ox,
    oy,
  };
}

export function ringBBox(ring: Ring): BBox {
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const [x, y] of ring) {
    if (x < w) w = x;
    if (x > e) e = x;
    if (y < s) s = y;
    if (y > n) n = y;
  }
  return [w, s, e, n];
}

export const bboxIntersects = (a: BBox, b: BBox): boolean =>
  a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];
export const bboxUnion = (a: BBox, b: BBox): BBox => [
  Math.min(a[0], b[0]),
  Math.min(a[1], b[1]),
  Math.max(a[2], b[2]),
  Math.max(a[3], b[3]),
];

/** 緯度経度リングの面積（km²、符号なし） */
export function ringAreaKm2(ring: Ring): number {
  const [, s, , n] = ringBBox(ring);
  const kx = kmPerDegLon((s + n) / 2);
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const pi = ring[i]!;
    const pj = ring[j]!;
    a += (pj[0] * kx + pi[0] * kx) * (pj[1] - pi[1]) * KM_PER_DEG_LAT;
  }
  return Math.abs(a / 2);
}

/** 楕円の湖をリングにする。r は [東西の半径km, 南北の半径km]、rot は東から反時計回りの角度 */
export function ellipseRing(center: LonLat, r: [number, number], rotDeg = 0, n = 36): Ring {
  const [lon, lat] = center;
  const rot = (rotDeg * Math.PI) / 180;
  const ring: Ring = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const ex = Math.cos(t) * r[0];
    const ey = Math.sin(t) * r[1];
    const kmE = ex * Math.cos(rot) - ey * Math.sin(rot);
    const kmN = ex * Math.sin(rot) + ey * Math.cos(rot);
    ring.push([lon + kmE / kmPerDegLon(lat), lat + kmN / KM_PER_DEG_LAT]);
  }
  return ring;
}

/**
 * タイル座標のリング群（偶奇規則。穴やマルチポリゴンもそのまま渡せる）が各マスを覆う割合 0〜1。
 * 横方向は正確に、縦方向は1マスあたり samples 本の走査線で近似する。
 */
export function coverage(rings: Ring[], w: number, h: number, samples = 6): Float32Array {
  const cov = new Float32Array(w * h);
  const xs: number[] = [];
  for (let s = 0; s < h * samples; s++) {
    const yy = (s + 0.5) / samples;
    const row = Math.floor(yy);
    xs.length = 0;
    for (const ring of rings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [x1, y1] = ring[j]!;
        const [x2, y2] = ring[i]!;
        if (y1 <= yy !== y2 <= yy) xs.push(x1 + ((yy - y1) * (x2 - x1)) / (y2 - y1));
      }
    }
    if (xs.length < 2) continue;
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.max(0, xs[k]!);
      const b = Math.min(w, xs[k + 1]!);
      for (let cx = Math.floor(a); cx < b; cx++) {
        const overlap = Math.min(b, cx + 1) - Math.max(a, cx);
        if (overlap > 0) cov[row * w + cx]! += overlap / samples;
      }
    }
  }
  return cov;
}

/** 4近傍の連結成分。mask が偽のマスは -1 */
export function components(
  mask: ArrayLike<boolean>,
  w: number,
  h: number,
): { label: Int32Array; sizes: number[] } {
  const label = new Int32Array(w * h).fill(-1);
  const sizes: number[] = [];
  const stack: number[] = [];
  for (let start = 0; start < w * h; start++) {
    if (!mask[start] || label[start] !== -1) continue;
    const id = sizes.length;
    let size = 0;
    label[start] = id;
    stack.push(start);
    while (stack.length) {
      const i = stack.pop()!;
      size++;
      const x = i % w;
      const y = (i - x) / w;
      const next = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
      for (const j of next) {
        if (j >= 0 && mask[j] && label[j] === -1) {
          label[j] = id;
          stack.push(j);
        }
      }
    }
    sizes.push(size);
  }
  return { label, sizes };
}

/**
 * 斜めにしか接していない陸どうしを、4方向に歩いて渡れるようにつなぐ（主人公は斜めに歩けない）。
 * つなぐために陸にしたマスの番号を返す。score が高いマスほど優先して陸にする。
 */
export function joinDiagonals(mask: boolean[], w: number, h: number, score: (i: number) => number): number[] {
  const flipped: number[] = [];
  for (let pass = 0; pass < 50; pass++) {
    const { label } = components(mask, w, h);
    let changed = false;
    for (let y = 0; y < h - 1 && !changed; y++) {
      for (let x = 0; x < w - 1 && !changed; x++) {
        const a = y * w + x;
        const b = a + 1;
        const c = a + w;
        const d = c + 1;
        const pairs: [number, number, number, number][] = [
          [a, d, b, c],
          [b, c, a, d],
        ];
        for (const [p, q, r1, r2] of pairs) {
          if (mask[p] && mask[q] && !mask[r1] && !mask[r2] && label[p] !== label[q]) {
            const pick = score(r1) >= score(r2) ? r1 : r2;
            mask[pick] = true;
            flipped.push(pick);
            changed = true;
            break;
          }
        }
      }
    }
    if (!changed) break;
  }
  return flipped;
}
