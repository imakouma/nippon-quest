/**
 * フィールドの 見た目用の タイル（ドラクエのような すっきりした 地図）。データの background（地面の 種類）は そのままで、
 * Overworld が その上に 見た目だけの レイヤーを しき、ここの タイルで 描く（overworldView.ts が どれを 使うか きめる）。
 *  - つなぎめが 見えない（くり返しても マス目が 出ない）ひかえめな もよう
 *  - 海と 陸の さかいに 白い 波と あさせ。森は ひとかたまりの こずえ（ふちは まるく、下に かげ）
 *  - 果樹園は 1 マスに 1 本の 実の なる 木（ならぶと 畑の 列）
 *  - 山は ならぶと 山なみ。田んぼは 草原に 近い 色で なえの 列
 * 色は NQ-48 だけ。番号（VIEW）は この テクスチャの 中の 番号（0 から。8 列）
 */
import type Phaser from 'phaser';
import { NQ } from '../art/palette';
import { addImage } from '../art/sheet';
import { VIEW, VIEW_COUNT } from './overworldView';

export const VIEW_COLS = 8;

type Px = (x: number, y: number, col: string) => void;

// ───── つなぎめの ない もよう（x・y は 0〜15。となりの マスと 同じ 位置関係で くり返す） ─────
const grassAt = (x: number, y: number, v: number): string => {
  // 草の 小さな かげを まばらに（v で 位置を ずらす）
  const k = (x * 7 + y * 13 + v * 5) % 47;
  if (k === 0 || (k === 1 && (y + v) % 2 === 0)) return NQ.green;
  return NQ.leaf;
};
const waterAt = (x: number, y: number, glint: boolean): string => {
  if ((y === 4 && x >= 2 && x <= 5) || (y === 11 && x >= 9 && x <= 12)) return NQ.sky;
  if (glint && y === 8 && x >= 5 && x <= 6) return NQ.ice;
  return NQ.azure;
};
const sandAt = (x: number, y: number, v: number): string =>
  (x * 5 + y * 9 + v * 3) % 29 === 0 ? NQ.sand : NQ.beige;

/** まるい こずえが ならぶ もよう（16 ドットで くり返す）。hi 光・mid・lo かげ、pine は とがった 木 */
const canopy =
  (hi: string, mid: string, lo: string, pine = false) =>
  (x: number, y: number) => {
    const centers: [number, number][] = [
      [3, 3],
      [11, 3],
      [7, 10],
      [15, 10],
    ];
    for (const [cx, cy] of centers)
      for (const ox of [-16, 0, 16])
        for (const oy of [-16, 0, 16]) {
          const dx = x - (cx + ox);
          const dy = y - (cy + oy);
          if (dx * dx + dy * dy <= 12) {
            if (pine && dy <= -2 && Math.abs(dx) <= 1) return hi;
            if (dx <= -1 && dy <= -1) return hi;
            if (dx >= 2 || dy >= 2) return lo;
            return mid;
          }
        }
    return lo;
  };
const forestAt = canopy(NQ.leaf, NQ.green, NQ.forest);
const pineAt = canopy(NQ.leaf, NQ.green, NQ.forest, true);

/**
 * ひとかたまりの こずえ（森・果樹園）。mask は となりが 同じ なかまの がわ（北 1・東 2・南 4・西 8）。
 * なかまで ない がわは 草で、ふちは まるく、下の ふちの 下に かげ
 */
function grove(
  p: Px,
  mask: number,
  fill: (x: number, y: number) => string,
  rim: string,
  shadow = true,
): void {
  const open = { n: !(mask & 1), e: !(mask & 2), s: !(mask & 4), w: !(mask & 8) };
  const inside = (x: number, y: number) => {
    if (x < 0 || y < 0 || x > 15 || y > 15) return false;
    if ((open.n && y < 2) || (open.s && y > 12) || (open.w && x < 1) || (open.e && x > 14)) return false;
    const cx = open.w ? 4 - x : open.e ? x - 11 : -1;
    const cy = open.n ? 5 - y : open.s ? y - 9 : -1;
    return !(cx > 0 && cy > 0 && cx * cx + cy * cy > 12);
  };
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      if (inside(x, y)) {
        const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
        const border =
          (open.n && y === 2) || (open.s && y === 12) || (open.w && x === 1) || (open.e && x === 14);
        p(x, y, edge && border ? rim : fill(x, y));
      } else p(x, y, shadow && open.s && y >= 13 && y <= 14 && inside(x, 12) ? NQ.green : grassAt(x, y, 0));
    }
}

