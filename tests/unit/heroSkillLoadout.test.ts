import { describe, expect, it } from 'vitest';
import { defaultSkillLoadout, setLoadoutSkill } from '../../src/core/progression/heroSkillLoadout';

const skills = new Map([
  ['n1', { id: 'n1', subject: 'kokugo', costGauge: 0 }],
  ['n2', { id: 'n2', subject: 'sansu', costGauge: 0 }],
  ['n3', { id: 'n3', subject: 'kokugo', costGauge: 0 }],
  ['n4', { id: 'n4', subject: 'kokugo', costGauge: 0 }],
  ['n5', { id: 'n5', subject: 'kokugo', costGauge: 0 }],
  ['b1', { id: 'b1', subject: 'kokugo', costGauge: 100 }],
  ['b2', { id: 'b2', subject: 'sansu', costGauge: 100 }],
] as const);
const bursts = { kokugo: 'b1', sansu: 'b2' };

describe('主人公の技編成', () => {
  it('習得技を保持し、通常4枠と教科バースト2枠を初期設定する', () => {
    const learned = ['n1', 'n2', 'n3', 'n4', 'n5'];
    expect(defaultSkillLoadout(learned, skills, bursts)).toEqual({
      normal: ['n1', 'n2', 'n3', 'n4'],
      charge: ['b1', 'b2'],
    });
    expect(learned).toHaveLength(5);
  });

  it('区分違い・重複・最後の通常技の解除を拒否する', () => {
    const loadout = { normal: ['n1'], charge: ['b1'] };
    expect(setLoadoutSkill(loadout, 'normal', 0, null, skills, ['n1', 'n2', 'b1'])).toBeNull();
    expect(setLoadoutSkill(loadout, 'normal', 1, 'b1', skills, ['n1', 'n2', 'b1'])).toBeNull();
    expect(setLoadoutSkill(loadout, 'normal', 1, 'n1', skills, ['n1', 'n2', 'b1'])).toBeNull();
    expect(setLoadoutSkill(loadout, 'normal', 1, 'n2', skills, ['n1', 'n2', 'b1'])?.normal).toEqual([
      'n1',
      'n2',
    ]);
  });
});

describe('装備と旧データの安全な編成', () => {
  it('装備技が使えなくなれば枠から取り除き、習得技は維持する', async () => {
    const { availableLoadoutSkills, resolveSkillLoadout } =
      await import('../../src/core/progression/heroSkillLoadout');
    const saved = { normal: ['n1', 'n2'], charge: ['b1'] };
    const learned = ['n1'];
    expect(availableLoadoutSkills(learned, ['n2'], skills, bursts)).toContain('n2');
    expect(resolveSkillLoadout(saved, learned, [], skills, bursts)).toEqual({
      normal: ['n1'],
      charge: ['b1'],
    });
    expect(learned).toEqual(['n1']);
  });

  it('存在しない技や区分違いを取り除き、使用できる通常技を保つ', async () => {
    const { resolveSkillLoadout } = await import('../../src/core/progression/heroSkillLoadout');
    expect(
      resolveSkillLoadout({ normal: ['missing'], charge: ['n1', 'b2'] }, ['n1'], [], skills, bursts),
    ).toEqual({ normal: ['n1'], charge: [] });
  });
});
