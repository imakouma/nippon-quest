import type { Unit } from '../../core/content/schemas';
import {
  curriculumGraph,
  estimatedRetention,
  type ConceptStateData,
  type CurriculumGraph,
} from '../../core/learning';
import { canonicalUnitId, LEGACY_UNIT_ALIASES } from '../../core/learning/unitAliases';
import type { MasteryData, MasteryRecord } from '../../questions/engine/mastery';
import type { RoadmapNode } from '../../shared/menuModel';
import type { RoadmapSupportingKind } from '../../shared/menuModel';

export { LEGACY_QUESTION_UNIT_ALIASES, LEGACY_UNIT_ALIASES } from '../../core/learning/unitAliases';

const SUBJECT_ORDER = ['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo'];
const SUPPORTING_KINDS = new Set<RoadmapSupportingKind>([
  'component',
  'transfer',
  'related',
  'chronological',
]);

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
  const supportingLinks = new Map<string, Map<string, { sourceId: string; kind: RoadmapSupportingKind }>>();
  const conceptsByUnit = new Map<string, string[]>();
  if (input.curriculum) {
    const assessableConceptIds = new Set(
      input.curriculum.questionLinks.flatMap((link) => link.concepts.map((concept) => concept.conceptId)),
    );
    const allConceptsByUnit = new Map<string, string[]>();
    const displayUnitByConcept = new Map<string, string>();
    for (const concept of input.curriculum.concepts) {
      const displayUnitId = displayIdByUnitId.get(concept.unit);
      if (!displayUnitId || concept.kind === 'misconception') continue;
      displayUnitByConcept.set(concept.id, displayUnitId);
      const ids = allConceptsByUnit.get(displayUnitId) ?? [];
      ids.push(concept.id);
      allConceptsByUnit.set(displayUnitId, ids);
    }
    for (const [unitId, conceptIds] of allConceptsByUnit) {
      const assessable = conceptIds.filter((id) => assessableConceptIds.has(id));
      conceptsByUnit.set(unitId, assessable.length > 0 ? assessable : conceptIds);
    }
    for (const relation of input.curriculum.relations) {
      const from = displayUnitByConcept.get(relation.from);
      const to = displayUnitByConcept.get(relation.to);
      if (!from || !to || from === to) continue;
      if (relation.kind === 'prerequisite') {
        const ids = prerequisiteIds.get(to) ?? new Set<string>();
        ids.add(from);
        prerequisiteIds.set(to, ids);
      } else if (SUPPORTING_KINDS.has(relation.kind as RoadmapSupportingKind)) {
        const links = supportingLinks.get(to) ?? new Map();
        const kind = relation.kind as RoadmapSupportingKind;
        links.set(`${from}:${kind}`, { sourceId: from, kind });
        supportingLinks.set(to, links);
      }
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
      supportingLinks: [...(supportingLinks.get(unit.id)?.values() ?? [])]
        .filter((link) => !prerequisites.includes(link.sourceId))
        .sort((a, b) => a.sourceId.localeCompare(b.sourceId) || a.kind.localeCompare(b.kind)),
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
  for (const node of draft)
    node.blockedByNames = input.revealAll
      ? []
      : node.prerequisiteIds
          .filter((id) => {
            const prerequisite = byId.get(id);
            return prerequisite?.state !== 'cleared' && prerequisite?.state !== 'review';
          })
          .map((id) => byId.get(id)?.name)
          .filter((name): name is string => name !== undefined);
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
    const incomingIds = [
      ...node.prerequisiteIds,
      ...(node.supportingLinks ?? []).map((link) => link.sourceId),
    ];
    const touchesRevealed = incomingIds.some((id) => byId.get(id)?.state !== 'locked');
    const nextGradeRoot = incomingIds.length === 0 && node.grade === Math.min(6, input.playerGrade + 1);
    node.visibility = touchesRevealed || nextGradeRoot ? 'frontier' : 'hidden';
  }

  layoutNodes(draft);
  return draft;
}

function average(values: readonly number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

/** 学年を縦の進行、同じ深さの分岐を横並びにする決定論的レイアウト。 */
function layoutNodes(nodes: RoadmapNode[]): void {
  for (const subject of new Set(nodes.map((node) => node.subject))) {
    const subjectNodes = nodes.filter((node) => node.subject === subject);
    const byId = new Map(subjectNodes.map((node) => [node.id, node]));
    const depths = new Map<string, number>();
    const visiting = new Set<string>();
    const depthOf = (node: RoadmapNode): number => {
      const known = depths.get(node.id);
      if (known !== undefined) return known;
      const gradeBase = (node.grade - 1) * 3;
      if (visiting.has(node.id)) return gradeBase;
      visiting.add(node.id);
      const prerequisiteDepths = [
        ...node.prerequisiteIds,
        ...(node.supportingLinks ?? []).map((link) => link.sourceId),
      ]
        .map((id) => byId.get(id))
        .filter((item) => item !== undefined)
        .map((item) => depthOf(item) + 1);
      visiting.delete(node.id);
      const depth = Math.max(gradeBase, ...prerequisiteDepths);
      depths.set(node.id, depth);
      return depth;
    };
    const levels = new Map<number, RoadmapNode[]>();
    for (const node of subjectNodes) {
      const depth = depthOf(node);
      const level = levels.get(depth) ?? [];
      level.push(node);
      levels.set(depth, level);
    }
    const widest = Math.max(1, ...[...levels.values()].map((level) => level.length));
    const placedX = new Map<string, number>();
    for (const depth of [...levels.keys()].sort((a, b) => a - b)) {
      const level = levels.get(depth)!;
      const parentCenter = (node: RoadmapNode): number | undefined => {
        const positions = [
          ...node.prerequisiteIds,
          ...(node.supportingLinks ?? []).map((link) => link.sourceId),
        ]
          .map((id) => placedX.get(id))
          .filter((x): x is number => x !== undefined);
        return positions.length ? average(positions) : undefined;
      };
      level.sort((a, b) => {
        const aCenter = parentCenter(a);
        const bCenter = parentCenter(b);
        if (aCenter !== undefined && bCenter !== undefined && aCenter !== bCenter) return aCenter - bCenter;
        if (aCenter !== undefined && bCenter === undefined) return -1;
        if (aCenter === undefined && bCenter !== undefined) return 1;
        return a.grade - b.grade || a.id.localeCompare(b.id);
      });
      const inset = ((widest - level.length) * 180) / 2;
      level.forEach((node, index) => {
        node.x = 72 + inset + index * 180;
        node.y = 64 + depth * 148;
        placedX.set(node.id, node.x);
      });
    }
  }
}
