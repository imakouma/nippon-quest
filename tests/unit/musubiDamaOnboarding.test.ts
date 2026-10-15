import { describe, expect, it } from 'vitest';
import {
  completeMusubiDamaOnboarding,
  guideMusubiDamaPurchase,
  MUSUBI_DAMA_COMPLETE_COUNTER,
  MUSUBI_DAMA_GUIDE_COUNTER,
  shouldGuideMusubiDamaPurchase,
} from '../../src/core/progression/musubiDamaOnboarding';
import { createNewGame } from '../../src/core/state/newGame';

const fresh = () => createNewGame({ name: 'テスト', grade: 3 }, 1_000);

describe('むすび玉の購入導入', () => {
  it('未所持のセーブは青森の町で一度だけ案内する', () => {
    const game = fresh();
    expect(shouldGuideMusubiDamaPurchase('aomori-town', game)).toBe(true);
    expect(shouldGuideMusubiDamaPurchase('akita-town', game)).toBe(false);
    const guided = guideMusubiDamaPurchase(game, 2_000);
    expect(guided.progress.counters[MUSUBI_DAMA_GUIDE_COUNTER]).toBe(1);
    expect(guided.updatedAt).toBe(2_000);
    expect(shouldGuideMusubiDamaPurchase('aomori-town', guided)).toBe(false);
  });

  it('所持済みは購入案内を出さず、初購入完了を保存する', () => {
    const game = fresh();
    game.inventory['common-musubi-dama'] = 1;
    expect(shouldGuideMusubiDamaPurchase('aomori-town', game)).toBe(false);
    const complete = completeMusubiDamaOnboarding(game, 3_000);
    expect(complete.progress.counters[MUSUBI_DAMA_COMPLETE_COUNTER]).toBe(1);
    expect(complete.party.bagItems).toContain('common-musubi-dama');
    expect(complete.updatedAt).toBe(3_000);
  });
});
