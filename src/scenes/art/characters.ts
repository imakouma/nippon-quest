/**
 * 人物（主人公・町の人）の仮ドット絵。1 コマ 16×24、全身。docs/06_ART_BIBLE.md §4 の規格どおり。
 *  - 歩行シート 48×96：列 = 右足・立ち・左足、行 = 下・左・右・上
 *  - バトルシート 96×24（左向き）：立ち・右足・左足・こうげき・ダメージ・ばんざい
 * 本番の PNG を同じキー（char.<id> / char.<id>.battle）で先に読み込めば、そちらが優先される（sheet.ts）。
 *
 * 地図の文字（14×22 を 16×24 のまん中に置き、外側に 1 ドットの輪郭線を自動で付ける）
 *   C ぼうし  c ぼうしのかげ  H かみ  h かみのかげ  S はだ  e め  o 線  p ほっぺ
 *   T 服  t 服のかげ  R スカーフ  Y リュック  y リュックのかげ  B ズボン  K くつ
 * 主人公は 24×32 の コマ（HERO_FRAME）で、めいさんひんの そうびを 着ると 絵が かわる（costumes.ts）。
 */
import {
  COSTUME_ART,
  COSTUME_ORDER,
  HERO_FRAME,
  type CostumeArt,
  type CostumePose,
  type CostumeView,
} from './costumes';
import { makeGrid, outline, paint, sheetCanvas, type Grid } from './grid';
import { NQ, shadeOf } from './palette';

export const CHAR_W = 16;
export const CHAR_H = 24;
export const DIRS = ['down', 'left', 'right', 'up'] as const;
export type Dir = (typeof DIRS)[number];

/** 歩行シートのコマ番号（col 0 = 右足、1 = 立ち、2 = 左足） */
export const walkFrame = (dir: Dir, col: 0 | 1 | 2): number => DIRS.indexOf(dir) * 3 + col;

/** バトルシート（左向き）のコマ番号 */
export const BATTLE_POSE = { idle: 0, stepA: 1, stepB: 2, attack: 3, hurt: 4, victory: 5 } as const;

export interface Look {
  hair: string;
  skin: string;
  /** null = ぼうし無し */
  cap: string | null;
  top: string;
  scarf: string | null;
  /** null = リュック無し */
  pack: string | null;
  pants: string;
  shoes: string;
  /** 着ている めいさんひんの そうび（描く じゅん） */
  costumes?: readonly CostumeArt[];
}

// ───────────────────────── 地図（上半身 17 行 + 足 5 行） ─────────────────────────

const FRONT_TOP = [
  '....CCCCCC....',
  '..CCCCCCCCCC..',
  '.CCCCCCCCCCCC.',
  '.cccccccccccc.',
  '.HHSSSSSSSSHH.',
  '.HSSeSSSSeSSH.',
  '.HSSeSSSSeSSH.',
  '.HpSSSSSSSSpH.',
  '..SSSSSSSSSS..',
  '...SSSSSSSS...',
  '....RRRRRR....',
  '..TTYRRRRYTT..',
  '.TTTYTTTTYTTT.',
  '.TTtYTTTTYtTT.',
  '.SS.YTTTTY.SS.',
  '...BBBBBBBB...',
  '...BBBBBBBB...',
] as const;

const BACK_TOP = [
  '....CCCCCC....',
  '..CCCCCCCCCC..',
  '.CCCCCCCCCCCC.',
  '.CCCCCccCCCCC.',
  '.HHHHHHHHHHHH.',
  '.HHHHHHHHHHHH.',
  '.HHHHHHHHHHHH.',
  '.SHHHHHHHHHHS.',
  '..hHHHHHHHHh..',
  '...hhhhhhhh...',
  '....TTTTTT....',
  '..TTYYYYYYTT..',
  '.TTTYYYYYYTTT.',
  '.TTtYyyyyYtTT.',
  '.SS.YYYYYY.SS.',
  '...BBBBBBBB...',
  '...BBBBBBBB...',
] as const;

const SIDE_TOP = [
  '.....CCCCCC...',
  '...CCCCCCCCCC.',
  '..CCCCCCCCCCC.',
  'cccccccCCCCCC.',
  '..SSSSSHHHHHH.',
  '..SeSSSSHHHHH.',
  '..SeSSSSHHHHH.',
  '..SpSSSSSHHHH.',
  '...SSSSSSHHH..',
  '....SSSSSS....',
  '.....RRRTT....',
  '....RRTTTYYY..',
  '....TTTTTYYYY.',
  '....TTSSTYYYY.',
  '.....TSSTyyy..',
  '.....BBBBBB...',
  '.....BBBBBB...',
] as const;

