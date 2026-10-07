/**
 * 8×8 のドットアイコン（属性・教科・コマンド・フィールドの看板・名所の種類）。
 * 絵文字はドットの世界から浮くので使わない。フィールドでは ×1（カメラで ×2）、DOM では ×2〜×6 で表示する。
 * 'o' は輪郭線（ink）。ほかの文字は各アイコンの色表。
 */
import { makeGrid, paint, toCanvas } from './grid';
import { NQ } from './palette';

export interface IconDef {
  rows: readonly string[];
  colors: Readonly<Record<string, string>>;
}

const icon = (rows: string[], colors: Record<string, string>): IconDef => ({ rows, colors });

const STAR = icon(
  ['...o....', '..oYo...', 'ooYYYoo.', 'oYYYYYo.', '.oYYYo..', '.oYoYo..', '.oo.oo..', '........'],
  {
    Y: NQ.gold,
  },
);
const SWORD = icon(
  ['......oo', '.....oWo', '....oWo.', '.o.oWo..', '.ooWo...', '..oBo...', '.oBoo...', 'oo..o...'],
  {
    W: NQ.cloud,
    B: NQ.brown,
  },
);
const BAG = icon(
  ['..oooo..', '.oBooBo.', 'oooooooo', 'oTTTTTTo', 'oTTooTTo', 'oTTTTTTo', 'oTTTTTTo', '.oooooo.'],
  {
    B: NQ.amber,
    T: NQ.orange,
  },
);

