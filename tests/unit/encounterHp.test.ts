import { expect, it } from 'vitest';
import { makeEncounterEnemy, partyFromGameState } from '../../src/core/battle/setup';
import { computeDamage } from '../../src/core/battle/damage';
import { createRng } from '../../src/core/rng';
import { createNewGame } from '../../src/core/state/newGame';
import { content } from './helpers';

it.each([1, 6] as const)('学年%dの序盤で通常の攻撃を一度は耐えられる', async (grade) => {
  const c = await content();
  const hero = partyFromGameState(createNewGame({ name: 'ハル', grade }, 100), c).hero;
  const enemy = makeEncounterEnemy(c.monsters.get('aomori-ringoron')!, 1, grade, c.settings.heroGrowth);
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

it('中盤の同レベル戦は満点中心の通常技で決着し、ボスは長く戦える', async () => {
  const c = await content();
  const grade = 4;
  const level = 30;
  const game = createNewGame({ name: 'ハル', grade }, 100);
  game.player.level = level;
  game.player.levelCap = level;
  const hero = partyFromGameState(game, c).hero;
  const def = c.monsters.get('aomori-ringoron')!;
  const enemy = makeEncounterEnemy(def, level, grade, c.settings.heroGrowth);
  const boss = makeEncounterEnemy(def, level, grade, c.settings.heroGrowth, 'boss');
  const skill = { ...c.skills.get('sk-tashizan-giri')!, power: 140, element: 'none' as const };
  const rng = createRng(42);
  const hits = [1, 1, 0.7, 1].map(
    (score, index) =>
      computeDamage({
        attacker: hero,
        defender: enemy,
        skill,
        score,
        combo: index + 1,
        canCrit: false,
        settings: c.settings,
        elements: c.elements,
        rng,
      }).amount,
  );
  const damage = hits.reduce((sum, hit) => sum + hit, 0);
  expect(enemy.hp).toBeGreaterThan(hits[0]! + hits[1]!);
  expect(enemy.hp).toBeLessThanOrEqual(damage);
  expect(boss.hp).toBeGreaterThan(damage);
});
