import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Grade, QuestionBase } from '../src/questions/contracts';
import { MAX_QUESTIONS_PER_SET, type QuestionSourceFile } from './question-layout';

export interface CanonicalKanjiReading {
  reading: string;
  examples: { word: string; reading: string }[];
}

export interface CanonicalKanjiRecord {
  character: string;
  grade: Grade;
  onyomi: CanonicalKanjiReading[];
  kunyomi: CanonicalKanjiReading[];
  sourceIds: string[];
}

interface WritingPayload {
  mode: 'trace';
  kanji: string;
  reading: string;
  hintWord: string;
}

interface ChoicePayload {
  prompt: string;
  choices: { id: string; text: string }[];
  answer: string;
  shuffle: true;
}

export interface GeneratedWritingQuestion extends Omit<QuestionBase, 'payload' | 'tags' | 'type'> {
  type: 'kanji-trace';
  tags: string[];
  payload: WritingPayload;
}

export interface GeneratedReadingQuestion extends Omit<QuestionBase, 'payload' | 'tags' | 'type'> {
  type: 'choice';
  tags: string[];
  payload: ChoicePayload;
  character: string;
}

export interface GeneratedKanjiQuestions {
  writing: GeneratedWritingQuestion[];
  onyomi: GeneratedReadingQuestion[];
  kunyomi: GeneratedReadingQuestion[];
}

export type KanjiQuestionCategory = keyof GeneratedKanjiQuestions;
type ReadingCategory = Exclude<KanjiQuestionCategory, 'writing'>;

const GRADES: Grade[] = [1, 2, 3, 4, 5, 6];
const CATEGORY_SLUG: Record<KanjiQuestionCategory, string> = {
  writing: 'kanji-writing',
  onyomi: 'kanji-onyomi',
  kunyomi: 'kanji-kunyomi',
};
const READING_LABEL: Record<ReadingCategory, string> = {
  onyomi: '音読み[おんよみ]',
  kunyomi: '訓読み[くんよみ]',
};

export function normalizeKanjiReading(reading: string): string {
  return [...reading.replaceAll('.', '')]
    .map((character) => {
      const code = character.codePointAt(0)!;
      return code >= 0x30a1 && code <= 0x30f6 ? String.fromCodePoint(code - 0x60) : character;
    })
    .join('');
}

function distinctReadings(record: CanonicalKanjiRecord, category: ReadingCategory): string[] {
  return [...new Set(record[category].map(({ reading }) => normalizeKanjiReading(reading)))];
}

function writingQuestions(
  records: readonly CanonicalKanjiRecord[],
  preservedCharacters: ReadonlySet<string>,
): GeneratedWritingQuestion[] {
  const positionByGrade = new Map<Grade, number>();
  return records.flatMap((record) => {
    const position = (positionByGrade.get(record.grade) ?? 0) + 1;
    positionByGrade.set(record.grade, position);
    if (preservedCharacters.has(record.character)) return [];

    const reading = distinctReadings(record, 'kunyomi')[0] ?? distinctReadings(record, 'onyomi')[0];
    if (!reading) throw new Error(`漢字「${record.character}」に書き問題用の読みがありません`);
    return [
      {
        id: `kokugo.g${record.grade}.kanji-writing.${String(position).padStart(4, '0')}`,
        type: 'kanji-trace',
        subject: 'kokugo',
        grade: record.grade,
        unit: `kokugo.g${record.grade}.kanji`,
        tags: ['kanji:writing', 'kanji:canonical'],
        payload: {
          mode: 'trace',
          kanji: record.character,
          reading,
          hintWord: `${record.character}[${reading}]`,
        },
        explanation: `「${record.character}」は「${reading}」と 読[よ]みます。`,
      },
    ];
  });
}

interface ReadingCandidate {
  record: CanonicalKanjiRecord;
  answer: string;
  readingIndex: number;
  recordIndex: number;
}