/** 果樹園の 木：草の 上に 1 本（まるい こずえ・みき・足もとの かげ・2×2 の 実） */
function fruitTree(p: Px, fruit: string, fruitShade: string): void {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, grassAt(x, y, 0));
  for (let y = 13; y <= 14; y++)
    for (let x = 4; x <= 11; x++) if (y === 13 || (x > 4 && x < 11)) p(x, y, NQ.green);
  for (let y = 10; y <= 13; y++) {
    p(7, y, NQ.brown);
    p(8, y, NQ.bark);
  }
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const dx = x - 7.5;
      const dy = y - 6;
      const d = dx * dx + dy * dy;
      if (d > 26) continue;
      p(x, y, d > 16 && dx + dy > 1 ? NQ.forest : d < 12 && dx + dy < -2 ? NQ.leaf : NQ.green);
    }
  p(5, 3, NQ.lime);
  p(6, 3, NQ.lime);
  for (const [fx, fy] of [
    [4, 6],
    [9, 3],
    [9, 8],
  ] as const) {
    p(fx, fy, fruit);
    p(fx + 1, fy, fruit);
    p(fx, fy + 1, fruitShade);
    p(fx + 1, fy + 1, fruitShade);
  }
}

/** 山の 形（草の 上。すそが マスの はばいっぱい → ならぶと 山なみ）。左が 日なた・右が かげ */
function peak(p: Px, apexX: number, apexY: number, snow: boolean): void {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, grassAt(x, y, 1));
  for (let y = apexY; y < 16; y++) {
    const t = (y - apexY) / (15 - apexY);
    const left = Math.round(apexX - t * apexX);
    const right = Math.round(apexX + t * (15 - apexX));
    for (let x = left; x <= right; x++) {
      let col: string = x <= apexX ? NQ.sand : NQ.brown;
      if (snow && y <= apexY + 3) col = x <= apexX ? NQ.white : NQ.cloud;
      if (x === left || x === right) col = NQ.bark;
      if (y === 15) col = NQ.bark;
      p(x, y, col);
    }
  }
  for (let k = 3; k < 9; k++) p(apexX - 1 - Math.floor(k / 3), apexY + k + 2, NQ.tan);
}

function drawView(px: (n: number) => Px): void {
  // 海（陸の がわに 白い 波と あさせ）
  for (let mask = 0; mask < 17; mask++) {
    const p = px(VIEW.WATER + mask);
    const land = mask === 16 ? 0 : mask;
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const edge = Math.min(
          land & 1 ? y : 99,
          land & 2 ? 15 - x : 99,
          land & 4 ? 15 - y : 99,
          land & 8 ? x : 99,
        );
        p(x, y, edge === 0 ? NQ.white : edge <= 2 ? NQ.sky : waterAt(x, y, mask === 16));
      }
  }
  // 草原（ふつう・草・花）
  [0, 1, 2].forEach((v) => {
    const p = px(VIEW.GRASS + v);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, grassAt(x, y, v));
    if (v === 1)
      for (const [x, y] of [
        [4, 6],
        [11, 12],
      ] as const) {
        p(x, y, NQ.green);
        p(x + 1, y - 1, NQ.green);
        p(x + 2, y, NQ.green);
      }
    if (v === 2)
      for (const [x, y, c] of [
        [4, 5, NQ.white],
        [11, 10, NQ.cream],
      ] as const) {
        p(x, y, c);
        p(x, y + 1, NQ.green);
      }
  });
  // すなはま（まん中）と、ふち（となりが 草の がわを まるく。海の がわは そのまま）
  [0, 1].forEach((v) => {
    const p = px(VIEW.SAND + v);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, sandAt(x, y, v));
  });
  for (let mask = 0; mask < 16; mask++)
    grove(px(VIEW.SAND_EDGE + mask), mask, (x, y) => sandAt(x, y, 0), NQ.sand, false);
  // 森（16 の ふち）・とがった 木の 森
  for (let mask = 0; mask < 16; mask++) grove(px(VIEW.FOREST + mask), mask, forestAt, NQ.forest);
  {
    const p = px(VIEW.FOREST_PINE);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, pineAt(x, y));
  }
  // 山（ならぶと 山なみ）・雪の 山
  peak(px(VIEW.PEAK), 8, 2, false);
  peak(px(VIEW.PEAK2), 6, 4, false);
  peak(px(VIEW.PEAK_SNOW), 8, 1, true);
  // みずべ（小さな 池と あし・あしだけ）
  [0, 1].forEach((v) => {
    const p = px(VIEW.MARSH + v);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, grassAt(x, y, v + 1));
    if (v === 0)
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          const d = ((x - 6) / 3.5) ** 2 + ((y - 9) / 2) ** 2;
          if (d <= 1) p(x, y, d > 0.55 ? NQ.teal : NQ.aqua);
        }
    const reeds: [number, number][] =
      v === 0
        ? [[11, 4]]
        : [
            [4, 5],
            [12, 10],
          ];
    for (const [rx, ry] of reeds)
      for (let k = 0; k < 4; k++) {
        p(rx, ry + k, k === 0 ? NQ.brown : NQ.green);
        if (k > 1) p(rx + 2, ry + k, NQ.green);
      }
  });
  // 田んぼ（草原と 同じ 色に なえの 列）・こがね色の 田んぼ（黄色い 穂の 列）。
  // なえは 2 ドットずつ、列ごとに ずらす（線に ならず、広い 田んぼでも うるさく ならない）。
  // 地の 色は 草原と 同じ（ちがう 色だと マスの かどが カクカクに 見える）
  (
    [
      [VIEW.FARM, NQ.lime],
      [VIEW.FARM_GOLD, NQ.yellow],
    ] as const
  ).forEach(([n, mark]) => {
    const p = px(n);
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++)
        p(x, y, y % 4 === 2 && (x + (y % 8 === 2 ? 0 : 2)) % 4 < 2 ? mark : NQ.leaf);
  });
  // 果樹園（1 本ずつ 実の なる 木）
  fruitTree(px(VIEW.ORCHARD), NQ.red, NQ.brick);
  fruitTree(px(VIEW.ORCHARD_PEACH), NQ.blush, NQ.berry);
  // 道：草原の 上の 土の 道。まん中と、となりが 道の がわへ のびる（ふちは 草に なじむ こげ茶の 点）
  for (let mask = 0; mask < 16; mask++) {
    const p = px(VIEW.ROAD + mask);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, grassAt(x, y, 0));
    // マス いっぱいの 土。となりが 道で ない がわだけ 草に なじむ ふち（1 ドットの 草・1 ドットの こい 土）
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const d = Math.min(
          mask & 1 ? 99 : y,
          mask & 2 ? 99 : 15 - x,
          mask & 4 ? 99 : 15 - y,
          mask & 8 ? 99 : x,
        );
        if (d === 0) continue;
        p(x, y, d === 1 ? NQ.tan : (x * 5 + y * 3) % 11 === 0 ? NQ.beige : NQ.sand);
      }
  }
  // 名所エリアの さかいの 山なみ：くらい 岩の 山に 雪。マスの はばいっぱいで すきま なく ならぶ（歩ける 茶色の 山と 見わけ）
  ridge(px(VIEW.RIDGE), 8, 1);
  ridge(px(VIEW.RIDGE2), 6, 2);
  // さくらの 木（ピンクの まるい こずえに 白い 花）
  sakuraTree(px(VIEW.SAKURA));
  // 恐山の はいいろの 砂地（小石と いおうの 黄色）・ゆけむりの 出る あな
  [0, 1].forEach((v) => {
    const p = px(VIEW.ASH + v);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, ashAt(x, y, v));
  });
  {
    const p = px(VIEW.STEAM);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, ashAt(x, y, 0));
    for (let y = 11; y < 15; y++)
      for (let x = 4; x < 12; x++)
        if ((x - 7.5) ** 2 / 16 + (y - 13) ** 2 / 3 <= 1) p(x, y, y === 11 ? NQ.gray : NQ.yellow);
    for (const [x, y] of [
      [7, 9],
      [8, 8],
      [7, 7],
      [6, 6],
      [7, 5],
      [8, 4],
      [9, 3],
      [8, 2],
    ] as const) {
      p(x, y, NQ.white);
      p(x + 1, y, NQ.cloud);
    }
  }
}

