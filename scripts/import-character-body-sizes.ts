import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface SourceBodySize {
  heightKind: 'height' | 'body-height';
  heightCm: number;
  lengthCm?: number;
  wingspanCm?: number;
}

interface SourceFile {
  characters: Record<string, SourceBodySize>;
}

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error('usage: pnpm tsx scripts/import-character-body-sizes.ts <body-sizes.json>');

const root = resolve(import.meta.dirname, '..');
const source = JSON.parse(readFileSync(resolve(sourcePath), 'utf8')) as SourceFile;
const monsterIds = readdirSync(resolve(root, 'content/monsters'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => {
    const value = JSON.parse(readFileSync(resolve(root, 'content/monsters', file), 'utf8')) as { id: string };
    return value.id;
  })
  .sort();

const aliases = { 'koshinetsu-boss': 'tohoku-boss-rokufuyu' } as const;
const characters: Record<string, SourceBodySize> = {};
for (const id of monsterIds) {
  if (id in aliases) continue;
  const size = source.characters[id];
  if (!size) throw new Error(`body size is missing: ${id}`);
  characters[id] = {
    heightKind: size.heightKind,
    heightCm: size.heightCm,
    ...(size.lengthCm === undefined ? {} : { lengthCm: size.lengthCm }),
    ...(size.wingspanCm === undefined ? {} : { wingspanCm: size.wingspanCm }),
  };
}

const output = {
  $schema: '../schemas/characterBodySizes.schema.json',
  version: 1,
  characters,
  aliases,
};
writeFileSync(resolve(root, 'content/character-body-sizes.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(
  `character body sizes: ${Object.keys(characters).length} direct + ${Object.keys(aliases).length} alias`,
);
