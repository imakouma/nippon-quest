/**
 * 名所の絵：建物・橋・町なみ（城・神社・お寺・温泉・橋・灯台・港・古い町なみ…）。
 * それぞれ 32×32 の えはがき。背景（空・地面）から かいて、主役は layer() で ふちどる。v で えらび。
 * src/rendering/motifArt/index.ts の MOTIF_SCENES が どの 名所に どれを 使うか。
 */
import { makeGrid } from '../grid';
import {
  MA,
  NQ,
  box,
  cloud,
  dot,
  ground,
  hills,
  layer,
  moon,
  oval,
  sea,
  seg,
  sh,
  sky,
  sun,
  thick,
  tree,
  tri,
  type Grid,
  type SceneFn,
} from './kit';

export type BuildingKey =
  | 'castle'
  | 'castleRed'
  | 'starFort'
  | 'castleRuins'
  | 'shrine'
  | 'toriiSea'
  | 'toriiRow'
  | 'temple'
  | 'pagoda'
  | 'goldPavilion'
  | 'cliffStage'
  | 'mountainTemple'
  | 'daibutsu'
  | 'stoneBuddha'
  | 'onsen'
  | 'sandBath'
  | 'archBridge'
  | 'bigBridge'
  | 'vineBridge'
  | 'lighthouse'
  | 'port'
  | 'fishingVillage'
  | 'church'
  | 'oldTown'
  | 'thatched'
  | 'garden'
  | 'sunTower'
  | 'tokyoTower'
  | 'lanternGate'
  | 'chinaGate'
  | 'kofun'
  | 'pitHouse'
  | 'stoneTomb'
  | 'mine'
  | 'brickFactory'
  | 'warehouse'
  | 'school'
  | 'ornateGate'
  | 'undergroundHall'
  | 'quarry'
  | 'sandArt'
  | 'kilnVillage'
  | 'stonePath';

// ───────────────────────── この ファイルの 小道具 ─────────────────────────

/** seed と 番号から 0〜1 の 数（木の 位置を 少し ずらす） */
const rnd = (seed: number, i: number): number => {
  const s = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/** 水に うつる 色（すこし くらく） */
const wet = (c: string): string => {
  const s = sh(c);
  return s === NQ.ink ? NQ.blue : s;
};

/** 水面（axis の 行）より 上に かいた ものを、下に さかさに うつす（ゆらゆら 1 行ぬき） */
function reflect(g: Grid, draw: (l: Grid) => void, axis: number, map: (c: string) => string = wet): void {
  const l = makeGrid(MA, MA);
  draw(l);
  for (let y = 1; y < axis; y++)
    for (let x = 1; x < MA - 1; x++) {
      const c = l[y]![x];
      const yy = 2 * axis - y;
      if (c && (yy - axis) % 3 !== 2) dot(g, x, yy, map(c));
    }
}

/** 屋根の ひさし 2 だん（はしが はねる）。x0..x1 は 下の かべの はば、y は 下の だん */
function eave(l: Grid, x0: number, x1: number, y: number, col: string, edge: string = col): void {
  box(l, x0 - 1, y - 1, x1 + 1, y - 1, col);
  box(l, x0 - 1, y, x1 + 1, y, edge);
  dot(l, x0 - 2, y - 1, col);
  dot(l, x1 + 2, y - 1, col);
}

/** お寺・神社の 大きな 屋根（上は せまく、下で ぐっと ひろがる。はしが はねる） */
function bigRoof(
  l: Grid,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  col: string,
  edge: string = col,
  ins?: number,
): void {
  const h = Math.max(1, y1 - y0);
  const inset = ins ?? Math.min(h * 1.3, (x1 - x0) / 2 - 1);
  for (let y = y0; y <= y1; y++) {
    const t = (y - y0) / h;
    const d = Math.round(inset * (1 - t * t));
    box(l, x0 + d, y, x1 - d, y, y === y1 ? edge : col);
  }
  dot(l, x0 - 1, y1 - 1, col);
  dot(l, x1 + 1, y1 - 1, col);
}

/** 石がき（下が 少し ひろがる） */
function stoneWall(l: Grid, x0: number, x1: number, y0: number, y1: number, flare = 2): void {
  for (let y = y0; y <= y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0);
    const f = Math.round(t * t * flare);
    const r = y - y0;
    for (let x = x0 - f; x <= x1 + f; x++) {
      const joint = r % 2 === 1 || (x + (r % 4 === 0 ? 0 : 2)) % 4 === 0;
      dot(l, x, y, joint ? NQ.gray : NQ.silver);
    }
  }
}

/** 鳥居（cx は まん中、by は 足もと、hw は はばの 半分、h は 高さ） */
function torii(
  l: Grid,
  cx: number,
  by: number,
  hw: number,
  h: number,
  col: string = NQ.vermilion,
  top: string = NQ.hairBlack,
): void {
  cx = Math.round(cx);
  by = Math.round(by);
  hw = Math.max(2, Math.round(hw));
  h = Math.max(4, Math.round(h));
  const w = hw >= 6 ? 2 : 1;
  const lx = cx - hw + 1;
  const rx = cx + hw - 1 - w;
  const ty = by - h;
  box(l, lx, ty + 1, lx + w - 1, by, col);
  box(l, rx, ty + 1, rx + w - 1, by, col);
  box(l, cx - hw - 1, ty, cx + hw, ty, top);
  dot(l, cx - hw - 2, ty - 1, top);
  dot(l, cx + hw + 1, ty - 1, top);
  box(l, cx - hw, ty + 1, cx + hw - 1, ty + 1, col);
  const ny = ty + (h >= 9 ? 3 : 2);
  box(l, cx - hw, ny, cx + hw - 1, ny, col);
  if (h >= 9) box(l, cx - 1, ty + 2, cx, ty + 2, col);
}

/** ゆげ（ゆらゆら 上がる） */
function steam(g: Grid, x: number, y: number, h: number, ph = 0): void {
  for (let i = 0; i < h; i++) {
    const xx = x + Math.round(Math.sin((i + ph) * 0.8) * 1.3);
    dot(g, xx, y - i, NQ.white);
    if (i < h / 2) dot(g, xx + 1, y - i, NQ.cloud);
  }
}

/** まるい しげみ（色と かげと ハイライト） */
function bush(g: Grid, cx: number, cy: number, r: number, col: string, shade: string, hi?: string): void {
  oval(g, cx, cy, r, r * 0.85, col, shade);
  if (hi) oval(g, cx - r * 0.35, cy - r * 0.4, r * 0.4, r * 0.3, hi);
}

/** さくらの 木 */
function sakura(g: Grid, cx: number, by: number, r: number): void {
  thick(g, cx, by, cx, by - r * 0.8, 0.6, NQ.brown);
  bush(g, cx, by - r * 1.2, r, NQ.blush, NQ.berry, NQ.white);
}

/** 紅葉の 木 */
function autumn(g: Grid, cx: number, cy: number, r: number, i: number): void {
  const cols: Array<[string, string]> = [
    [NQ.red, NQ.brick],
    [NQ.orange, NQ.amber],
    [NQ.vermilion, NQ.brick],
    [NQ.gold, NQ.ochre],
  ];
  const [c, s] = cols[i % cols.length]!;
  bush(g, cx, cy, r, c, s);
}

/** 手いれされた 松（たいらな 葉の かたまり） */
function pine(g: Grid, cx: number, by: number, s = 1): void {
  thick(g, cx, by, cx + 1 * s, by - 4 * s, 0.6, NQ.brown);
  seg(g, cx + s, by - 4 * s, cx - 2 * s, by - 6 * s, NQ.brown);
  oval(g, cx - 2.5 * s, by - 3.5 * s, 3 * s, 1.3 * s, NQ.green, NQ.forest);
  oval(g, cx + 3 * s, by - 5.5 * s, 3 * s, 1.3 * s, NQ.green, NQ.forest);
  oval(g, cx - 1 * s, by - 7.5 * s, 2.6 * s, 1.3 * s, NQ.green, NQ.forest);
  oval(g, cx + 1, by - 9.5 * s, 1.8 * s, 1.1 * s, NQ.green, NQ.forest);
}

/** やなぎ（たれ下がる 葉） */
function willow(g: Grid, cx: number, by: number, h: number): void {
  seg(g, cx, by, cx, by - h + 2, NQ.brown);
  oval(g, cx, by - h + 2, 3, 1.6, NQ.leaf);
  for (let i = -3; i <= 3; i++)
    seg(g, cx + i, by - h + 2, cx + i * 1.3, by - h + 7 + (Math.abs(i) % 2), NQ.leaf);
}

/** 杉（こい みどり） */
const cedar = (g: Grid, cx: number, by: number, h: number): void => tree(g, cx, by, h, NQ.forest);

/** 瓦の 家（正面、屋根は 横ながの 台形） */
function house(l: Grid, x0: number, x1: number, by: number, wh: number, wall: string, roof: string): void {
  box(l, x0, by - wh + 1, x1, by, wall);
  const ry = by - wh;
  box(l, x0 - 1, ry, x1 + 1, ry, roof);
  box(l, x0, ry - 1, x1, ry - 1, roof);
}

/** 妻を 前に むけた 家（三角の 屋根） */
function gableHouse(
  l: Grid,
  x0: number,
  x1: number,
  by: number,
  wh: number,
  wall: string,
  roof: string,
): void {
  box(l, x0, by - wh + 1, x1, by, wall);
  const cx = (x0 + x1 + 1) / 2;
  const hw = (x1 - x0 + 1) / 2 + 1;
  tri(l, cx - hw, by - wh + 1, cx + hw, by - wh + 1, cx, by - wh - hw, roof);
}

/** 小さな 人（大きさの めやす） */
function person(g: Grid, x: number, by: number, shirt: string = NQ.red): void {
  dot(g, x, by - 2, NQ.skinLight);
  dot(g, x, by - 1, shirt);
  dot(g, x, by, NQ.denim);
}

/** 石の だんだん（下が ひろく、上で せまい） */
function stairs(g: Grid, x0: number, x1: number, y0: number, t0: number, t1: number, y1: number): void {
  for (let y = y0; y <= y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0);
    const a = Math.round(t0 + (x0 - t0) * t);
    const b = Math.round(t1 + (x1 - t1) * t);
    box(g, a, y, b, y, (y1 - y) % 2 === 0 ? NQ.silver : NQ.gray);
  }
}

// ───────────────────────── 城 ─────────────────────────

interface KeepStyle {
  wall: string;
  wsh: string;
  roof: string;
  edge: string;
  win: string;
  band?: string;
  shachi?: string;
}

/** 天守（下から 1 だんずつ：かべ → ひさし。いちばん上に むね と しゃちほこ） */
function keep(l: Grid, cx: number, by: number, tiers: Array<[number, number]>, s: KeepStyle): void {
  let y = by;
  tiers.forEach(([hw, wh]) => {
    box(l, cx - hw, y - wh + 1, cx + hw - 1, y, s.wall);
    box(l, cx + hw - 1, y - wh + 1, cx + hw - 1, y, s.wsh);
    if (s.band) box(l, cx - hw, y - wh + 1, cx + hw - 1, y - wh + 1, s.band);
    for (let x = cx - hw + 1; x < cx + hw - 1; x += 2) dot(l, x, y - 1, s.win);
    y -= wh;
    eave(l, cx - hw, cx + hw - 1, y, s.roof, s.edge);
    y -= 2;
  });
  const hw = tiers[tiers.length - 1]![0];
  box(l, cx - hw + 1, y, cx + hw - 2, y, s.roof);
  box(l, cx - 1, y - 1, cx, y - 1, s.roof);
  if (s.shachi) {
    box(l, cx - hw + 1, y - 2, cx - hw + 1, y - 1, s.shachi);
    box(l, cx + hw - 2, y - 2, cx + hw - 2, y - 1, s.shachi);
  }
  // 1 だんめの 屋根の 三角（ちどりはふ）
  if (tiers.length > 1) {
    const ry = by - tiers[0]![1] - 1;
    box(l, cx - 2, ry - 1, cx + 1, ry - 1, s.roof);
    box(l, cx - 1, ry - 2, cx, ry - 2, s.roof);
    box(l, cx - 1, ry - 1, cx, ry - 1, s.wall);
  }
}

function castleStyle(v: string): KeepStyle {
  switch (v) {
    case 'black':
      return {
        wall: NQ.hairBlack,
        wsh: NQ.ink,
        roof: NQ.slate,
        edge: NQ.silver,
        win: NQ.gray,
        band: NQ.white,
      };
    case 'red':
      return { wall: NQ.white, wsh: NQ.cloud, roof: NQ.brick, edge: NQ.red, win: NQ.slate };
    case 'gold':
      return { wall: NQ.white, wsh: NQ.cloud, roof: NQ.teal, edge: NQ.gold, win: NQ.slate, shachi: NQ.gold };
    case 'night':
      return { wall: NQ.cloud, wsh: NQ.silver, roof: NQ.navy, edge: NQ.denim, win: NQ.yellow };
    case 'white':
      return { wall: NQ.white, wsh: NQ.cloud, roof: NQ.silver, edge: NQ.white, win: NQ.gray };
    default:
      return { wall: NQ.white, wsh: NQ.cloud, roof: NQ.slate, edge: NQ.gray, win: NQ.slate };
  }
}

const castle: SceneFn = (g, o) => {
  const v = o.v ?? '';
  const night = v === 'night';
  const s = castleStyle(v);
  sky(g, night ? 'night' : 'day', o.seed);
  if (night) moon(g, 26, 6, 3);
  else {
    cloud(g, 5 + (o.seed % 3), 5, 6);
    cloud(g, 26, 10, 5);
  }
  if (v === 'river') {
    hills(g, 22, 6, NQ.teal, o.seed);
    oval(g, 24, 26, 15, 9, NQ.green, NQ.forest);
    for (let i = 0; i < 4; i++) bush(g, 12 + i * 5, 20 + (i % 2), 2.4, NQ.leaf, NQ.green);
    layer(g, (l) => {
      stoneWall(l, 17, 26, 17, 18, 1);
      keep(
        l,
        22,
        16,
        [
          [4, 3],
          [3, 2],
          [2, 2],
        ],
        s,
      );
    });
    sea(g, 25, NQ.azure, o.seed);
    for (let x = 1; x < 13; x++) dot(g, x, 24, NQ.leaf);
    return;
  }
  if (v === 'black') {
    tri(g, -4, 22, 8, 9, 20, 22, NQ.slate);
    tri(g, 12, 22, 24, 8, 36, 22, NQ.gray);
    tri(g, 6, 11, 8, 9, 10, 11, NQ.white);
    tri(g, 22, 10, 24, 8, 26, 10, NQ.white);
  } else hills(g, 24, 5, night ? NQ.denim : NQ.teal, o.seed);
  ground(g, 26, night ? NQ.navy : NQ.leaf, night ? NQ.denim : NQ.lime);
  if (v === 'black') {
    box(g, 1, 27, 30, 30, NQ.azure);
    for (let i = 0; i < 5; i++) box(g, 3 + i * 6, 28 + (i % 2) * 2, 4 + i * 6, 28 + (i % 2) * 2, NQ.ice);
  }
  const tiers: Array<[number, number]> =
    v === 'small'
      ? [
          [5, 4],
          [3, 3],
        ]
      : v === 'white'
        ? [
            [7, 3],
            [5, 3],
            [4, 2],
            [3, 2],
          ]
        : [
            [6, 4],
            [4, 3],
            [3, 3],
          ];
  const by = v === 'small' ? 22 : 21;
  const hw0 = tiers[0]![0];
  if (v === 'white')
    layer(g, (l) => {
      stoneWall(l, 2, 8, 23, 26, 1);
      keep(l, 5, 22, [[3, 3]], s);
    });
  layer(g, (l) => {
    stoneWall(l, 16 - hw0 - 1, 16 + hw0, by + 1, 26, 2);
    keep(l, 16, by, tiers, s);
  });
  if (v === 'sakura' || night)
    layer(g, (l) => {
      sakura(l, 4, 30, 4);
      sakura(l, 28, 30, 4);
      sakura(l, 10 + (o.seed % 2), 30, 2.6);
      sakura(l, 22, 30, 2.6);
    });
  else if (v !== 'black' && v !== 'white')
    layer(g, (l) => {
      tree(l, 4, 29, 9, NQ.green);
      tree(l, 27, 29, 9, NQ.green);
      bush(l, 8, 28, 2.5, NQ.leaf, NQ.green);
    });
  if (v === 'sakura')
    for (let i = 0; i < 6; i++)
      dot(g, 2 + Math.floor(rnd(o.seed, i) * 28), 2 + Math.floor(rnd(o.seed, i + 9) * 14), NQ.blush);
};

