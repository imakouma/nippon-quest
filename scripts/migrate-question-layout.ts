import { randomUUID } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { academicReviewLedgerSchema } from '../src/questions/academicReview';
import { questionBaseSchema, type QuestionBase } from '../src/questions/contracts';
import {
  buildQuestionSets,
  compareQuestionLayouts,
  validateQuestionSetLayout,
  type QuestionLayoutParity,
  type QuestionSourceFile,
} from './question-layout';

export interface QuestionLayoutMigrationOptions {
  rootDir: string;
  write: boolean;
}

export interface QuestionLayoutMigrationResult {
  applied: boolean;
  questions: number;
  units: number;
  beforeFiles: number;
  afterFiles: number;
  createdFiles: string[];
  removedFiles: string[];
  changedFiles: string[];
  parity: QuestionLayoutParity;
}

async function jsonFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return entry.name === '_samples' ? [] : jsonFiles(path);
      return entry.isFile() && entry.name.endsWith('.json') ? [path] : [];
    }),
  );
  return nested.flat().sort();
}

async function readQuestionRoot(questionRoot: string): Promise<QuestionSourceFile[]> {
  return Promise.all(
    (await jsonFiles(questionRoot)).map(async (absolutePath) => ({
      file: `questions/${relative(questionRoot, absolutePath).split(sep).join('/')}`,
      questions: questionBaseSchema
        .array()
        .parse(JSON.parse(await readFile(absolutePath, 'utf8'))) as QuestionBase[],
    })),
  );
}

async function readProductionQuestions(contentDir: string): Promise<QuestionSourceFile[]> {
  return readQuestionRoot(join(contentDir, 'questions'));
}

function fileChanges(before: readonly QuestionSourceFile[], after: readonly QuestionSourceFile[]) {
  const beforeByFile = new Map(before.map((source) => [source.file, source.questions]));
  const afterByFile = new Map(after.map((source) => [source.file, source.questions]));
  const createdFiles = [...afterByFile.keys()].filter((file) => !beforeByFile.has(file)).sort();
  const removedFiles = [...beforeByFile.keys()].filter((file) => !afterByFile.has(file)).sort();
  const changedFiles = [...afterByFile]
    .filter(([file, questions]) => {
      const previous = beforeByFile.get(file);
      return previous !== undefined && !isDeepStrictEqual(previous, questions);
    })
    .map(([file]) => file)
    .sort();
  return { createdFiles, removedFiles, changedFiles };
}

async function hasDirectory(path: string): Promise<boolean> {
  return stat(path)
    .then((entry) => entry.isDirectory())
    .catch(() => false);
}

async function writeStagedQuestions(
  contentDir: string,
  stagingRoot: string,
  sets: readonly QuestionSourceFile[],
): Promise<void> {
  await mkdir(stagingRoot, { recursive: true });
  const sampleRoot = join(contentDir, 'questions/_samples');
  if (await hasDirectory(sampleRoot))
    await cp(sampleRoot, join(stagingRoot, '_samples'), { recursive: true });
  for (const set of sets) {
    const relativePath = set.file.replace(/^questions\//, '');
    const output = join(stagingRoot, relativePath);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, `${JSON.stringify(set.questions, null, 2)}\n`);
  }
}

async function replaceQuestionRoot(contentDir: string, stagingRoot: string): Promise<void> {
  const questionRoot = join(contentDir, 'questions');
  const backupRoot = join(contentDir, `.questions-layout-backup-${randomUUID()}`);
  await rename(questionRoot, backupRoot);
  try {
    await rename(stagingRoot, questionRoot);
  } catch (error) {
    await rename(backupRoot, questionRoot);
    throw error;
  }
  await rm(backupRoot, { recursive: true });
}

export async function migrateQuestionLayout(
  options: QuestionLayoutMigrationOptions,
): Promise<QuestionLayoutMigrationResult> {
  const rootDir = resolve(options.rootDir);
  const contentDir = join(rootDir, 'content');
  const before = await readProductionQuestions(contentDir);
  const after = buildQuestionSets(before);
  const parity = compareQuestionLayouts(before, after);
  const layoutErrors = validateQuestionSetLayout(after);
  if (!parity.ok || layoutErrors.length > 0) {
    throw new Error([...parity.errors, ...layoutErrors].join('\n'));
  }
  const changes = fileChanges(before, after);
  const hasChanges = Object.values(changes).some((files) => files.length > 0);
  const result: QuestionLayoutMigrationResult = {
    applied: false,
    questions: parity.questions,
    units: parity.units,
    beforeFiles: before.length,
    afterFiles: after.length,
    ...changes,
    parity,
  };
  if (!options.write || !hasChanges) return result;

  const ledger = academicReviewLedgerSchema.parse(
    JSON.parse(await readFile(join(contentDir, 'quality/academic-reviews.json'), 'utf8')),
  );
  if (ledger.reviews.length > 0) {
    throw new Error(`学術レビュー記録が${ledger.reviews.length}件あるため移行できません`);
  }

  const stagingRoot = join(contentDir, `.questions-layout-staging-${randomUUID()}`);
  try {
    await writeStagedQuestions(contentDir, stagingRoot, after);
    const staged = await readQuestionRoot(stagingRoot);
    const stagedParity = compareQuestionLayouts(after, staged);
    const stagedErrors = validateQuestionSetLayout(staged);
    if (!stagedParity.ok || stagedErrors.length > 0) {
      throw new Error([...stagedParity.errors, ...stagedErrors].join('\n'));
    }
    await replaceQuestionRoot(contentDir, stagingRoot);
    result.applied = true;
    const reportPath = join(rootDir, 'imports/question-layout-migration.json');
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`);
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }

  return result;
}

async function main(): Promise<void> {
  const write = process.argv.slice(2).includes('--write');
  const result = await migrateQuestionLayout({ rootDir: '.', write });
  console.log(JSON.stringify(result, null, 2));
  console.log(
    write
      ? result.applied
        ? 'question layout: 移行しました'
        : 'question layout: すでに正規化済みです'
      : 'question layout: dry-runです。反映する場合は --write を付けてください',
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) await main();
