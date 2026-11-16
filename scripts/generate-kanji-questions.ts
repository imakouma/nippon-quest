import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import g1OnyomiContexts from '../content/kanji/g1-onyomi-contexts.json';
import g1KunyomiContexts from '../content/kanji/g1-kunyomi-contexts.json';
import g2OnyomiContexts from '../content/kanji/g2-onyomi-contexts.json';
import g2KunyomiContexts from '../content/kanji/g2-kunyomi-contexts.json';
import g3OnyomiContexts from '../content/kanji/g3-onyomi-contexts.json';
import g3KunyomiContexts from '../content/kanji/g3-kunyomi-contexts.json';
import g4OnyomiContexts from '../content/kanji/g4-onyomi-contexts.json';
import g4KunyomiContexts from '../content/kanji/g4-kunyomi-contexts.json';
import g5OnyomiContexts from '../content/kanji/g5-onyomi-contexts.json';
import g5KunyomiContexts from '../content/kanji/g5-kunyomi-contexts.json';
import g6OnyomiContexts from '../content/kanji/g6-onyomi-contexts.json';
import g6KunyomiContexts from '../content/kanji/g6-kunyomi-contexts.json';
import type { TextInputPayload } from '../src/questions/renderers/text-input/schema';
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

export interface GeneratedWritingQuestion extends Omit<QuestionBase, 'payload' | 'tags' | 'type'> {
  type: 'kanji-trace';
  tags: string[];
  payload: WritingPayload;
}

export type GeneratedReadingQuestion = Omit<QuestionBase, 'payload' | 'tags' | 'type'> & {
  tags: string[];
  character: string;
  type: 'text-input';
  payload: TextInputPayload;
};

export interface GeneratedKanjiQuestions {
  writing: GeneratedWritingQuestion[];
  onyomi: GeneratedReadingQuestion[];
  kunyomi: GeneratedReadingQuestion[];
}

export type KanjiQuestionCategory = keyof GeneratedKanjiQuestions;
type ReadingCategory = Exclude<KanjiQuestionCategory, 'writing'>;

const GRADES: Grade[] = [1, 2, 3, 4, 5, 6];
export const KANJI_UNIT_BY_GRADE: Record<Grade, string> = {
  1: 'kokugo.g1.kanji',
  2: 'kokugo.g2.kanji',
  3: 'kokugo.g3.legacy-jpn-3-1',
  4: 'kokugo.g4.legacy-jpn-4-1',
  5: 'kokugo.g5.legacy-jpn-5-1',
  6: 'kokugo.g6.legacy-jpn-6-1',
};
const CATEGORY_SLUG: Record<KanjiQuestionCategory, string> = {
  writing: 'kanji-writing',
  onyomi: 'kanji-onyomi',
  kunyomi: 'kanji-kunyomi',
};
const READING_CONTEXTS = {
  1: {
    onyomi: Object.entries(g1OnyomiContexts).map(([key, prompt]) => {
      const [character, reading] = key.split(':');
      return { character: character!, reading: reading!, prompt };
    }),
    kunyomi: g1KunyomiContexts,
  },
  2: { onyomi: g2OnyomiContexts, kunyomi: g2KunyomiContexts },
  3: { onyomi: g3OnyomiContexts, kunyomi: g3KunyomiContexts },
  4: { onyomi: g4OnyomiContexts, kunyomi: g4KunyomiContexts },
  5: { onyomi: g5OnyomiContexts, kunyomi: g5KunyomiContexts },
  6: { onyomi: g6OnyomiContexts, kunyomi: g6KunyomiContexts },
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
        unit: KANJI_UNIT_BY_GRADE[record.grade],
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

function readingQuestions(
  records: readonly CanonicalKanjiRecord[],
  category: ReadingCategory,
): GeneratedReadingQuestion[] {
  return GRADES.flatMap((grade) => {
    const gradeRecords = records.filter((record) => record.grade === grade);
    const contexts = READING_CONTEXTS[grade][category];
    if (contexts.length !== gradeRecords.length)
      throw new Error(`${grade}年の${category}例文は${gradeRecords.length}問必要です`);
    return contexts.map(
      (
        context: { character: string; reading: string; prompt: string; okurigana?: string },
        index,
      ): GeneratedReadingQuestion => {
        const { character, reading, prompt, okurigana = '' } = context;
        if (!prompt) throw new Error(`${grade}年の${category}例文がありません: ${index + 1}`);
        if (!reading.endsWith(okurigana) || !prompt.includes(character + okurigana))
          throw new Error(`${grade}年の${category}例文と送り仮名が一致しません: ${character}`);
        const answer = okurigana ? reading.slice(0, -okurigana.length) : reading;
        return {
          id: `kokugo.g${grade}.kanji-${category}.${String(index + 1).padStart(4, '0')}`,
          type: 'text-input',
          subject: 'kokugo',
          grade,
          unit: KANJI_UNIT_BY_GRADE[grade],
          tags: [`kanji:reading:${category === 'onyomi' ? 'on' : 'kun'}`, 'kanji:canonical'],
          payload: { prompt, template: `よみかた：{{INPUT}}${okurigana}`, answers: [answer] },
          explanation: `「${prompt}」の「${character}」は「${answer}」と 読[よ]みます。`,
          character,
        };
      },
    );
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
