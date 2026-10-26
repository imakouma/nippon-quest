import type { Unit } from '../../core/content/schemas';
import {
  curriculumGraph,
  estimatedRetention,
  type ConceptStateData,
  type CurriculumGraph,
} from '../../core/learning';
import { availableRoadmapSubjects, isCompletedRoadmapProgress } from '../../core/learning/subjectUnlocks';
import { canonicalUnitId, LEGACY_UNIT_ALIASES } from '../../core/learning/unitAliases';
import type { MasteryData, MasteryRecord } from '../../questions/engine/mastery';
import type { RoadmapNode } from '../../shared/menuModel';
import { layoutRoadmapNodes } from './roadmapLayout';

export { LEGACY_QUESTION_UNIT_ALIASES, LEGACY_UNIT_ALIASES } from '../../core/learning/unitAliases';

const SUBJECT_ORDER = ['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo'];

export interface RoadmapInput {
  units: Iterable<Unit>;
  mastery: MasteryData;
  curriculum?: CurriculumGraph;
  conceptStates?: ConceptStateData;
  grandfatheredUnitIds?: Iterable<string>;
  revealAll?: boolean;
  now?: number;
  playerGrade: number;
  challengeHigher: boolean;
  subjectLabel: (subject: string) => string;
}

/** ゲーム本体で使う正規カリキュラムを結びつけ、Sceneから教材定義の所在を隠す。 */
export function buildGameRoadmapNodes(input: Omit<RoadmapInput, 'curriculum'>): RoadmapNode[] {
  return buildRoadmapNodes({ ...input, curriculum: curriculumGraph });
}

