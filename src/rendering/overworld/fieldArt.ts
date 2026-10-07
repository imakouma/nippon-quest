/**
 * フィールドの仮素材（タイル・看板・宝箱・入口・ワープホール・中ボスのオーラ など）。NQ-48 の色だけで描く。
 * 本番の PNG を同じキーで先に読み込んでおけば、そちらが優先される（addImage / addSheet は既存キーを上書きしない）。
 * 規格は docs/06_ART_BIBLE.md（タイル 16×16、ワープホール 32×32×4 コマ）。
 */
import type Phaser from 'phaser';
import { makeGrid, outline, paint, put, sheetCanvas, toCanvas, type Grid } from '../grid';
import { ICONS, iconCanvas } from '../icons';
import { NQ } from '../palette';
import { addImage, addSheet } from '../sheet';
import { drawDungeonTiles } from './dungeonTiles';
import { drawTownTiles } from './townTiles';

export const WARP_SIZE = 32;
export const WARP_FRAMES = 4;

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;

/** タイルセットの列の数（scripts/scaffold-maps.ts の TILESET.columns と同じ） */
const TILE_COLS = 8;

/**
 * 仮タイルセット（128×640 = 16×16 タイル×320。8 列×40 行）。番号は scripts/scaffold-maps.ts の TILE・T と対応。
 * 13〜37 は町、38〜60 はダンジョン（4 つのテーマ）、61〜146 は 県ごとの 町の テーマ（townTiles.ts）、
 * 147〜156 は フィールドの たんぼ など。161〜220 は 都会の 町、221〜300 は ダンジョンの テーマ（あき）。
 * 「すけ」と書いたタイルは地面の上に重ねる（decor レイヤー）
 */
function tilesetCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = TILE_COLS * 16;
  c.height = 640;
  const ctx = c.getContext('2d')!;
  const tile = (n: number, draw: (r: Rect) => void) => {
    const ox = ((n - 1) % TILE_COLS) * 16;
    const oy = Math.floor((n - 1) / TILE_COLS) * 16;
    draw((x, y, w, h, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(ox + x, oy + y, w, h);
    });
  };
  /** w×h まいの 大きな絵を 1 まいに描いてから、first から 行ごとの 番号に 切り分ける */
  const block = (first: number, w: number, h: number, draw: (r: Rect) => void) => {
    const off = document.createElement('canvas');
    off.width = w * 16;
    off.height = h * 16;
    const o = off.getContext('2d')!;
    draw((x, y, ww, hh, col) => {
      o.fillStyle = col;
      o.fillRect(x, y, ww, hh);
    });
    for (let k = 0; k < w * h; k++) {
      const n = first + k;
      const [dx, dy] = [((n - 1) % TILE_COLS) * 16, Math.floor((n - 1) / TILE_COLS) * 16];
      ctx.drawImage(off, (k % w) * 16, Math.floor(k / w) * 16, 16, 16, dx, dy, 16, 16);
    }
  };
  const tufts = (r: Rect, col: string, pts: [number, number][]) => {
    for (const [x, y] of pts) {
      r(x, y, 1, 2, col);
      r(x + 1, y + 1, 1, 1, col);
    }
  };
  /** 山の記号（左が日なた、右がかげ。snow があれば雪） */
  const mountain = (r: Rect, lit: string, shade: string, snow?: string) => {
    for (let y = 4; y <= 13; y++) {
      const hw = Math.round(((y - 4) * 5) / 9);
      r(8 - hw, y, hw * 2 + 1, 1, lit);
      if (y > 5) r(9, y, hw, 1, shade);
    }
    if (snow) {
      r(8, 4, 1, 1, snow);
      r(7, 5, 3, 1, snow);
      r(7, 6, 1, 1, snow);
      r(9, 6, 1, 1, snow);
    }
  };

  // 1 草原
  tile(1, (r) => {
    r(0, 0, 16, 16, NQ.lime);
    tufts(r, NQ.leaf, [
      [2, 3],
      [10, 2],
      [13, 8],
      [5, 10],
      [11, 13],
      [1, 13],
      [7, 6],
    ]);
  });
  // 2 道
  tile(2, (r) => {
    r(0, 0, 16, 16, NQ.sand);
    r(3, 4, 2, 1, NQ.tan);
    r(11, 10, 2, 1, NQ.tan);
    r(6, 13, 1, 1, NQ.tan);
  });
  // 3 水（海・湖・県の外。通れない）
  tile(3, (r) => {
    r(0, 0, 16, 16, NQ.azure);
    r(2, 4, 4, 1, NQ.sky);
    r(10, 8, 4, 1, NQ.sky);
    r(4, 12, 3, 1, NQ.sky);
    r(12, 14, 2, 1, NQ.sky);
  });
  // 4 木（町・ダンジョンの外周）
  tile(4, (r) => {
    r(0, 0, 16, 16, NQ.lime);
    r(3, 1, 10, 10, NQ.green);
    r(2, 2, 12, 8, NQ.green);
    r(4, 2, 4, 3, NQ.leaf);
    r(7, 11, 2, 4, NQ.brown);
  });
  // 5 町の石だたみ
  tile(5, (r) => {
    r(0, 0, 16, 16, NQ.beige);
    r(0, 7, 16, 1, NQ.sand);
    r(0, 15, 16, 1, NQ.sand);
    r(7, 0, 1, 7, NQ.sand);
    r(15, 8, 1, 7, NQ.sand);
  });
  // 6 屋根
  tile(6, (r) => {
    r(0, 0, 16, 16, NQ.red);
    r(0, 4, 16, 1, NQ.brick);
    r(0, 10, 16, 1, NQ.brick);
  });
  // 7 ダンジョンの床
  tile(7, (r) => {
    r(0, 0, 16, 16, NQ.night);
    r(3, 5, 2, 1, NQ.slate);
    r(10, 11, 2, 1, NQ.slate);
  });
  // 8 ダンジョンの壁
  tile(8, (r) => {
    r(0, 0, 16, 16, NQ.indigo);
    r(0, 7, 16, 1, NQ.night);
    r(7, 0, 1, 7, NQ.night);
    r(15, 8, 1, 8, NQ.night);
  });
  // 9 ポータル
  tile(9, (r) => {
    r(0, 0, 16, 16, NQ.violet);
    r(4, 4, 8, 8, NQ.lavender);
  });
  // 10 橋
  tile(10, (r) => {
    r(0, 0, 16, 16, NQ.tan);
    for (const y of [3, 7, 11, 15]) r(0, y, 16, 1, NQ.brown);
  });
  // 11 丘・低い山（通れる）
  tile(11, (r) => {
    r(0, 0, 16, 16, NQ.lime);
    mountain(r, NQ.leaf, NQ.green);
  });
  // 12 高い山（通れる）
  tile(12, (r) => {
    r(0, 0, 16, 16, NQ.sand);
    mountain(r, NQ.tan, NQ.brown, NQ.white);
  });
  // ───── 町（13〜37） ─────
  const flower = (r: Rect, x: number, y: number, col: string) => {
    r(x, y - 1, 1, 1, col);
    r(x - 1, y, 3, 1, col);
    r(x, y + 1, 1, 1, col);
    r(x, y, 1, 1, NQ.gold);
  };
  /** 屋根（base の地に dark の段、いちばん上に light の光） */
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
  /** 家のかべ（しっくいと はしらの木。上は屋根の かげ、下は土台） */
  const wall = (r: Rect) => {
    r(0, 0, 16, 16, NQ.beige);
    r(0, 0, 16, 2, NQ.tan);
    r(0, 0, 1, 16, NQ.brown);
    r(0, 14, 16, 2, NQ.tan);
  };
  // 13 花の咲いた草原
  tile(13, (r) => {
    r(0, 0, 16, 16, NQ.lime);
    tufts(r, NQ.leaf, [
      [2, 3],
      [12, 11],
      [6, 13],
    ]);
    flower(r, 4, 6, NQ.blush);
    flower(r, 11, 4, NQ.cream);
    flower(r, 13, 8, NQ.white);
    flower(r, 8, 10, NQ.blush);
    flower(r, 3, 12, NQ.cream);
  });
  // 14 草原（ちがう草のもよう）
  tile(14, (r) => {
    r(0, 0, 16, 16, NQ.lime);
    tufts(r, NQ.leaf, [
      [4, 2],
      [12, 5],
      [8, 9],
      [2, 11],
      [13, 13],
    ]);
    r(6, 5, 1, 1, NQ.sprout);
    r(10, 12, 1, 1, NQ.sprout);
  });
  // 15 石だたみ（ずらした目地）
  tile(15, (r) => {
    r(0, 0, 16, 16, NQ.beige);
    r(0, 3, 16, 1, NQ.sand);
    r(0, 11, 16, 1, NQ.sand);
    r(4, 0, 1, 3, NQ.sand);
    r(12, 4, 1, 7, NQ.sand);
    r(6, 12, 1, 4, NQ.sand);
    r(8, 7, 2, 1, NQ.tan);
  });
  // 16〜18 屋根（青・緑・茶）。6 が赤
  tile(16, (r) => roof(r, NQ.azure, NQ.blue, NQ.sky));
  tile(17, (r) => roof(r, NQ.leaf, NQ.green, NQ.lime));
  tile(18, (r) => roof(r, NQ.tan, NQ.brown, NQ.sand));
  // 19 家のかべ
  tile(19, (r) => wall(r));
  // 20 まどの ある かべ
  tile(20, (r) => {
    wall(r);
    r(4, 4, 8, 7, NQ.brown);
    r(5, 5, 6, 5, NQ.sky);
    r(7, 5, 1, 5, NQ.brown);
    r(5, 7, 6, 1, NQ.brown);
    r(5, 5, 2, 1, NQ.white);
    r(3, 11, 10, 1, NQ.tan);
  });
  // 21 とびら
  tile(21, (r) => {
    wall(r);
    r(4, 3, 8, 13, NQ.brown);
    r(5, 4, 6, 12, NQ.amber);
    r(8, 4, 1, 12, NQ.brown);
    r(9, 10, 1, 1, NQ.gold);
    r(3, 15, 10, 1, NQ.silver);
  });
  // 22 さく（すけ）
  tile(22, (r) => {
    r(0, 7, 16, 2, NQ.tan);
    r(0, 11, 16, 2, NQ.tan);
    r(0, 9, 16, 1, NQ.brown);
    r(0, 13, 16, 1, NQ.brown);
    r(1, 4, 2, 11, NQ.brown);
    r(13, 4, 2, 11, NQ.brown);
    r(1, 4, 2, 1, NQ.sand);
    r(13, 4, 2, 1, NQ.sand);
  });
  // 23 花だん（すけ）
  tile(23, (r) => {
    r(1, 8, 14, 7, NQ.brown);
    r(1, 8, 14, 1, NQ.tan);
    r(2, 9, 12, 5, NQ.bark);
    r(3, 7, 2, 2, NQ.leaf);
    r(7, 6, 2, 3, NQ.leaf);
    r(11, 7, 2, 2, NQ.leaf);
    flower(r, 4, 5, NQ.red);
    flower(r, 8, 4, NQ.gold);
    flower(r, 12, 5, NQ.blush);
  });
  // 24〜27 ふんすい（2×2 マス。32×32 を 4 まいに分ける。すけ）
  const fountainAt = (x: number, y: number): string | null => {
    const d = Math.hypot(x - 15.5, y - 15.5);
    if (d > 15) return null;
    if (d > 12.5) return x + y < 26 ? NQ.cloud : NQ.silver;
    if (d > 11.5) return NQ.gray;
    if (d < 2.5) return NQ.white;
    if (d < 4) return NQ.sky;
    if (Math.abs(d - 8) < 0.6 && (x + y) % 3 === 0) return NQ.sky;
    return NQ.azure;
  };
  [24, 25, 26, 27].forEach((n, k) =>
    tile(n, (r) => {
      const ox = (k % 2) * 16;
      const oy = Math.floor(k / 2) * 16;
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          const col = fountainAt(ox + x, oy + y);
          if (col) r(x, y, 1, 1, col);
        }
    }),
  );
  // 28 がいとう（すけ）
  tile(28, (r) => {
    r(5, 0, 6, 1, NQ.slate);
    r(5, 1, 6, 5, NQ.ink);
    r(6, 2, 4, 3, NQ.cream);
    r(7, 2, 2, 1, NQ.white);
    r(7, 6, 2, 8, NQ.slate);
    r(5, 14, 6, 2, NQ.slate);
  });
  // 29 ベンチ（すけ）
  tile(29, (r) => {
    r(1, 4, 14, 2, NQ.tan);
    r(2, 6, 1, 2, NQ.brown);
    r(13, 6, 1, 2, NQ.brown);
    r(1, 8, 14, 2, NQ.tan);
    r(1, 9, 14, 1, NQ.brown);
    r(2, 10, 2, 5, NQ.brown);
    r(12, 10, 2, 5, NQ.brown);
  });
  // 30 たる（すけ）
  tile(30, (r) => {
    r(4, 2, 8, 2, NQ.tan);
    r(3, 3, 10, 12, NQ.amber);
    r(3, 3, 2, 12, NQ.brown);
    r(11, 3, 2, 12, NQ.brown);
    r(3, 5, 10, 1, NQ.slate);
    r(3, 12, 10, 1, NQ.slate);
  });
  // 31 くだものの木（すけ）
  tile(31, (r) => {
    r(5, 14, 6, 2, NQ.forest);
    r(7, 10, 2, 5, NQ.brown);
    r(2, 1, 12, 9, NQ.green);
    r(1, 3, 14, 5, NQ.green);
    r(4, 2, 5, 3, NQ.leaf);
    r(4, 6, 2, 2, NQ.red);
    r(10, 4, 2, 2, NQ.red);
    r(7, 8, 2, 2, NQ.red);
    r(12, 7, 1, 1, NQ.red);
    r(4, 6, 1, 1, NQ.apricot);
    r(10, 4, 1, 1, NQ.apricot);
  });
  // 32 木（すけ）
  tile(32, (r) => {
    r(5, 14, 6, 1, NQ.forest);
    r(7, 11, 2, 4, NQ.brown);
    r(3, 1, 10, 10, NQ.green);
    r(2, 2, 12, 8, NQ.green);
    r(4, 2, 4, 3, NQ.leaf);
    r(10, 7, 2, 2, NQ.forest);
  });
  // 33 いけがき
  tile(33, (r) => {
    r(2, 1, 3, 1, NQ.green);
    r(9, 1, 4, 1, NQ.green);
    r(0, 2, 16, 13, NQ.green);
    r(1, 3, 4, 2, NQ.leaf);
    r(8, 5, 4, 2, NQ.leaf);
    r(3, 9, 3, 2, NQ.leaf);
    r(11, 10, 3, 2, NQ.leaf);
    r(0, 13, 16, 2, NQ.forest);
  });
  // 34 けいじばん（すけ）
  tile(34, (r) => {
    r(3, 8, 2, 8, NQ.brown);
    r(11, 8, 2, 8, NQ.brown);
    r(1, 2, 14, 8, NQ.brown);
    r(2, 3, 12, 6, NQ.tan);
    r(3, 4, 4, 4, NQ.paper);
    r(9, 3, 4, 3, NQ.cream);
    r(8, 7, 3, 2, NQ.paper);
    r(5, 4, 1, 1, NQ.red);
    r(10, 3, 1, 1, NQ.azure);
  });
  // 35 やたい（すけ）
  tile(35, (r) => {
    for (let x = 0; x < 16; x += 4) {
      r(x, 1, 2, 5, NQ.red);
      r(x + 2, 1, 2, 5, NQ.white);
    }
    r(0, 6, 16, 1, NQ.brick);
    r(1, 7, 1, 8, NQ.brown);
    r(14, 7, 1, 8, NQ.brown);
    r(3, 8, 2, 2, NQ.red);
    r(7, 8, 2, 2, NQ.orange);
    r(11, 8, 2, 2, NQ.leaf);
    r(0, 10, 16, 4, NQ.tan);
    r(0, 13, 16, 1, NQ.brown);
  });
  // 36 いど（すけ）
  tile(36, (r) => {
    r(2, 0, 12, 3, NQ.brick);
    r(3, 3, 1, 6, NQ.brown);
    r(12, 3, 1, 6, NQ.brown);
    r(8, 3, 1, 6, NQ.tan);
    r(1, 8, 14, 7, NQ.silver);
    r(3, 9, 10, 4, NQ.navy);
    r(1, 13, 14, 2, NQ.gray);
  });
  // 37 木ばこ（すけ）
  tile(37, (r) => {
    r(2, 4, 12, 11, NQ.tan);
    r(2, 4, 12, 1, NQ.sand);
    r(2, 14, 12, 1, NQ.brown);
    r(2, 9, 12, 1, NQ.brown);
    r(7, 4, 2, 11, NQ.brown);
  });

  // ───── ダンジョン（38〜60）。テーマごとに 床・床2・かべ（上から見た岩）・かべの前の面 ─────
  /** かべの前の面：ブロックの すじ と 光、上は天井の かげ、下は床との さかい */
  const face = (r: Rect, base: string, line: string, light: string, edge: string) => {
    r(0, 0, 16, 16, base);
    r(0, 5, 16, 1, line);
    r(0, 11, 16, 1, line);
    r(6, 0, 1, 5, line);
    r(12, 6, 1, 5, line);
    r(3, 12, 1, 4, line);
    r(1, 2, 3, 1, light);
    r(8, 8, 2, 1, light);
    r(0, 0, 16, 1, edge);
    r(0, 15, 16, 1, edge);
  };
  /** 上から見た かべ（岩のかたまり）：暗い地に 小さな つぶ */
  const rock = (r: Rect, base: string, speck: string) => {
    r(0, 0, 16, 16, base);
    for (const [x, y] of [
      [4, 5],
      [11, 2],
      [9, 11],
      [2, 13],
      [13, 8],
    ] as const)
      r(x, y, 1, 1, speck);
  };
  // 38〜41 どうくつ
  tile(38, (r) => {
    r(0, 0, 16, 16, NQ.slate);
    r(3, 4, 2, 1, NQ.gray);
    r(11, 9, 2, 1, NQ.gray);
    r(6, 13, 1, 1, NQ.gray);
    r(9, 2, 1, 2, NQ.night);
    r(2, 10, 2, 1, NQ.night);
  });
  tile(39, (r) => {
    r(0, 0, 16, 16, NQ.slate);
    r(5, 6, 3, 2, NQ.gray);
    r(6, 6, 1, 1, NQ.silver);
    r(12, 12, 2, 1, NQ.gray);
    r(1, 3, 3, 1, NQ.night);
    r(10, 4, 1, 3, NQ.night);
  });
  tile(40, (r) => rock(r, NQ.night, NQ.slate));
  tile(41, (r) => face(r, NQ.gray, NQ.slate, NQ.silver, NQ.night));
  // 42〜45 こおりの どうくつ
  tile(42, (r) => {
    r(0, 0, 16, 16, NQ.ice);
    r(2, 5, 4, 1, NQ.sky);
    r(5, 6, 1, 2, NQ.sky);
    r(10, 11, 3, 1, NQ.sky);
    r(12, 3, 1, 1, NQ.white);
  });
  tile(43, (r) => {
    r(0, 0, 16, 16, NQ.ice);
    r(3, 3, 1, 1, NQ.white);
    r(8, 9, 4, 1, NQ.sky);
    r(13, 12, 1, 1, NQ.white);
    r(1, 12, 3, 1, NQ.sky);
  });
  tile(44, (r) => rock(r, NQ.blue, NQ.azure));
  tile(45, (r) => face(r, NQ.sky, NQ.azure, NQ.white, NQ.blue));
  // 46〜49 水の どうくつ（海や湖の そば）
  tile(46, (r) => {
    r(0, 0, 16, 16, NQ.denim);
    r(3, 4, 2, 1, NQ.teal);
    r(10, 10, 3, 1, NQ.teal);
    r(12, 4, 1, 1, NQ.aqua);
    r(5, 12, 1, 1, NQ.aqua);
  });
  tile(47, (r) => {
    r(0, 0, 16, 16, NQ.denim);
    r(4, 6, 6, 3, NQ.blue);
    r(5, 6, 2, 1, NQ.azure);
    r(12, 12, 2, 1, NQ.teal);
  });
  tile(48, (r) => rock(r, NQ.navy, NQ.denim));
  tile(49, (r) => face(r, NQ.blue, NQ.navy, NQ.aqua, NQ.navy));
  // 50〜53 お寺・お城の中（木の床・たたみ・木のかべ・しょうじ）
  tile(50, (r) => {
    r(0, 0, 16, 16, NQ.tan);
    for (const y of [3, 7, 11, 15]) r(0, y, 16, 1, NQ.brown);
    r(5, 0, 1, 3, NQ.brown);
    r(11, 4, 1, 3, NQ.brown);
    r(3, 8, 1, 3, NQ.brown);
    r(13, 12, 1, 3, NQ.brown);
    r(8, 1, 2, 1, NQ.sand);
  });
  tile(51, (r) => {
    r(0, 0, 16, 16, NQ.sand);
    for (const y of [4, 8, 12]) r(0, y, 16, 1, NQ.tan);
    r(0, 0, 16, 1, NQ.forest);
    r(0, 15, 16, 1, NQ.forest);
  });
  // かべは すじを入れない（すじが つながると 床の板に 見えて、通れる所と まぎらわしい）
  tile(52, (r) => rock(r, NQ.ink, NQ.bark));
  tile(53, (r) => {
    r(0, 0, 16, 16, NQ.paper);
    r(0, 5, 16, 1, NQ.tan);
    r(0, 10, 16, 1, NQ.tan);
    r(4, 0, 1, 16, NQ.tan);
    r(11, 0, 1, 16, NQ.tan);
    r(0, 0, 1, 16, NQ.brown);
    r(0, 0, 16, 2, NQ.bark);
    r(0, 15, 16, 1, NQ.brown);
  });
  // 54 たいまつ（かべの前の面に重ねる。すけ）
  tile(54, (r) => {
    r(7, 8, 2, 6, NQ.brown);
    r(6, 13, 4, 1, NQ.slate);
    r(6, 3, 4, 5, NQ.orange);
    r(7, 2, 2, 2, NQ.gold);
    r(7, 5, 2, 2, NQ.yellow);
    r(7, 1, 1, 1, NQ.red);
  });
  // 55 クリスタル（すけ）
  tile(55, (r) => {
    r(7, 3, 2, 11, NQ.violet);
    r(8, 3, 1, 9, NQ.lavender);
    r(4, 7, 2, 7, NQ.violet);
    r(5, 7, 1, 5, NQ.lavender);
    r(10, 6, 2, 8, NQ.violet);
    r(11, 6, 1, 6, NQ.lavender);
    r(7, 2, 1, 1, NQ.white);
    r(8, 4, 1, 2, NQ.white);
    r(3, 14, 10, 1, NQ.indigo);
  });
  // 56 いわ（すけ）
  tile(56, (r) => {
    r(3, 5, 10, 9, NQ.gray);
    r(2, 7, 12, 6, NQ.gray);
    r(4, 6, 4, 2, NQ.silver);
    r(9, 10, 4, 3, NQ.slate);
    r(3, 13, 10, 1, NQ.slate);
  });
  // 57 せきじゅん（岩の はしら。すけ）
  tile(57, (r) => {
    for (let y = 2; y <= 14; y++) {
      const hw = Math.round((y - 2) / 3);
      r(8 - hw, y, hw * 2 + 1, 1, NQ.gray);
    }
    r(7, 5, 1, 6, NQ.silver);
    r(4, 14, 8, 1, NQ.slate);
  });
  // 58 みずたまり（通れない）
  tile(58, (r) => {
    r(0, 0, 16, 16, NQ.navy);
    r(1, 1, 14, 14, NQ.blue);
    r(4, 5, 4, 1, NQ.azure);
    r(9, 10, 4, 1, NQ.azure);
    r(11, 4, 1, 1, NQ.sky);
  });
  // 59 さいだん（いちばん おくの へや。すけ）
  tile(59, (r) => {
    r(6, 2, 4, 4, NQ.gold);
    r(7, 1, 2, 1, NQ.cream);
    r(7, 3, 2, 2, NQ.ochre);
    r(1, 7, 14, 2, NQ.cloud);
    r(1, 8, 14, 6, NQ.silver);
    r(1, 14, 14, 1, NQ.gray);
    r(3, 10, 10, 1, NQ.gray);
  });
  // 60 あかい じゅうたん
  tile(60, (r) => {
    r(0, 0, 16, 16, NQ.red);
    r(0, 0, 2, 16, NQ.gold);
    r(14, 0, 2, 16, NQ.gold);
    r(6, 6, 4, 4, NQ.brick);
  });
  // 61〜146 は 県ごとの 町の テーマ（townTiles.ts）
  drawTownTiles({ tile, block });
  // 221〜269 は ダンジョンの テーマ（dungeonTiles.ts）
  drawDungeonTiles({ tile, block });

  // ───── フィールドの 地面の 性質（147〜158。src/core/world/ground.ts。159・160 は空き） ─────
  /** 丸い 木（w×w の かんむり。左上が 日なた、右下が かげ。下に みき） */
  const tree = (r: Rect, x: number, y: number, w: number, fruit?: string) => {
    r(x + 1, y, w - 2, w, NQ.leaf);
    r(x, y + 1, w, w - 2, NQ.leaf);
    r(x + 1, y + 1, 2, 1, NQ.lime);
    r(x + 1, y + 2, 1, 1, NQ.lime);
    r(x + w - 1, y + 2, 1, w - 3, NQ.forest);
    r(x + 2, y + w - 1, w - 3, 1, NQ.forest);
    r(x + (w >> 1) - 1, y + w, 2, 2, NQ.bark);
    if (fruit)
      for (const [fx, fy] of [
        [1, 3],
        [3, 2],
        [w - 2, 1],
        [2, w - 2],
        [w - 3, w - 3],
      ] as const)
        r(x + fx, y + fy, 1, 1, fruit);
  };
  /** とがった 木（杉・ヒバ）。2 だんの かんむり */
  const conifer = (r: Rect, cx: number, top: number) => {
    [0, 1, 1, 2, 1, 2, 3, 3, 4].forEach((hw, k) => {
      r(cx - hw, top + k, hw * 2 + 1, 1, NQ.forest);
      r(cx - hw, top + k, 1, 1, NQ.leaf);
    });
    r(cx, top + 9, 1, 2, NQ.bark);
  };
  /** 大きな 岩（左上が 光、右下が かげ） */
  const boulder = (r: Rect, x: number, y: number, w: number, h: number) => {
    r(x, y, w, h, NQ.gray);
    r(x, y, w - 1, 1, NQ.silver);
    r(x, y, 1, h - 1, NQ.silver);
    r(x + 1, y + h - 1, w - 1, 1, NQ.slate);
    r(x + w - 1, y + 1, 1, h - 1, NQ.slate);
  };
  /** あし・ガマ（くきと 茶色の 穂） */
  const reed = (r: Rect, x: number, y: number) => {
    r(x, y + 2, 1, 5, NQ.green);
    r(x, y, 1, 2, NQ.brown);
    r(x + 1, y + 4, 1, 1, NQ.green);
  };
  /** たんぼ（北と 西の はしが あぜ道。なえの 列と、水の 光） */
  const paddy = (r: Rect, ground: string, crop: string, glint: string) => {
    r(0, 0, 16, 16, ground);
    for (let y = 3; y < 15; y += 4) for (let x = 2; x < 16; x += 3) r(x, y, 1, 2, crop);
    for (const [x, y] of [
      [3, 5],
      [9, 9],
      [6, 13],
    ] as const)
      r(x, y, 2, 1, glint);
    r(0, 0, 16, 1, NQ.tan);
    r(0, 0, 1, 16, NQ.tan);
  };
  // 147 すなはま
  tile(147, (r) => {
    r(0, 0, 16, 16, NQ.sand);
    for (const [x, y] of [
      [2, 3],
      [9, 2],
      [13, 7],
      [5, 9],
      [11, 12],
      [3, 14],
      [7, 5],
    ] as const)
      r(x, y, 1, 1, NQ.tan);
    // 貝がら
    r(10, 5, 2, 1, NQ.paper);
    r(10, 6, 2, 1, NQ.beige);
    r(4, 11, 2, 1, NQ.paper);
    r(4, 12, 2, 1, NQ.beige);
  });
  // 148 すなはま（風の もようと ヒトデ）
  tile(148, (r) => {
    r(0, 0, 16, 16, NQ.sand);
    for (const [x, y] of [
      [1, 3],
      [7, 7],
      [2, 12],
    ] as const) {
      r(x, y, 4, 1, NQ.beige);
      r(x + 4, y - 1, 2, 1, NQ.beige);
    }
    r(12, 10, 1, 4, NQ.apricot);
    r(10, 11, 5, 1, NQ.apricot);
    r(12, 11, 1, 1, NQ.orange);
    r(13, 3, 1, 1, NQ.tan);
    r(6, 14, 1, 1, NQ.tan);
  });
  // 149 もり（まるい 木）
  tile(149, (r) => {
    r(0, 0, 16, 16, NQ.green);
    tufts(r, NQ.forest, [
      [12, 1],
      [1, 12],
    ]);
    tree(r, 0, 0, 8);
    tree(r, 8, 5, 8);
  });
  // 150 もり（とがった 木）
  tile(150, (r) => {
    r(0, 0, 16, 16, NQ.green);
    tufts(r, NQ.leaf, [
      [12, 1],
      [1, 12],
    ]);
    conifer(r, 4, 0);
    conifer(r, 11, 5);
  });
  // 151 やま（岩の 山）
  tile(151, (r) => {
    r(0, 0, 16, 16, NQ.tan);
    r(1, 14, 3, 1, NQ.brown);
    r(12, 2, 2, 1, NQ.brown);
    mountain(r, NQ.silver, NQ.gray);
    r(8, 4, 1, 2, NQ.white);
  });
  // 152 やま（ごろごろ 岩と 高山の 花）
  tile(152, (r) => {
    r(0, 0, 16, 16, NQ.tan);
    boulder(r, 2, 2, 5, 4);
    boulder(r, 9, 9, 6, 5);
    boulder(r, 3, 11, 3, 3);
    tufts(r, NQ.leaf, [
      [10, 3],
      [1, 7],
    ]);
    r(12, 5, 1, 1, NQ.blush);
    r(7, 8, 1, 1, NQ.blush);
  });
  // 153 みずべ（水たまりと ガマ）
  tile(153, (r) => {
    r(0, 0, 16, 16, NQ.lime);
    r(2, 9, 7, 3, NQ.azure);
    r(3, 8, 5, 1, NQ.azure);
    r(3, 12, 5, 1, NQ.azure);
    r(4, 9, 2, 1, NQ.sky);
    reed(r, 2, 1);
    reed(r, 10, 2);
    reed(r, 12, 5);
    tufts(r, NQ.leaf, [
      [6, 3],
      [11, 12],
    ]);
  });
  // 154 みずべ（しめった 草地と あし）
  tile(154, (r) => {
    r(0, 0, 16, 16, NQ.lime);
    r(8, 2, 6, 3, NQ.aqua);
    r(9, 1, 4, 1, NQ.aqua);
    r(9, 5, 4, 1, NQ.aqua);
    r(10, 2, 2, 1, NQ.mint);
    reed(r, 2, 6);
    reed(r, 4, 8);
    reed(r, 6, 5);
    tufts(r, NQ.leaf, [
      [11, 10],
      [13, 13],
    ]);
  });
  // 155 たんぼ（みどりの なえ）・156 たんぼ（こがね色の いね）
  tile(155, (r) => paddy(r, NQ.lime, NQ.green, NQ.mint));
  tile(156, (r) => paddy(r, NQ.yellow, NQ.ochre, NQ.cream));
  // 157 果樹園（りんご・さくらんぼ）・158 果樹園（もも）
  for (const [n, fruit] of [
    [157, NQ.red],
    [158, NQ.blush],
  ] as const)
    tile(n, (r) => {
      r(0, 0, 16, 16, NQ.lime);
      tufts(r, NQ.leaf, [
        [11, 2],
        [2, 12],
      ]);
      tree(r, 1, 1, 6, fruit);
      tree(r, 9, 7, 6, fruit);
    });
  // 163 道（土の 道）
  tile(163, (r) => {
    r(0, 0, 16, 16, NQ.lime);
    r(4, 0, 8, 16, NQ.sand);
  });
  // 159 名所エリアの さかいの 山なみ（通れない。くらい 岩山に 雪）
  tile(159, (r) => {
    r(0, 0, 16, 16, NQ.slate);
    mountain(r, NQ.gray, NQ.night, NQ.white);
  });
  // 160 さくらの 木（弘前城エリアの 草原）
  tile(160, (r) => {
    r(0, 0, 16, 16, NQ.lime);
    tree(r, 4, 3, 8, NQ.white);
  });
  // 161 恐山の はいいろの 砂地・162 ゆけむりの 出る あな
  tile(161, (r) => {
    r(0, 0, 16, 16, NQ.silver);
    tufts(r, NQ.gray, [
      [3, 4],
      [11, 10],
    ]);
    r(8, 6, 1, 1, NQ.yellow);
  });
  tile(162, (r) => {
    r(0, 0, 16, 16, NQ.silver);
    r(5, 10, 6, 3, NQ.gray);
    r(6, 11, 4, 1, NQ.yellow);
    r(7, 3, 2, 6, NQ.white);
  });
  return c;
}

