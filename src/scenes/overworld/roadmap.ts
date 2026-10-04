import type { Unit } from '../../core/content/schemas';
import type { MasteryData } from '../../questions/engine/mastery';
import type { RoadmapNode } from '../../ui/field/MenuOverlay';

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
  playerGrade: number;
  challengeHigher: boolean;
  subjectLabel: (subject: string) => string;
}

/** GameState と教材定義から表示専用データを作る。Phaser/DOMには依存しない。 */
export function buildRoadmapNodes(input: RoadmapInput): RoadmapNode[] {
  const aliasedCurrent = new Set(Object.values(LEGACY_UNIT_ALIASES));
  const units = [...input.units]
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
  const firstOpen = new Map<string, string>();
  for (const unit of units) {
    const record = input.mastery[masteryId(unit)];
    if ((!record || record.value < 0.8 || record.n < 3) && !firstOpen.has(unit.subject))
      firstOpen.set(unit.subject, unit.id);
  }

  return units.map((unit) => {
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
      mastery,
      attempts,
      state: cleared ? 'cleared' : current && open ? 'current' : open ? 'open' : 'locked',
    };
  });
}
