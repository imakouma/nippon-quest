/**
 * ニホンクエスト共通パレット「NQ-48」（docs/06_ART_BIBLE.md §3 と同じ 48 色）。
 * 仮のドット絵（コードで描くプレースホルダ）も、画像生成 AI で作る本番素材も、最後はこの色だけに減色する。
 * 色を足すときは、この表と docs/06 と assets/palette/nq48.* を同時に直すこと。
 */
export const NQ = {
  // ── インク・ニュートラル
  ink: '#1a1428', // すべての素材の 1px 輪郭線
  night: '#2e2a45',
  slate: '#4a5063',
  gray: '#6b6f80',
  silver: '#a3aabb',
  cloud: '#d2d7e2',
  paper: '#f4f1e8',
  white: '#ffffff',
  // ── 赤・だいだい（ヒノ）
  brick: '#a8341f',
  red: '#e5484d',
  vermilion: '#f0603c',
  apricot: '#ff9e5e',
  gold: '#ffd23f',
  // ── 黄（ヒカリ）
  ochre: '#c79a1a',
  yellow: '#ffd447',
  cream: '#fff3a3',
  // ── 緑（モリ）
  forest: '#1f5a2e',
  green: '#2a7a36',
  leaf: '#4cbf4c',
  lime: '#8fe36f',
  sprout: '#e8f7a0',
  // ── 青緑（カゼ）
  teal: '#2c8b80',
  aqua: '#58d0bd',
  mint: '#a4f0e2',
  // ── 青（ミズ）
  navy: '#1a2b5e',
  blue: '#1f4fa3',
  azure: '#3d8ef0',
  sky: '#80c6ff',
  ice: '#c8f4ff',
  denim: '#34406b',
  // ── 紫（ヤミ）
  indigo: '#3a2672',
  violet: '#6e4fc4',
  lavender: '#a28be6',
  // ── 茶（ツチ）
  bark: '#3a2a22',
  brown: '#7a5230',
  tan: '#c08a55',
  sand: '#e2b27a',
  beige: '#f4dfb3',
  // ── はだ
  skinLight: '#f6d2b0',
  skinMid: '#e0ac7e',
  skinDark: '#a86e4a',
  // ── かみ
  hairBrown: '#5a3a22',
  hairBlack: '#2b2440',
  hairBlond: '#d9a441',
  // ── アクセント
  blush: '#ff8fb1',
  berry: '#c2405a',
  orange: '#f2a93b',
  amber: '#b8741f',
} as const;

export type NqColor = (typeof NQ)[keyof typeof NQ];

/** 48 色の一覧（docs・パレットファイル・テスト用） */
export const NQ48: readonly string[] = Object.values(NQ);

/** 2 トーンで塗るときの「かげ色」。パレットの外の色を作らないよう、計算せずに表で決める */
export const SHADE: Readonly<Record<string, string>> = {
  [NQ.red]: NQ.brick,
  [NQ.vermilion]: NQ.brick,
  [NQ.azure]: NQ.blue,
  [NQ.leaf]: NQ.green,
  [NQ.violet]: NQ.indigo,
  [NQ.navy]: NQ.ink,
  [NQ.brown]: NQ.bark,
  [NQ.tan]: NQ.brown,
  [NQ.paper]: NQ.cloud,
  [NQ.white]: NQ.cloud,
  [NQ.orange]: NQ.amber,
  [NQ.hairBrown]: NQ.bark,
  [NQ.hairBlack]: NQ.ink,
  [NQ.hairBlond]: NQ.amber,
  [NQ.silver]: NQ.gray,
  [NQ.gold]: NQ.ochre,
  [NQ.teal]: NQ.night,
  [NQ.denim]: NQ.navy,
};

export const shadeOf = (c: string): string => SHADE[c] ?? NQ.ink;