const gridCanvas = (rows: readonly string[], colors: Record<string, string>): HTMLCanvasElement => {
  const g = makeGrid(rows[0]!.length, rows.length);
  paint(g, rows, { o: NQ.ink, ...colors });
  return toCanvas(g);
};

/** 名所の ★ 看板（16×16）。Y の ★ は、見つける前は灰色・見つけてチャレンジがまだなら白・ぜんぶ終わったら金色 */
const SIGN = [
  '................',
  '..oooooooooooo..',
  '.oBBBBBBBBBBBBo.',
  '.oBBBBBYYBBBBBo.',
  '.oBBBBYYYYBBBBo.',
  '.oBBYYYYYYYYBBo.',
  '.oBBBYYYYYYBBBo.',
  '.oBBBBYYYYBBBBo.',
  '.oBBBYYBBYYBBBo.',
  '.oBBBBBBBBBBBBo.',
  '..oooooooooooo..',
  '......oTTo......',
  '......oTTo......',
  '......oTTo......',
  '.....oooooo.....',
  '................',
];

const CHEST = [
  '................',
  '................',
  '..oooooooooooo..',
  '.oAAAAAAAAAAAAo.',
  '.oAGGGGGGGGGGAo.',
  '.oAAAAAAAAAAAAo.',
  '.ooooooYYoooooo.',
  '.oAAAAAYYAAAAAo.',
  '.oAAAAAAAAAAAAo.',
  '.oAAAAAAAAAAAAo.',
  '.oAAAAAAAAAAAAo.',
  '.oooooooooooooo.',
  '................',
  '................',
  '................',
  '................',
];

