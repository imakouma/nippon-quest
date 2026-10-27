import { z } from 'zod/v3';
import rawCharacterBodySizes from '../../../content/character-body-sizes.json';
import { idSchema, type Monster } from './schemas';

export const characterBodySizeSchema = z.object({
  heightKind: z.enum(['height', 'body-height']),
  heightCm: z.number().finite().positive(),
  lengthCm: z.number().finite().positive().optional(),
  wingspanCm: z.number().finite().positive().optional(),
});

export const characterBodySizesSchema = z.object({
  version: z.literal(1),
  characters: z.record(idSchema, characterBodySizeSchema),
  aliases: z.record(idSchema, idSchema),
});

export type CharacterBodySize = z.infer<typeof characterBodySizeSchema>;
export type CharacterBodySizes = z.infer<typeof characterBodySizesSchema>;

/** ビルドへ同梱する独立データ。Monsterや保存形式へ表示専用寸法を混ぜない。 */
export const characterBodySizes = characterBodySizesSchema.parse(rawCharacterBodySizes);

/** キャラ固有値を優先し、互換IDだけ明示された参照先へ解決する。 */
export function resolveCharacterBodySize(monsterId: string): CharacterBodySize | undefined {
  return (
    characterBodySizes.characters[monsterId] ??
    characterBodySizes.characters[characterBodySizes.aliases[monsterId] ?? '']
  );
}

export function findCharacterBodySizeReferenceErrors(monsters: ReadonlyMap<string, Monster>): string[] {
  const errors: string[] = [];
  for (const [id, target] of Object.entries(characterBodySizes.aliases)) {
    if (!monsters.has(id)) errors.push(`characterBodySizes: alias "${id}" は未知の monster です`);
    if (!characterBodySizes.characters[target])
      errors.push(`characterBodySizes: alias "${id}" の参照先 "${target}" がありません`);
  }
  for (const id of Object.keys(characterBodySizes.characters))
    if (!monsters.has(id)) errors.push(`characterBodySizes: "${id}" は未知の monster です`);
  for (const id of monsters.keys())
    if (!resolveCharacterBodySize(id)) errors.push(`characterBodySizes: monster "${id}" の寸法がありません`);
  return errors;
}