function readingCandidates(
  records: readonly CanonicalKanjiRecord[],
  category: ReadingCategory,
): ReadingCandidate[] {
  const byRecord = records.map((record, recordIndex) =>
    distinctReadings(record, category).map((answer, readingIndex) => ({
      record,
      answer,
      readingIndex,
      recordIndex,
    })),
  );
  return [
    ...byRecord.flatMap((candidates) => candidates.slice(0, 1)),
    ...byRecord.flatMap((candidates) => candidates.slice(1)),
  ];
}

function readingChoices(
  candidate: ReadingCandidate,
  pool: readonly string[],
  occurrence: number,
  questionIndex: number,
  usedSignatures: Set<string>,
): ChoicePayload['choices'] {
  const eligible = pool.filter((reading) => reading !== candidate.answer);
  if (eligible.length < 3) throw new Error('読み問題の誤答候補が3件未満です');

  for (let attempt = 0; attempt < eligible.length; attempt += 1) {
    const start =
      (candidate.recordIndex * 11 + candidate.readingIndex * 5 + occurrence * 3 + attempt) % eligible.length;
    const distractors: string[] = [];
    for (let offset = 0; distractors.length < 3 && offset < eligible.length; offset += 1) {
      const reading = eligible[(start + offset) % eligible.length]!;
      if (!distractors.includes(reading)) distractors.push(reading);
    }
    const signature = [candidate.record.character, candidate.answer, ...distractors.slice().sort()].join('|');
    if (usedSignatures.has(signature)) continue;
    usedSignatures.add(signature);

    const answerPosition = questionIndex % 4;
    const texts = distractors.slice();
    texts.splice(answerPosition, 0, candidate.answer);
    return texts.map((text, index) => ({ id: String.fromCharCode(97 + index), text }));
  }
  throw new Error(`漢字「${candidate.record.character}」の復習問題に異なる誤答を作れません`);
}

function readingQuestions(
  records: readonly CanonicalKanjiRecord[],
  category: ReadingCategory,
): GeneratedReadingQuestion[] {
  return GRADES.flatMap((grade) => {
    const gradeRecords = records.filter((record) => record.grade === grade);
    const candidates = readingCandidates(gradeRecords, category);
    const targetCount = gradeRecords.length;
    if (candidates.length === 0) throw new Error(`${grade}年の${category}候補がありません`);
    const pool = [...new Set(candidates.map(({ answer }) => answer))];
    const usedSignatures = new Set<string>();

    return Array.from({ length: targetCount }, (_, index) => {
      const candidate = candidates[index % candidates.length]!;
      const occurrence = Math.floor(index / candidates.length);
      const validReadings = new Set(distinctReadings(candidate.record, category));
      const eligiblePool = pool.filter((reading) => !validReadings.has(reading));
      const choices = readingChoices(candidate, eligiblePool, occurrence, index, usedSignatures);
      const answer = choices.find(({ text }) => text === candidate.answer)!.id;
      const label = READING_LABEL[category];
      return {
        id: `kokugo.g${grade}.kanji-${category}.${String(index + 1).padStart(4, '0')}`,
        type: 'choice',
        subject: 'kokugo',
        grade,
        unit: `kokugo.g${grade}.kanji`,
        tags: [`kanji:reading:${category === 'onyomi' ? 'on' : 'kun'}`, 'kanji:canonical'],
        payload: {
          prompt: `「${candidate.record.character}」の ${label}の 一[ひと]つは どれ？`,
          choices,
          answer,
          shuffle: true,
        },
        explanation: `「${candidate.record.character}」の ${label}の 一[ひと]つは「${candidate.answer}」です。`,
        character: candidate.record.character,
      };
    });
  });
}

export function generateKanjiQuestions(
  records: readonly CanonicalKanjiRecord[],
  preservedWritingCharacters: ReadonlySet<string>,
): GeneratedKanjiQuestions {
  return {
    writing: writingQuestions(records, preservedWritingCharacters),
    onyomi: readingQuestions(records, 'onyomi'),
    kunyomi: readingQuestions(records, 'kunyomi'),
  };
}