const CHEST_OPEN = [
  '................',
  '..oooooooooooo..',
  '.oAAAAAAAAAAAAo.',
  '.oGGGGGGGGGGGGo.',
  '.oooooooooooooo.',
  '.oKKKKKKKKKKKKo.',
  '.oKKKKKKKKKKKKo.',
  '.oAAAAAAAAAAAAo.',
  '.oAAAAAAAAAAAAo.',
  '.oAAAAAAAAAAAAo.',
  '.oAAAAAAAAAAAAo.',
  '.oooooooooooooo.',
  '................',
  '................',
  '................',
  '................',
];

/** 町・ダンジョン・となりの県への入口（矢印つきの魔法陣） */
const GATE = [
  '................',
  '.......oo.......',
  '......oWWo......',
  '.....oWWWWo.....',
  '....oWWWWWWo....',
  '.......WW.......',
  '.......WW.......',
  '.......WW.......',
  '...oooooooooo...',
  '..oVVVVVVVVVVo..',
  '.oVLLLLLLLLLLVo.',
  '.oVLLWWWWWWLLVo.',
  '.oVLLLLLLLLLLVo.',
  '..oVVVVVVVVVVo..',
  '...oooooooooo...',
  '................',
];

/** 中ボスの頭の上の「！」（赤）。名所の看板の上では、チャレンジがまだのしるし（だいだい） */
const ALERT = [
  '.oooooooo.',
  'oWWWWWWWWo',
  'oWWWRRWWWo',
  'oWWWRRWWWo',
  'oWWWRRWWWo',
  'oWWWWWWWWo',
  'oWWWRRWWWo',
  'oWWWWWWWWo',
  '.oooooooo.',
  '....oWo...',
  '.....o....',
];