/** 首里城（赤い 正殿） */
const castleRed: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 7, 4, 6);
  cloud(g, 25, 6, 5);
  ground(g, 24, NQ.beige, NQ.sand);
  for (let y = 25; y <= 30; y++)
    for (let x = 1; x <= 30; x++) if ((x + Math.floor((y - 24) * 1.5)) % 6 < 3) dot(g, x, y, NQ.brick);
  layer(g, (l) => {
    box(l, 1, 16, 5, 23, NQ.beige);
    box(l, 26, 16, 30, 23, NQ.beige);
    box(l, 1, 16, 5, 16, NQ.sand);
    box(l, 26, 16, 30, 16, NQ.sand);
  });
  layer(g, (l) => {
    bigRoof(l, 4, 27, 6, 11, NQ.brick, NQ.red);
    box(l, 6, 12, 25, 14, NQ.red);
    for (let x = 7; x <= 24; x += 3) dot(l, x, 13, NQ.gold);
    eave(l, 6, 25, 16, NQ.brick, NQ.red);
    box(l, 6, 17, 25, 23, NQ.red);
    for (let x = 6; x <= 25; x += 3) box(l, x, 17, x, 23, NQ.brick);
    box(l, 13, 19, 18, 23, NQ.vermilion);
    tri(l, 11, 16, 21, 16, 16, 11, NQ.brick);
    tri(l, 13, 16, 19, 16, 16, 13, NQ.gold);
    dot(l, 4, 5, NQ.gold);
    dot(l, 27, 5, NQ.gold);
    box(l, 4, 5, 4, 6, NQ.gold);
    box(l, 27, 5, 27, 6, NQ.gold);
  });
};

/** 星形の 堀の 城あと（上から） */
const starFort: SceneFn = (g, o) => {
  ground(g, 1, NQ.leaf);
  for (let i = 0; i < 14; i++)
    dot(g, 1 + Math.floor(rnd(o.seed, i) * 30), 1 + Math.floor(rnd(o.seed, i + 3) * 30), NQ.lime);
  const inStar = (x: number, y: number, R: number, r: number): boolean => {
    const dx = x + 0.5 - 16;
    const dy = y + 0.5 - 16.5;
    const a = Math.atan2(dy, dx) + Math.PI / 2;
    const k = (((a / ((2 * Math.PI) / 5)) % 1) + 1) % 1;
    const t = Math.abs(k - 0.5) * 2;
    return Math.hypot(dx, dy) <= r + (R - r) * Math.pow(t, 1.6);
  };
  for (let y = 1; y < 31; y++)
    for (let x = 1; x < 31; x++) {
      if (inStar(x, y, 15, 9.5)) dot(g, x, y, NQ.azure);
      if (inStar(x, y, 12.5, 7.5)) dot(g, x, y, NQ.green);
      else if (inStar(x, y, 13.2, 8.2)) dot(g, x, y, NQ.silver);
      if (inStar(x, y, 11.5, 6.8) && !inStar(x, y, 10, 5.6) && (x + y) % 3 === 0) dot(g, x, y, NQ.blush);
    }
  for (let i = 0; i < 5; i++) dot(g, 4 + i * 6, 3 + (i % 2) * 25, NQ.ice);
  layer(g, (l) => {
    box(l, 14, 15, 18, 18, NQ.white);
    box(l, 13, 14, 19, 14, NQ.brick);
    box(l, 14, 13, 18, 13, NQ.brick);
    box(l, 15, 17, 16, 18, NQ.brown);
  });
};

/** 石がきだけの 城あと（雲海 / 三日月） */
const castleRuins: SceneFn = (g, o) => {
  if (o.v === 'crescent') {
    sky(g, 'night', o.seed);
    oval(g, 10, 9, 6, 6, NQ.cream, undefined, (x, y) => (x + 0.5 - 13) ** 2 + (y + 0.5 - 7) ** 2 > 30);
    hills(g, 24, 4, NQ.forest, o.seed);
    layer(g, (l) => {
      stoneWall(l, 8, 30, 14, 30, 3);
      keep(l, 23, 13, [[4, 3]], {
        wall: NQ.white,
        wsh: NQ.cloud,
        roof: NQ.slate,
        edge: NQ.gray,
        win: NQ.slate,
      });
    });
    for (let i = 0; i < 5; i++) bush(g, 2 + i * 2, 27 + (i % 2), 2, NQ.green, NQ.forest);
    return;
  }
  sky(g, 'dusk', o.seed);
  sun(g, 25, 11, 3, NQ.apricot);
  sun(g, 25, 11, 2, NQ.cream);
  tri(g, -2, 20, 12, 6, 26, 20, NQ.green);
  tri(g, 14, 20, 28, 9, 40, 20, NQ.forest);
  layer(g, (l) => {
    stoneWall(l, 6, 17, 10, 14, 1);
    stoneWall(l, 3, 22, 14, 18, 1);
    box(l, 8, 9, 15, 9, NQ.leaf);
  });
  for (let y = 18; y < 31; y++)
    for (let x = 1; x < 31; x++) {
      const wv = Math.sin(x / 2.5 + y * 1.3 + o.seed) * 1.2;
      dot(g, x, y, y + wv < 21 ? NQ.cloud : y + wv < 25 ? NQ.white : (x + y) % 5 === 0 ? NQ.cloud : NQ.white);
    }
  cloud(g, 6, 19, 8);
  cloud(g, 24, 20, 9);
  for (let i = 0; i < 4; i++) dot(g, 2 + i * 8, 22 + (i % 2) * 3, NQ.lavender);
};

// ───────────────────────── 神社 ─────────────────────────

/** 神社の 本殿（正面） */
function shrineHall(
  l: Grid,
  cx: number,
  by: number,
  hw: number,
  c: { wall: string; pillar: string; roof: string; edge: string },
): void {
  box(l, cx - hw, by - 5, cx + hw - 1, by, c.wall);
  for (let x = cx - hw; x <= cx + hw - 1; x += 3) box(l, x, by - 5, x, by, c.pillar);
  box(l, cx + hw - 1, by - 5, cx + hw - 1, by, c.pillar);
  box(l, cx - 2, by - 3, cx + 1, by, NQ.bark);
  box(l, cx - hw - 1, by, cx + hw, by, c.pillar);
  bigRoof(l, cx - hw - 2, cx + hw + 1, by - 11, by - 6, c.roof, c.edge);
  tri(l, cx - 4, by - 6, cx + 4, by - 6, cx, by - 10, c.roof);
  box(l, cx - 1, by - 8, cx, by - 7, c.edge);
}

const HALL = { wall: NQ.white, pillar: NQ.vermilion, roof: NQ.hairBrown, edge: NQ.tan };

const shrine: SceneFn = (g, o) => {
  const v = o.v ?? '';
  sky(g, 'day', o.seed);
  if (v === 'cave') {
    cloud(g, 24, 4, 6);
    for (let y = 4; y < 24; y++)
      for (let x = 1; x < 31; x++) {
        const edge = 4 + Math.round(Math.sin(x / 3 + o.seed) * 1.5);
        if (y >= edge)
          dot(g, x, y, (x * 3 + y * 5) % 7 === 0 ? NQ.tan : (x + y * 2) % 11 === 0 ? NQ.bark : NQ.brown);
      }
    oval(g, 16, 20, 11, 11, NQ.night, undefined, (_x, y) => y < 24);
    oval(g, 16, 20, 9, 9, NQ.ink, undefined, (_x, y) => y < 17);
    layer(g, (l) => shrineHall(l, 16, 22, 5, HALL));
    sea(g, 24, NQ.azure, o.seed);
    layer(g, (l) => {
      oval(l, 5, 28, 5, 3, NQ.gray, NQ.slate);
      torii(l, 5, 26, 3, 6);
    });
    return;
  }
  if (v === 'steps') {
    for (let i = 0; i < 6; i++) cedar(g, 2 + i * 5.5, 12, 8);
    ground(g, 12, NQ.green);
    for (let i = 0; i < 4; i++) {
      cedar(g, 2 + i * 2.6, 16 + i * 4, 9);
      cedar(g, 29 - i * 2.6, 16 + i * 4, 9);
    }
    stairs(g, 9, 22, 13, 14, 17, 30);
    layer(g, (l) => shrineHall(l, 16, 12, 5, HALL));
    layer(g, (l) => torii(l, 16, 23, 5, 8));
    return;
  }
  const ise = v === 'ise';
  cloud(g, 5, 4, 5);
  for (let i = 0; i < 7; i++) cedar(g, 1 + i * 5 + (o.seed % 3), 20, 13 + (i % 2) * 3);
  hills(g, 21, 3, NQ.forest, o.seed);
  ground(g, 21, ise ? NQ.paper : NQ.beige, ise ? NQ.cloud : NQ.sand);
  for (let i = 0; i < 16; i++)
    dot(
      g,
      1 + Math.floor(rnd(o.seed, i) * 30),
      22 + Math.floor(rnd(o.seed, i + 5) * 9),
      ise ? NQ.cloud : NQ.tan,
    );
  tri(g, 12, 31, 20, 31, 16, 21, ise ? NQ.cloud : NQ.paper);
  if (v === 'shimenawa') {
    sky(g, 'day', o.seed);
    ground(g, 26, NQ.beige, NQ.sand);
    layer(g, (l) => {
      bigRoof(l, 3, 28, 2, 10, NQ.hairBrown, NQ.tan);
      box(l, 4, 11, 27, 26, NQ.tan);
      for (let x = 4; x <= 27; x += 4) box(l, x, 11, x + 1, 26, NQ.brown);
      box(l, 11, 19, 20, 26, NQ.bark);
    });
    layer(g, (l) => {
      for (let x = 3; x <= 28; x++) {
        const t = (x - 15.5) / 12.5;
        const r = 3.2 * (1 - t * t) + 0.8;
        const cy = 14.5 + t * t * 1.5;
        for (let y = Math.round(cy - r); y <= Math.round(cy + r); y++)
          dot(l, x, y, (x + y) % 4 === 0 ? NQ.ochre : y > cy + r * 0.4 ? NQ.tan : NQ.sand);
      }
      for (const x of [9, 16, 23]) {
        seg(l, x, 18, x, 20, NQ.sand);
        dot(l, x, 21, NQ.sand);
      }
    });
    layer(g, (l) => {
      for (const x of [6, 12, 19, 25]) {
        dot(l, x, 19, NQ.white);
        dot(l, x + 1, 20, NQ.white);
        dot(l, x, 21, NQ.white);
        dot(l, x + 1, 22, NQ.white);
      }
    });
    return;
  }
  if (ise)
    layer(g, (l) => {
      box(l, 9, 16, 22, 21, NQ.sand);
      for (let x = 9; x <= 22; x += 3) box(l, x, 16, x, 21, NQ.tan);
      box(l, 14, 18, 17, 21, NQ.brown);
      for (let y = 9; y <= 15; y++) {
        const d = Math.round((15 - y) * 0.6);
        box(l, 6 + d, y, 25 - d, y, (y + 1) % 2 === 0 ? NQ.ochre : NQ.tan);
      }
      box(l, 9, 8, 22, 8, NQ.brown);
      for (const x of [11, 14, 17, 20]) box(l, x, 7, x, 7, NQ.gold);
      seg(l, 9, 9, 7, 4, NQ.brown);
      seg(l, 9, 9, 11, 4, NQ.brown);
      seg(l, 22, 9, 20, 4, NQ.brown);
      seg(l, 22, 9, 24, 4, NQ.brown);
    });
  else layer(g, (l) => shrineHall(l, 16, 23, 6, HALL));
  layer(g, (l) => (ise ? torii(l, 16, 30, 11, 20, NQ.tan, NQ.brown) : torii(l, 16, 30, 11, 20)));
  if (v === 'plum')
    for (const [x, by] of [
      [3, 30],
      [28, 30],
    ] as const)
      layer(g, (l) => {
        thick(l, x, by, x, by - 6, 0.6, NQ.bark);
        seg(l, x, by - 5, x - 3, by - 9, NQ.bark);
        seg(l, x, by - 6, x + 3, by - 10, NQ.bark);
        for (let i = 0; i < 12; i++) {
          const px = x - 4 + Math.floor(rnd(o.seed + x, i) * 9);
          const py = by - 12 + Math.floor(rnd(o.seed + x, i + 20) * 8);
          dot(l, px, py, i % 3 === 0 ? NQ.white : i % 3 === 1 ? NQ.blush : NQ.berry);
        }
      });
};

const toriiSea: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 6, 5, 6);
  hills(g, 17, 5, NQ.green, o.seed);
  sea(g, 18, NQ.azure, o.seed);
  const draw = (l: Grid): void => {
    torii(l, 16, 25, 10, 18);
    box(l, 3, 18, 3, 25, NQ.vermilion);
    box(l, 28, 18, 28, 25, NQ.vermilion);
    box(l, 3, 20, 7, 20, NQ.vermilion);
    box(l, 24, 20, 28, 20, NQ.vermilion);
  };
  layer(g, draw);
  for (let x = 2; x <= 29; x++) if (x % 3 !== 0) dot(g, x, 26, NQ.ice);
  reflect(
    g,
    (l) => box(l, 7, 20, 8, 25, NQ.vermilion),
    26,
    () => NQ.brick,
  );
  reflect(
    g,
    (l) => box(l, 23, 20, 24, 25, NQ.vermilion),
    26,
    () => NQ.brick,
  );
};

const toriiRow: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 24, 4, 6);
  sea(g, 9, NQ.azure, o.seed);
  for (let y = 9; y < 31; y++) {
    const e = Math.round(13 + (y - 9) * 0.75 + Math.sin(y / 2) * 1);
    box(g, 1, y, Math.min(30, e), y, NQ.leaf);
    dot(g, e + 1, y, NQ.gray);
    dot(g, e + 2, y, NQ.slate);
    dot(g, e + 3, y, NQ.white);
  }
  for (let i = 0; i < 9; i++)
    dot(g, 2 + Math.floor(rnd(o.seed, i) * 10), 11 + Math.floor(rnd(o.seed, i + 4) * 19), NQ.lime);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = 14 - 6 * t + Math.sin(t * Math.PI) * 5;
    const by = 12 + 18 * t;
    layer(g, (l) => torii(l, x, by, 1.6 + 4.4 * t, 3.5 + 7.5 * t, NQ.vermilion, NQ.brick));
  }
};

// ───────────────────────── お寺 ─────────────────────────

const temple: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 6, 4, 6);
  cloud(g, 25, 7, 5);
  if (o.v === 'phoenix') {
    hills(g, 17, 4, NQ.green, o.seed);
    box(g, 1, 18, 30, 30, NQ.azure);
    const hall = (l: Grid): void => {
      box(l, 4, 14, 27, 17, NQ.vermilion);
      for (let x = 4; x <= 27; x += 2) dot(l, x, 16, NQ.white);
      eave(l, 3, 28, 13, NQ.slate, NQ.gray);
      box(l, 2, 9, 4, 11, NQ.vermilion);
      box(l, 27, 9, 29, 11, NQ.vermilion);
      eave(l, 2, 4, 8, NQ.slate, NQ.gray);
      eave(l, 27, 29, 8, NQ.slate, NQ.gray);
      box(l, 11, 10, 20, 17, NQ.vermilion);
      box(l, 13, 12, 18, 17, NQ.gold);
      bigRoof(l, 9, 22, 5, 9, NQ.slate, NQ.gray);
      box(l, 11, 3, 11, 4, NQ.gold);
      box(l, 20, 3, 20, 4, NQ.gold);
      dot(l, 12, 3, NQ.gold);
      dot(l, 19, 3, NQ.gold);
    };
    layer(g, hall);
    reflect(g, hall, 18);
    for (let i = 0; i < 5; i++) box(g, 3 + i * 6, 27 + (i % 2) * 2, 4 + i * 6, 27 + (i % 2) * 2, NQ.sky);
    return;
  }
  hills(g, 16, 4, NQ.green, o.seed);
  ground(g, 24, NQ.cloud, NQ.silver);
  layer(g, (l) => {
    box(l, 5, 16, 26, 24, NQ.brown);
    for (let x = 6; x <= 25; x += 4) box(l, x, 17, x + 1, 23, NQ.paper);
    box(l, 12, 17, 19, 24, NQ.tan);
    for (let x = 13; x <= 18; x += 2) box(l, x, 17, x, 24, NQ.brown);
    box(l, 12, 20, 19, 20, NQ.brown);
    box(l, 3, 24, 28, 24, NQ.tan);
    bigRoof(l, 2, 29, 5, 15, NQ.slate, NQ.gray, 7);
    box(l, 9, 5, 22, 5, NQ.night);
    dot(l, 8, 4, NQ.night);
    dot(l, 23, 4, NQ.night);
  });
  layer(g, (l) => {
    box(l, 14, 27, 17, 28, NQ.teal);
    box(l, 13, 26, 18, 26, NQ.aqua);
    dot(l, 14, 29, NQ.night);
    dot(l, 17, 29, NQ.night);
  });
  steam(g, 15, 25, 5, o.seed);
  steam(g, 17, 24, 4, o.seed + 2);
};

