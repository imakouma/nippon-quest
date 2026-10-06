/**
 * フィールドの 入口の しるし（ドラクエの 地図のように、行き先が 絵で わかる）。16×16・すけ。NQ-48 だけ。
 *  fld.icon.town：町（赤と 青の 屋根の 家）／fld.icon.cave：ダンジョン（岩山の どうくつ）
 *  fld.icon.castle：裏ステージ（お城の 門）／fld.icon.port：港（船と さんばし）
 * 離島への 港（ハーバー）の 絵も ここ：fld.pier.h / fld.pier.v（さんばしの 板 16×16）・fld.ship（船 32×24）
 */
import type Phaser from 'phaser';
import { NQ } from '../art/palette';
import { addImage } from '../art/sheet';

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;

/** 県フィールドの町は、1マスの入口を保ったまま見た目だけ2×2マス相当にする。 */
export const entranceIconScale = (target: string, configured?: unknown): number => {
  const scale = Number(configured ?? (target.endsWith('-town') ? 2 : 1));
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
};

const ICONS: Record<string, (r: Rect) => void> = {
  'fld.icon.town': (r) => {
    // うしろの 家（青い 屋根）
    r(8, 2, 7, 1, NQ.ink);
    r(7, 3, 9, 3, NQ.azure);
    r(7, 3, 9, 1, NQ.sky);
    r(8, 6, 7, 4, NQ.paper);
    r(10, 7, 2, 2, NQ.sky);
    // まえの 家（赤い 屋根）
    r(2, 5, 8, 1, NQ.ink);
    r(1, 6, 10, 4, NQ.red);
    r(1, 6, 10, 1, NQ.vermilion);
    r(2, 10, 8, 5, NQ.paper);
    r(5, 11, 2, 4, NQ.brown);
    r(3, 11, 1, 2, NQ.sky);
    r(8, 11, 1, 2, NQ.sky);
    r(1, 15, 14, 1, NQ.green);
  },
  'fld.icon.cave': (r) => {
    // 岩山と まっくらな 入口
    r(4, 3, 8, 2, NQ.tan);
    r(2, 5, 12, 3, NQ.tan);
    r(1, 8, 14, 7, NQ.brown);
    r(4, 3, 3, 2, NQ.sand);
    r(2, 5, 3, 2, NQ.sand);
    r(5, 8, 6, 7, NQ.ink);
    r(6, 7, 4, 1, NQ.ink);
    r(1, 15, 14, 1, NQ.bark);
    r(12, 9, 2, 1, NQ.tan);
  },
  'fld.icon.castle': (r) => {
    // 石の お城と 赤い はた・くらい 門
    r(2, 5, 3, 10, NQ.silver);
    r(11, 5, 3, 10, NQ.silver);
    r(2, 4, 1, 1, NQ.silver);
    r(4, 4, 1, 1, NQ.silver);
    r(11, 4, 1, 1, NQ.silver);
    r(13, 4, 1, 1, NQ.silver);
    r(5, 7, 6, 8, NQ.cloud);
    r(5, 6, 1, 1, NQ.cloud);
    r(7, 6, 2, 1, NQ.cloud);
    r(10, 6, 1, 1, NQ.cloud);
    r(6, 10, 4, 5, NQ.night);
    r(7, 9, 2, 1, NQ.night);
    r(7, 1, 1, 6, NQ.slate);
    r(8, 1, 3, 2, NQ.red);
    r(2, 15, 12, 1, NQ.gray);
    r(3, 7, 1, 2, NQ.slate);
    r(12, 7, 1, 2, NQ.slate);
  },
  'fld.icon.port': (r) => {
    // さんばしと 小さな 船
    r(0, 9, 7, 2, NQ.tan);
    r(0, 11, 7, 1, NQ.brown);
    r(1, 12, 1, 3, NQ.brown);
    r(5, 12, 1, 3, NQ.brown);
    r(8, 10, 8, 3, NQ.brown);
    r(8, 10, 8, 1, NQ.tan);
    r(9, 13, 6, 1, NQ.bark);
    r(11, 3, 1, 7, NQ.slate);
    r(12, 3, 3, 5, NQ.paper);
    r(12, 3, 3, 1, NQ.white);
    r(9, 14, 7, 1, NQ.sky);
  },
};

