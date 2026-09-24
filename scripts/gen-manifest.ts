/**
 * content/manifest.json を生成する。
 * ブラウザは glob できないので、どの JSON が存在するかをここで列挙しておく。
 * `pnpm dev` / `pnpm build` の前に自動実行される（predev / prebuild）。
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { contentKinds, type ContentKind } from '../src/core/content/schemas';

const ROOT = new URL('../content/', import.meta.url).pathname;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.json') && name !== 'manifest.json')
      out.push(relative(ROOT, p).split(sep).join('/'));
  }
  return out;
}

const all = walk(ROOT).sort();
const files = {} as Record<ContentKind, string[]>;
for (const [kind, def] of Object.entries(contentKinds) as [ContentKind, { glob: string }][]) {
  const g = def.glob;
  files[kind] = g.includes('*')
    ? all.filter(
        (f) => f.startsWith(g.slice(0, g.indexOf('*'))) && f.split('/').length === g.split('/').length,
      )
    : all.filter((f) => f === g);
}
// 問題ファイル：content/questions/**/*.json（_samples も含める。ゲーム側は _samples を除外できる）
const questions = all.filter((f) => f.startsWith('questions/'));

const manifest = { generatedAt: new Date().toISOString(), files, questions };
writeFileSync(join(ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const total = Object.values(files).reduce((n, a) => n + a.length, 0) + questions.length;
console.log(`content/manifest.json: ${total} files (questions: ${questions.length})`);