/** 五重塔 */
function pagodaShape(l: Grid, cx: number, by: number, wall: string, roof: string, edge: string): void {
  for (let i = 0; i < 5; i++) {
    const ry = by - 18 + i * 4;
    const hw = 4 + i;
    box(l, cx - hw + 3, ry + 1, cx + hw - 4, ry + 3, wall);
    box(l, cx - hw + 3, ry + 1, cx + hw - 4, ry + 1, NQ.white);
    box(l, cx - 1, ry + 2, cx, ry + 3, NQ.bark);
    eave(l, cx - hw + 1, cx + hw - 2, ry, roof, edge);
  }
  box(l, cx - 1, by - 24, cx, by - 20, NQ.ochre);
  for (let y = by - 23; y <= by - 20; y += 2) box(l, cx - 2, y, cx + 1, y, NQ.gold);
  box(l, cx - 4, by + 1, cx + 3, by + 2, NQ.silver);
}

const pagoda: SceneFn = (g, o) => {
  const wood = o.v === 'wood';
  sky(g, 'day', o.seed);
  cloud(g, 24, 5, 6);
  hills(g, 22, 6, NQ.green, o.seed);
  for (let i = 0; i < 4; i++) {
    cedar(g, 2 + i * 2.5, 29, 12 + (i % 2) * 5);
    cedar(g, 29 - i * 2.5, 29, 12 + ((i + 1) % 2) * 5);
  }
  ground(g, 28, NQ.green, NQ.leaf);
  layer(g, (l) =>
    wood
      ? pagodaShape(l, 16, 26, NQ.brown, NQ.hairBrown, NQ.tan)
      : pagodaShape(l, 16, 26, NQ.vermilion, NQ.slate, NQ.gray),
  );
  if (wood) for (let i = 0; i < 3; i++) bush(g, 5 + i * 11, 29, 2.5, NQ.leaf, NQ.green);
};

const goldPavilion: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  if (o.v === 'hall') {
    for (let i = 0; i < 7; i++) cedar(g, 1 + i * 5, 26, 16 + (i % 2) * 5);
    ground(g, 26, NQ.green, NQ.leaf);
    layer(g, (l) => {
      bigRoof(l, 3, 28, 4, 10, NQ.slate, NQ.gray);
      box(l, 4, 11, 27, 27, NQ.brown);
      box(l, 7, 12, 24, 27, NQ.bark);
      for (const x of [4, 27]) box(l, x, 11, x, 27, NQ.hairBrown);
    });
    layer(
      g,
      (l) => {
        bigRoof(l, 9, 22, 14, 18, NQ.gold, NQ.yellow);
        box(l, 10, 19, 21, 26, NQ.gold);
        box(l, 13, 21, 18, 26, NQ.ochre);
        for (let x = 10; x <= 21; x += 3) box(l, x, 19, x, 26, NQ.yellow);
        dot(l, 16, 13, NQ.cream);
      },
      NQ.amber,
    );
    for (let i = 0; i < 6; i++)
      dot(g, 8 + Math.floor(rnd(o.seed, i) * 16), 12 + Math.floor(rnd(o.seed, i + 3) * 14), NQ.cream);
    return;
  }
  cloud(g, 6, 4, 6);
  hills(g, 18, 4, NQ.green, o.seed);
  box(g, 1, 19, 30, 30, NQ.azure);
  const pav = (l: Grid): void => {
    box(l, 9, 15, 22, 18, NQ.gold);
    for (let x = 9; x <= 22; x += 3) box(l, x, 15, x, 18, NQ.ochre);
    eave(l, 9, 22, 14, NQ.bark, NQ.hairBrown);
    box(l, 10, 10, 21, 12, NQ.gold);
    box(l, 10, 10, 21, 10, NQ.yellow);
    for (let x = 12; x <= 19; x += 3) dot(l, x, 11, NQ.ochre);
    eave(l, 10, 21, 9, NQ.bark, NQ.hairBrown);
    box(l, 12, 6, 19, 7, NQ.gold);
    eave(l, 12, 19, 5, NQ.bark, NQ.hairBrown);
    box(l, 14, 3, 17, 3, NQ.bark);
    box(l, 15, 1, 16, 2, NQ.gold);
  };
  layer(g, pav);
  reflect(g, pav, 19, (c) =>
    c === NQ.gold || c === NQ.yellow ? NQ.ochre : c === NQ.ochre ? NQ.amber : NQ.blue,
  );
  layer(g, (l) => {
    pine(l, 4, 20, 0.8);
    pine(l, 27, 20, 0.8);
  });
  for (let x = 2; x <= 29; x += 4) dot(g, x, 29, NQ.sky);
};

const cliffStage: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 24, 4, 6);
  if (o.v === 'cave') {
    for (let y = 3; y < 31; y++)
      for (let x = 1; x < 31; x++) {
        const e = 3 + Math.round(Math.abs(x - 16) * 0.25 + Math.sin(x * 0.9 + o.seed) * 1.2);
        if (y >= e)
          dot(g, x, y, (x * 5 + y * 3) % 9 === 0 ? NQ.silver : (x + y * 3) % 7 === 0 ? NQ.slate : NQ.gray);
      }
    oval(g, 16, 16, 9, 7, NQ.bark);
    oval(g, 16, 17, 8, 5.5, NQ.ink, undefined, (_x, y) => y < 15);
    layer(g, (l) => {
      box(l, 10, 16, 21, 18, NQ.tan);
      for (let x = 10; x <= 21; x += 3) box(l, x, 16, x, 18, NQ.brown);
      bigRoof(l, 9, 22, 12, 15, NQ.slate, NQ.silver);
      box(l, 9, 19, 22, 19, NQ.brown);
      for (let x = 10; x <= 21; x += 4) box(l, x, 20, x, 23, NQ.brown);
    });
    for (let i = 0; i < 6; i++) bush(g, 2 + i * 6, 28 + (i % 2) * 2, 3, NQ.green, NQ.forest);
    for (let i = 0; i < 3; i++) bush(g, 3 + i * 12, 6, 2.2, NQ.leaf, NQ.green);
    return;
  }
  hills(g, 20, 6, NQ.green, o.seed);
  ground(g, 27, NQ.green);
  layer(g, (l) => {
    for (let x = 4; x <= 28; x += 3) box(l, x, 16, x, 30, NQ.brown);
    for (const y of [20, 25]) box(l, 4, y, 28, y, NQ.tan);
    box(l, 3, 15, 29, 15, NQ.tan);
    box(l, 3, 14, 29, 14, NQ.brown);
    for (let x = 3; x <= 29; x += 2) dot(l, x, 13, NQ.brown);
    box(l, 4, 9, 19, 12, NQ.tan);
    for (let x = 4; x <= 19; x += 3) box(l, x, 9, x, 12, NQ.brown);
    bigRoof(l, 2, 21, 2, 8, NQ.hairBrown, NQ.tan);
  });
  for (let i = 0; i < 6; i++) autumn(g, 3 + i * 5.3, 26 + (i % 2) * 3, 3.2, i + o.seed);
  autumn(g, 27, 11, 3, o.seed + 1);
};

const mountainTemple: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  if (o.v === 'rock') {
    cloud(g, 6, 4, 6);
    for (let y = 1; y < 31; y++)
      for (let x = 1; x < 31; x++) {
        const top = 6 + Math.abs(x - 17) * 0.5 + Math.sin(x * 1.3 + o.seed) * 2 + (x < 10 ? 6 : 0);
        if (y >= top)
          dot(g, x, y, (x + y * 2) % 7 === 0 ? NQ.slate : (x * 3 + y) % 5 === 0 ? NQ.silver : NQ.gray);
      }
    for (let i = 0; i < 8; i++)
      bush(
        g,
        2 + Math.floor(rnd(o.seed, i) * 28),
        12 + Math.floor(rnd(o.seed, i + 7) * 17),
        2,
        NQ.green,
        NQ.forest,
      );
    layer(g, (l) => {
      box(l, 15, 5, 20, 7, NQ.brown);
      bigRoof(l, 14, 21, 2, 4, NQ.slate, NQ.silver);
      for (let x = 13; x <= 22; x += 3) box(l, x, 8, x, 10, NQ.brown);
      box(l, 13, 8, 22, 8, NQ.tan);
    });
    layer(g, (l) => {
      box(l, 3, 14, 8, 16, NQ.brown);
      bigRoof(l, 2, 9, 11, 13, NQ.slate, NQ.silver);
      box(l, 23, 20, 28, 22, NQ.brown);
      bigRoof(l, 22, 29, 17, 19, NQ.slate, NQ.silver);
    });
    return;
  }
  cloud(g, 24, 4, 6);
  hills(g, 14, 6, NQ.teal, o.seed);
  box(g, 1, 14, 30, 30, NQ.green);
  for (let y = 15; y < 31; y += 2) for (let x = 1 + (y % 4); x < 31; x += 4) dot(g, x, y, NQ.forest);
  for (let i = 0; i < 8; i++) cedar(g, 2 + i * 4 + (o.seed % 2), 18 + (i % 3), 10);
  layer(g, (l) => {
    box(l, 5, 16, 14, 19, NQ.brown);
    bigRoof(l, 3, 16, 11, 15, NQ.slate, NQ.gray);
  });
  layer(g, (l) => {
    box(l, 17, 13, 27, 16, NQ.brown);
    bigRoof(l, 15, 29, 8, 12, NQ.slate, NQ.gray);
  });
  for (let x = 1; x < 31; x++) if ((x + o.seed) % 5 !== 0) dot(g, x, 21, NQ.cloud);
  for (let i = 0; i < 6; i++) cedar(g, 2 + i * 5.5, 30, 9);
  layer(g, (l) => {
    box(l, 12, 24, 19, 30, NQ.brown);
    box(l, 14, 26, 17, 30, NQ.bark);
    bigRoof(l, 10, 21, 20, 23, NQ.slate, NQ.gray);
  });
};

/** 大仏（すわった すがた） */
function buddha(l: Grid, cx: number, by: number, body: string, hi: string, dark: string): void {
  oval(l, cx, by - 3, 11, 4, body, dark);
  oval(l, cx, by - 10, 7.5, 8, body);
  box(l, cx - 8, by - 11, cx - 7, by - 5, dark);
  seg(l, cx - 3, by - 16, cx + 3, by - 7, hi);
  oval(l, cx, by - 5, 4, 1.8, hi);
  box(l, cx - 1, by - 18, cx, by - 17, body);
  oval(l, cx, by - 22, 4.5, 5, body);
  for (let y = by - 26; y <= by - 24; y++)
    for (let x = cx - 4; x <= cx + 3; x++) if ((x + y) % 2 === 0) dot(l, x, y, dark);
  oval(l, cx, by - 27.5, 2.2, 1.4, body);
  box(l, cx - 5, by - 23, cx - 5, by - 19, body);
  box(l, cx + 4, by - 23, cx + 4, by - 19, body);
  box(l, cx - 3, by - 22, cx - 2, by - 22, dark);
  box(l, cx + 1, by - 22, cx + 2, by - 22, dark);
  dot(l, cx - 1, by - 24, hi);
  box(l, cx - 1, by - 19, cx, by - 19, dark);
}

const daibutsu: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  if (o.v === 'hall') {
    cloud(g, 5, 4, 6);
    ground(g, 28, NQ.cloud, NQ.silver);
    layer(g, (l) => {
      bigRoof(l, 3, 28, 4, 11, NQ.slate, NQ.gray);
      box(l, 5, 12, 26, 15, NQ.paper);
      for (let x = 5; x <= 26; x += 3) box(l, x, 12, x, 15, NQ.brown);
      box(l, 4, 3, 5, 5, NQ.gold);
      box(l, 26, 3, 27, 5, NQ.gold);
      eave(l, 2, 29, 17, NQ.slate, NQ.gray);
      box(l, 3, 18, 28, 28, NQ.paper);
      for (let x = 3; x <= 28; x += 3) box(l, x, 18, x, 28, NQ.brown);
      box(l, 10, 19, 21, 28, NQ.bark);
      tri(l, 9, 17, 22, 17, 15.5, 12, NQ.slate);
      tri(l, 11, 17, 20, 17, 15.5, 14, NQ.gold);
      oval(l, 16, 23, 5, 5, NQ.gold, undefined, (x, y) => (x + 0.5 - 16) ** 2 + (y + 0.5 - 23) ** 2 > 12);
      oval(l, 16, 23, 2.6, 3, NQ.amber);
      box(l, 14, 23, 15, 23, NQ.bark);
      box(l, 16, 23, 17, 23, NQ.bark);
      oval(l, 16, 29, 5.5, 3.5, NQ.amber, NQ.ochre);
    });
    return;
  }
  cloud(g, 26, 5, 6);
  hills(g, 22, 8, NQ.green, o.seed);
  for (let i = 0; i < 3; i++) {
    bush(g, 3 + i * 2, 20 - i, 3, NQ.leaf, NQ.green);
    bush(g, 29 - i * 2, 20 - i, 3, NQ.leaf, NQ.green);
  }
  ground(g, 27, NQ.cloud, NQ.silver);
  layer(g, (l) => {
    box(l, 5, 27, 26, 29, NQ.silver);
    box(l, 5, 29, 26, 29, NQ.gray);
    buddha(l, 16, 27, NQ.teal, NQ.aqua, NQ.night);
  });
};

const stoneBuddha: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  const forest = o.v === 'forest';
  for (let y = 1; y < 31; y++)
    for (let x = 1; x < 31; x++) {
      const top = forest ? 4 : 3;
      if (y >= top)
        dot(g, x, y, (x * 3 + y * 7) % 11 === 0 ? NQ.tan : (x + y) % 9 === 0 ? NQ.beige : NQ.sand);
    }
  if (forest) {
    for (const cx of [11, 21]) {
      oval(g, cx, 16, 5, 11, NQ.tan);
      layer(
        g,
        (l) => {
          oval(l, cx, 9, 2.5, 3, NQ.beige);
          box(l, cx - 3, 12, cx + 2, 24, NQ.beige);
          seg(l, cx - 3, 14, cx + 2, 20, NQ.sand);
          box(l, cx - 2, 9, cx - 2, 9, NQ.tan);
          box(l, cx + 1, 9, cx + 1, 9, NQ.tan);
        },
        NQ.brown,
      );
    }
    for (let i = 0; i < 4; i++) {
      bush(g, 2 + (i % 2) * 2, 6 + i * 7, 3.5, NQ.green, NQ.forest);
      bush(g, 30 - (i % 2) * 2, 5 + i * 7, 3.5, NQ.green, NQ.forest);
    }
    stairs(g, 10, 21, 26, 13, 18, 30);
    for (let x = 1; x < 31; x++) dot(g, x, 25, NQ.leaf);
    return;
  }
  layer(g, (l) => {
    bigRoof(l, 2, 29, 2, 5, NQ.hairBrown, NQ.tan);
    for (const x of [3, 28]) box(l, x, 6, x, 27, NQ.brown);
  });
  const bs: Array<[number, number]> = [
    [8.5, 3],
    [16, 4],
    [23.5, 3],
  ];
  for (const [cx, s] of bs) {
    oval(g, cx, 18, s + 2, s + 6, NQ.brown);
    layer(
      g,
      (l) => {
        oval(l, cx, 22, s + 1.5, s * 0.9, NQ.beige, NQ.sand);
        oval(l, cx, 18, s * 0.8, s * 1.2, NQ.beige);
        oval(l, cx, 13.5 - s * 0.3, s * 0.65, s * 0.7, NQ.beige);
      },
      NQ.tan,
    );
  }
  ground(g, 27, NQ.green, NQ.leaf);
};

// ───────────────────────── 温泉 ─────────────────────────

/** 岩で かこんだ 湯船 */
function bath(g: Grid, cx: number, cy: number, rx: number, ry: number, water: string = NQ.aqua): void {
  layer(g, (l) => {
    oval(l, cx, cy, rx, ry, NQ.gray);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      oval(
        l,
        cx + Math.cos(a) * rx * 0.9,
        cy + Math.sin(a) * ry * 0.85,
        1.6,
        1.2,
        i % 2 ? NQ.silver : NQ.gray,
      );
    }
    oval(l, cx, cy, rx - 1.5, ry - 1.2, water);
    oval(l, cx - rx * 0.3, cy - ry * 0.2, rx * 0.35, ry * 0.25, NQ.mint);
  });
}

/** 木の やど（2〜3 かい） */
function inn(l: Grid, x0: number, x1: number, by: number, floors: number, snow = false): void {
  for (let f = 0; f < floors; f++) {
    const yb = by - f * 4;
    box(l, x0, yb - 2, x1, yb, NQ.brown);
    for (let x = x0 + 1; x < x1; x += 2) dot(l, x, yb - 1, NQ.cream);
    eave(l, x0, x1, yb - 3, snow && f === floors - 1 ? NQ.white : NQ.slate, snow ? NQ.white : NQ.gray);
  }
}

