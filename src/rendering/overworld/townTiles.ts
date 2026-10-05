/**
 * 町の見た目を 県ごとに かえる タイル（61〜146）と、都会の 町の タイル（161〜220）。
 * どれを使うかは scripts/data/towns.ts の テーマ。
 * 番号は scripts/scaffold-maps.ts の T と対応。「すけ」は 地面の上に重ねる（decor レイヤー）。
 * 2×2 など 大きな物は block で 1 まいの絵に描いて、左上から 行ごとに 番号を ふる。
 */
import { NQ } from '../palette';

export type Rect = (x: number, y: number, w: number, h: number, col: string) => void;
export interface TileApi {
  /** 1 まい（16×16） */
  tile(n: number, draw: (r: Rect) => void): void;
  /** w×h まいの 大きな絵（first から 行ごとに 番号） */
  block(first: number, w: number, h: number, draw: (r: Rect) => void): void;
}

/** 屋根（base の地に dark の段、いちばん上に light の光。fieldArt の屋根と同じ形） */
const roof = (r: Rect, base: string, dark: string, light: string) => {
  r(0, 0, 16, 16, base);
  r(0, 0, 16, 1, light);
  for (const y of [5, 10, 15]) r(0, y, 16, 1, dark);
  for (const [x, y] of [
    [3, 1],
    [11, 1],
    [7, 6],
    [15, 6],
    [3, 11],
    [11, 11],
  ] as const)
    r(x, y, 1, 4, dark);
};

/** まるい 木の かんむり（葉・かげ・光）。実の 色が あれば 実も */
const roundTree = (r: Rect, leaf: string, shade: string, light: string, fruit?: string) => {
  r(5, 14, 6, 1, NQ.forest);
  r(7, 10, 2, 5, NQ.brown);
  r(3, 1, 10, 10, leaf);
  r(2, 3, 12, 6, leaf);
  r(4, 2, 4, 3, light);
  r(10, 7, 3, 3, shade);
  r(3, 9, 4, 1, shade);
  if (fruit)
    for (const [x, y] of [
      [5, 6],
      [10, 3],
      [8, 8],
      [12, 6],
      [4, 3],
    ] as const)
      r(x, y, 2, 2, fruit);
};

/** 針葉樹（3 だんの 三角）。snow が あれば 各だんの 上に 雪 */
const pine = (r: Rect, snow?: string) => {
  r(7, 12, 2, 4, NQ.brown);
  const tiers: [number, number, number][] = [
    [1, 3, 4],
    [4, 5, 8],
    [8, 7, 11],
  ];
  for (const [top, half, bottom] of tiers)
    for (let y = top; y <= bottom; y++) {
      const hw = Math.round(((y - top + 1) * half) / (bottom - top + 1));
      r(8 - hw, y, hw * 2, 1, NQ.green);
      r(8, y, hw, 1, NQ.forest);
      if (snow && y <= top + 1) r(8 - hw, y, hw * 2, 1, snow);
    }
  r(7, 0, 2, 1, snow ?? NQ.green);
};

