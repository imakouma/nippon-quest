import { describe, expect, it } from 'vitest';
import type { Unit } from '../../src/core/content/schemas';
import type { CurriculumGraph } from '../../src/core/learning';
import type { QuestionBase } from '../../src/questions/contracts';
import { QuestionBank } from '../../src/questions/engine';
import { buildRoadmapNodes } from '../../src/scenes/overworld/roadmap';
import { pickRoadmapQuestionId } from '../../src/scenes/overworld/roadmapPractice';

const units: Unit[] = [
  {
    id: 'sansu.g2.legacy-math-2-13',
    name: '九九',
    subject: 'sansu',
    grade: 2,
    order: 2,
    legacyNode: 'math_2_13',
  },
  {
    id: 'sansu.g1.tashizan',
    name: 'たし算',
    subject: 'sansu',
    grade: 1,
    order: 1,
    courseKind: 'required-subject',
    placement: {
      terms: [1],
      status: 'reference',
      sourceIds: ['annual-plan'],
      note: '年間[ねんかん]指導[しどう]計画[けいかく]を参照[さんしょう]',
    },
  },
  {
    id: 'sansu.g1.legacy-math-1-2',
    name: 'たし算（移行版）',
    subject: 'sansu',
    grade: 1,
    order: 1,
    legacyNode: 'math_1_2',
  },
  {
    id: 'kokugo.g1.legacy-jpn-1-2',
    name: '漢字',
    subject: 'kokugo',
    grade: 1,
    legacyNode: 'jpn_1_2',
  },
  {
    id: 'kokugo.g1.kanji',
    name: '1年[ねん]の漢字[かんじ]',
    subject: 'kokugo',
    grade: 1,
    courseKind: 'required-subject',
    placement: {
      terms: ['variable'],
      status: 'reference',
      sourceIds: ['annual-plan'],
      note: '学年[がくねん]を通[とお]して学[まな]ぶ',
    },
  },
  {
    id: 'kokugo.g1.legacy-kanji-1-10',
    name: 'がっこう・もじ',
    subject: 'kokugo',
    grade: 1,
    legacyNode: 'kanji_1_10',
  },
  {
    id: 'sansu.g5.legacy-math-5-13',
    name: '割合[わりあい]（移行版[いこうばん]）',
    subject: 'sansu',
    grade: 5,
    legacyNode: 'math_5_13',
  },
];

const graphUnits: Unit[] = [
  { id: 'sansu.g1.map-base', name: 'かず', subject: 'sansu', grade: 1 },
  { id: 'sansu.g1.map-add', name: 'たしざん', subject: 'sansu', grade: 1 },
  { id: 'sansu.g1.map-subtract', name: 'ひきざん', subject: 'sansu', grade: 1 },
  { id: 'sansu.g1.map-shape', name: 'かたち', subject: 'sansu', grade: 1 },
  { id: 'sansu.g1.map-application', name: 'たしひきの おうよう', subject: 'sansu', grade: 1 },
  { id: 'sansu.g1.map-challenge', name: 'つぎの ちょうせん', subject: 'sansu', grade: 1 },
];

const foundationUnits: Unit[] = [
  { id: 'kokugo.g1.base', name: 'こくご1', subject: 'kokugo', grade: 1, courseKind: 'required-subject' },
  { id: 'kokugo.g2.base', name: 'こくご2', subject: 'kokugo', grade: 2, courseKind: 'required-subject' },
  { id: 'sansu.g1.base', name: 'さんすう1', subject: 'sansu', grade: 1, courseKind: 'required-subject' },
  { id: 'sansu.g2.base', name: 'さんすう2', subject: 'sansu', grade: 2, courseKind: 'required-subject' },
  {
    id: 'seikatsu.g1.base',
    name: 'せいかつ1',
    subject: 'seikatsu',
    grade: 1,
    courseKind: 'required-activity',
  },
  {
    id: 'seikatsu.g2.base',
    name: 'せいかつ2',
    subject: 'seikatsu',
    grade: 2,
    courseKind: 'required-activity',
  },
  { id: 'rika.g3.base', name: 'りか3', subject: 'rika', grade: 3, courseKind: 'required-subject' },
  { id: 'shakai.g3.base', name: 'しゃかい3', subject: 'shakai', grade: 3, courseKind: 'required-subject' },
  { id: 'eigo.g1.base', name: 'えいご1', subject: 'eigo', grade: 1, courseKind: 'supplementary' },
];