const onsen: SceneFn = (g, o) => {
  const v = o.v ?? '';
  const ph = o.seed % 5;
  switch (v) {
    case 'building': {
      sky(g, 'dusk', o.seed);
      ground(g, 26, NQ.beige, NQ.sand);
      layer(g, (l) => {
        box(l, 3, 20, 28, 26, NQ.brown);
        for (let x = 4; x <= 27; x += 2) box(l, x, 21, x, 24, NQ.cream);
        eave(l, 3, 28, 19, NQ.slate, NQ.gray);
        box(l, 6, 14, 25, 17, NQ.brown);
        for (let x = 7; x <= 24; x += 2) box(l, x, 15, x, 16, NQ.cream);
        eave(l, 6, 25, 13, NQ.slate, NQ.gray);
        box(l, 10, 9, 21, 11, NQ.tan);
        tri(l, 9, 11, 22, 11, 15.5, 7, NQ.slate);
        eave(l, 10, 21, 8, NQ.slate, NQ.gray);
        box(l, 14, 4, 17, 5, NQ.red);
        dot(l, 15, 4, NQ.cream);
        eave(l, 14, 17, 3, NQ.slate, NQ.gray);
        box(l, 13, 23, 18, 26, NQ.navy);
        box(l, 13, 23, 18, 23, NQ.white);
      });
      steam(g, 4, 17, 8, ph);
      steam(g, 27, 16, 8, ph + 2);
      return;
    }
    case 'yubatake': {
      sky(g, 'day', o.seed);
      layer(g, (l) => {
        house(l, 1, 8, 9, 4, NQ.brown, NQ.slate);
        house(l, 23, 30, 9, 4, NQ.brown, NQ.slate);
      });
      ground(g, 10, NQ.silver);
      for (let y = 11; y <= 21; y++) {
        const t = (y - 11) / 10;
        const x0 = Math.round(8 - 6 * t);
        const x1 = Math.round(23 + 6 * t);
        for (let x = x0; x <= x1; x++) {
          const f = (((x - x0) / (x1 - x0 + 1)) * 7) % 1;
          dot(g, x, y, f < 0.3 ? NQ.brown : (x + y * 2) % 5 === 0 ? NQ.mint : NQ.aqua);
        }
      }
      box(g, 2, 22, 29, 22, NQ.brown);
      box(g, 1, 23, 30, 30, NQ.aqua);
      for (let y = 23; y <= 26; y++)
        for (let x = 8; x <= 23; x++) dot(g, x, y, (x + y) % 3 ? NQ.white : NQ.ice);
      for (let x = 1; x <= 30; x++) if (x < 8 || x > 23) dot(g, x, 23, NQ.gray);
      for (let i = 0; i < 5; i++) box(g, 3 + i * 6, 28 + (i % 2) * 2, 4 + i * 6, 28 + (i % 2) * 2, NQ.mint);
      for (let i = 0; i < 5; i++) {
        oval(g, 6 + i * 5, 14 - (i % 2) * 3, 2.4, 1.6, NQ.white);
        steam(g, 5 + i * 5, 20, 6, ph + i);
      }
      return;
    }
    case 'steps': {
      sky(g, 'day', o.seed);
      hills(g, 10, 4, NQ.green, o.seed);
      ground(g, 10, NQ.green);
      stairs(g, 9, 22, 8, 13, 18, 30);
      layer(g, (l) => {
        inn(l, 1, 8, 29, 3);
        inn(l, 23, 30, 29, 3);
        inn(l, 3, 11, 16, 2);
        inn(l, 20, 28, 16, 2);
      });
      layer(g, (l) => {
        for (const [x, y] of [
          [11, 24],
          [20, 24],
          [12, 17],
          [19, 17],
        ] as const) {
          box(l, x, y, x, y + 1, NQ.red);
          dot(l, x, y + 2, NQ.bark);
        }
      });
      steam(g, 15, 8, 6, ph);
      steam(g, 5, 7, 6, ph + 3);
      return;
    }
    case 'willow': {
      sky(g, 'dusk', o.seed);
      layer(g, (l) => {
        inn(l, 2, 14, 14, 3);
        inn(l, 17, 29, 14, 3);
      });
      ground(g, 15, NQ.silver);
      box(g, 1, 19, 30, 30, NQ.teal);
      box(g, 1, 19, 30, 19, NQ.gray);
      for (let i = 0; i < 5; i++) box(g, 3 + i * 6, 23 + (i % 2) * 3, 5 + i * 6, 23 + (i % 2) * 3, NQ.aqua);
      layer(g, (l) => {
        for (let y = 20; y <= 23; y++) {
          const d = Math.round(Math.sqrt(Math.max(0, 9 - (y - 23) * (y - 23) * 1.2)) * 1.6);
          box(l, 16 - 6, y, 15 + 6, y, NQ.silver);
          if (y > 20) box(l, 16 - d, y, 15 + d, y, NQ.teal);
        }
        box(l, 10, 19, 21, 19, NQ.gray);
      });
      layer(g, (l) => {
        willow(l, 4, 19, 12);
        willow(l, 27, 19, 12);
      });
      return;
    }
    case 'forest': {
      sky(g, 'day', o.seed);
      for (let i = 0; i < 8; i++) cedar(g, 1 + i * 4.3, 18, 12 + ((i + o.seed) % 3) * 3);
      ground(g, 17, NQ.green, NQ.forest);
      for (let i = 0; i < 5; i++) bush(g, 2 + i * 7, 18, 3, NQ.leaf, NQ.green);
      layer(g, (l) => {
        for (const x of [5, 12]) box(l, x, 8, x, 18, NQ.brown);
        bigRoof(l, 2, 15, 5, 8, NQ.hairBrown, NQ.tan);
      });
      bath(g, 16, 24, 13, 6);
      steam(g, 12, 20, 9, ph);
      steam(g, 18, 20, 10, ph + 2);
      steam(g, 24, 21, 8, ph + 4);
      return;
    }
    case 'hell': {
      sky(g, 'cloudy', o.seed);
      hills(g, 14, 4, NQ.green, o.seed);
      ground(g, 14, NQ.sand, NQ.tan);
      bath(g, 12, 23, 11, 6, NQ.azure);
      oval(g, 12, 23, 6, 2.5, NQ.sky);
      oval(g, 10, 22, 2, 1, NQ.ice);
      layer(g, (l) => {
        oval(l, 26, 17, 5, 2.6, NQ.brown);
        oval(l, 26, 17, 3.8, 1.6, NQ.red, NQ.brick);
      });
      for (let i = 0; i < 4; i++) {
        oval(g, 8 + i * 4, 12 - (i % 2) * 2, 3, 2.4, NQ.white);
        oval(g, 7 + i * 4, 15 - (i % 2), 2.5, 2, NQ.cloud);
      }
      steam(g, 26, 14, 8, ph);
      return;
    }
    case 'mist': {
      sky(g, 'day', o.seed);
      tri(g, 0, 21, 11, 4, 20, 21, NQ.green);
      tri(g, 9, 21, 19, 5, 31, 21, NQ.green);
      tri(g, 11, 4, 20, 21, 13, 21, NQ.forest);
      tri(g, 19, 5, 31, 21, 23, 21, NQ.forest);
      tri(g, 9, 7, 11, 4, 13, 7, NQ.leaf);
      tri(g, 17, 8, 19, 5, 21, 8, NQ.leaf);
      box(g, 1, 21, 30, 30, NQ.azure);
      box(g, 1, 21, 30, 21, NQ.sky);
      for (let i = 0; i < 6; i++) bush(g, 3 + i * 5.2, 20, 2.3, NQ.leaf, NQ.green);
      oval(g, 14, 17.5, 12, 1.1, NQ.white);
      oval(g, 9, 24, 8, 0.9, NQ.white);
      oval(g, 23, 26.5, 7, 0.9, NQ.cloud);
      for (let i = 0; i < 4; i++) box(g, 4 + i * 7, 28 + (i % 2), 5 + i * 7, 28 + (i % 2), NQ.sky);
      steam(g, 27, 23, 5, ph);
      return;
    }
    case 'gate': {
      sky(g, 'day', o.seed);
      cloud(g, 5, 4, 5);
      hills(g, 18, 5, NQ.green, o.seed);
      ground(g, 26, NQ.beige, NQ.sand);
      layer(g, (l) => {
        box(l, 7, 17, 24, 26, NQ.vermilion);
        box(l, 12, 19, 19, 26, NQ.bark);
        oval(l, 16, 20, 4, 3, NQ.bark);
        eave(l, 6, 25, 16, NQ.slate, NQ.gray);
        box(l, 10, 10, 21, 14, NQ.vermilion);
        for (let x = 11; x <= 20; x += 3) box(l, x, 11, x + 1, 13, NQ.cream);
        bigRoof(l, 7, 24, 5, 9, NQ.slate, NQ.gray);
        box(l, 15, 3, 16, 4, NQ.gold);
      });
      steam(g, 4, 25, 9, ph);
      steam(g, 27, 24, 9, ph + 3);
      return;
    }
    case 'river': {
      sky(g, 'day', o.seed);
      layer(g, (l) => {
        box(l, 2, 3, 8, 14, NQ.white);
        box(l, 22, 5, 29, 14, NQ.cloud);
        box(l, 10, 8, 14, 14, NQ.paper);
        for (let y = 4; y <= 13; y += 2) {
          for (let x = 3; x <= 7; x += 2) dot(l, x, y, NQ.sky);
          for (let x = 23; x <= 28; x += 2) dot(l, x, y + 1, NQ.sky);
        }
        for (let y = 9; y <= 13; y += 2) for (let x = 11; x <= 13; x += 2) dot(l, x, y, NQ.sky);
      });
      for (let y = 14; y < 31; y++) {
        const w = 2 + (y - 14) * 0.25;
        for (let x = 1; x < 31; x++) {
          const c =
            Math.abs(x - 16) < w ? NQ.teal : (x * 3 + y) % 7 === 0 ? NQ.slate : x < 16 ? NQ.gray : NQ.silver;
          dot(g, x, y, c);
        }
      }
      for (let i = 0; i < 4; i++) bush(g, 3 + i * 8, 15, 2.2, NQ.green, NQ.forest);
      for (let y = 18; y < 31; y += 3) dot(g, 16, y, NQ.mint);
      steam(g, 9, 13, 6, ph);
      return;
    }
    case 'sea': {
      sky(g, 'dusk', o.seed);
      sun(g, 16, 13, 4, NQ.apricot);
      sun(g, 16, 13, 2.5, NQ.cream);
      box(g, 1, 15, 30, 21, NQ.indigo);
      box(g, 1, 15, 30, 15, NQ.lavender);
      for (let y = 16; y <= 21; y += 2)
        box(g, 16 - (21 - y) * 0.6 - 1, y, 16 + (21 - y) * 0.6, y, NQ.apricot);
      bath(g, 16, 27, 17, 6);
      steam(g, 9, 24, 9, ph);
      steam(g, 22, 24, 8, ph + 3);
      return;
    }
    case 'snow': {
      sky(g, 'night', o.seed);
      layer(g, (l) => {
        inn(l, 1, 10, 22, 4, true);
        inn(l, 21, 30, 22, 4, true);
      });
      box(g, 1, 23, 30, 30, NQ.white);
      for (let y = 23; y <= 30; y++) {
        const w = 2 + (y - 23) * 0.9;
        box(g, 16 - w, y, 15 + w, y, NQ.navy);
      }
      for (let y = 25; y <= 30; y += 2) dot(g, 16, y, NQ.yellow);
      layer(g, (l) => {
        for (const x of [12, 19]) {
          box(l, x, 21, x, 25, NQ.bark);
          box(l, x, 19, x, 20, NQ.yellow);
        }
      });
      for (let i = 0; i < 14; i++)
        dot(g, 2 + ((i * 13 + o.seed) % 28), 2 + ((i * 7 + o.seed) % 26), NQ.white);
      return;
    }
    default: {
      sky(g, 'day', o.seed);
      for (let i = 0; i < 5; i++) bush(g, 3 + i * 6.5, 14, 4, NQ.green, NQ.forest);
      ground(g, 15, NQ.green, NQ.leaf);
      layer(g, (l) => {
        box(l, 22, 9, 29, 14, NQ.brown);
        box(l, 24, 11, 27, 14, NQ.bark);
        bigRoof(l, 21, 30, 5, 8, NQ.slate, NQ.gray);
      });
      bath(g, 14, 24, 12, 6);
      for (let i = 0; i < 3; i++) steam(g, 9 + i * 5, 21 - (i % 2), 11, ph + i * 2);
      layer(g, (l) => {
        box(l, 25, 25, 28, 27, NQ.tan);
        box(l, 25, 26, 28, 26, NQ.brown);
      });
    }
  }
};

const sandBath: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 24, 4, 6);
  sea(g, 8, NQ.azure, o.seed);
  box(g, 1, 13, 30, 30, NQ.slate);
  box(g, 1, 13, 30, 13, NQ.ice);
  for (let i = 0; i < 30; i++)
    dot(
      g,
      1 + Math.floor(rnd(o.seed, i) * 30),
      14 + Math.floor(rnd(o.seed, i + 40) * 17),
      i % 2 ? NQ.gray : NQ.night,
    );
  layer(g, (l) => {
    for (let x = 22; x <= 29; x++) dot(l, x, 14 + Math.abs(x - 25.5) * 0.5, x % 2 ? NQ.red : NQ.white);
    box(l, 22, 14, 29, 15, NQ.red);
    for (let x = 23; x <= 28; x += 2) box(l, x, 14, x, 15, NQ.white);
    box(l, 25, 16, 25, 21, NQ.brown);
  });
  const heads: Array<[number, number]> = [
    [5, 17],
    [7, 22],
    [9, 27],
  ];
  for (const [x, y] of heads) {
    layer(
      g,
      (l) => {
        oval(l, x + 10, y + 1, 8, 2.3, NQ.slate, NQ.night);
        oval(l, x + 9, y, 4, 0.9, NQ.gray);
      },
      NQ.night,
    );
    layer(g, (l) => {
      oval(l, x + 0.5, y + 0.5, 2.6, 2.6, NQ.skinLight);
      box(l, x - 2, y - 2, x + 2, y - 1, NQ.white);
      box(l, x - 1, y, x - 1, y, NQ.ink);
      box(l, x + 1, y, x + 1, y, NQ.ink);
      dot(l, x, y + 1, NQ.red);
      dot(l, x - 2, y + 1, NQ.blush);
      dot(l, x + 2, y + 1, NQ.blush);
    });
  }
  steam(g, 22, 19, 5, o.seed);
  steam(g, 28, 27, 6, o.seed + 1);
};

// ───────────────────────── 橋 ─────────────────────────

