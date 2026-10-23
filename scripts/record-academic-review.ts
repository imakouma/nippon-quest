/** 人間が完了した学術レビューを、現行ファイルのハッシュ付きで台帳へ記録する。 */
import { createHash, randomUUID } from 'node:crypto';
import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import {
  academicReviewLedgerSchema,
  isAcademicReviewDateInFuture,
  isAcademicReviewExpired,
  type AcademicReviewLedger,
} from '../src/questions/academicReview';
import { questionBaseSchema } from '../src/questions/contracts';

export interface RecordAcademicReviewInput {
  rootDir: string;
  file: string;
  reviewer: string;
  reviewedAt: string;
  sourceIds: string[];
  note?: string;
  replace?: boolean;
  apply: boolean;
  now?: Date;
}

export interface RecordAcademicReviewResult {
  applied: boolean;
  review: AcademicReviewLedger['reviews'][number];
}

function normalizeQuestionFile(file: string): string {
  const normalized = file.replaceAll('\\', '/').replace(/^content\//, '');
  if (!/^questions\/.+\.json$/.test(normalized) || normalized.includes('..')) {
    throw new Error(`問題ファイルは questions/.../*.json の相対パスで指定してください: ${file}`);
  }
  if (normalized.startsWith('questions/_samples/')) {
    throw new Error(`サンプル問題は学術承認の対象外です: ${file}`);
  }
  return normalized;
}

export async function recordAcademicReview(
  input: RecordAcademicReviewInput,
): Promise<RecordAcademicReviewResult> {
  const rootDir = resolve(input.rootDir);
  const file = normalizeQuestionFile(input.file);
  const reviewer = input.reviewer.trim();
  const sourceIds = [...new Set(input.sourceIds.map((id) => id.trim()).filter(Boolean))];
  if (!reviewer) throw new Error('レビュー担当者名は空にできません');
  if (sourceIds.length === 0) throw new Error('少なくとも1つの出典 ID が必要です');
  const now = input.now ?? new Date();
  if (isAcademicReviewDateInFuture(input.reviewedAt, now)) {
    throw new Error(`レビュー確認日に未来の日付は指定できません: ${input.reviewedAt}`);
  }

  const ledgerPath = resolve(rootDir, 'content/quality/academic-reviews.json');
  const ledger = academicReviewLedgerSchema.parse(JSON.parse(await readFile(ledgerPath, 'utf8')));
  if (isAcademicReviewExpired(input.reviewedAt, ledger.policy.reviewIntervalMonths, now)) {
    throw new Error(`レビュー確認日は有効期限内の日付を指定してください: ${input.reviewedAt}`);
  }
  const knownSources = new Set(ledger.sources.map((source) => source.id));
  const unknownSources = sourceIds.filter((id) => !knownSources.has(id));
  if (unknownSources.length > 0) {
    throw new Error(`台帳にない出典 ID です: ${unknownSources.join(', ')}`);
  }
  const selectedSources = ledger.sources.filter((source) => sourceIds.includes(source.id));
  for (const source of selectedSources) {
    if (isAcademicReviewDateInFuture(source.checkedAt, now)) {
      throw new Error(`出典 ${source.id} の確認日が未来です`);
    }
    if (isAcademicReviewExpired(source.checkedAt, ledger.policy.reviewIntervalMonths, now)) {
      throw new Error(`出典 ${source.id} の確認期限が切れています`);
    }
  }
  const existingReviews = ledger.reviews.filter((review) => review.file === file);
  if (existingReviews.length > 0 && !input.replace) {
    throw new Error(`${file} は承認済みです。再レビュー記録へ置き換える場合は --replace が必要です`);
  }

  const manifest = JSON.parse(await readFile(resolve(rootDir, 'content/manifest.json'), 'utf8')) as {
    questions?: unknown;
  };
  if (!Array.isArray(manifest.questions) || !manifest.questions.includes(file)) {
    throw new Error(`${file} は content/manifest.json の問題一覧にありません`);
  }

  const bytes = await readFile(resolve(rootDir, 'content', file));
  const questions = questionBaseSchema.array().parse(JSON.parse(bytes.toString('utf8')));
  const coveredSubjects = new Set(selectedSources.flatMap((source) => source.subjects));
  const uncoveredSubjects = [
    ...new Set(
      questions.map((question) => question.subject).filter((subject) => !coveredSubjects.has(subject)),
    ),
  ];
  if (uncoveredSubjects.length > 0) {
    throw new Error(`選択した出典は対象教科を扱っていません: ${uncoveredSubjects.join(', ')}`);
  }
  const review = academicReviewLedgerSchema.shape.reviews.element.parse({
    file,
    status: 'approved',
    sha256: createHash('sha256').update(bytes).digest('hex'),
    reviewer,
    reviewedAt: input.reviewedAt,
    sourceIds,
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
  });

  if (input.apply) {
    const nextLedger = academicReviewLedgerSchema.parse({
      ...ledger,
      reviews: [
        ...ledger.reviews.filter((existing) => !input.replace || existing.file !== file),
        review,
      ].sort((a, b) => a.file.localeCompare(b.file)),
    });
    const temporaryPath = `${ledgerPath}.${randomUUID()}.tmp`;
    try {
      await writeFile(
        temporaryPath,
        await format(JSON.stringify(nextLedger), {
          ...(await resolveConfig(ledgerPath)),
          filepath: ledgerPath,
        }),
        { encoding: 'utf8', flag: 'wx' },
      );
      await rename(temporaryPath, ledgerPath);
    } finally {
      await unlink(temporaryPath).catch(() => undefined);
    }
  }

  return { applied: input.apply, review };
}

function readFlag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function readRepeatedFlag(args: string[], name: string): string[] {
  return args.flatMap((arg, index) => (arg === name && args[index + 1] ? [args[index + 1]!] : []));
}

function usage(): string {
  return [
    '使い方:',
    '  pnpm academic-review:record -- --file questions/...json --reviewer "担当者名" \\',
    '    --date YYYY-MM-DD --source source-id [--source source-id] [--note "確認メモ"] [--replace] [--apply]',
    '',
    '--apply を付けない実行はプレビューだけで、台帳を書き換えません。',
  ].join('\n');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log(usage());
    return;
  }
  const file = readFlag(args, '--file');
  const reviewer = readFlag(args, '--reviewer');
  const reviewedAt = readFlag(args, '--date');
  const sourceIds = readRepeatedFlag(args, '--source');
  if (!file || !reviewer || !reviewedAt || sourceIds.length === 0) {
    throw new Error(usage());
  }

  const result = await recordAcademicReview({
    rootDir: '.',
    file,
    reviewer,
    reviewedAt,
    sourceIds,
    note: readFlag(args, '--note'),
    replace: args.includes('--replace'),
    apply: args.includes('--apply'),
  });
  console.log(JSON.stringify(result.review, null, 2));
  console.log(
    result.applied
      ? 'academic review: 台帳へ記録しました。監査を再実行してください'
      : 'academic review: プレビューのみです。確認後に --apply を付けて再実行してください',
  );
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (entryPath === fileURLToPath(import.meta.url)) {
  await main();
}
