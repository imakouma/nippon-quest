import type { CharacterBodySize, CharacterBodySizes } from './schemas';

/** キャラ固有値を優先し、互換IDだけ明示された参照先へ解決する。 */
export function resolveCharacterBodySize(
  sizes: CharacterBodySizes,
  monsterId: string,
): CharacterBodySize | undefined {
  return sizes.characters[monsterId] ?? sizes.characters[sizes.aliases[monsterId] ?? ''];
}
