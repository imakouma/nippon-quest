import { describe, expect, it } from 'vitest';
import type { Skill } from '../../src/core/content/schemas';
import {
  musubiDamaQuestionQuery,
  questionQueryForSkill,
  recruitQuestionQuery,
} from '../../src/scenes/battle/questionQueries';
import { selectMusubiDamaQuestion } from '../../src/scenes/battle/musubiDamaFlow';

const skill = {
  id: 'sk-test',
  subject: 'sansu',
  gradeRange: [2, 4],
  questionTags: ['theme:test'],
  unitHint: ['sansu.g2.kuku'],
} as Skill;

describe('バトル問題の問い合わせ', () => {
  it('通常スキルは定義済みの学年・タグをそのまま使う', () => {
    expect(questionQueryForSkill({ skill, grade: 3, uniqueSkillIds: [], hasCandidate: () => false })).toEqual(
      { subject: 'sansu', gradeRange: [2, 4], tags: ['theme:test'], units: ['sansu.g2.kuku'] },
    );
  });

  it('固有スキルは候補のある最も狭い学年範囲を使い、仲間化は県タグを付ける', () => {
    const query = questionQueryForSkill({
      skill,
      grade: 3,
      uniqueSkillIds: ['sk-test'],
      hasCandidate: (candidate) =>
        candidate.gradeRange[0] === 1 &&
        candidate.gradeRange[1] === 3 &&
        candidate.units?.[0] === 'sansu.g2.kuku',
    });
    expect(query.gradeRange).toEqual([1, 3]);
    expect(recruitQuestionQuery(skill, 'aomori').tags).toEqual(['prefecture:aomori']);
  });

  it('むすび玉はプレイヤーの学年と敵の県に合わせる', () => {
    expect(musubiDamaQuestionQuery('sansu', 3, 'aomori')).toEqual({
      subject: 'sansu',
      gradeRange: [2, 3],
      tags: ['prefecture:aomori'],
    });
    expect(musubiDamaQuestionQuery('kokugo', 1, 'iwate').gradeRange).toEqual([1, 1]);
  });

  it('習得わざの教科から、実際に出題できる候補を選ぶ', () => {
    const result = selectMusubiDamaQuestion({
      skillIds: ['sk-test'],
      skills: new Map([['sk-test', skill]]),
      grade: 3,
      areaId: 'aomori',
      hasCandidate: (query) => query.subject === 'sansu',
    });
    expect(result?.subject).toBe('sansu');
  });
});