/** 名所エリアの 関所（エリアの さかいの 門）。とじている ときは 木の さく、ひらくと 門だけ */
const GATES: Record<string, (r: Rect) => void> = {
  'fld.gate.closed': (r) => {
    r(1, 2, 2, 14, NQ.brown);
    r(13, 2, 2, 14, NQ.brown);
    r(0, 1, 16, 2, NQ.bark);
    r(0, 3, 16, 1, NQ.brown);
    r(3, 6, 10, 2, NQ.tan);
    r(3, 10, 10, 2, NQ.tan);
    for (let x = 4; x < 13; x += 3) r(x, 5, 1, 9, NQ.sand);
    r(6, 7, 4, 3, NQ.red);
  },
  'fld.gate.open': (r) => {
    r(1, 2, 2, 14, NQ.brown);
    r(13, 2, 2, 14, NQ.brown);
    r(0, 1, 16, 2, NQ.bark);
    r(0, 3, 16, 1, NQ.brown);
    r(5, 1, 6, 1, NQ.gold);
  },
};

/** 港（ハーバー）の 絵：さんばし（よこ・たて）と 船。[はば, 高さ, 描きかた] */
const HARBOR: Record<string, [number, number, (r: Rect) => void]> = {
  'fld.pier.h': [
    16,
    16,
    (r) => {
      // よこに のびる さんばし：板を たてに ならべ、下に くい
      r(0, 4, 16, 8, NQ.tan);
      for (let x = 3; x < 16; x += 4) r(x, 4, 1, 8, NQ.brown);
      r(0, 4, 16, 1, NQ.sand);
      r(0, 12, 16, 1, NQ.brown);
      r(2, 13, 2, 3, NQ.bark);
      r(12, 13, 2, 3, NQ.bark);
    },
  ],
  'fld.pier.v': [
    16,
    16,
    (r) => {
      // たてに のびる さんばし：板を よこに ならべ、よこに くい
      r(4, 0, 8, 16, NQ.tan);
      for (let y = 3; y < 16; y += 4) r(4, y, 8, 1, NQ.brown);
      r(4, 0, 1, 16, NQ.sand);
      r(11, 0, 1, 16, NQ.brown);
      r(2, 2, 2, 2, NQ.bark);
      r(12, 10, 2, 2, NQ.bark);
    },
  ],
  'fld.ship': [
    32,
    24,
    (r) => {
      // 白い 帆の フェリー（左向き）。赤い 船体に まど、下に なみ
      r(15, 1, 1, 13, NQ.bark);
      r(16, 2, 9, 9, NQ.white);
      r(16, 2, 9, 1, NQ.cloud);
      r(24, 3, 1, 8, NQ.cloud);
      r(18, 5, 5, 2, NQ.red);
      r(6, 8, 8, 5, NQ.paper);
      r(7, 9, 2, 2, NQ.sky);
      r(11, 9, 2, 2, NQ.sky);
      r(2, 13, 28, 1, NQ.ink);
      r(3, 14, 26, 4, NQ.red);
      r(3, 14, 26, 1, NQ.vermilion);
      r(5, 18, 22, 2, NQ.brick);
      for (let x = 6; x < 26; x += 5) r(x, 15, 2, 2, NQ.cream);
      r(0, 20, 32, 1, NQ.white);
      r(4, 21, 24, 1, NQ.sky);
    },
  ],
};

/** 入口の しるしの テクスチャを 作る（何度 呼んでもよい） */
export function buildEntranceIcons(scene: Phaser.Scene): void {
  const all: [string, number, number, (r: Rect) => void][] = [
    ...Object.entries(ICONS).map(([k, d]) => [k, 16, 16, d] as [string, number, number, (r: Rect) => void]),
    ...Object.entries(GATES).map(([k, d]) => [k, 16, 16, d] as [string, number, number, (r: Rect) => void]),
    ...Object.entries(HARBOR).map(
      ([k, [w, h, d]]) => [k, w, h, d] as [string, number, number, (r: Rect) => void],
    ),
  ];
  for (const [key, w, h, draw] of all) {
    if (scene.textures.exists(key)) continue;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    draw((x, y, w, h, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(x, y, w, h);
    });
    addImage(scene.textures, key, c);
  }
}