export const ICONS: Readonly<Record<string, IconDef>> = {
  // ── 属性
  'el-hino': icon(
    ['...o....', '..oRo...', '..oRRo..', '.oRYRo..', '.oRYYRo.', 'oRYYYYRo', 'oRRYYRRo', '.oooooo.'],
    {
      R: NQ.vermilion,
      Y: NQ.gold,
    },
  ),
  'el-mizu': icon(
    ['...oo...', '..oBBo..', '.oBBBBo.', '.oBWBBo.', 'oBWBBBBo', 'oBBBBBBo', '.oBBBBo.', '..oooo..'],
    {
      B: NQ.azure,
      W: NQ.ice,
    },
  ),
  'el-mori': icon(
    ['.....oo.', '...ooGGo', '..oGGGGo', '.oGGLGGo', '.oGLGGo.', 'oGLGoo..', 'oLoo....', '.o......'],
    {
      G: NQ.leaf,
      L: NQ.green,
    },
  ),
  'el-tsuchi': icon(
    ['..oooo..', '.oTTTSo.', 'oTTSTTTo', 'oTTTTSTo', 'oSTTTTTo', 'oTTSTTSo', '.oTTTTo.', '..oooo..'],
    {
      T: NQ.tan,
      S: NQ.brown,
    },
  ),
  'el-kaze': icon(
    ['........', '.oooo...', 'oMMMMoo.', '.ooooMo.', 'ooooooMo', 'oMMMMMo.', '.ooooo..', '........'],
    {
      M: NQ.aqua,
    },
  ),
  'el-hikari': icon(
    ['...oo...', '...YY...', '..oYYo..', 'oYYWWYYo', 'oYYWWYYo', '..oYYo..', '...YY...', '...oo...'],
    {
      Y: NQ.yellow,
      W: NQ.white,
    },
  ),
  'el-yami': icon(
    ['..ooo...', '.oVVo...', 'oVVo....', 'oVVo....', 'oVVo....', 'oVVVo...', '.oVVVoo.', '..ooooo.'],
    {
      V: NQ.violet,
    },
  ),
  'el-none': icon(
    ['..oooo..', '.oGGGGo.', 'oGGWGGGo', 'oGWGGGGo', 'oGGGGGGo', 'oGGGGGGo', '.oGGGGo.', '..oooo..'],
    {
      G: NQ.silver,
      W: NQ.white,
    },
  ),
  // ── 教科
  'subj-sansu': icon(
    ['oooooooo', 'oBBBBBBo', 'oBBWWBBo', 'oBWWWWBo', 'oBWWWWBo', 'oBBWWBBo', 'oBBBBBBo', 'oooooooo'],
    {
      B: NQ.azure,
      W: NQ.white,
    },
  ),
  'subj-kokugo': icon(
    ['.oooooo.', 'oRRRRRWo', 'oRWWWRWo', 'oRRRRRWo', 'oRWWWRWo', 'oRRRRRWo', 'oRRRRRWo', '.oooooo.'],
    {
      R: NQ.red,
      W: NQ.paper,
    },
  ),
  'subj-rika': icon(
    ['..oooo..', '...oo...', '...oo...', '..oWWo..', '.oWWWWo.', 'oGGGGGGo', 'oGGWGGGo', '.oooooo.'],
    {
      W: NQ.ice,
      G: NQ.aqua,
    },
  ),
  'subj-shakai': icon(
    ['..oooo..', '.oRRRRo.', 'oRRWWRRo', 'oRRWWRRo', '.oRRRRo.', '..oRRo..', '...oo...', '........'],
    {
      R: NQ.orange,
      W: NQ.white,
    },
  ),
  'subj-seikatsu': icon(
    ['........', '.oo..oo.', 'oLLooLLo', '.oLLLLo.', '...oo...', '...oo...', '.oooooo.', 'oBBBBBBo'],
    {
      L: NQ.lime,
      B: NQ.brown,
    },
  ),
  'subj-eigo': icon(
    ['oooooooo', 'oWWWWWWo', 'oWWooWWo', 'oWoWWoWo', 'oWooooWo', 'oWoWWoWo', 'ooooWooo', '....oo..'],
    {
      W: NQ.lavender,
    },
  ),
  // ── バトルのコマンド
  'cmd-attack': SWORD,
  'cmd-skill': STAR,
  'cmd-item': BAG,
  'cmd-swap': icon(
    ['....o...', 'oooooo..', 'oWWWWWo.', 'oooooo..', '..o.....', '..oooooo', '.oWWWWWo', '..oooooo'],
    {
      W: NQ.sky,
    },
  ),
  'cmd-flee': icon(
    ['...o....', '...oo...', 'ooooWo..', 'oWWWWWo.', 'oWWWWWo.', 'ooooWo..', '...oo...', '...o....'],
    {
      W: NQ.mint,
    },
  ),
  'cmd-recruit': icon(
    ['.oo..oo.', 'oRRooRRo', 'oRWRRRRo', 'oRRRRRRo', '.oRRRRo.', '..oRRo..', '...oo...', '........'],
    {
      R: NQ.blush,
      W: NQ.white,
    },
  ),
  // ── バトルの窓
  hero: icon(
    ['..oooo..', '.oRRRRo.', 'oRRRRRRo', 'oooooooo', 'oSSSSSSo', 'oSoSSoSo', 'oSSSSSSo', '.oooooo.'],
    {
      R: NQ.red,
      S: NQ.skinLight,
    },
  ),
  coin: icon(
    ['..oooo..', '.oYYYYo.', 'oYWYYYOo', 'oYWYYYOo', 'oYYYYYOo', 'oYYYYOOo', '.oOOOOo.', '..oooo..'],
    {
      Y: NQ.gold,
      W: NQ.cream,
      O: NQ.ochre,
    },
  ),
  // ── フィールドの看板
  town: icon(
    ['...oo...', '..oRRo..', '.oRRRRo.', 'oRRRRRRo', '.oWWWWo.', '.oWooWo.', '.oWooWo.', '.oooooo.'],
    {
      R: NQ.red,
      W: NQ.beige,
    },
  ),
  field: icon(
    ['..oooo..', '.oGGGGo.', 'oGLGGGGo', 'oGGGGLGo', '.oGGGGo.', '..oooo..', '...oBo..', '..ooooo.'],
    {
      G: NQ.leaf,
      L: NQ.lime,
      B: NQ.brown,
    },
  ),
  dungeon: icon(
    ['..oooo..', '.oSSSSo.', 'oSSooSSo', 'oSooooSo', 'oSooooSo', 'oSooooSo', 'oSooooSo', 'oooooooo'],
    {
      S: NQ.silver,
    },
  ),
  ship: icon(
    ['...oo...', '...oWo..', '...oWWo.', '...oWWWo', '...o....', 'oooooooo', '.oBBBBo.', '..oooo..'],
    {
      W: NQ.white,
      B: NQ.brown,
    },
  ),
  gate: icon(
    ['...oo...', '..oYYo..', '..oYYo..', '.oYooYo.', '.oYooYo.', 'oYYYYYYo', 'oYYooYYo', 'oooooooo'],
    {
      Y: NQ.yellow,
    },
  ),
  chest: icon(
    ['.oooooo.', 'oAAAAAAo', 'oAAYYAAo', 'oooYYooo', 'oAAAAAAo', 'oAAAAAAo', 'oAAAAAAo', 'oooooooo'],
    {
      A: NQ.amber,
      Y: NQ.gold,
    },
  ),
  star: STAR,
  /** まだ見つけていない名所（にほんちずの一覧） */
  'star-off': { rows: STAR.rows, colors: { Y: NQ.gray } },
  boss: icon(
    ['........', 'oo.oo.oo', 'oYoYYoYo', 'oYYYYYYo', 'oYRYYRYo', 'oYYYYYYo', 'oooooooo', '........'],
    {
      Y: NQ.gold,
      R: NQ.red,
    },
  ),
  warp: icon(
    ['..oooo..', '.oVVVVo.', 'oVLLLLVo', 'oVLWWLVo', 'oVLWWLVo', 'oVLLLLVo', '.oVVVVo.', '..oooo..'],
    {
      V: NQ.violet,
      L: NQ.lavender,
      W: NQ.white,
    },
  ),
  map: icon(
    ['oooooooo', 'oBBGGBBo', 'oBGGGGBo', 'oBBGGBBo', 'oBBBGBBo', 'oBBBBBBo', 'oBBBBBBo', 'oooooooo'],
    {
      B: NQ.sky,
      G: NQ.leaf,
    },
  ),
  speaker: icon(
    ['....o...', '...oWo..', 'oooWWo.o', 'oWWWWo..', 'oWWWWo.o', 'oooWWo..', '...oWo.o', '....o...'],
    {
      W: NQ.white,
    },
  ),
  // ── 町の人の役割
  'role-barber': icon(
    ['o......o', '.o....o.', '..o..o..', '...oo...', '..o..o..', '.o.oo.o.', 'o..oo..o', '........'],
    { o: NQ.silver },
  ),
  'role-shop': BAG,
  'role-smith': icon(
    ['.ooooo..', 'oSSSSSo.', 'oSSSSSo.', '.oooBo..', '...oBo..', '...oBo..', '...oBo..', '...ooo..'],
    {
      S: NQ.silver,
      B: NQ.brown,
    },
  ),
  'role-inn': icon(
    ['oooooooo', 'oWWWWWWo', 'ooooWWo.', '..oWWo..', '.oWWo...', 'oWWoooo.', 'oWWWWWWo', 'oooooooo'],
    {
      W: NQ.sky,
    },
  ),
  'role-board': icon(
    ['oooooooo', 'oWWWWWWo', 'oWooooWo', 'oWWWWWWo', 'oWooooWo', 'oWWWWWWo', 'oWoooWWo', 'oooooooo'],
    {
      W: NQ.beige,
    },
  ),
  'role-dex': icon(
    ['.oooooo.', 'oBBBBBWo', 'oBWWWBWo', 'oBBBBBWo', 'oBWWWBWo', 'oBBBBBWo', 'oBBBBBWo', '.oooooo.'],
    {
      B: NQ.azure,
      W: NQ.paper,
    },
  ),
  'role-arena': SWORD,
  'role-talk': icon(
    ['.oooooo.', 'oWWWWWWo', 'oWoWWoWo', 'oWWWWWWo', '.ooWoooo', '..oWo...', '..oo....', '........'],
    {
      W: NQ.white,
    },
  ),
  // ── 名所の種類（カットインの絵が無いときの代わり）
  'motif-landmark': icon(
    ['o.o..o.o', 'oooooooo', '.oSSSSo.', '.oSooSo.', '.oSSSSo.', 'oSSSSSSo', 'oSSooSSo', 'oooooooo'],
    {
      S: NQ.beige,
    },
  ),
  'motif-food': icon(
    ['...oo...', '..oWWo..', '.oWWWWo.', '.oWWWWo.', 'oWWWWWWo', 'oWKKKKWo', 'oWKKKKWo', '.oooooo.'],
    {
      W: NQ.white,
      K: NQ.forest,
    },
  ),
  'motif-craft': icon(
    ['..oooo..', '.oBBBBo.', 'oooooooo', 'oBBRRBBo', 'oBRRRRBo', 'oBBRRBBo', '.oBBBBo.', '..oooo..'],
    {
      B: NQ.bark,
      R: NQ.red,
    },
  ),
  'motif-nature': icon(
    ['........', '...oo...', '..oWWo..', '.oWSSSo.', '.oSSSSo.', 'oSSGSSSo', 'oSGGGSSo', 'oooooooo'],
    {
      W: NQ.white,
      S: NQ.slate,
      G: NQ.leaf,
    },
  ),
  'motif-festival': icon(
    ['...oo...', '..oRRo..', '.oRYYRo.', '.oRYYRo.', '.oRYYRo.', '..oRRo..', '...oo...', '...o....'],
    {
      R: NQ.red,
      Y: NQ.gold,
    },
  ),
  'motif-history': icon(
    ['oooooooo', 'oSWWWWSo', 'oSWooWSo', 'oSWWWWSo', 'oSWooWSo', 'oSWWWWSo', 'oSWWWWSo', 'oooooooo'],
    {
      S: NQ.tan,
      W: NQ.beige,
    },
  ),
};

export const ICON_SIZE = 8;

export function iconCanvas(name: string): HTMLCanvasElement | null {
  const d = ICONS[name];
  if (!d) return null;
  const g = makeGrid(ICON_SIZE, ICON_SIZE);
  paint(g, d.rows, { o: NQ.ink, ...d.colors });
  return toCanvas(g);
}

const urls = new Map<string, string>();

/** DOM で使う data URL（<img> を image-rendering: pixelated で拡大する） */
export function iconUrl(name: string): string | null {
  const hit = urls.get(name);
  if (hit) return hit;
  const c = iconCanvas(name);
  if (!c) return null;
  const u = c.toDataURL();
  urls.set(name, u);
  return u;
}
