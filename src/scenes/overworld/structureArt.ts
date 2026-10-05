/**
 * 名所エリアの 建物（フィールドの 物体 'structure'）の ドット絵。NQ-48 だけ・外周に ink の 輪郭。
 * 絵は 足もと（下の はし）を 建物の マスの 下に あわせ、上は マスより 高く のびても よい（やぐら・高床倉庫）。
 *  - tateana  竪穴住居（2×2）：かやぶきの まるい 屋根、けむり出しの あな、入口
 *  - takayuka 高床倉庫（2×2、絵は 32×40）：かやぶきの 切妻屋根、板の かべ、ねずみがえし、はしら 4 本と はしご
 *  - yagura   大型掘立柱建物（3×3、絵は 48×64）：三内丸山の 六本柱。太い はしらと 3 だんの ゆか、はしご
 *  - longhouse 大型竪穴住居（4×2）：ながい かやぶき屋根に 入口 2 つ
 *  - kuri     クリの木（1×1、絵は 16×24）：三内丸山の 人が そだてた クリ。いがの 実
 *  - dogu     大きな 板状土偶の 像（2×2、絵は 32×40）：十字の 形、まるい 目と 口、なわの もよう
 *  - stones   環状配石（3×3）：石を わに ならべた 所
 *  - doki     円筒土器（1×1、絵は 16×20）：つつの 形、口の ふちの もりあがりと なわめの もよう
 */
import type Phaser from 'phaser';
import { makeGrid, outline, put, toCanvas, type Grid } from '../art/grid';
import { NQ } from '../art/palette';
import { addImage } from '../art/sheet';
import { LANDMARK_DRAW } from './landmarkArt';

/** 三内丸山の 物と、ほかの 名所エリアの 物（landmarkArt.ts）。scripts/data/geo.ts の StructureKind と おなじ */
export type StructureKind =
  | 'yagura'
  | 'tateana'
  | 'takayuka'
  | 'longhouse'
  | 'kuri'
  | 'dogu'
  | 'stones'
  | 'doki'
  | 'nebutaFloat'
  | 'taiko'
  | 'chochin'
  | 'toudai'
  | 'windmill'
  | 'hi'
  | 'tenshu'
  | 'sakura'
  | 'ringo'
  | 'bigBuna'
  | 'buna'
  | 'taki'
  | 'otome'
  | 'torii'
  | 'boat'
  | 'bigTaki'
  | 'kokeiwa'
  | 'dashi'
  | 'yatai'
  | 'fune'
  | 'sanmon'
  | 'jizo'
  | 'kazaguruma'
  | 'tsumi'
  | 'maguroZo'
  | 'saihokutan';

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;

function canvas(w: number, h: number, draw: (r: Rect, g: Grid) => void): HTMLCanvasElement {
  const g = makeGrid(w, h);
  const r: Rect = (x, y, rw, rh, col) => {
    for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) put(g, xx, yy, col);
  };
  draw(r, g);
  outline(g, NQ.ink);
  return toCanvas(g);
}

/** かやぶきの ドーム（まん中 cx、上 top〜下 bottom、下の はば half）。わらの すじと かげ */
function thatchDome(g: Grid, cx: number, top: number, bottom: number, half: number): void {
  for (let y = top; y <= bottom; y++) {
    const t = (y - top) / (bottom - top);
    const hw = Math.max(1.5, half * Math.sqrt(t));
    for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) {
      const shade = x > cx + hw * 0.35;
      const stripe = (y - top) % 4 === 0;
      put(g, x, y, stripe ? NQ.tan : shade ? NQ.tan : NQ.sand);
      if (stripe && shade) put(g, x, y, NQ.brown);
    }
  }
}

