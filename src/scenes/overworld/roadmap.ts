import type { Unit } from '../../core/content/schemas';
import { estimatedRetention, type ConceptStateData, type CurriculumGraph } from '../../core/learning';
import type { MasteryData } from '../../questions/engine/mastery';
import type { RoadmapNode } from '../../shared/menuModel';

const SUBJECT_ORDER = ['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo'];

/** 旧ロードマップの進捗を、現在の単元IDへ引き継ぐ対応表。 */
export const LEGACY_UNIT_ALIASES: Readonly<Record<string, string>> = {
  math_1_2: 'sansu.g1.tashizan',
  math_1_3: 'sansu.g1.hikizan',
  math_1_6: 'sansu.g1.kazu-100',
  math_2_5: 'sansu.g2.jikan',
  math_2_6: 'sansu.g2.nagasa',
  math_2_8: 'sansu.g2.kasa',
  math_2_13: 'sansu.g2.kuku',
  math_3_10: 'sansu.g3.warizan',
  math_4_1: 'sansu.g4.okina-kazu',
  math_5_13: 'sansu.g5.wariai',
  jpn_1_1: 'kokugo.g1.hiragana',
  jpn_1_2: 'kokugo.g1.kanji',
  jpn_1_3: 'kokugo.g1.joshi',
  jpn_1_4: 'kokugo.g1.bun-no-kimari',
  jpn_1_5: 'kokugo.g1.kotoba-asobi',
  jpn_2_1: 'kokugo.g2.kanji',
  jpn_3_1: 'kokugo.g3.kanji',
  'cur-1801-04': 'seikatsu.g1.kisetsu',
  'cur-1802-03': 'seikatsu.g2.ikimono',
  'cur-1503-05': 'rika.g3.hikari',
  'cur-1504-21': 'rika.g4.mizu-no-sugata',
  sci_5_10: 'rika.g5.furiko',
  sci_6_10: 'rika.g6.denki',
  'cur-1403-01': 'shakai.g3.machi',
  'cur-1404-01': 'shakai.g4.todofuken',
};

export interface RoadmapInput {
  units: Iterable<Unit>;
  mastery: MasteryData;
  curriculum?: CurriculumGraph;
  conceptStates?: ConceptStateData;
  now?: number;
  playerGrade: number;
  challengeHigher: boolean;
  subjectLabel: (subject: string) => string;
}

/** GameState と教材定義から表示専用データを作る。Phaser/DOMには依存しない。 */
export function buildRoadmapNodes(input: RoadmapInput): RoadmapNode[] {
  const aliasedCurrent = new Set(Object.values(LEGACY_UNIT_ALIASES));
  const allUnits = [...input.units];
  const unitById = new Map(allUnits.map((unit) => [unit.id, unit]));
  const units = allUnits
    .filter((unit) => !aliasedCurrent.has(unit.id))
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

  const prerequisiteIds = new Map<string, Set<string>>();
  const conceptsByUnit = new Map<string, string[]>();
  if (input.curriculum) {
    const displayUnitByConcept = new Map<string, string>();
    for (const concept of input.curriculum.concepts) {
      const displayUnitId = displayIdByUnitId.get(concept.unit);
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
    const record = input.mastery[masteryId(unit)];
    const conceptStates = (conceptsByUnit.get(unit.id) ?? [])
      .map((id) => input.conceptStates?.[id])
      .filter((state) => state !== undefined);
    const conceptMastery = average(conceptStates.map((state) => state.understanding));
    const mastery = record?.value ?? conceptMastery;
    const attempts = record?.n ?? conceptStates.reduce((sum, state) => sum + state.attempts, 0);
    const learnedFromConcepts =
      conceptStates.length > 0 && conceptStates.every((state) => state.independentSuccesses >= 2);
    const cleared = (mastery >= 0.8 && attempts >= 3) || learnedFromConcepts;
    const retention = conceptStates.length
      ? average(conceptStates.map((state) => estimatedRetention(state, now)))
      : mastery;
    const dueForReview =
      cleared &&
      conceptStates.some(
        (state) => state.attempts > 0 && state.dueAt <= now && estimatedRetention(state, now) < 0.65,
      );
    const prerequisites = [...(prerequisiteIds.get(unit.id) ?? [])].sort();
    const gradeOpen = unit.grade <= input.playerGrade || input.challengeHigher;
    const prerequisitesOpen = prerequisites.every((id) => {
      const prerequisiteUnit = unitById.get(id);
      const prerequisite = input.mastery[prerequisiteUnit ? masteryId(prerequisiteUnit) : id];
      if (prerequisite?.value !== undefined) return prerequisite.value >= 0.8 && prerequisite.n >= 3;
      const linked = (conceptsByUnit.get(id) ?? [])
        .map((conceptId) => input.conceptStates?.[conceptId])
        .filter((state) => state !== undefined);
      return linked.length > 0 && linked.every((state) => state.independentSuccesses >= 2);
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
  const firstOpen = new Set<string>();
  for (const node of draft) {
    if (node.state !== 'open' || firstOpen.has(node.subject)) continue;
    node.state = 'current';
    firstOpen.add(node.subject);
  }

  const progressiveReveal = Boolean(input.curriculum);
  for (const node of draft) {
    if (!progressiveReveal || node.state !== 'locked' || node.attempts > 0) {
      node.visibility = 'revealed';
      continue;
    }
    const touchesRevealed = node.prerequisiteIds.some((id) => byId.get(id)?.state !== 'locked');
    const nextGradeRoot =
      node.prerequisiteIds.length === 0 && node.grade === Math.min(6, input.playerGrade + 1);
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
      const prerequisiteDepths = node.prerequisiteIds
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
    for (const [depth, level] of levels) {
      level.sort((a, b) => a.grade - b.grade || a.id.localeCompare(b.id));
      const inset = ((widest - level.length) * 180) / 2;
      level.forEach((node, index) => {
        node.x = 72 + inset + index * 180;
        node.y = 64 + depth * 148;
      });
    }
  }
}
