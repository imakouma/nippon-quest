/**
 * 都道府県のフィールド・町・ダンジョン、離島（飛地）の Tiled JSON マップと、にほんちずの地図データを一括生成するスクリプト。
 *   pnpm scaffold:maps          (未作成のみ)
 *   pnpm scaffold:maps --force  (既存マップを上書き)
 *   pnpm scaffold:maps --force --only=aomori  (その県の フィールドだけ 作りなおす。ほかの マップ・にほんちずは さわらない)
 *
 * フィールド・離島・にほんちずの地形は scripts/data/terrain.json（pnpm gen:terrain が実在の地理から作る）を使う。
 * 町（県庁所在地）・ダンジョン・名所・港も、実際の場所に置く（位置は scripts/data/geo.ts）。
 * 県のフィールドは、県の外の陸地も海として描く（県はそれぞれ海にかこまれた島。
 * となりの県へは、中ボスを倒すと開くワープホールか、にほんちずから行く）。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import {
  ENCLAVES,
  ISLANDS,
  PREFECTURES,
  type EnclaveDef,
  type PrefectureMaster,
} from './data/prefectures.js';
import {
  CAPITALS,
  DUNGEON_SPOTS,
  ENCLAVE_GEO,
  EVENT_SPOTS,
  LANDMARK_SPOTS,
  FIELD_ALL_GRASS,
  REGION_LOOKS,
  REGION_SEEDS,
  REGION_VILLAGES,
  STRUCTURE_SIZE,
  type LonLat,
  type StructureKind,
} from './data/geo.js';
import {
  CITY_LOOKS,
  TOWN_THEMES,
  type CityBuilding,
  type CitySign,
  type TownField,
  type TownLamp,
  type TownRoof,
  type TownTheme,
  type TownTree,
} from './data/towns.js';
import { SECRET_SPOTS } from './data/secrets.js';
import { components, project } from './terrain/raster.js';
import { createRng } from '../src/core/rng.js';
import { GROUND_TILES, type Ground } from '../src/core/world/ground.js';
import type { TerrainMap } from './gen-terrain.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIRS = [`${ROOT}maps/`, `${ROOT}public/maps/`];

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.find((a) => a.startsWith('--only='))?.slice('--only='.length);

DIRS.forEach((dir) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

const TERRAIN = (
  JSON.parse(readFileSync(`${ROOT}scripts/data/terrain.json`, 'utf8')) as { maps: Record<string, TerrainMap> }
).maps;

/** 地形記号 → タイル番号（src/scenes/overworld/fieldArt.ts の仮タイルセットと対応）。県の外の陸地（x）も海（3） */
const TILE: Record<string, number> = { '.': 3, '~': 3, '#': 1, '^': 11, A: 12, x: 3, W: 159 };
/** にほんちずの地図データ。Tiled のマップではないので maps/ には入れず、ゲームが読む public/ にだけ置く */
const WORLD_MAP_FILE = 'public/worldmap.json';
/** collision レイヤーでこの番号のマスは通れない（Overworld.ts） */
const BLOCK = 3;
/** 海・湖・県外の陸地は通れない */
const BLOCKED = new Set(['.', '~', 'x', 'W']);
/** 看板・入口などの目じるしどうしを、何マス離すか（Placer） */
const SIGN_GAP = 3;

const TILESET = {
  firstgid: 1,
  name: 'overworld-tiles',
  tilewidth: 16,
  tileheight: 16,
  tilecount: 320,
  columns: 8,
  image: 'overworld-tiles',
  imagewidth: 128,
  imageheight: 640,
  margin: 0,
  spacing: 0,
};

type Pt = [number, number];

interface Prop {
  name: string;
  type: 'string' | 'int';
  value: string | number;
}

interface MapObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: Prop[];
}

/** 1マスの物体。at はタイル座標（w は横に何マス。入口の幅など） */
interface ObjDef {
  name: string;
  type: string;
  at: Pt;
  w?: number;
  properties?: Prop[];
}

const str = (name: string, value: string): Prop => ({ name, type: 'string', value });
const int = (name: string, value: number): Prop => ({ name, type: 'int', value });

/**
 * 宝箱の 中身：その県の 名産の たべもの（HP が かいふくする。名所・特産品の じゅんで さいしょの もの）。
 * src/core/progression/town.ts の localFood と 同じ えらび方。無ければ てつ
 */
function localFoodProps(prefId: string, count: number): Prop[] {
  const file = `${ROOT}content/prefectures/${prefId}.json`;
  const motifs = existsSync(file)
    ? ((JSON.parse(readFileSync(file, 'utf8')) as { motifs?: { id: string }[] }).motifs ?? [])
    : [];
  for (const m of motifs) {
    const f = `${ROOT}content/items/${prefId}-${m.id}.json`;
    if (!existsSync(f)) continue;
    const it = JSON.parse(readFileSync(f, 'utf8')) as {
      id: string;
      name: string;
      kind: string;
      use?: { heal?: number };
    };
    if (it.kind === 'consumable' && it.use?.heal)
      return [str('itemId', it.id), str('itemName', it.name), int('count', count)];
  }
  return [str('itemId', 'common-tetsu'), str('itemName', 'てつ'), int('count', count)];
}
const warp = (targetMap: string, targetSpawn: string, label?: string): Prop[] => [
  str('targetMap', targetMap),
  str('targetSpawn', targetSpawn),
  ...(label ? [str('label', label)] : []),
];

let createdCount = 0;

/** pnpm lint（prettier --check）がそのまま通るよう、Prettier で整形してから書き出す */
const PRETTIER = { ...((await resolveConfig(`${ROOT}maps/map.json`)) ?? {}), parser: 'json' };

async function saveMap(filename: string, content: object) {
  const jsonStr = await format(JSON.stringify(content), PRETTIER);
  let createdAny = false;
  DIRS.forEach((dir) => {
    const filePath = `${dir}${filename}`;
    if (!existsSync(filePath) || force) {
      writeFileSync(filePath, jsonStr, 'utf8');
      createdAny = true;
    }
  });
  if (createdAny) createdCount++;
}

async function saveWorldMap(content: object) {
  const filePath = `${ROOT}${WORLD_MAP_FILE}`;
  if (existsSync(filePath) && !force) return;
  writeFileSync(filePath, await format(JSON.stringify(content), PRETTIER), 'utf8');
  createdCount++;
}

const toObjects = (defs: ObjDef[]): MapObject[] =>
  defs.map((d, i) => ({
    id: i + 1,
    name: d.name,
    type: d.type,
    x: d.at[0] * 16,
    y: d.at[1] * 16,
    width: (d.w ?? 1) * 16,
    height: 16,
    ...(d.properties ? { properties: d.properties } : {}),
  }));

/** decor は 地面の上に重ねる物（町の木・建物の かざり・ダンジョンの たいまつ など。0 は何もない） */
function tiledMap(
  width: number,
  height: number,
  bg: number[],
  col: number[],
  objects: MapObject[],
  collisionVisible = true,
  decor?: number[],
  properties?: Prop[],
): object {
  const layer = (id: number, name: string, data: number[], visible: boolean) => ({
    id,
    name,
    type: 'tilelayer',
    visible,
    opacity: 1,
    x: 0,
    y: 0,
    width,
    height,
    data,
  });
  const tiles = [layer(1, 'background', bg, true), ...(decor ? [layer(2, 'decor', decor, true)] : [])];
  const n = tiles.length;
  return {
    compressionlevel: -1,
    width,
    height,
    infinite: false,
    tilewidth: 16,
    tileheight: 16,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.10.2',
    version: '1.10',
    layers: [
      ...tiles,
      // collision は見た目に出さない（地形は background・decor の絵で見せる）
      layer(n + 1, 'collision', col, collisionVisible),
      {
        id: n + 2,
        name: 'objects',
        type: 'objectgroup',
        visible: true,
        opacity: 1,
        x: 0,
        y: 0,
        draworder: 'topdown',
        objects,
      },
    ],
    nextlayerid: n + 3,
    nextobjectid: objects.length + 1,
    tilesets: [TILESET],
    type: 'map',
    ...(properties ? { properties } : {}),
  };
}

/** terrain.json の1枚。歩けるマスの連結成分と、緯度経度 → タイル座標の変換 */
class Land {
  readonly w: number;
  readonly h: number;
  readonly cells: string;
  /** 歩けるマスの連結成分の番号（歩けないマスは -1） */
  readonly label: Int32Array;
  readonly sizes: number[];

  constructor(
    readonly key: string,
    readonly terrain: TerrainMap,
    walkable: (c: string) => boolean,
  ) {
    this.w = terrain.width;
    this.h = terrain.height;
    this.cells = terrain.rows.join('');
    const { label, sizes } = components([...this.cells].map(walkable), this.w, this.h);
    this.label = label;
    this.sizes = sizes;
  }

  static of(key: string, walkable: (c: string) => boolean): Land {
    const terrain = TERRAIN[key];
    if (!terrain) throw new Error(`${key} の地形が terrain.json にありません（pnpm gen:terrain を実行）`);
    return new Land(key, terrain, walkable);
  }

  get largest(): number {
    return this.sizes.indexOf(Math.max(...this.sizes));
  }

  idx = (p: Pt): number => p[1] * this.w + p[0];
  walk = (i: number): boolean => this.label[i]! >= 0;
  compOf = (p: Pt): number => this.label[this.idx([Math.floor(p[0]), Math.floor(p[1])])]!;

  /** その緯度経度が、このマップの範囲（どれかの panel）に入るか */
  contains = (ll: LonLat): boolean =>
    this.terrain.panels.some(
      ({ bbox: b }) => ll[0] >= b[0] && ll[0] <= b[2] && ll[1] >= b[1] && ll[1] <= b[3],
    );

  /** 緯度経度 → タイル座標（その点を含む範囲の投影。どれにも入らなければ最後＝本土の範囲） */
  tile(ll: LonLat): Pt {
    const { panels } = this.terrain;
    const panel =
      panels.find(({ bbox: b }) => ll[0] >= b[0] && ll[0] <= b[2] && ll[1] >= b[1] && ll[1] <= b[3]) ??
      panels[panels.length - 1]!;
    return project(panel.proj, ll);
  }

  /** となりが海のマス（港や船着き場になる） */
  coastal = (i: number): boolean => {
    const x = i % this.w;
    return [x > 0 ? i - 1 : -1, x < this.w - 1 ? i + 1 : -1, i - this.w, i + this.w].some(
      (j) => j >= 0 && j < this.cells.length && this.cells[j] === '.',
    );
  };

  /** start から4方向に何歩で行けるか（同じ陸続きの中だけ。行けないマスは -1） */
  steps(start: Pt): Int32Array {
    const d = new Int32Array(this.cells.length).fill(-1);
    const s = this.idx(start);
    const comp = this.label[s];
    d[s] = 0;
    const queue = [s];
    for (let head = 0; head < queue.length; head++) {
      const i = queue[head]!;
      const x = i % this.w;
      for (const j of [x > 0 ? i - 1 : -1, x < this.w - 1 ? i + 1 : -1, i - this.w, i + this.w]) {
        if (j >= 0 && j < d.length && d[j] === -1 && this.label[j] === comp) {
          d[j] = d[i]! + 1;
          queue.push(j);
        }
      }
    }
    return d;
  }

  /** ok を満たすマスのうち score が最小のマスの中心 */
  best(ok: (i: number) => boolean, score: (i: number) => number): Pt {
    let bi = -1;
    let bs = Infinity;
    for (let i = 0; i < this.cells.length; i++) {
      if (!ok(i)) continue;
      const s = score(i);
      if (s < bs) {
        bs = s;
        bi = i;
      }
    }
    if (bi < 0) throw new Error(`${this.key}: 条件に合うマスがありません`);
    return [(bi % this.w) + 0.5, Math.floor(bi / this.w) + 0.5];
  }

  /** comp の陸の重心 */
  centroid(comp: number): Pt {
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (let i = 0; i < this.cells.length; i++) {
      if (this.label[i] !== comp) continue;
      sx += (i % this.w) + 0.5;
      sy += Math.floor(i / this.w) + 0.5;
      n++;
    }
    return [sx / n, sy / n];
  }
}

/**
 * 物体を重ならないように置いていく。看板・入口などの目じるし（labeled）どうしは SIGN_GAP マス離す
 * （名所に「着いた」とみなす まわり 1 マスの範囲が、となりの看板と重ならないように）
 */
class Placer {
  private readonly taken: { at: Pt; labeled: boolean }[] = [];
  /** 遷移のマス。乗った瞬間に移動するので、その先へは歩いて抜けられない */
  private readonly gates = new Set<number>();

  constructor(private readonly land: Land) {}

  /** i を遷移にしても、同じ陸続きのほかのマスどうしが遷移を踏まずに行き来できるか（細い道をふさがない） */
  private keepsLandConnected(i: number): boolean {
    const { w, cells, label } = this.land;
    const around = (j: number) => {
      const x = j % w;
      return [x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1, j - w, j + w];
    };
    const open = (j: number) =>
      j >= 0 && j < cells.length && j !== i && label[j] === label[i] && !this.gates.has(j);
    const neighbors = around(i).filter(open);
    if (neighbors.length <= 1) return true;
    const seen = new Set([neighbors[0]!]);
    const queue = [neighbors[0]!];
    for (let head = 0; head < queue.length; head++) {
      for (const j of around(queue[head]!)) {
        if (open(j) && !seen.has(j)) {
          seen.add(j);
          queue.push(j);
        }
      }
    }
    return neighbors.every((j) => seen.has(j));
  }

  private free(x: number, y: number, labeled: boolean): boolean {
    return this.taken.every(({ at, labeled: other }) => {
      const dx = Math.abs(at[0] - x);
      const dy = Math.abs(at[1] - y);
      if (dx === 0 && dy === 0) return false;
      return !(labeled && other && Math.max(dx, dy) < SIGN_GAP);
    });
  }

