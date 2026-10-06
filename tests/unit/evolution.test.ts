import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { evolutionOf, evolve } from '../../src/core/progression/evolution';
import { createNewGame } from '../../src/core/state/newGame';
import { chooseStoryCompanion } from '../../src/core/progression/storyCompanion';

describe('しんか', () => {
  it('ネブタイショウは しんかの お守りを かならず おとす', async () => {
    const c = await content();
    expect(c.monsters.get('aomori-midboss-nebuta-taisho')!.drops).toContainEqual({
      itemId: 'aomori-nebuta-no-omamori',
      rate: 1,
    });
  });

  it('お守りがあると ネブタンが ネブタムシャに しんかし、お守りが 1 つ へる', async () => {
    const c = await content();
    const gs = chooseStoryCompanion(createNewGame({ name: 'ハル', grade: 1 }), 'iwate-kagurabi');
    gs.party.owned[0]!.monsterId = 'aomori-nebutan';
    const owned = gs.party.owned[0]!;
    expect(owned.monsterId).toBe('aomori-nebutan');
    // お守りが無いうちは しんかできない
    expect(evolutionOf(gs, owned, c.monsters)?.ok).toBe(false);
    expect(evolve(gs, owned.uid, c.monsters)).toBeNull();

    const withItem = { ...gs, inventory: { ...gs.inventory, 'aomori-nebuta-no-omamori': 1 } };
    expect(evolutionOf(withItem, owned, c.monsters)?.ok).toBe(true);
    const next = evolve(withItem, owned.uid, c.monsters)!;
    const m = next.party.owned[0]!;
    expect(m.monsterId).toBe('aomori-nebuta-musha');
    expect(m.uid).toBe(owned.uid);
    expect(m.level).toBe(owned.level);
    expect(next.inventory['aomori-nebuta-no-omamori']).toBe(0);
    expect(next.dex.monsters).toContain('aomori-nebuta-musha');
    // 元の GameState は書き換えない
    expect(withItem.party.owned[0]!.monsterId).toBe('aomori-nebutan');
  });

  it('ネブタムシャは ねぶたの灯りを 3 こ つかって ネブタイショウに しんかする（2 こでは できない）', async () => {
    const c = await content();
    const gs = chooseStoryCompanion(createNewGame({ name: 'ハル', grade: 1 }), 'iwate-kagurabi');
    gs.party.owned[0]!.monsterId = 'aomori-nebutan';
    const owned = { ...gs.party.owned[0]!, monsterId: 'aomori-nebuta-musha' };
    const base = { ...gs, party: { ...gs.party, owned: [owned] } };
    const two = { ...base, inventory: { ...base.inventory, 'aomori-nebuta-no-akari': 2 } };
    const info = evolutionOf(two, owned, c.monsters)!;
    expect(info.to.id).toBe('aomori-nebuta-taisho');
    expect(info.need).toBe(3);
    expect(info.ok).toBe(false);
    const three = { ...base, inventory: { ...base.inventory, 'aomori-nebuta-no-akari': 3 } };
    const next = evolve(three, owned.uid, c.monsters)!;
    expect(next.party.owned[0]!.monsterId).toBe('aomori-nebuta-taisho');
    expect(next.inventory['aomori-nebuta-no-akari']).toBe(0);
    // しんかするたびに強くなる（こうげき）
    const atk = (id: string) => c.monsters.get(id)!.baseStats.atk;
    expect(atk('aomori-nebuta-musha')).toBeGreaterThan(atk('aomori-nebutan'));
    expect(atk('aomori-nebuta-taisho')).toBeGreaterThan(atk('aomori-nebuta-musha'));
  });

  it('しんかしないモンスターは null', async () => {
    const c = await content();
    const gs = chooseStoryCompanion(createNewGame({ name: 'ハル', grade: 1 }), 'iwate-kagurabi');
    gs.party.owned[0]!.monsterId = 'aomori-nebutan';
    // しんかの さいごの すがた（リンゴロンなど 東北の 通常モンスターは みんな しんかする）
    const owned = { ...gs.party.owned[0]!, monsterId: 'aomori-nebuta-taisho' };
    expect(evolutionOf(gs, owned, c.monsters)).toBeNull();
  });
});

describe('わざの しんか', () => {
  it('しんか前は こども わざ（ネブタン＝ひのこ）、しんかすると ほのおのまいに しんかし、ラッセラーのほのおを おぼえる', async () => {
    const { skillChanges } = await import('../../src/core/progression/evolution');
    const { content } = await import('./helpers');
    const c = await content();
    const nebutan = c.monsters.get('aomori-nebutan')!;
    const musha = c.monsters.get('aomori-nebuta-musha')!;
    expect(nebutan.skills).toEqual(['sk-hinoko']);
    const ch = skillChanges(nebutan, musha, c.skills);
    expect(ch.evolved.map(([a, b]) => [a.id, b.id])).toEqual([['sk-hinoko', 'sk-hono-no-mai']]);
    expect(ch.learned.map((s) => s.id)).toEqual(['sk-rasseraa-no-hono']);
  });

  it('しんか前の モンスターの こども わざは、しんか後に かならず 大人の わざに しんかする', async () => {
    const { skillChanges } = await import('../../src/core/progression/evolution');
    const { content } = await import('./helpers');
    const c = await content();
    for (const m of c.monsters.values()) {
      const to = m.evolution && c.monsters.get(m.evolution.to);
      if (!to) continue;
      const lost = m.skills.filter((id) => !to.skills.includes(id));
      expect(skillChanges(m, to, c.skills).evolved.length, m.id).toBe(lost.length);
      // こども わざは 大人より よわい
      for (const [a, b] of skillChanges(m, to, c.skills).evolved)
        expect(a.power, a.id).toBeLessThanOrEqual(b.power);
    }
  });
});