/** ぼうし無しのときの頭のてっぺん（上 4 行を差し替える） */
const NOCAP_FRONT = ['....HHHHHH....', '..HHHHHHHHHH..', '.HHHHHHHHHHHH.', '.HHHHHHHHHHHH.'] as const;
const NOCAP_SIDE = ['.....HHHHHH...', '...HHHHHHHHHH.', '..HHHHHHHHHHH.', '..HHHHHHHHHHH.'] as const;

const FRONT_LEGS = {
  stepA: ['...BBB..BBB...', '....SS..SS....', '....SS..KKK...', '...KKK..KKK...', '...KKK........'],
  idle: ['...BBB..BBB...', '....SS..SS....', '....SS..SS....', '...KKK..KKK...', '...KKK..KKK...'],
  stepB: ['...BBB..BBB...', '....SS..SS....', '...KKK..SS....', '...KKK..KKK...', '........KKK...'],
} as const;

const SIDE_LEGS = {
  stepA: ['....BBBBBB....', '....SS...SS...', '...SS.....SS..', '..KKK.....KKK.', '..KKK.........'],
  idle: ['.....BBBBB....', '......SSS.....', '......SSS.....', '....KKKKK.....', '....KKKKK.....'],
  stepB: ['....BBBBBB....', '....SS...SS...', '...SS.....SS..', '..KKK.....KKK.', '..........KKK.'],
} as const;

// バトル用のポーズ（左向き）。上半身の 10〜14 行目だけ差し替える
const POSE_ATTACK_ARMS = [
  '.....RRRTT....',
  '....RRTTTYYY..',
  'SSTTTTTTTYYYY.',
  '....TTTTTYYYY.',
  '.....TTTTyyy..',
] as const;
const POSE_HURT_FACE = ['..SoSSSSHHHHH.', '..SSSSSSHHHHH.'] as const;
const POSE_VICTORY = [
  '....CCCCCC....',
  '..CCCCCCCCCC..',
  '.CCCCCCCCCCCC.',
  '.cccccccccccc.',
  '.HHSSSSSSSSHH.',
  '.HSSeSSSSeSSH.',
  '.HSSSSSSSSSSH.',
  '.HpSSSSSSSSpH.',
  '..SSSSooSSSS..',
  'SS.SSSSSSSS.SS',
  'TT..RRRRRR..TT',
  '.TTTYRRRRYTTT.',
  '..TTYTTTTYTT..',
  '..TtYTTTTYtT..',
  '....YTTTTY....',
  '...BBBBBBBB...',
  '...BBBBBBBB...',
] as const;

/** テスト用：すべての地図（1 行 14 文字・上半身 17 行・足 5 行であること） */
export const CHAR_MAPS = {
  tops: [FRONT_TOP, BACK_TOP, SIDE_TOP, POSE_VICTORY],
  caps: [NOCAP_FRONT, NOCAP_SIDE],
  legs: [...Object.values(FRONT_LEGS), ...Object.values(SIDE_LEGS)],
  parts: [POSE_ATTACK_ARMS, POSE_HURT_FACE],
};

// ───────────────────────── 見た目 ─────────────────────────

/** 主人公の見た目（GameState.player.appearance の番号 → 色）。GDD §2.3 の 3×3×3 */
export const HERO_HAIR = [NQ.hairBrown, NQ.hairBlack, NQ.hairBlond] as const;
export const HERO_SKIN = [NQ.skinLight, NQ.skinMid, NQ.skinDark] as const;
export const HERO_CLOTH = [NQ.red, NQ.azure, NQ.leaf] as const;

/** GameState.player.appearance */
export interface HeroAppearance {
  hair: number;
  skin: number;
  cloth: number;
}

/** GameState.player.equipment（部位 → どうぐの id） */
export type HeroEquipment = Readonly<Partial<Record<string, string | undefined>>>;

/** 着ている めいさんひんの そうびの id（描く じゅん。絵の ある ものだけ） */
export function heroCostumeIds(equipment: HeroEquipment = {}): string[] {
  const ids = Object.values(equipment).filter((id): id is string => !!id && !!COSTUME_ART[id]);
  const rank = (id: string) => COSTUME_ORDER.indexOf(COSTUME_ART[id]!.slot);
  return ids.sort((a, b) => rank(a) - rank(b));
}