export function drawTownTiles({ tile, block }: TileApi): void {
  // ───── 地面：雪・すな ─────
  tile(61, (r) => {
    r(0, 0, 16, 16, NQ.white);
    r(3, 4, 3, 1, NQ.cloud);
    r(11, 9, 3, 1, NQ.cloud);
    r(6, 13, 2, 1, NQ.cloud);
    r(13, 2, 1, 1, NQ.ice);
  });
  tile(62, (r) => {
    r(0, 0, 16, 16, NQ.white);
    r(2, 10, 4, 1, NQ.cloud);
    r(9, 3, 3, 1, NQ.cloud);
    r(12, 12, 2, 1, NQ.cloud);
    r(5, 5, 1, 1, NQ.ice);
    r(4, 6, 3, 1, NQ.ice);
  });
  tile(63, (r) => {
    r(0, 0, 16, 16, NQ.sand);
    r(3, 4, 2, 1, NQ.tan);
    r(11, 10, 3, 1, NQ.tan);
    r(7, 13, 1, 1, NQ.beige);
    r(13, 3, 1, 1, NQ.beige);
  });
  tile(64, (r) => {
    r(0, 0, 16, 16, NQ.sand);
    r(2, 11, 3, 1, NQ.tan);
    r(10, 2, 2, 1, NQ.tan);
    r(8, 7, 2, 2, NQ.paper);
    r(8, 7, 1, 1, NQ.blush);
  });

  // ───── 屋根：かわら・赤がわら（沖縄）・雪・かやぶき ─────
  tile(65, (r) => {
    roof(r, NQ.slate, NQ.night, NQ.gray);
    for (let x = 1; x < 16; x += 4) r(x, 1, 1, 14, NQ.gray);
  });
  tile(66, (r) => {
    roof(r, NQ.vermilion, NQ.brick, NQ.apricot);
    for (let x = 2; x < 16; x += 4) r(x, 0, 1, 16, NQ.paper);
  });
  tile(67, (r) => {
    roof(r, NQ.brown, NQ.bark, NQ.tan);
    r(0, 0, 16, 11, NQ.white);
    r(0, 9, 16, 2, NQ.cloud);
    r(3, 3, 3, 1, NQ.cloud);
    r(10, 6, 3, 1, NQ.cloud);
    for (const x of [2, 7, 12]) r(x, 11, 1, 3, NQ.ice);
  });
  tile(68, (r) => {
    r(0, 0, 16, 16, NQ.ochre);
    r(0, 0, 16, 1, NQ.cream);
    for (let y = 2; y < 16; y += 3)
      for (let x = (y % 2) * 2; x < 16; x += 4) {
        r(x, y, 2, 1, NQ.amber);
        r(x + 1, y + 1, 1, 1, NQ.tan);
      }
    r(0, 15, 16, 1, NQ.brown);
  });

  // ───── 木（すけ） ─────
  tile(69, (r) => pine(r));
  tile(70, (r) => pine(r, NQ.white));
  // ヤシの木
  tile(71, (r) => {
    for (let y = 5; y < 15; y++) r(7 + (y > 10 ? 1 : 0), y, 2, 1, y % 2 ? NQ.tan : NQ.brown);
    r(5, 15, 6, 1, NQ.forest);
    r(1, 3, 6, 2, NQ.leaf);
    r(9, 3, 6, 2, NQ.leaf);
    r(0, 5, 3, 2, NQ.green);
    r(13, 5, 3, 2, NQ.green);
    r(5, 1, 6, 3, NQ.leaf);
    r(6, 0, 4, 1, NQ.lime);
    r(6, 5, 2, 2, NQ.brown);
    r(9, 5, 2, 2, NQ.bark);
  });
  // さくら
  tile(72, (r) => {
    roundTree(r, NQ.blush, NQ.berry, NQ.white);
    r(6, 5, 1, 1, NQ.white);
    r(11, 4, 1, 1, NQ.white);
  });
  // 竹
  tile(73, (r) => {
    for (const x of [2, 7, 12]) {
      r(x, 0, 2, 16, NQ.leaf);
      r(x, 0, 1, 16, NQ.lime);
      for (const y of [4, 9, 14]) r(x, y, 2, 1, NQ.green);
    }
    r(4, 3, 3, 1, NQ.green);
    r(9, 7, 3, 1, NQ.green);
    r(0, 10, 2, 1, NQ.green);
    r(14, 2, 2, 1, NQ.green);
  });
  // みかん・もも・なし の木（実の 色で かえる）
  tile(74, (r) => roundTree(r, NQ.green, NQ.forest, NQ.leaf, NQ.orange));
  tile(75, (r) => roundTree(r, NQ.green, NQ.forest, NQ.leaf, NQ.blush));
  tile(76, (r) => roundTree(r, NQ.green, NQ.forest, NQ.leaf, NQ.cream));
  // ぶどう棚
  tile(77, (r) => {
    r(1, 2, 2, 14, NQ.brown);
    r(13, 2, 2, 14, NQ.brown);
    r(0, 1, 16, 2, NQ.tan);
    r(0, 3, 16, 3, NQ.green);
    r(2, 3, 4, 1, NQ.leaf);
    r(9, 4, 4, 1, NQ.leaf);
    for (const x of [4, 9]) {
      r(x, 6, 3, 3, NQ.violet);
      r(x + 1, 9, 1, 2, NQ.violet);
      r(x, 6, 1, 1, NQ.lavender);
    }
  });

  // ───── 畑（すけ。南の 畑に しきつめる） ─────
  // 田んぼ（水に なえ）
  tile(78, (r) => {
    r(0, 0, 16, 16, NQ.sky);
    r(0, 0, 16, 1, NQ.tan);
    r(0, 15, 16, 1, NQ.tan);
    for (let y = 2; y < 14; y += 3)
      for (let x = 1 + (y % 2); x < 16; x += 3) {
        r(x, y, 1, 2, NQ.leaf);
        r(x + 1, y, 1, 1, NQ.lime);
      }
    r(4, 5, 2, 1, NQ.ice);
  });
  // 茶畑（まるい うね）
  tile(79, (r) => {
    r(0, 0, 16, 16, NQ.brown);
    for (const y of [0, 8]) {
      r(0, y + 1, 16, 6, NQ.green);
      r(0, y + 1, 16, 2, NQ.leaf);
      r(2, y + 2, 2, 1, NQ.lime);
      r(10, y + 2, 2, 1, NQ.lime);
      r(0, y + 6, 16, 1, NQ.forest);
    }
  });
  // ラベンダー
  tile(80, (r) => {
    r(0, 0, 16, 16, NQ.green);
    for (const y of [1, 6, 11])
      for (let x = 1; x < 16; x += 3) {
        r(x, y + 1, 1, 3, NQ.violet);
        r(x, y, 1, 1, NQ.lavender);
        r(x + 1, y + 2, 1, 2, NQ.lavender);
      }
  });
  // チューリップ
  tile(81, (r) => {
    r(0, 0, 16, 16, NQ.leaf);
    const cols = [NQ.red, NQ.yellow, NQ.blush, NQ.white];
    [2, 9].forEach((y, j) =>
      [1, 5, 9, 13].forEach((x, i) => {
        r(x + 1, y + 3, 1, 3, NQ.green);
        r(x, y + 4, 1, 1, NQ.green);
        r(x, y, 3, 3, cols[(i + j * 2) % 4]!);
        r(x + 1, y - 1, 1, 1, cols[(i + j * 2) % 4]!);
      }),
    );
  });
  // キャベツ
  tile(82, (r) => {
    r(0, 0, 16, 16, NQ.brown);
    for (const [x, y] of [
      [1, 1],
      [9, 1],
      [5, 9],
      [12, 9],
    ] as const) {
      r(x, y + 1, 5, 3, NQ.lime);
      r(x + 1, y, 3, 5, NQ.lime);
      r(x + 1, y + 1, 3, 3, NQ.sprout);
      r(x + 2, y + 2, 1, 1, NQ.leaf);
    }
  });
  // パイナップル
  tile(83, (r) => {
    r(0, 0, 16, 16, NQ.brown);
    for (const x of [2, 10]) {
      r(x + 1, 0, 2, 3, NQ.leaf);
      r(x, 1, 1, 3, NQ.green);
      r(x + 3, 1, 1, 3, NQ.green);
      r(x, 4, 4, 7, NQ.gold);
      r(x, 5, 1, 1, NQ.ochre);
      r(x + 2, 7, 1, 1, NQ.ochre);
      r(x + 1, 9, 1, 1, NQ.ochre);
      r(x - 1, 11, 6, 2, NQ.green);
    }
  });
  // ネモフィラ（青い 小さな 花）
  tile(84, (r) => {
    r(0, 0, 16, 16, NQ.leaf);
    for (const [x, y] of [
      [2, 2],
      [8, 1],
      [13, 4],
      [5, 7],
      [11, 9],
      [1, 11],
      [7, 13],
      [14, 13],
    ] as const) {
      r(x - 1, y, 3, 1, NQ.sky);
      r(x, y - 1, 1, 3, NQ.sky);
      r(x, y, 1, 1, NQ.white);
    }
  });
  // いちご畑（わらの上に 葉と 赤い実）
  tile(85, (r) => {
    r(0, 0, 16, 16, NQ.cream);
    for (const y of [1, 9]) {
      r(0, y, 16, 4, NQ.green);
      r(1, y, 3, 1, NQ.leaf);
      r(9, y, 3, 1, NQ.leaf);
      for (const x of [2, 7, 12]) {
        r(x, y + 4, 2, 2, NQ.red);
        r(x, y + 4, 1, 1, NQ.yellow);
      }
    }
  });
  // 小麦
  tile(86, (r) => {
    r(0, 0, 16, 16, NQ.ochre);
    for (let x = 0; x < 16; x += 2) {
      r(x, 4, 1, 12, NQ.yellow);
      r(x, 1 + (x % 4), 1, 3, NQ.gold);
      r(x + 1, 2 + (x % 4), 1, 1, NQ.gold);
    }
    r(0, 15, 16, 1, NQ.amber);
  });
  // スイカ畑
  tile(87, (r) => {
    r(0, 0, 16, 16, NQ.brown);
    r(0, 7, 16, 1, NQ.green);
    r(3, 6, 2, 1, NQ.leaf);
    r(11, 8, 2, 1, NQ.leaf);
    for (const [x, y] of [
      [1, 1],
      [9, 9],
    ] as const) {
      r(x, y + 1, 6, 3, NQ.green);
      r(x + 1, y, 4, 5, NQ.green);
      for (const sx of [1, 3, 5]) r(x + sx, y, 1, 5, NQ.forest);
      r(x + 1, y + 1, 1, 1, NQ.lime);
    }
  });

  // ───── 小物（すけ） ─────
  // 石どうろう
  tile(88, (r) => {
    r(6, 14, 4, 2, NQ.gray);
    r(7, 10, 2, 4, NQ.silver);
    r(4, 8, 8, 2, NQ.gray);
    r(5, 5, 6, 3, NQ.silver);
    r(7, 6, 2, 1, NQ.yellow);
    r(3, 3, 10, 2, NQ.gray);
    r(5, 2, 6, 1, NQ.gray);
    r(7, 1, 2, 1, NQ.slate);
  });
  // ちょうちん（木の はしらに 2 つ）
  tile(89, (r) => {
    r(7, 0, 2, 16, NQ.brown);
    r(1, 1, 14, 1, NQ.bark);
    for (const x of [1, 10]) {
      r(x, 2, 5, 1, NQ.ink);
      r(x, 3, 5, 5, NQ.red);
      r(x + 1, 3, 1, 5, NQ.vermilion);
      r(x, 5, 5, 1, NQ.brick);
      r(x + 2, 4, 1, 2, NQ.cream);
      r(x, 8, 5, 1, NQ.ink);
    }
  });
  // 雪だるま
  tile(90, (r) => {
    r(4, 8, 8, 7, NQ.white);
    r(3, 10, 10, 4, NQ.white);
    r(4, 14, 8, 1, NQ.cloud);
    r(5, 3, 6, 5, NQ.white);
    r(4, 4, 8, 3, NQ.white);
    r(6, 5, 1, 1, NQ.ink);
    r(9, 5, 1, 1, NQ.ink);
    r(7, 6, 2, 1, NQ.orange);
    r(4, 8, 8, 1, NQ.red);
    r(10, 9, 2, 2, NQ.red);
    r(5, 1, 6, 2, NQ.slate);
  });
  // シーサー
  tile(91, (r) => {
    r(4, 13, 8, 3, NQ.gray);
    r(5, 7, 6, 6, NQ.amber);
    r(3, 2, 10, 6, NQ.orange);
    r(3, 2, 10, 1, NQ.ochre);
    r(2, 3, 1, 4, NQ.ochre);
    r(13, 3, 1, 4, NQ.ochre);
    r(5, 4, 2, 1, NQ.white);
    r(9, 4, 2, 1, NQ.white);
    r(6, 4, 1, 1, NQ.ink);
    r(9, 4, 1, 1, NQ.ink);
    r(5, 6, 6, 1, NQ.brick);
    r(6, 7, 4, 1, NQ.white);
    r(4, 11, 2, 2, NQ.orange);
    r(10, 11, 2, 2, NQ.orange);
  });
  // シカ
  tile(92, (r) => {
    r(3, 7, 9, 4, NQ.tan);
    r(3, 7, 9, 1, NQ.brown);
    for (const [x, y] of [
      [5, 8],
      [8, 9],
      [10, 8],
    ] as const)
      r(x, y, 1, 1, NQ.paper);
    for (const x of [3, 5, 9, 11]) r(x, 11, 1, 4, NQ.brown);
    r(11, 3, 3, 4, NQ.tan);
    r(12, 4, 1, 1, NQ.ink);
    r(11, 0, 1, 3, NQ.bark);
    r(13, 0, 1, 3, NQ.bark);
    r(10, 1, 1, 1, NQ.bark);
    r(14, 1, 1, 1, NQ.bark);
    r(2, 8, 1, 2, NQ.paper);
  });
  // 船（海の上に 重ねる）
  tile(93, (r) => {
    r(1, 9, 14, 3, NQ.brown);
    r(1, 9, 14, 1, NQ.tan);
    r(2, 12, 12, 1, NQ.bark);
    r(3, 13, 10, 1, NQ.bark);
    r(6, 4, 5, 5, NQ.paper);
    r(7, 5, 3, 2, NQ.sky);
    r(8, 1, 1, 3, NQ.slate);
    r(9, 1, 3, 2, NQ.red);
  });
  // 桟橋（歩ける 板）
  tile(94, (r) => {
    r(0, 0, 16, 16, NQ.tan);
    for (const y of [3, 7, 11, 15]) r(0, y, 16, 1, NQ.brown);
    for (const [x, y] of [
      [4, 0],
      [11, 4],
      [6, 8],
      [13, 12],
    ] as const)
      r(x, y, 1, 3, NQ.brown);
  });
  // 温泉の お湯
  tile(95, (r) => {
    r(0, 0, 16, 16, NQ.aqua);
    r(2, 4, 4, 1, NQ.mint);
    r(9, 9, 5, 1, NQ.mint);
    r(5, 12, 3, 1, NQ.mint);
    r(12, 3, 2, 1, NQ.white);
  });
  // 湯けむり
  tile(96, (r) => {
    for (const [x, y] of [
      [3, 10],
      [4, 8],
      [3, 6],
      [4, 4],
    ] as const)
      r(x, y, 2, 2, NQ.cloud);
    for (const [x, y] of [
      [10, 11],
      [11, 9],
      [10, 7],
      [11, 5],
      [10, 3],
    ] as const)
      r(x, y, 2, 2, NQ.white);
    r(6, 2, 2, 2, NQ.white);
  });

  // ───── 広場の まん中の 建物の 部品（すけ） ─────
  // 神社の かべ（朱色の はしら）
  tile(97, (r) => {
    r(0, 0, 16, 16, NQ.paper);
    r(0, 0, 16, 2, NQ.vermilion);
    r(0, 0, 2, 16, NQ.vermilion);
    r(14, 0, 2, 16, NQ.vermilion);
    r(7, 2, 2, 14, NQ.vermilion);
    r(3, 6, 3, 5, NQ.cloud);
    r(10, 6, 3, 5, NQ.cloud);
    r(0, 14, 16, 2, NQ.brown);
  });
  // お城の 屋根・白かべ・石がき
  tile(98, (r) => {
    roof(r, NQ.slate, NQ.night, NQ.cloud);
    r(0, 15, 16, 1, NQ.white);
  });
  tile(99, (r) => {
    r(0, 0, 16, 16, NQ.white);
    r(0, 0, 16, 1, NQ.cloud);
    for (const x of [2, 11]) {
      r(x, 5, 3, 4, NQ.night);
      r(x, 5, 3, 1, NQ.slate);
    }
    r(0, 14, 16, 2, NQ.cloud);
  });
  tile(100, (r) => {
    r(0, 0, 16, 16, NQ.silver);
    for (const [x, y, w] of [
      [0, 0, 5],
      [6, 0, 6],
      [13, 0, 3],
      [2, 5, 6],
      [9, 5, 7],
      [0, 10, 4],
      [5, 10, 5],
      [11, 10, 5],
    ] as const) {
      r(x, y + 4, w, 1, NQ.gray);
      r(x + w - 1, y, 1, 5, NQ.gray);
    }
    r(1, 1, 2, 1, NQ.cloud);
    r(10, 6, 2, 1, NQ.cloud);
  });
  // 首里城の 赤い かべ
  tile(101, (r) => {
    r(0, 0, 16, 16, NQ.vermilion);
    r(0, 0, 16, 2, NQ.gold);
    r(0, 14, 16, 2, NQ.brick);
    for (const x of [3, 9]) {
      r(x, 5, 4, 7, NQ.brick);
      r(x + 1, 6, 2, 5, NQ.red);
    }
  });
  // 102〜104 は空き（五重塔は 2×5 の 137〜146）
  // 鳥居（2×2）
  block(105, 2, 2, (r) => {
    r(0, 1, 32, 2, NQ.ink);
    r(1, 3, 30, 3, NQ.vermilion);
    r(0, 6, 32, 1, NQ.brick);
    r(4, 10, 24, 2, NQ.vermilion);
    for (const x of [6, 23]) {
      r(x, 6, 3, 23, NQ.vermilion);
      r(x + 2, 6, 1, 23, NQ.brick);
      r(x - 1, 29, 5, 3, NQ.ink);
    }
    r(14, 6, 4, 4, NQ.vermilion);
    r(15, 7, 2, 2, NQ.gold);
  });
  // 灯台（上・まん中・下）
  tile(109, (r) => {
    r(7, 0, 2, 2, NQ.slate);
    r(4, 2, 8, 3, NQ.red);
    r(5, 5, 6, 5, NQ.sky);
    r(7, 6, 2, 3, NQ.yellow);
    r(5, 5, 1, 5, NQ.slate);
    r(10, 5, 1, 5, NQ.slate);
    r(3, 10, 10, 2, NQ.slate);
    r(5, 12, 6, 4, NQ.white);
  });
  tile(110, (r) => {
    r(5, 0, 6, 16, NQ.white);
    r(10, 0, 1, 16, NQ.cloud);
    r(5, 5, 6, 4, NQ.red);
  });
  tile(111, (r) => {
    r(4, 0, 8, 12, NQ.white);
    r(11, 0, 1, 12, NQ.cloud);
    r(7, 6, 2, 6, NQ.brown);
    r(2, 12, 12, 4, NQ.gray);
    r(2, 12, 12, 1, NQ.silver);
  });
  // 海の 鳥居（水の上。すけ なし）
  tile(112, (r) => {
    r(0, 0, 16, 16, NQ.azure);
    r(1, 14, 4, 1, NQ.sky);
    r(10, 15, 4, 1, NQ.sky);
    r(1, 2, 14, 1, NQ.ink);
    r(1, 3, 14, 2, NQ.vermilion);
    r(3, 7, 10, 1, NQ.vermilion);
    for (const x of [3, 11]) {
      r(x, 3, 2, 11, NQ.vermilion);
      r(x, 13, 2, 1, NQ.brick);
    }
  });

  drawTownBlocks(block);
  drawCityTiles({ tile, block });
}

