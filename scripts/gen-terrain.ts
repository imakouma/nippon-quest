/**
 * 実在の地理（県境・海岸線・湖・標高）から各マップの地形を作り、scripts/data/terrain.json に書き出す。
 *   pnpm gen:terrain
 * 初回だけ元データをネットから取ってくる（.cache/terrain/ に保存。出典は terrain.json の sources）。
 * Tiled のマップ本体は scaffold-maps.ts が terrain.json から作る。
 *
 * 地形の記号
 *   field / enclave : '.' 海  '~' 湖  '#' 平地  '^' 山地  'A' 高い山  'x' 県外の陸地（通れない）
 *   island          : '.' 海  '~' 湖  'x' 地方の外の陸地（通れない）  'a','b',… その地方の県（areas の順）
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { ENCLAVES, ISLANDS, PREFECTURES } from './data/prefectures.js';
import {
  CAPITALS,
  ENCLAVE_GEO,
  FIELD_BBOX,
  LAKES,
  REGION_INSETS,
  type BBox,
  type LonLat,
} from './data/geo.js';
import {
  bboxIntersects,
  bboxUnion,
  components,
  coverage,
  ellipseRing,
  joinDiagonals,
  kmPerDegLat,
  kmPerDegLon,
  project,
  projFor,
  ringAreaKm2,
  ringBBox,
  unproject,
  type Proj,
  type Ring,
} from './terrain/raster.js';
import { ATTRIBUTION, loadBiwa, loadDem, loadPrefectures } from './terrain/sources.js';

const OUT = fileURLToPath(new URL('./data/terrain.json', import.meta.url));

/** カメラ（960x540 をズーム2）に映る 30x17 タイルより小さいマップは作らない */
const MIN_W = 32;
const MIN_H = 20;
/** 複数の島を1枚に並べるときの間の海 */
const GAP = 3;

/**
 * 歩くマップ（フィールド・離島）の広さ。はじめの大きさ（52x44・陸 700 マス）の縦横 1.95 倍
 * （1.3 倍にしたあと、2026-09-15 に「マップの広さは 1.5 倍に」と言われて 1.3 × 1.5）
 */
const WALK_SCALE = 1.95;
const FIELD = {
  margin: 3,
  maxW: Math.round(52 * WALK_SCALE),
  maxH: Math.round(44 * WALK_SCALE),
  landTiles: Math.round(700 * WALK_SCALE ** 2),
};
/**
 * 名所エリアに 分けた 県は、エリアごとに 歩ける 広さが いるので さらに 広げる（縦横の 倍率）。
 * 2026-09-30 に 青森を 名所エリアに 分けたとき「島を 広くしても かまわない」と 言われた
 */
const FIELD_EXTRA_SCALE: Readonly<Record<string, number>> = { aomori: 1.5 };
/** にほんちずの地方の図（見るだけの地図）は、広げない */
const ISLAND = { margin: 2, maxW: 44, maxH: 46 };
const ENCLAVE = { margin: 2, maxW: Math.round(44 * WALK_SCALE), maxH: Math.round(34 * WALK_SCALE) };

/** マスの何割がその県なら、その県の陸にするか */
const OWN_MIN = 0.45;
const LAND_MIN = 0.5;
const LAKE_MIN = 0.45;
const MOUNTAIN_M = 600;
const HIGH_MOUNTAIN_M = 1800;

export interface TerrainPanel {
  bbox: BBox;
  proj: Proj;
}

export interface TerrainMap {
  kind: 'field' | 'island' | 'enclave';
  /** field / enclave: その県の id */
  area?: string;
  /** island: rows の 'a' + i が areas[i] */
  areas?: string[];
  kmPerTile: number;
  width: number;
  height: number;
  panels: TerrainPanel[];
  rows: string[];
}

interface Poly {
  rings: Ring[];
  bbox: BBox;
  areaKm2: number;
}

interface Panel extends TerrainPanel {
  /** 格子のうち、この島の投影で塗る範囲 [x0, y0, x1, y1)（1枚だけならマップ全体） */
  rect: [number, number, number, number];
}