  /** target（タイル座標の点）にいちばん近い、ok を満たす歩ける空きマスに置く */
  put(target: Pt, ok: (i: number) => boolean, labeled = true, gate = false): Pt {
    const { w, cells } = this.land;
    const candidates: [number, number][] = [];
    for (let i = 0; i < cells.length; i++) {
      if (!this.land.walk(i) || !ok(i)) continue;
      const x = i % w;
      const y = (i - x) / w;
      if (!this.free(x, y, labeled)) continue;
      candidates.push([(x + 0.5 - target[0]) ** 2 + (y + 0.5 - target[1]) ** 2, i]);
    }
    candidates.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const hit = candidates.find(([, i]) => !gate || this.keepsLandConnected(i));
    if (!hit) throw new Error(`${this.land.key}: 物体を置ける場所がありません`);
    const i = hit[1];
    const at: Pt = [i % w, Math.floor(i / w)];
    this.taken.push({ at, labeled });
    if (gate) this.gates.add(i);
    return at;
  }

  /** 遷移（乗ると別の場所へ移動するマス）を置く */
  gate(target: Pt, ok: (i: number) => boolean): Pt {
    return this.put(target, ok, true, true);
  }

  /** 通路を分断しない候補のうち、指定した歩行距離が最も長い場所へボスを置く。 */
  farBlocker(ok: (i: number) => boolean, distance: Int32Array): Pt {
    const { w, cells } = this.land;
    let hit = -1;
    for (let i = 0; i < cells.length; i++) {
      const x = i % w;
      const y = Math.floor(i / w);
      if (
        this.land.walk(i) &&
        ok(i) &&
        distance[i]! >= 0 &&
        this.free(x, y, true) &&
        this.keepsLandConnected(i) &&
        (hit < 0 || distance[i]! > distance[hit]!)
      )
        hit = i;
    }
    if (hit < 0) throw new Error(`${this.land.key}: 遠いボス広場が見つかりません`);
    const at: Pt = [hit % w, Math.floor(hit / w)];
    this.taken.push({ at, labeled: true });
    this.gates.add(hit);
    return at;
  }

  /** at のすぐ南（ふさがっていれば近く）の、同じ陸続きの空きマス。行き先から戻ってきたときに立つ場所 */
  beside(at: Pt): Pt {
    const comp = this.land.compOf(at);
    return this.put([at[0] + 0.5, at[1] + 1.5], (i) => this.land.label[i] === comp, false);
  }

  /** 陸続きでない2つの陸（from → to）を結ぶ船着き場を、互いにいちばん近い海岸に置く */
  ferry(from: number, to: number): [Pt, Pt] {
    const a = this.gate(this.land.centroid(to), (i) => this.land.label[i] === from && this.land.coastal(i));
    const b = this.gate([a[0] + 0.5, a[1] + 0.5], (i) => this.land.label[i] === to && this.land.coastal(i));
    return [a, b];
  }
}

/** 同じ地図の中の島どうしを行き来する船（行き・帰りの乗り場と、着いたときに立つ場所）。there / back は行き先の名前（RubyText）で、看板の文字になる */
function ferryObjects(
  mapKey: string,
  tag: string,
  [a, b]: [Pt, Pt],
  place: Placer,
  there: string,
  back: string,
): ObjDef[] {
  return [
    {
      name: `ferry_to_${tag}`,
      type: 'transition',
      at: a,
      properties: warp(mapKey, `ferry_arrive_${tag}`, there),
    },
    { name: `ferry_arrive_${tag}`, type: 'spawn', at: place.beside(b) },
    {
      name: `ferry_back_${tag}`,
      type: 'transition',
      at: b,
      properties: warp(mapKey, `ferry_return_${tag}`, back),
    },
    { name: `ferry_return_${tag}`, type: 'spawn', at: place.beside(a) },
  ];
}

const terrainLayers = (land: Land, tileOf: (c: string, i: number) => number) => ({
  bg: [...land.cells].map(tileOf),
  col: [...land.cells].map((c) => (BLOCKED.has(c) ? BLOCK : 0)),
});

/** seed の マスから 4 方向に 何マスで とどくか（seed の マスは 0。とどかない マスは -1） */
function distanceFrom(land: Land, seed: (c: string) => boolean): Int32Array {
  const d = new Int32Array(land.cells.length).fill(-1);
  const queue: number[] = [];
  for (let i = 0; i < land.cells.length; i++)
    if (seed(land.cells[i]!)) {
      d[i] = 0;
      queue.push(i);
    }
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head]!;
    const x = i % land.w;
    for (const j of [x > 0 ? i - 1 : -1, x < land.w - 1 ? i + 1 : -1, i - land.w, i + land.w]) {
      if (j >= 0 && j < d.length && d[j] === -1) {
        d[j] = d[i]! + 1;
        queue.push(j);
      }
    }
  }
  return d;
}

/** 0〜1 の まぜかた（RNG を つかわないので、地面を かえても 物の 置き場所は かわらない） */
function noise(x: number, y: number): number {
  let h = Math.imul(x + 1, 0x27d4eb2d) ^ Math.imul(y + 1, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  return ((h ^ (h >>> 13)) >>> 0) / 0x100000000;
}

/**
 * なめらかな 0〜1：size マスおきの noise を なめらかに つなぐ（半分の 大きさも 少し まぜる）。
 * これで 分けると まとまりが 四角で なく まるい 形に なる（四角い まとまりは 地図が つぎはぎに 見える）
 */
function smooth(x: number, y: number, size: number, seed: number): number {
  const layer = (s: number, k: number) => {
    const fx = x / s;
    const fy = y / s;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const ease = (t: number) => t * t * (3 - 2 * t);
    const tx = ease(fx - x0);
    const ty = ease(fy - y0);
    const n = (i: number, j: number) => noise(x0 + i, y0 + j + k);
    const top = n(0, 0) + (n(1, 0) - n(0, 0)) * tx;
    const bottom = n(0, 1) + (n(1, 1) - n(0, 1)) * tx;
    return top + (bottom - top) * ty;
  };
  return (layer(size, seed) * 2 + layer(size / 2, seed + 7777)) / 3;
}

/** 果樹園の ある 県：たはたの ところどころが 果物の 畑（157 = りんご・さくらんぼ、158 = もも・ぶどう） */
const ORCHARDS: Record<string, number> = {
  aomori: 157,
  yamagata: 157,
  nagano: 157,
  fukushima: 158,
  yamanashi: 158,
  okayama: 158,
};
/** terrain.json に 水の マスが 無い 沼・湿原：名所の まわりを みずべに する（県 id → motif の id） */
const MARSHES: Record<string, string[]> = { miyagi: ['izunuma'] };

/**
 * 地面の 性質（src/core/world/ground.ts）を マスごとに 決めて、その タイルを かえす。
 *   A → やま（雪の山）。^ → 平地から 2 マス以上 おくは やま、ふちは もり
 *   平地（#）→ 湖・沼の そばは みずべ、海の となりは すなはま、丘の となりは もり、
 *              海からも 丘からも はなれた 所は たはた（ところどころ くさはら）、ほかは くさはら
 * 県の外（x）は 海の絵でも 海では ないので、すなはまに しない
 */
function groundTiles(land: Land, prefId: string): (c: string, i: number) => number {
  const sea = distanceFrom(land, (c) => c === '.');
  const lake = distanceFrom(land, (c) => c === '~');
  const low = distanceFrom(land, (c) => c === '#' || c === '.' || c === '~');
  const hill = distanceFrom(land, (c) => c === '^' || c === 'A');
  const marshes = (MARSHES[prefId] ?? []).flatMap((m) => {
    const ll = LANDMARK_SPOTS[prefId]?.[m];
    return ll && land.contains(ll) ? [land.tile(ll)] : [];
  });
  const orchard = ORCHARDS[prefId];
  const pick = (g: Ground, x: number, y: number): number => {
    const r = noise(x, y);
    if (g === 'grass') return r < 0.72 ? 1 : r < 0.92 ? 14 : 13;
    // たはた：まるい まとまりごとに 果樹園か たんぼ
    if (g === 'farm')
      return orchard && smooth(x, y, 7, 999) < 0.5 ? orchard : smooth(x, y, 7, 333) < 0.59 ? 155 : 156;
    const [base, alt] = GROUND_TILES[g];
    return r < 0.6 ? base! : alt!;
  };
  return (c, i) => {
    if (BLOCKED.has(c)) return TILE[c] ?? 3;
    const x = i % land.w;
    const y = Math.floor(i / land.w);
    if (c === 'A') return 12;
    if (c === '^') return pick(low[i]! >= 2 ? 'mountain' : 'forest', x, y);
    const marsh = marshes.some(([px, py]) => Math.hypot(x + 0.5 - px, y + 0.5 - py) <= 3.5);
    if ((lake[i]! >= 0 && lake[i]! <= 2) || marsh) return pick('shore', x, y);
    if (sea[i] === 1) return pick('beach', x, y);
    if (hill[i] === 1) return pick('forest', x, y);
    const inland = (sea[i]! < 0 || sea[i]! >= 4) && (hill[i]! < 0 || hill[i]! >= 4);
    return pick(inland && smooth(x, y, 10, 555) < 0.63 ? 'farm' : 'grass', x, y);
  };
}

interface EventSpot {
  /** 看板の物体名（events[].trigger.objectName） */
  name: string;
  motifId: string;
}

/** content/prefectures/*.json の events が、どのマップのどの物体名（どの名所）を使うか */
function eventTriggers(): Map<string, EventSpot[]> {
  const out = new Map<string, EventSpot[]>();
  for (const p of PREFECTURES) {
    const file = `${ROOT}content/prefectures/${p.id}.json`;
    if (!existsSync(file)) continue;
    const data = JSON.parse(readFileSync(file, 'utf8')) as {
      events?: { motifId?: string; trigger?: { map: string; objectName: string } }[];
    };
    for (const e of data.events ?? []) {
      if (!e.trigger) continue;
      const spot = { name: e.trigger.objectName, motifId: e.motifId ?? '' };
      out.set(e.trigger.map, [...(out.get(e.trigger.map) ?? []), spot]);
    }
  }
  return out;
}

/** マップに置いた名所・特産品（県 id → motif の id）。にほんちずの「名所の数」に使う */
const placedLandmarks = new Map<string, string[]>();

/** content の motif の種類（県 id → motif の id → kind） */
const MOTIF_KIND = new Map(
  PREFECTURES.map((p) => {
    const file = `${ROOT}content/prefectures/${p.id}.json`;
    const motifs = existsSync(file)
      ? ((JSON.parse(readFileSync(file, 'utf8')) as { motifs?: { id: string; kind: string }[] }).motifs ?? [])
      : [];
    return [p.id, new Map(motifs.map((m) => [m.id, m.kind]))] as const;
  }),
);
/** 特産品：★ 看板ではなく宝箱にする motif の種類 */
const SPECIALTY_KINDS = new Set(['food', 'craft']);

/**
 * 名所の ★ 看板と 特産品の宝箱のうち、このマップの範囲に入るもの（フィールドと離島で分ける）。
 * 実際の場所にいちばん近い、ok を満たす歩けるマスに立つ（湖の中心なら岸）
 */
function landmarkObjects(prefId: string, land: Land, place: Placer, ok: (i: number) => boolean): ObjDef[] {
  // 離島マップの範囲がフィールドの範囲に重なる県（淡路島・天草・桜島・佐渡）は、重なる所の名所を離島に立てる
  const enclave = ENCLAVES.find((e) => e.prefId === prefId)?.enclaveId;
  const island = enclave && enclave !== land.key ? Land.of(enclave, () => false) : null;
  const defs: ObjDef[] = [];
  for (const [motifId, ll] of Object.entries(LANDMARK_SPOTS[prefId] ?? {})) {
    if (!land.contains(ll) || island?.contains(ll)) continue;
    // 特産品（たべもの・こうげいひん）は宝箱（あけると説明が出て、その特産品のアイテムが もらえる）
    const specialty = SPECIALTY_KINDS.has(MOTIF_KIND.get(prefId)?.get(motifId) ?? '');
    defs.push({
      name: `${specialty ? 'sp' : 'lm'}_${motifId}`,
      type: specialty ? 'specialty' : 'landmark',
      at: place.put(land.tile(ll), ok),
      properties: [str('motifId', motifId)],
    });
    placedLandmarks.set(prefId, [...(placedLandmarks.get(prefId) ?? []), motifId]);
  }
  return defs;
}

/** 県のフィールド：町・ダンジョン・名所・離島への港・宝箱・中ボス */
interface RegionDef {
  id: string;
  boss?: unknown;
}
interface RegionPartition {
  ids: string[];
  /** マスごとの エリアの 番号（歩けない マスは -1） */
  region: Int32Array;
  /** 関所（エリアの さかいの 通れる 1 マス） */
  gates: { i: number; between: [string, string]; openedBy: string }[];
}

/**
 * 名所エリア（content の regions）：たね（geo.ts の REGION_SEEDS）から 陸を 歩いて ちかい じゅんに エリアを わけ、
 * エリアの さかいの マスを 山なみ（'W'：通れない）に する。regionGates の 2 つの エリアの さかいに 関所を 1 マス あける
 * （2 つの たねから 歩いて いちばん ちかい さかい＝しぜんな 道）。エリアの 無い 県は null
 */
function regionPartition(land: Land, prefId: string): RegionPartition | null {
  const file = `${ROOT}content/prefectures/${prefId}.json`;
  if (!existsSync(file)) return null;
  const data = JSON.parse(readFileSync(file, 'utf8')) as {
    regions?: RegionDef[];
    regionGates?: { between: [string, string]; openedBy: string }[];
  };
  const regions = data.regions ?? [];
  if (!regions.length) return null;
  const seeds = REGION_SEEDS[prefId];
  if (!seeds) throw new Error(`${prefId}: 名所エリアの たねが geo.ts の REGION_SEEDS に ありません`);
  const ids = regions.map((r) => r.id);
  const n = land.cells.length;
  const main = land.largest;
  const around = (i: number) => {
    const x = i % land.w;
    return [
      x > 0 ? i - 1 : -1,
      x < land.w - 1 ? i + 1 : -1,
      i - land.w,
      i >= n - land.w ? -1 : i + land.w,
    ].filter((j) => j >= 0 && j < n);
  };
  // たね → いちばん ちかい 本土の マス
  const seedIdx = ids.map((id) => {
    const list = seeds[id];
    if (!list?.length) throw new Error(`${prefId}: エリア ${id} の たねが ありません`);
    return list.map((ll) => {
      const [x, y] = land.best(
        (i) => land.label[i] === main,
        (i) =>
          ((i % land.w) + 0.5 - land.tile(ll)[0]) ** 2 +
          (Math.floor(i / land.w) + 0.5 - land.tile(ll)[1]) ** 2,
      );
      return Math.floor(y) * land.w + Math.floor(x);
    });
  });
  // エリアごとの 歩く きょり（関所の 場所を きめる）と、ぜんぶの たねからの きょりで エリアわけ
  const bfs = (starts: number[]) => {
    const d = new Int32Array(n).fill(-1);
    const q = [...starts];
    for (const s of starts) d[s] = 0;
    for (let h = 0; h < q.length; h++)
      for (const j of around(q[h]!))
        if (d[j] === -1 && land.walk(j)) {
          d[j] = d[q[h]!]! + 1;
          q.push(j);
        }
    return d;
  };
  const dist = seedIdx.map(bfs);
  // おなじ くらいの 広さに：いちばん せまい エリアから 1 マスずつ ひろげる（陸続きの まま そだつ）
  const region = new Int32Array(n).fill(-1);
  const size = ids.map(() => 0);
  const front = seedIdx.map((list) => [...list]);
  const heads = ids.map(() => 0);
  for (;;) {
    let r = -1;
    for (let k = 0; k < ids.length; k++)
      if (heads[k]! < front[k]!.length && (r < 0 || size[k]! < size[r]!)) r = k;
    if (r < 0) break;
    const i = front[r]![heads[r]!++]!;
    if (region[i]! >= 0 || !land.walk(i)) continue;
    region[i] = r;
    size[r]!++;
    for (const j of around(i)) if (region[j] === -1 && land.walk(j)) front[r]!.push(j);
  }
  // どの たねからも とどかない 島は いちばん ちかい エリア
  for (let i = 0; i < n; i++) {
    if (!land.walk(i) || region[i]! >= 0) continue;
    let best = 0;
    let bd = Infinity;
    dist.forEach((d, r) => {
      if (d[i]! >= 0 && d[i]! < bd) {
        bd = d[i]!;
        best = r;
      }
    });
    region[i] = best;
  }
  console.log(`  ${prefId}: エリアの 広さ ${ids.map((id, r) => `${id}=${size[r]}`).join(' ')}`);
  // となりあう エリア（関所を おける 組）を 出す：regionGates を きめる ときの 目安
  const touch = new Map<string, number>();
  for (let i = 0; i < n; i++)
    for (const j of around(i))
      if (region[i]! >= 0 && region[j]! > region[i]!) {
        const k = `${ids[region[i]!]}-${ids[region[j]!]}`;
        touch.set(k, (touch.get(k) ?? 0) + 1);
      }
  console.log(`  ${prefId}: となりあう エリア ${[...touch].map(([k, v]) => `${k}(${v})`).join(' ')}`);
  // さかいの 山なみ：となりが ちがう エリアの マスは りょうがわ とも かべ（2 マスの 山なみ。1 マスだと ななめに すきまが 見える）
  const wall = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const r = region[i]!;
    if (r < 0) continue;
    if (around(i).some((j) => region[j]! >= 0 && region[j] !== r)) wall[i] = 1;
  }
  // 関所：その 2 つの エリアの さかいで となりあう かべ 2 マス（a がわ i・b がわ j）。どちらも 自分の エリアの
  // かべで ない マスに つながる ところのうち、2 つの たねから 歩いて いちばん ちかい ところ。i に 門を おく
  const gates: RegionPartition['gates'] = [];
  for (const g of data.regionGates ?? []) {
    const [a, b] = g.between.map((id) => ids.indexOf(id));
    if (a! < 0 || b! < 0)
      throw new Error(`${prefId}: 関所の エリア ${g.between.join('・')} が regions に ありません`);
    const reach = (k: number, r: number) => around(k).some((m) => region[m] === r && !wall[m]);
    let best: [number, number] | null = null;
    let bs = Infinity;
    for (let i = 0; i < n; i++) {
      if (!wall[i] || region[i] !== a || !reach(i, a!)) continue;
      for (const j of around(i)) {
        if (!wall[j] || region[j] !== b || !reach(j, b!)) continue;
        const sc = dist[a!]![i]! + dist[b!]![j]!;
        if (sc < bs) {
          bs = sc;
          best = [i, j];
        }
      }
    }
    if (!best)
      throw new Error(`${prefId}: ${g.between.join('・')} は となりあって いないので 関所を おけません`);
    wall[best[0]] = 0;
    wall[best[1]] = 0;
    gates.push({ i: best[0], between: g.between, openedBy: g.openedBy });
  }
  // かべの マスは エリアの 外（-1）に して、地形を 'W' に
  for (let i = 0; i < n; i++) if (wall[i]) region[i] = -1;
  return { ids, region, gates };
}