const archBridge: SceneFn = (g, o) => {
  const v = o.v ?? '';
  sky(g, 'day', o.seed);
  cloud(g, 6, 4, 6);
  if (v === 'double') {
    for (let i = 0; i < 6; i++) bush(g, 3 + i * 5.5, 10, 3, NQ.green, NQ.forest);
    layer(g, (l) => {
      house(l, 2, 9, 11, 3, NQ.white, NQ.slate);
      house(l, 22, 29, 11, 3, NQ.paper, NQ.brick);
    });
    box(g, 1, 12, 30, 30, NQ.azure);
    const br = (l: Grid): void => {
      for (let y = 11; y <= 18; y++)
        for (let x = 1; x < 31; x++) {
          const inA = (x + 0.5 - 9) ** 2 + (y - 19) ** 2 < 42;
          const inB = (x + 0.5 - 23) ** 2 + (y - 19) ** 2 < 42;
          if (!inA && !inB) dot(l, x, y, (x + (y % 2) * 2) % 4 === 0 || y === 11 ? NQ.gray : NQ.silver);
        }
    };
    layer(g, br);
    reflect(g, br, 19, () => NQ.denim);
    for (let x = 1; x < 31; x++) if (x % 4) dot(g, x, 19, NQ.sky);
    return;
  }
  if (v === 'five') {
    hills(g, 17, 9, NQ.green, o.seed);
    layer(g, (l) => keep(l, 7, 9, [[2, 2]], castleStyle('')));
    box(g, 1, 18, 30, 30, NQ.azure);
    for (let i = 0; i < 6; i++) box(g, 2 + i * 5, 26 + (i % 2) * 2, 3 + i * 5, 26 + (i % 2) * 2, NQ.ice);
    layer(g, (l) => {
      for (const x of [6, 12, 18, 24]) box(l, x, 18, x + 1, 23, NQ.silver);
      for (let i = 0; i < 5; i++) {
        const x0 = 1 + i * 6;
        const hgt = i === 0 || i === 4 ? 2 : 4;
        for (let x = x0; x <= x0 + 6; x++) {
          const t = (x - x0) / 6;
          const y = Math.round(17 - Math.sin(t * Math.PI) * hgt);
          dot(l, x, y, NQ.tan);
          dot(l, x, y + 1, NQ.brown);
          if (x % 2 === 0) seg(l, x, y + 2, x, 17, NQ.hairBrown);
        }
      }
    });
    return;
  }
  if (v === 'gorge') {
    box(g, 1, 12, 30, 18, NQ.forest);
    box(g, 1, 19, 30, 30, NQ.night);
    for (let y = 9; y < 31; y++) {
      const w = Math.max(1, 7 - (y - 9) * 0.28);
      for (let x = 1; x < 31; x++)
        if (Math.abs(x - 15.5) > w)
          dot(g, x, y, (x * 3 + y * 2) % 7 === 0 ? NQ.slate : x < 16 ? NQ.gray : NQ.silver);
    }
    for (let y = 20; y < 31; y++) box(g, 15, y, 16, y, y % 3 ? NQ.teal : NQ.mint);
    for (let i = 0; i < 4; i++) {
      bush(g, 2 + i * 2.5, 9 - (i % 2), 2.6, NQ.leaf, NQ.green);
      bush(g, 29 - i * 2.5, 9 - (i % 2), 2.6, NQ.leaf, NQ.green);
    }
    layer(g, (l) => {
      box(l, 7, 10, 24, 11, NQ.brown);
      box(l, 7, 9, 24, 9, NQ.tan);
      for (let i = 0; i < 3; i++) {
        box(l, 6 - i, 12 + i, 9 - i, 12 + i, NQ.brown);
        box(l, 22 + i, 12 + i, 25 + i, 12 + i, NQ.brown);
      }
      eave(l, 4, 7, 8, NQ.slate, NQ.gray);
      eave(l, 24, 27, 8, NQ.slate, NQ.gray);
    });
    return;
  }
  // water：水を ふく 石の 橋
  hills(g, 14, 5, NQ.green, o.seed);
  box(g, 1, 14, 30, 30, NQ.leaf);
  for (let i = 0; i < 10; i++)
    dot(g, 1 + Math.floor(rnd(o.seed, i) * 30), 15 + Math.floor(rnd(o.seed, i + 3) * 15), NQ.green);
  box(g, 1, 28, 30, 30, NQ.teal);
  layer(g, (l) => {
    for (let y = 9; y <= 27; y++)
      for (let x = 1; x < 31; x++) {
        const hole = (x + 0.5 - 16) ** 2 + ((y + 0.5 - 28) * 0.9) ** 2 < 110;
        if (!hole) dot(l, x, y, (x + (y % 2) * 2) % 4 === 0 || y % 2 === 0 ? NQ.gray : NQ.silver);
      }
    box(l, 1, 9, 30, 9, NQ.slate);
  });
  for (let y = 12; y <= 30; y++) {
    const w = 1 + (y - 12) * 0.35;
    for (let x = Math.round(16 - w); x <= Math.round(15 + w); x++)
      dot(g, x, y, (x + y) % 3 === 0 ? NQ.ice : (x + y) % 5 === 0 ? NQ.sky : NQ.white);
  }
  for (let i = 0; i < 8; i++)
    dot(g, 8 + Math.floor(rnd(o.seed, i) * 16), 22 + Math.floor(rnd(o.seed, i + 8) * 8), NQ.white);
};

const bigBridge: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 26, 4, 6);
  if (o.v === 'emerald') {
    box(g, 1, 10, 30, 30, NQ.teal);
    for (let y = 10; y < 31; y++) box(g, 1, y, 30, y, y < 13 ? NQ.teal : y < 20 ? NQ.aqua : NQ.mint);
    oval(g, 26, 11, 8, 4, NQ.green, NQ.forest, (_x, y) => y <= 11);
    box(g, 18, 11, 30, 11, NQ.sand);
    tri(g, -2, 31, 10, 31, -2, 22, NQ.sand);
    layer(g, (l) => {
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const x = 2 + 19 * t;
        const y = 27 - 16 * t;
        const th = t < 0.5 ? 1 : 0;
        dot(l, x, y, NQ.white);
        dot(l, x, y + 1, NQ.cloud);
        if (th) dot(l, x, y + 2, NQ.cloud);
        if (i % 5 === 0) seg(l, x, y + 2, x, y + 3 + (1 - t) * 2, NQ.silver);
      }
    });
    for (let i = 0; i < 5; i++) dot(g, 4 + i * 5, 17 + (i % 2) * 5, NQ.white);
    return;
  }
  hills(g, 20, 5, NQ.green, o.seed + 1);
  sea(g, 21, NQ.azure, o.seed);
  layer(g, (l) => {
    box(l, 1, 20, 30, 21, NQ.white);
    box(l, 1, 21, 30, 21, NQ.silver);
    for (const x of [8, 22]) {
      box(l, x, 5, x + 1, 25, NQ.white);
      box(l, x + 1, 5, x + 1, 25, NQ.cloud);
      for (const y of [8, 13]) box(l, x - 1, y, x + 2, y, NQ.white);
    }
    const cab = (x: number): number => {
      if (x < 8) return 5 + (8 - x) * 1.8;
      if (x > 23) return 5 + (x - 23) * 1.8;
      const t = (x - 15.5) / 7;
      return 18 - 13 * t * t * 0.95 - 0.5;
    };
    for (let x = 1; x < 31; x++) {
      if (x === 8 || x === 9 || x === 22 || x === 23) continue;
      const y = Math.min(19, cab(x));
      dot(l, x, y, NQ.slate);
      if (x % 2 === 0) seg(l, x, y + 1, x, 19, NQ.silver);
    }
  });
};

const vineBridge: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  hills(g, 10, 4, NQ.teal, o.seed);
  box(g, 1, 10, 30, 25, NQ.teal);
  for (let y = 12; y < 26; y += 2) for (let x = 1 + (y % 4); x < 31; x += 4) dot(g, x, y, NQ.green);
  for (let y = 5; y < 31; y++)
    for (let x = 1; x < 31; x++) {
      const d = Math.abs(x - 15.5);
      if (d > 14 - (y - 5) * 0.45) dot(g, x, y, (x + y) % 5 === 0 ? NQ.forest : NQ.green);
    }
  box(g, 1, 26, 30, 30, NQ.aqua);
  for (let i = 0; i < 5; i++) dot(g, 5 + i * 5, 27 + (i % 3), NQ.mint);
  for (let i = 0; i < 5; i++) oval(g, 3 + i * 6, 29, 1.6, 1, NQ.silver);
  layer(g, (l) => {
    for (let x = 3; x <= 28; x++) {
      const t = (x - 15.5) / 12.5;
      const y = Math.round(17 - t * t * 5);
      dot(l, x, y, x % 2 ? NQ.tan : NQ.sand);
      dot(l, x, y - 4, NQ.ochre);
      if (x % 3 === 0) seg(l, x, y - 3, x, y - 1, NQ.brown);
      else if (x % 3 === 1) dot(l, x, y - 2, NQ.brown);
    }
    box(l, 3, 7, 3, 12, NQ.brown);
    box(l, 28, 7, 28, 12, NQ.brown);
  });
};

const lighthouse: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 25, 4, 6);
  sea(g, 17, NQ.azure, o.seed);
  for (let y = 17; y < 31; y++) {
    const e = Math.round(20 + (y - 17) * 0.5 + Math.sin(y) * 0.8);
    box(g, 1, y, e, y, (y + 1) % 3 === 0 ? NQ.tan : NQ.brown);
    dot(g, e + 1, y, NQ.white);
  }
  box(g, 1, 16, 21, 17, NQ.leaf);
  box(g, 1, 16, 21, 16, NQ.lime);
  layer(g, (l) => {
    for (let y = 7; y <= 16; y++) {
      const hw = 2 + (y - 7) * 0.18;
      box(l, 11 - hw, y, 10 + hw, y, NQ.white);
      dot(l, 10 + hw, y, NQ.cloud);
    }
    box(l, 10, 14, 11, 16, NQ.slate);
    box(l, 8, 6, 13, 6, NQ.slate);
    box(l, 9, 4, 12, 5, NQ.yellow);
    box(l, 10, 4, 11, 5, NQ.cream);
    box(l, 9, 3, 12, 3, NQ.red);
    box(l, 10, 2, 11, 2, NQ.red);
    house(l, 15, 19, 16, 2, NQ.white, NQ.red);
  });
  tri(g, 13, 4, 13, 5, 22, 2, NQ.cream);
  tri(g, 13, 5, 13, 6, 22, 8, NQ.cream);
};

// ───────────────────────── 港・海べの 町 ─────────────────────────

/** 漁船（左向き） */
function boat(l: Grid, x: number, y: number, flags = true): void {
  box(l, x, y, x + 7, y + 1, NQ.white);
  dot(l, x - 1, y, NQ.white);
  box(l, x, y + 1, x + 7, y + 1, NQ.red);
  box(l, x + 4, y - 2, x + 6, y - 1, NQ.white);
  dot(l, x + 5, y - 2, NQ.sky);
  if (flags) {
    seg(l, x + 2, y - 1, x + 2, y - 5, NQ.bark);
    box(l, x + 3, y - 5, x + 4, y - 5, NQ.red);
    box(l, x + 3, y - 4, x + 4, y - 4, NQ.gold);
  }
}

const port: SceneFn = (g, o) => {
  const v = o.v ?? '';
  sky(g, 'day', o.seed);
  cloud(g, 6, 4, 6);
  switch (v) {
    case 'retro': {
      hills(g, 14, 4, NQ.green, o.seed);
      sea(g, 23, NQ.azure, o.seed);
      layer(g, (l) => {
        box(l, 3, 11, 20, 22, NQ.brick);
        for (let y = 12; y <= 22; y += 2)
          for (let x = 3 + (y % 4 === 0 ? 1 : 0); x <= 20; x += 2) dot(l, x, y, NQ.red);
        box(l, 3, 16, 20, 16, NQ.white);
        for (let x = 5; x <= 18; x += 3) {
          box(l, x, 13, x + 1, 14, NQ.white);
          box(l, x, 18, x + 1, 20, NQ.white);
          box(l, x, 19, x + 1, 20, NQ.sky);
        }
        box(l, 2, 10, 21, 10, NQ.teal);
        box(l, 9, 5, 14, 9, NQ.brick);
        box(l, 10, 7, 13, 8, NQ.white);
        tri(l, 8, 5, 15.5, 5, 11.75, 1, NQ.teal);
        box(l, 1, 22, 30, 22, NQ.silver);
      });
      layer(g, (l) => {
        box(l, 23, 14, 29, 21, NQ.red);
        for (let x = 24; x <= 28; x += 2) box(l, x, 16, x, 19, NQ.white);
        tri(l, 22, 14, 30.5, 14, 26.25, 10, NQ.slate);
      });
      layer(g, (l) => boat(l, 18, 26, false));
      return;
    }
    case 'slope': {
      tri(g, -8, 23, 18, 4, 44, 23, NQ.green);
      for (let y = 8; y < 23; y += 2) for (let x = 1 + (y % 4); x < 31; x += 4) dot(g, x, y, NQ.leaf);
      const cols = [NQ.brick, NQ.slate, NQ.teal];
      for (let r = 0; r < 4; r++)
        for (let i = 0; i < 5; i++) {
          const x = 1 + i * 7 + (r % 2) * 3;
          const y = 10 + r * 4;
          if (Math.abs(x + 2 - 18) > 5 + r * 4) continue;
          box(g, x, y, x + 4, y + 1, NQ.white);
          box(g, x + 4, y, x + 4, y + 1, NQ.cloud);
          box(g, x - 1, y - 1, x + 5, y - 1, cols[(r + i) % 3]!);
          box(g, x, y - 2, x + 4, y - 2, cols[(r + i) % 3]!);
          dot(g, x + 1, y + 1, NQ.slate);
        }
      for (let y = 8; y < 23; y++) dot(g, 17 + Math.round(Math.sin(y / 1.6) * 1.2), y, NQ.paper);
      layer(g, (l) => {
        box(l, 17, 4, 18, 6, NQ.vermilion);
        eave(l, 16, 19, 3, NQ.slate, NQ.gray);
        box(l, 17, 1, 18, 1, NQ.slate);
      });
      sea(g, 22, NQ.azure, o.seed);
      oval(g, 28, 22, 6, 2, NQ.green, undefined, (_x, y) => y < 22);
      layer(g, (l) => boat(l, 9, 26, false));
      return;
    }
    case 'tower': {
      hills(g, 18, 8, NQ.green, o.seed);
      layer(g, (l) => {
        box(l, 18, 15, 21, 21, NQ.silver);
        box(l, 23, 13, 26, 21, NQ.cloud);
        for (let y = 16; y <= 20; y += 2) {
          dot(l, 19, y, NQ.sky);
          dot(l, 24, y - 1, NQ.sky);
        }
      });
      sea(g, 22, NQ.azure, o.seed);
      layer(g, (l) => {
        for (let y = 5; y <= 22; y++) {
          const hw = 1.2 + 2.6 * ((y - 15) / 8) ** 2;
          for (let x = Math.round(10 - hw); x <= Math.round(9 + hw); x++)
            dot(l, x, y, (x + y) % 3 === 0 ? NQ.brick : NQ.red);
        }
        box(l, 6, 4, 13, 5, NQ.white);
        box(l, 7, 3, 12, 3, NQ.red);
        box(l, 9, 1, 10, 2, NQ.white);
      });
      layer(g, (l) => {
        box(l, 15, 25, 29, 27, NQ.white);
        box(l, 15, 27, 29, 27, NQ.navy);
        box(l, 18, 23, 27, 24, NQ.white);
        for (let x = 19; x <= 26; x += 2) dot(l, x, 24, NQ.sky);
        box(l, 24, 21, 25, 22, NQ.red);
        dot(l, 14, 25, NQ.white);
      });
      return;
    }
    case 'dutch': {
      hills(g, 16, 6, NQ.green, o.seed);
      box(g, 1, 17, 30, 18, NQ.silver);
      sea(g, 19, NQ.azure, o.seed);
      layer(g, (l) => {
        box(l, 2, 11, 16, 18, NQ.white);
        box(l, 16, 11, 16, 18, NQ.cloud);
        box(l, 1, 10, 17, 10, NQ.slate);
        box(l, 2, 9, 16, 9, NQ.slate);
        box(l, 3, 8, 15, 8, NQ.slate);
        box(l, 8, 14, 10, 18, NQ.brown);
        dot(l, 8, 14, NQ.white);
        dot(l, 10, 14, NQ.white);
        for (const x of [4, 13]) box(l, x, 13, x, 14, NQ.slate);
      });
      layer(g, (l) => {
        box(l, 18, 24, 29, 26, NQ.brown);
        box(l, 17, 23, 30, 23, NQ.brown);
        box(l, 19, 26, 28, 26, NQ.bark);
        box(l, 23, 6, 23, 23, NQ.bark);
        box(l, 20, 8, 26, 12, NQ.white);
        box(l, 20, 14, 27, 19, NQ.white);
        box(l, 26, 8, 26, 12, NQ.cloud);
        box(l, 27, 14, 27, 19, NQ.cloud);
        box(l, 23, 4, 25, 5, NQ.red);
      });
      return;
    }
    default: {
      hills(g, 15, 7, NQ.green, o.seed);
      layer(g, (l) => {
        for (let i = 0; i < 6; i++)
          house(l, 2 + i * 5, 5 + i * 5, 16, 2, i % 2 ? NQ.paper : NQ.cloud, i % 3 ? NQ.slate : NQ.teal);
      });
      sea(g, 17, NQ.azure, o.seed);
      box(g, 1, 20, 9, 21, NQ.silver);
      box(g, 1, 22, 9, 22, NQ.gray);
      layer(g, (l) => {
        boat(l, 12, 21);
        boat(l, 21, 27);
        boat(l, 4, 28);
      });
    }
  }
};