export function heroLook(a: HeroAppearance, equipment: HeroEquipment = {}): Look {
  const cloth = HERO_CLOTH[a.cloth] ?? NQ.red;
  const costumes = heroCostumeIds(equipment).map((id) => COSTUME_ART[id]!);
  return {
    costumes,
    hair: HERO_HAIR[a.hair] ?? NQ.hairBrown,
    skin: HERO_SKIN[a.skin] ?? NQ.skinLight,
    // 頭の そうびを かぶったら ぼうしは ぬぐ
    cap: costumes.some((c) => c.slot === 'head') ? null : cloth,
    top: NQ.paper,
    scarf: cloth,
    pack: NQ.orange,
    pants: NQ.denim,
    shoes: NQ.bark,
  };
}

/** 町の人（NPC の役割ごとの服の色）。本番のドット絵ができるまでの見分け用 */
export const NPC_LOOKS: Readonly<Record<string, Look>> = {
  shop: {
    hair: NQ.hairBlack,
    skin: NQ.skinLight,
    cap: null,
    top: NQ.leaf,
    scarf: NQ.paper,
    pack: null,
    pants: NQ.bark,
    shoes: NQ.bark,
  },
  smith: {
    hair: NQ.hairBrown,
    skin: NQ.skinMid,
    cap: NQ.paper,
    top: NQ.brown,
    scarf: NQ.red,
    pack: null,
    pants: NQ.bark,
    shoes: NQ.ink,
  },
  inn: {
    hair: NQ.hairBlond,
    skin: NQ.skinLight,
    cap: null,
    top: NQ.azure,
    scarf: NQ.paper,
    pack: null,
    pants: NQ.denim,
    shoes: NQ.bark,
  },
  board: {
    hair: NQ.hairBlack,
    skin: NQ.skinMid,
    cap: NQ.violet,
    top: NQ.violet,
    scarf: NQ.gold,
    pack: null,
    pants: NQ.denim,
    shoes: NQ.bark,
  },
  dex: {
    hair: NQ.silver,
    skin: NQ.skinLight,
    cap: null,
    top: NQ.white,
    scarf: NQ.azure,
    pack: null,
    pants: NQ.slate,
    shoes: NQ.bark,
  },
  arena: {
    hair: NQ.hairBrown,
    skin: NQ.skinDark,
    cap: NQ.navy,
    top: NQ.navy,
    scarf: NQ.gold,
    pack: null,
    pants: NQ.paper,
    shoes: NQ.ink,
  },
  talk: {
    hair: NQ.hairBrown,
    skin: NQ.skinLight,
    cap: null,
    top: NQ.red,
    scarf: NQ.paper,
    pack: null,
    pants: NQ.denim,
    shoes: NQ.bark,
  },
};

// ───────────────────────── 組み立て ─────────────────────────

function colorsOf(l: Look): Record<string, string> {
  const topShade = shadeOf(l.top);
  return {
    C: l.cap ?? l.hair,
    c: shadeOf(l.cap ?? l.hair),
    H: l.hair,
    h: shadeOf(l.hair),
    S: l.skin,
    e: NQ.ink,
    o: NQ.ink,
    p: NQ.blush,
    T: l.top,
    t: topShade,
    R: l.scarf ?? l.top,
    Y: l.pack ?? l.top,
    y: l.pack ? shadeOf(l.pack) : topShade,
    B: l.pants,
    K: l.shoes,
    ...Object.assign({}, ...(l.costumes ?? []).map((c) => c.colors ?? {})),
  };
}

type Rows = readonly string[];

/** ぼうし無しなら 上 4 行を かみに 差し替える */
function capped(top: Rows, l: Look, side: boolean): string[] {
  if (l.cap) return [...top];
  const head = side ? NOCAP_SIDE : NOCAP_FRONT;
  return [...head, ...top.slice(head.length)];
}

/** コマの 大きさと、人物の 地図（14×22）を 置く 場所 */
interface FrameSize {
  w: number;
  h: number;
  ox: number;
  oy: number;
}
const NPC_FRAME: FrameSize = { w: CHAR_W, h: CHAR_H, ox: 1, oy: 1 };