/** エリアの さかいの かべ（'W'）を 入れた 地形 */
function withWalls(land: Land, part: RegionPartition): Land {
  const cells = [...land.cells].map((c, i) =>
    land.walk(i) && part.region[i]! < 0 && !part.gates.some((g) => g.i === i) ? 'W' : c,
  );
  const rows: string[] = [];
  for (let y = 0; y < land.h; y++) rows.push(cells.slice(y * land.w, (y + 1) * land.w).join(''));
  return new Land(land.key, { ...land.terrain, rows }, (c) => !BLOCKED.has(c));
}

function fieldMap(pref: PrefectureMaster, eventNames: string[]): object {
  const { id: prefId } = pref;
  const land0 = Land.of(`${prefId}-field`, (c) => !BLOCKED.has(c));
  const part = regionPartition(land0, prefId);
  const land = part ? withWalls(land0, part) : land0;
  const main = land.largest;
  const inMain = (i: number) => land.label[i] === main;
  const place = new Placer(land);

  const town = place.gate(land.tile(CAPITALS[prefId]!), inMain);
  const fromTown = land.steps(town);
  const farthest = Math.max(...fromTown);

  // ダンジョン: 名所が決まっていればそこ。なければ、いちばん高い地形のうち町からほどよく離れた所
  const rank = (c: string) => (c === 'A' ? 2 : c === '^' ? 1 : 0);
  let topRank = 0;
  for (let i = 0; i < land.cells.length; i++)
    if (inMain(i)) topRank = Math.max(topRank, rank(land.cells[i]!));
  const dungeonSpot = DUNGEON_SPOTS[prefId];
  const dungeon = place.gate(
    dungeonSpot
      ? land.tile(dungeonSpot)
      : land.best(
          (i) => inMain(i) && rank(land.cells[i]!) === topRank,
          (i) => Math.abs(fromTown[i]! - farthest * 0.6),
        ),
    inMain,
  );

  const events = eventNames.map((name): ObjDef => {
    const spot = EVENT_SPOTS[name];
    if (!spot)
      console.warn(
        `  ${prefId}-field: ${name} の場所が geo.ts の EVENT_SPOTS にないので、適当な所に置きます`,
      );
    const target = spot ? land.tile(spot) : land.best(inMain, (i) => Math.abs(fromTown[i]! - farthest * 0.5));
    return { name, type: 'event', at: place.put(target, inMain) };
  });

  // 名所スタンプ（イベントの無い名所）：★ の看板。近づくと説明が出る
  const landmarks = landmarkObjects(prefId, land, place, inMain);

  // 離島・飛地への港: その島にいちばん近い海岸
  const enclave = ENCLAVES.find((e) => e.prefId === prefId);
  const enclaveBox = enclave ? ENCLAVE_GEO[enclave.enclaveId]?.panels[0] : undefined;
  const port = enclaveBox
    ? place.gate(
        land.tile([(enclaveBox[0] + enclaveBox[2]) / 2, (enclaveBox[1] + enclaveBox[3]) / 2]),
        (i) => inMain(i) && land.coastal(i),
      )
    : null;

  // 中ボスは町からダンジョンへの道の途中に立ちふさがる（通れないマスになるので、陸続きを切らない所に置く）。
  // 倒すとそのマスに次の県へのワープホールが開く。宝箱はいちばん遠い所
  const fromDungeon = land.steps(dungeon);
  const route = fromTown[land.idx(dungeon)]!;
  // 名所エリアの ある 県は、中ボスも ダンジョンと おなじ エリア（さいごの エリア）に 立つ
  const lastRegion = part ? part.region[land.idx([Math.floor(dungeon[0]), Math.floor(dungeon[1])])]! : -1;
  const inLast = (i: number) => !part || part.region[i] === lastRegion;
  const midboss = place.gate(
    land.best(
      (i) => inMain(i) && inLast(i) && fromTown[i]! + fromDungeon[i]! === route,
      (i) => Math.abs(fromTown[i]! - route * 0.45),
    ),
    (i) => inMain(i) && inLast(i),
  );
  const chest = place.put(
    land.best(inMain, (i) => -fromTown[i]!),
    inMain,
  );
  const spawn = place.put([town[0] + 0.5, town[1] + 2.5], inMain, false);
  // 裏ステージの 入口（content に secret が ある県だけ。県ボスを 倒すまで ひらかない：lock を Overworld が 見る）
  const secretSpot = SECRETS.has(prefId) ? SECRET_SPOTS[prefId] : undefined;
  const secret = secretSpot ? place.gate(land.tile(secretSpot), inMain) : null;

  const defs: ObjDef[] = [
    { name: 'spawn', type: 'spawn', at: spawn },
    { name: 'from_town', type: 'spawn', at: place.beside(town) },
    { name: 'from_dungeon', type: 'spawn', at: place.beside(dungeon) },
    {
      name: 'to_town',
      type: 'transition',
      at: town,
      properties: [
        ...warp(`${prefId}-town`, 'from_field'),
        ...(prefId === 'iwate' ? [int('iconScale', 2)] : []),
      ],
    },
    {
      name: 'to_dungeon',
      type: 'transition',
      at: dungeon,
      properties: warp(`${prefId}-dungeon`, 'from_field'),
    },
    {
      name: `chest_${prefId}_field`,
      type: 'chest',
      at: chest,
      properties: localFoodProps(prefId, 1),
    },
    // だれが立つかは content/prefectures/<県>.json の midBoss（マップには場所だけ）
    { name: `midboss_${prefId}`, type: 'midboss', at: midboss },
  ];
  if (enclave && port) {
    defs.push(
      {
        name: `to_${enclave.enclaveId}`,
        type: 'transition',
        at: port,
        properties: warp(enclave.enclaveId, 'from_field'),
      },
      { name: `from_${enclave.enclaveId}`, type: 'spawn', at: place.beside(port) },
    );
  }
  defs.push(...events, ...landmarks);
  if (secret)
    defs.push(
      {
        name: 'to_secret',
        type: 'transition',
        at: secret,
        properties: [...warp(`${prefId}-secret`, 'from_field'), str('lock', 'areaSign')],
      },
      { name: 'from_secret', type: 'spawn', at: place.beside(secret) },
    );

  if (part) {
    // 関所（エリアの さかい）と エリアの ぬし
    for (const g of part.gates)
      defs.push({
        name: `gate_${g.between.join('_')}`,
        type: 'regionGate',
        at: place.put([(g.i % land.w) + 0.5, Math.floor(g.i / land.w) + 0.5], (i) => i === g.i, false),
        properties: [str('between', g.between.join(',')), str('openedBy', g.openedBy)],
      });
    part.ids.forEach((id, r) => {
      // 町・開始地点から十分に探索した先の広場へ置く。名所の種のそばへ置くと、
      // 最初のぬしが開始地点のすぐ横に出てしまうため、同じエリア内の最遠地点を使う。
      const roomy = (i: number) =>
        part.region[i] === r && around4(land, i).every((j) => part.region[j] === r);
      defs.push({
        name: `regionboss_${id}`,
        type: 'regionBoss',
        at: place.farBlocker((i) => inMain(i) && roomy(i), fromTown),
        properties: [str('region', id)],
      });
    });
  }
  const { bg, col } = terrainLayers(land, groundTiles(land, prefId));
  if (FIELD_ALL_GRASS.has(prefId)) allGrass(land, bg);
  if (part) regionLooks(land, part, prefId, bg);
  if (part) {
    defs.push(...villages(land, part, prefId, defs, col, bg));
    roads(land, defs, col, bg);
  }
  const props = part
    ? [
        str(
          'regions',
          JSON.stringify({
            ids: part.ids,
            rows: Array.from({ length: land.h }, (_, y) =>
              Array.from({ length: land.w }, (_, x) => {
                const r = part.region[y * land.w + x]!;
                return r < 0 ? '.' : String.fromCharCode(97 + r);
              }).join(''),
            ),
          }),
        ),
      ]
    : undefined;
  return tiledMap(land.w, land.h, bg, col, toObjects(defs), false, undefined, props);
}

/** 陸の 地面を ぜんぶ 草原に（海・湖・さかいの 山なみは そのまま） */
function allGrass(land: Land, bg: number[]): void {
  for (let i = 0; i < bg.length; i++) {
    if (!land.walk(i)) continue;
    const r = noise(i % land.w, Math.floor(i / land.w));
    bg[i] = r < 0.72 ? 1 : r < 0.92 ? 14 : 13;
  }
}

/**
 * 名所エリアの むら（geo.ts の REGION_VILLAGES）：建物を おいて、その マスを 通れなく する（col を BLOCK）。
 * 建物の まわり 1 マスは 歩ける 空き地（ほかの 物・建物・海・さかいに かからない）ので、道や 陸続きを ふさがない。
 * 土地に あわせる：
 *  - 船（boat・fune）は 陸でなく、その エリアの 岸に となりあう 海・湖の 上
 *  - 滝（taki・bigTaki）は うしろと 横を 岩山に、下に たきつぼの 池（水）を つくる
 *  - そのほかの 建物の 足もとと まわり 1 マスは 草の 広場（森や 砂地の 中でも 建物が 木に うもれない）
 */
const ON_WATER = new Set<StructureKind>(['boat', 'fune']);
const WATERFALL = new Set<StructureKind>(['taki', 'bigTaki']);
const MOUNTAIN_TILES = GROUND_TILES.mountain;

