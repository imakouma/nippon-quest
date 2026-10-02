/**
 * content/manifest.json を生成する。
 * ブラウザは glob できないので、どの JSON が存在するかをここで列挙しておく。
 * `pnpm dev` / `pnpm build` の前に自動実行される（predev / prebuild）。
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentKinds, type ContentKind } from '../src/core/content/schemas';

const ROOT = fileURLToPath(new URL('../content/', import.meta.url));

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (
      name.endsWith('.json') &&
      name !== 'manifest.json' &&
      name !== 'content-bundle.json' &&
      name !== 'questions-bundle.json'
    )
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
const questionIndex: Record<string, string> = {};
for (const file of questions) {
  const raw = JSON.parse(readFileSync(join(ROOT, file), 'utf8')) as unknown;
  if (!Array.isArray(raw)) continue;
  for (const item of raw) {
    const id = (item as { id?: unknown })?.id;
    if (typeof id === 'string' && !(id in questionIndex)) questionIndex[id] = file;
  }
}

const manifest = { generatedAt: new Date().toISOString(), files, questions, questionIndex };
writeFileSync(join(ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const readEntries = (paths: string[]) =>
  Object.fromEntries(paths.map((file) => [file, JSON.parse(readFileSync(join(ROOT, file), 'utf8'))]));
const bundle = readEntries(['manifest.json', ...all.filter((file) => !file.startsWith('questions/'))]);
const questionBundle = readEntries(questions);
writeFileSync(join(ROOT, 'content-bundle.json'), JSON.stringify(bundle));
writeFileSync(join(ROOT, 'questions-bundle.json'), JSON.stringify(questionBundle));
const total = Object.values(files).reduce((n, a) => n + a.length, 0) + questions.length;
console.log(`content bundles: ${total} files (questions: ${questions.length})`);