/** フィールドの中ボス：だれがいるかは戦うまでのお楽しみの「？」（1 マス 16×16）。ぶつかると「たたかう？」 */
const BOSS_Q = [
  '................',
  '.....oooooo.....',
  '...ooVVVVVVoo...',
  '..oVVVWWWWVVVo..',
  '.oVVVWWVVWWVVVo.',
  '.oVVVVVVVWWVVVo.',
  '.oVVVVVVWWVVVVo.',
  '.oVVVVVWWVVVVVo.',
  '.oVVVVVWWVVVVVo.',
  '.oVVVVVVVVVVVVo.',
  '.oVVVVVWWVVVVVo.',
  '..oVVVVWWVVVVo..',
  '...ooVVVVVVoo...',
  '.....oooooo.....',
  '................',
  '................',
];

const SHADOW = ['..oooooooo..', 'oooooooooooo', 'oooooooooooo', '..oooooooo..'];

/** 町の お店の 看板（くさりで つるした 木の板。まん中に お店の アイコン 8×8 を のせる） */
const PLATE = [
  '..o......o..',
  '..o......o..',
  'oooooooooooo',
  'oBBBBBBBBBBo',
  'oBBBBBBBBBBo',
  'oBBBBBBBBBBo',
  'oBBBBBBBBBBo',
  'oBBBBBBBBBBo',
  'oBBBBBBBBBBo',
  'oBBBBBBBBBBo',
  'oBBBBBBBBBBo',
  'oooooooooooo',
];