function villages(
  land: Land,
  part: RegionPartition,
  prefId: string,
  defs: ObjDef[],
  col: number[],
  bg: number[],
): ObjDef[] {
  const out: ObjDef[] = [];
  const taken = new Set(defs.map((d) => land.idx([Math.floor(d.at[0]), Math.floor(d.at[1])])));
  const used = new Set<number>();
  // 削除した巨大ねぶたの跡地。飾りの再配置で当たり判定が復活しないよう空けておく。
  const reserved = new Set<number>();
  if (prefId === 'aomori')
    for (const [x0, y0] of [
      [63, 68],
      [68, 64],
      [71, 54],
      [71, 60],
    ] as const)
      for (let y = y0; y < y0 + 2; y++) for (let x = x0; x < x0 + 3; x++) reserved.add(y * land.w + x);
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < land.w && y < land.h;
  const fits = (x0: number, y0: number, w: number, h: number, r: number) => {
    for (let y = y0 - 1; y <= y0 + h; y++)
      for (let x = x0 - 1; x <= x0 + w; x++) {
        if (!inside(x, y)) return false;
        const i = y * land.w + x;
        if (
          !land.walk(i) ||
          part.region[i] !== r ||
          col[i] === BLOCK ||
          taken.has(i) ||
          used.has(i) ||
          reserved.has(i)
        )
          return false;
      }
    return true;
  };
  /** 水の 上（海・湖。県の 外の 陸 x は だめ）で、その エリアの 陸に となりあう */
  const water = (i: number) => land.cells[i] === '.' || land.cells[i] === '~';
  const floats = (x0: number, y0: number, w: number, h: number, r: number) => {
    let shore = false;
    for (let y = y0 - 1; y <= y0 + h; y++)
      for (let x = x0 - 1; x <= x0 + w; x++) {
        if (!inside(x, y)) return false;
        const i = y * land.w + x;
        const body = x >= x0 && x < x0 + w && y >= y0 && y < y0 + h;
        if (body && (!water(i) || used.has(i))) return false;
        if (!body && used.has(i) && !water(i)) return false;
        if (
          !body &&
          part.region[i] === r &&
          (x === x0 - 1 || x === x0 + w) !== (y === y0 - 1 || y === y0 + h)
        )
          shore = true;
      }
    return shore;
  };
  const free = (i: number, r: number) =>
    land.walk(i) && part.region[i] === r && col[i] !== BLOCK && !taken.has(i) && !used.has(i);
  for (const [regionId, list] of Object.entries(REGION_VILLAGES[prefId] ?? {})) {
    const r = part.ids.indexOf(regionId);
    if (r < 0) continue;
    for (const v of list) {
      const [cx, cy] = land.tile(v.at);
      for (const b of v.buildings) {
        const [w, h] = STRUCTURE_SIZE[b.kind];
        const tx = Math.floor(cx) + b.dx;
        const ty = Math.floor(cy) + b.dy;
        const boat = ON_WATER.has(b.kind);
        const ok = boat ? floats : fits;
        // ふさがって いれば うずまきに 近くを さがす（船は 岸まで とおくても よい）
        let at: [number, number] | null = null;
        for (let d = 0; d <= (boat ? 16 : 10) && !at; d++)
          for (let oy = -d; oy <= d && !at; oy++)
            for (let ox = -d; ox <= d && !at; ox++)
              if (Math.max(Math.abs(ox), Math.abs(oy)) === d && ok(tx + ox, ty + oy, w, h, r))
                at = [tx + ox, ty + oy];
        if (!at) {
          console.warn(`  ${prefId}: ${regionId} の ${b.kind} を おける 場所が ありません`);
          continue;
        }
        const [ax, ay] = at;
        for (let y = ay; y < ay + h; y++)
          for (let x = ax; x < ax + w; x++) {
            col[y * land.w + x] = BLOCK;
            used.add(y * land.w + x);
          }
        if (WATERFALL.has(b.kind)) {
          // たきつぼの 池（下 1〜2 だん）と、うしろ・横の 岩山
          for (let x = ax; x < ax + w; x++) {
            const i1 = (ay + h) * land.w + x;
            bg[i1] = 3;
            col[i1] = BLOCK;
            const i2 = i1 + land.w;
            if (inside(x, ay + h + 1) && free(i2, r)) {
              bg[i2] = 3;
              col[i2] = BLOCK;
              used.add(i2);
            }
          }
          for (let y = ay - 1; y <= ay + h; y++)
            for (const x of y === ay - 1
              ? [...Array(w + 2).keys()].map((k) => ax - 1 + k)
              : [ax - 1, ax + w]) {
              const i = y * land.w + x;
              if (land.walk(i) && col[i] !== BLOCK) bg[i] = MOUNTAIN_TILES[(x + y) % 2]!;
            }
        } else if (!boat) {
          for (let y = ay - 1; y <= ay + h; y++)
            for (let x = ax - 1; x <= ax + w; x++) {
              const i = y * land.w + x;
              if (land.walk(i)) bg[i] = noise(x, y) < 0.8 ? 1 : 14;
            }
        }
        for (let y = ay - 1; y <= ay + h; y++)
          for (let x = ax - 1; x <= ax + w; x++) if (inside(x, y)) used.add(y * land.w + x);
        out.push({
          name: `structure_${regionId}_${b.kind}_${out.length + 1}`,
          type: 'structure',
          at,
          w,
          properties: [str('kind', b.kind), int('h', h), str('region', regionId)],
        });
      }
    }
  }
  return out;
}

const ROAD_TILE = 163;

/**
 * 道：町から、関所・エリアの ぬし・名所・イベント・特産品・入口 へ、いちばん ちかい 道から 枝分かれして つなぐ。
 * 海・湖・さかいの 山なみ・建物・ほかの 物の マスは とおらない（関所と 入口は とおる／目的地）
 */
function roads(land: Land, defs: ObjDef[], col: number[], bg: number[]): void {
  const idxOf = (d: ObjDef) => land.idx([Math.floor(d.at[0]), Math.floor(d.at[1])]);
  const passThrough = new Set(['regionGate', 'transition']);
  const blockers = new Set(defs.filter((d) => !passThrough.has(d.type) && d.type !== 'spawn').map(idxOf));
  const targets = defs.filter((d) =>
    ['regionGate', 'transition', 'regionBoss', 'event', 'landmark', 'specialty', 'midboss', 'chest'].includes(
      d.type,
    ),
  );
  const town = defs.find((d) => d.name === 'to_town');
  if (!town) return;
  const open = (i: number) => col[i] !== BLOCK && !blockers.has(i);
  const n = bg.length;
  const nb = (i: number) => {
    const x = i % land.w;
    return [x > 0 ? i - 1 : -1, x < land.w - 1 ? i + 1 : -1, i - land.w, i + land.w].filter(
      (j) => j >= 0 && j < n,
    );
  };
  const road = new Set<number>([idxOf(town)]);
  const goalOf = (d: ObjDef): Set<number> => {
    const i = idxOf(d);
    return passThrough.has(d.type) ? new Set([i]) : new Set(nb(i).filter(open));
  };
  // ちかい じゅん（町からの 歩く きょり）
  const fromTown = new Int32Array(n).fill(-1);
  {
    const q = [idxOf(town)];
    fromTown[q[0]!] = 0;
    for (let h = 0; h < q.length; h++)
      for (const j of nb(q[h]!))
        if (
          fromTown[j] === -1 &&
          (open(j) || passThrough.has(defs.find((d) => idxOf(d) === j)?.type ?? ''))
        ) {
          fromTown[j] = fromTown[q[h]!]! + 1;
          q.push(j);
        }
  }
  const order = targets
    .filter((d) => d !== town)
    .sort((a, b) => (fromTown[idxOf(a)] ?? 1e9) - (fromTown[idxOf(b)] ?? 1e9));
  for (const d of order) {
    const goal = goalOf(d);
    if (!goal.size || [...goal].some((g) => road.has(g))) continue;
    // いまの 道から goal まで（関所・入口の マスは 目的地か 通りみち）
    const prev = new Int32Array(n).fill(-2);
    const q = [...road];
    for (const r of q) prev[r] = -1;
    let hit = -1;
    for (let h = 0; h < q.length && hit < 0; h++)
      for (const j of nb(q[h]!)) {
        if (prev[j] !== -2) continue;
        const through = passThrough.has(defs.find((x) => idxOf(x) === j)?.type ?? '');
        if (!open(j) && !through && !goal.has(j)) continue;
        prev[j] = q[h]!;
        if (goal.has(j)) {
          hit = j;
          break;
        }
        q.push(j);
      }
    for (let i = hit; i >= 0 && !road.has(i); i = prev[i]!) road.add(i);
  }
  // 道は 2 マスの はば（1 マスだと 細い）：東か 南の となりも 道に（ふさがって いれば 西か 北）
  const wide = new Set(road);
  for (const i of road) {
    const x = i % land.w;
    const side = [x < land.w - 1 ? i + 1 : -1, i + land.w, x > 0 ? i - 1 : -1, i - land.w].find(
      (j) => j >= 0 && j < n && land.walk(j) && open(j),
    );
    if (side !== undefined) wide.add(side);
  }
  for (const i of wide) if (col[i] !== BLOCK && land.walk(i)) bg[i] = ROAD_TILE;
}

/** 名所エリアの 見た目（geo.ts の REGION_LOOKS）で 地面の タイルを かえる */
function regionLooks(land: Land, part: RegionPartition, prefId: string, bg: number[]): void {
  const looks = REGION_LOOKS[prefId] ?? {};
  const GRASS = new Set([1, 13, 14]);
  const OPEN = new Set([1, 13, 14, 155, 156, 157, 158]);
  part.ids.forEach((id, r) => {
    const look = looks[id];
    if (!look) return;
    const seedLL = look.kind === 'ash' ? REGION_SEEDS[prefId]?.[id]?.[look.seed ?? 0] : undefined;
    const c = seedLL ? land.tile(seedLL) : null;
    for (let i = 0; i < bg.length; i++) {
      if (part.region[i] !== r) continue;
      const x = i % land.w;
      const y = Math.floor(i / land.w);
      const n = noise(x + 311, y + 97);
      if (look.kind === 'forest' && OPEN.has(bg[i]!)) bg[i] = n < 0.6 ? 149 : 150;
      else if (look.kind === 'sakura' && GRASS.has(bg[i]!) && n < 0.16) bg[i] = 160;
      else if (look.kind === 'ash' && c && Math.hypot(x + 0.5 - c[0], y + 0.5 - c[1]) <= (look.radius ?? 8))
        if (bg[i] !== 3) bg[i] = n < 0.1 ? 162 : 161;
    }
  });
}

const around4 = (land: Land, i: number): number[] => {
  const x = i % land.w;
  return [x > 0 ? i - 1 : -1, x < land.w - 1 ? i + 1 : -1, i - land.w, i + land.w].filter(
    (j) => j >= 0 && j < land.cells.length,
  );
};

/**
 * にほんちず（src/ui/field/WorldMapOverlay.tsx）の地図データ。歩くマップではなく、見るだけの地図。
 * 地方ごとに terrain.json の地方の図を「県（'a' + areas の番号）」と「それ以外（海・湖・地方の外の陸地）＝ '.'」にし、
 * 県ごとに、県庁所在地のマスと、フィールドに看板がある名所スタンプ（motif の id）を添える。
 */
function worldMap(triggers: Map<string, EventSpot[]>): object {
  const regions = ISLANDS.map((island) => {
    const land = Land.of(`${island.id}-island`, () => false);
    const areas = land.terrain.areas ?? [];
    const end = String.fromCharCode(97 + areas.length);
    return {
      id: island.id,
      width: land.w,
      height: land.h,
      rows: land.terrain.rows.map((r) => [...r].map((c) => (c >= 'a' && c < end ? c : '.')).join('')),
      areas: areas.map((id, k) => {
        const letter = String.fromCharCode(97 + k);
        const [cx, cy] = land.tile(CAPITALS[id]!);
        const capital = land.best(
          (i) => land.cells[i] === letter,
          (i) => ((i % land.w) + 0.5 - cx) ** 2 + (Math.floor(i / land.w) + 0.5 - cy) ** 2,
        );
        // 県のフィールドと離島の ★ 看板ぜんぶ（イベントと名所スタンプ）
        const enclave = ENCLAVES.find((e) => e.prefId === id)?.enclaveId;
        const stamps = [
          ...(triggers.get(`${id}-field`) ?? []).map((e) => e.motifId),
          ...(enclave ? (triggers.get(enclave) ?? []) : [])
            .filter((e) => e.name === `event_${enclave}`)
            .map((e) => e.motifId),
          ...(placedLandmarks.get(id) ?? []),
        ];
        return {
          id,
          capital: [Math.floor(capital[0]), Math.floor(capital[1])],
          stamps: [...new Set(stamps)].filter(Boolean),
        };
      }),
    };
  });
  return { regions };
}

