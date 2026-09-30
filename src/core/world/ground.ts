/**
 * フィールドの 地面の 性質（docs/00_GAME_DESIGN.md §2.2）。
 * scripts/scaffold-maps.ts が 地形（海・湖・丘・山からの きょり）から マスごとの 地面を 決めて、background の タイルで 描く。
 * Overworld は 立っている マスの タイルから 地面を 読み、その 地面の 出現表（content の encounters の zone）で
 * モンスターを 出す（すなはまなら 海の モンスター、もりなら 森の モンスター）。バトルの 背景も 地面で かわる。
 */
export const GROUNDS = ['grass', 'forest', 'mountain', 'beach', 'shore', 'farm'] as const;
export type Ground = (typeof GROUNDS)[number];

/**
 * 地面 → background の タイル番号（絵は src/scenes/overworld/fieldArt.ts）。
 * farm は たんぼ（155・156）と 果樹園（157 = りんご・さくらんぼ、158 = もも）。県ごとに scaffold-maps.ts が えらぶ
 */
export const GROUND_TILES: Record<Ground, readonly number[]> = {
  grass: [1, 14, 13],
  forest: [149, 150],
  mountain: [151, 152],
  beach: [147, 148],
  shore: [153, 154],
  farm: [155, 156, 157, 158],
};

/** 名所エリアの さかいの 山なみ（通れない。地面では ない） */
export const RIDGE_TILE = 159;

/** 地面の 性質が できる前の 丘（11）・高い山（12）の タイルも 地面に 数える */
const TILE_GROUND = new Map<number, Ground>([
  ...GROUNDS.flatMap((g) => GROUND_TILES[g].map((t) => [t, g] as const)),
  [11, 'forest'],
  [12, 'mountain'],
  // 名所エリアの 見た目：さくらの 木（草原）・恐山の 砂地と ゆけむり（やま）
  [160, 'grass'],
  // 道（草原の 上の 土の 道）
  [163, 'grass'],
  [161, 'mountain'],
  [162, 'mountain'],
]);

/** background の タイル番号 → 地面（町の石だたみ・水 など 地面で ない タイルは null） */
export const groundOfTile = (tile: number | undefined): Ground | null =>
  tile === undefined ? null : (TILE_GROUND.get(tile) ?? null);
