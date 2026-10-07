import { describe, expect, it } from 'vitest';
import type { Skill } from '../../src/core/content/schemas';
import { questionQueryForSkill, recruitQuestionQuery } from '../../src/scenes/battle/questionQueries';

const skill = { id: 'sk-test', subject: 'sansu', gradeRange: [2, 4], questionTags: ['theme:test'] } as Skill;

describe('バトル問題の問い合わせ', () => {
  it('通常スキルは定義済みの学年・タグをそのまま使う', () => {
    expect(questionQueryForSkill({ skill, grade: 3, uniqueSkillIds: [], hasCandidate: () => false })).toEqual(
      { subject: 'sansu', gradeRange: [2, 4], tags: ['theme:test'] },
    );
  });

  it('固有スキルは候補のある最も狭い学年範囲を使い、仲間化は県タグを付ける', () => {
    const query = questionQueryForSkill({
      skill,
      grade: 3,
      uniqueSkillIds: ['sk-test'],
      hasCandidate: (candidate) => candidate.gradeRange[0] === 1 && candidate.gradeRange[1] === 3,
    });
    expect(query.gradeRange).toEqual([1, 3]);
    expect(recruitQuestionQuery(skill, 'aomori').tags).toEqual(['prefecture:aomori']);
  });
});
