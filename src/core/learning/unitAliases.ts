/** 旧ロードマップの単元IDを、現在の単元IDへ正規化する対応表。 */
export const LEGACY_UNIT_ALIASES: Readonly<Record<string, string>> = {
  math_1_2: 'sansu.g1.tashizan',
  math_1_3: 'sansu.g1.hikizan',
  math_1_4: 'sansu.g1.kazu-20',
  math_1_5: 'sansu.g1.kuriagari-kurisagari',
  math_1_6: 'sansu.g1.kazu-100',
  math_1_7: 'sansu.g1.tens-calculation',
  math_1_8: 'sansu.g1.tokei',
  math_1_9: 'sansu.g1.word-problems',
  math_2_1: 'sansu.g2.tables-graphs',
  math_2_2: 'sansu.g2.column-add-subtract',
  math_2_3: 'sansu.g2.column-add-subtract',
  math_2_4: 'sansu.g2.column-add-subtract',
  math_2_5: 'sansu.g2.jikan',
  math_2_6: 'sansu.g2.nagasa',
  math_2_7: 'sansu.g2.numbers-to-1000',
  math_2_8: 'sansu.g2.kasa',
  math_2_13: 'sansu.g2.kuku',
  math_3_10: 'sansu.g3.warizan',
  math_4_1: 'sansu.g4.okina-kazu',
  math_5_13: 'sansu.g5.legacy-math-5-13',
  jpn_1_1: 'kokugo.g1.hiragana',
  jpn_1_2: 'kokugo.g1.kanji',
  jpn_1_3: 'kokugo.g1.joshi',
  jpn_1_4: 'kokugo.g1.bun-no-kimari',
  jpn_1_5: 'kokugo.g1.kotoba-asobi',
  kanji_1_01: 'kokugo.g1.kanji',
  kanji_1_02: 'kokugo.g1.kanji',
  kanji_1_03: 'kokugo.g1.kanji',
  kanji_1_04: 'kokugo.g1.kanji',
  kanji_1_05: 'kokugo.g1.kanji',
  kanji_1_06: 'kokugo.g1.kanji',
  kanji_1_07: 'kokugo.g1.kanji',
  kanji_1_08: 'kokugo.g1.kanji',
  kanji_1_09: 'kokugo.g1.kanji',
  kanji_1_10: 'kokugo.g1.kanji',
  jpn_2_1: 'kokugo.g2.kanji',
  jpn_2_2: 'kokugo.g2.kanji',
  jpn_3_1: 'kokugo.g3.legacy-jpn-3-1',
  'cur-1801-02': 'seikatsu.g1.home-life',
  'cur-1801-03': 'seikatsu.g1.living-things',
  'cur-1801-04': 'seikatsu.g1.kisetsu',
  'cur-1802-01': 'seikatsu.g2.town-exploration',
  'cur-1802-02': 'seikatsu.g2.public-places',
  'cur-1802-03': 'seikatsu.g2.ikimono',
  'cur-1503-05': 'rika.g3.legacy-cur-1503-05',
  'cur-1504-21': 'rika.g4.mizu-no-sugata',
  sci_5_10: 'rika.g5.legacy-sci-5-10',
  sci_6_10: 'rika.g6.legacy-sci-6-10',
  'cur-1403-01': 'shakai.g3.legacy-cur-1403-01',
  'cur-1404-01': 'shakai.g4.todofuken',
};

/** 旧問題の unit ID から、整理後の単元 ID を引く対応表。 */
export const LEGACY_QUESTION_UNIT_ALIASES: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(LEGACY_UNIT_ALIASES).map(([legacyNode, currentUnitId]) => {
    const [subject, grade] = currentUnitId.split('.');
    return [`${subject}.${grade}.legacy-${legacyNode.replaceAll('_', '-')}`, currentUnitId];
  }),
);

export function canonicalUnitId(unitId: string): string {
  return LEGACY_UNIT_ALIASES[unitId] ?? LEGACY_QUESTION_UNIT_ALIASES[unitId] ?? unitId;
}