const fishingVillage: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 24, 4, 6);
  if (o.v === 'lantern') {
    hills(g, 17, 5, NQ.green, o.seed);
    oval(g, 26, 17, 5, 3, NQ.green, NQ.forest, (_x, y) => y < 17);
    layer(g, (l) => {
      box(l, 25, 13, 26, 15, NQ.vermilion);
      eave(l, 25, 26, 13, NQ.slate, NQ.gray);
    });
    sea(g, 17, NQ.azure, o.seed);
    for (let y = 17; y < 31; y++) {
      const e = Math.round(18 - (y - 17) * 0.9);
      box(g, 1, y, Math.max(1, e), y, y % 2 ? NQ.silver : NQ.gray);
    }
    layer(g, (l) => {
      box(l, 7, 22, 12, 23, NQ.silver);
      box(l, 8, 17, 11, 21, NQ.silver);
      box(l, 11, 17, 11, 21, NQ.gray);
      box(l, 7, 13, 12, 16, NQ.paper);
      box(l, 8, 14, 11, 15, NQ.cream);
      box(l, 9, 14, 10, 15, NQ.yellow);
      for (let y = 8; y <= 12; y++) {
        const hw = 1 + (y - 8) * 0.9;
        box(l, 10 - hw, y, 9 + hw, y, NQ.hairBrown);
      }
      box(l, 5, 12, 14, 12, NQ.brown);
      box(l, 9, 6, 10, 7, NQ.gray);
    });
    layer(g, (l) => {
      box(l, 16, 27, 23, 28, NQ.tan);
      box(l, 17, 28, 22, 28, NQ.brown);
    });
    return;
  }
  // boathouse：舟屋
  hills(g, 14, 9, NQ.green, o.seed);
  box(g, 1, 14, 30, 30, NQ.azure);
  const row = (l: Grid): void => {
    for (let i = 0; i < 5; i++) {
      const x0 = 1 + i * 6;
      gableHouse(l, x0 + 1, x0 + 5, 21, 7, NQ.brown, NQ.slate);
      box(l, x0 + 2, 15, x0 + 4, 15, NQ.cream);
      box(l, x0 + 2, 18, x0 + 4, 21, NQ.bark);
      box(l, x0 + 2, 20, x0 + 4, 20, i % 2 ? NQ.white : NQ.tan);
    }
  };
  layer(g, row);
  reflect(g, row, 22, () => NQ.blue);
  for (let x = 1; x < 31; x++) if (x % 3) dot(g, x, 22, NQ.sky);
};

const church: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 25, 5, 6);
  const draw = (l: Grid, cx: number, by: number): void => {
    box(l, cx - 1, by - 8, cx + 10, by, NQ.white);
    box(l, cx + 10, by - 8, cx + 10, by, NQ.cloud);
    tri(l, cx - 1, by - 8, cx + 11, by - 8, cx + 5, by - 13, NQ.slate);
    for (let x = cx + 1; x <= cx + 8; x += 3) {
      box(l, x, by - 6, x + 1, by - 3, NQ.azure);
      dot(l, x, by - 6, NQ.sky);
    }
    box(l, cx - 6, by - 14, cx - 1, by, NQ.white);
    box(l, cx - 4, by - 3, cx - 3, by, NQ.brown);
    oval(l, cx - 3.5, by - 10, 1.5, 1.5, NQ.azure);
    tri(l, cx - 6.5, by - 14, cx - 0.5, by - 14, cx - 3.5, by - 21, NQ.slate);
    box(l, cx - 4, by - 26, cx - 3, by - 21, NQ.gold);
    box(l, cx - 5, by - 24, cx - 2, by - 24, NQ.gold);
  };
  if (o.v === 'sea') {
    hills(g, 14, 7, NQ.green, o.seed);
    box(g, 1, 14, 30, 22, NQ.green);
    sea(g, 22, NQ.azure, o.seed);
    layer(g, (l) => draw(l, 14, 20));
    layer(g, (l) => {
      house(l, 2, 7, 21, 2, NQ.paper, NQ.slate);
      house(l, 3, 8, 17, 2, NQ.cloud, NQ.slate);
      house(l, 25, 29, 21, 2, NQ.paper, NQ.slate);
      house(l, 26, 30, 17, 2, NQ.cloud, NQ.brick);
    });
    layer(g, (l) => boat(l, 18, 26, true));
    return;
  }
  hills(g, 22, 4, NQ.teal, o.seed);
  oval(g, 16, 32, 22, 10, NQ.leaf, NQ.green);
  layer(g, (l) => draw(l, 13, 26));
  for (let i = 0; i < 4; i++) dot(g, 3 + i * 8, 28 + (i % 2), NQ.gold);
};

// ───────────────────────── 古い 町なみ ─────────────────────────

/** 町家（こうし・のれん） */
function machiya(l: Grid, x0: number, x1: number, by: number, noren: string): void {
  box(l, x0, by - 9, x1, by, NQ.brown);
  box(l, x0, by - 8, x1, by - 6, NQ.paper);
  for (let x = x0 + 1; x < x1; x += 2) box(l, x, by - 7, x, by - 7, NQ.bark);
  eave(l, x0, x1, by - 5, NQ.slate, NQ.gray);
  for (let x = x0 + 1; x < x1; x += 2) box(l, x, by - 3, x, by, NQ.bark);
  box(l, x0 + 2, by - 3, x0 + 4, by - 2, noren);
  box(l, x0, by - 10, x1, by - 10, NQ.slate);
  box(l, x0 + 1, by - 11, x1 - 1, by - 11, NQ.slate);
}

/** 白かべの 蔵（なまこかべ） */
function kura(
  l: Grid,
  x0: number,
  x1: number,
  by: number,
  roof: string = NQ.slate,
  lower: string = NQ.gray,
): void {
  gableHouse(l, x0, x1, by, 8, NQ.white, roof);
  box(l, x0, by - 3, x1, by, lower);
  if (lower === NQ.gray)
    for (let y = by - 3; y <= by; y++)
      for (let x = x0; x <= x1; x++) if ((x + y) % 2 === 0) dot(l, x, y, NQ.white);
  box(l, Math.round((x0 + x1) / 2) - 1, by - 6, Math.round((x0 + x1) / 2), by - 5, NQ.bark);
}

const oldTown: SceneFn = (g, o) => {
  const v = o.v ?? '';
  sky(g, 'day', o.seed);
  cloud(g, 6 + (o.seed % 5), 4, 6);
  switch (v) {
    case 'sakura': {
      hills(g, 16, 5, NQ.green, o.seed);
      ground(g, 25, NQ.beige, NQ.sand);
      layer(g, (l) => {
        bigRoof(l, 2, 14, 11, 15, NQ.slate, NQ.gray);
        bigRoof(l, 18, 30, 12, 16, NQ.slate, NQ.gray);
        box(l, 1, 17, 30, 24, NQ.hairBlack);
        for (let x = 2; x < 30; x += 2) box(l, x, 18, x, 24, NQ.night);
        box(l, 1, 16, 30, 16, NQ.slate);
        box(l, 13, 18, 18, 24, NQ.brown);
        box(l, 15, 18, 16, 24, NQ.bark);
      });
      layer(g, (l) => {
        for (const [cx, cy] of [
          [7, 9],
          [25, 8],
        ] as const) {
          thick(l, cx, 16, cx, cy + 2, 0.6, NQ.bark);
          oval(l, cx, cy, 6, 4, NQ.blush, NQ.berry);
          for (let i = -5; i <= 5; i += 2)
            seg(l, cx + i, cy + 2, cx + i * 1.2, cy + 8 + (Math.abs(i) % 3), NQ.blush);
          dot(l, cx - 2, cy - 1, NQ.white);
          dot(l, cx + 2, cy, NQ.white);
        }
      });
      return;
    }
    case 'canal': {
      hills(g, 12, 4, NQ.green, o.seed);
      ground(g, 19, NQ.silver);
      layer(g, (l) => {
        kura(l, 6, 14, 18);
        kura(l, 17, 25, 18);
      });
      box(g, 1, 20, 30, 30, NQ.teal);
      box(g, 1, 20, 30, 20, NQ.gray);
      for (let i = 0; i < 5; i++) box(g, 2 + i * 6, 24 + (i % 2) * 3, 4 + i * 6, 24 + (i % 2) * 3, NQ.aqua);
      layer(g, (l) => {
        willow(l, 2, 20, 11);
        willow(l, 29, 20, 11);
      });
      layer(g, (l) => {
        box(l, 5, 25, 14, 26, NQ.brown);
        dot(l, 4, 24, NQ.brown);
        dot(l, 15, 24, NQ.brown);
        person(l, 9, 24, NQ.navy);
        dot(l, 9, 21, NQ.tan);
        box(l, 8, 21, 10, 21, NQ.tan);
      });
      return;
    }
    case 'slope': {
      hills(g, 14, 7, NQ.teal, o.seed);
      const ys = (x: number): number => Math.round(28 - (x - 1) * 0.45);
      for (let x = 1; x < 31; x++) {
        box(g, x, ys(x), x, 30, NQ.green);
        box(g, x, ys(x) + 1, x, ys(x) + 2, x % 2 ? NQ.beige : NQ.sand);
      }
      for (let i = 0; i < 5; i++) {
        const x0 = 1 + i * 6;
        layer(g, (l) => {
          house(l, x0 + 1, x0 + 5, ys(x0 + 3), 4, NQ.brown, NQ.slate);
          for (let x = x0 + 2; x <= x0 + 4; x += 2) box(l, x, ys(x0 + 3) - 2, x, ys(x0 + 3) - 1, NQ.cream);
        });
      }
      for (let i = 0; i < 3; i++) bush(g, 5 + i * 9, ys(5 + i * 9) + 7, 2.5, NQ.leaf, NQ.green);
      return;
    }
    case 'bell': {
      hills(g, 18, 3, NQ.green, o.seed);
      layer(g, (l) => {
        box(l, 13, 16, 18, 20, NQ.hairBrown);
        eave(l, 13, 18, 15, NQ.slate, NQ.gray);
        box(l, 14, 10, 17, 13, NQ.hairBrown);
        box(l, 15, 11, 16, 12, NQ.ochre);
        eave(l, 14, 17, 9, NQ.slate, NQ.gray);
        box(l, 15, 5, 16, 7, NQ.hairBrown);
        box(l, 15, 6, 16, 7, NQ.gold);
        eave(l, 15, 16, 4, NQ.slate, NQ.gray);
        box(l, 15, 2, 16, 2, NQ.slate);
      });
      layer(g, (l) => {
        kura(l, 2, 11, 27, NQ.hairBlack, NQ.hairBlack);
        kura(l, 20, 29, 27, NQ.hairBlack, NQ.hairBlack);
        box(l, 12, 21, 19, 27, NQ.hairBlack);
        eave(l, 12, 19, 21, NQ.slate, NQ.gray);
      });
      ground(g, 28, NQ.beige, NQ.sand);
      return;
    }
    case 'carp': {
      layer(g, (l) => {
        box(l, 1, 9, 30, 14, NQ.white);
        box(l, 1, 8, 30, 8, NQ.slate);
        box(l, 1, 7, 30, 7, NQ.slate);
        for (let y = 11; y <= 14; y++)
          for (let x = 1; x <= 30; x++) if ((x + y) % 2 === 0) dot(l, x, y, NQ.gray);
      });
      ground(g, 15, NQ.silver);
      box(g, 1, 17, 30, 30, NQ.azure);
      box(g, 1, 17, 30, 17, NQ.gray);
      for (let i = 0; i < 4; i++) dot(g, 4 + i * 7, 20 + (i % 2) * 6, NQ.sky);
      const koi: Array<[number, number, string]> = [
        [6, 21, NQ.orange],
        [14, 25, NQ.red],
        [22, 20, NQ.white],
        [24, 27, NQ.gold],
        [9, 28, NQ.white],
      ];
      layer(
        g,
        (l) => {
          for (const [x, y, c] of koi) {
            box(l, x, y, x + 3, y + 1, c);
            dot(l, x + 4, y, c);
            dot(l, x + 4, y + 1, c);
            dot(l, x - 1, y - 1, c);
            dot(l, x - 1, y + 2, c);
            if (c === NQ.white) dot(l, x + 2, y, NQ.red);
            dot(l, x + 3, y, NQ.ink);
          }
        },
        NQ.blue,
      );
      return;
    }
    case 'wall': {
      hills(g, 12, 3, NQ.green, o.seed);
      ground(g, 24, NQ.beige, NQ.sand);
      layer(g, (l) => {
        thick(l, 22, 16, 22, 8, 0.8, NQ.brown);
        oval(l, 22, 8, 7, 5.5, NQ.green, NQ.forest);
        for (let i = 0; i < 7; i++)
          dot(l, 17 + Math.floor(rnd(o.seed, i) * 10), 5 + Math.floor(rnd(o.seed, i + 3) * 7), NQ.orange);
      });
      layer(g, (l) => {
        box(l, 1, 14, 14, 23, NQ.white);
        box(l, 15, 14, 30, 23, NQ.tan);
        for (let y = 16; y <= 23; y += 3) box(l, 15, y, 30, y, NQ.brown);
        box(l, 1, 13, 30, 13, NQ.slate);
        box(l, 1, 12, 30, 12, NQ.slate);
        box(l, 1, 20, 14, 23, NQ.gray);
        for (let y = 20; y <= 23; y++)
          for (let x = 1; x <= 14; x++) if ((x + y) % 2 === 0) dot(l, x, y, NQ.white);
      });
      return;
    }
    default: {
      hills(g, 14, 4, NQ.green, o.seed);
      ground(g, 25, NQ.beige, NQ.sand);
      layer(g, (l) => {
        machiya(l, 1, 10, 25, NQ.navy);
        machiya(l, 11, 20, 25, NQ.brick);
        machiya(l, 21, 30, 25, NQ.navy);
      });
      layer(g, (l) => {
        box(l, 20, 16, 21, 18, NQ.red);
        dot(l, 20, 15, NQ.bark);
      });
    }
  }
};

/** かやぶき屋根の 家（よこ から） */
function kaya(l: Grid, x0: number, x1: number, by: number, h: number): void {
  box(l, x0 + 1, by - 3, x1 - 1, by, NQ.brown);
  for (let x = x0 + 2; x < x1 - 1; x += 3) box(l, x, by - 2, x, by - 1, NQ.cream);
  for (let y = by - 4 - h; y <= by - 4; y++) {
    const t = (y - (by - 4 - h)) / h;
    const d = Math.round((1 - t) * ((x1 - x0) / 2 - 2));
    box(l, x0 + d, y, x1 - d, y, y % 2 === 0 ? NQ.tan : NQ.sand);
  }
  box(
    l,
    x0 + Math.round((x1 - x0) / 2 - 2) + 1,
    by - 5 - h,
    x1 - Math.round((x1 - x0) / 2 - 2) - 1,
    by - 5 - h,
    NQ.hairBrown,
  );
}

/** 合掌造り（三角の 妻を 正面に） */
function gassho(l: Grid, cx: number, by: number, hw: number, lit: boolean, snow: boolean): void {
  const h = Math.round(hw * 1.6);
  box(l, cx - hw + 2, by - 3, cx + hw - 3, by, NQ.brown);
  tri(l, cx - hw, by - 3, cx + hw, by - 3, cx, by - 3 - h, snow ? NQ.white : NQ.tan);
  tri(l, cx - hw + 2.5, by - 3, cx + hw - 2.5, by - 3, cx, by - 3 - h + 3, NQ.brown);
  for (let r = 0; r < 3; r++) {
    const y = by - 5 - r * 3;
    const w = Math.round((hw - 3) * (1 - (r * 3 + 2) / h));
    for (let x = cx - w; x < cx + w; x += 2) box(l, x, y, x, y, lit ? NQ.yellow : NQ.paper);
  }
  box(l, cx - 1, by - 2, cx, by - 1, lit ? NQ.yellow : NQ.paper);
  if (snow) box(l, cx - hw, by - 3, cx + hw - 1, by - 3, NQ.white);
}

const thatched: SceneFn = (g, o) => {
  const v = o.v ?? '';
  if (v === 'snow') {
    sky(g, 'night', o.seed);
    hills(g, 17, 6, NQ.denim, o.seed);
    ground(g, 22, NQ.white, NQ.cloud);
    layer(g, (l) => {
      gassho(l, 8, 23, 6, true, true);
      gassho(l, 23, 25, 7, true, true);
    });
    for (let i = 0; i < 16; i++)
      dot(g, 2 + ((i * 13 + o.seed) % 28), 2 + ((i * 7 + o.seed * 3) % 28), NQ.white);
    for (let i = 0; i < 4; i++) cedar(g, 2 + i * 9, 30, 5);
    return;
  }
  sky(g, 'day', o.seed);
  cloud(g, 24, 4, 6);
  if (v === 'street') {
    hills(g, 12, 6, NQ.green, o.seed);
    ground(g, 12, NQ.leaf);
    for (let y = 17; y < 31; y++) {
      const w = 1 + (y - 17) * 0.6;
      box(g, 16 - w, y, 15 + w, y, NQ.sand);
    }
    layer(g, (l) => {
      kaya(l, 16, 26, 16, 5);
      kaya(l, 1, 12, 20, 6);
    });
    layer(g, (l) => {
      kaya(l, 20, 34, 25, 8);
      kaya(l, -4, 10, 28, 9);
    });
    return;
  }
  hills(g, 16, 7, NQ.green, o.seed);
  ground(g, 22, NQ.lime, NQ.leaf);
  for (let y = 24; y < 31; y += 2) for (let x = 1 + (y % 4); x < 31; x += 3) dot(g, x, y, NQ.leaf);
  layer(g, (l) => {
    kaya(l, 2, 17, 23, 8);
    kaya(l, 17, 29, 26, 6);
  });
  for (let i = 0; i < 2; i++) cedar(g, 28 - i * 3, 17, 9);
};

