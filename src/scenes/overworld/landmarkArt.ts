/**
 * 名所エリアの 建物・小物の ドット絵（三内丸山 いがいの エリア。structureArt.ts と おなじ きまり）。
 * NQ-48 だけ・外周に ink の 輪郭。絵の 下の はしが 物の マスの 下。上は マスより 高く のびても よい。
 * ［よこ × たて（マス）、絵の 大きさ］
 *  ねぶた祭：nebutaFloat ねぶた（3×2、48×48）・taiko 大だいこ（2×2）・chochin ちょうちん（1×1、16×28）
 *  津軽海峡：toudai 灯台（2×2、32×56）・windmill 風車（1×1、16×40）・hi 歌の 碑（2×1、32×28）
 *  弘前城：tenshu 天守（3×3、48×64）・sakura さくら（1×1、16×24）・ringo りんごの木（1×1、16×24）
 *  白神山地：bigBuna マザーツリー（2×2、32×48）・buna ブナ（1×1、16×28）・taki 暗門の滝（2×2、32×40）
 *  十和田湖：otome 乙女の像（2×2、32×40）・torii 鳥居（2×1、32×32）・boat 遊覧船（3×1、48×28）
 *  奥入瀬渓流：bigTaki 銚子大滝（3×2、48×40）・kokeiwa こけの 岩（1×1、16×16）
 *  八戸：dashi 三社大祭の 山車（3×2、48×48）・yatai せんべい汁の 屋台（2×2、32×36）・fune 漁船（2×1、32×24）
 *  恐山：sanmon 山門（3×1、48×44）・jizo お地蔵さま（1×1、16×20）・kazaguruma 風車（1×1、16×24）・tsumi 積み石（1×1、16×16）
 *  大間：maguroZo マグロの 像（3×2、48×40）・saihokutan 本州最北端の 碑（2×1、32×32）
 */
import { makeGrid, outline, put, toCanvas, type Grid } from '../art/grid';
import { NQ } from '../art/palette';

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

/** まるい こずえの 木（みき・こずえの 色・かげ・点の 色） */
function roundTree(w: number, h: number, leaf: string, shade: string, dot: string | null, dots = 4) {
  return canvas(w, h, (r, g) => {
    const cx = w / 2 - 0.5;
    r(Math.floor(cx) - 1, h - 10, 3, 10, NQ.brown);
    r(Math.floor(cx) + 1, h - 10, 1, 10, NQ.bark);
    const ry = (h - 8) / 2;
    for (let y = 1; y < h - 6; y++)
      for (let x = 1; x < w - 1; x++) {
        const d = ((x - cx) / (w / 2 - 1)) ** 2 + ((y - ry) / ry) ** 2;
        if (d <= 1) put(g, x, y, d > 0.6 && x > cx ? shade : leaf);
      }
    if (dot)
      for (let k = 0; k < dots; k++) {
        const x = Math.round(cx + Math.cos(k * 2.4) * (w / 4));
        const y = Math.round(ry + Math.sin(k * 2.4) * (ry / 2));
        r(x, y, 2, 2, dot);
      }
  });
}

/** 滝（がけ・おちる 水・たきつぼ） */
function waterfall(w: number, h: number, fallW: number) {
  return canvas(w, h, (r) => {
    r(0, 0, w, h - 8, NQ.slate);
    for (let y = 2; y < h - 10; y += 5) r((y * 7) % (w - 6), y, 5, 2, NQ.gray);
    r(0, 0, w, 3, NQ.green);
    const x0 = Math.floor((w - fallW) / 2);
    r(x0, 2, fallW, h - 10, NQ.sky);
    for (let x = x0 + 1; x < x0 + fallW; x += 3) r(x, 3, 1, h - 12, NQ.white);
    r(2, h - 8, w - 4, 7, NQ.azure);
    r(x0 - 2, h - 9, fallW + 4, 2, NQ.white);
  });
}

/** 灯台（白い 塔に 赤い おび、上に あかり） */
function lighthouse(stripe: string) {
  return canvas(32, 56, (r) => {
    r(9, 4, 14, 4, NQ.red);
    r(11, 8, 10, 5, NQ.yellow);
    r(11, 8, 10, 1, NQ.white);
    r(8, 13, 16, 2, NQ.slate);
    for (let y = 15; y < 50; y++) {
      const hw = 5 + (y - 15) * 0.09;
      const x0 = Math.round(16 - hw);
      r(x0, y, Math.round(hw * 2), 1, Math.floor((y - 15) / 7) % 2 ? stripe : NQ.white);
      r(Math.round(16 + hw) - 2, y, 2, 1, NQ.cloud);
    }
    r(13, 40, 6, 10, NQ.night);
    r(4, 50, 24, 6, NQ.gray);
  });
}

