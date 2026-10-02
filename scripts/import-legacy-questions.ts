/**
 * autonomy-game の問題バンクを、安全にレビューできる中間形式へ変換する。
 *
 * 重要:
 * - 出力先は content/ の外。変換しただけではゲーム本番に混ざらない。
 * - 正解範囲、空文字、選択肢重複、重複問題を検査する。
 * - 人間が内容と出典を確認してから、別途 content/questions へ昇格する。
 */
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { questionBaseSchema, type Grade, type QuestionBase, type Subject } from '../src/questions/contracts';
import { choicePayloadSchema } from '../src/questions/renderers/choice/schema';
import { textInputPayloadSchema } from '../src/questions/renderers/text-input/schema';
import { mapTapPayloadSchema } from '../src/questions/renderers/map-tap/schema';

export interface LegacyChoiceQuestion {
  question?: unknown;
  choices?: unknown;
  correctIndex?: unknown;
  explanation?: unknown;
  answerMode?: unknown;
  imageUrl?: unknown;
  imageAlt?: unknown;
  inputAnswer?: unknown;
  inputAnswers?: unknown;
  inputSuffix?: unknown;
  inputTemplate?: unknown;
  clickHotspots?: unknown;
}

export type LegacyReviewFlag = 'external-visual-context' | 'legacy-image-reference';

export type LegacyDatabase = Record<string, LegacyChoiceQuestion[]>;

export interface LegacySource {
  subject: Subject;
  database: LegacyDatabase;
}

export interface StagedLegacyQuestion extends QuestionBase {
  legacy: {
    source: 'autonomy-game';
    nodeId: string;
    sourceIndex: number;
    fingerprint: string;
    reviewStatus: 'unreviewed';
    reviewFlags: LegacyReviewFlag[];
    sourceImageUrl?: string;
  };
}

export interface RejectedLegacyQuestion {
  subject: Subject;
  nodeId: string;
  sourceIndex: number;
  reason: string;
}

export interface LegacyImportResult {
  accepted: StagedLegacyQuestion[];
  rejected: RejectedLegacyQuestion[];
  duplicateCount: number;
}

const SOURCE_MODULES = [
  ['kokugo', 'src/lib/japaneseQuizDatabase.ts', 'JAPANESE_QUIZ_DATABASE'],
  ['sansu', 'src/lib/mathQuizDatabase.ts', 'MATH_QUIZ_DATABASE'],
  ['rika', 'src/lib/scienceQuizDatabase.ts', 'SCIENCE_QUIZ_DATABASE'],
  ['shakai', 'src/lib/socialQuizDatabase.ts', 'SOCIAL_QUIZ_DATABASE'],
  ['seikatsu', 'src/lib/seikatsuQuizDatabase.ts', 'SEIKATSU_QUIZ_DATABASE'],
] as const satisfies ReadonlyArray<readonly [Subject, string, string]>;

const LEGACY_GRADE_PATTERNS: Record<Subject, RegExp[]> = {
  kokugo: [/^jpn[_-]([1-6])(?:[_-]|$)/],
  sansu: [/^math[_-]([1-6])(?:[_-]|$)/],
  rika: [/^(?:science|sci)[_-]([1-6])(?:[_-]|$)/, /^cur-15(?:0?)([1-6])-/],
  shakai: [/^(?:social|soc)[_-]([1-6])(?:[_-]|$)/, /^cur-14(?:0?)([1-6])-/],
  seikatsu: [/^seikatsu[_-]([1-6])(?:[_-]|$)/, /^cur-18(?:0?)([1-6])-/],
  eigo: [/^(?:english|eng)[_-]([1-6])(?:[_-]|$)/],
};

const EXTERNAL_VISUAL_CONTEXT =
  /(下の(?:図|表|グラフ|絵|写真)|次の(?:図|表|グラフ|絵|写真)|図のよう|表のよう|グラフから|赤く|青く|アとイのうち|どの角|正面から|左から|右から|ひだりから|みぎから|イラスト)/;

export function detectLegacyReviewFlags(raw: LegacyChoiceQuestion): LegacyReviewFlag[] {
  const flags: LegacyReviewFlag[] = [];
  if (
    typeof raw.question === 'string' &&
    EXTERNAL_VISUAL_CONTEXT.test(normalizedText(raw.question)) &&
    !(typeof raw.inputTemplate === 'string' && raw.inputTemplate.includes('{{INPUT}}'))
  )
    flags.push('external-visual-context');
  if (
    (typeof raw.imageUrl === 'string' && raw.imageUrl.trim()) ||
    (typeof raw.imageAlt === 'string' && raw.imageAlt.trim())
  )
    flags.push('legacy-image-reference');
  return flags;
}