const mod = (a: number, m: number) => ((a % m) + m) % m;

/** ワープホール：3 本の腕がうずを巻く（4 コマ） */
function warpSheet(): HTMLCanvasElement {
  const frames: Grid[] = [];
  const arm = (Math.PI * 2) / 3;
  for (let f = 0; f < WARP_FRAMES; f++) {
    const g = makeGrid(WARP_SIZE, WARP_SIZE);
    for (let y = 0; y < WARP_SIZE; y++)
      for (let x = 0; x < WARP_SIZE; x++) {
        const dx = x - 15.5;
        const dy = y - 15.5;
        const r = Math.hypot(dx, dy);
        if (r > 14.5) continue;
        const a = mod(Math.atan2(dy, dx) + r * 0.32 + (f * Math.PI) / 2, arm);
        let col: string;
        if (r < 3) col = NQ.white;
        else if (a < 0.6) col = r < 8 ? NQ.lavender : NQ.violet;
        else col = r < 6 ? NQ.violet : r < 11 ? NQ.indigo : NQ.night;
        put(g, x, y, col);
      }
    outline(g, NQ.ink);
    frames.push(g);
  }
  return sheetCanvas(frames, WARP_FRAMES);
}

/** 中ボスの「？」の足もとの光る輪（オーラ）。二重の輪 */
function auraCanvas(): HTMLCanvasElement {
  const g = makeGrid(40, 14);
  for (let k = 0; k < 96; k++) {
    const a = (k / 96) * Math.PI * 2;
    const at = (rx: number, ry: number) =>
      [Math.round(19.5 + Math.cos(a) * rx), Math.round(6.5 + Math.sin(a) * ry)] as const;
    put(g, ...at(18, 5.5), k % 6 < 3 ? NQ.lavender : NQ.violet);
    put(g, ...at(16, 4.5), NQ.indigo);
  }
  return toCanvas(g);
}