/** 離島・飛地：港に着き、宝箱と名所がある。島が2つある地図は船でつなぐ */
function enclaveMap(enc: EnclaveDef): object {
  const geo = ENCLAVE_GEO[enc.enclaveId];
  if (!geo) throw new Error(`${enc.enclaveId} の範囲が geo.ts にありません`);
  const land = Land.of(enc.enclaveId, (c) => !BLOCKED.has(c));
  const place = new Placer(land);

  const port = place.gate(land.tile(geo.port), (i) => land.coastal(i));
  const home = land.compOf(port);
  const reach = new Set([home]);
  const ferries: ObjDef[] = [];
  geo.panels.slice(1).forEach((b, k) => {
    const center = land.tile([(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]);
    const comp = land.compOf(
      land.best(land.walk, (i) => ((i % land.w) - center[0]) ** 2 + (i / land.w - center[1]) ** 2),
    );
    if (reach.has(comp)) return;
    reach.add(comp);
    const there = geo.panelNames?.[k + 1] ?? '島[しま]';
    const back = geo.panelNames?.[0] ?? '港[みなと]';
    ferries.push(...ferryObjects(enc.enclaveId, `${k + 1}`, place.ferry(home, comp), place, there, back));
  });

  const fromPort = land.steps(port);
  const farthest = Math.max(...fromPort);
  const inHome = (i: number) => land.label[i] === home;
  const inReach = (i: number) => reach.has(land.label[i]!);
  const event = place.put(
    geo.event ? land.tile(geo.event) : land.best(inHome, (i) => Math.abs(fromPort[i]! - farthest * 0.5)),
    inReach,
  );
  const chest = place.put(
    geo.chest ? land.tile(geo.chest) : land.best(inHome, (i) => -fromPort[i]!),
    inReach,
  );
  const arrive = place.put([port[0] + 0.5, port[1] + 1.5], inHome, false);
  const landmarks = landmarkObjects(enc.prefId, land, place, inReach);

  const defs: ObjDef[] = [
    { name: 'spawn', type: 'spawn', at: arrive },
    { name: 'from_field', type: 'spawn', at: arrive },
    {
      name: 'to_field',
      type: 'transition',
      at: port,
      properties: warp(`${enc.prefId}-field`, `from_${enc.enclaveId}`),
    },
    {
      name: `chest_${enc.enclaveId}`,
      type: 'chest',
      at: chest,
      properties: [str('itemId', enc.chestItem), str('itemName', enc.chestItemName), int('count', 1)],
    },
    { name: `event_${enc.enclaveId}`, type: 'event', at: event },
    ...ferries,
    ...landmarks,
  ];

  const { bg, col } = terrainLayers(land, groundTiles(land, enc.prefId));
  return tiledMap(land.w, land.h, bg, col, toObjects(defs), false);
}

/** 町とダンジョン（地形とは関係のない マップ）の大きさ */
const ROOM_W = 52;
const ROOM_H = 40;

/** 町・ダンジョンで使う タイル番号（src/scenes/overworld/fieldArt.ts と対応） */
const T = {
  grass: 1,
  stone: 5,
  roofRed: 6,
  flowers: 13,
  grass2: 14,
  stone2: 15,
  roofBlue: 16,
  roofGreen: 17,
  roofBrown: 18,
  wall: 19,
  window: 20,
  door: 21,
  fence: 22,
  flowerBed: 23,
  /** 24〜27 の 2×2 */
  fountain: 24,
  lamp: 28,
  bench: 29,
  barrel: 30,
  fruitTree: 31,
  tree: 32,
  hedge: 33,
  board: 34,
  stall: 35,
  well: 36,
  crate: 37,
  torch: 54,
  crystal: 55,
  boulder: 56,
  pillar: 57,
  pool: 58,
  altar: 59,
  water: 3,
  // ───── 県ごとの 町の テーマ（src/scenes/overworld/townTiles.ts・scripts/data/towns.ts） ─────
  snow: 61,
  snow2: 62,
  sand: 63,
  sand2: 64,
  roofKawara: 65,
  roofRyukyu: 66,
  roofSnow: 67,
  roofThatch: 68,
  pine: 69,
  snowPine: 70,
  palm: 71,
  sakura: 72,
  bamboo: 73,
  mikanTree: 74,
  peachTree: 75,
  pearTree: 76,
  grapeVine: 77,
  rice: 78,
  tea: 79,
  lavender: 80,
  tulip: 81,
  cabbage: 82,
  pineapple: 83,
  nemophila: 84,
  strawberry: 85,
  wheat: 86,
  watermelon: 87,
  stoneLantern: 88,
  paperLantern: 89,
  snowman: 90,
  shisa: 91,
  deer: 92,
  boat: 93,
  pier: 94,
  onsen: 95,
  steam: 96,
  shrineWall: 97,
  castleRoof: 98,
  castleWall: 99,
  castleBase: 100,
  redWall: 101,
  /** 105〜108 の 2×2 */
  torii: 105,
  lighthouseTop: 109,
  lighthouseMid: 110,
  lighthouseBase: 111,
  seaTorii: 112,
  /** 113〜122 の 2×5 */
  tower: 113,
  /** 123〜128 の 2×3 */
  clock: 123,
  /** 129〜132 の 2×2 */
  float: 129,
  /** 133〜136 の 2×2 */
  dino: 133,
  /** 137〜146 の 2×5 */
  pagoda: 137,
  // ───── 都会の 町（161〜220。src/scenes/overworld/townTiles.ts） ─────
  road: 161,
  roadLineV: 162,
  roadLineH: 163,
  crossH: 164,
  crossV: 165,
  sidewalk: 166,
  manhole: 167,
  pavement: 168,
  pavement2: 169,
  signal: 170,
  streetTree: 171,
  busStop: 172,
  vending: 173,
  postBox: 174,
  subway: 175,
  /** 176〜178 電光の 看板（赤・青・緑） */
  neonRed: 176,
  neonBlue: 177,
  neonGreen: 178,
  cityTent: 179,
  planter: 180,
  parking: 181,
  rail: 182,
  platform: 183,
  /** 184〜207 高い ビル（2×3 が 4 しゅるい：ガラス・れんが・白・銀） */
  towerGlass: 184,
  towerBrick: 190,
  towerWhite: 196,
  towerSteel: 202,
  /** 208〜213 の 3×2 */
  station: 208,
  /** 214〜215 の 2×1 */
  train: 214,
  cityWall: 216,
  cityTop: 217,
  cityGlass: 218,
  lawn: 219,
  overpass: 220,
} as const;

/** ダンジョンの タイル（221〜269 は src/scenes/overworld/dungeonTiles.ts） */
const D = {
  limeFloor: 221,
  limeFloor2: 222,
  limeWall: 223,
  limeFace: 224,
  mineFloor: 225,
  mineRail: 226,
  mineWall: 227,
  mineFace: 228,
  lavaFloor: 229,
  lavaFloor2: 230,
  lavaWall: 231,
  lavaFace: 232,
  gorgeFloor: 233,
  gorgeWater: 234,
  gorgeWall: 235,
  gorgeFace: 236,
  castleFloor: 237,
  castleTatami: 238,
  castleWall: 239,
  castleFace: 240,
  houseTatami: 241,
  houseFloor2: 242,
  houseWall: 243,
  houseFace: 244,
  forestFloor: 245,
  forestFloor2: 246,
  forestWall: 247,
  forestFace: 248,
  seaFloor: 249,
  seaFloor2: 250,
  seaWall: 251,
  seaFace: 252,
  stalactite: 253,
  pitProp: 254,
  cart: 255,
  oreHeap: 256,
  lavaPool: 257,
  fumarole: 258,
  mossRock: 259,
  fern: 260,
  goldScreen: 261,
  brazier: 262,
  dais: 263,
  screen: 264,
  andon: 265,
  bambooStalk: 266,
  treeRoot: 267,
  sprayRock: 268,
  seaweed: 269,
} as const;

type DungeonTheme =
  | 'cave'
  | 'ice'
  | 'grotto'
  | 'shrine'
  | 'limestone'
  | 'mine'
  | 'volcano'
  | 'gorge'
  | 'castle'
  | 'house'
  | 'forest'
  | 'sea';
/**
 * へやの ならべかた：
 *   cave = 四角い へやを ばらばらに、round = 角を けずった まるい へやと 水の すじ、
 *   grid = ごばんの ように ならべた へや（お城・やしき）、tunnel = 細い 坑道と 小さな へや（鉱山）
 */
type DungeonShape = 'cave' | 'round' | 'grid' | 'tunnel';
interface ThemeTiles {
  floor: number;
  floor2: number;
  /** 上から見た かべ（岩のかたまり） */
  wall: number;
  /** 床の すぐ上の かべの前の面 */
  face: number;
  /** へやに置く 岩・クリスタル など */
  props: number[];
  torches: boolean;
  shape?: DungeonShape;
  /** いちばん おくの さいだん（書かなければ T.altar） */
  altar?: number;
}
const THEMES: Record<DungeonTheme, ThemeTiles> = {
  cave: { floor: 38, floor2: 39, wall: 40, face: 41, props: [T.boulder, T.pillar], torches: true },
  ice: { floor: 42, floor2: 43, wall: 44, face: 45, props: [T.crystal, T.pillar], torches: false },
  grotto: { floor: 46, floor2: 47, wall: 48, face: 49, props: [T.pool, T.boulder], torches: true },
  shrine: { floor: 50, floor2: 51, wall: 52, face: 53, props: [T.lamp, T.crate], torches: true },
  // 鍾乳洞：白っぽい 岩、上から さがる つらら石、水たまり
  limestone: {
    floor: D.limeFloor,
    floor2: D.limeFloor2,
    wall: D.limeWall,
    face: D.limeFace,
    props: [D.stalactite, T.boulder],
    torches: true,
    shape: 'round',
  },
  // 鉱山の 坑道：木の 支柱と 板、トロッコの レール、鉱石
  mine: {
    floor: D.mineFloor,
    floor2: D.mineRail,
    wall: D.mineWall,
    face: D.mineFace,
    props: [D.pitProp, D.cart],
    torches: true,
    shape: 'tunnel',
    altar: D.oreHeap,
  },
  // 火口：黒い 岩、赤い ひび、ゆげ
  volcano: {
    floor: D.lavaFloor,
    floor2: D.lavaFloor2,
    wall: D.lavaWall,
    face: D.lavaFace,
    props: [D.fumarole, T.boulder],
    torches: false,
    altar: D.lavaPool,
  },
  // 渓谷・滝：こけの 岩、水の 流れ、シダ
  gorge: {
    floor: D.gorgeFloor,
    floor2: D.gorgeWater,
    wall: D.gorgeWall,
    face: D.gorgeFace,
    props: [D.mossRock, D.fern],
    torches: false,
    shape: 'round',
  },
  // お城の 中：板の間・たたみ、白い かべ、金の びょうぶ
  castle: {
    floor: D.castleFloor,
    floor2: D.castleTatami,
    wall: D.castleWall,
    face: D.castleFace,
    props: [D.goldScreen, D.brazier],
    torches: true,
    shape: 'grid',
    altar: D.dais,
  },
  // やしき・学校：たたみと しょうじ
  house: {
    floor: D.houseTatami,
    floor2: D.houseFloor2,
    wall: D.houseWall,
    face: D.houseFace,
    props: [D.screen, D.andon],
    torches: false,
    shape: 'grid',
    altar: D.dais,
  },
  // 竹林・森：こけの 地面、竹、木の 根
  forest: {
    floor: D.forestFloor,
    floor2: D.forestFloor2,
    wall: D.forestWall,
    face: D.forestFace,
    props: [D.bambooStalk, D.treeRoot],
    torches: false,
    shape: 'round',
  },
  // 海の 洞くつ：青い 岩、しぶき
  sea: {
    floor: D.seaFloor,
    floor2: D.seaFloor2,
    wall: D.seaWall,
    face: D.seaFace,
    props: [D.sprayRock, D.seaweed],
    torches: true,
    shape: 'round',
  },
};
/** ダンジョンの見た目（入口の実在の場所に合わせる。geo.ts の DUNGEON_SPOTS）。書いていない県は どうくつ */
const DUNGEON_THEMES: Record<string, DungeonTheme> = {
  hokkaido: 'volcano', // 有珠山
  aomori: 'volcano', // 恐山
  iwate: 'shrine', // 中尊寺金色堂
  miyagi: 'sea', // 松島
  akita: 'grotto', // 田沢湖
  yamagata: 'ice', // 蔵王
  fukushima: 'castle', // 鶴ヶ城
  ibaraki: 'gorge', // 竜神峡
  tochigi: 'mine', // 大谷石の 地下採掘場あと
  gunma: 'limestone', // 不二洞
  saitama: 'limestone', // 橋立鍾乳洞
  chiba: 'mine', // 鋸山の 石切場あと
  tokyo: 'limestone', // 日原鍾乳洞
  kanagawa: 'volcano', // 大涌谷
  niigata: 'gorge', // 清津峡
  toyama: 'gorge', // 黒部峡谷
  ishikawa: 'mine', // 尾小屋鉱山
  fukui: 'sea', // 東尋坊
  yamanashi: 'ice', // 鳴沢氷穴
  nagano: 'gorge', // 上高地
  gifu: 'limestone', // 大滝鍾乳洞
  shizuoka: 'sea', // 龍宮窟
  aichi: 'castle', // 犬山城
  mie: 'gorge', // 赤目四十八滝
  shiga: 'limestone', // 河内風穴
  kyoto: 'forest', // 嵯峨野の 竹林
  osaka: 'gorge', // 箕面の滝
  hyogo: 'mine', // 生野銀山
  nara: 'limestone', // 面不動鍾乳洞
  wakayama: 'gorge', // 那智の滝
  tottori: 'sea', // 浦富海岸の 海食洞
  shimane: 'mine', // 石見銀山
  okayama: 'limestone', // 満奇洞
  hiroshima: 'gorge', // 三段峡
  yamaguchi: 'limestone', // 秋芳洞
  tokushima: 'gorge', // 大歩危峡
  kagawa: 'forest', // 屋島
  ehime: 'mine', // 別子銅山
  kochi: 'limestone', // 龍河洞
  fukuoka: 'limestone', // 千仏鍾乳洞（平尾台）
  saga: 'sea', // 七ツ釜
  nagasaki: 'volcano', // 雲仙地獄
  kumamoto: 'volcano', // 阿蘇 中岳の 火口
  oita: 'sea', // 青の洞門
  miyazaki: 'gorge', // 高千穂峡
  kagoshima: 'volcano', // 開聞岳
  okinawa: 'limestone', // 玉泉洞
};
/**
 * 裏ステージの 見た目（入口は scripts/data/secrets.ts の SECRET_SPOTS）。
 * お城 → castle、学校・やしき・旧居・旧宅 → house、港・海の そば → sea。書いていない県は お寺の 中（shrine）
 */
const SECRET_THEMES: Record<string, DungeonTheme> = {
  hokkaido: 'house', // 札幌市時計台
  aomori: 'castle', // 弘前城
  iwate: 'shrine', // 高館義経堂
  miyagi: 'castle', // 仙台城あと
  akita: 'castle', // 久保田城あと
  yamagata: 'shrine', // 山寺
  fukushima: 'castle', // 鶴ヶ城
  ibaraki: 'house', // 弘道館
  tochigi: 'house', // 那須与一伝承館
  gunma: 'castle', // 金山城あと
  saitama: 'house', // 旧渋沢邸「中の家」
  chiba: 'house', // 伊能忠敬旧宅
  tokyo: 'house', // すみだ北斎美術館
  kanagawa: 'house', // 大倉幕府あと
  niigata: 'castle', // 春日山城あと
  toyama: 'castle', // 富山城あと
  ishikawa: 'castle', // 金沢城あと
  fukui: 'castle', // 福井城あと
  yamanashi: 'house', // 躑躅ヶ崎館あと
  nagano: 'castle', // 上田城あと
  gifu: 'castle', // 岐阜城
  shizuoka: 'castle', // 駿府城あと
  aichi: 'castle', // 那古野城あと
  mie: 'castle', // 伊賀上野城
  shiga: 'castle', // 彦根城 天守
  kyoto: 'house', // 宇治の やかた
  osaka: 'castle', // 大阪城 本丸
  hyogo: 'castle', // 姫路城 大天守
  nara: 'shrine', // 斑鳩宮あと
  wakayama: 'castle', // 和歌山城 天守
  tottori: 'house', // 因幡国庁あと
  shimane: 'house', // 小泉八雲旧居
  okayama: 'house', // 旧閑谷学校
  hiroshima: 'castle', // 吉田郡山城あと
  yamaguchi: 'house', // 松下村塾
  tokushima: 'castle', // 徳島城あと
  kagawa: 'house', // 平賀源内旧邸
  ehime: 'sea', // 今治市 糸山（来島海峡）
  kochi: 'house', // 坂本龍馬の 生まれた 家の あと
  fukuoka: 'castle', // 福岡城あと
  saga: 'castle', // 佐賀城 本丸
  nagasaki: 'sea', // 出島
  kumamoto: 'castle', // 熊本城
  oita: 'house', // 福沢諭吉旧居
  miyazaki: 'castle', // 飫肥城あと
  kagoshima: 'castle', // 鶴丸城
  okinawa: 'castle', // 首里城
};

/** 町の人（content の town.npcs）。町の人の いない県は、お店・宿屋・かじや・けいじばん の人と、町の人 */
const TOWN_NPCS = new Map(
  PREFECTURES.map((p) => {
    const file = `${ROOT}content/prefectures/${p.id}.json`;
    const npcs = existsSync(file)
      ? ((JSON.parse(readFileSync(file, 'utf8')) as { town?: { npcs?: { id: string; role: string }[] } }).town
          ?.npcs ?? [])
      : [];
    return [p.id, npcs] as const;
  }),
);
/** 裏ステージ（content の secret）が ある県。フィールドに 入口、<県>-secret の マップを 作る */
const SECRETS = new Set(
  PREFECTURES.filter((p) => {
    const file = `${ROOT}content/prefectures/${p.id}.json`;
    return existsSync(file) && !!(JSON.parse(readFileSync(file, 'utf8')) as { secret?: unknown }).secret;
  }).map((p) => p.id),
);
const DEFAULT_ROLES = ['shop', 'inn', 'smith', 'board'];
/** 建物に入る お店（目立つ場所から順に）と、屋根の色 */
const SHOP_ROOF: Record<string, number> = {
  shop: T.roofRed,
  inn: T.roofBlue,
  smith: T.roofBrown,
  dex: T.roofGreen,
  arena: T.roofRed,
};
/** 町の テーマ（scripts/data/towns.ts）の 名前 → タイル */
const ROOF_TILES: Record<TownRoof, number> = {
  red: T.roofRed,
  blue: T.roofBlue,
  green: T.roofGreen,
  brown: T.roofBrown,
  kawara: T.roofKawara,
  ryukyu: T.roofRyukyu,
  snow: T.roofSnow,
  thatch: T.roofThatch,
};
const TREE_TILES: Record<TownTree, number> = {
  round: T.tree,
  pine: T.pine,
  snowPine: T.snowPine,
  palm: T.palm,
  sakura: T.sakura,
  bamboo: T.bamboo,
};
/** 畑。実のなる木（tree）は 1 マスおきに 植え、田んぼ・茶畑・花畑などは しきつめる */
const FIELD_TILES: Record<TownField, { tile: number; tree: boolean }> = {
  apple: { tile: T.fruitTree, tree: true },
  mikan: { tile: T.mikanTree, tree: true },
  peach: { tile: T.peachTree, tree: true },
  pear: { tile: T.pearTree, tree: true },
  grape: { tile: T.grapeVine, tree: true },
  rice: { tile: T.rice, tree: false },
  tea: { tile: T.tea, tree: false },
  lavender: { tile: T.lavender, tree: false },
  tulip: { tile: T.tulip, tree: false },
  cabbage: { tile: T.cabbage, tree: false },
  pineapple: { tile: T.pineapple, tree: false },
  nemophila: { tile: T.nemophila, tree: false },
  strawberry: { tile: T.strawberry, tree: false },
  wheat: { tile: T.wheat, tree: false },
  watermelon: { tile: T.watermelon, tree: false },
};
const LAMP_TILES: Record<TownLamp, number> = { street: T.lamp, stone: T.stoneLantern, paper: T.paperLantern };
/** towns.ts に 書いていない 県の 町（いままでの 見た目） */
const DEFAULT_TOWN: TownTheme = {
  ground: 'grass',
  tree: 'round',
  roofs: ['red', 'blue', 'green', 'brown'],
  plaza: 'fountain',
  fields: ['apple', 'apple'],
  lamp: 'street',
  coast: false,
  extras: [],
  note: '',
};

/** 町・ダンジョンを作る マス目（地面・上に重ねる物・通れないか・物体） */
class Room {
  readonly bg: number[];
  readonly decor = new Array<number>(ROOM_W * ROOM_H).fill(0);
  readonly block: boolean[];
  readonly objects: ObjDef[] = [];

  constructor(fill: number, blocked: boolean) {
    this.bg = new Array<number>(ROOM_W * ROOM_H).fill(fill);
    this.block = new Array<boolean>(ROOM_W * ROOM_H).fill(blocked);
  }

  inside = (x: number, y: number) => x >= 0 && y >= 0 && x < ROOM_W && y < ROOM_H;
  i = (x: number, y: number) => y * ROOM_W + x;

  /** 歩ける地面 */
  ground(x: number, y: number, tile: number): void {
    if (!this.inside(x, y)) return;
    this.bg[this.i(x, y)] = tile;
    this.block[this.i(x, y)] = false;
  }

  /** 通れない地面（建物・かべ） */
  solid(x: number, y: number, tile: number): void {
    if (!this.inside(x, y)) return;
    this.bg[this.i(x, y)] = tile;
    this.block[this.i(x, y)] = true;
  }

  /** 地面の上に重ねる物（通れない） */
  put(x: number, y: number, tile: number): void {
    if (!this.inside(x, y)) return;
    this.decor[this.i(x, y)] = tile;
    this.block[this.i(x, y)] = true;
  }

  /** 何も置いていない 歩けるマス */
  open = (x: number, y: number) =>
    this.inside(x, y) && !this.block[this.i(x, y)] && !this.decor[this.i(x, y)];

  toMap(): object {
    const col = this.block.map((b) => (b ? BLOCK : 0));
    return tiledMap(ROOM_W, ROOM_H, this.bg, col, toObjects(this.objects), false, this.decor);
  }
}

/**
 * 町：まん中に ふんすいの広場、東西の大通り 2 本と 南北の道、北と南の小道。
 * 道ぞいに お店（屋根の色で見分ける。かべに お店の看板）と家。花だん・街灯・ベンチ・やたい・井戸・くだものの木。
 * お店の人は とびらの前、けいじばんの人は広場、町の人は広場や道に立つ。南の まん中が フィールドへの出口。
 * 見た目は 県ごとの テーマ（scripts/data/towns.ts）：地面（草・雪・すな）・木・屋根・広場の まん中の 名所・
 * 南の 畑（特産品）・街灯・海ぞい（北が 海と 船）・小物。こまかい ならびは シード（県 id）で ちがう
 */
function townMap(prefId: string): object {
  const rng = createRng(`town:${prefId}`);
  const theme = TOWN_THEMES[prefId] ?? DEFAULT_TOWN;
  const treeTile = TREE_TILES[theme.tree];
  const lampTile = LAMP_TILES[theme.lamp];
  const roofs = theme.roofs.map((k) => ROOF_TILES[k]);
  const room = new Room(T.grass, false);
  for (let y = 0; y < ROOM_H; y++)
    for (let x = 0; x < ROOM_W; x++) {
      const k = rng.next();
      const tile =
        theme.ground === 'snow'
          ? k < 0.2
            ? T.snow2
            : T.snow
          : theme.ground === 'sand'
            ? k < 0.15
              ? T.sand2
              : T.sand
            : k < 0.05
              ? T.flowers
              : k < 0.18
                ? T.grass2
                : T.grass;
      room.ground(x, y, tile);
    }
  const pave = (x0: number, y0: number, w: number, h: number) => {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) room.ground(x, y, rng.chance(0.15) ? T.stone2 : T.stone);
  };
  const fill = (x0: number, y0: number, w: number, h: number, tile: number) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) room.put(x, y, tile);
  };
  /** 2×2 など 大きな絵（first から 行ごとの 番号） */
  const big = (x0: number, y0: number, w: number, h: number, first: number) => {
    for (let k = 0; k < w * h; k++) room.put(x0 + (k % w), y0 + Math.floor(k / w), first + k);
  };
  /** 広場の まん中：その県の 名所（お城・五重塔・神社・温泉・灯台・タワー・時計台・山車・恐竜）か ふんすい */
  const plazaArt = () => {
    switch (theme.plaza) {
      case 'castle':
      case 'redCastle': {
        const red = theme.plaza === 'redCastle';
        const roofTile = red ? T.roofRyukyu : T.castleRoof;
        fill(25, 10, 2, 1, roofTile);
        fill(24, 11, 4, 1, roofTile);
        fill(24, 12, 4, 1, red ? T.redWall : T.castleWall);
        fill(23, 13, 6, 1, roofTile);
        fill(23, 14, 6, 1, red ? T.redWall : T.castleBase);
        break;
      }
      case 'pagoda':
        big(25, 10, 2, 5, T.pagoda);
        room.put(23, 14, T.stoneLantern);
        room.put(28, 14, T.stoneLantern);
        break;
      case 'shrine':
        fill(24, 10, 4, 2, T.roofKawara);
        fill(24, 12, 4, 1, T.shrineWall);
        big(25, 13, 2, 2, T.torii);
        break;
      case 'onsen':
        for (let y = 12; y <= 14; y++) for (let x = 24; x <= 27; x++) room.solid(x, y, T.onsen);
        for (const [x, y] of [
          [24, 12],
          [27, 13],
          [25, 14],
        ] as const)
          room.put(x, y, T.steam);
        room.put(23, 12, T.stoneLantern);
        room.put(28, 12, T.stoneLantern);
        break;
      case 'lighthouse':
        [T.lighthouseTop, T.lighthouseMid, T.lighthouseBase].forEach((tile, k) => room.put(25, 12 + k, tile));
        break;
      case 'tower':
        big(25, 10, 2, 5, T.tower);
        break;
      case 'clock':
        big(25, 12, 2, 3, T.clock);
        break;
      case 'float':
        big(25, 13, 2, 2, T.float);
        break;
      case 'dino':
        big(25, 13, 2, 2, T.dino);
        break;
      default:
        big(25, 13, 2, 2, T.fountain);
    }
  };

  // ───── 都会の 町（大きな 都市の 県。scripts/data/towns.ts の style: 'city'） ─────
  // 北に 駅と 線路、そこから 南へ 大通りの ごばん（横断歩道・信号）、あいだの 区画に 高い ビル。
  // 駅前は 石だたみの 広場で、まん中は その県の 名所。田んぼ・井戸などの いなかの 小物は 出さない
  if (theme.style === 'city') {
    const look = CITY_LOOKS[prefId];
    const towerOf: Record<CityBuilding, number> = {
      glass: T.towerGlass,
      brick: T.towerBrick,
      white: T.towerWhite,
      steel: T.towerSteel,
    };
    const neonOf: Record<CitySign, number> = { red: T.neonRed, blue: T.neonBlue, green: T.neonGreen };
    const towers = (look?.buildings ?? ['glass', 'white']).map((k) => towerOf[k]);
    const neon = neonOf[look?.sign ?? 'blue'];
    /** 大通り（たては x と x+1、よこは y と y+1）と 駅前の 広場 */
    const aveX = [6, 16, 25, 34, 44];
    const aveY = [8, 18, 30, 36];
    const inPlaza = (x: number, y: number) => x >= 18 && x <= 33 && y >= 10 && y <= 17;
    const roads = new Set<number>();
    const road = (x: number, y: number, tile: number) => {
      room.ground(x, y, tile);
      roads.add(room.i(x, y));
    };
    // 歩道で うめてから、道路の ごばんを 引く
    for (let y = 0; y < ROOM_H; y++)
      for (let x = 0; x < ROOM_W; x++) room.ground(x, y, rng.chance(0.06) ? T.manhole : T.sidewalk);
    for (const x of aveX)
      for (let y = 4; y <= 37; y++) {
        if (inPlaza(x, y)) continue;
        road(x, y, T.roadLineV);
        road(x + 1, y, T.road);
      }
    for (const y of aveY)
      for (let x = 2; x <= ROOM_W - 3; x++) {
        road(x, y, T.roadLineH);
        road(x, y + 1, T.road);
      }
    // 南の 出口までの 道
    for (let y = 38; y < ROOM_H; y++) {
      road(25, y, T.roadLineV);
      road(26, y, T.road);
    }
    // 交差点の 横断歩道
    for (const x of aveX)
      for (const y of aveY) {
        const cx = x - 2;
        if (cx >= 2) {
          road(cx, y, T.crossH);
          road(cx, y + 1, T.crossH);
        }
        const cy = y + 3;
        if (cy <= 37 && !inPlaza(x, cy)) {
          road(x, cy, T.crossV);
          road(x + 1, cy, T.crossV);
        }
      }
    // 駅前の 広場（石だたみ）と、まん中の 名所
    for (let y = 10; y <= 17; y++)
      for (let x = 18; x <= 33; x++) room.ground(x, y, rng.chance(0.18) ? T.pavement2 : T.pavement);
    plazaArt();
    // 北は 駅：線路（通れない）・ホーム・駅の 建物・電車
    for (let x = 0; x < ROOM_W; x++) {
      room.solid(x, 0, T.cityWall);
      room.solid(x, 1, T.cityWall);
      room.solid(x, 2, T.rail);
      room.solid(x, 3, T.platform);
    }
    big(23, 0, 3, 2, T.station);
    big(12, 2, 2, 1, T.train);
    // 東西と 南の ふちは ビルの かべ（南の まん中だけ 出口）
    for (let y = 0; y < ROOM_H; y++)
      for (const x of [0, 1, ROOM_W - 2, ROOM_W - 1]) room.solid(x, y, y % 5 === 0 ? T.cityTop : T.cityWall);
    for (let x = 0; x < ROOM_W; x++)
      if (x !== 25 && x !== 26) {
        room.solid(x, ROOM_H - 2, T.cityTop);
        room.solid(x, ROOM_H - 1, T.cityWall);
      }
    /** 都会の お店：いちばん上が ビルの 屋上、下が まどの かべ、1 階は ガラスの かべと とびら */
    const cityShop = (x0: number, y0: number, w: number, h: number): Pt => {
      const doorX = x0 + 2;
      for (let y = y0; y < y0 + h; y++)
        for (let x = x0; x < x0 + w; x++) {
          const row = y - y0;
          room.solid(
            x,
            y,
            row === 0 ? T.cityTop : row < h - 1 ? T.cityWall : x === doorX ? T.door : T.cityGlass,
          );
        }
      return [doorX, y0 + h];
    };
    const npcs = TOWN_NPCS.get(prefId) ?? [];
    const roles = [...new Set([...npcs.map((n) => n.role), ...DEFAULT_ROLES])];
    const shops = roles.filter((r) => r in SHOP_ROOF);
    // お店の ビル（区画の 中いっぱい。とびらの 前は 道路に めんした 歩道）
    const citySlots: [number, number, number][] = [
      [19, 20, 29],
      [28, 20, 29],
      [9, 10, 17],
      [37, 10, 17],
      [9, 20, 29],
      [37, 20, 29],
      [9, 32, 35],
      [37, 32, 35],
    ];
    citySlots.forEach(([sx, y0, y1], k) => {
      const [fx, fy] = cityShop(sx, y0 + 1, 4, y1 - y0 - 1);
      const role = shops[k];
      if (!role) return;
      room.objects.push({
        name: npcs.find((n) => n.role === role)?.id ?? `npc_${role}`,
        type: 'npc',
        at: [fx, fy],
        properties: [str('role', role), int('signX', fx + 1), int('signY', fy - 2)],
      });
    });
    // 区画の 中に 高い ビル（2 マスはば。屋上・かべ・1 階）。ところどころ 小さな 公園と 駐車場
    const freeBox = (x0: number, y0: number, x1: number, y1: number) => {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!room.open(x, y)) return false;
      return true;
    };
    for (const [x0, x1] of [
      [2, 5],
      [8, 15],
      [18, 24],
      [27, 33],
      [36, 43],
      [46, 49],
    ] as const)
      for (const [y0, y1] of [
        [4, 7],
        [10, 17],
        [20, 29],
        [32, 35],
      ] as const) {
        const [ix0, ix1, iy0, iy1] = [x0 + 1, x1 - 1, y0 + 1, y1 - 1];
        if (inPlaza(ix0, iy0)) continue;
        for (let x = ix0; x + 1 <= ix1; x += 2) {
          if (!freeBox(x, iy0, x + 1, iy1)) continue;
          const k = rng.next();
          if (k < 0.16) {
            // ビルの 谷間の 小さな 公園
            for (let y = iy0; y <= iy1; y++) {
              room.ground(x, y, T.lawn);
              room.ground(x + 1, y, T.lawn);
            }
            room.put(x, iy0, T.streetTree);
            room.put(x + 1, iy1, T.planter);
            continue;
          }
          if (k < 0.26) {
            for (let y = iy0; y <= iy1; y++) {
              room.ground(x, y, T.parking);
              room.ground(x + 1, y, T.parking);
            }
            continue;
          }
          const first = rng.pick(towers);
          for (let y = iy0; y <= iy1; y++) {
            const row = y === iy0 ? 0 : y === iy1 ? 4 : 2;
            room.solid(x, y, first + row);
            room.solid(x + 1, y, first + row + 1);
          }
        }
      }
    // 町かどの もの：道路に めんした 歩道にだけ 置く（道を ふさがない）
    const nearRoad = (x: number, y: number) =>
      (
        [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as Pt[]
      ).some(([dx, dy]) => room.inside(x + dx, y + dy) && roads.has(room.i(x + dx, y + dy)));
    const deco = (x: number, y: number, tile: number) => {
      if (room.open(x, y) && nearRoad(x, y)) room.put(x, y, tile);
    };
    const street = [
      T.streetTree,
      neon,
      T.streetTree,
      T.vending,
      T.planter,
      T.streetTree,
      T.busStop,
      T.postBox,
    ];
    let step = 0;
    for (const y of aveY)
      for (let x = 3; x <= ROOM_W - 4; x += 3) {
        deco(x, y - 1, street[step++ % street.length]!);
        deco(x, y + 2, street[step++ % street.length]!);
      }
    for (const x of aveX)
      for (let y = 5; y <= 36; y += 4) {
        deco(x - 1, y, street[step++ % street.length]!);
        deco(x + 2, y, street[step++ % street.length]!);
      }
    // 交差点の 信号・歩道橋・地下鉄の 入口
    for (const x of aveX)
      for (const y of aveY) {
        deco(x - 1, y - 1, T.signal);
        deco(x + 2, y + 2, T.signal);
      }
    for (const x of [24, 27]) deco(x, 7, T.overpass);
    for (const x of [20, 31]) deco(x, 17, T.subway);
    // 駅前の 広場の まわり：花だん・ベンチ・屋台・街灯・けいじばん・電光の 看板
    for (const [x, y] of [
      [19, 11],
      [32, 11],
      [19, 15],
      [32, 15],
    ] as const)
      room.put(x, y, T.flowerBed);
    room.put(21, 12, T.bench);
    room.put(30, 12, T.bench);
    room.put(20, 14, T.cityTent);
    room.put(31, 14, T.cityTent);
    for (const [x, y] of [
      [18, 10],
      [33, 10],
      [18, 16],
      [33, 16],
    ] as const)
      room.put(x, y, lampTile);
    room.put(21, 16, T.streetTree);
    room.put(30, 16, T.streetTree);
    room.put(18, 13, neon);
    room.put(33, 13, neon);
    room.put(32, 12, T.board);
    // けいじばんの人（広場）と、町の人
    if (roles.includes('board'))
      room.objects.push({
        name: npcs.find((n) => n.role === 'board')?.id ?? 'npc_board',
        type: 'npc',
        at: [31, 12],
        properties: [str('role', 'board')],
      });
    const talk = npcs.filter((n) => n.role === 'talk');
    (
      [
        [23, 16],
        [29, 16],
        [14, 31],
        [38, 37],
      ] as Pt[]
    ).forEach((at, k) =>
      room.objects.push({
        name: talk[k]?.id ?? `npc_talk_${k + 1}`,
        type: 'npc',
        at,
        properties: [str('role', 'talk')],
      }),
    );
    room.objects.push(
      { name: 'spawn', type: 'spawn', at: [25, 35] },
      { name: 'from_field', type: 'spawn', at: [25, 35] },
      {
        name: 'to_field',
        type: 'transition',
        at: [25, ROOM_H - 2],
        w: 2,
        properties: warp(`${prefId}-field`, 'from_town'),
      },
    );
    // 人と 入口の マスは かならず 歩けるように する
    for (const o of room.objects)
      for (let dx = 0; dx < (o.w ?? 1); dx++) {
        const i = room.i(o.at[0] + dx, o.at[1]);
        room.decor[i] = 0;
        room.block[i] = false;
      }
    return room.toMap();
  }

  // まわりは 木と いけがき（南の まん中が 出口）
  for (let y = 0; y < ROOM_H; y++)
    for (let x = 0; x < ROOM_W; x++) {
      const edge = Math.min(x, y, ROOM_W - 1 - x, ROOM_H - 1 - y);
      if (edge > 1 || ((x === 25 || x === 26) && y >= ROOM_H - 2)) continue;
      room.put(x, y, edge === 0 || rng.chance(0.7) || theme.ground === 'snow' ? treeTile : T.hedge);
    }
  // 海ぞいの 町：北が 海（船・桟橋）と すなはま
  if (theme.coast) {
    for (let x = 0; x < ROOM_W; x++) {
      for (let y = 0; y < 3; y++) room.decor[room.i(x, y)] = 0;
      room.solid(x, 0, T.water);
      room.solid(x, 1, T.water);
      room.ground(x, 2, theme.ground === 'snow' ? T.snow : T.sand);
    }
    for (const x of [12, 39]) {
      room.ground(x, 1, T.pier);
      room.ground(x, 2, T.pier);
    }
    for (const [x, y] of [
      [11, 1],
      [40, 1],
      [20, 0],
      [31, 0],
    ] as const)
      room.put(x, y, T.boat);
    if (theme.extras.includes('seaTorii')) room.solid(25, 1, T.seaTorii);
  }
  // 道：南北の大通り、東西の 2 本、北と南の 小道。広場
  pave(25, 18, 2, ROOM_H - 18);
  pave(2, 18, ROOM_W - 4, 2);
  pave(2, 30, ROOM_W - 4, 2);
  pave(2, 8, ROOM_W - 4, 2);
  pave(2, 36, ROOM_W - 4, 2);
  pave(19, 10, 14, 8);
  // 広場の まん中：その県の 名所（お城・五重塔・神社・温泉・灯台・タワー・時計台・山車・恐竜）か ふんすい
  plazaArt();
  // 広場の まわり：花だん・ベンチ・やたい・街灯・けいじばん
  for (const [x, y] of [
    [21, 11],
    [30, 11],
    [21, 16],
    [30, 16],
  ] as const)
    room.put(x, y, T.flowerBed);
  room.put(22, 13, T.bench);
  room.put(29, 13, T.bench);
  room.put(20, 14, T.stall);
  room.put(31, 14, T.stall);
  for (const [x, y] of [
    [19, 10],
    [32, 10],
    [19, 17],
    [32, 17],
  ] as const)
    room.put(x, y, lampTile);
  // けいじばんは 広場の 右（まん中は 名所が 大きく 使う）
  room.put(31, 11, T.board);

  /** 建物：上から 屋根、まどの ある かべ、とびらの ある かべ。とびらの前（1 マス下）の マスを返す */
  const building = (bx: number, by: number, w: number, h: number, roof: number): Pt => {
    const doorX = bx + 2;
    for (let y = by; y < by + h; y++)
      for (let x = bx; x < bx + w; x++) {
        const row = y - by;
        if (row < h - 2) room.solid(x, y, roof);
        else if (row === h - 2) room.solid(x, y, (x - bx) % 3 === 1 ? T.window : T.wall);
        else room.solid(x, y, x === doorX ? T.door : x - bx === w - 2 ? T.window : T.wall);
      }
    return [doorX, by + h];
  };

  // 大通りぞいの 建物（6×5）。とびらは 道の がわ。お店が足りない所は 大きな家。
  // content に 書いていなくても、おみせ・やどや・かじや・けいじばん は どの町にも ある
  const npcs = TOWN_NPCS.get(prefId) ?? [];
  const roles = [...new Set([...npcs.map((n) => n.role), ...DEFAULT_ROLES])];
  const shops = roles.filter((r) => r in SHOP_ROOF);
  /** お店の 屋根：町の 屋根に その色が あれば その色、無ければ 町の 屋根から（お店は かべの 看板で わかる） */
  const shopRoof = (role: string) => {
    const c = SHOP_ROOF[role]!;
    return roofs.includes(c) ? c : roofs[shops.indexOf(role) % roofs.length]!;
  };
  const slots: Pt[] = [
    [11, 13],
    [35, 13],
    [4, 13],
    [42, 13],
    [11, 25],
    [35, 25],
    [4, 25],
    [42, 25],
  ];
  slots.forEach(([bx, by], k) => {
    const role = shops[k];
    const [fx, fy] = building(bx, by, 6, 5, role ? shopRoof(role) : rng.pick(roofs));
    if (!role) return;
    // 沖縄：お店の 入口の 両がわに シーサー
    if (theme.extras.includes('shisa')) {
      room.put(fx - 2, fy, T.shisa);
      room.put(fx + 2, fy, T.shisa);
    }
    room.objects.push({
      name: npcs.find((n) => n.role === role)?.id ?? `npc_${role}`,
      type: 'npc',
      at: [fx, fy],
      properties: [str('role', role), int('signX', fx + 1), int('signY', fy - 2)],
    });
    if (role === 'smith') {
      room.put(bx - 1, by + 4, T.barrel);
      room.put(bx + 6, by + 4, T.crate);
    }
  });
  // 北の小道・南の小道ぞいの 家（5×4）と、家の うらの さく
  for (const bx of [4, 11, 18, 28, 35, 42]) building(bx, 4, 5, 4, rng.pick(roofs));
  for (const bx of [4, 11, 35, 42]) building(bx, 32, 5, 4, rng.pick(roofs));
  for (let x = 3; x < ROOM_W - 3; x++) room.put(x, 3, T.fence);
  // 南の 畑（特産品。実のなる木は 1 マスおき、田んぼ・茶畑・花畑などは しきつめる）
  theme.fields.forEach((kind, i) => {
    const { tile, tree } = FIELD_TILES[kind];
    const x0 = i === 0 ? 17 : 28;
    for (let y = 32; y <= 35; y += tree ? 2 : 1)
      for (let x = x0; x <= x0 + 6; x += tree ? 2 : 1) room.put(x, y, tile);
  });
  // 大通りの あいだの 草原：町の木と 畑の 実のなる木・井戸・街灯
  const fruit = theme.fields.map((k) => FIELD_TILES[k]).find((f) => f.tree)?.tile ?? treeTile;
  for (let y = 20; y <= 24; y++)
    for (let x = 3; x < ROOM_W - 3; x++)
      if ((x < 24 || x > 27) && rng.chance(0.1)) room.put(x, y, rng.chance(0.3) ? fruit : treeTile);
  room.put(20, 22, T.well);
  for (const [x, y] of [
    [24, 21],
    [27, 21],
    [24, 27],
    [27, 27],
    [24, 33],
    [27, 33],
    [8, 20],
    [16, 20],
    [35, 20],
    [43, 20],
  ] as const)
    room.put(x, y, lampTile);
  // 町に ちらばる 小物（雪だるま・シカ・湯けむり）。大通りの あいだの 草原の あいている マスに
  const scatter = (tile: number, n: number) => {
    for (let tries = 0, placed = 0; placed < n && tries < 300; tries++) {
      const x = 3 + Math.floor(rng.next() * (ROOM_W - 6));
      const y = 20 + Math.floor(rng.next() * 5);
      if ((x >= 22 && x <= 29) || !room.open(x, y)) continue;
      room.put(x, y, tile);
      placed++;
    }
  };
  if (theme.extras.includes('snowmen')) scatter(T.snowman, 5);
  if (theme.extras.includes('deer')) scatter(T.deer, 6);
  if (theme.extras.includes('steam')) scatter(T.steam, 6);
  // けいじばんの人（広場）と、町の人
  if (roles.includes('board'))
    room.objects.push({
      name: npcs.find((n) => n.role === 'board')?.id ?? 'npc_board',
      type: 'npc',
      at: [31, 12],
      properties: [str('role', 'board')],
    });
  const talk = npcs.filter((n) => n.role === 'talk');
  (
    [
      [23, 15],
      [29, 15],
      [14, 31],
      [38, 37],
    ] as Pt[]
  ).forEach((at, k) =>
    room.objects.push({
      name: talk[k]?.id ?? `npc_talk_${k + 1}`,
      type: 'npc',
      at,
      properties: [str('role', 'talk')],
    }),
  );
  room.objects.push(
    { name: 'spawn', type: 'spawn', at: [25, 35] },
    { name: 'from_field', type: 'spawn', at: [25, 35] },
    {
      name: 'to_field',
      type: 'transition',
      at: [25, ROOM_H - 2],
      w: 2,
      properties: warp(`${prefId}-field`, 'from_town'),
    },
  );
  return room.toMap();
}

