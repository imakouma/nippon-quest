import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { unitSchema } from '../src/core/content/schemas';
import { validateCurriculumGraph } from '../src/core/learning/graph';
import { validateCurriculumConceptUnits, validateCurriculumUnits } from '../src/core/learning/validation';

const ROOT = resolve(import.meta.dirname, '..');
const errors: string[] = [];
const questionIds = new Set<string>();
interface QuestionRecord {
  id: string;
  type?: string;
  subject?: string;
  grade?: number;
  unit?: string;
  payload?: {
    choices?: { id?: string }[];
    answer?: string;
  };
}
const questionsById = new Map<string, QuestionRecord>();

function jsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = resolve(dir, name);
    if (statSync(path).isDirectory()) return name === '_samples' ? [] : jsonFiles(path);
    return name.endsWith('.json') ? [path] : [];
  });
}

for (const file of jsonFiles(resolve(ROOT, 'content/questions'))) {
  const raw = JSON.parse(readFileSync(file, 'utf8')) as unknown;
  if (!Array.isArray(raw)) continue;
  for (const item of raw) {
    const question = item as QuestionRecord;
    if (typeof question.id !== 'string') continue;
    if (questionIds.has(question.id)) errors.push(`問題 ${question.id} が重複しています`);
    questionIds.add(question.id);
    questionsById.set(question.id, question);
  }
}

const units = unitSchema
  .array()
  .parse(JSON.parse(readFileSync(resolve(ROOT, 'content/units.json'), 'utf8')) as unknown);
const classifiableQuestions = [...questionsById.values()].filter(
  (question): question is QuestionRecord & { subject: string; grade: number; unit: string } =>
    typeof question.subject === 'string' &&
    typeof question.grade === 'number' &&
    typeof question.unit === 'string',
);
errors.push(...validateCurriculumUnits(units, classifiableQuestions));

let graphs = 0;
let concepts = 0;
let links = 0;
for (const file of jsonFiles(resolve(ROOT, 'content/curriculum'))) {
  const checked = validateCurriculumGraph(JSON.parse(readFileSync(file, 'utf8')) as unknown);
  if (!checked.graph) {
    errors.push(...checked.errors.map((error) => `${file}: ${error}`));
    continue;
  }
  graphs++;
  concepts += checked.graph.concepts.length;
  links += checked.graph.questionLinks.length;
  errors.push(
    ...validateCurriculumConceptUnits(units, checked.graph.concepts).map((error) => `${file}: ${error}`),
  );
  const conceptsById = new Map(checked.graph.concepts.map((concept) => [concept.id, concept]));
  for (const link of checked.graph.questionLinks) {
    const question = questionsById.get(link.questionId);
    if (!question) {
      errors.push(`${file}: 問題 ${link.questionId} が存在しません`);
      continue;
    }
    for (const mapped of link.concepts) {
      const concept = conceptsById.get(mapped.conceptId);
      if (!concept) continue;
      if (question.subject !== concept.subject || question.grade !== concept.grade)
        errors.push(
          `${file}: 問題 ${link.questionId} (${question.subject} ${question.grade}年) と概念 ${concept.id} (${concept.subject} ${concept.grade}年) の教科・学年が一致しません`,
        );
    }
    for (const signal of link.misconceptionSignals) {
      if (question.type !== 'choice') {
        errors.push(`${file}: 問題 ${link.questionId} は choice ではないため誤答IDを設定できません`);
        continue;
      }
      const choiceIds = new Set(question.payload?.choices?.map((choice) => choice.id) ?? []);
      if (!choiceIds.has(signal.answerId))
        errors.push(`${file}: 問題 ${link.questionId} に誤答ID ${signal.answerId} が存在しません`);
      if (question.payload?.answer === signal.answerId)
        errors.push(`${file}: 問題 ${link.questionId} の正解 ${signal.answerId} を誤答として登録しています`);
    }
  }
}

if (errors.length) {
  console.error(
    `curriculum graph errors (${errors.length}):\n${errors.map((error) => `  - ${error}`).join('\n')}`,
  );
  process.exit(1);
}
console.log(`curriculum graph: ${graphs} graph(s), ${concepts} concepts, ${links} question links OK`);