/** 中ボスの「？」のまわりの光のわっか（オーラ）。太い三重の輪で、点滅させる */
function haloCanvas(): HTMLCanvasElement {
  const S = 36;
  const g = makeGrid(S, S);
  const c = (S - 1) / 2;
  for (let k = 0; k < 160; k++) {
    const a = (k / 160) * Math.PI * 2;
    const at = (r: number) => [Math.round(c + Math.cos(a) * r), Math.round(c + Math.sin(a) * r)] as const;
    put(g, ...at(17), k % 10 < 5 ? NQ.white : NQ.lavender);
    put(g, ...at(16), NQ.violet);
    if (k % 3 === 0) put(g, ...at(14), NQ.lavender);
  }
  return toCanvas(g);
}

/** 中ボスの「？」の後ろの紫のもや（半透明で点滅させて、光って見せる） */
function glowCanvas(): HTMLCanvasElement {
  const S = 32;
  const g = makeGrid(S, S);
  const c = (S - 1) / 2;
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) if ((x - c) ** 2 + (y - c) ** 2 <= 15 ** 2) put(g, x, y, NQ.violet);
  return toCanvas(g);
}

/** 中ボスのまわりに立ちのぼる光のつぶ */
const SPARK = ['.W.', 'WLW', '.W.'];

