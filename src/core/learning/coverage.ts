import type { Grade, Unit } from '../content/schemas';
import { isRequiredCourse } from './placement';

export function buildCurriculumCoverage(input: {
  units: readonly Unit[];
  questions: readonly { id: string; unit: string }[];
  concepts: readonly {
    id: string;
    unit: string;
    recommendedWindow?: { stage: 'early' | 'middle' | 'late' | 'variable' };
  }[];
  linkedQuestionIds: ReadonlySet<string>;
  questionConceptLinks?: readonly {
    questionId: string;
    concepts: readonly { conceptId: string; role: 'primary' | 'supporting' | 'reading' }[];
  }[];
  grade: Grade;
  term: 1 | 2 | 3;
}) {
  const stageForTerm = { 1: 'early', 2: 'middle', 3: 'late' } as const;
  const conceptsById = new Map(input.concepts.map((concept) => [concept.id, concept]));
  const linksByQuestion = new Map(
    (input.questionConceptLinks ?? []).map((link) => [link.questionId, link.concepts]),
  );
  const targets = input.units.filter(
    (unit) =>
      unit.grade === input.grade &&
      unit.courseKind !== undefined &&
      isRequiredCourse({ ...unit, courseKind: unit.courseKind }) &&
      unit.placement?.terms.some((term) => term === input.term || term === 'variable'),
  );
  const units = targets.map((unit) => {
    const questions = input.questions.filter((question) => question.unit === unit.id);
    const linked = questions.filter((question) => input.linkedQuestionIds.has(question.id)).length;
    const placement = unit.placement?.terms ?? [];
    const exactTerm = placement.length === 1 && placement[0] === input.term;
    const placementKind = exactTerm ? 'exact' : 'spans-terms';
    const confirmedQuestions = questions.filter((question) => {
      if (exactTerm) return true;
      return (linksByQuestion.get(question.id) ?? []).some(
        (link) =>
          link.role === 'primary' &&
          conceptsById.get(link.conceptId)?.recommendedWindow?.stage === stageForTerm[input.term],
      );
    });
    const confirmedLinked = confirmedQuestions.filter((question) =>
      input.linkedQuestionIds.has(question.id),
    ).length;
    return {
      unitId: unit.id,
      subject: unit.subject,
      name: unit.name,
      goals: input.concepts.filter((concept) => concept.unit === unit.id).length,
      questions: questions.length,
      confirmedTermQuestions: confirmedQuestions.length,
      linked,
      unreviewed: questions.length - linked,
      confirmedTermUnreviewed: confirmedQuestions.length - confirmedLinked,
      placementKind,
    };
  });
  const targetUnitIds = new Set(targets.map((unit) => unit.id));
  const primaryConceptCounts = new Map<string, number>();
  for (const link of input.questionConceptLinks ?? [])
    for (const concept of link.concepts)
      if (concept.role === 'primary')
        primaryConceptCounts.set(concept.conceptId, (primaryConceptCounts.get(concept.conceptId) ?? 0) + 1);
  const conceptCoverage = input.concepts
    .filter(
      (concept) =>
        targetUnitIds.has(concept.unit) && concept.recommendedWindow?.stage === stageForTerm[input.term],
    )
    .map((concept) => ({
      conceptId: concept.id,
      unitId: concept.unit,
      primaryQuestions: primaryConceptCounts.get(concept.id) ?? 0,
    }));
  const findings = units.flatMap((unit) => {
    const items: Array<{ unitId: string; kind: string; severity: 'error' | 'review' }> = [];
    if (unit.goals === 0) items.push({ unitId: unit.unitId, kind: 'missing-goals', severity: 'error' });
    if (unit.questions === 0)
      items.push({ unitId: unit.unitId, kind: 'missing-questions', severity: 'error' });
    if (unit.placementKind === 'spans-terms')
      items.push({ unitId: unit.unitId, kind: 'ambiguous-term-placement', severity: 'review' });
    if (unit.questions > 0 && unit.linked === 0)
      items.push({ unitId: unit.unitId, kind: 'all-questions-unreviewed', severity: 'review' });
    else if (unit.unreviewed > 0)
      items.push({ unitId: unit.unitId, kind: 'some-questions-unreviewed', severity: 'review' });
    if (unit.confirmedTermUnreviewed > 0)
      items.push({ unitId: unit.unitId, kind: 'confirmed-term-unreviewed', severity: 'error' });
    return items;
  });
  const conceptFindings = conceptCoverage
    .filter((concept) => concept.primaryQuestions < 3)
    .map((concept) => ({
      unitId: concept.unitId,
      conceptId: concept.conceptId,
      kind: 'sparse-learning-goal',
      severity: 'review' as const,
    }));
  return {
    grade: input.grade,
    term: input.term,
    units,
    gaps: units.filter((unit) => unit.goals === 0 || unit.questions === 0),
    conceptCoverage,
    findings: [...findings, ...conceptFindings],
  };
}
