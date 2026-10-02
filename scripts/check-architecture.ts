/** CI用の軽量な依存境界・巨大Scene検査。外部パッケージには依存しない。 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = resolve(ROOT, 'src');
const errors: string[] = [];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = resolve(dir, name);
    return statSync(path).isDirectory() ? files(path) : ['.ts', '.tsx'].includes(extname(path)) ? [path] : [];
  });
}

for (const file of files(resolve(SRC, 'core'))) {
  const source = readFileSync(file, 'utf8');
  const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1] ?? '');
  for (const specifier of imports) {
    if (
      specifier.includes('/ui/') ||
      specifier.includes('/scenes/') ||
      ['phaser', 'preact'].includes(specifier)
    )
      errors.push(`${relative(ROOT, file)}: core から表示層 "${specifier}" へ依存できません`);
  }
}

// 現在値を上限に固定する。新機能はSceneへ追記せず、機能別モジュールへ抽出する。
const sceneBudgets: Readonly<Record<string, number>> = {
  'src/scenes/Overworld.ts': 3896,
  'src/scenes/Battle.ts': 1842,
};
for (const [file, maxLines] of Object.entries(sceneBudgets)) {
  const lines = readFileSync(resolve(ROOT, file), 'utf8').trimEnd().split('\n').length;
  if (lines > maxLines)
    errors.push(`${file}: ${lines}行（上限 ${maxLines}）。機能別モジュールへ分割してください`);
}

if (errors.length) {
  console.error(
    `architecture errors (${errors.length}):\n${errors.map((error) => `  - ${error}`).join('\n')}`,
  );
  process.exit(1);
}
console.log('architecture: dependency boundaries and scene budgets OK');