const DRAW: Partial<Record<StructureKind, () => HTMLCanvasElement>> = {
  tateana: () =>
    canvas(32, 32, (r, g) => {
      thatchDome(g, 15.5, 4, 27, 14);
      // けむり出しの あな
      r(14, 4, 4, 2, NQ.bark);
      // すその 土
      r(3, 28, 26, 2, NQ.brown);
      // 入口（小さな 切妻の ひさし と くらい 入口）
      r(12, 19, 8, 2, NQ.tan);
      r(13, 21, 6, 7, NQ.night);
      r(14, 22, 4, 6, NQ.ink);
    }),
  takayuka: () =>
    canvas(32, 40, (r, g) => {
      // かやぶきの 切妻屋根
      for (let y = 1; y <= 15; y++) {
        const hw = 4 + (y - 1) * 0.8;
        for (let x = Math.ceil(15.5 - hw); x <= Math.floor(15.5 + hw); x++)
          put(g, x, y, x % 3 === 0 ? NQ.tan : x > 17 ? NQ.tan : NQ.sand);
      }
      r(12, 0, 8, 1, NQ.bark);
      // 板の かべ・ゆか
      r(5, 16, 22, 8, NQ.brown);
      for (let x = 7; x < 27; x += 4) r(x, 16, 1, 8, NQ.bark);
      r(14, 18, 4, 5, NQ.night);
      r(3, 24, 26, 2, NQ.bark);
      // ねずみがえし と はしら
      for (const x of [6, 15, 24]) {
        r(x - 1, 28, 4, 1, NQ.tan);
        r(x, 26, 2, 14, NQ.brown);
      }
      // はしご
      for (let k = 0; k < 7; k++) {
        r(21 + Math.floor(k / 2), 26 + k * 2, 1, 2, NQ.tan);
        r(26 + Math.floor(k / 2), 26 + k * 2, 1, 2, NQ.tan);
        r(21 + Math.floor(k / 2), 27 + k * 2, 6, 1, NQ.sand);
      }
    }),
  yagura: () =>
    canvas(48, 64, (r) => {
      // 3 だんの ゆか（板）
      for (const y of [4, 22, 40]) {
        r(1, y, 46, 3, NQ.tan);
        r(1, y + 3, 46, 1, NQ.bark);
        for (let x = 3; x < 46; x += 5) r(x, y, 1, 3, NQ.sand);
      }
      // 太い はしら（手前の 3 本）
      for (const x of [3, 21, 39]) {
        r(x, 1, 6, 63, NQ.brown);
        r(x + 4, 1, 2, 63, NQ.bark);
        r(x + 1, 1, 1, 63, NQ.tan);
      }
      // つなぎの なわ（ななめの すじかい）
      for (let k = 0; k < 14; k++) {
        r(9 + k, 8 + k, 1, 1, NQ.sand);
        r(38 - k, 26 + k, 1, 1, NQ.sand);
      }
      // はしご（だん と だんの あいだ）
      for (let y = 26; y < 40; y += 3) r(13, y, 6, 1, NQ.sand);
      r(13, 26, 1, 14, NQ.tan);
      r(18, 26, 1, 14, NQ.tan);
    }),
  longhouse: () =>
    canvas(64, 32, (r, g) => {
      // ながい かやぶきの 屋根（はしは まるく）
      for (let y = 4; y <= 27; y++) {
        const t = (y - 4) / 23;
        const hw = 8 + 22 * Math.sqrt(t);
        for (let x = Math.ceil(31.5 - hw); x <= Math.floor(31.5 + hw); x++) {
          const stripe = (y - 4) % 4 === 0;
          put(g, x, y, stripe ? NQ.tan : x > 45 ? NQ.tan : NQ.sand);
        }
      }
      r(24, 3, 16, 2, NQ.bark);
      r(10, 5, 3, 2, NQ.bark);
      r(51, 5, 3, 2, NQ.bark);
      r(4, 28, 56, 2, NQ.brown);
      // 入口 2 つ
      for (const x of [16, 42]) {
        r(x - 1, 19, 8, 2, NQ.tan);
        r(x, 21, 6, 7, NQ.night);
        r(x + 1, 22, 4, 6, NQ.ink);
      }
    }),
};

