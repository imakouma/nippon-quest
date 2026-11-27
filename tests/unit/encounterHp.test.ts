import { expect, it } from 'vitest';
import { makeEncounterEnemy, partyFromGameState } from '../../src/core/battle/setup';
import { computeDamage } from '../../src/core/battle/damage';
import { createRng } from '../../src/core/rng';
import { createNewGame } from '../../src/core/state/newGame';
import { content } from './helpers';

it.each([1, 6] as const)('学年%dの序盤で通常の攻撃を一度は耐えられる', async (grade) => {
  const c = await content();
  const hero = partyFromGameState(createNewGame({ name: 'ハル', grade }, 100), c).hero;
  const enemy = makeEncounterEnemy(c.monsters.get('aomori-ringoron')!, 1, grade);
  const skill = c.skills.get(grade === 1 ? 'sk-tashizan-giri' : 'sk-math-6-05')!;
  const combat = { settings: c.settings, elements: c.elements, rng: createRng(42), combo: 0, canCrit: false };
  expect(hero.hp).toBe(hero.stats.hp);
  expect(enemy.hp).toBe(enemy.stats.hp);
  expect(computeDamage({ ...combat, attacker: hero, defender: enemy, skill, score: 1 }).amount).toBeLessThan(
    enemy.hp,
  );
  expect(
    computeDamage({ ...combat, attacker: enemy, defender: hero, skill: null, score: null }).amount,
  ).toBeLessThan(hero.hp);
});