const curriculum: CurriculumGraph = {
  schemaVersion: 1,
  sources: [
    {
      id: 'test-source',
      title: 'テスト',
      publisher: 'テスト',
      url: 'https://example.com',
      published: '2026',
      checkedAt: '2026-10-22',
      locator: 'test',
    },
  ],
  concepts: graphUnits.map((unit) => ({
    id: `${unit.id}.concept`,
    subject: unit.subject,
    grade: unit.grade,
    unit: unit.id,
    name: unit.name,
    description: unit.name,
    kind: 'concept',
    memoryType: 'concept',
    curriculumCodes: [],
    sourceIds: ['test-source'],
    review: { status: 'draft' },
  })),
  relations: [
    ['sansu.g1.map-base', 'sansu.g1.map-add'],
    ['sansu.g1.map-base', 'sansu.g1.map-subtract'],
    ['sansu.g1.map-base', 'sansu.g1.map-shape'],
    ['sansu.g1.map-add', 'sansu.g1.map-application'],
    ['sansu.g1.map-subtract', 'sansu.g1.map-application'],
    ['sansu.g1.map-shape', 'sansu.g1.map-application'],
    ['sansu.g1.map-application', 'sansu.g1.map-challenge'],
  ].map(([from, to]) => ({
    from: `${from}.concept`,
    to: `${to}.concept`,
    kind: 'prerequisite' as const,
    strength: 1,
    rationale: 'テスト',
    sourceIds: [],
    reviewStatus: 'draft' as const,
  })),
  questionLinks: [],
};