/** 足の 地図に そうびの legMap を かける（先に 差し替えた 文字には あとの そうびは さわらない） */
function dressLegs(legs: Rows, costumes: readonly CostumeArt[]): string[] {
  return legs.map((row) =>
    [...row]
      .map((ch) => {
        for (const c of costumes) {
          const to = c.legMap?.[ch];
          if (to) return to;
        }
        return ch;
      })
      .join(''),
  );
}

interface FrameOpts {
  size: FrameSize;
  view: CostumeView;
  pose: CostumePose;
  /** 右向き：左向きで 描いてから 左右反転 */
  mirror?: boolean;
}

function frame(top: Rows, legs: Rows, l: Look, colors: Record<string, string>, o: FrameOpts): Grid {
  const costumes = l.costumes ?? [];
  const g = makeGrid(o.size.w, o.size.h);
  paint(g, [...top, ...dressLegs(legs, costumes)], colors, o.size.ox, o.size.oy);
  for (const c of costumes) c.draw?.(g, o.view, o.pose, colors);
  outline(g, NQ.ink);
  if (o.mirror) for (const row of g) row.reverse();
  return g;
}

const VIEW: Record<Dir, CostumeView> = { down: 'front', up: 'back', left: 'side', right: 'side' };

function tops(l: Look): Record<Dir, string[]> {
  const side = capped(SIDE_TOP, l, true);
  return {
    down: capped(FRONT_TOP, l, false),
    left: side,
    right: side,
    up: capped(BACK_TOP, l, false),
  };
}

function legs(dir: Dir): [Rows, Rows, Rows] {
  if (dir === 'left' || dir === 'right') return [SIDE_LEGS.stepA, SIDE_LEGS.idle, SIDE_LEGS.stepB];
  return [FRONT_LEGS.stepA, FRONT_LEGS.idle, FRONT_LEGS.stepB];
}

/** 歩行シート。町の人は 1 コマ 16×24、hero＝true（主人公）は 24×32（HERO_FRAME） */
export function walkSheet(l: Look, hero = false): HTMLCanvasElement {
  const colors = colorsOf(l);
  const t = tops(l);
  const size = hero ? HERO_FRAME : NPC_FRAME;
  const frames = DIRS.flatMap((d) =>
    legs(d).map((lg) =>
      frame(t[d], lg, l, colors, { size, view: VIEW[d], pose: 'walk', mirror: d === 'right' }),
    ),
  );
  return sheetCanvas(frames, 3);
}

/** 主人公の バトルシート（1 コマ 24×32、左向き）。サイドビューの戦闘で使う */
export function battleSheet(l: Look): HTMLCanvasElement {
  const colors = colorsOf(l);
  const side = tops(l).left;
  const replace = (rows: string[], at: number, part: Rows) => [
    ...rows.slice(0, at),
    ...part,
    ...rows.slice(at + part.length),
  ];
  const size = HERO_FRAME;
  const f = (top: Rows, lg: Rows, view: CostumeView, pose: CostumePose) =>
    frame(top, lg, l, colors, { size, view, pose });
  const frames = [
    f(side, SIDE_LEGS.idle, 'side', 'walk'),
    f(side, SIDE_LEGS.stepA, 'side', 'walk'),
    f(side, SIDE_LEGS.stepB, 'side', 'walk'),
    f(replace(side, 10, POSE_ATTACK_ARMS), SIDE_LEGS.stepA, 'side', 'attack'),
    f(replace(side, 5, POSE_HURT_FACE), SIDE_LEGS.idle, 'side', 'hurt'),
    f(capped(POSE_VICTORY, l, false), FRONT_LEGS.idle, 'front', 'victory'),
  ];
  return sheetCanvas(frames, frames.length);
}

/** 主人公の コマの 大きさ と、足もと（タイルの まん中に くる 高さ）の origin */
export const HERO_W = HERO_FRAME.w;
export const HERO_H = HERO_FRAME.h;
export const HERO_FEET_ORIGIN_Y = (HERO_FRAME.oy - 1 + 16) / HERO_FRAME.h;

/** テクスチャのキー（見た目・着ている めいさんひんの そうびごとに別キー。本番 PNG は char.hero / char.hero.battle） */
export const heroKey = (a: HeroAppearance, equipment: HeroEquipment = {}, battle = false): string => {
  const wear = heroCostumeIds(equipment);
  return `char.hero.${a.hair}${a.skin}${a.cloth}${wear.length ? `.${wear.join('+')}` : ''}${battle ? '.battle' : ''}`;
};
