/** 構造検査済み・画像非依存の旧問題を、教科/学年別ファイルへ決定論的に昇格する。 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { questionBaseSchema, type QuestionBase } from '../src/questions/contracts';
import { getRenderer } from '../src/questions/renderers/registry';
import type { StagedLegacyQuestion } from './import-legacy-questions';

export function bulkPromotable(staged: StagedLegacyQuestion[]): QuestionBase[] {
  return staged
    .filter((q) => q.legacy.reviewFlags.length === 0)
    .map((q) => {
      const clean: QuestionBase = { ...q, tags: [...(q.tags ?? []), 'reviewed:structural-v1'] };
      delete (clean as QuestionBase & { legacy?: unknown }).legacy;
      questionBaseSchema.parse(clean);
      const renderer = getRenderer(clean.type);
      if (!renderer) throw new Error(`未登録レンダラー: ${clean.type}`);
      renderer.schema.parse(clean.payload);
      return clean;
    });
}

async function main() {
  const staged = JSON.parse(
    await readFile(resolve('imports/legacy-questions/staged.json'), 'utf8'),
  ) as StagedLegacyQuestion[];
  const rows = bulkPromotable(staged);
  const groups = new Map<string, QuestionBase[]>();
  for (const q of rows) {
    const key = `${q.subject}/g${q.grade}`;
    groups.set(key, [...(groups.get(key) ?? []), q]);
  }
  for (const [key, questions] of groups) {
    const [subject, grade] = key.split('/');
    const dir = resolve('content/questions/legacy', subject!);
    await mkdir(dir, { recursive: true });
    await writeFile(resolve(dir, `${grade}.json`), `${JSON.stringify(questions, null, 2)}\n`);
  }
  console.log(`${rows.length} legacy questions promoted in ${groups.size} files`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