// ───────────────────────── 庭 ─────────────────────────

/** 雪見灯ろう（石） */
function stoneLantern(l: Grid, x: number, by: number, legs = false): void {
  if (legs) {
    seg(l, x - 2, by, x - 1, by - 3, NQ.gray);
    seg(l, x + 3, by + 2, x + 2, by - 3, NQ.gray);
  } else box(l, x, by - 3, x + 1, by, NQ.gray);
  box(l, x - 1, by - 5, x + 2, by - 4, NQ.silver);
  dot(l, x, by - 5, NQ.cream);
  box(l, x - 3, by - 6, x + 4, by - 6, NQ.gray);
  box(l, x - 2, by - 7, x + 3, by - 7, NQ.silver);
  box(l, x, by - 8, x + 1, by - 8, NQ.gray);
}

const garden: SceneFn = (g, o) => {
  const v = o.v ?? '';
  sky(g, 'day', o.seed);
  cloud(g, 6, 4, 6);
  if (v === 'plum') {
    hills(g, 14, 4, NQ.green, o.seed);
    ground(g, 14, NQ.leaf, NQ.lime);
    for (let i = 0; i < 7; i++) {
      const x = 3 + i * 4.5 + (rnd(o.seed, i) - 0.5) * 2;
      const by = 19 + (i % 3) * 5;
      layer(g, (l) => {
        thick(l, x, by, x, by - 3, 0.5, NQ.bark);
        seg(l, x, by - 3, x - 2, by - 6, NQ.bark);
        seg(l, x, by - 3, x + 2, by - 6, NQ.bark);
        const c = [NQ.blush, NQ.white, NQ.red][i % 3]!;
        for (let k = 0; k < 9; k++)
          dot(
            l,
            x - 3 + Math.floor(rnd(o.seed + i, k) * 7),
            by - 8 + Math.floor(rnd(o.seed + i, k + 9) * 5),
            c,
          );
      });
    }
    return;
  }
  if (v === 'pine') {
    tri(g, 6, 16, 16, 3, 28, 16, NQ.green);
    box(g, 1, 16, 30, 30, NQ.leaf);
    oval(g, 18, 25, 12, 5, NQ.azure);
    oval(g, 16, 24, 5, 1.2, NQ.sky);
    layer(g, (l) => {
      pine(l, 6, 22, 1.3);
      pine(l, 24, 19, 1);
    });
    layer(g, (l) => {
      for (let x = 12; x <= 22; x++) {
        const y = Math.round(23 - Math.sin(((x - 12) / 10) * Math.PI) * 2.5);
        dot(l, x, y, NQ.tan);
        dot(l, x, y + 1, NQ.brown);
      }
    });
    return;
  }
  if (v === 'lantern') {
    hills(g, 14, 4, NQ.green, o.seed);
    box(g, 1, 14, 30, 30, NQ.leaf);
    oval(g, 16, 26, 16, 7, NQ.azure);
    oval(g, 14, 25, 6, 1.2, NQ.sky);
    layer(g, (l) => {
      thick(l, 30, 24, 24, 12, 0.7, NQ.brown);
      seg(l, 24, 12, 14, 8, NQ.brown);
      oval(l, 25, 8, 6, 3, NQ.green, NQ.forest);
      oval(l, 15, 6, 5, 2, NQ.green, NQ.forest);
    });
    layer(g, (l) => {
      oval(l, 22, 24, 3, 1.5, NQ.gray);
      stoneLantern(l, 19, 23, true);
    });
    layer(g, (l) => {
      for (let x = 3; x <= 12; x++) {
        const y = Math.round(21 - Math.sin(((x - 3) / 9) * Math.PI) * 2);
        dot(l, x, y, NQ.silver);
        dot(l, x, y + 1, NQ.gray);
      }
    });
    return;
  }
  // 大きな しばふの 庭
  hills(g, 14, 5, NQ.green, o.seed);
  ground(g, 14, NQ.leaf, NQ.lime);
  oval(g, 17, 24, 13, 5, NQ.azure);
  oval(g, 14, 23, 5, 1.2, NQ.sky);
  layer(g, (l) => {
    box(l, 21, 13, 28, 16, NQ.paper);
    box(l, 23, 14, 26, 16, NQ.brown);
    bigRoof(l, 20, 29, 10, 12, NQ.hairBrown, NQ.tan);
  });
  layer(g, (l) => {
    pine(l, 5, 22, 1);
    stoneLantern(l, 14, 30);
  });
  for (let i = 0; i < 3; i++) oval(g, 22 + i * 3, 29, 1.5, 1, NQ.gray);
};

// ───────────────────────── 塔・門 ─────────────────────────

const sunTower: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 5, 5, 6);
  cloud(g, 27, 12, 5);
  ground(g, 27, NQ.leaf, NQ.lime);
  for (let i = 0; i < 6; i++) bush(g, 2 + i * 5.6, 27, 2.8, NQ.green, NQ.forest);
  layer(g, (l) => {
    for (let y = 10; y <= 29; y++) {
      const hw = 2.5 + (y - 10) * 0.28;
      box(l, 16 - hw, y, 15 + hw, y, NQ.paper);
      dot(l, 15 + hw, y, NQ.cloud);
    }
    thick(l, 12, 16, 7, 13, 1, NQ.paper);
    thick(l, 7, 13, 6, 9, 1, NQ.paper);
    thick(l, 19, 16, 24, 13, 1, NQ.paper);
    thick(l, 24, 13, 25, 9, 1, NQ.paper);
    seg(l, 11, 16, 7, 14, NQ.red);
    seg(l, 7, 13, 6, 10, NQ.red);
    seg(l, 20, 16, 24, 14, NQ.red);
    seg(l, 24, 13, 25, 10, NQ.red);
    seg(l, 12, 20, 10, 28, NQ.red);
    seg(l, 19, 20, 21, 28, NQ.red);
    oval(l, 16, 20, 3, 3, NQ.cloud);
    box(l, 14, 20, 14, 20, NQ.slate);
    box(l, 17, 20, 17, 20, NQ.slate);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      dot(l, 16 + Math.cos(a) * 5, 6 + Math.sin(a) * 4.2, NQ.gold);
    }
    oval(l, 16, 6, 4, 3.4, NQ.gold, NQ.ochre);
    box(l, 13, 6, 14, 6, NQ.ink);
    box(l, 17, 6, 18, 6, NQ.ink);
    box(l, 15, 8, 16, 8, NQ.ochre);
  });
};

const tokyoTower: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 6, 6, 6);
  cloud(g, 26, 10, 5);
  layer(g, (l) => {
    for (let y = 2; y <= 28; y++) {
      const t = (y - 2) / 26;
      const hw = 0.6 + 10 * t ** 2.4;
      const band = Math.floor((y + 1) / 3) % 2 === 0 ? NQ.vermilion : NQ.white;
      for (let x = Math.round(16 - hw); x <= Math.round(15 + hw); x++) {
        const inner = y > 21 && Math.abs(x + 0.5 - 16) < hw - 2.5;
        if (inner) continue;
        dot(l, x, y, (x + y) % 3 === 0 && hw > 1.5 ? (band === NQ.white ? NQ.cloud : NQ.brick) : band);
      }
    }
    box(l, 12, 13, 19, 14, NQ.white);
    box(l, 12, 14, 19, 14, NQ.sky);
    box(l, 14, 8, 17, 8, NQ.white);
    box(l, 15, 1, 16, 1, NQ.white);
  });
  layer(g, (l) => {
    const bs: Array<[number, number, number, string]> = [
      [1, 5, 22, NQ.silver],
      [6, 9, 25, NQ.cloud],
      [22, 25, 24, NQ.cloud],
      [26, 30, 21, NQ.silver],
      [10, 21, 27, NQ.gray],
    ];
    for (const [x0, x1, y, c] of bs) {
      box(l, x0, y, x1, 30, c);
      for (let yy = y + 1; yy <= 30; yy += 2) for (let x = x0 + 1; x < x1; x += 2) dot(l, x, yy, NQ.sky);
    }
  });
};

const lanternGate: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 26, 3, 5);
  ground(g, 27, NQ.cloud, NQ.silver);
  layer(g, (l) => {
    box(l, 2, 11, 29, 27, NQ.red);
    box(l, 3, 13, 8, 26, NQ.brick);
    box(l, 23, 13, 28, 26, NQ.brick);
    box(l, 9, 11, 22, 27, NQ.night);
    for (const x of [2, 8, 22, 28]) box(l, x, 11, x + 1, 27, NQ.vermilion);
    bigRoof(l, 1, 30, 3, 10, NQ.hairBlack, NQ.slate);
    box(l, 3, 3, 28, 3, NQ.slate);
  });
  layer(g, (l) => {
    oval(l, 16, 18, 6.5, 7.5, NQ.red, NQ.brick);
    for (let y = 13; y <= 23; y += 3)
      for (let x = 10; x <= 21; x++) if (l[y]![x] === NQ.red) dot(l, x, y, NQ.vermilion);
    box(l, 12, 10, 19, 11, NQ.hairBlack);
    box(l, 12, 25, 19, 26, NQ.hairBlack);
    box(l, 12, 11, 19, 11, NQ.gold);
    box(l, 12, 25, 19, 25, NQ.gold);
    box(l, 15, 27, 16, 27, NQ.hairBlack);
  });
};

const chinaGate: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  layer(g, (l) => {
    house(l, 1, 6, 26, 8, NQ.red, NQ.teal);
    house(l, 25, 30, 26, 8, NQ.gold, NQ.teal);
  });
  ground(g, 27, NQ.silver, NQ.gray);
  layer(g, (l) => {
    for (const x of [6, 25]) box(l, x, 12, x + 1, 27, NQ.red);
    for (const x of [11, 20]) box(l, x, 12, x + 1, 27, NQ.red);
    box(l, 5, 10, 26, 12, NQ.azure);
    for (let x = 5; x <= 26; x += 2) dot(l, x, 11, NQ.gold);
    box(l, 13, 13, 18, 16, NQ.gold);
    box(l, 14, 14, 17, 15, NQ.red);
    bigRoof(l, 3, 28, 6, 9, NQ.green, NQ.gold);
    bigRoof(l, 9, 22, 2, 5, NQ.green, NQ.gold);
    dot(l, 15, 1, NQ.gold);
    dot(l, 16, 1, NQ.gold);
    box(l, 1, 12, 5, 12, NQ.green);
    box(l, 26, 12, 30, 12, NQ.green);
  });
  layer(g, (l) => {
    for (const x of [4, 9, 15, 23, 28]) {
      oval(l, x + 0.5, 17, 1.6, 1.8, NQ.red);
      dot(l, x, 15, NQ.gold);
      dot(l, x, 19, NQ.gold);
    }
  });
};

// ───────────────────────── むかしの あと ─────────────────────────

const kofun: SceneFn = (g) => {
  ground(g, 1, NQ.lime);
  for (let y = 1; y < 31; y += 5) box(g, 1, y, 30, y, NQ.sprout);
  for (let x = 1; x < 31; x += 7) box(g, x, 1, x, 30, NQ.sprout);
  const inK = (x: number, y: number, gr: number): boolean => {
    const px = x + 0.5;
    const py = y + 0.5;
    if ((px - 16) ** 2 + (py - 11) ** 2 <= (6.5 + gr) ** 2) return true;
    return py >= 11 && py <= 27 + gr && Math.abs(px - 16) <= 3 + (py - 11) * 0.42 + gr;
  };
  for (let y = 1; y < 31; y++)
    for (let x = 1; x < 31; x++) {
      if (inK(x, y, 3)) dot(g, x, y, NQ.teal);
      if (inK(x, y, 0))
        dot(g, x, y, (x * 3 + y * 5) % 7 === 0 ? NQ.leaf : (x + y * 2) % 5 === 0 ? NQ.forest : NQ.green);
    }
  for (let i = 0; i < 6; i++) dot(g, 4 + i * 4, 2 + (i % 2), NQ.aqua);
  layer(g, (l) => {
    box(l, 3, 25, 6, 27, NQ.white);
    box(l, 2, 24, 7, 24, NQ.slate);
    box(l, 25, 4, 28, 6, NQ.paper);
    box(l, 24, 3, 29, 3, NQ.brick);
  });
};

/** 竪穴住居（とんがり かやぶき） */
function pitHut(l: Grid, cx: number, by: number, hw: number): void {
  const h = Math.round(hw * 1.2);
  for (let y = by - h; y <= by; y++) {
    const w = ((y - (by - h)) / h) * hw;
    box(l, cx - w, y, cx + w - 1, y, y % 2 === 0 ? NQ.tan : NQ.sand);
  }
  box(l, cx - 1, by - h - 1, cx, by - h, NQ.brown);
  tri(l, cx - 2, by + 1, cx + 2, by + 1, cx, by - 3, NQ.bark);
}

const pitHouse: SceneFn = (g, o) => {
  const v = o.v ?? '';
  sky(g, 'day', o.seed);
  cloud(g, 6, 4, 6);
  hills(g, 18, 6, NQ.green, o.seed);
  ground(g, 20, NQ.leaf, NQ.lime);
  for (let i = 0; i < 10; i++)
    dot(g, 1 + Math.floor(rnd(o.seed, i) * 30), 21 + Math.floor(rnd(o.seed, i + 2) * 10), NQ.green);
  if (v === 'tower') {
    layer(g, (l) => {
      for (const x of [4, 10, 16]) box(l, x, 3, x + 1, 27, NQ.brown);
      for (const y of [7, 14, 21]) {
        box(l, 3, y, 18, y + 1, NQ.tan);
        box(l, 3, y + 1, 18, y + 1, NQ.brown);
      }
    });
    layer(g, (l) => {
      oval(l, 25, 26, 6, 4, NQ.tan, NQ.brown, (_x, y) => y < 27);
      for (let x = 20; x <= 30; x += 2) seg(l, x, 26, 25, 22.5, NQ.sand);
    });
    return;
  }
  if (v === 'fence') {
    layer(g, (l) => {
      for (const x of [19, 26]) box(l, x, 6, x + 1, 22, NQ.brown);
      box(l, 18, 12, 28, 13, NQ.tan);
      box(l, 18, 13, 28, 13, NQ.brown);
      for (let y = 2; y <= 6; y++) {
        const w = (y - 2) * 1.4 + 1;
        box(l, 23 - w, y, 22 + w, y, y % 2 ? NQ.tan : NQ.sand);
      }
    });
    layer(g, (l) => {
      pitHut(l, 7, 20, 5);
      pitHut(l, 14, 19, 3);
    });
    layer(g, (l) => {
      for (let x = 1; x <= 30; x += 2) {
        box(l, x, 22, x, 29, NQ.tan);
        dot(l, x, 21, NQ.sand);
      }
      box(l, 1, 24, 30, 24, NQ.brown);
      box(l, 1, 27, 30, 27, NQ.brown);
    });
    return;
  }
  layer(g, (l) => {
    pitHut(l, 8, 24, 6);
    pitHut(l, 18, 21, 4);
  });
  layer(g, (l) => {
    for (const x of [23, 28]) box(l, x, 21, x, 28, NQ.brown);
    box(l, 22, 20, 29, 20, NQ.brown);
    box(l, 23, 18, 28, 19, NQ.tan);
    for (let y = 14; y <= 17; y++) {
      const w = (y - 13) * 1.2;
      box(l, 26 - w, y, 25 + w, y, y % 2 ? NQ.sand : NQ.tan);
    }
  });
};

const stoneTomb: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 24, 4, 6);
  hills(g, 18, 4, NQ.green, o.seed);
  oval(g, 16, 30, 20, 10, NQ.leaf, NQ.green);
  ground(g, 29, NQ.leaf);
  layer(g, (l) => {
    oval(l, 8, 21, 5, 5, NQ.gray, NQ.slate);
    oval(l, 24, 21, 5.5, 5, NQ.gray, NQ.slate);
    box(l, 12, 17, 19, 26, NQ.night);
    oval(l, 16, 12, 13, 5.5, NQ.silver, NQ.gray);
    oval(l, 12, 10, 5, 2, NQ.cloud);
  });
  person(g, 16, 25, NQ.red);
  for (let i = 0; i < 5; i++) dot(g, 3 + i * 6, 28 + (i % 2), NQ.lime);
};

