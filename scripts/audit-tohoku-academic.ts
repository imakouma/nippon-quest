import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TOHOKU_PREFECTURES = ['aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima'] as const;

const prefectureTags = new Set(TOHOKU_PREFECTURES.map((id) => `prefecture:${id}`));

export interface TohokuQuestionRecord {
  file: string;
  id: string;
  prefectureTags: string[];
}

export interface TohokuAcademicAudit {
  files: Map<string, string>;
  questions: TohokuQuestionRecord[];
}

async function jsonFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return jsonFiles(path);
      return entry.isFile() && entry.name.endsWith('.json') ? [path] : [];
    }),
  );
  return nested.flat().sort();
}

/** `prefecture:*` タグだけを公開範囲の判定根拠にし、本文の文字列一致では承認しない。 */
export async function collectTohokuAcademicPopulation(root: string): Promise<TohokuAcademicAudit> {
  const questionRoot = resolve(root, 'content/questions');
  const questions: TohokuQuestionRecord[] = [];
  const files = new Map<string, string>();

  for (const absolutePath of await jsonFiles(questionRoot)) {
    const parsed = JSON.parse(await readFile(absolutePath, 'utf8')) as unknown;
    if (!Array.isArray(parsed)) continue;
    const file = relative(resolve(root, 'content'), absolutePath).replaceAll('\\', '/');
    for (const candidate of parsed) {
      if (!candidate || typeof candidate !== 'object') continue;
      const question = candidate as { id?: unknown; tags?: unknown };
      if (typeof question.id !== 'string' || !Array.isArray(question.tags)) continue;
      const tags = question.tags.filter((tag): tag is string => typeof tag === 'string');
      const matched = tags.filter((tag) => prefectureTags.has(tag));
      if (matched.length === 0) continue;
      questions.push({ file, id: question.id, prefectureTags: matched.sort() });
      if (!files.has(file)) {
        const bytes = await readFile(absolutePath);
        files.set(file, createHash('sha256').update(bytes).digest('hex'));
      }
    }
  }

  questions.sort((a, b) => a.id.localeCompare(b.id));
  return { files, questions };
}

export async function validateTohokuAcademicLedger(root: string): Promise<string[]> {
  const audit = await collectTohokuAcademicPopulation(root);
  const ledger = await readFile(resolve(root, 'docs/release/tohoku-academic-ledger.md'), 'utf8');
  const errors: string[] = [];

  if (audit.questions.length !== 18)
    errors.push(`東北タグ付き問題数が18件から${audit.questions.length}件に変わりました`);
  if (audit.files.size !== 5)
    errors.push(`東北タグ付き問題ファイル数が5件から${audit.files.size}件に変わりました`);

  for (const question of audit.questions) {
    const marker = `| \`${question.id}\` |`;
    if (!ledger.includes(marker)) errors.push(`台帳に問題IDがありません: ${question.id}`);
  }
  for (const [file, digest] of audit.files) {
    const marker = `| \`${file}\` | \`${digest}\` |`;
    if (!ledger.includes(marker)) errors.push(`台帳のファイルハッシュが不一致です: ${file}`);
  }

  const ledgerRows = ledger
    .split('\n')
    .filter((line) => line.startsWith('| `') && !line.includes('questions/'));
  if (ledgerRows.length !== audit.questions.length)
    errors.push(`台帳の問題行は18件必要です（現在${ledgerRows.length}件）`);
  for (const row of ledgerRows) {
    if (!row.includes('人間承認待ち')) errors.push(`承認状態が明示されていません: ${row}`);
    if (/承認済み|approved/i.test(row)) errors.push(`未承認教材を承認済みにできません: ${row}`);
  }

  return errors;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const errors = await validateTohokuAcademicLedger(root);
  if (errors.length > 0) {
    for (const error of errors) console.error(`✖ ${error}`);
    process.exitCode = 1;
  } else {
    const audit = await collectTohokuAcademicPopulation(root);
    console.log(
      `✔ 東北教材台帳: ${audit.questions.length}問 / ${audit.files.size}ファイル（全件 人間承認待ち）`,
    );
  }
}