/**
 * ダンジョン：へやと 通路（形は県ごとに決まる。シードは県 id）。入口の 実在の 場所に 合わせた テーマ
 * （DUNGEON_THEMES・裏ステージは SECRET_THEMES）で タイルも 形も かえる：
 *   castle・house は ごばんの ように ならべた へや、mine は 細い 坑道と 小さな へや、
 *   limestone・gorge などは 角を けずった まるい へやと 水の すじ。
 * かべの前の面・たいまつ・テーマの 置きもの。いちばん おくの へやに さいだんと たからばこ、
 * ダンジョンの イベント（content の events で trigger.map が <県>-dungeon のもの）。
 * kind が 'secret' なら 裏ステージ（お城・やしきの 中。おくに ラスボス）
 */
function dungeonMap(prefId: string, eventNames: string[], kind: 'dungeon' | 'secret' = 'dungeon'): object {
  const secret = kind === 'secret';
  const rng = createRng(`${kind}:${prefId}`);
  const th =
    THEMES[(secret ? SECRET_THEMES[prefId] : DUNGEON_THEMES[prefId]) ?? (secret ? 'shrine' : 'cave')];
  const room = new Room(th.wall, true);
  interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
  }
  const shape = th.shape ?? 'cave';
  const entrance: Box = { x: 21, y: 30, w: 10, h: 7 };
  const boxes: Box[] = [entrance];
  if (shape === 'grid') {
    // お城・やしき：たたみの へやを ごばんの ように 直角に ならべる（ところどころ 中庭）
    for (const y of [3, 12, 21])
      for (const x of [3, 15, 27, 39]) {
        if (boxes.length >= 9 || (boxes.length > 4 && rng.chance(0.25))) continue;
        boxes.push({ x, y, w: 10, h: 7 });
      }
  } else {
    // 鉱山は 小さな へやを たくさん（あいだの 長い 坑道が 主役）。ほかは ばらばらの へや
    const [wMin, wMax, hMin, hMax, max] = shape === 'tunnel' ? [5, 8, 4, 6, 11] : [6, 11, 5, 8, 9];
    for (let tries = 0; tries < 500 && boxes.length < max; tries++) {
      const w = rng.int(wMin, wMax);
      const h = rng.int(hMin, hMax);
      const x = rng.int(2, ROOM_W - 3 - w);
      const y = rng.int(2, 27 - h);
      if (boxes.some((o) => x < o.x + o.w + 2 && o.x < x + w + 2 && y < o.y + o.h + 2 && o.y < y + h + 2))
        continue;
      boxes.push({ x, y, w, h });
    }
  }
  const floor = (x: number, y: number) => room.ground(x, y, rng.chance(0.12) ? th.floor2 : th.floor);
  // round（鍾乳洞・渓谷・海の 洞くつ・森）は へやの 角を けずって まるくする
  const corner = (b: Box, x: number, y: number) =>
    Math.min(x - b.x, b.x + b.w - 1 - x) + Math.min(y - b.y, b.y + b.h - 1 - y) < 1.5;
  for (const b of boxes)
    for (let y = b.y; y < b.y + b.h; y++)
      for (let x = b.x; x < b.x + b.w; x++) if (shape !== 'round' || !corner(b, x, y)) floor(x, y);
  const center = (b: Box): Pt => [b.x + Math.floor(b.w / 2), b.y + Math.floor(b.h / 2)];
  // 通路は はば 2 マス。L 字に つなぐ
  const hline = (x0: number, x1: number, y: number) => {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1) + 1; x++) {
      floor(x, y);
      floor(x, y + 1);
    }
  };
  const vline = (y0: number, y1: number, x: number) => {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1) + 1; y++) {
      floor(x, y);
      floor(x + 1, y);
    }
  };
  const link = (a: Box, b: Box) => {
    const [ax, ay] = center(a);
    const [bx, by] = center(b);
    if (rng.chance(0.5)) {
      hline(ax, bx, ay);
      vline(ay, by, bx);
    } else {
      vline(ay, by, ax);
      hline(ax, bx, by);
    }
  };
  const d2 = (p: Pt, q: Pt) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
  for (let k = 1; k < boxes.length; k++) {
    const c = center(boxes[k]!);
    link(
      boxes[k]!,
      boxes.slice(0, k).reduce((a, b) => (d2(center(b), c) < d2(center(a), c) ? b : a)),
    );
  }
  if (boxes.length > 3) link(boxes[1]!, boxes[boxes.length - 1]!); // ぐるっと回れる道を 1 本
  for (let y = entrance.y + entrance.h; y <= ROOM_H - 2; y++) {
    floor(25, y);
    floor(26, y);
  }
  // round は 水の すじを 1 本 通す（歩ける。床の 絵だけ かえる）
  if (shape === 'round')
    for (let x = 0; x < ROOM_W; x++) {
      const y = 16 + Math.round(6 * Math.sin(x / 6));
      for (const yy of [y, y + 1]) if (!room.block[room.i(x, yy)]) room.bg[room.i(x, yy)] = th.floor2;
    }
  // 床の すぐ上の かべは「前の面」。ところどころに たいまつ
  for (let y = 0; y < ROOM_H - 1; y++)
    for (let x = 0; x < ROOM_W; x++) {
      if (!room.block[room.i(x, y)] || room.block[room.i(x, y + 1)]) continue;
      room.bg[room.i(x, y)] = th.face;
      if (th.torches && (x + y) % 5 === 0 && rng.chance(0.7)) room.put(x, y, T.torch);
    }
  // 入口からの 道のり。いちばん遠い へやが おくの へや
  const spawn: Pt = [25, 35];
  const dist = new Int32Array(ROOM_W * ROOM_H).fill(-1);
  const start = room.i(...spawn);
  dist[start] = 0;
  const queue = [start];
  for (let h = 0; h < queue.length; h++) {
    const i = queue[h]!;
    const x = i % ROOM_W;
    for (const j of [x > 0 ? i - 1 : -1, x < ROOM_W - 1 ? i + 1 : -1, i - ROOM_W, i + ROOM_W])
      if (j >= 0 && j < dist.length && dist[j] === -1 && !room.block[j]) {
        dist[j] = dist[i]! + 1;
        queue.push(j);
      }
  }
  const far = boxes
    .slice(1)
    .reduce(
      (a, b) => (dist[room.i(...center(b))]! > dist[room.i(...center(a))]! ? b : a),
      boxes[1] ?? entrance,
    );
  // 物を置いてよい マス：まわり 8 マスが ぜんぶ 床（置いても 通り道を ふさがない）で、物体から はなれている
  const taken: Pt[] = [spawn];
  const near = (p: Pt, q: Pt, r: number) => Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1])) <= r;
  const roomy = (x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) if (!room.open(x + dx, y + dy)) return false;
    return true;
  };
  const spotIn = (b: Box, gap: number): Pt | null => {
    const cells: Pt[] = [];
    for (let y = b.y; y < b.y + b.h; y++)
      for (let x = b.x; x < b.x + b.w; x++)
        if (roomy(x, y) && taken.every((t) => !near(t, [x, y], gap))) cells.push([x, y]);
    return cells.length ? rng.pick(cells) : null;
  };
  const place = (name: string, type: string, at: Pt | null, properties?: Prop[]) => {
    if (!at) return;
    room.objects.push({ name, type, at, properties });
    taken.push(at);
  };
  // おくの へや：さいだん、その前に たからばこ、イベント
  const [fx] = center(far);
  const altar: Pt = roomy(fx, far.y + 1) ? [fx, far.y + 1] : (spotIn(far, 1) ?? center(far));
  room.put(altar[0], altar[1], th.altar ?? T.altar);
  taken.push(altar);
  const front: Pt = [altar[0], altar[1] + 2];
  place(
    `chest_${prefId}_${secret ? 'secret_' : ''}treasure`,
    'chest',
    room.open(...front) ? front : spotIn(far, 1),
    [str('itemId', 'common-dou-no-ken'), str('itemName', 'どうのけん'), int('count', 1)],
  );
  for (const name of eventNames) place(name, 'event', spotIn(far, 1) ?? spotIn(entrance, 1));
  // ほかの へやの たからばこ（その県の 名産の たべもの）
  boxes
    .slice(1)
    .filter((b) => b !== far)
    .slice(0, 2)
    .forEach((b, k) =>
      place(`chest_${prefId}_${kind}${k ? k + 1 : ''}`, 'chest', spotIn(b, 2), localFoodProps(prefId, 2)),
    );
  // 岩・クリスタル・みずたまり など
  const props: Pt[] = [];
  for (const b of boxes)
    for (let k = b === entrance ? 1 : rng.int(1, 3); k > 0; k--) {
      const at = spotIn(b, 2);
      if (!at || props.some((p) => near(p, at, 2))) continue;
      room.put(at[0], at[1], rng.pick(th.props));
      props.push(at);
    }
  // 県ボス：たからばこの 手前に 立って、さいだんを まもる（だれかは content/prefectures/<県>.json の boss。マップには場所だけ）。
  // ほかの物を ぜんぶ 置いてから、乱数を 使わずに えらぶ（ほかの物の 場所は 変わらない）
  const guard: Pt = [front[0], front[1] + 1];
  const free = (x: number, y: number) =>
    roomy(x, y) && [...taken, ...props].every((t) => t[0] !== x || t[1] !== y);
  let boss: Pt | null = free(...guard) ? guard : null;
  for (let y = far.y; !boss && y < far.y + far.h; y++)
    for (let x = far.x; x < far.x + far.w; x++)
      if (free(x, y) && (!boss || d2([x, y], guard) < d2(boss, guard))) boss = [x, y];
  // 裏ステージは ラスボス（だれかは content の secret.boss）
  place(secret ? `lastboss_${prefId}` : `boss_${prefId}`, secret ? 'lastboss' : 'boss', boss);
  room.objects.push(
    { name: 'spawn', type: 'spawn', at: spawn },
    { name: 'from_field', type: 'spawn', at: spawn },
    {
      name: 'to_field',
      type: 'transition',
      at: [25, ROOM_H - 2],
      w: 2,
      properties: warp(`${prefId}-field`, secret ? 'from_secret' : 'from_dungeon'),
    },
  );
  return room.toMap();
}