/** 主人公のそばを飛ぶ妖精ミチル（16×16）。枠を持たず、フィールド上の同行者として描く。 */
const MICHIRU = [
  '......Y.........',
  '.....YYY........',
  '..C..VVV..C.....',
  '.CCC.VVV.CCC....',
  '..CCVVVVVCC.....',
  '...VSSSSSV......',
  '...VSNSNSV......',
  '..CVSSSSSVC.....',
  '.CCC.VVV.CCC....',
  '..C..VVV..C.....',
  '.....VVV........',
  '....V.V.V.......',
  '...V...V.V......',
  '................',
  '................',
  '................',
];

/** UI のイベントシーンでもフィールドと同じミチルを使う。 */
export function michiruCanvas(): HTMLCanvasElement {
  return gridCanvas(MICHIRU, { Y: NQ.gold, C: NQ.sky, V: NQ.violet, S: NQ.skinLight, N: NQ.night });
}

/** フィールドで使うテクスチャをまとめて用意する（何度呼んでもよい） */
export function buildFieldTextures(scene: Phaser.Scene): void {
  const tx = scene.textures;
  addImage(tx, 'overworld-tiles', tilesetCanvas());
  for (const name of Object.keys(ICONS)) {
    const c = iconCanvas(name);
    if (c) addImage(tx, `ico.${name}`, c);
  }
  addImage(tx, 'fld.sign', gridCanvas(SIGN, { B: NQ.brown, Y: NQ.silver, T: NQ.tan }));
  addImage(tx, 'fld.sign.todo', gridCanvas(SIGN, { B: NQ.brown, Y: NQ.white, T: NQ.tan }));
  addImage(tx, 'fld.sign.done', gridCanvas(SIGN, { B: NQ.brown, Y: NQ.gold, T: NQ.tan }));
  addImage(tx, 'fld.sign.mark', gridCanvas(ALERT, { W: NQ.white, R: NQ.orange }));
  addImage(tx, 'fld.chest', gridCanvas(CHEST, { A: NQ.amber, G: NQ.orange, Y: NQ.gold }));
  addImage(tx, 'fld.chest.open', gridCanvas(CHEST_OPEN, { A: NQ.amber, G: NQ.orange, K: NQ.night }));
  addImage(tx, 'fld.gate', gridCanvas(GATE, { V: NQ.violet, L: NQ.lavender, W: NQ.white }));
  addSheet(tx, 'fld.warp', warpSheet(), WARP_SIZE, WARP_SIZE);
  addImage(tx, 'fld.boss.aura', auraCanvas());
  addImage(tx, 'fld.boss.halo', haloCanvas());
  addImage(tx, 'fld.boss.glow', glowCanvas());
  addImage(tx, 'fld.boss.spark', gridCanvas(SPARK, { W: NQ.white, L: NQ.lavender }));
  addImage(tx, 'fld.alert', gridCanvas(ALERT, { W: NQ.white, R: NQ.red }));
  addImage(tx, 'fld.michiru', michiruCanvas());
  addImage(tx, 'fld.boss.q', gridCanvas(BOSS_Q, { V: NQ.violet, W: NQ.white }));
  addImage(tx, 'fld.shadow', gridCanvas(SHADOW, {}));
  addImage(tx, 'fld.plate', gridCanvas(PLATE, { B: NQ.sand }));
}
