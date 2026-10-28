import { readdir, readFile, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { questionBaseSchema, type QuestionBase } from '../src/questions/contracts';
import { requireRenderer } from '../src/questions/renderers/registry';
import {
  applyKokugoReviewRow,
  makeKokugoReviewRow,
  parseReviewCsv,
  toReviewCsv,
  type KokugoReviewRow,
} from '../src/questions/review/kokugoReview';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const QUESTION_ROOT = resolve(ROOT, 'content/questions');
const DEFAULT_CSV = resolve(ROOT, 'imports/kokugo-review.csv');

async function jsonFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(dir, entry.name);
      return entry.isDirectory()
        ? jsonFiles(path)
        : Promise.resolve(entry.name.endsWith('.json') ? [path] : []);
    }),
  );
  return nested.flat().sort();
}

async function loadQuestions(): Promise<{
  files: Map<string, QuestionBase[]>;
  rows: KokugoReviewRow[];
}> {
  const grades = JSON.parse(await readFile(resolve(ROOT, 'content/i18n/kanji-grades.json'), 'utf8')) as {
    byGrade: Record<string, string>;
  };
  const files = new Map<string, QuestionBase[]>();
  const rows: KokugoReviewRow[] = [];
  for (const path of await jsonFiles(QUESTION_ROOT)) {
    const questions = JSON.parse(await readFile(path, 'utf8')) as QuestionBase[];
    const sourceFile = relative(ROOT, path).replaceAll('\\', '/');
    files.set(sourceFile, questions);
    questions.forEach((question, sourceIndex) => {
      if (question.subject === 'kokugo') {
        rows.push(makeKokugoReviewRow(question, sourceFile, sourceIndex, grades.byGrade));
      }
    });
  }
  rows.sort(
    (a, b) =>
      Number(a['学年']) - Number(b['学年']) ||
      a['単元'].localeCompare(b['単元']) ||
      a['管理ID'].localeCompare(b['管理ID']),
  );
  return { files, rows };
}

async function exportReview(): Promise<void> {
  const { rows } = await loadQuestions();
  await writeFile(DEFAULT_CSV, toReviewCsv(rows), 'utf8');
  const counts = new Map<number, number>();
  for (const row of rows) counts.set(Number(row['学年']), (counts.get(Number(row['学年'])) ?? 0) + 1);
  console.log(`kokugo review: ${rows.length} questions exported to ${relative(ROOT, DEFAULT_CSV)}`);
  console.log([...counts].map(([grade, count]) => `${grade}年=${count}`).join(' / '));
}

async function applyReview(csvPath: string, write: boolean): Promise<void> {
  const { files } = await loadQuestions();
  const reviewRows = parseReviewCsv(await readFile(resolve(csvPath), 'utf8')).filter(
    (row) => row['確認状態'] === '反映可',
  );
  if (!reviewRows.length) {
    console.log('「反映可」の行はありません。ファイルは変更していません。');
    return;
  }
  const changedFiles = new Set<string>();
  for (const row of reviewRows) {
    const sourceFile = row['元ファイル'];
    if (!sourceFile.startsWith('content/questions/') || !files.has(sourceFile)) {
      throw new Error(`${row['管理ID']}: 元ファイルが不正です`);
    }
    const questions = files.get(sourceFile)!;
    const question = questions.find((item) => item.id === row['管理ID']);
    if (!question) throw new Error(`${row['管理ID']}: 問題が見つかりません`);
    applyKokugoReviewRow(question, row);
    questionBaseSchema.parse(question);
    requireRenderer(question.type).schema.parse(question.payload);
    changedFiles.add(sourceFile);
  }
  console.log(`${write ? '反映' : '事前確認'}: ${reviewRows.length}問 / ${changedFiles.size}ファイル`);
  if (!write) {
    console.log('ファイルは変更していません。--write を付けると反映します。');
    return;
  }
  for (const sourceFile of changedFiles) {
    const path = resolve(ROOT, sourceFile);
    const formatted = await format(JSON.stringify(files.get(sourceFile)), {
      ...(await resolveConfig(path)),
      filepath: path,
    });
    await writeFile(path, formatted, 'utf8');
  }
}

const [command = 'export', csvPath = DEFAULT_CSV] = process.argv.slice(2).filter((arg) => arg !== '--');
if (command === 'export') await exportReview();
else if (command === 'apply') await applyReview(csvPath, process.argv.includes('--write'));
else throw new Error(`不明な操作です: ${command}`);