/** 追加の 絵（三内丸山の 小物） */
Object.assign(DRAW, {
  kuri: () =>
    canvas(16, 24, (r, g) => {
      // みき
      r(7, 14, 2, 9, NQ.brown);
      r(8, 14, 1, 9, NQ.bark);
      // まるい こずえ（みどり・かげ）と いがの 実
      for (let y = 1; y <= 15; y++)
        for (let x = 1; x <= 14; x++) {
          const d = ((x - 7.5) / 6.8) ** 2 + ((y - 8) / 7) ** 2;
          if (d <= 1) put(g, x, y, d > 0.6 && x > 8 ? NQ.green : (x + y) % 5 === 0 ? NQ.lime : NQ.leaf);
        }
      for (const [x, y] of [
        [4, 6],
        [10, 5],
        [7, 10],
        [11, 11],
      ] as const) {
        r(x, y, 2, 2, NQ.ochre);
        put(g, x, y, NQ.yellow);
      }
    }),
  dogu: () =>
    canvas(32, 40, (r) => {
      // 台
      r(6, 34, 20, 5, NQ.gray);
      r(6, 34, 20, 1, NQ.silver);
      // 板状土偶：十字の からだ
      r(11, 2, 10, 32, NQ.tan);
      r(3, 12, 26, 8, NQ.tan);
      r(20, 2, 1, 32, NQ.brown);
      r(3, 19, 26, 1, NQ.brown);
      // かお（まるい 目と 口）
      r(13, 5, 2, 2, NQ.bark);
      r(17, 5, 2, 2, NQ.bark);
      r(15, 9, 2, 2, NQ.bark);
      // なわの もよう
      for (let y = 22; y < 33; y += 3) r(12, y, 8, 1, NQ.sand);
      for (let x = 5; x < 28; x += 3) r(x, 15, 1, 2, NQ.sand);
    }),
  stones: () =>
    canvas(48, 48, (r) => {
      // わに ならべた 石（外の わ と 内の わ）
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const x = Math.round(23 + Math.cos(a) * 19);
        const y = Math.round(25 + Math.sin(a) * 17);
        r(x - 2, y - 2, 5, 4, NQ.gray);
        r(x - 2, y - 2, 5, 1, NQ.silver);
      }
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + 0.3;
        const x = Math.round(23 + Math.cos(a) * 8);
        const y = Math.round(25 + Math.sin(a) * 7);
        r(x - 1, y - 1, 3, 3, NQ.slate);
      }
      // まん中の 立石
      r(22, 16, 4, 10, NQ.gray);
      r(22, 16, 1, 10, NQ.silver);
    }),
  doki: () =>
    canvas(16, 20, (r) => {
      // つつの 形の 土器。口の ふちが もりあがる
      r(2, 1, 12, 3, NQ.brown);
      r(3, 4, 10, 15, NQ.tan);
      r(10, 4, 3, 15, NQ.brown);
      r(5, 1, 6, 1, NQ.bark);
      for (let y = 6; y < 18; y += 3) for (let x = 3; x < 13; x += 2) r(x, y, 1, 1, NQ.sand);
    }),
} satisfies Partial<Record<StructureKind, () => HTMLCanvasElement>>);

/** ほかの 名所エリアの 物 */
Object.assign(DRAW, LANDMARK_DRAW);

export const structureKey = (kind: StructureKind): string => `fld.struct.${kind}`;

/** 建物の テクスチャを 作る（何度 呼んでもよい） */
export function buildStructureArt(scene: Phaser.Scene): void {
  for (const kind of Object.keys(DRAW) as StructureKind[])
    if (!scene.textures.exists(structureKey(kind)))
      addImage(scene.textures, structureKey(kind), DRAW[kind]!());
}
