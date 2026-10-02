/** CI用の軽量な依存境界・巨大Scene検査。外部パッケージには依存しない。 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = resolve(ROOT, 'src');
const errors: string[] = [];

const importSpecifiers = (source: string): string[] =>
  [...source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map((match) => match[1] ?? '');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = resolve(dir, name);
    return statSync(path).isDirectory() ? files(path) : ['.ts', '.tsx'].includes(extname(path)) ? [path] : [];
  });
}

for (const file of files(resolve(SRC, 'core'))) {
  const source = readFileSync(file, 'utf8');
  const imports = importSpecifiers(source);
  for (const specifier of imports) {
    if (
      specifier.includes('/ui/') ||
      specifier.includes('/scenes/') ||
      ['phaser', 'preact'].includes(specifier)
    )
      errors.push(`${relative(ROOT, file)}: core から表示層 "${specifier}" へ依存できません`);
  }
}

// shared は両側から使う契約だけを置く場所。実装層へ逆流すると新しい循環の温床になる。
for (const file of files(resolve(SRC, 'shared'))) {
  const source = readFileSync(file, 'utf8');
  for (const specifier of importSpecifiers(source)) {
    if (/\/(?:core|questions|scenes|ui)\//.test(specifier))
      errors.push(`${relative(ROOT, file)}: shared から実装層 "${specifier}" へ依存できません`);
  }
}

for (const file of files(resolve(SRC, 'ui'))) {
  const rel = relative(ROOT, file);
  const source = readFileSync(file, 'utf8');
  for (const specifier of importSpecifiers(source)) {
    if (specifier.includes('/core/state/save'))
      errors.push(
        `${rel}: UI から保存先を直接操作せず、callback または純粋な serialization を使ってください`,
      );
    // 既存のドット絵基盤2件は移行負債として固定し、新規の UI → Scene 依存だけを止める。
    if (
      specifier.includes('/scenes/') &&
      !['../scenes/art/icons', '../../scenes/art/palette'].includes(specifier)
    )
      errors.push(`${rel}: UI から Scene 実装 "${specifier}" へ依存できません`);
  }
}

for (const file of files(resolve(SRC, 'questions', 'renderers'))) {
  const source = readFileSync(file, 'utf8');
  for (const specifier of importSpecifiers(source)) {
    if (specifier === 'phaser' || specifier.includes('/scenes/') || specifier.includes('/core/state/'))
      errors.push(`${relative(ROOT, file)}: 問題レンダラーがゲーム本体 "${specifier}" に依存しています`);
  }
}

for (const file of files(SRC)) {
  const rel = relative(ROOT, file);
  if (rel === 'src/core/state/save.ts') continue;
  const source = readFileSync(file, 'utf8');
  if (/from\s+['"]localforage['"]|\b(?:localStorage|sessionStorage|indexedDB)\b/.test(source))
    errors.push(`${rel}: 永続化APIは src/core/state/save.ts に集約してください`);
}

// 現在値を上限に固定する。新機能はSceneへ追記せず、機能別モジュールへ抽出する。
const sceneBudgets: Readonly<Record<string, number>> = {
  'src/scenes/Overworld.ts': 3945,
  'src/scenes/Battle.ts': 1842,
  'src/ui/battle/BattleHud.tsx': 857,
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
