import { readFileSync, readdirSync, statSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Grade, QuestionBase } from '../src/questions/contracts';
import { choicePayloadSchema } from '../src/questions/renderers/choice/schema';
import { kanjiTracePayloadSchema } from '../src/questions/renderers/kanji-trace/schema';
import { MAX_QUESTIONS_PER_SET, type QuestionSourceFile } from './question-layout';

interface CanonicalReading {
  reading: string;
}

interface CanonicalKanjiRecord {
  character: string;
  grade: Grade;
  onyomi: CanonicalReading[];
  kunyomi: CanonicalReading[];
}

type ReadingCategory = 'onyomi' | 'kunyomi';

const GRADES: Grade[] = [1, 2, 3, 4, 5, 6];
const PRESERVED_WRITING_IDS = new Set([
  'kokugo.g1.kanji-trace.0001',
  'kokugo.g1.kanji-trace.0002',
  'kokugo.g2.kanji-trace.0001',
]);
const GENERATED_PATH =
  /^questions\/kokugo\/g([1-6])\/(kanji-writing|kanji-onyomi|kanji-kunyomi)\/set-(\d{3})\.json$/;

function normalizeReading(reading: string): string {
  return [...reading.replaceAll('.', '')]
    .map((character) => {
      const code = character.codePointAt(0)!;
      return code >= 0x30a1 && code <= 0x30f6 ? String.fromCodePoint(code - 0x60) : character;
    })
    .join('');
}

function hasTags(question: QuestionBase, ...tags: string[]): boolean {
  return tags.every((tag) => question.tags?.includes(tag));
}

function questionCharacter(prompt: string): string | undefined {
  return /^「(\p{Script=Han})」/u.exec(prompt)?.[1];
}

export function auditKanjiQuestionCoverage(
  records: readonly CanonicalKanjiRecord[],
  sources: readonly QuestionSourceFile[],
): string[] {
  const errors: string[] = [];
  const canonical = new Map(records.map((record) => [record.character, record]));
  const questions = sources.flatMap((source) => source.questions.map((question) => ({ source, question })));
  const canonicalQuestions = questions.filter(({ question }) => hasTags(question, 'kanji:canonical'));
  const seenIds = new Set<string>();
  const setNumbers = new Map<string, number[]>();

  for (const { source, question } of canonicalQuestions) {
    if (seenIds.has(question.id)) errors.push(`正規漢字問題IDが重複しています: ${question.id}`);
    seenIds.add(question.id);
    if (question.unit !== `kokugo.g${question.grade}.kanji`) {
      errors.push(`${question.id}: 単元が学年の正規漢字単元ではありません`);
    }

    const pathMatch = GENERATED_PATH.exec(source.file);
    if (!pathMatch) {
      if (!PRESERVED_WRITING_IDS.has(question.id)) {
        errors.push(`${question.id}: 正規漢字問題が生成専用パスにありません (${source.file})`);
      }
      continue;
    }
    const pathGrade = Number(pathMatch[1]);
    const directory = pathMatch[2]!;
    const setNumber = Number(pathMatch[3]);
    if (source.questions.length === 0 || source.questions.length > MAX_QUESTIONS_PER_SET) {
      errors.push(`${source.file}: 1セットは1〜${MAX_QUESTIONS_PER_SET}問にしてください`);
    }
    if (pathGrade !== question.grade) errors.push(`${question.id}: ファイルの学年と問題の学年が違います`);
    const requiredTag =
      directory === 'kanji-writing'
        ? 'kanji:writing'
        : directory === 'kanji-onyomi'
          ? 'kanji:reading:on'
          : 'kanji:reading:kun';
    if (!hasTags(question, requiredTag)) errors.push(`${question.id}: ${requiredTag} タグがありません`);

    const setKey = `${pathGrade}/${directory}`;
    const numbers = setNumbers.get(setKey) ?? [];
    if (!numbers.includes(setNumber)) numbers.push(setNumber);
    setNumbers.set(setKey, numbers);
  }

  for (const [key, numbers] of setNumbers) {
    numbers.sort((left, right) => left - right);
    if (numbers.some((number, index) => number !== index + 1)) {
      errors.push(`${key}: set番号が連番ではありません (${numbers.join(', ')})`);
    }
  }

  const writing = canonicalQuestions.filter(({ question }) => hasTags(question, 'kanji:writing'));
  const writingCharacters = new Map<string, string[]>();
  for (const { question } of writing) {
    const parsed = kanjiTracePayloadSchema.safeParse(question.payload);
    if (!parsed.success || parsed.data.mode !== 'trace') {
      errors.push(`${question.id}: 書き問題が kanji-trace の trace モードではありません`);
      continue;
    }
    if (question.type !== 'kanji-trace')
      errors.push(`${question.id}: 書き問題のtypeがkanji-traceではありません`);
    const record = canonical.get(parsed.data.kanji);
    if (!record) errors.push(`${question.id}: 配当表にない漢字「${parsed.data.kanji}」です`);
    else if (record.grade !== question.grade) errors.push(`${question.id}: 漢字の配当学年が違います`);
    const ids = writingCharacters.get(parsed.data.kanji) ?? [];
    ids.push(question.id);
    writingCharacters.set(parsed.data.kanji, ids);

    if (
      !PRESERVED_WRITING_IDS.has(question.id) &&
      !new RegExp(`^kokugo\\.g${question.grade}\\.kanji-writing\\.\\d{4}$`).test(question.id)
    ) {
      errors.push(`${question.id}: 書き問題IDが規則に一致しません`);
    }
  }
  for (const record of records) {
    const ids = writingCharacters.get(record.character) ?? [];
    if (ids.length !== 1) {
      errors.push(`漢字「${record.character}」の正規書き問題は1問必要です (${ids.length}問)`);
    }
  }

  for (const category of ['onyomi', 'kunyomi'] as const) {
    const tag = category === 'onyomi' ? 'kanji:reading:on' : 'kanji:reading:kun';
    const label = category === 'onyomi' ? '音読み' : '訓読み';
    const categoryQuestions = canonicalQuestions.filter(({ question }) => hasTags(question, tag));
    const signatures = new Set<string>();

    for (const { question } of categoryQuestions) {
      if (question.type !== 'choice') errors.push(`${question.id}: ${label}問題のtypeがchoiceではありません`);
      const parsed = choicePayloadSchema.safeParse(question.payload);
      if (!parsed.success) {
        errors.push(`${question.id}: ${label}問題の4択が不正です`);
        continue;
      }
      const character = questionCharacter(parsed.data.prompt);
      const record = character ? canonical.get(character) : undefined;
      if (!character || !record) {
        errors.push(`${question.id}: 問題文から正規漢字を特定できません`);
        continue;
      }
      if (record.grade !== question.grade) errors.push(`${question.id}: 漢字の配当学年が違います`);
      if (!new RegExp(`^kokugo\\.g${question.grade}\\.kanji-${category}\\.\\d{4}$`).test(question.id)) {
        errors.push(`${question.id}: ${label}問題IDが規則に一致しません`);
      }

      const choices = parsed.data.choices.flatMap(({ text }) => (text ? [text] : []));
      const answer = parsed.data.choices.find(({ id }) => id === parsed.data.answer)?.text;
      const validReadings = new Set(record[category].map(({ reading }) => normalizeReading(reading)));
      if (choices.length !== 4 || new Set(choices).size !== 4) {
        errors.push(`${question.id}: ${label}の選択肢は異なる平仮名4件にしてください`);
      }
      if (!answer || !validReadings.has(answer)) {
        errors.push(`${question.id}: 正解「${answer ?? ''}」が正規データの${label}にありません`);
        continue;
      }
      if (choices.some((choice) => !/^[ぁ-ゖー]+$/u.test(choice))) {
        errors.push(`${question.id}: ${label}の選択肢は平仮名にしてください`);
      }
      const correctChoices = choices.filter((choice) => validReadings.has(choice));
      if (correctChoices.length !== 1 || correctChoices[0] !== answer) {
        errors.push(`${question.id}: 別の正しい${label}を誤答に含めています`);
      }
      const signature = [character, answer, ...choices.filter((choice) => choice !== answer).sort()].join(
        '|',
      );
      if (signatures.has(signature)) errors.push(`${question.id}: 同じ${label}復習問題が重複しています`);
      signatures.add(signature);
    }

    for (const grade of GRADES) {
      const expected = records.filter((record) => record.grade === grade).length;
      const actual = categoryQuestions.filter(({ question }) => question.grade === grade).length;
      if (actual < expected) errors.push(`${grade}年の${label}問題が不足しています (${actual}/${expected})`);
    }
  }

  for (const grade of GRADES) {
    const expected = records.filter((record) => record.grade === grade).length;
    const actual = writing.filter(({ question }) => question.grade === grade).length;
    if (actual !== expected) errors.push(`${grade}年の書き問題数が違います (${actual}/${expected})`);
  }
  return errors;
}

