import { isDeepStrictEqual } from 'node:util';
import type { QuestionCatalog } from '../src/core/content/manifest';
import type { Grade, QuestionBase, Subject } from '../src/questions/contracts';

export const MAX_QUESTIONS_PER_SET = 30;

const UNIT_PATTERN = /^(kokugo|sansu|rika|shakai|seikatsu|eigo)\.g([1-6])\.([a-z0-9-]+)$/;
const SET_PATH_PATTERN =
  /^questions\/(kokugo|sansu|rika|shakai|seikatsu|eigo)\/g([1-6])\/([a-z0-9-]+)\/set-(\d{3})\.json$/;

export interface QuestionSourceFile {
  file: string;
  questions: QuestionBase[];
}

export interface QuestionLayoutParity {
  ok: boolean;
  errors: string[];
  questions: number;
  units: number;
}

interface UnitDescriptor {
  subject: Subject;
  grade: Grade;
  unit: string;
  slug: string;
}

const SUBJECT_ORDER: Subject[] = ['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo'];

function describeUnit(question: QuestionBase): UnitDescriptor {
  const match = UNIT_PATTERN.exec(question.unit);
  if (!match) throw new Error(`問題 ${question.id}: 単元コードが不正です: ${question.unit}`);
  const subject = match[1] as Subject;
  const grade = Number(match[2]) as Grade;
  if (question.subject !== subject || question.grade !== grade) {
    throw new Error(
      `問題 ${question.id}: subject/grade と unit が一致しません: ${question.subject}/g${question.grade} vs ${question.unit}`,
    );
  }
  return { subject, grade, unit: question.unit, slug: match[3]! };
}

function setPath(descriptor: UnitDescriptor, setNumber: number): string {
  return `questions/${descriptor.subject}/g${descriptor.grade}/${descriptor.slug}/set-${String(setNumber).padStart(3, '0')}.json`;
}

export function buildQuestionSets(
  sources: readonly QuestionSourceFile[],
  maxQuestionsPerSet = MAX_QUESTIONS_PER_SET,
): QuestionSourceFile[] {
  if (!Number.isInteger(maxQuestionsPerSet) || maxQuestionsPerSet <= 0) {
    throw new Error('セット上限は正の整数で指定してください');
  }

  const seenIds = new Set<string>();
  const groups = new Map<string, { descriptor: UnitDescriptor; questions: QuestionBase[] }>();
  for (const source of sources) {
    for (const question of source.questions) {
      if (seenIds.has(question.id)) throw new Error(`問題IDが重複しています: ${question.id}`);
      seenIds.add(question.id);
      const descriptor = describeUnit(question);
      const group = groups.get(descriptor.unit) ?? { descriptor, questions: [] };
      group.questions.push(question);
      groups.set(descriptor.unit, group);
    }
  }

  const output: QuestionSourceFile[] = [];
  const orderedGroups = [...groups.values()].sort((a, b) =>
    setPath(a.descriptor, 1).localeCompare(setPath(b.descriptor, 1)),
  );
  for (const group of orderedGroups) {
    for (let start = 0; start < group.questions.length; start += maxQuestionsPerSet) {
      const setNumber = Math.floor(start / maxQuestionsPerSet) + 1;
      output.push({
        file: setPath(group.descriptor, setNumber),
        questions: group.questions.slice(start, start + maxQuestionsPerSet),
      });
    }
  }
  return output;
}

export function buildQuestionCatalog(sources: readonly QuestionSourceFile[]): QuestionCatalog {
  type SetNode = { file: string; count: number; types: Set<string> };
  type UnitNode = UnitDescriptor & { count: number; sets: Map<string, SetNode> };
  const units = new Map<string, UnitNode>();
  let totalQuestions = 0;

  for (const source of sources) {
    if (source.file.startsWith('questions/_samples/')) continue;
    for (const question of source.questions) {
      const descriptor = describeUnit(question);
      const unit = units.get(descriptor.unit) ?? { ...descriptor, count: 0, sets: new Map() };
      const set = unit.sets.get(source.file) ?? { file: source.file, count: 0, types: new Set() };
      set.count += 1;
      set.types.add(question.type);
      unit.count += 1;
      unit.sets.set(source.file, set);
      units.set(descriptor.unit, unit);
      totalQuestions += 1;
    }
  }

  const subjects = SUBJECT_ORDER.flatMap((subject) => {
    const subjectUnits = [...units.values()].filter((unit) => unit.subject === subject);
    if (subjectUnits.length === 0) return [];
    const grades = ([1, 2, 3, 4, 5, 6] as Grade[]).flatMap((grade) => {
      const gradeUnits = subjectUnits
        .filter((unit) => unit.grade === grade)
        .sort((a, b) => a.unit.localeCompare(b.unit));
      if (gradeUnits.length === 0) return [];
      return [
        {
          grade,
          count: gradeUnits.reduce((sum, unit) => sum + unit.count, 0),
          units: gradeUnits.map((unit) => ({
            unit: unit.unit,
            slug: unit.slug,
            count: unit.count,
            sets: [...unit.sets.values()]
              .sort((a, b) => a.file.localeCompare(b.file))
              .map((set) => ({
                file: set.file,
                count: set.count,
                types: [...set.types].sort(),
              })),
          })),
        },
      ];
    });
    return [
      {
        subject,
        count: grades.reduce((sum, grade) => sum + grade.count, 0),
        grades,
      },
    ];
  });

  return { version: 1, maxQuestionsPerSet: 30, totalQuestions, subjects };
}