/** ねぶた（武者の かお）や 山車：だいの 上の はなやかな 絵 */
function festivalFloat(face: boolean) {
  return canvas(48, 48, (r) => {
    // だい と 車
    r(2, 38, 44, 6, NQ.brown);
    r(2, 38, 44, 1, NQ.tan);
    for (const x of [6, 36]) r(x, 42, 6, 6, NQ.bark);
    if (face) {
      // ねぶた：白い 紙に くっきりの 線、赤・青・黄の いろどり
      r(4, 4, 40, 34, NQ.white);
      r(6, 6, 16, 10, NQ.red);
      r(26, 6, 16, 10, NQ.blue);
      r(10, 16, 28, 14, NQ.cream);
      // 目と まゆ・口
      r(13, 18, 8, 2, NQ.ink);
      r(27, 18, 8, 2, NQ.ink);
      r(15, 21, 4, 3, NQ.white);
      r(16, 21, 2, 3, NQ.ink);
      r(29, 21, 4, 3, NQ.white);
      r(30, 21, 2, 3, NQ.ink);
      r(19, 27, 10, 2, NQ.red);
      // くまどり（目じりの 赤い すじ）と ひげ
      r(10, 17, 3, 1, NQ.red);
      r(35, 17, 3, 1, NQ.red);
      r(11, 24, 2, 4, NQ.red);
      r(35, 24, 2, 4, NQ.red);
      r(21, 25, 6, 1, NQ.ink);
      r(4, 30, 40, 8, NQ.yellow);
      for (let x = 6; x < 44; x += 6) r(x, 31, 3, 6, NQ.orange);
      r(22, 0, 4, 6, NQ.gold);
    } else {
      // 山車：金の やねと 赤い まく、上に 人形
      r(6, 18, 36, 20, NQ.red);
      for (let x = 8; x < 42; x += 5) r(x, 18, 2, 20, NQ.berry);
      r(3, 14, 42, 4, NQ.gold);
      r(8, 10, 32, 4, NQ.ochre);
      r(20, 0, 8, 10, NQ.paper);
      r(20, 0, 8, 3, NQ.ink);
      r(18, 6, 12, 4, NQ.violet);
    }
  });
}