/** 広場の まん中に立つ 大きな物（何まいかを 1 まいの絵に） */
function drawTownBlocks(block: TileApi['block']): void {
  // 東京タワー（2×5 = 113〜122）。赤と白の 鉄骨、とちゅうに 展望台
  block(113, 2, 5, (r) => {
    for (let y = 4; y < 78; y++) {
      const hw = Math.round(1 + ((y - 4) / 74) ** 1.6 * 13);
      const band = Math.floor(y / 8) % 2 ? NQ.white : NQ.vermilion;
      r(16 - hw - 1, y, 2, 1, band);
      r(16 + hw - 1, y, 2, 1, band);
      if (y % 6 === 0) r(16 - hw, y, hw * 2, 1, band);
    }
    r(15, 0, 2, 6, NQ.silver);
    r(9, 30, 14, 5, NQ.vermilion);
    r(10, 31, 12, 2, NQ.sky);
    r(12, 50, 8, 3, NQ.vermilion);
    r(13, 51, 6, 1, NQ.sky);
    r(2, 76, 28, 4, NQ.gray);
  });
  // 時計台（2×3 = 123〜128）。赤い屋根の 白い 木の建物に 時計の塔
  block(123, 2, 3, (r) => {
    r(15, 0, 2, 2, NQ.slate);
    r(12, 2, 8, 3, NQ.red);
    r(11, 5, 10, 11, NQ.white);
    r(13, 6, 6, 6, NQ.paper);
    r(13, 6, 6, 1, NQ.slate);
    r(13, 11, 6, 1, NQ.slate);
    r(15, 7, 1, 3, NQ.ink);
    r(15, 9, 3, 1, NQ.ink);
    r(2, 16, 28, 7, NQ.red);
    r(2, 16, 28, 1, NQ.vermilion);
    r(0, 22, 32, 2, NQ.brick);
    r(2, 24, 28, 22, NQ.white);
    r(2, 24, 28, 1, NQ.cloud);
    for (const x of [5, 11, 19, 25]) {
      r(x, 28, 3, 6, NQ.sky);
      r(x, 28, 3, 1, NQ.slate);
    }
    r(14, 36, 4, 10, NQ.brown);
    r(0, 46, 32, 2, NQ.gray);
  });
  // まつりの 山車（2×2 = 129〜132）。明かりの ともった 大きな顔と 台車
  block(129, 2, 2, (r) => {
    r(6, 3, 20, 17, NQ.cream);
    r(6, 3, 20, 2, NQ.red);
    r(6, 18, 20, 2, NQ.blue);
    r(4, 5, 2, 13, NQ.green);
    r(26, 5, 2, 13, NQ.violet);
    r(10, 8, 4, 2, NQ.ink);
    r(18, 8, 4, 2, NQ.ink);
    r(11, 10, 2, 2, NQ.red);
    r(19, 10, 2, 2, NQ.red);
    r(14, 14, 4, 2, NQ.brick);
    r(15, 1, 2, 2, NQ.gold);
    r(2, 20, 28, 6, NQ.brown);
    r(2, 20, 28, 1, NQ.tan);
    r(3, 22, 26, 1, NQ.gold);
    for (const x of [5, 21]) {
      r(x, 26, 6, 6, NQ.bark);
      r(x + 2, 28, 2, 2, NQ.gray);
    }
  });
  // 五重塔（2×5 = 137〜146）。上ほど 小さい 5 つの 屋根、てっぺんに 金の 相輪
  block(137, 2, 5, (r) => {
    r(15, 0, 2, 12, NQ.gold);
    for (const y of [3, 6, 9]) r(14, y, 4, 1, NQ.ochre);
    for (let i = 0; i < 5; i++) {
      const y = 12 + i * 12;
      const hw = 7 + i * 2;
      const bw = hw - 3;
      r(16 - bw, y + 3, bw * 2, 9, NQ.vermilion);
      r(14, y + 5, 4, 5, NQ.paper);
      r(15, y + 5, 2, 5, NQ.brown);
      r(16 - hw, y, hw * 2, 3, NQ.slate);
      r(16 - hw, y, hw * 2, 1, NQ.gray);
      r(16 - hw - 1, y - 1, 2, 2, NQ.slate);
      r(16 + hw - 1, y - 1, 2, 2, NQ.slate);
      r(16 - hw, y + 3, hw * 2, 1, NQ.night);
    }
    r(4, 74, 24, 6, NQ.gray);
    r(4, 74, 24, 1, NQ.silver);
  });
  // 恐竜の 像（2×2 = 133〜136）
  block(133, 2, 2, (r) => {
    r(4, 26, 24, 6, NQ.gray);
    r(4, 26, 24, 1, NQ.silver);
    r(2, 14, 7, 3, NQ.leaf);
    r(0, 16, 3, 2, NQ.leaf);
    r(8, 12, 14, 9, NQ.leaf);
    r(8, 18, 14, 3, NQ.green);
    r(12, 15, 8, 3, NQ.lime);
    r(18, 4, 6, 10, NQ.leaf);
    r(20, 2, 10, 6, NQ.leaf);
    r(26, 6, 4, 2, NQ.green);
    r(24, 3, 1, 1, NQ.ink);
    r(27, 7, 1, 1, NQ.white);
    r(22, 12, 3, 1, NQ.green);
    r(10, 21, 4, 5, NQ.green);
    r(17, 21, 4, 5, NQ.green);
    for (const x of [10, 14, 18]) r(x, 11 - (x === 18 ? 8 : 0), 2, 1, NQ.forest);
  });
}

