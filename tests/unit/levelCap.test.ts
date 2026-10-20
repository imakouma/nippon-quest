import { describe, expect, it } from 'vitest';
import { previewLevelCapUnlock, type LevelCapRules } from '../../src/core/progression/levelCap';
import { unlockLevelCap } from '../../src/core/progression/levelCapUnlock';
import { createNewGame } from '../../src/core/state/newGame';
import { LEARNING_FRAGMENT_ID } from '../../src/core/progression/learningRewards';
import { TRIAL_CORE_ID } from '../../src/core/progression/eventReward';
import { partyFromGameState } from '../../src/core/battle/setup';
import { content } from './helpers';

const rules: LevelCapRules = {
  heroInitial: 10,
  heroMaximum: 200,
  monsterMaximum: 100,
  standardStep: 10,
  heroPost100Step: 5,
  learningFragmentsPerUnlock: 3,
  trialCoresPerUnlock: 1,
  heroPost100GrowthRate: 0.25,
};

const enough = { learningFragments: 3, trialCores: 1 };

describe('レベル上限の解放判定', () => {
  it('Lv100までは主人公も仲間も上限を10上げる', () => {
    expect(previewLevelCapUnlock({ kind: 'hero', level: 10, levelCap: 10 }, enough, rules)).toEqual({
      ok: true,
      nextCap: 20,
      cost: enough,
    });
    expect(previewLevelCapUnlock({ kind: 'monster', level: 90, levelCap: 90 }, enough, rules)).toEqual({
      ok: true,
      nextCap: 100,
      cost: enough,
    });
  });

  it('主人公だけLv100以降は5ずつLv200まで上げる', () => {
    expect(previewLevelCapUnlock({ kind: 'hero', level: 100, levelCap: 100 }, enough, rules)).toMatchObject({
      ok: true,
      nextCap: 105,
    });
    expect(previewLevelCapUnlock({ kind: 'hero', level: 195, levelCap: 195 }, enough, rules)).toMatchObject({
      ok: true,
      nextCap: 200,
    });
  });

  it('上限へ未到達なら素材があっても解放しない', () => {
    expect(previewLevelCapUnlock({ kind: 'hero', level: 9, levelCap: 10 }, enough, rules)).toEqual({
      ok: false,
      reason: 'not-at-cap',
    });
  });

  it('素材不足を消費数と一緒に返す', () => {
    expect(
      previewLevelCapUnlock(
        { kind: 'monster', level: 20, levelCap: 20 },
        { learningFragments: 2, trialCores: 0 },
        rules,
      ),
    ).toEqual({
      ok: false,
      reason: 'insufficient-materials',
      cost: enough,
    });
  });

  it('主人公Lv200と仲間Lv100では解放しない', () => {
    expect(previewLevelCapUnlock({ kind: 'hero', level: 200, levelCap: 200 }, enough, rules)).toEqual({
      ok: false,
      reason: 'absolute-cap',
    });
    expect(previewLevelCapUnlock({ kind: 'monster', level: 100, levelCap: 100 }, enough, rules)).toEqual({
      ok: false,
      reason: 'absolute-cap',
    });
  });
});

describe('個体別レベル上限の解放', () => {
  it('主人公だけを解放し、素材消費・保留XP・HP/MP割合を一度に反映する', async () => {
    const c = await content();
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    game.player.level = 10;
    game.player.levelCap = 10;
    game.player.xp = c.xp.hero[19]!;
    game.inventory[LEARNING_FRAGMENT_ID] = 3;
    game.inventory[TRIAL_CORE_ID] = 1;
    const oldMax = partyFromGameState(game, c).hero.stats;
    game.player.hp = Math.floor(oldMax.hp / 2);
    game.player.mp = Math.floor(oldMax.mp / 2);

    const result = unlockLevelCap(game, { kind: 'hero' }, c, 200);

    expect(result).toMatchObject({ ok: true, oldCap: 10, newCap: 20, oldLevel: 10, newLevel: 20 });
    if (!result.ok) throw new Error('expected unlock success');
    const newMax = partyFromGameState(result.state, c).hero.stats;
    expect(result.state.inventory[LEARNING_FRAGMENT_ID]).toBe(0);
    expect(result.state.inventory[TRIAL_CORE_ID]).toBe(0);
    expect(result.state.player.hp / newMax.hp).toBeCloseTo(game.player.hp / oldMax.hp, 1);
    expect(result.state.player.mp / newMax.mp).toBeCloseTo(game.player.mp / oldMax.mp, 1);
    expect(game.player).toMatchObject({ level: 10, levelCap: 10 });
  });

  it('同種族2個体のうち選んだuidだけを解放する', async () => {
    const c = await content();
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    const xp = c.xp.monster[19]!;
    game.party.owned = [
      { uid: 'first', monsterId: 'aomori-ringoron', level: 10, levelCap: 10, xp },
      { uid: 'second', monsterId: 'aomori-ringoron', level: 10, levelCap: 10, xp },
    ];
    game.inventory[LEARNING_FRAGMENT_ID] = 3;
    game.inventory[TRIAL_CORE_ID] = 1;

    const result = unlockLevelCap(game, { kind: 'monster', uid: 'first' }, c, 200);

    expect(result).toMatchObject({ ok: true, oldCap: 10, newCap: 20, oldLevel: 10, newLevel: 20 });
    if (!result.ok) throw new Error('expected unlock success');
    expect(result.state.party.owned).toEqual([
      { uid: 'first', monsterId: 'aomori-ringoron', level: 20, levelCap: 20, xp },
      { uid: 'second', monsterId: 'aomori-ringoron', level: 10, levelCap: 10, xp },
    ]);
  });

  it('失敗時は素材・上限・レベルを一切変更しない', async () => {
    const c = await content();
    const game = createNewGame({ name: 'ハル', grade: 1 }, 100);
    const failures = [
      unlockLevelCap(game, { kind: 'hero' }, c, 200),
      unlockLevelCap(game, { kind: 'monster', uid: 'unknown' }, c, 200),
    ];
    const withoutMaterials = structuredClone(game);
    withoutMaterials.player.level = 10;
    withoutMaterials.player.levelCap = 10;
    failures.push(unlockLevelCap(withoutMaterials, { kind: 'hero' }, c, 200));
    const maximum = structuredClone(game);
    maximum.player.level = 200;
    maximum.player.levelCap = 200;
    maximum.inventory[LEARNING_FRAGMENT_ID] = 3;
    maximum.inventory[TRIAL_CORE_ID] = 1;
    failures.push(unlockLevelCap(maximum, { kind: 'hero' }, c, 200));

    expect(failures.map((result) => result.ok || result.reason)).toEqual([
      'not-at-cap',
      'unknown-target',
      'insufficient-materials',
      'absolute-cap',
    ]);
    expect(failures[0]?.state).toBe(game);
    expect(failures[1]?.state).toBe(game);
    expect(failures[2]?.state).toBe(withoutMaterials);
    expect(failures[3]?.state).toBe(maximum);
  });
});