export const LANDMARK_DRAW: Readonly<Record<string, () => HTMLCanvasElement>> = {
  // ── ねぶた祭
  nebutaFloat: () => festivalFloat(true),
  taiko: () =>
    canvas(32, 32, (r, g) => {
      // 台
      r(4, 26, 24, 3, NQ.brown);
      for (const x of [5, 23]) r(x, 26, 4, 6, NQ.bark);
      // まるい 大だいこ（赤い どう・かわの 面・びょう）
      for (let y = 1; y < 27; y++)
        for (let x = 3; x < 29; x++) {
          const d = ((x - 15.5) / 12.5) ** 2 + ((y - 13.5) / 12.5) ** 2;
          if (d <= 1) put(g, x, y, d > 0.72 ? NQ.red : d > 0.6 ? NQ.gold : NQ.beige);
        }
      // 三つどもえ
      r(12, 9, 4, 4, NQ.red);
      r(17, 11, 4, 4, NQ.navy);
      r(13, 15, 4, 4, NQ.gold);
      r(15, 13, 2, 2, NQ.ink);
    }),
  chochin: () =>
    canvas(16, 28, (r) => {
      r(7, 12, 2, 16, NQ.bark);
      r(3, 2, 10, 10, NQ.red);
      r(4, 2, 8, 1, NQ.ink);
      r(4, 11, 8, 1, NQ.ink);
      for (let y = 4; y < 11; y += 2) r(3, y, 10, 1, NQ.vermilion);
      r(6, 5, 4, 4, NQ.cream);
    }),
  // ── 津軽海峡（龍飛崎）
  toudai: () => lighthouse(NQ.red),
  windmill: () =>
    canvas(16, 40, (r, g) => {
      // ほそい 塔（下ほど 太い）
      for (let y = 12; y < 40; y++) r(7, y, y > 26 ? 3 : 2, 1, y % 6 === 0 ? NQ.cloud : NQ.white);
      // 3 まいの はね（上・左下・右下）と まん中の じく
      r(7, 0, 2, 10, NQ.white);
      r(8, 1, 1, 8, NQ.cloud);
      for (let k = 1; k <= 6; k++) {
        put(g, 7 - k, 10 + Math.round(k * 0.6), NQ.white);
        put(g, 8 + k, 10 + Math.round(k * 0.6), NQ.cloud);
      }
      r(6, 9, 4, 3, NQ.silver);
      r(7, 10, 2, 1, NQ.red);
    }),
  hi: () =>
    canvas(32, 28, (r) => {
      r(2, 22, 28, 6, NQ.gray);
      r(5, 2, 22, 21, NQ.slate);
      r(5, 2, 22, 2, NQ.silver);
      for (let y = 6; y < 20; y += 3) r(9, y, 14, 1, NQ.cloud);
    }),
  // ── 弘前城
  tenshu: () =>
    canvas(48, 64, (r) => {
      // 石垣
      for (let y = 48; y < 64; y++) {
        const inset = Math.floor((63 - y) / 4);
        r(inset, y, 48 - inset * 2, 1, (y + Math.floor(y / 3)) % 4 === 0 ? NQ.silver : NQ.gray);
      }
      // 3 じゅうの 屋根（どうの みどり）と 白い かべ
      const tiers: [number, number, number][] = [
        [6, 36, 12],
        [10, 22, 12],
        [14, 8, 12],
      ];
      for (const [inset, y, hgt] of tiers) {
        r(inset + 2, y + 4, 44 - inset * 2 - 4, hgt, NQ.white);
        r(inset + 2, y + 4, 44 - inset * 2 - 4, 1, NQ.cloud);
        for (let x = inset + 6; x < 44 - inset; x += 7) r(x, y + 7, 3, 3, NQ.night);
        r(inset - 2, y, 52 - inset * 2, 4, NQ.teal);
        r(inset - 2, y + 3, 52 - inset * 2, 1, NQ.green);
      }
      r(20, 0, 8, 8, NQ.teal);
      r(19, 0, 2, 3, NQ.gold);
      r(27, 0, 2, 3, NQ.gold);
    }),
  sakura: () => roundTree(16, 24, NQ.blush, NQ.berry, NQ.white, 5),
  ringo: () => roundTree(16, 24, NQ.leaf, NQ.green, NQ.red, 4),
  // ── 白神山地
  bigBuna: () =>
    canvas(32, 48, (r, g) => {
      r(12, 24, 8, 24, NQ.silver);
      r(17, 24, 3, 24, NQ.gray);
      for (let y = 28; y < 46; y += 4) r(13, y, 3, 1, NQ.white);
      r(8, 44, 16, 4, NQ.silver);
      for (let y = 1; y < 30; y++)
        for (let x = 1; x < 31; x++) {
          const d = ((x - 15.5) / 15) ** 2 + ((y - 14) / 13.5) ** 2;
          if (d <= 1) put(g, x, y, d > 0.6 && x > 16 ? NQ.green : (x * 3 + y) % 7 === 0 ? NQ.lime : NQ.leaf);
        }
    }),
  buna: () => roundTree(16, 28, NQ.leaf, NQ.green, NQ.lime, 3),
  taki: () => waterfall(32, 40, 8),
  // ── 十和田湖
  otome: () =>
    canvas(32, 40, (r) => {
      r(4, 32, 24, 8, NQ.gray);
      r(4, 32, 24, 1, NQ.silver);
      // むかいあう 2 人の 乙女（ブロンズ）
      for (const [x, s] of [
        [8, 1],
        [19, -1],
      ] as const) {
        r(x, 4, 5, 5, NQ.amber);
        r(x, 9, 5, 14, NQ.brown);
        r(x + (s > 0 ? 5 : -2), 12, 2, 6, NQ.brown);
        r(x + 1, 23, 1, 9, NQ.brown);
        r(x + 3, 23, 1, 9, NQ.brown);
        r(x + (s > 0 ? 3 : 1), 5, 1, 1, NQ.bark);
      }
    }),
  torii: () =>
    canvas(32, 32, (r) => {
      r(0, 2, 32, 3, NQ.red);
      r(0, 2, 32, 1, NQ.ink);
      r(3, 8, 26, 2, NQ.red);
      r(6, 5, 4, 27, NQ.vermilion);
      r(22, 5, 4, 27, NQ.vermilion);
      r(14, 5, 4, 3, NQ.red);
    }),
  boat: () =>
    canvas(48, 28, (r) => {
      r(14, 2, 18, 10, NQ.white);
      r(16, 4, 3, 3, NQ.sky);
      r(22, 4, 3, 3, NQ.sky);
      r(28, 4, 2, 3, NQ.sky);
      r(4, 12, 40, 8, NQ.white);
      r(4, 17, 40, 3, NQ.blue);
      r(2, 12, 2, 4, NQ.white);
      r(6, 20, 36, 3, NQ.navy);
      r(0, 24, 48, 4, NQ.sky);
    }),
  // ── 奥入瀬渓流
  bigTaki: () => waterfall(48, 40, 30),
  kokeiwa: () =>
    canvas(16, 16, (r) => {
      r(1, 5, 14, 10, NQ.gray);
      r(2, 3, 11, 4, NQ.leaf);
      r(1, 6, 5, 3, NQ.lime);
      r(10, 9, 4, 5, NQ.slate);
    }),
  // ── 八戸
  dashi: () => festivalFloat(false),
  yatai: () =>
    canvas(32, 36, (r) => {
      r(1, 2, 30, 6, NQ.red);
      for (let x = 2; x < 31; x += 6) r(x, 2, 3, 6, NQ.white);
      r(3, 8, 2, 28, NQ.brown);
      r(27, 8, 2, 28, NQ.brown);
      r(2, 22, 28, 14, NQ.tan);
      r(2, 22, 28, 2, NQ.brown);
      // せんべい汁の おなべと ゆげ
      r(10, 16, 12, 6, NQ.slate);
      r(11, 15, 10, 2, NQ.orange);
      r(13, 10, 1, 4, NQ.white);
      r(17, 9, 1, 5, NQ.white);
    }),
  fune: () =>
    canvas(32, 24, (r) => {
      r(14, 2, 2, 12, NQ.bark);
      r(10, 6, 8, 6, NQ.white);
      r(2, 13, 28, 5, NQ.white);
      r(2, 16, 28, 2, NQ.red);
      r(4, 18, 24, 3, NQ.navy);
      r(0, 21, 32, 3, NQ.sky);
    }),
  // ── 恐山
  sanmon: () =>
    canvas(48, 44, (r) => {
      r(0, 4, 48, 6, NQ.night);
      r(0, 4, 48, 1, NQ.gray);
      r(4, 10, 40, 4, NQ.brick);
      for (const x of [5, 21, 37]) r(x, 14, 6, 30, NQ.brick);
      r(4, 20, 40, 2, NQ.bark);
      r(14, 0, 20, 5, NQ.night);
    }),
  jizo: () =>
    canvas(16, 20, (r) => {
      r(3, 16, 10, 4, NQ.gray);
      r(5, 7, 6, 9, NQ.silver);
      r(5, 2, 6, 5, NQ.silver);
      r(4, 8, 8, 4, NQ.red);
      r(6, 4, 1, 1, NQ.slate);
      r(9, 4, 1, 1, NQ.slate);
    }),
  kazaguruma: () =>
    canvas(16, 24, (r) => {
      r(7, 10, 2, 14, NQ.bark);
      r(3, 2, 5, 5, NQ.red);
      r(8, 2, 5, 5, NQ.yellow);
      r(3, 7, 5, 5, NQ.blue);
      r(8, 7, 5, 5, NQ.leaf);
      r(7, 6, 2, 2, NQ.white);
    }),
  tsumi: () =>
    canvas(16, 16, (r) => {
      r(2, 12, 12, 4, NQ.gray);
      r(4, 8, 8, 4, NQ.silver);
      r(5, 5, 6, 3, NQ.gray);
      r(6, 2, 4, 3, NQ.silver);
    }),
  // ── 大間
  maguroZo: () =>
    canvas(48, 40, (r, g) => {
      r(6, 32, 36, 8, NQ.gray);
      r(6, 32, 36, 1, NQ.silver);
      // とびはねる マグロ（せなかは こん、はらは ぎん）
      for (let y = 4; y < 30; y++)
        for (let x = 4; x < 44; x++) {
          const d = ((x - 22) / 17) ** 2 + ((y - 16) / 9) ** 2;
          if (d <= 1) put(g, x, y, y < 15 ? NQ.navy : y < 18 ? NQ.blue : NQ.silver);
        }
      r(39, 8, 6, 4, NQ.navy);
      r(41, 20, 6, 6, NQ.navy);
      r(9, 13, 3, 3, NQ.white);
      r(10, 14, 1, 1, NQ.ink);
      for (let x = 30; x < 38; x += 2) r(x, 26, 1, 2, NQ.yellow);
      r(22, 30, 4, 3, NQ.slate);
    }),
  saihokutan: () =>
    canvas(32, 32, (r) => {
      r(2, 26, 28, 6, NQ.gray);
      r(6, 2, 20, 25, NQ.slate);
      r(6, 2, 20, 2, NQ.silver);
      r(10, 7, 12, 2, NQ.white);
      r(10, 12, 12, 2, NQ.white);
      r(10, 17, 12, 2, NQ.white);
    }),
};
