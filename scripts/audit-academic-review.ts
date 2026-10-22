/** 未承認教材を、人間が確認しやすい順に並べたレビューキューを生成する。 */
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';
import {
  academicReviewLedgerSchema,
  assessAcademicReviews,
  type AcademicReviewInvalidReason,
} from '../src/questions/academicReview';
import { questionBaseSchema, type QuestionBase, type Subject } from '../src/questions/contracts';

interface ReviewQueueItem {
  file: string;
  sha256: string;
  questionCount: number;
  subjects: Subject[];
  grades: number[];
  types: string[];
  changingFactCandidates: number;
  visualQuestions: number;
  priority: number;
  suggestedSourceIds: string[];
  questionIds: string[];
  changingFactQuestionIds: string[];
  visualQuestionIds: string[];
  invalidReviewReasons: AcademicReviewInvalidReason[];
}

const ROOT = resolve('.');
const CONTENT = resolve(ROOT, 'content');
const CHANGING_FACT = /現在|最新|人口|生産量|収穫量|割合|ランキング|制度|第[一二三四五六七八九十\d]+位/;

const manifest = JSON.parse(await readFile(resolve(CONTENT, 'manifest.json'), 'utf8')) as {
  questions: string[];
};
const ledger = academicReviewLedgerSchema.parse(
  JSON.parse(await readFile(resolve(CONTENT, 'quality/academic-reviews.json'), 'utf8')),
);
const productionFiles = manifest.questions.filter((path) => !path.startsWith('questions/_samples/'));
const loadedFiles = await Promise.all(
  productionFiles.map(async (file) => {
    const bytes = await readFile(resolve(CONTENT, file));
    const questions = questionBaseSchema.array().parse(JSON.parse(bytes.toString())) as QuestionBase[];
    return {
      file,
      questions,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      subjects: [...new Set(questions.map((question) => question.subject))],
    };
  }),
);
const assessment = assessAcademicReviews(
  ledger,
  loadedFiles.map(({ file, sha256, subjects }) => ({ file, sha256, subjects })),
);
const approved = new Set(assessment.validFiles);
const invalidReviewReasons = new Map(
  assessment.invalidReviews.map((review) => [review.file, review.reasons]),
);
const queue: ReviewQueueItem[] = [];

for (const { file, questions, sha256 } of loadedFiles) {
  if (approved.has(file)) continue;
  const subjects = [...new Set(questions.map((question) => question.subject))].sort();
  const changingFactQuestionIds = questions
    .filter((question) =>
      CHANGING_FACT.test(
        `${String((question.payload as Record<string, unknown>).prompt ?? '')}\n${question.explanation ?? ''}`,
      ),
    )
    .map((question) => question.id);
  const visualQuestionIds = questions
    .filter((question) => {
      const payload = question.payload as Record<string, unknown>;
      return Boolean(payload.promptImage) || question.type === 'map-tap' || question.type === 'picture-word';
    })
    .map((question) => question.id);
  const changingFactCandidates = changingFactQuestionIds.length;
  const visualQuestions = visualQuestionIds.length;
  const suggestedSourceIds = ledger.sources
    .filter((source) => source.subjects.some((subject) => subjects.includes(subject)))
    .filter((source) => source.id !== 'estat-portal' || changingFactCandidates > 0)
    .map((source) => source.id);
  // 変化する事実・視覚問題を先に、その後は小さいファイルから確認する。
  const priority =
    (changingFactCandidates > 0 ? 1 : visualQuestions > 0 ? 2 : 3) * 100_000 + questions.length;
  queue.push({
    file,
    sha256,
    questionCount: questions.length,
    subjects,
    grades: [...new Set(questions.map((question) => question.grade))].sort((a, b) => a - b),
    types: [...new Set(questions.map((question) => question.type))].sort(),
    changingFactCandidates,
    visualQuestions,
    priority,
    suggestedSourceIds,
    questionIds: questions.map((question) => question.id),
    changingFactQuestionIds,
    visualQuestionIds,
    invalidReviewReasons: invalidReviewReasons.get(file) ?? [],
  });
}

queue.sort((a, b) => a.priority - b.priority || a.file.localeCompare(b.file));
const report = {
  policy: {
    note: 'この一覧はレビュー順を決めるだけで、学術的な承認を自動化しません。',
    owner: ledger.policy.owner,
    reviewIntervalMonths: ledger.policy.reviewIntervalMonths,
  },
  summary: {
    pendingFiles: queue.length,
    pendingQuestions: queue.reduce((sum, item) => sum + item.questionCount, 0),
    changingFactFiles: queue.filter((item) => item.changingFactCandidates > 0).length,
    visualFiles: queue.filter((item) => item.visualQuestions > 0).length,
    invalidReviewFiles: assessment.invalidReviews.length,
    pilotFiles: queue.filter((item) => item.questionCount <= 10).length,
    pilotQuestions: queue
      .filter((item) => item.questionCount <= 10)
      .reduce((sum, item) => sum + item.questionCount, 0),
  },
  invalidReviews: assessment.invalidReviews,
  nextBatch: queue.slice(0, 5),
  pilotBatch: queue.filter((item) => item.questionCount <= 10).slice(0, 5),
  files: queue,
};

await writeFile(
  resolve(ROOT, 'imports/academic-review-queue.json'),
  await format(JSON.stringify(report), {
    ...(await resolveConfig(resolve(ROOT, 'imports/academic-review-queue.json'))),
    filepath: resolve(ROOT, 'imports/academic-review-queue.json'),
  }),
);
console.log(
  `academic review: ${report.summary.pendingFiles} files / ${report.summary.pendingQuestions} questions pending`,
);
if (
  process.argv.includes('--strict') &&
  (report.summary.pendingFiles > 0 || report.summary.invalidReviewFiles > 0)
) {
  throw new Error(
    `人による学術レビューが ${report.summary.pendingFiles} ファイル（${report.summary.pendingQuestions} 問）残り、無効な承認記録が ${report.summary.invalidReviewFiles} 件あります`,
  );
}