interface Grid {
  width: number;
  height: number;
  kmPerTile: number;
  panels: Panel[];
}

const sizeKm = (b: BBox): [number, number] => [
  (b[2] - b[0]) * kmPerDegLon((b[1] + b[3]) / 2),
  (b[3] - b[1]) * kmPerDegLat(),
];

function layoutPanels(bboxes: BBox[], kmPerTile: number, margin: number): Grid {
  const sizes = bboxes.map(
    (b) => sizeKm(b).map((v) => Math.max(1, Math.ceil(v / kmPerTile))) as [number, number],
  );
  const innerW = sizes.reduce((a, s) => a + s[0], 0) + GAP * (bboxes.length - 1);
  const innerH = Math.max(...sizes.map((s) => s[1]));
  const width = Math.max(MIN_W, innerW + margin * 2);
  const height = Math.max(MIN_H, innerH + margin * 2);
  const top = Math.floor((height - innerH) / 2);
  let x = Math.floor((width - innerW) / 2);
  const panels = bboxes.map((bbox, i): Panel => {
    const [w, h] = sizes[i]!;
    const y = top + innerH - h; // 下そろえ（沖縄を左下に入れる地図の書き方）
    const rect: Panel['rect'] =
      bboxes.length === 1
        ? [0, 0, width, height]
        : [Math.max(0, x - 1), Math.max(0, y - 1), Math.min(width, x + w + 1), Math.min(height, y + h + 1)];
    const panel = { bbox, proj: projFor(bbox, kmPerTile, x, y), rect };
    x += w + GAP;
    return panel;
  });
  return { width, height, kmPerTile, panels };
}

function fitScale(bboxes: BBox[], maxW: number, maxH: number): number {
  const sizes = bboxes.map(sizeKm);
  return Math.max(
    sizes.reduce((a, s) => a + s[0], 0) / (maxW - GAP * (bboxes.length - 1)),
    Math.max(...sizes.map((s) => s[1])) / maxH,
  );
}

function rectBBox(p: Panel): BBox {
  const [x0, y0, x1, y1] = p.rect;
  const [w, n] = unproject(p.proj, x0, y0);
  const [e, s] = unproject(p.proj, x1, y1);
  return [w, s, e, n];
}

function centroid(ring: Ring): LonLat {
  const sx = ring.reduce((a, p) => a + p[0], 0);
  const sy = ring.reduce((a, p) => a + p[1], 0);
  return [sx / ring.length, sy / ring.length];
}

/** 最大の陸地の範囲を少し広げ、そこにかかる島も入れる */
function autoBBox(list: Poly[]): BBox {
  const main = list.reduce((a, p) => (p.areaKm2 > a.areaKm2 ? p : a));
  const [w, s, e, n] = main.bbox;
  const dx = (e - w) * 0.08;
  const dy = (n - s) * 0.08;
  const near: BBox = [w - dx, s - dy, e + dx, n + dy];
  return list.filter((p) => bboxIntersects(p.bbox, near)).reduce((a, p) => bboxUnion(a, p.bbox), main.bbox);
}

