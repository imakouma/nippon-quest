import type { Grade, Subject, Unit } from '../content/schemas';
import type { QuestionBase } from '../../questions/contracts';

type CourseKind = NonNullable<Unit['courseKind']>;

const LOWER_SUBJECTS = new Set<Subject>(['kokugo', 'sansu', 'seikatsu']);
const UPPER_SUBJECTS = new Set<Subject>(['kokugo', 'sansu', 'rika', 'shakai']);

export function isRequiredCourse(unit: { grade: Grade; subject: Subject; courseKind: CourseKind }): boolean {
  const { grade, subject, courseKind } = unit;
  if (courseKind === 'supplementary') return false;
  if (grade <= 2) return courseKind === 'required-subject' && LOWER_SUBJECTS.has(subject);
  if (subject === 'eigo')
    return grade <= 4 ? courseKind === 'required-activity' : courseKind === 'required-subject';
  return courseKind === 'required-subject' && UPPER_SUBJECTS.has(subject);
}

export function classifyQuestion(question: QuestionBase, units: ReadonlyMap<string, Unit>) {
  const unit = units.get(question.unit);
  if (!unit || unit.subject !== question.subject || unit.grade !== question.grade) return null;
  return {
    unitId: unit.id,
    courseKind: unit.courseKind,
    terms: unit.placement?.terms,
    placementStatus: unit.placement?.status,
    required: unit.courseKind ? isRequiredCourse({ ...unit, courseKind: unit.courseKind }) : undefined,
  };
}
