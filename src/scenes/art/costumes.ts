/**
 * めいさんひんの そうび（県の 名所スタンプを ぜんぶ あつめた ごほうび）を 着た 主人公の 絵。
 * そうびの id → 絵。ロジックは src/core/progression/meisan.ts、しくみは characters.ts の heroLook / walkSheet。
 *
 * 主人公の コマは 町の人（16×24）より 大きい 24×32（HERO_FRAME）。上に 8 ドット・左右に 4 ドットの よゆうが あり、
 * 頭の かぶりものや 体の きぐるみを 体より 大きく 描ける（ぱっと 見て かわったと わかるように）。
 *  - legMap：足の 地図の 文字を 差し替える（ズボン B・すね S・くつ K）。あとの そうびほど 先に 使った 文字には さわらない
 *  - draw：コマの マス目に じかに 描く（左向き。右向きは コマごと 左右反転する）
 */
import { put, type Grid } from './grid';
import { NQ } from './palette';

/** 主人公の コマ（24×32）。人物の 地図（14×22）を (ox, oy) に 置く */
export const HERO_FRAME = { w: 24, h: 32, ox: 5, oy: 9 } as const;

export type CostumeView = 'front' | 'back' | 'side';
export type CostumePose = 'walk' | 'attack' | 'hurt' | 'victory';
export type CostumeSlot = 'head' | 'chest' | 'legs' | 'feet';

export interface CostumeArt {
  slot: CostumeSlot;
  /** legMap で 使う 文字の 色 */
  colors?: Readonly<Record<string, string>>;
  legMap?: Readonly<Record<string, string>>;
  /** base＝人物の 色（S＝はだ など） */
  draw?: (g: Grid, view: CostumeView, pose: CostumePose, base: Readonly<Record<string, string>>) => void;
}

/** 描く じゅん（あとの ものが 上に のる） */
export const COSTUME_ORDER: readonly CostumeSlot[] = ['legs', 'feet', 'chest', 'head'];

/** だ円を ぬる。col(x, y, dx) で 1 マスずつ 色を きめる（dx は 中心からの よこの ずれ ÷ 半径） */
function oval(
  g: Grid,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  y0: number,
  y1: number,
  col: (x: number, y: number, dx: number) => string,
): void {
  for (let y = y0; y <= y1; y++) {
    const t = (y - cy) / ry;
    if (Math.abs(t) > 1) continue;
    const hw = rx * Math.sqrt(1 - t * t);
    for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) put(g, x, y, col(x, y, (x - cx) / rx));
  }
}

// ───────────────────────── 北海道：夕張[ゆうばり]メロン（頭） ─────────────────────────

/** あみめの ある 大きな メロンを 頭に かぶる。ふちは 夕張メロンの オレンジの 実、上に つると 葉っぱ */
function drawYubariMelon(g: Grid, view: CostumeView): void {
  const cx = view === 'side' ? 12 : 11.5;
  const rim = 12;
  const rx = 9;
  // まるい メロン（下を すこし きりとって 頭に のせる）。かわ・あらい あみめ（ななめの こうし）・右がわは かげ・左上は ひかり
  oval(g, cx, 9, rx, 8, 2, rim - 1, (x, y, dx) => {
    if ((x + y) % 6 === 0 || (x - y + 120) % 6 === 0) return NQ.sprout;
    if (dx < -0.3 && y <= 5) return NQ.lime;
    return dx > 0.45 ? NQ.green : NQ.leaf;
  });
  // ふち：夕張メロンの オレンジの 実
  const t = (rim - 9) / 8;
  const hw = rx * Math.sqrt(1 - t * t);
  for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++)
    put(g, x, rim, x > cx + 3 ? NQ.amber : NQ.orange);
  // つると 葉っぱ
  const sx = Math.floor(cx);
  put(g, sx, 1, NQ.brown);
  put(g, sx - 1, 0, NQ.brown);
  put(g, sx + 1, 1, NQ.leaf);
  put(g, sx + 2, 1, NQ.leaf);
  put(g, sx + 2, 0, NQ.green);
}

// ───────────────────────── 青森：青森りんご（体） ─────────────────────────

/** まっかな りんごの きぐるみ。体より ひとまわり 大きく、手だけ 出る。上に じくと 葉っぱ */
function drawAomoriRingo(
  g: Grid,
  view: CostumeView,
  pose: CostumePose,
  base: Readonly<Record<string, string>>,
): void {
  const side = view === 'side';
  const cx = side ? 12 : 11.5;
  const rx = side ? 6.5 : 8;
  oval(g, cx, 23, rx, 4.4, 19, 27, (_x, _y, dx) => (dx > 0.4 ? NQ.berry : NQ.red));
  // ひかり（うしろ姿でも まるく 見えるように）
  put(g, Math.round(cx - rx + 3), 21, NQ.white);
  put(g, Math.round(cx - rx + 2), 22, NQ.white);
  // じく と 葉っぱ（あごの 右よこ）
  put(g, Math.floor(cx) + 1, 19, NQ.brown);
  put(g, Math.floor(cx) + 5, 18, NQ.leaf);
  put(g, Math.floor(cx) + 6, 18, NQ.leaf);
  put(g, Math.floor(cx) + 6, 17, NQ.green);
  // 手（ばんざいの ときは 上に 出ている）
  const skin = base.S ?? NQ.skinLight;
  if (pose === 'victory') return;
  if (side) {
    const hy = pose === 'attack' ? 21 : 23;
    put(g, 5, hy, skin);
    if (pose === 'attack') put(g, 4, hy, skin);
    return;
  }
  for (const hx of [3, 20]) {
    put(g, hx, 23, skin);
    put(g, hx, 24, skin);
  }
}

// ───────────────────────── 岩手：南部鉄器[なんぶてっき]（くつ） ─────────────────────────

/** くろがねの 大きな ブーツ（すねまで）。足もとを 1 ドットずつ ひろげて どっしり 見せる */
function widenBoots(g: Grid): void {
  const boot = NQ.slate;
  for (let y = HERO_FRAME.oy + 19; y <= HERO_FRAME.oy + 21; y++) {
    const row = g[y]!;
    const xs = row.flatMap((c, x) => (c === boot ? [x] : []));
    for (const x of xs) {
      if (row[x - 1] === null) put(g, x - 1, y, boot);
      if (row[x + 1] === null) put(g, x + 1, y, boot);
    }
  }
  // ふちの ひかり（てつの つや）
  const top = HERO_FRAME.oy + 18;
  g[top]?.forEach((c, x) => c === boot && x % 2 === 0 && put(g, x, top, NQ.silver));
}

export const COSTUME_ART: Readonly<Record<string, CostumeArt>> = {
  'hokkaido-meisan-yubari-melon': { slot: 'head', draw: drawYubariMelon },
  'aomori-meisan-ringo': { slot: 'chest', draw: drawAomoriRingo },
  // 秋田：曲[ま]げわっぱ（すぎの 木の すねあて）。ひざから 下が 木の いろ
  'akita-meisan-magewappa': {
    slot: 'legs',
    colors: { g: NQ.tan, G: NQ.sand },
    legMap: { B: 'g', S: 'G' },
  },
  'iwate-meisan-nanbu-tekki': {
    slot: 'feet',
    colors: { F: NQ.slate },
    legMap: { K: 'F', S: 'F' },
    draw: widenBoots,
  },
};