/** ビルの 色（かべ・わく・まど・屋上・1階の ガラス） */
interface CityTower {
  wall: string;
  frame: string;
  win: string;
  roof: string;
  roofTop: string;
  glass: string;
}

/** 高い ビル（2×3 = 32×48。上から 屋上・まどの かべ・1階の ガラスの 入口） */
const towerArt = (r: Rect, c: CityTower) => {
  // 屋上：パラペットの ふち・階段の とうや・きゅうすいタンク
  r(0, 0, 32, 16, c.roof);
  r(0, 0, 32, 2, c.roofTop);
  r(0, 14, 32, 2, c.frame);
  r(3, 4, 9, 9, c.roofTop);
  r(4, 5, 7, 3, c.wall);
  r(19, 4, 9, 6, c.roofTop);
  r(19, 5, 9, 1, c.wall);
  r(20, 10, 2, 3, c.frame);
  r(25, 10, 2, 3, c.frame);
  // まどが ならぶ かべ（上下に つながる もよう）
  r(0, 16, 32, 16, c.wall);
  r(0, 16, 32, 1, c.frame);
  for (let x = 2; x < 31; x += 6) {
    for (const y of [19, 26]) {
      r(x, y, 4, 4, c.win);
      r(x, y, 4, 1, c.frame);
    }
  }
  // 1階：ひさしと ガラスの かべ、まん中が 入口
  r(0, 32, 32, 16, c.wall);
  r(0, 32, 32, 3, c.frame);
  r(2, 36, 28, 10, c.glass);
  for (const x of [9, 22]) r(x, 36, 1, 10, c.frame);
  r(12, 36, 8, 10, c.roofTop);
  r(14, 39, 4, 7, c.win);
  r(14, 39, 4, 1, c.frame);
  r(0, 46, 32, 2, c.frame);
};

