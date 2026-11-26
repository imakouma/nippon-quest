import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { content } from './helpers';
import { createNewGame } from '../../src/core/state/newGame';
import { recordLearningResult } from '../../src/scenes/shared/askEnv';
import { heroSkillEditor } from '../../src/scenes/overworld/heroSkillEditor';
import { assignedSkillForQuestion } from '../../src/core/progression/subjectSkillAssignments';
import { trainedAssignedSkill } from '../../src/core/progression/assignedSkillTraining';
import { makeHero, makeMonster, makeParty } from '../../src/core/battle/factory';
import { act, battleSkills, createBattle } from '../../src/core/battle/engine';
import { battleQuestionQuery } from '../../src/scenes/battle/questionQuery';
import { QuestionBank } from '../../src/questions/engine/bank';
import { filterCandidates } from '../../src/questions/engine/pick';
import type { QuestionBase } from '../../src/questions/contracts';

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : path.endsWith('.json') ? [path] : [];
  });
}

describe.each([
  { subject: 'kokugo', grade: 1, skillId: undefined },
  { subject: 'sansu', grade: 1, skillId: undefined },
  { subject: 'rika', grade: 3, skillId: undefined },
  { subject: 'shakai', grade: 3, skillId: undefined },
  { subject: 'eigo', grade: 3, skillId: undefined },
  { subject: 'seikatsu', grade: 1, skillId: undefined },
  { subject: 'sansu', grade: 3, skillId: 'sk-math-3-large-numbers' },
  { subject: 'sansu', grade: 4, skillId: 'sk-math-4-multiply' },
  { subject: 'sansu', grade: 6, skillId: 'sk-math-6-area' },
  { subject: 'rika', grade: 5, skillId: 'sk-rika-g5-measuring' },
  { subject: 'shakai', grade: 5, skillId: 'sk-shakai-g5-transport' },
  { subject: 'eigo', grade: 4, skillId: 'sk-eigo-request' },
] as const)('$subject の習得から戦闘まで', ({ subject, grade, skillId: targetSkillId }) => {
  it('満点で習得し、編成した技で対応する問題を出し、戦闘で使える', async () => {
    const c = await content();
    let game = createNewGame({ name: 'ハル', grade }, 100);
    const questions = files(`content/questions/${subject}/g${grade}`).flatMap(
      (file) => JSON.parse(readFileSync(file, 'utf8')) as QuestionBase[],
    );
    const question = questions.find((q) => {
      const id = assignedSkillForQuestion(subject, q.id);
      return (
        id &&
        (!targetSkillId || id === targetSkillId) &&
        !game.player.skills.includes(id) &&
        (targetSkillId || c.skills.get(id)?.costGauge === 0)
      );
    })!;
    expect(question).toBeDefined();
    const skillId = assignedSkillForQuestion(subject, question.id)!;
    const result = { questionId: question.id, score: 1, timeMs: 100, attempts: 1 };
    recordLearningResult(game, question, result, 1, 2, 'battle');
    recordLearningResult(game, question, result, 2, 3, 'battle');
    expect(game.player.skills).toContain(skillId);
    const editor = heroSkillEditor(
      game,
      c,
      () => game,
      (next) => {
        game = next;
      },
    );
    expect(editor.levels?.[skillId]).toBe(2);
    const category = c.skills.get(skillId)!.costGauge > 0 ? 'charge' : 'normal';
    expect(editor.onChange(category, 0, skillId)?.[category][0]).toBe(skillId);
    expect(game.player.skillLoadout?.[category][0]).toBe(skillId);
    const hero = makeHero(
      {
        name: 'ハル',
        level: 5,
        baseStats: {
          hp: 40,
          mp: 10,
          scienceAtk: 8,
          humanitiesAtk: 8,
          scienceDef: 6,
          humanitiesDef: 6,
          spd: 7,
          wis: 5,
        },
        growth: { hp: 6, mp: 2, atk: 1.5, def: 1.2, spd: 1, wis: 1 },
        skills: [...game.player.skillLoadout!.normal, ...game.player.skillLoadout!.charge],
        equipment: {},
      },
      c.items,
      c.sets,
    );
    const enemy = makeMonster(c.monsters.get('aomori-ringoron')!, 1, 'enemy');
    const deps = {
      settings: c.settings,
      elements: c.elements,
      skills: c.skills,
      items: c.items,
      monsters: c.monsters,
      heroSkill: (skill: typeof c.skills extends Map<string, infer T> ? T : never) =>
        trainedAssignedSkill(skill, game.progress.counters),
    };
    const state = createBattle({ ally: makeParty(hero, []), enemy, seed: 'assigned-skill-test' }, deps);
    state.player.subjectGauges[subject] = 100;
    const selected = battleSkills(state, deps).find(
      (entry) => entry.actorId === hero.id && entry.skill.id === skillId,
    );
    expect(selected).toBeDefined();
    const bank = new QuestionBank();
    for (const item of questions) bank.add(item);
    const candidates = filterCandidates(bank, battleQuestionQuery(selected!.skill, false, grade, bank));
    expect(candidates.map((q) => q.id)).toContain(question.id);
    const action = act(
      state,
      { kind: 'skill', skillId, result: { score: 1, timeMs: 100, attempts: 1 } },
      deps,
    );
    expect(action.evaluation.allowed).toBe(true);
    expect(
      action.events.some(
        (event) => event.t === 'act' && event.actorId === hero.id && event.skillId === skillId,
      ),
    ).toBe(true);
  });
});

it('全教科の各問題を、実際の戦闘用クエリから割り当て先の技で出題できる', async () => {
  const c = await content();
  const bank = new QuestionBank();
  for (const subject of ['sansu', 'kokugo', 'rika', 'shakai', 'eigo', 'seikatsu'] as const) {
    for (const file of files(`content/questions/${subject}`)) {
      for (const q of JSON.parse(readFileSync(file, 'utf8')) as QuestionBase[]) bank.add(q);
    }
  }
  const groups = new Map<string, { skillId: string; grade: QuestionBase['grade']; ids: string[] }>();
  for (const q of bank.all()) {
    const skillId = assignedSkillForQuestion(q.subject, q.id);
    expect(skillId, q.id).toBeDefined();
    const key = `${skillId}:${q.grade}`;
    const group = groups.get(key) ?? { skillId: skillId!, grade: q.grade, ids: [] };
    group.ids.push(q.id);
    groups.set(key, group);
  }
  for (const { skillId, grade, ids } of groups.values()) {
    const skill = c.skills.get(skillId);
    expect(skill, skillId).toBeDefined();
    const actual = filterCandidates(bank, battleQuestionQuery(skill!, false, grade, bank)).map((q) => q.id);
    expect(actual.sort(), skillId).toEqual(ids.sort());
  }
});
