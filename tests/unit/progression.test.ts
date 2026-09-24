/**
 * フィールドの進行（中ボス → ワープホール → 次の県）と、名所イベントの報酬。純粋関数のテスト。
 */
import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { createNewGame } from '../../src/core/state/newGame';
import { midBossFlag, motifStamp, nextStop } from '../../src/core/progression/route';
import { applyReward, markDone, pickReward } from '../../src/core/progression/eventReward';

const newGame = () => createNewGame({ name: 'ハル', starterMonsterId: 'aomori-nebutan', grade: 1 }, 0);

describe('中ボスを倒したあとのワープ先', () => {
  it('同じ島の次の県のフィールドへ（順番は world/japan.json）', async () => {
    const c = await content();
    expect(nextStop(c.world, 'aomori')).toEqual({ id: 'iwate', mapKey: 'iwate-field' });
    expect(nextStop(c.world, 'akita')).toEqual({ id: 'yamagata', mapKey: 'yamagata-field' });
  });

  it('島の最後の県からは、次の島（order の順）の最初の県のフィールドへ', async () => {
    const c = await content();
    expect(nextStop(c.world, 'fukushima')).toEqual({ id: 'hokkaido', mapKey: 'hokkaido-field' });
    expect(nextStop(c.world, 'hokkaido')).toEqual({ id: 'ibaraki', mapKey: 'ibaraki-field' });
  });

  it('最後の島の最後の県と、どの島にも入っていない id は null', async () => {
    const c = await content();
    const islands = [...c.world.islands].sort((a, b) => a.order - b.order);
    const last = islands[islands.length - 1]!.areas;
    expect(nextStop(c.world, last[last.length - 1]!)).toBeNull();
    expect(nextStop(c.world, 'no-such-area')).toBeNull();
  });

  it('東北 6 県には中ボスがいて、にげられない戦いになる', async () => {
    const c = await content();
    const tohoku = c.world.islands.find((i) => i.id === 'tohoku')!;
    for (const id of tohoku.areas) {
      const mid = c.areas.get(id)?.midBoss;
      expect(mid, id).toBeTruthy();
      expect(c.monsters.get(mid!)?.isBoss, mid).toBe(true);
    }
  });

  it('しるしの id はセーブのスキーマ（id 形式）に入る形', () => {
    expect(midBossFlag('aomori')).toMatch(/^[a-z0-9][a-z0-9.-]*$/);
    expect(motifStamp('aomori', 'towada-ko')).toBe('aomori.towada-ko');
  });
});

describe('名所イベントの報酬（GDD §7）', () => {
  const tiers = [
    { min: 0, reward: { xp: 5 } },
    { min: 1, reward: { xp: 30 } },
    { min: 0.5, reward: { xp: 15 } },
  ];

  it('score に合う段を選ぶ（並び順によらない）', () => {
    expect(pickReward(tiers, 1)).toEqual({ xp: 30 });
    expect(pickReward(tiers, 0.7)).toEqual({ xp: 15 });
    expect(pickReward(tiers, 0)).toEqual({ xp: 5 });
  });

  it('経験値・おかね・どうぐ・わざ・レシピを反映し、元の GameState は書き換えない', () => {
    const gs = newGame();
    const { state, lines } = applyReward(
      gs,
      {
        xp: 10,
        gold: 5,
        items: [{ itemId: 'aomori-ringo', n: 3 }],
        skills: ['sk-shiraberu', 'sk-tashizan-giri'],
        recipes: ['rc-maguro-zutsuki'],
      },
      1,
    );
    expect(state.player.xp).toBe(10);
    expect(state.player.gold).toBe(105);
    expect(state.inventory['aomori-ringo']).toBe(3);
    expect(state.dex.items).toContain('aomori-ringo');
    expect(state.player.skills.filter((s) => s === 'sk-tashizan-giri')).toHaveLength(1);
    expect(state.player.skills).toContain('sk-shiraberu');
    expect(state.progress.unlockedRecipes).toContain('rc-maguro-zutsuki');
    // もう持っている わざ は「おぼえた」と言わない
    expect(lines.map((l) => l.kind)).toEqual(['xp', 'gold', 'item', 'skill', 'recipe']);
    expect(gs.player.xp).toBe(0);
  });

  it('イベント・スタンプ・しるしは何回つけても 1 つだけ', () => {
    let gs = newGame();
    for (let i = 0; i < 2; i++)
      gs = markDone(gs, { eventId: 'aomori-ev-towada', stamp: 'aomori.towada-ko', flag: 'midboss.aomori' });
    expect(gs.progress.eventsDone).toEqual(['aomori-ev-towada', 'midboss.aomori']);
    expect(gs.dex.motifs).toEqual(['aomori.towada-ko']);
  });
});