function normalizedText(value: string): string {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim();
}

function gradeFromNode(subject: Subject, nodeId: string): Grade | null {
  for (const pattern of LEGACY_GRADE_PATTERNS[subject]) {
    const match = nodeId.match(pattern);
    if (match) return Number(match[1]) as Grade;
  }
  return null;
}

function slugNode(nodeId: string): string {
  return nodeId
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function shortHash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

const PROMPT_REPAIRS: Record<string, string> = {
  'math_4_2#19':
    'A市内の熱中症発生数は、教室7人、校庭7人、体育館4人、その他2人でした。授業中は12人、休み時間は3人、給食中は2人、放課後は3人です。この表から言えることとして正しいものを選ぼう。',
  'math_6_3#16': '縦が 6/7 cm、横が 2/9 cm の長方形の面積を求めよう。',
  'math_6_3#17': '底辺が 1/3 cm、高さが 2/5 cm の平行四辺形の面積を求めよう。',
  'math_6_3#18': '1辺が 2/3 cm の立方体の体積を求めよう。',
  'math_6_3#19': '縦が 8/3 cm、横が 9/25 cm、高さが 5/16 cm の直方体の体積を求めよう。',
  'soc_5_1#6': '世界で人口が多い国の1位と2位に入る国の組み合わせとして正しいものを選ぼう。',
};

function reject(
  rejected: RejectedLegacyQuestion[],
  subject: Subject,
  nodeId: string,
  sourceIndex: number,
  reason: string,
): null {
  rejected.push({ subject, nodeId, sourceIndex, reason });
  return null;
}

function convertOne(
  subject: Subject,
  nodeId: string,
  sourceIndex: number,
  raw: LegacyChoiceQuestion,
  rejected: RejectedLegacyQuestion[],
): StagedLegacyQuestion | null {
  const grade = gradeFromNode(subject, nodeId);
  if (!grade) return reject(rejected, subject, nodeId, sourceIndex, '学年をノードIDから判定できない');
  if (typeof raw.question !== 'string' || !normalizedText(raw.question))
    return reject(rejected, subject, nodeId, sourceIndex, '問題文が空または文字列ではない');
  const prompt = PROMPT_REPAIRS[`${nodeId}#${sourceIndex}`] ?? raw.question.trim();
  const reviewedRaw = prompt === raw.question.trim() ? raw : { ...raw, question: prompt };
  if (raw.answerMode === 'input' || raw.answerMode === 'multi_input') {
    const answers = raw.answerMode === 'input' ? [raw.inputAnswer] : raw.inputAnswers;
    if (
      !Array.isArray(answers) ||
      answers.some((answer) => typeof answer !== 'string' || !normalizedText(answer))
    )
      return reject(rejected, subject, nodeId, sourceIndex, '入力式の正解が空または不正');
    const fingerprint = shortHash(
      JSON.stringify([
        subject,
        grade,
        normalizedText(prompt),
        answers.map((x) => normalizedText(x as string)),
      ]),
    );
    const question: StagedLegacyQuestion = {
      id: `legacy.${subject}.g${grade}.${slugNode(nodeId)}.${fingerprint}`,
      type: 'text-input',
      subject,
      grade,
      unit: `${subject}.g${grade}.legacy-${slugNode(nodeId)}`,
      tags: ['source:legacy-autonomy-game', `legacy-node:${nodeId}`],
      payload: {
        prompt,
        answers: answers as string[],
        ...(typeof raw.inputTemplate === 'string' && raw.inputTemplate.trim()
          ? { template: raw.inputTemplate.trim() }
          : {}),
        ...(typeof raw.inputSuffix === 'string' && raw.inputSuffix.trim()
          ? { suffix: raw.inputSuffix.trim() }
          : {}),
      },
      ...(typeof raw.explanation === 'string' && raw.explanation.trim()
        ? { explanation: raw.explanation.trim() }
        : {}),
      legacy: {
        source: 'autonomy-game',
        nodeId,
        sourceIndex,
        fingerprint,
        reviewStatus: 'unreviewed',
        reviewFlags: detectLegacyReviewFlags(reviewedRaw),
        ...(typeof raw.imageUrl === 'string' && raw.imageUrl.trim()
          ? { sourceImageUrl: raw.imageUrl.trim() }
          : {}),
      },
    };
    return questionBaseSchema.safeParse(question).success &&
      textInputPayloadSchema.safeParse(question.payload).success
      ? question
      : reject(rejected, subject, nodeId, sourceIndex, '現在版の問題スキーマに適合しない');
  }
  if (raw.answerMode === 'map_click') {
    const hotspots = raw.clickHotspots;
    if (!Array.isArray(hotspots) || !Number.isInteger(raw.correctIndex) || typeof raw.imageUrl !== 'string')
      return reject(rejected, subject, nodeId, sourceIndex, '地図クリックの座標・正解・画像が不正');
    const image = `questions/legacy/${raw.imageUrl.split('/').pop()}`;
    const fingerprint = shortHash(
      JSON.stringify([subject, grade, normalizedText(prompt), hotspots, raw.correctIndex]),
    );
    const question: StagedLegacyQuestion = {
      id: `legacy.${subject}.g${grade}.${slugNode(nodeId)}.${fingerprint}`,
      type: 'map-tap',
      subject,
      grade,
      unit: `${subject}.g${grade}.legacy-${slugNode(nodeId)}`,
      tags: ['source:legacy-autonomy-game', `legacy-node:${nodeId}`],
      payload: { prompt, image, hotspots, answerIndex: raw.correctIndex, radius: 9 },
      ...(typeof raw.explanation === 'string' && raw.explanation.trim()
        ? { explanation: raw.explanation.trim() }
        : {}),
      legacy: {
        source: 'autonomy-game',
        nodeId,
        sourceIndex,
        fingerprint,
        reviewStatus: 'unreviewed',
        reviewFlags: [],
      },
    };
    return questionBaseSchema.safeParse(question).success &&
      mapTapPayloadSchema.safeParse(question.payload).success
      ? question
      : reject(rejected, subject, nodeId, sourceIndex, '現在版の問題スキーマに適合しない');
  }
  if (raw.answerMode != null && raw.answerMode !== 'choice')
    return reject(rejected, subject, nodeId, sourceIndex, `未対応の回答形式: ${String(raw.answerMode)}`);
  if (!Array.isArray(raw.choices) || raw.choices.length < 2 || raw.choices.length > 6)
    return reject(rejected, subject, nodeId, sourceIndex, '選択肢は2〜6個である必要がある');
  if (raw.choices.some((choice) => typeof choice !== 'string' || !normalizedText(choice)))
    return reject(rejected, subject, nodeId, sourceIndex, '空または文字列ではない選択肢がある');
  if (!Number.isInteger(raw.correctIndex))
    return reject(rejected, subject, nodeId, sourceIndex, 'correctIndex が整数ではない');

  const originalChoices = raw.choices as string[];
  const originalCorrectIndex = raw.correctIndex as number;
  if (originalCorrectIndex < 0 || originalCorrectIndex >= originalChoices.length)
    return reject(rejected, subject, nodeId, sourceIndex, 'correctIndex が選択肢の範囲外');
  const choices: string[] = [];
  const indexMap: number[] = [];
  for (const choice of originalChoices) {
    const existing = choices.findIndex((item) => normalizedText(item) === normalizedText(choice));
    indexMap.push(existing >= 0 ? existing : choices.push(choice) - 1);
  }
  const correctIndex = indexMap[originalCorrectIndex]!;
  const normalizedChoices = choices.map(normalizedText);

  const fingerprint = shortHash(
    JSON.stringify([subject, grade, normalizedText(prompt), normalizedChoices, correctIndex]),
  );
  const choiceRows = choices.map((text, index) => ({ id: `c${index + 1}`, text: text.trim() }));
  const unitSlug = `legacy-${slugNode(nodeId)}`;
  const question: StagedLegacyQuestion = {
    id: `legacy.${subject}.g${grade}.${slugNode(nodeId)}.${fingerprint}`,
    type: 'choice',
    subject,
    grade,
    unit: `${subject}.g${grade}.${unitSlug}`,
    tags: ['source:legacy-autonomy-game', `legacy-node:${nodeId}`],
    payload: {
      prompt,
      choices: choiceRows,
      answer: choiceRows[correctIndex]!.id,
      shuffle: true,
    },
    ...(typeof raw.explanation === 'string' && raw.explanation.trim()
      ? { explanation: raw.explanation.trim() }
      : {}),
    legacy: {
      source: 'autonomy-game',
      nodeId,
      sourceIndex,
      fingerprint,
      reviewStatus: 'unreviewed',
      reviewFlags: detectLegacyReviewFlags(reviewedRaw),
      ...(typeof raw.imageUrl === 'string' && raw.imageUrl.trim()
        ? { sourceImageUrl: raw.imageUrl.trim() }
        : {}),
    },
  };

  const base = questionBaseSchema.safeParse(question);
  const payload = choicePayloadSchema.safeParse(question.payload);
  if (!base.success || !payload.success)
    return reject(rejected, subject, nodeId, sourceIndex, '現在版の問題スキーマに適合しない');
  return question;
}

export function normalizeLegacyDatabases(sources: LegacySource[]): LegacyImportResult {
  const accepted: StagedLegacyQuestion[] = [];
  const rejected: RejectedLegacyQuestion[] = [];
  const fingerprints = new Set<string>();
  let duplicateCount = 0;

  for (const { subject, database } of sources) {
    for (const [nodeId, questions] of Object.entries(database).sort(([a], [b]) => a.localeCompare(b))) {
      if (!Array.isArray(questions)) {
        rejected.push({ subject, nodeId, sourceIndex: -1, reason: 'ノードの値が配列ではない' });
        continue;
      }
      questions.forEach((raw, sourceIndex) => {
        const converted = convertOne(subject, nodeId, sourceIndex, raw, rejected);
        if (!converted) return;
        if (fingerprints.has(converted.legacy.fingerprint)) {
          duplicateCount += 1;
          rejected.push({ subject, nodeId, sourceIndex, reason: '内容が同一の問題がすでにある' });
          return;
        }
        fingerprints.add(converted.legacy.fingerprint);
        accepted.push(converted);
      });
    }
  }

  accepted.sort((a, b) => a.id.localeCompare(b.id));
  return { accepted, rejected, duplicateCount };
}

async function loadLegacySources(sourceRoot: string): Promise<LegacySource[]> {
  const out: LegacySource[] = [];
  for (const [subject, relativeModule, exportName] of SOURCE_MODULES) {
    const moduleUrl = pathToFileURL(join(sourceRoot, relativeModule)).href;
    const loaded = (await import(moduleUrl)) as Record<string, unknown>;
    const database = loaded[exportName];
    if (!database || typeof database !== 'object')
      throw new Error(`${relativeModule} に ${exportName} がありません`);
    out.push({ subject, database: database as LegacyDatabase });
  }
  return out;
}

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  const sourceArg = readArg('--source');
  if (!sourceArg) throw new Error('--source /path/to/autonomy-game を指定してください');
  const sourceRoot = resolve(sourceArg);
  const outputArg = readArg('--output') ?? 'imports/legacy-questions';
  const outputRoot = isAbsolute(outputArg) ? outputArg : resolve(outputArg);
  const result = normalizeLegacyDatabases(await loadLegacySources(sourceRoot));

  await mkdir(outputRoot, { recursive: true });
  await Promise.all([
    writeFile(join(outputRoot, 'staged.json'), `${JSON.stringify(result.accepted, null, 2)}\n`),
    writeFile(join(outputRoot, 'rejected.json'), `${JSON.stringify(result.rejected, null, 2)}\n`),
    writeFile(
      join(outputRoot, 'report.json'),
      `${JSON.stringify(
        {
          source: sourceRoot,
          generatedAt: new Date().toISOString(),
          accepted: result.accepted.length,
          rejected: result.rejected.length,
          duplicates: result.duplicateCount,
          bySubject: Object.fromEntries(
            SOURCE_MODULES.map(([subject]) => [
              subject,
              result.accepted.filter((question) => question.subject === subject).length,
            ]),
          ),
          reviewFlags: Object.fromEntries(
            ['external-visual-context', 'legacy-image-reference'].map((flag) => [
              flag,
              result.accepted.filter((question) =>
                question.legacy.reviewFlags.includes(flag as LegacyReviewFlag),
              ).length,
            ]),
          ),
          status: 'staged-not-in-game',
          nextStep: '内容と出典をレビューし、承認したノードだけ content/questions へ昇格する',
        },
        null,
        2,
      )}\n`,
    ),
  ]);

  console.log(
    `legacy questions: ${result.accepted.length} staged / ${result.rejected.length} rejected (${result.duplicateCount} duplicates)`,
  );
  console.log(`output: ${outputRoot}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
