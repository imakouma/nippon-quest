import type { Unit } from '../../core/content/schemas';
import { LEGACY_UNIT_ALIASES } from '../../core/learning/unitAliases';
import type { MasteryData } from '../../questions/engine/mastery';
import type { RoadmapNode } from '../../shared/menuModel';

export { LEGACY_QUESTION_UNIT_ALIASES, LEGACY_UNIT_ALIASES } from '../../core/learning/unitAliases';

const SUBJECT_ORDER = ['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo'];

export interface RoadmapInput {
  units: Iterable<Unit>;
  mastery: MasteryData;
  playerGrade: number;
  challengeHigher: boolean;
  subjectLabel: (subject: string) => string;
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
  const firstOpen = new Map<string, string>();
  for (const unit of units) {
    const record = input.mastery[masteryId(unit)];
    if ((!record || record.value < 0.8 || record.n < 3) && !firstOpen.has(unit.subject))
      firstOpen.set(unit.subject, unit.id);
  }

  return units.map((unit) => {
    const currentUnit = unit.legacyNode
      ? unitById.get(LEGACY_UNIT_ALIASES[unit.legacyNode] ?? '')
      : undefined;
    const record = input.mastery[masteryId(unit)];
    const mastery = record?.value ?? 0;
    const attempts = record?.n ?? 0;
    const cleared = mastery >= 0.8 && attempts >= 3;
    const current = firstOpen.get(unit.subject) === unit.id;
    const open = unit.grade <= input.playerGrade || input.challengeHigher;
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
      state: cleared ? 'cleared' : current && open ? 'current' : open ? 'open' : 'locked',
    };
  });
}
