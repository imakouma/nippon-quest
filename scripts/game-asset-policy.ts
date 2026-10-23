import { sep } from 'node:path';

const NON_GAME_ASSET_PREFIXES = ['assets/cinematics/'] as const;

/** ゲーム本体の配布・カタログ・権利監査に含める素材かを判定する。 */
export function isGameAssetPath(path: string): boolean {
  const normalized = path.split(sep).join('/').replace(/^\.\//, '');
  return !NON_GAME_ASSET_PREFIXES.some(
    (prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix),
  );
}