describe('buildRoadmapNodes', () => {
  it('教科・学年順に並べ、教科ごとの最初の未修得単元を current にする', () => {
    const nodes = buildRoadmapNodes({
      units,
      mastery: { 'sansu.g1.tashizan': { value: 0.9, n: 3, lastAt: 1 } },
      playerGrade: 1,
      challengeHigher: false,
      subjectLabel: (subject) => subject,
    });

    expect(nodes.map((node) => [node.id, node.state])).toEqual([
      ['kokugo.g1.kanji', 'current'],
      ['sansu.g1.tashizan', 'cleared'],
      ['sansu.g2.legacy-math-2-13', 'locked'],
      ['sansu.g5.legacy-math-5-13', 'locked'],
    ]);
    expect(nodes.find((node) => node.id === 'sansu.g1.tashizan')).toMatchObject({
      recommendedTerms: [1],
      courseKind: 'required-subject',
    });
  });

  it('上の学年へ挑戦する設定なら次の単元を開く', () => {
    const nodes = buildRoadmapNodes({
      units,
      mastery: {},
      playerGrade: 1,
      challengeHigher: true,
      subjectLabel: (subject) => subject,
    });
    expect(nodes.find((node) => node.id === 'sansu.g2.legacy-math-2-13')?.state).toBe('open');
  });

  it('生活科2年までの必修完了後は、2年生設定でも理科と社会の入口を開く', () => {
    const mastery = Object.fromEntries(
      ['seikatsu.g1.base', 'seikatsu.g2.base'].map((id, index) => [
        id,
        { value: 0.9, n: 3, lastAt: index + 1 },
      ]),
    );
    const nodes = buildRoadmapNodes({
      units: foundationUnits,
      mastery,
      playerGrade: 2,
      challengeHigher: false,
      subjectLabel: (subject) => subject,
    });

    expect(nodes.find((node) => node.id === 'rika.g3.base')?.state).toBe('current');
    expect(nodes.find((node) => node.id === 'shakai.g3.base')?.state).toBe('current');
  });

  it('生活科2年までが未完了なら、2年生設定では理科と社会を開かない', () => {
    const nodes = buildRoadmapNodes({
      units: foundationUnits,
      mastery: { 'seikatsu.g1.base': { value: 0.9, n: 3, lastAt: 1 } },
      playerGrade: 2,
      challengeHigher: false,
      subjectLabel: (subject) => subject,
    });

    expect(nodes.find((node) => node.id === 'rika.g3.base')?.state).toBe('locked');
    expect(nodes.find((node) => node.id === 'shakai.g3.base')?.state).toBe('locked');
  });

  it('導入前に習得済みだった単元は既得進捗として維持する', () => {
    const nodes = buildRoadmapNodes({
      units: graphUnits,
      curriculum,
      conceptStates: {},
      mastery: {},
      grandfatheredUnitIds: ['sansu.g1.map-application'],
      playerGrade: 1,
      challengeHigher: false,
      subjectLabel: (subject) => subject,
    });

    expect(nodes.find((node) => node.id === 'sansu.g1.map-application')?.state).toBe('cleared');
    expect(nodes.find((node) => node.id === 'sansu.g1.map-challenge')?.state).toBe('open');
  });

  it('概念の前提関係を単元へ集約し、複数の前提をすべて満たすまで応用を開かない', () => {
    const input = {
      units: graphUnits,
      curriculum,
      conceptStates: {},
      playerGrade: 1,
      challengeHigher: false,
      subjectLabel: (subject: string) => subject,
    };
    const before = buildRoadmapNodes({
      ...input,
      mastery: {
        'sansu.g1.map-base': { value: 0.9, n: 3, lastAt: 1 },
        'sansu.g1.map-add': { value: 0.9, n: 3, lastAt: 2 },
        'sansu.g1.map-subtract': { value: 0.9, n: 3, lastAt: 3 },
      },
    });

    expect(before.find((node) => node.id === 'sansu.g1.map-application')).toMatchObject({
      prerequisiteIds: ['sansu.g1.map-add', 'sansu.g1.map-shape', 'sansu.g1.map-subtract'],
      state: 'locked',
      visibility: 'frontier',
    });

    const after = buildRoadmapNodes({
      ...input,
      mastery: {
        'sansu.g1.map-base': { value: 0.9, n: 3, lastAt: 1 },
        'sansu.g1.map-add': { value: 0.9, n: 3, lastAt: 2 },
        'sansu.g1.map-subtract': { value: 0.9, n: 3, lastAt: 3 },
        'sansu.g1.map-shape': { value: 0.9, n: 3, lastAt: 4 },
      },
    });

    expect(after.find((node) => node.id === 'sansu.g1.map-application')).toMatchObject({
      state: 'current',
      visibility: 'revealed',
    });
  });

  it('現在地の一段先だけを霧越しに見せ、さらに遠い単元は隠す', () => {
    const nodes = buildRoadmapNodes({
      units: graphUnits,
      curriculum,
      conceptStates: {},
      mastery: { 'sansu.g1.map-base': { value: 0.9, n: 3, lastAt: 1 } },
      playerGrade: 1,
      challengeHigher: false,
      subjectLabel: (subject) => subject,
    });

    expect(nodes.find((node) => node.id === 'sansu.g1.map-add')).toMatchObject({
      state: 'current',
      visibility: 'revealed',
    });
    expect(nodes.find((node) => node.id === 'sansu.g1.map-application')).toMatchObject({
      state: 'locked',
      visibility: 'frontier',
    });
    expect(nodes.find((node) => node.id === 'sansu.g1.map-challenge')).toMatchObject({
      state: 'locked',
      visibility: 'hidden',
    });
  });

  it('3年生から始まる教科も最初の入口を霧越しに見せる', () => {
    const scienceUnits: Unit[] = [
      { id: 'rika.g3.base', name: '理科の入口', subject: 'rika', grade: 3 },
      { id: 'rika.g3.next', name: '次の理科', subject: 'rika', grade: 3 },
    ];
    const scienceCurriculum: CurriculumGraph = {
      ...curriculum,
      concepts: scienceUnits.map((unit) => ({
        id: `${unit.id}.concept`,
        subject: unit.subject,
        grade: unit.grade,
        unit: unit.id,
        name: unit.name,
        description: unit.name,
        kind: 'concept',
        memoryType: 'concept',
        curriculumCodes: [],
        sourceIds: ['test-source'],
        review: { status: 'draft' },
      })),
      relations: [
        {
          from: 'rika.g3.base.concept',
          to: 'rika.g3.next.concept',
          kind: 'prerequisite',
          strength: 1,
          rationale: 'テスト',
          sourceIds: [],
          reviewStatus: 'draft',
        },
      ],
    };

    const nodes = buildRoadmapNodes({
      units: scienceUnits,
      curriculum: scienceCurriculum,
      mastery: {},
      playerGrade: 1,
      challengeHigher: false,
      subjectLabel: (subject) => subject,
    });

    expect(nodes.find((node) => node.id === 'rika.g3.base')).toMatchObject({
      state: 'locked',
      visibility: 'frontier',
    });
    expect(nodes.find((node) => node.id === 'rika.g3.next')).toMatchObject({
      state: 'locked',
      visibility: 'hidden',
    });
  });

  it('開発者モードでは全単元を名前付きで表示し、学年と前提に関係なく選択可能にする', () => {
    const higherGradeUnits: Unit[] = graphUnits.map((unit, index) => ({
      ...unit,
      grade: index < 2 ? 1 : 6,
    }));
    const higherGradeGraph: CurriculumGraph = {
      ...curriculum,
      concepts: curriculum.concepts.map((concept, index) => ({
        ...concept,
        grade: index < 2 ? 1 : 6,
      })),
    };

    const nodes = buildRoadmapNodes({
      units: higherGradeUnits,
      curriculum: higherGradeGraph,
      conceptStates: {},
      mastery: {},
      playerGrade: 1,
      challengeHigher: false,
      revealAll: true,
      subjectLabel: (subject) => subject,
    });

    expect(nodes.every((node) => node.visibility === 'revealed')).toBe(true);
    expect(nodes.every((node) => node.state !== 'locked')).toBe(true);
  });

  it('同じ入力から安定した分岐レイアウト座標を作る', () => {
    const input = {
      units: graphUnits,
      curriculum,
      conceptStates: {},
      mastery: { 'sansu.g1.map-base': { value: 0.9, n: 3, lastAt: 1 } },
      playerGrade: 1,
      challengeHigher: false,
      subjectLabel: (subject: string) => subject,
    };

    const first = buildRoadmapNodes(input);
    const second = buildRoadmapNodes(input);
    expect(first.map(({ id, x, y }) => ({ id, x, y }))).toEqual(second.map(({ id, x, y }) => ({ id, x, y })));
    expect(first.find((node) => node.id === 'sansu.g1.map-add')?.x).not.toBe(
      first.find((node) => node.id === 'sansu.g1.map-subtract')?.x,
    );
    expect(first.find((node) => node.id === 'sansu.g1.map-subtract')?.x).not.toBe(
      first.find((node) => node.id === 'sansu.g1.map-shape')?.x,
    );
    expect(first.find((node) => node.id === 'sansu.g1.map-base')!.y).toBeGreaterThan(
      first.find((node) => node.id === 'sansu.g1.map-add')!.y,
    );
    expect(first.find((node) => node.id === 'sansu.g1.map-application')!.y).toBeLessThan(
      first.find((node) => node.id === 'sansu.g1.map-add')!.y,
    );
  });
});