/** さかいの 岩山：すそが マスいっぱい、上は 雪。左が 日なた（gray）、右が かげ（night） */
function ridge(p: Px, apexX: number, apexY: number): void {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, NQ.slate);
  for (let y = apexY; y < 16; y++) {
    const t = (y - apexY) / (15 - apexY);
    const left = Math.round(apexX - t * (apexX + 1));
    const right = Math.round(apexX + t * (16 - apexX));
    for (let x = Math.max(0, left); x <= Math.min(15, right); x++) {
      let col: string = x <= apexX ? NQ.gray : NQ.night;
      if (y <= apexY + 3) col = x <= apexX ? NQ.white : NQ.cloud;
      p(x, y, col);
    }
  }
}

/** さくらの 木：草の 上に ピンクの まるい こずえ、白い 花の 点、茶色の みき */
function sakuraTree(p: Px): void {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, grassAt(x, y, 0));
  for (let y = 11; y < 15; y++) {
    p(7, y, NQ.brown);
    p(8, y, NQ.bark);
  }
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const d = ((x - 7.5) / 6.5) ** 2 + ((y - 6) / 5.5) ** 2;
      if (d > 1) continue;
      p(x, y, d > 0.7 && x > 8 ? NQ.berry : (x * 3 + y * 5) % 7 === 0 ? NQ.white : NQ.blush);
    }
}

/** 恐山の 砂地：はいいろに 小石、ところどころ いおうの 黄色 */
const ashAt = (x: number, y: number, v: number): string => {
  const h = (x * 7 + y * 13 + v * 5) % 23;
  if (h === 0) return NQ.gray;
  if (h === 11 && v === 1) return NQ.yellow;
  return (x + y * 3) % 9 === 0 ? NQ.cloud : NQ.silver;
};

/** 見た目用の タイル（'overworld-view'）を 作る。Overworld が 見た目だけの タイルマップで つかう */
export function buildViewTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('overworld-view')) return;
  const c = document.createElement('canvas');
  c.width = VIEW_COLS * 16;
  c.height = Math.ceil(VIEW_COUNT / VIEW_COLS) * 16;
  const ctx = c.getContext('2d')!;
  drawView((n) => (x, y, col) => {
    ctx.fillStyle = col;
    ctx.fillRect((n % VIEW_COLS) * 16 + x, Math.floor(n / VIEW_COLS) * 16 + y, 1, 1);
  });
  addImage(scene.textures, 'overworld-view', c);
}