/** GameState と教材定義から表示専用データを作る。Phaser/DOMには依存しない。 */
export function buildRoadmapNodes(input: RoadmapInput): RoadmapNode[] {
  const allUnits = [...input.units];
  const unitById = new Map(allUnits.map((unit) => [unit.id, unit]));
  const replacedLegacyUnits = new Set(
    allUnits
      .filter((unit) => {
        const replacementId = unit.legacyNode ? LEGACY_UNIT_ALIASES[unit.legacyNode] : undefined;
        return replacementId !== undefined && replacementId !== unit.id && unitById.has(replacementId);
      })
      .map((unit) => unit.id),
  );
  const units = allUnits
    .filter((unit) => !replacedLegacyUnits.has(unit.id))
    .sort(
      (a, b) =>
        SUBJECT_ORDER.indexOf(a.subject) - SUBJECT_ORDER.indexOf(b.subject) ||
        a.grade - b.grade ||
        (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
        a.id.localeCompare(b.id),
    );

  const masteryId = (unit: Unit) =>
    unit.legacyNode ? (LEGACY_UNIT_ALIASES[unit.legacyNode] ?? unit.id) : unit.id;
  const displayIdByUnitId = new Map<string, string>();
  for (const unit of units) {
    displayIdByUnitId.set(unit.id, unit.id);
    displayIdByUnitId.set(masteryId(unit), unit.id);
  }
  for (const unit of allUnits) {
    const canonicalId = canonicalUnitId(unit.id);
    if (displayIdByUnitId.has(canonicalId)) displayIdByUnitId.set(unit.id, canonicalId);
  }

  const grandfatheredDisplayUnits = new Set<string>();
  for (const savedId of input.grandfatheredUnitIds ?? []) {
    const canonicalId = LEGACY_UNIT_ALIASES[savedId] ?? canonicalUnitId(savedId);
    const displayId = displayIdByUnitId.get(savedId) ?? displayIdByUnitId.get(canonicalId);
    if (displayId) grandfatheredDisplayUnits.add(displayId);
  }

  const masteryKeysByDisplayUnit = new Map<string, Set<string>>();
  for (const unit of allUnits) {
    const displayId = displayIdByUnitId.get(unit.id) ?? displayIdByUnitId.get(masteryId(unit));
    if (!displayId) continue;
    const keys = masteryKeysByDisplayUnit.get(displayId) ?? new Set<string>();
    keys.add(displayId);
    keys.add(unit.id);
    keys.add(masteryId(unit));
    if (unit.legacyNode) keys.add(unit.legacyNode);
    masteryKeysByDisplayUnit.set(displayId, keys);
  }
  const mergedMastery = (displayId: string): MasteryRecord | undefined => {
    const records = [...(masteryKeysByDisplayUnit.get(displayId) ?? [displayId])]
      .map((key) => input.mastery[key])
      .filter((record): record is MasteryRecord => record !== undefined);
    if (!records.length) return undefined;
    const weightedAttempts = records.reduce((sum, record) => sum + Math.max(1, record.n), 0);
    return {
      value:
        records.reduce((sum, record) => sum + record.value * Math.max(1, record.n), 0) / weightedAttempts,
      n: records.reduce((sum, record) => sum + record.n, 0),
      lastAt: Math.max(...records.map((record) => record.lastAt)),
    };
  };

  const prerequisiteIds = new Map<string, Set<string>>();
  const conceptsByUnit = new Map<string, string[]>();
  if (input.curriculum) {
    const displayUnitByConcept = new Map<string, string>();
    for (const concept of input.curriculum.concepts) {
      const displayUnitId =
        displayIdByUnitId.get(canonicalUnitId(concept.unit)) ?? displayIdByUnitId.get(concept.unit);
      if (!displayUnitId || concept.kind === 'misconception') continue;
      displayUnitByConcept.set(concept.id, displayUnitId);
      const ids = conceptsByUnit.get(displayUnitId) ?? [];
      ids.push(concept.id);
      conceptsByUnit.set(displayUnitId, ids);
    }
    for (const relation of input.curriculum.relations) {
      if (relation.kind !== 'prerequisite') continue;
      const from = displayUnitByConcept.get(relation.from);
      const to = displayUnitByConcept.get(relation.to);
      if (!from || !to || from === to) continue;
      const ids = prerequisiteIds.get(to) ?? new Set<string>();
      ids.add(from);
      prerequisiteIds.set(to, ids);
    }
  }

  const now = input.now ?? Date.now();
  const draft: RoadmapNode[] = units.map((unit): RoadmapNode => {
    const currentUnit = unit.legacyNode
      ? unitById.get(LEGACY_UNIT_ALIASES[unit.legacyNode] ?? '')
      : undefined;
    const record = mergedMastery(unit.id);
    const conceptIds = conceptsByUnit.get(unit.id) ?? [];
    const conceptStates = conceptIds
      .map((id) => input.conceptStates?.[id])
      .filter((state) => state !== undefined);
    const grandfathered = grandfatheredDisplayUnits.has(unit.id);
    const conceptMastery = average(conceptStates.map((state) => state.understanding));
    const hasConceptEvidence = conceptStates.length > 0;
    const mastery =
      grandfathered && record ? record.value : hasConceptEvidence ? conceptMastery : (record?.value ?? 0);
    const attempts =
      grandfathered && record
        ? record.n
        : hasConceptEvidence
          ? conceptStates.reduce((sum, state) => sum + state.attempts, 0)
          : (record?.n ?? 0);
    const hasCompleteConceptEvidence = conceptIds.length > 0 && conceptStates.length === conceptIds.length;
    const learnedFromConcepts =
      hasCompleteConceptEvidence && conceptStates.every((state) => state.independentSuccesses >= 2);
    const cleared =
      grandfathered ||
      (hasConceptEvidence
        ? hasCompleteConceptEvidence && ((mastery >= 0.8 && attempts >= 3) || learnedFromConcepts)
        : record !== undefined && record.value >= 0.8 && record.n >= 3);
    const retention = conceptStates.length
      ? average(conceptStates.map((state) => estimatedRetention(state, now)))
      : mastery;
    const dueForReview =
      cleared &&
      conceptStates.some(
        (state) => state.attempts > 0 && state.dueAt <= now && estimatedRetention(state, now) < 0.65,
      );
    const prerequisites = [...(prerequisiteIds.get(unit.id) ?? [])].sort();
    const gradeOpen = input.revealAll || unit.grade <= input.playerGrade || input.challengeHigher;
    const prerequisitesOpen =
      input.revealAll ||
      prerequisites.every((id) => {
        if (grandfatheredDisplayUnits.has(id)) return true;
        const linkedIds = conceptsByUnit.get(id) ?? [];
        const linked = linkedIds
          .map((conceptId) => input.conceptStates?.[conceptId])
          .filter((state) => state !== undefined);
        if (linked.length > 0) {
          const complete = linkedIds.length > 0 && linked.length === linkedIds.length;
          const linkedMastery = average(linked.map((state) => state.understanding));
          const linkedAttempts = linked.reduce((sum, state) => sum + state.attempts, 0);
          return (
            complete &&
            ((linkedMastery >= 0.8 && linkedAttempts >= 3) ||
              linked.every((state) => state.independentSuccesses >= 2))
          );
        }
        const prerequisite = mergedMastery(id);
        return prerequisite !== undefined && prerequisite.value >= 0.8 && prerequisite.n >= 3;
      });
    return {
      id: unit.id,
      name: unit.name,
      subject: unit.subject,
      subjectLabel: input.subjectLabel(unit.subject),
      grade: unit.grade,
      recommendedTerms: currentUnit?.placement?.terms ?? unit.placement?.terms,
      courseKind: currentUnit?.courseKind ?? unit.courseKind,
      mastery,
      attempts,
      retention,
      prerequisiteIds: prerequisites,
      x: 0,
      y: 0,
      visibility: 'revealed' as const,
      state: cleared
        ? dueForReview
          ? 'review'
          : 'cleared'
        : gradeOpen && prerequisitesOpen
          ? 'open'
          : 'locked',
    };
  });

  const byId = new Map(draft.map((node) => [node.id, node]));
  const firstGradeBySubject = new Map<string, number>();
  for (const node of draft) {
    firstGradeBySubject.set(
      node.subject,
      Math.min(firstGradeBySubject.get(node.subject) ?? Number.MAX_SAFE_INTEGER, node.grade),
    );
  }
  const availableSubjects = availableRoadmapSubjects(draft);
  for (const node of draft) {
    if (
      node.state !== 'locked' ||
      !availableSubjects.has(node.subject) ||
      node.grade !== firstGradeBySubject.get(node.subject)
    )
      continue;
    if (
      node.prerequisiteIds.every((id) => {
        const prerequisite = byId.get(id);
        return prerequisite !== undefined && isCompletedRoadmapProgress(prerequisite);
      })
    ) {
      node.state = 'open';
    }
  }
  const firstOpen = new Set<string>();
  for (const node of draft) {
    if (node.state !== 'open' || firstOpen.has(node.subject)) continue;
    node.state = 'current';
    firstOpen.add(node.subject);
  }

  const progressiveReveal = Boolean(input.curriculum) && !input.revealAll;
  for (const node of draft) {
    if (!progressiveReveal || node.state !== 'locked' || node.attempts > 0) {
      node.visibility = 'revealed';
      continue;
    }
    const touchesRevealed = node.prerequisiteIds.some((id) => byId.get(id)?.state !== 'locked');
    const nextGradeRoot =
      node.prerequisiteIds.length === 0 && node.grade === Math.min(6, input.playerGrade + 1);
    const subjectEntryRoot =
      node.prerequisiteIds.length === 0 && node.grade === firstGradeBySubject.get(node.subject);
    node.visibility = touchesRevealed || nextGradeRoot || subjectEntryRoot ? 'frontier' : 'hidden';
  }

  layoutRoadmapNodes(draft);
  return draft;
}

function average(values: readonly number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}
