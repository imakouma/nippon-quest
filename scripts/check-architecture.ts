/** CI用の軽量な依存境界・巨大Scene検査。外部パッケージには依存しない。 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceBudget } from './architecture-policy';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = resolve(ROOT, 'src');
const SCRIPTS = resolve(ROOT, 'scripts');
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
      specifier.includes('/rendering/') ||
      ['phaser', 'preact'].includes(specifier)
    )
      errors.push(`${relative(ROOT, file)}: core から表示層 "${specifier}" へ依存できません`);
  }
}

// shared は両側から使う契約だけを置く場所。実装層へ逆流すると新しい循環の温床になる。
for (const file of files(resolve(SRC, 'shared'))) {
  const source = readFileSync(file, 'utf8');
  for (const specifier of importSpecifiers(source)) {
    if (/\/(?:core|questions|rendering|scenes|ui)\//.test(specifier))
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
    if (specifier.includes('/scenes/'))
      errors.push(`${rel}: UI から Scene 実装 "${specifier}" へ依存できません`);
  }
}

// rendering は表示資産の生成だけを担当し、Scene や UI の実装を知らない。
for (const file of files(resolve(SRC, 'rendering'))) {
  const source = readFileSync(file, 'utf8');
  for (const specifier of importSpecifiers(source)) {
    if (specifier.includes('/scenes/') || specifier.includes('/ui/'))
      errors.push(`${relative(ROOT, file)}: rendering から表示実装 "${specifier}" へ依存できません`);
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

// 全実装ファイルを監視する。既存の巨大ファイルだけ明示的な縮小中予算を持つ。
for (const file of [...files(SRC), ...files(SCRIPTS)]) {
  const rel = relative(ROOT, file);
  const lines = readFileSync(file, 'utf8').trimEnd().split('\n').length;
  const budget = sourceBudget(rel);
  if (lines > budget.maxLines)
    errors.push(
      `${rel}: ${lines}行（上限 ${budget.maxLines}、${budget.reason}）。機能別モジュールへ分割してください`,
    );
}

// src 内の相対 import を解決して循環依存を検出する。外部パッケージと型宣言は対象外。
const sourceFiles = files(SRC);
const sourceSet = new Set(sourceFiles);
function resolveImport(from: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null;
  const base = resolve(dirname(from), specifier);
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    resolve(base, 'index.ts'),
    resolve(base, 'index.tsx'),
  ])
    if (existsSync(candidate) && sourceSet.has(candidate)) return candidate;
  return null;
}

const graph = new Map(
  sourceFiles.map((file) => [
    file,
    importSpecifiers(readFileSync(file, 'utf8')).flatMap((specifier) => {
      const target = resolveImport(file, specifier);
      return target ? [target] : [];
    }),
  ]),
);
const visited = new Set<string>();
const active = new Set<string>();
const stack: string[] = [];
const cycles = new Set<string>();
function visit(file: string): void {
  if (active.has(file)) {
    const start = stack.indexOf(file);
    const cycle = [...stack.slice(start), file].map((entry) => relative(ROOT, entry));
    cycles.add(cycle.join(' -> '));
    return;
  }
  if (visited.has(file)) return;
  visited.add(file);
  active.add(file);
  stack.push(file);
  for (const dependency of graph.get(file) ?? []) visit(dependency);
  stack.pop();
  active.delete(file);
}
for (const file of sourceFiles) visit(file);
for (const cycle of cycles) errors.push(`循環依存: ${cycle}`);

if (errors.length) {
  console.error(
    `architecture errors (${errors.length}):\n${errors.map((error) => `  - ${error}`).join('\n')}`,
  );
  process.exit(1);
}
console.log('architecture: dependency boundaries and scene budgets OK');