async function main(): Promise<void> {
  console.log('元データを読み込み中…');
  const raw = await loadPrefectures();
  const polys = new Map<string, Poly[]>();
  for (const p of PREFECTURES) {
    const list = raw.get(Number(p.code));
    if (!list) throw new Error(`${p.id} の県境データがありません`);
    polys.set(
      p.id,
      list.map((rings) => ({ rings, bbox: ringBBox(rings[0]!), areaKm2: ringAreaKm2(rings[0]!) })),
    );
  }
  const allIds = PREFECTURES.map((p) => p.id);
  const biwa = await loadBiwa();
  const lakeRings: Ring[] = [
    ...biwa,
    ...LAKES.map((l) => ('ring' in l ? l.ring : ellipseRing(l.center, l.r, l.rot))),
  ];
  const lakeCenters: LonLat[] = [
    centroid(biwa[0]!),
    ...LAKES.map((l) => ('ring' in l ? centroid(l.ring) : l.center)),
  ];

  const fieldBBox = new Map(allIds.map((id) => [id, FIELD_BBOX[id] ?? autoBBox(polys.get(id)!)]));

  const demBoxes = [
    ...[...fieldBBox.values()].map((b): BBox => [b[0] - 0.1, b[1] - 0.1, b[2] + 0.1, b[3] + 0.1]),
    ...Object.values(ENCLAVE_GEO).flatMap((e) => e.panels),
  ];
  console.log('標高タイルを読み込み中…');
  const elevation = await loadDem(demBoxes);

  const ringsIn = (ids: string[], box: BBox): Ring[] =>
    ids.flatMap((id) =>
      polys
        .get(id)!
        .filter((p) => bboxIntersects(p.bbox, box))
        .flatMap((p) => p.rings),
    );

  /** panel の担当範囲について、リング群の被覆率を格子全体の配列 out に書き込む */
  const coverInto = (out: Float32Array, grid: Grid, panel: Panel, rings: Ring[]): void => {
    const [x0, y0, x1, y1] = panel.rect;
    const w = x1 - x0;
    const h = y1 - y0;
    const local: Proj = { ...panel.proj, ox: panel.proj.ox - x0, oy: panel.proj.oy - y0 };
    const cov = coverage(
      rings.map((r) => r.map((pt) => project(local, pt))),
      w,
      h,
    );
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) out[(y + y0) * grid.width + x + x0] = cov[y * w + x]!;
    }
  };

  /** 各マスがどの panel の投影で塗られたか（-1 は panel の外＝海） */
  const panelIndex = (grid: Grid): Int8Array => {
    const idx = new Int8Array(grid.width * grid.height).fill(-1);
    grid.panels.forEach((p, k) => {
      const [x0, y0, x1, y1] = p.rect;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) idx[y * grid.width + x] = k;
    });
    return idx;
  };

  const lakeLayer = (grid: Grid, cells: string[], isLand: (c: string) => boolean): void => {
    const lake = new Float32Array(grid.width * grid.height);
    for (const p of grid.panels) {
      const box = rectBBox(p);
      coverInto(
        lake,
        grid,
        p,
        lakeRings.filter((r) => bboxIntersects(ringBBox(r), box)),
      );
    }
    cells.forEach((c, i) => {
      if (isLand(c) && lake[i]! >= LAKE_MIN) cells[i] = '~';
    });
    // 小さい湖も、中心のマスだけは必ず水にする
    for (const center of lakeCenters) {
      for (const p of grid.panels) {
        const [x, y] = project(p.proj, center).map(Math.floor) as [number, number];
        const [x0, y0, x1, y1] = p.rect;
        if (x < x0 || y < y0 || x >= x1 || y >= y1) continue;
        const i = y * grid.width + x;
        if (isLand(cells[i]!)) cells[i] = '~';
      }
    }
  };

  const toRows = (grid: Grid, cells: string[]): string[] =>
    Array.from({ length: grid.height }, (_, y) => cells.slice(y * grid.width, (y + 1) * grid.width).join(''));

  const output = (
    kind: TerrainMap['kind'],
    grid: Grid,
    cells: string[],
    extra: Partial<TerrainMap>,
  ): TerrainMap => ({
    kind,
    ...extra,
    kmPerTile: Math.round(grid.kmPerTile * 100) / 100,
    width: grid.width,
    height: grid.height,
    panels: grid.panels.map(({ bbox, proj }) => ({
      bbox,
      proj: Object.fromEntries(
        Object.entries(proj).map(([k, v]) => [k, Math.round(v * 1e6) / 1e6]),
      ) as unknown as Proj,
    })),
    rows: toRows(grid, cells),
  });

  /** 1つの県の陸と、まわりの海・県外の陸・湖・山 */
  const buildOwn = (kind: 'field' | 'enclave', area: string, grid: Grid): TerrainMap => {
    const n = grid.width * grid.height;
    const own = new Float32Array(n);
    const all = new Float32Array(n);
    for (const p of grid.panels) {
      const box = rectBBox(p);
      coverInto(own, grid, p, ringsIn([area], box));
      coverInto(all, grid, p, ringsIn(allIds, box));
    }
    const pIdx = panelIndex(grid);
    const cells: string[] = Array.from({ length: n }, (_, i) => {
      if (pIdx[i] === -1) return '.';
      if (own[i]! >= OWN_MIN) return '#';
      if (all[i]! >= LAND_MIN) return own[i]! > all[i]! - own[i]! ? '#' : 'x';
      return '.';
    });
    lakeLayer(grid, cells, (c) => c === '#' || c === 'x');
    // 県境にかかる湖（十和田湖など）は、県の外の陸（x ＝ 海の色でかく）や海とつながって湖に見えないので、
    // 湖のまわり 2 マスの x・海を陸にして、湖を陸でかこむ（1 マスだと細い土手に見えて湖らしくない）
    const SHORE = 2;
    const shore: number[] = [];
    cells.forEach((c, i) => {
      if (c !== '~') return;
      const x = i % grid.width;
      for (let dy = -SHORE; dy <= SHORE; dy++)
        for (let dx = -SHORE; dx <= SHORE; dx++) {
          const j = i + dy * grid.width + dx;
          if (x + dx < 0 || x + dx >= grid.width || j < 0 || j >= n || pIdx[j] === -1) continue;
          if (cells[j] === 'x' || cells[j] === '.') shore.push(j);
        }
    });
    for (const j of shore) cells[j] = '#';
    const mask = cells.map((c) => c === '#');
    for (const i of joinDiagonals(mask, grid.width, grid.height, (i) => (cells[i] === '~' ? -1 : own[i]!))) {
      cells[i] = '#';
    }
    cells.forEach((c, i) => {
      if (c !== '#') return;
      const panel = grid.panels[pIdx[i]!]!;
      const x = i % grid.width;
      const y = (i - x) / grid.width;
      let sum = 0;
      let count = 0;
      for (const fy of [0.2, 0.5, 0.8]) {
        for (const fx of [0.2, 0.5, 0.8]) {
          const v = elevation(...unproject(panel.proj, x + fx, y + fy));
          if (!Number.isNaN(v)) {
            sum += v;
            count++;
          }
        }
      }
      const mean = count ? sum / count : 0;
      if (mean >= HIGH_MOUNTAIN_M) cells[i] = 'A';
      else if (mean >= MOUNTAIN_M) cells[i] = '^';
    });
    return output(kind, grid, cells, { area });
  };

  /** 地方の県を色分けした地図 */
  const buildIsland = (islandId: string): TerrainMap => {
    const areas = PREFECTURES.filter((p) => p.island === islandId).map((p) => p.id);
    const insets = REGION_INSETS[islandId]?.areas ?? [];
    const mainBox = areas
      .filter((a) => !insets.includes(a))
      .map((a) => fieldBBox.get(a)!)
      .reduce(bboxUnion);
    const bboxes = [...insets.map((a) => fieldBBox.get(a)!), mainBox];
    const grid = layoutPanels(bboxes, fitScale(bboxes, ISLAND.maxW, ISLAND.maxH), ISLAND.margin);
    const n = grid.width * grid.height;
    const covs = areas.map(() => new Float32Array(n));
    const all = new Float32Array(n);
    for (const p of grid.panels) {
      const box = rectBBox(p);
      areas.forEach((a, k) => coverInto(covs[k]!, grid, p, ringsIn([a], box)));
      coverInto(all, grid, p, ringsIn(allIds, box));
    }
    const pIdx = panelIndex(grid);
    const best = (i: number): [number, number] => {
      let k = -1;
      let top = 0;
      let sum = 0;
      covs.forEach((c, j) => {
        sum += c[i]!;
        if (c[i]! > top) {
          top = c[i]!;
          k = j;
        }
      });
      return [k, sum];
    };
    const letter = (k: number) => String.fromCharCode(97 + k);
    const cells = Array.from({ length: n }, (_, i) => {
      if (pIdx[i] === -1) return '.';
      const [k, sum] = best(i);
      if (k >= 0 && sum >= OWN_MIN) return letter(k);
      return all[i]! >= LAND_MIN ? 'x' : '.';
    });
    // 'x'（県外）と取り違えないよう、その地方の県の数の文字だけ
    const isRegion = (c: string) => c >= 'a' && c < letter(areas.length);
    lakeLayer(grid, cells, (c) => isRegion(c) || c === 'x');
    const mask = cells.map(isRegion);
    for (const i of joinDiagonals(mask, grid.width, grid.height, (i) =>
      cells[i] === '~' ? -1 : best(i)[1],
    )) {
      const [k] = best(i);
      const x = i % grid.width;
      const neighbor = [i - 1, i + 1, i - grid.width, i + grid.width]
        .filter((j) => j >= 0 && j < n && Math.abs((j % grid.width) - x) <= 1)
        .map((j) => cells[j]!)
        .find(isRegion);
      cells[i] = k >= 0 ? letter(k) : (neighbor ?? 'a');
    }
    // 小さすぎて1マスも取れなかった県は、県庁所在地のマスだけでも置く
    areas.forEach((a, k) => {
      if (cells.includes(letter(k))) return;
      for (const p of grid.panels) {
        const [x, y] = project(p.proj, CAPITALS[a]!).map(Math.floor) as [number, number];
        if (x >= 0 && y >= 0 && x < grid.width && y < grid.height) cells[y * grid.width + x] = letter(k);
      }
    });
    return output('island', grid, cells, { areas });
  };

  const maps: Record<string, TerrainMap> = {};
  const report = (key: string, m: TerrainMap) => {
    const land = m.rows.join('').replace(/[.~x]/g, '').length;
    console.log(`  ${key.padEnd(24)} ${m.width}x${m.height}  1マス${m.kmPerTile}km  歩ける陸${land}マス`);
  };

  console.log('フィールド');
  for (const p of PREFECTURES) {
    const bbox = fieldBBox.get(p.id)!;
    const landKm2 = polys
      .get(p.id)!
      .filter((q) => bboxIntersects(q.bbox, bbox))
      .reduce((a, q) => a + q.areaKm2, 0);
    const [wkm, hkm] = sizeKm(bbox);
    const k = FIELD_EXTRA_SCALE[p.id] ?? 1;
    const t = Math.max(
      Math.sqrt(landKm2 / (FIELD.landTiles * k * k)),
      wkm / (FIELD.maxW * k),
      hkm / (FIELD.maxH * k),
    );
    const key = `${p.id}-field`;
    maps[key] = buildOwn('field', p.id, layoutPanels([bbox], t, FIELD.margin));
    report(key, maps[key]);
  }
  console.log('地方の島');
  for (const island of ISLANDS) {
    const key = `${island.id}-island`;
    maps[key] = buildIsland(island.id);
    report(key, maps[key]);
  }
  console.log('離島・飛地');
  for (const enc of ENCLAVES) {
    const geo = ENCLAVE_GEO[enc.enclaveId];
    if (!geo) throw new Error(`${enc.enclaveId} の範囲が geo.ts にありません`);
    const grid = layoutPanels(geo.panels, fitScale(geo.panels, ENCLAVE.maxW, ENCLAVE.maxH), ENCLAVE.margin);
    const m = buildOwn('enclave', enc.prefId, grid);
    maps[enc.enclaveId] = m;
    report(enc.enclaveId, m);
  }

  // 念のため: どのフィールドにも、その県の歩ける陸が連続してあること
  for (const [key, m] of Object.entries(maps)) {
    const cells = m.rows.join('');
    const { sizes } = components(
      [...cells].map((c) => c !== '.' && c !== '~' && c !== 'x'),
      m.width,
      m.height,
    );
    if (!sizes.length) throw new Error(`${key} に歩ける陸がありません`);
  }

  const data = {
    about:
      'pnpm gen:terrain が実在の地理から作ったマップの地形（手で編集しない）。記号の意味は scripts/gen-terrain.ts の先頭コメント',
    sources: ATTRIBUTION,
    maps,
  };
  const options = (await resolveConfig(OUT)) ?? {};
  writeFileSync(OUT, await format(JSON.stringify(data), { ...options, parser: 'json' }));
  console.log(`\n${Object.keys(maps).length} 枚ぶんの地形を ${OUT} に書き出しました`);
}

await main();