const TOWERS: CityTower[] = [
  // ガラスの ビル（青）
  { wall: NQ.denim, frame: NQ.night, win: NQ.sky, roof: NQ.slate, roofTop: NQ.gray, glass: NQ.azure },
  // れんがの ビル（茶）
  { wall: NQ.brown, frame: NQ.bark, win: NQ.cream, roof: NQ.tan, roofTop: NQ.brown, glass: NQ.sky },
  // 白い ビル
  { wall: NQ.cloud, frame: NQ.gray, win: NQ.blue, roof: NQ.silver, roofTop: NQ.cloud, glass: NQ.ice },
  // 銀の ビル
  { wall: NQ.gray, frame: NQ.slate, win: NQ.ice, roof: NQ.night, roofTop: NQ.slate, glass: NQ.sky },
];

/**
 * 都会の 町の タイル（161〜220）。scripts/scaffold-maps.ts の townMap（style: 'city'）が 使う。
 * 161〜169 道路・歩道・石だたみ、170〜183 町かどの もの（すけ）、184〜207 高い ビル（2×3 が 4 しゅるい）、
 * 208〜215 駅と 電車、216〜220 お店の ビルの かべ・屋上・ガラス・しばふ・歩道橋。
 */
function drawCityTiles({ tile, block }: TileApi): void {
  /** アスファルト（ざらざらの つぶ） */
  const asphalt = (r: Rect) => {
    r(0, 0, 16, 16, NQ.slate);
    for (const [x, y] of [
      [2, 3],
      [9, 1],
      [13, 8],
      [5, 11],
      [11, 13],
      [7, 6],
    ] as const)
      r(x, y, 1, 1, NQ.gray);
    for (const [x, y] of [
      [4, 8],
      [12, 3],
      [8, 14],
    ] as const)
      r(x, y, 1, 1, NQ.night);
  };
  /** 歩道（四角い ブロックの つぎめ） */
  const walk = (r: Rect) => {
    r(0, 0, 16, 16, NQ.silver);
    for (const y of [7, 15]) r(0, y, 16, 1, NQ.cloud);
    r(7, 0, 1, 8, NQ.cloud);
    r(3, 8, 1, 8, NQ.cloud);
    r(11, 8, 1, 8, NQ.cloud);
    r(1, 2, 2, 1, NQ.gray);
    r(12, 10, 2, 1, NQ.gray);
  };
  /** 石だたみ（駅前の 広場） */
  const pavement = (r: Rect) => {
    r(0, 0, 16, 16, NQ.beige);
    for (const y of [7, 15]) r(0, y, 16, 1, NQ.tan);
    r(7, 0, 1, 8, NQ.tan);
    r(3, 8, 1, 8, NQ.tan);
    r(11, 8, 1, 8, NQ.tan);
  };

  // 161 道路
  tile(161, asphalt);
  // 162 たての 道（右はしに 白い 中央線）
  tile(162, (r) => {
    asphalt(r);
    for (const y of [1, 7, 13]) r(14, y, 2, 4, NQ.paper);
  });
  // 163 よこの 道（下はしに 白い 中央線）
  tile(163, (r) => {
    asphalt(r);
    for (const x of [1, 7, 13]) r(x, 14, 4, 2, NQ.paper);
  });
  // 164 横断歩道（よこの 道を わたる：白い 帯が よこに）
  tile(164, (r) => {
    asphalt(r);
    r(0, 2, 16, 4, NQ.paper);
    r(0, 10, 16, 4, NQ.paper);
  });
  // 165 横断歩道（たての 道を わたる：白い 帯が たてに）
  tile(165, (r) => {
    asphalt(r);
    r(2, 0, 4, 16, NQ.paper);
    r(10, 0, 4, 16, NQ.paper);
  });
  // 166 歩道
  tile(166, walk);
  // 167 歩道と マンホール
  tile(167, (r) => {
    walk(r);
    r(5, 5, 6, 6, NQ.gray);
    r(6, 6, 4, 4, NQ.slate);
    r(6, 7, 4, 1, NQ.gray);
  });
  // 168 石だたみ（駅前の 広場）
  tile(168, pavement);
  // 169 石だたみ（もよう）
  tile(169, (r) => {
    pavement(r);
    r(6, 3, 4, 10, NQ.paper);
    r(3, 6, 10, 4, NQ.paper);
    r(6, 6, 4, 4, NQ.cloud);
  });
  // 170 信号（すけ）
  tile(170, (r) => {
    r(7, 6, 2, 10, NQ.gray);
    r(6, 15, 4, 1, NQ.slate);
    r(2, 1, 12, 5, NQ.night);
    r(2, 1, 12, 1, NQ.slate);
    r(3, 2, 3, 3, NQ.red);
    r(6, 2, 3, 3, NQ.gold);
    r(10, 2, 3, 3, NQ.leaf);
  });
  // 171 街路樹（植えこみの 木。すけ）
  tile(171, (r) => {
    r(3, 12, 10, 4, NQ.gray);
    r(4, 13, 8, 2, NQ.brown);
    r(7, 8, 2, 5, NQ.bark);
    r(3, 1, 10, 9, NQ.green);
    r(2, 3, 12, 5, NQ.green);
    r(4, 2, 4, 3, NQ.leaf);
    r(5, 3, 2, 1, NQ.lime);
    r(10, 6, 3, 3, NQ.forest);
  });
  // 172 バス停（すけ）
  tile(172, (r) => {
    r(7, 4, 2, 11, NQ.silver);
    r(5, 15, 6, 1, NQ.slate);
    r(2, 0, 12, 5, NQ.blue);
    r(2, 0, 12, 1, NQ.azure);
    r(4, 2, 8, 1, NQ.white);
    r(4, 3, 5, 1, NQ.cloud);
  });
  // 173 じはんき（すけ）
  tile(173, (r) => {
    r(3, 2, 10, 13, NQ.red);
    r(3, 2, 10, 1, NQ.vermilion);
    r(4, 4, 5, 6, NQ.sky);
    r(4, 4, 5, 1, NQ.ice);
    for (const y of [4, 6, 8]) r(10, y, 2, 1, NQ.cream);
    r(4, 11, 8, 2, NQ.slate);
    r(3, 15, 10, 1, NQ.night);
  });
  // 174 ポスト（すけ）
  tile(174, (r) => {
    r(4, 3, 8, 11, NQ.vermilion);
    r(4, 3, 8, 1, NQ.apricot);
    r(4, 2, 8, 1, NQ.brick);
    r(5, 6, 6, 2, NQ.ink);
    r(5, 10, 6, 1, NQ.brick);
    r(5, 14, 6, 2, NQ.slate);
  });
  // 175 地下鉄の 入口（すけ。下りる 階段）
  tile(175, (r) => {
    r(2, 6, 12, 10, NQ.gray);
    for (const y of [8, 11, 14]) r(3, y, 10, 1, NQ.slate);
    r(2, 6, 12, 1, NQ.silver);
    r(1, 4, 2, 6, NQ.silver);
    r(13, 4, 2, 6, NQ.silver);
    r(3, 0, 10, 4, NQ.blue);
    r(3, 0, 10, 1, NQ.azure);
    r(5, 1, 6, 2, NQ.white);
  });
  // 176〜178 電光の 看板（赤・青・緑。すけ）
  (
    [
      [176, NQ.red, NQ.gold, NQ.brick],
      [177, NQ.azure, NQ.white, NQ.blue],
      [178, NQ.leaf, NQ.cream, NQ.green],
    ] as const
  ).forEach(([n, base, light, dark]) => {
    tile(n, (r) => {
      r(7, 12, 2, 4, NQ.gray);
      r(5, 15, 6, 1, NQ.slate);
      r(2, 0, 12, 12, dark);
      r(3, 1, 10, 10, base);
      r(4, 2, 8, 2, light);
      r(4, 5, 6, 2, light);
      r(4, 8, 8, 2, light);
    });
  });
  // 179 商店の テント（やたい。すけ）
  tile(179, (r) => {
    r(1, 1, 14, 5, NQ.red);
    for (let x = 1; x < 15; x += 4) r(x, 1, 2, 5, NQ.paper);
    r(1, 6, 14, 1, NQ.brick);
    r(2, 7, 12, 6, NQ.tan);
    r(2, 7, 12, 1, NQ.beige);
    r(4, 9, 3, 3, NQ.ochre);
    r(9, 9, 3, 3, NQ.leaf);
    r(1, 13, 14, 1, NQ.brown);
  });
  // 180 植えこみ（低い みどり。すけ）
  tile(180, (r) => {
    r(1, 5, 14, 9, NQ.gray);
    r(2, 6, 12, 7, NQ.green);
    r(2, 6, 12, 2, NQ.leaf);
    r(4, 7, 3, 1, NQ.lime);
    r(9, 9, 3, 1, NQ.lime);
    r(1, 14, 14, 1, NQ.slate);
  });
  // 181 駐車場（白い 線）
  tile(181, (r) => {
    asphalt(r);
    r(0, 0, 1, 16, NQ.paper);
    r(15, 0, 1, 16, NQ.paper);
    r(0, 0, 16, 1, NQ.cloud);
    r(6, 6, 4, 2, NQ.night);
  });
  // 182 線路（通れない）
  tile(182, (r) => {
    r(0, 0, 16, 16, NQ.slate);
    for (let x = 1; x < 16; x += 5) r(x, 3, 3, 10, NQ.brown);
    r(0, 4, 16, 2, NQ.silver);
    r(0, 10, 16, 2, NQ.silver);
    r(0, 5, 16, 1, NQ.gray);
    r(0, 11, 16, 1, NQ.gray);
  });
  // 183 駅の ホーム
  tile(183, (r) => {
    r(0, 0, 16, 16, NQ.silver);
    r(0, 0, 16, 2, NQ.gray);
    r(0, 2, 16, 2, NQ.gold);
    for (let x = 1; x < 16; x += 4) r(x, 7, 2, 2, NQ.cloud);
    r(0, 14, 16, 2, NQ.cloud);
  });
  // 184〜207 高い ビル（2×3 が 4 しゅるい）
  TOWERS.forEach((c, k) => block(184 + k * 6, 2, 3, (r) => towerArt(r, c)));
  // 208〜213 駅の 建物（3×2 = 48×32）
  block(208, 3, 2, (r) => {
    r(0, 0, 48, 32, NQ.paper);
    r(0, 0, 48, 9, NQ.slate);
    r(0, 0, 48, 2, NQ.gray);
    r(0, 9, 48, 1, NQ.night);
    r(20, 1, 8, 7, NQ.paper);
    r(22, 3, 1, 3, NQ.ink);
    r(22, 5, 3, 1, NQ.ink);
    for (const x of [0, 15, 30, 45]) r(x, 10, 3, 22, NQ.cloud);
    for (const x of [4, 34]) {
      r(x, 12, 10, 7, NQ.sky);
      r(x, 12, 10, 1, NQ.slate);
    }
    r(18, 11, 12, 5, NQ.blue);
    r(20, 12, 8, 3, NQ.white);
    for (const x of [5, 19, 35]) {
      r(x, 21, 9, 11, NQ.night);
      r(x, 21, 9, 1, NQ.slate);
      r(x + 4, 22, 1, 10, NQ.slate);
    }
    r(0, 30, 48, 2, NQ.gray);
  });
  // 214〜215 電車の 先頭（2×1 = 32×16）
  block(214, 2, 1, (r) => {
    r(1, 3, 30, 12, NQ.silver);
    r(1, 3, 30, 2, NQ.cloud);
    r(1, 9, 30, 2, NQ.azure);
    r(4, 5, 10, 4, NQ.sky);
    r(18, 5, 10, 4, NQ.sky);
    r(2, 12, 3, 2, NQ.gold);
    r(27, 12, 3, 2, NQ.gold);
    r(1, 15, 30, 1, NQ.night);
  });
  // 216 ビルの かべ（まどが ならぶ。お店の 上の かい）
  tile(216, (r) => {
    r(0, 0, 16, 16, NQ.gray);
    r(0, 0, 16, 1, NQ.slate);
    for (const x of [2, 9]) {
      for (const y of [3, 10]) {
        r(x, y, 5, 4, NQ.sky);
        r(x, y, 5, 1, NQ.slate);
      }
    }
  });
  // 217 ビルの 屋上（とうやと きゅうすいタンク）
  tile(217, (r) => {
    r(0, 0, 16, 16, NQ.silver);
    r(0, 0, 16, 2, NQ.cloud);
    r(0, 14, 16, 2, NQ.gray);
    r(2, 4, 6, 7, NQ.gray);
    r(3, 5, 4, 2, NQ.slate);
    r(10, 4, 5, 4, NQ.slate);
    r(10, 8, 1, 3, NQ.gray);
    r(14, 8, 1, 3, NQ.gray);
  });
  // 218 1階の ガラスの かべ
  tile(218, (r) => {
    r(0, 0, 16, 16, NQ.slate);
    r(0, 0, 16, 2, NQ.gray);
    r(1, 3, 6, 11, NQ.ice);
    r(9, 3, 6, 11, NQ.ice);
    r(1, 3, 6, 1, NQ.sky);
    r(9, 3, 6, 1, NQ.sky);
    r(0, 14, 16, 2, NQ.gray);
  });
  // 219 ビルの あいだの 小さな 公園（しばふ）
  tile(219, (r) => {
    r(0, 0, 16, 16, NQ.leaf);
    for (const [x, y] of [
      [2, 3],
      [8, 2],
      [12, 7],
      [5, 10],
      [11, 13],
    ] as const) {
      r(x, y, 1, 2, NQ.lime);
      r(x + 1, y + 1, 1, 1, NQ.lime);
    }
    r(6, 6, 2, 2, NQ.sprout);
  });
  // 220 歩道橋（すけ）
  tile(220, (r) => {
    r(0, 2, 16, 1, NQ.cloud);
    r(0, 3, 16, 3, NQ.silver);
    r(0, 6, 16, 1, NQ.gray);
    r(1, 7, 2, 9, NQ.gray);
    r(13, 7, 2, 9, NQ.gray);
    for (const [x, y] of [
      [4, 8],
      [5, 10],
      [6, 12],
      [7, 14],
    ] as const)
      r(x, y, 6, 1, NQ.silver);
  });
}
