/**
 * フィールドの 入口の しるし（ドラクエの 地図のように、行き先が 絵で わかる）。NQ-48 だけ。
 *  fld.icon.town：町（2×2マスの集落）／fld.icon.cave：ダンジョン（岩山の どうくつ）
 *  fld.icon.castle：裏ステージ（お城の 門）／fld.icon.port：港（船と さんばし）
 * 離島への 港（ハーバー）の 絵も ここ：fld.pier.h / fld.pier.v（さんばしの 板 16×16）・fld.ship（船 32×24）
 * 県間入口：fld.interpref.<gate|bridge|tunnel|rail|ferry>.<open|closed>（すべて16×16）
 */
import type Phaser from 'phaser';
import { NQ } from '../palette';
import { addImage } from '../sheet';

type Rect = (x: number, y: number, w: number, h: number, col: string) => void;

export const INTER_PREFECTURE_ICON_SIZE = 16;

export interface InterPrefectureIconSource {
  infrastructure: 'landBorder' | 'bridge' | 'tunnel' | 'seaRoute';
  travelMode: 'walk' | 'bicycle' | 'roadVehicle' | 'rail' | 'ferry';
}

export type InterPrefectureIconKind = 'gate' | 'bridge' | 'tunnel' | 'rail' | 'ferry';
export type InterPrefectureIconTextureKey = `fld.interpref.${InterPrefectureIconKind}.${'open' | 'closed'}`;

/** 県間リンクを、フィールドで見分ける入口テクスチャへ決定論的に対応させる。 */
export function interPrefectureIconKey(
  link: InterPrefectureIconSource,
  open: boolean,
): InterPrefectureIconTextureKey {
  const kind: InterPrefectureIconKind =
    link.travelMode === 'rail'
      ? 'rail'
      : link.travelMode === 'ferry' || link.infrastructure === 'seaRoute'
        ? 'ferry'
        : link.infrastructure === 'bridge'
          ? 'bridge'
          : link.infrastructure === 'tunnel'
            ? 'tunnel'
            : 'gate';
  return `fld.interpref.${kind}.${open ? 'open' : 'closed'}`;
}

/** 県フィールドの町は、1マスの入口を保ったまま見た目だけ2×2マス相当にする。 */
export const entranceIconScale = (target: string, configured?: unknown): number => {
  const scale = Number(configured ?? (target.endsWith('-town') ? 2 : 1));
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
};

/** 町の入口マスでは主人公が建物の手前に立つ。 */
export const entranceIconDepth = (icon: string, tileY: number, tileSize: number): number =>
  tileY * tileSize + (icon === 'fld.icon.town' ? tileSize / 2 - 1 : 0);