describe('pickRoadmapQuestionId', () => {
  it('選んだ単元に限定し、未出題の問題を優先する', () => {
    const bank = new QuestionBank();
    const question = (id: string, unit: string): QuestionBase => ({
      id,
      type: 'choice',
      subject: 'sansu',
      grade: 1,
      unit,
      payload: {},
    });
    bank.add(question('sansu.g1.kazu-10.0001', 'sansu.g1.kazu-10'));
    bank.add(question('sansu.g1.kazu-10.0002', 'sansu.g1.kazu-10'));
    bank.add(question('sansu.g1.tashizan.0001', 'sansu.g1.tashizan'));

    expect(
      pickRoadmapQuestionId(bank, 'sansu.g1.kazu-10', ['sansu.g1.kazu-10.0001'], { next: () => 0 }),
    ).toBe('sansu.g1.kazu-10.0002');
  });

  it('単元に問題がなければ null を返す', () => {
    expect(pickRoadmapQuestionId(new QuestionBank(), 'sansu.g1.kazu-10', [], { next: () => 0 })).toBeNull();
  });

  it('整理後の単元から、対応する旧問題も復習できる', () => {
    const bank = new QuestionBank();
    bank.add({
      id: 'legacy.sansu.g1.tashizan.0001',
      type: 'choice',
      subject: 'sansu',
      grade: 1,
      unit: 'sansu.g1.legacy-math-1-2',
      payload: {},
    });

    expect(pickRoadmapQuestionId(bank, 'sansu.g1.tashizan', [], { next: () => 0 })).toBe(
      'legacy.sansu.g1.tashizan.0001',
    );
  });

  it('整理後の漢字単元から、旧漢字グループの問題も復習できる', () => {
    const bank = new QuestionBank();
    bank.add({
      id: 'legacy.kokugo.g1.kanji-school.0001',
      type: 'choice',
      subject: 'kokugo',
      grade: 1,
      unit: 'kokugo.g1.legacy-kanji-1-10',
      payload: {},
    });

    expect(pickRoadmapQuestionId(bank, 'kokugo.g1.kanji', [], { next: () => 0 })).toBe(
      'legacy.kokugo.g1.kanji-school.0001',
    );
  });
});