function questionSources(contentRoot: string): QuestionSourceFile[] {
  const questionRoot = resolve(contentRoot, 'questions');
  const files: string[] = [];
  const walk = (directory: string) => {
    for (const name of readdirSync(directory)) {
      const path = resolve(directory, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name.endsWith('.json')) files.push(path);
    }
  };
  walk(questionRoot);
  return files.map((path) => ({
    file: relative(contentRoot, path).split(sep).join('/'),
    questions: JSON.parse(readFileSync(path, 'utf8')) as QuestionBase[],
  }));
}

async function main(): Promise<void> {
  const contentRoot = resolve(import.meta.dirname, '../content');
  const records = JSON.parse(
    readFileSync(resolve(contentRoot, 'kanji/readings.json'), 'utf8'),
  ) as CanonicalKanjiRecord[];
  const sources = questionSources(contentRoot);
  const errors = auditKanjiQuestionCoverage(records, sources);
  if (errors.length) {
    errors.forEach((error) => console.error(`- ${error}`));
    throw new Error(`正規漢字問題に ${errors.length} 件の不整合があります`);
  }

  const canonicalQuestions = sources
    .flatMap(({ questions }) => questions)
    .filter((question) => hasTags(question, 'kanji:canonical'));
  const counts = GRADES.map((grade) => {
    const gradeQuestions = canonicalQuestions.filter((question) => question.grade === grade);
    const writing = gradeQuestions.filter((question) => hasTags(question, 'kanji:writing')).length;
    const onyomi = gradeQuestions.filter((question) => hasTags(question, 'kanji:reading:on')).length;
    const kunyomi = gradeQuestions.filter((question) => hasTags(question, 'kanji:reading:kun')).length;
    return `${grade}年 書${writing}/音${onyomi}/訓${kunyomi}`;
  });
  console.log(`canonical kanji questions: ${canonicalQuestions.length}問 (${counts.join(' / ')})`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
