import type { Unit } from '../content/schemas';
import { isRequiredCourse } from './placement';

export function validateCurriculumUnits(
  units: readonly Unit[],
  questions: readonly { id: string; subject: string; grade: number; unit: string }[],
): string[] {
  const errors: string[] = [];
  const byId = new Map<string, Unit>();
  for (const unit of units) {
    if (byId.has(unit.id)) errors.push(`${unit.id}: 単元IDが重複しています`);
    byId.set(unit.id, unit);
    const expectedPrefix = `${unit.subject}.g${unit.grade}.`;
    if (!unit.id.startsWith(expectedPrefix)) errors.push(`${unit.id}: IDと教科・学年が一致しません`);
    if (
      unit.courseKind &&
      unit.courseKind !== 'supplementary' &&
      !isRequiredCourse({ ...unit, courseKind: unit.courseKind })
    )
      errors.push(
        `${unit.id}: ${unit.grade}年 ${unit.subject} は ${unit.courseKind} の正式課程ではありません`,
      );
  }
  for (const question of questions) {
    const unit = byId.get(question.unit);
    if (!unit) {
      errors.push(`${question.id}: 単元 ${question.unit} が存在しません`);
      continue;
    }
    if (unit.subject !== question.subject || unit.grade !== question.grade)
      errors.push(`${question.id}: 問題と単元 ${unit.id} の教科・学年が一致しません`);
  }
  return errors;
}

/** 教材グラフの概念が、実在する同教科・同学年の単元へ属しているか検証する。 */
export function validateCurriculumConceptUnits(
  units: readonly Unit[],
  concepts: readonly { id: string; subject: string; grade: number; unit: string }[],
): string[] {
  const errors: string[] = [];
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  for (const concept of concepts) {
    const unit = byId.get(concept.unit);
    if (!unit) {
      errors.push(`${concept.id}: 単元 ${concept.unit} が存在しません`);
      continue;
    }
    if (unit.subject !== concept.subject || unit.grade !== concept.grade)
      errors.push(`${concept.id}: 概念と単元 ${unit.id} の教科・学年が一致しません`);
  }
  return errors;
}