function orderedIdsByUnit(sources: readonly QuestionSourceFile[]): Map<string, string[]> {
  const ids = new Map<string, string[]>();
  for (const source of sources) {
    for (const question of source.questions) {
      const list = ids.get(question.unit) ?? [];
      list.push(question.id);
      ids.set(question.unit, list);
    }
  }
  return ids;
}

function questionsById(
  sources: readonly QuestionSourceFile[],
  label: string,
  errors: string[],
): Map<string, QuestionBase> {
  const questions = new Map<string, QuestionBase>();
  for (const source of sources) {
    for (const question of source.questions) {
      if (questions.has(question.id)) errors.push(`${label}で問題IDが重複しています: ${question.id}`);
      questions.set(question.id, question);
    }
  }
  return questions;
}

export function compareQuestionLayouts(
  before: readonly QuestionSourceFile[],
  after: readonly QuestionSourceFile[],
): QuestionLayoutParity {
  const errors: string[] = [];
  const beforeById = questionsById(before, '移行前', errors);
  const afterById = questionsById(after, '移行後', errors);
  const beforeIds = [...beforeById.keys()].sort();
  const afterIds = [...afterById.keys()].sort();
  if (!isDeepStrictEqual(beforeIds, afterIds)) errors.push('問題ID集合が一致しません');

  for (const id of beforeIds) {
    const beforeQuestion = beforeById.get(id);
    const afterQuestion = afterById.get(id);
    if (afterQuestion && !isDeepStrictEqual(beforeQuestion, afterQuestion)) {
      errors.push(`問題JSONが変わっています: ${id}`);
    }
  }

  const beforeOrder = orderedIdsByUnit(before);
  const afterOrder = orderedIdsByUnit(after);
  for (const [unit, ids] of beforeOrder) {
    if (!isDeepStrictEqual(ids, afterOrder.get(unit))) {
      errors.push(`単元内の問題順が変わっています: ${unit}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    questions: beforeById.size,
    units: beforeOrder.size,
  };
}

export function validateQuestionSetLayout(
  sources: readonly QuestionSourceFile[],
  maxQuestionsPerSet = MAX_QUESTIONS_PER_SET,
): string[] {
  const errors: string[] = [];
  const setNumbersByUnit = new Map<string, number[]>();
  const seenIds = new Set<string>();

  for (const source of sources) {
    if (source.questions.length === 0) {
      errors.push(`${source.file}: 空の問題セットです`);
      continue;
    }
    if (source.questions.length > maxQuestionsPerSet) {
      errors.push(`${source.file}: ${maxQuestionsPerSet}問を超えています (${source.questions.length}問)`);
    }

    const descriptors: UnitDescriptor[] = [];
    for (const question of source.questions) {
      if (seenIds.has(question.id)) errors.push(`${source.file}: 問題IDが重複しています: ${question.id}`);
      seenIds.add(question.id);
      try {
        descriptors.push(describeUnit(question));
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
    const units = new Set(descriptors.map(({ unit }) => unit));
    if (units.size !== 1) errors.push(`${source.file}: 複数の単元を含んでいます`);

    const pathMatch = SET_PATH_PATTERN.exec(source.file);
    const descriptor = descriptors[0];
    if (!pathMatch || !descriptor) {
      errors.push(`${source.file}: 正規パスと一致しません`);
      continue;
    }
    const pathSubject = pathMatch[1];
    const pathGrade = Number(pathMatch[2]);
    const pathSlug = pathMatch[3];
    const setNumber = Number(pathMatch[4]);
    if (
      pathSubject !== descriptor.subject ||
      pathGrade !== descriptor.grade ||
      pathSlug !== descriptor.slug ||
      units.size !== 1
    ) {
      errors.push(`${source.file}: 正規パスと一致しません`);
    }
    const numbers = setNumbersByUnit.get(descriptor.unit) ?? [];
    numbers.push(setNumber);
    setNumbersByUnit.set(descriptor.unit, numbers);
  }

  for (const [unit, numbers] of setNumbersByUnit) {
    numbers.sort((a, b) => a - b);
    if (numbers.some((number, index) => number !== index + 1)) {
      errors.push(`${unit}: セット番号が連番ではありません: ${numbers.join(', ')}`);
    }
  }
  return errors;
}