const ICONS: Record<string, (r: Rect) => void> = {
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

/** 町は透明背景の2×2マスで、地形に重ねても輪郭と入口が読める。 */
const LARGE_ENTRANCES: Record<string, [number, number, (r: Rect) => void]> = {
  'fld.icon.town': [
    32,
    32,
    (r) => {
      // 左右の家で集落の幅を出し、中央の暗い戸口へ視線を集める。
      r(2, 10, 8, 2, NQ.navy);
      r(0, 12, 12, 4, NQ.azure);
      r(1, 16, 10, 11, NQ.paper);
      r(1, 24, 10, 3, NQ.beige);
      r(3, 19, 4, 5, NQ.navy);
      r(4, 20, 2, 3, NQ.sky);
      r(22, 10, 8, 2, NQ.brown);
      r(20, 12, 12, 4, NQ.red);
      r(21, 16, 10, 11, NQ.paper);
      r(21, 24, 10, 3, NQ.beige);
      r(25, 19, 3, 8, NQ.brown);

      r(8, 3, 16, 3, NQ.navy);
      r(5, 6, 22, 3, NQ.ink);
      r(6, 7, 20, 3, NQ.red);
      r(4, 10, 24, 4, NQ.vermilion);
      r(5, 13, 22, 1, NQ.brick);
      r(6, 14, 20, 15, NQ.paper);
      r(5, 14, 1, 15, NQ.ink);
      r(26, 14, 1, 15, NQ.ink);
      r(6, 26, 20, 3, NQ.beige);
      r(5, 29, 22, 1, NQ.ink);
      r(8, 17, 5, 5, NQ.navy);
      r(9, 18, 3, 3, NQ.sky);
      r(19, 17, 5, 5, NQ.navy);
      r(20, 18, 3, 3, NQ.sky);
      r(13, 20, 6, 9, NQ.ink);
      r(14, 21, 4, 8, NQ.brown);
      r(17, 24, 1, 1, NQ.gold);
    },
  ],
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

/** 全国の県間入口。事業者ロゴを使わず、形だけで種類を見分けられる汎用デザイン。 */
const INTER_PREFECTURE_BASE: Record<InterPrefectureIconKind, (r: Rect) => void> = {
  gate: (r) => {
    // 木の門。左右の柱と大きな笠木で陸続きの県境を表す。
    r(1, 2, 14, 2, NQ.bark);
    r(3, 4, 2, 11, NQ.brown);
    r(11, 4, 2, 11, NQ.brown);
    r(2, 1, 12, 1, NQ.tan);
    r(6, 4, 4, 2, NQ.gold);
    r(5, 13, 6, 3, NQ.sand);
  },
  bridge: (r) => {
    // 青い水の上を渡る吊り橋。2本の主塔と弧を描くケーブル。
    r(0, 12, 16, 4, NQ.azure);
    r(1, 14, 5, 1, NQ.sky);
    r(9, 13, 6, 1, NQ.sky);
    r(2, 3, 2, 8, NQ.slate);
    r(12, 3, 2, 8, NQ.slate);
    r(1, 7, 14, 2, NQ.cloud);
    r(0, 9, 16, 2, NQ.gray);
    r(4, 4, 2, 1, NQ.silver);
    r(6, 5, 4, 1, NQ.silver);
    r(10, 4, 2, 1, NQ.silver);
    r(3, 5, 1, 2, NQ.silver);
    r(12, 5, 1, 2, NQ.silver);
  },
  tunnel: (r) => {
    // 岩山の暗いアーチ。徒歩用トンネルも同じ入口形状で表す。
    r(4, 2, 8, 2, NQ.tan);
    r(2, 4, 12, 4, NQ.brown);
    r(1, 8, 14, 8, NQ.bark);
    r(4, 7, 8, 9, NQ.ink);
    r(5, 5, 6, 2, NQ.night);
    r(2, 6, 2, 2, NQ.sand);
    r(12, 9, 2, 2, NQ.tan);
    r(7, 11, 2, 2, NQ.gold);
  },
  rail: (r) => {
    // 正面から見た列車と2本のレール。特定事業者の色やロゴは使わない。
    r(4, 2, 8, 9, NQ.silver);
    r(3, 4, 10, 6, NQ.cloud);
    r(5, 3, 6, 3, NQ.navy);
    r(5, 4, 2, 2, NQ.sky);
    r(9, 4, 2, 2, NQ.sky);
    r(5, 8, 2, 2, NQ.gold);
    r(9, 8, 2, 2, NQ.gold);
    r(4, 10, 3, 2, NQ.gray);
    r(9, 10, 3, 2, NQ.gray);
    r(5, 12, 2, 4, NQ.slate);
    r(9, 12, 2, 4, NQ.slate);
    r(3, 14, 10, 1, NQ.bark);
  },
  ferry: (r) => {
    // 港へ着く横向きの小型フェリー。船体・客室・海面を分ける。
    r(0, 13, 16, 3, NQ.azure);
    r(2, 10, 12, 3, NQ.red);
    r(3, 9, 10, 1, NQ.ink);
    r(5, 5, 7, 4, NQ.paper);
    r(6, 6, 2, 2, NQ.sky);
    r(9, 6, 2, 2, NQ.sky);
    r(8, 2, 1, 3, NQ.bark);
    r(9, 2, 3, 2, NQ.white);
    r(1, 13, 5, 1, NQ.white);
    r(9, 14, 6, 1, NQ.sky);
  },
};

const drawOpenMarker = (r: Rect): void => {
  r(12, 0, 4, 4, NQ.green);
  r(13, 1, 2, 2, NQ.lime);
};

const drawClosedBarrier = (r: Rect): void => {
  // 全種類で共通の赤い遮断バー。背景の入口形状を残したまま閉鎖を伝える。
  r(1, 7, 14, 3, NQ.ink);
  r(2, 7, 12, 2, NQ.red);
  for (let x = 3; x < 13; x += 4) r(x, 7, 2, 2, NQ.cream);
  r(7, 5, 2, 7, NQ.brick);
};

const INTER_PREFECTURE_ICONS = Object.fromEntries(
  (Object.keys(INTER_PREFECTURE_BASE) as InterPrefectureIconKind[]).flatMap((kind) =>
    (['open', 'closed'] as const).map((state) => [
      `fld.interpref.${kind}.${state}`,
      (r: Rect) => {
        INTER_PREFECTURE_BASE[kind](r);
        if (state === 'open') drawOpenMarker(r);
        else drawClosedBarrier(r);
      },
    ]),
  ),
) as Record<InterPrefectureIconTextureKey, (r: Rect) => void>;

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
    ...Object.entries(LARGE_ENTRANCES).map(
      ([k, [w, h, d]]) => [k, w, h, d] as [string, number, number, (r: Rect) => void],
    ),
    ...Object.entries(GATES).map(([k, d]) => [k, 16, 16, d] as [string, number, number, (r: Rect) => void]),
    ...Object.entries(INTER_PREFECTURE_ICONS).map(
      ([k, d]) =>
        [k, INTER_PREFECTURE_ICON_SIZE, INTER_PREFECTURE_ICON_SIZE, d] as [
          string,
          number,
          number,
          (r: Rect) => void,
        ],
    ),
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