const mine: SceneFn = (g, o) => {
  const v = o.v ?? '';
  sky(g, 'day', o.seed);
  cloud(g, 24, 4, 6);
  if (v === 'gold') {
    for (let y = 1; y < 31; y++)
      for (let x = 1; x < 31; x++) {
        const top = 5 + Math.abs(x - 15.5) * 0.35;
        const split = Math.abs(x - 15.5) < Math.max(0, (18 - y) * 0.3);
        if (y >= top && !split)
          dot(g, x, y, (x * 2 + y) % 6 === 0 ? NQ.tan : (x + y * 3) % 7 === 0 ? NQ.amber : NQ.brown);
      }
    for (let i = 0; i < 5; i++) {
      bush(g, 3 + i * 1.5, 8 + i * 2, 1.8, NQ.green, NQ.forest);
      bush(g, 28 - i * 1.5, 8 + i * 2, 1.8, NQ.green, NQ.forest);
    }
    ground(g, 28, NQ.sand, NQ.tan);
    layer(g, (l) => {
      box(l, 12, 21, 19, 28, NQ.hairBrown);
      box(l, 13, 22, 18, 28, NQ.ink);
      box(l, 11, 20, 20, 20, NQ.tan);
    });
    for (let i = 0; i < 5; i++)
      dot(g, 7 + Math.floor(rnd(o.seed, i) * 18), 12 + Math.floor(rnd(o.seed, i + 5) * 14), NQ.gold);
    return;
  }
  if (v === 'silver') {
    for (let i = 0; i < 8; i++) cedar(g, 1 + i * 4.3, 14, 11 + (i % 2) * 3);
    box(g, 1, 13, 30, 30, NQ.green);
    for (let y = 14; y < 31; y += 2) for (let x = 1 + (y % 3); x < 31; x += 3) dot(g, x, y, NQ.leaf);
    layer(g, (l) => {
      oval(l, 16, 21, 9, 7, NQ.slate, NQ.gray);
      oval(l, 16, 22, 4, 4.5, NQ.ink);
      box(l, 11, 17, 12, 27, NQ.brown);
      box(l, 20, 17, 21, 27, NQ.brown);
      box(l, 10, 16, 22, 17, NQ.tan);
    });
    for (let y = 27; y < 31; y++) box(g, 14 - (y - 27), y, 17 + (y - 27), y, NQ.beige);
    for (let i = 0; i < 4; i++) bush(g, 4 + i * 8, 29, 2.2, NQ.leaf, NQ.green);
    return;
  }
  // copper：山の れんがの あと
  tri(g, -6, 30, 20, 3, 44, 30, NQ.green);
  box(g, 1, 20, 30, 30, NQ.green);
  for (let i = 0; i < 12; i++)
    bush(
      g,
      1 + Math.floor(rnd(o.seed, i) * 30),
      8 + Math.floor(rnd(o.seed, i + 6) * 22),
      2,
      NQ.forest,
      NQ.forest,
    );
  const ruin = (l: Grid, x0: number, y0: number, w: number): void => {
    box(l, x0, y0, x0 + w, y0 + 5, NQ.brick);
    for (let y = y0; y <= y0 + 5; y++) for (let x = x0 + (y % 2); x <= x0 + w; x += 3) dot(l, x, y, NQ.red);
    for (let x = x0 + 1; x < x0 + w - 1; x += 4) {
      box(l, x, y0 + 2, x + 1, y0 + 5, NQ.night);
      dot(l, x, y0 + 2, NQ.brick);
    }
    box(l, x0 - 1, y0 + 6, x0 + w + 1, y0 + 6, NQ.gray);
  };
  layer(g, (l) => {
    ruin(l, 15, 6, 10);
    ruin(l, 7, 13, 13);
    ruin(l, 3, 21, 16);
  });
};

const brickFactory: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 6, 4, 6);
  hills(g, 13, 4, NQ.green, o.seed);
  ground(g, 25, NQ.silver, NQ.gray);
  layer(g, (l) => {
    box(l, 27, 2, 28, 12, NQ.brick);
    box(l, 1, 13, 30, 25, NQ.brick);
    for (let y = 13; y <= 25; y++) for (let x = 1 + (y % 2) * 2; x <= 30; x += 4) dot(l, x, y, NQ.red);
    for (let x = 1; x <= 30; x += 5) box(l, x, 13, x, 25, NQ.brown);
    box(l, 1, 19, 30, 19, NQ.brown);
    for (let x = 3; x <= 28; x += 5) {
      if (x === 13) continue;
      box(l, x, 15, x + 1, 17, NQ.white);
      box(l, x, 21, x + 1, 23, NQ.white);
      dot(l, x, 16, NQ.sky);
      dot(l, x + 1, 22, NQ.sky);
    }
    box(l, 13, 20, 18, 25, NQ.white);
    box(l, 14, 21, 17, 25, NQ.bark);
    box(l, 15, 20, 16, 20, NQ.cream);
    for (let y = 8; y <= 12; y++) {
      const d = 12 - y;
      box(l, 1 + d, y, 30 - d, y, y === 12 ? NQ.gray : NQ.slate);
    }
  });
};

const warehouse: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 24, 4, 6);
  if (o.v === 'zelkova') {
    layer(g, (l) => {
      for (const cx of [4, 12, 20, 28]) {
        oval(l, cx, 8, 5.5, 5, NQ.leaf, NQ.green);
        oval(l, cx - 2, 6, 2, 1.6, NQ.lime);
      }
    });
    ground(g, 27, NQ.beige, NQ.sand);
    layer(g, (l) => {
      for (let i = 0; i < 5; i++) {
        const x0 = 1 + i * 6;
        gableHouse(l, x0, x0 + 5, 26, 11, NQ.hairBlack, NQ.slate);
        for (let y = 17; y <= 25; y += 2) box(l, x0, y, x0 + 5, y, NQ.night);
        box(l, x0, 16, x0 + 5, 16, NQ.white);
        box(l, x0 + 2, 21, x0 + 3, 26, NQ.brown);
      }
    });
    return;
  }
  hills(g, 13, 3, NQ.green, o.seed);
  ground(g, 20, NQ.silver);
  layer(g, (l) => {
    for (let i = 0; i < 3; i++) {
      const x0 = 2 + i * 10;
      kura(l, x0, x0 + 7, 21, NQ.brick, NQ.hairBlack);
    }
  });
  box(g, 1, 22, 30, 30, NQ.teal);
  box(g, 1, 22, 30, 22, NQ.gray);
  for (let i = 0; i < 5; i++) box(g, 2 + i * 6, 26 + (i % 2) * 3, 4 + i * 6, 26 + (i % 2) * 3, NQ.aqua);
  layer(g, (l) => {
    for (let x = 9; x <= 16; x++) {
      const y = Math.round(24 - Math.sin(((x - 9) / 7) * Math.PI) * 1.5);
      box(l, x, y, x, y + 1, NQ.silver);
    }
  });
};

const school: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 24, 3, 5);
  hills(g, 14, 4, NQ.green, o.seed);
  ground(g, 22, NQ.cloud, NQ.silver);
  layer(g, (l) => {
    kaya(l, 8, 30, 20, 6);
  });
  tri(g, 12, 31, 19, 31, 15.5, 22, NQ.beige);
  layer(g, (l) => {
    for (const x of [8, 22]) box(l, x, 16, x + 1, 30, NQ.hairBrown);
    box(l, 8, 18, 23, 18, NQ.hairBrown);
    box(l, 13, 14, 18, 15, NQ.paper);
    bigRoof(l, 6, 25, 10, 13, NQ.slate, NQ.gray);
  });
  layer(g, (l) => pine(l, 4, 29, 1.1));
};

const ornateGate: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  for (let i = 0; i < 7; i++) cedar(g, 1 + i * 5, 22, 18);
  ground(g, 26, NQ.silver, NQ.gray);
  stairs(g, 6, 25, 26, 7, 24, 30);
  layer(g, (l) => {
    box(l, 5, 18, 26, 26, NQ.white);
    for (const x of [5, 10, 21, 26]) box(l, x, 18, x, 26, NQ.cloud);
    box(l, 12, 19, 19, 26, NQ.night);
    eave(l, 4, 27, 17, NQ.hairBlack, NQ.gold);
    box(l, 3, 13, 28, 15, NQ.white);
    for (let x = 3; x <= 28; x++) {
      dot(l, x, 13, [NQ.red, NQ.teal, NQ.gold, NQ.azure][x % 4]!);
      dot(l, x, 14, x % 2 ? NQ.gold : NQ.white);
      dot(l, x, 15, [NQ.gold, NQ.azure, NQ.red, NQ.teal][x % 4]!);
    }
    bigRoof(l, 3, 28, 6, 12, NQ.hairBlack, NQ.gold);
    for (let x = 6; x <= 25; x += 3) dot(l, x, 11, NQ.gold);
    box(l, 13, 8, 18, 9, NQ.gold);
    box(l, 5, 5, 5, 6, NQ.gold);
    box(l, 26, 5, 26, 6, NQ.gold);
  });
};

const undergroundHall: SceneFn = (g) => {
  box(g, 1, 1, 30, 30, NQ.slate);
  box(g, 1, 1, 30, 6, NQ.night);
  box(g, 1, 18, 30, 30, NQ.gray);
  for (let y = 19; y < 31; y += 3) box(g, 1, y, 30, y, NQ.slate);
  for (let i = -3; i <= 3; i++) seg(g, 16 + i * 2, 18, 16 + i * 8, 30, NQ.slate);
  for (let i = 0; i < 6; i++) {
    const x = 8 + i * 3;
    box(g, x, 8, x + 1, 18, NQ.silver);
    dot(g, x + 1, 17, NQ.gray);
  }
  layer(
    g,
    (l) => {
      for (const [x0, w] of [
        [2, 4],
        [25, 4],
      ] as const) {
        box(l, x0, 1, x0 + w, 30, NQ.silver);
        box(l, x0 + w, 1, x0 + w, 30, NQ.gray);
        box(l, x0, 1, x0, 30, NQ.cloud);
      }
    },
    NQ.night,
  );
  tri(g, 12, 1, 19, 1, 15.5, 18, NQ.gray);
  for (let y = 1; y < 14; y += 2) dot(g, 15 + (y % 4 === 1 ? 1 : 0), y, NQ.cream);
  person(g, 16, 25, NQ.red);
  dot(g, 16, 22, NQ.gold);
};

const quarry: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 16, 3, 5);
  box(g, 1, 6, 30, 30, NQ.beige);
  box(g, 10, 12, 21, 30, NQ.sand);
  box(g, 12, 16, 19, 30, NQ.night);
  for (let y = 6; y < 31; y += 3) {
    box(g, 1, y, 9, y, NQ.tan);
    box(g, 22, y, 30, y, NQ.tan);
  }
  for (let y = 6; y < 31; y++) {
    const off = Math.floor(y / 3) % 2 ? 0 : 2;
    for (let x = 1 + off; x <= 9; x += 4) dot(g, x, y, NQ.tan);
    for (let x = 22 + off; x <= 30; x += 4) dot(g, x, y, NQ.tan);
  }
  box(g, 9, 6, 9, 30, NQ.sand);
  box(g, 22, 6, 22, 30, NQ.cloud);
  for (let i = 0; i < 4; i++) {
    bush(g, 2 + i * 2.2, 6, 1.6, NQ.green, NQ.forest);
    bush(g, 29 - i * 2.2, 6, 1.6, NQ.green, NQ.forest);
  }
  box(g, 1, 28, 30, 30, NQ.silver);
  person(g, 16, 28, NQ.red);
  for (let i = 0; i < 5; i++) dot(g, 13 + i, 12 + (i % 2), NQ.tan);
};

const sandArt: SceneFn = (g, o) => {
  sky(g, 'day', o.seed);
  cloud(g, 8, 3, 5);
  sea(g, 7, NQ.azure, o.seed);
  box(g, 1, 14, 30, 30, NQ.sand);
  box(g, 1, 14, 30, 14, NQ.white);
  for (let i = 0; i < 10; i++)
    dot(g, 1 + Math.floor(rnd(o.seed, i) * 30), 15 + Math.floor(rnd(o.seed, i + 4) * 15), NQ.beige);
  for (let y = 1; y < 31; y++)
    for (let x = 1; x < 31; x++) {
      const d = ((x + 0.5 - 16) / 11) ** 2 + ((y + 0.5 - 21) / 5.5) ** 2;
      const d2 = ((x + 0.5 - 16) / 9.2) ** 2 + ((y + 0.5 - 21) / 4.3) ** 2;
      if (d <= 1 && d2 >= 1) dot(g, x, y, y > 21 ? NQ.brown : NQ.tan);
    }
  box(g, 14, 20, 17, 22, NQ.tan);
  box(g, 15, 21, 16, 21, NQ.sand);
  for (const [x, y] of [
    [9, 20],
    [22, 20],
    [16, 17],
    [16, 25],
  ] as const) {
    box(g, x - 1, y, x, y, NQ.tan);
    dot(g, x, y + 1, NQ.brown);
  }
  layer(g, (l) => {
    oval(l, 3, 29, 5, 2.4, NQ.green, NQ.forest);
    oval(l, 29, 28, 5, 2.8, NQ.green, NQ.forest);
    seg(l, 1, 30, 4, 28, NQ.brown);
  });
};

const kilnVillage: SceneFn = (g, o) => {
  sky(g, 'cloudy', o.seed);
  const peak = (x0: number, px: number, py: number, x1: number): void => {
    tri(g, x0, 23, px, py, x1, 23, NQ.teal);
    tri(g, px, py, x1, 23, px + 1, 23, NQ.night);
    for (let y = py + 3; y < 23; y += 3) dot(g, px - (y - py) * 0.2, y, NQ.green);
  };
  peak(-3, 5, 2, 12);
  peak(18, 25, 3, 34);
  peak(8, 15, 5, 22);
  oval(g, 10, 13, 9, 1.4, NQ.white);
  oval(g, 24, 17, 9, 1.4, NQ.white);
  oval(g, 14, 20, 12, 1.2, NQ.paper);
  ground(g, 23, NQ.green, NQ.leaf);
  layer(g, (l) => {
    box(l, 7, 15, 8, 23, NQ.brick);
    box(l, 21, 17, 22, 23, NQ.brick);
    for (let y = 16; y <= 23; y += 2) {
      dot(l, 7, y, NQ.red);
      dot(l, 22, y + 1, NQ.red);
    }
  });
  layer(g, (l) => {
    house(l, 2, 11, 27, 4, NQ.paper, NQ.slate);
    house(l, 14, 20, 29, 4, NQ.paper, NQ.slate);
    house(l, 23, 30, 26, 4, NQ.paper, NQ.slate);
    for (const x of [4, 7, 16, 25, 28]) dot(l, x, x < 14 ? 25 : x < 22 ? 27 : 24, NQ.blue);
  });
  steam(g, 7, 14, 4, o.seed);
  steam(g, 21, 16, 4, o.seed + 2);
};

const stonePath: SceneFn = (g, o) => {
  box(g, 1, 1, 30, 30, NQ.forest);
  for (let i = 0; i < 20; i++)
    dot(g, 1 + Math.floor(rnd(o.seed, i) * 30), 1 + Math.floor(rnd(o.seed, i + 30) * 12), NQ.green);
  box(g, 1, 16, 30, 30, NQ.green);
  for (let i = 0; i < 16; i++)
    dot(g, 1 + Math.floor(rnd(o.seed, i + 60) * 30), 17 + Math.floor(rnd(o.seed, i + 90) * 13), NQ.leaf);
  for (let y = 12; y < 31; y++) {
    const cx = 16 + Math.sin(y / 3.2) * 3 * ((y - 10) / 20);
    const w = 1 + (y - 12) * 0.35;
    for (let x = Math.round(cx - w); x <= Math.round(cx + w); x++)
      dot(
        g,
        x,
        y,
        (x * 3 + y * 2) % 5 === 0 ? NQ.gray : (x + y) % 7 === 0 ? NQ.leaf : y % 3 === 0 ? NQ.gray : NQ.silver,
      );
  }
  layer(
    g,
    (l) => {
      const xs = [3, 8, 23, 28, 12, 19];
      xs.forEach((x, i) => {
        const w = i < 4 ? 2 : 1;
        const by = i < 4 ? 30 : 16;
        box(l, x, 1, x + w - 1, by, NQ.brown);
        box(l, x, 1, x, by, NQ.hairBrown);
      });
    },
    NQ.bark,
  );
  for (let i = 0; i < 4; i++) seg(g, 10 + i * 4, 1, 12 + i * 4, 10, NQ.leaf);
};

export const BUILDINGS: Record<BuildingKey, SceneFn> = {
  castle,
  castleRed,
  starFort,
  castleRuins,
  shrine,
  toriiSea,
  toriiRow,
  temple,
  pagoda,
  goldPavilion,
  cliffStage,
  mountainTemple,
  daibutsu,
  stoneBuddha,
  onsen,
  sandBath,
  archBridge,
  bigBridge,
  vineBridge,
  lighthouse,
  port,
  fishingVillage,
  church,
  oldTown,
  thatched,
  garden,
  sunTower,
  tokyoTower,
  lanternGate,
  chinaGate,
  kofun,
  pitHouse,
  stoneTomb,
  mine,
  brickFactory,
  warehouse,
  school,
  ornateGate,
  undergroundHall,
  quarry,
  sandArt,
  kilnVillage,
  stonePath,
};