function persistedQuestion(question: GeneratedWritingQuestion | GeneratedReadingQuestion): QuestionBase {
  if (!('character' in question)) return question;
  const { character: _character, ...persisted } = question;
  return persisted;
}

export function buildKanjiQuestionFiles(
  category: KanjiQuestionCategory,
  questions: readonly (GeneratedWritingQuestion | GeneratedReadingQuestion)[],
): QuestionSourceFile[] {
  return GRADES.flatMap((grade) => {
    const gradeQuestions = questions.filter((question) => question.grade === grade);
    const files: QuestionSourceFile[] = [];
    for (let start = 0; start < gradeQuestions.length; start += MAX_QUESTIONS_PER_SET) {
      files.push({
        file: `questions/kokugo/g${grade}/${CATEGORY_SLUG[category]}/set-${String(Math.floor(start / MAX_QUESTIONS_PER_SET) + 1).padStart(3, '0')}.json`,
        questions: gradeQuestions.slice(start, start + MAX_QUESTIONS_PER_SET).map(persistedQuestion),
      });
    }
    return files;
  });
}

async function preservedWritingCharacters(contentRoot: string): Promise<Set<string>> {
  const paths = ['questions/kokugo/g1/kanji-trace.json', 'questions/kokugo/g2/kanji-trace.json'];
  const questions = (
    await Promise.all(paths.map((path) => readFile(resolve(contentRoot, path), 'utf8').then(JSON.parse)))
  ).flat() as { payload?: { mode?: string; kanji?: string } }[];
  return new Set(
    questions.flatMap(({ payload }) =>
      payload?.mode === 'trace' && typeof payload.kanji === 'string' ? [payload.kanji] : [],
    ),
  );
}

async function writeGeneratedFiles(
  contentRoot: string,
  category: KanjiQuestionCategory,
  files: readonly QuestionSourceFile[],
): Promise<void> {
  for (const grade of GRADES) {
    const relativeDirectory = `questions/kokugo/g${grade}/${CATEGORY_SLUG[category]}`;
    const directory = resolve(contentRoot, relativeDirectory);
    await mkdir(directory, { recursive: true });
    for (const name of await readdir(directory)) {
      if (/^set-\d{3}\.json$/.test(name)) await unlink(resolve(directory, name));
    }
  }
  for (const file of files) {
    const expected = `/kanji-${category === 'writing' ? 'writing' : category}/`;
    if (!file.file.includes(expected)) throw new Error(`生成先が許可リスト外です: ${file.file}`);
    await writeFile(resolve(contentRoot, file.file), `${JSON.stringify(file.questions, null, 2)}\n`);
  }
}

async function main(): Promise<void> {
  const root = resolve(import.meta.dirname, '..');
  const contentRoot = resolve(root, 'content');
  const records = JSON.parse(
    await readFile(resolve(contentRoot, 'kanji/readings.json'), 'utf8'),
  ) as CanonicalKanjiRecord[];
  const preserved = await preservedWritingCharacters(contentRoot);
  const generated = generateKanjiQuestions(records, preserved);
  const requested = process.argv.includes('--category')
    ? process.argv[process.argv.indexOf('--category') + 1]
    : undefined;
  const categories: KanjiQuestionCategory[] = requested
    ? [requested as KanjiQuestionCategory]
    : ['writing', 'onyomi', 'kunyomi'];
  if (categories.some((category) => !(category in generated))) {
    throw new Error(`--category は writing / onyomi / kunyomi から選んでください: ${requested}`);
  }

  for (const category of categories) {
    const files = buildKanjiQuestionFiles(category, generated[category]);
    await writeGeneratedFiles(contentRoot, category, files);
    console.log(`${category}: ${generated[category].length}問 / ${files.length}ファイル`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