const triggers = eventTriggers();
for (const pref of PREFECTURES) {
  const events = (triggers.get(`${pref.id}-field`) ?? []).map((e) => e.name);
  if (only) {
    if (pref.id === only) await saveMap(`${pref.id}-field.json`, fieldMap(pref, events));
    continue;
  }
  await saveMap(`${pref.id}-field.json`, fieldMap(pref, events));
  await saveMap(`${pref.id}-town.json`, townMap(pref.id));
  const inDungeon = (triggers.get(`${pref.id}-dungeon`) ?? []).map((e) => e.name);
  await saveMap(`${pref.id}-dungeon.json`, dungeonMap(pref.id, inDungeon));
  if (SECRETS.has(pref.id)) await saveMap(`${pref.id}-secret.json`, dungeonMap(pref.id, [], 'secret'));
}
if (!only) {
  for (const enc of ENCLAVES) await saveMap(`${enc.enclaveId}.json`, enclaveMap(enc));
  await saveWorldMap(worldMap(triggers));
}
for (const [prefId, spots] of Object.entries(only ? {} : LANDMARK_SPOTS))
  for (const motifId of Object.keys(spots))
    if (!placedLandmarks.get(prefId)?.includes(motifId))
      console.warn(
        `  ${prefId}: 名所 ${motifId} は、どのマップの範囲にも入らないので置きませんでした（geo.ts）`,
      );

console.log(`Successfully generated maps from real geography! (${createdCount} map files processed)`);
