/**
 * フィールドの進行（中ボス → ワープホール → 次の県）と、名所イベントの報酬。純粋関数のテスト。
 */
import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { createNewGame } from '../../src/core/state/newGame';
import { midBossFlag, motifStamp, nextStop } from '../../src/core/progression/route';
import { canChallengeIslandBoss, completeIsland, hasAllAreaSigns } from '../../src/core/progression/island';
import { applyReward, markDone, pickReward } from '../../src/core/progression/eventReward';

const newGame = () => createNewGame({ name: 'ハル', starterMonsterId: 'aomori-nebutan', grade: 1 }, 0);

describe('中ボスを倒したあとのワープ先', () => {
  it('同じ島の次の県のフィールドへ（順番は world/japan.json）', async () => {
    const c = await content();
    expect(nextStop(c.world, 'aomori')).toEqual({ id: 'iwate', mapKey: 'iwate-field' });
    expect(nextStop(c.world, 'akita')).toEqual({ id: 'yamagata', mapKey: 'yamagata-field' });
  });

  it('島の最後の県では地方ボスが結界を守るため、次の島へ直接進まない', async () => {
    const c = await content();
    expect(nextStop(c.world, 'fukushima')).toBeNull();
    expect(nextStop(c.world, 'hokkaido')).toBeNull();
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

describe('地方ボスと島クリア', () => {
  it('東北6県の県のしるしがすべて揃ったときだけ挑戦できる', async () => {
    const c = await content();
    const tohoku = c.world.islands.find((island) => island.id === 'tohoku')!;
    expect(hasAllAreaSigns(c.world, 'tohoku', tohoku.areas.slice(0, -1))).toBe(false);
    expect(hasAllAreaSigns(c.world, 'tohoku', [...tohoku.areas, tohoku.areas[0]!])).toBe(true);
    expect(hasAllAreaSigns(c.world, 'no-such-island', tohoku.areas)).toBe(false);

    const gs = newGame();
    gs.progress.areaSigns = [...tohoku.areas];
    expect(canChallengeIslandBoss(c.world, 'tohoku', gs.progress)).toBe(true);
    gs.progress.islandsCleared.push('tohoku');
    expect(canChallengeIslandBoss(c.world, 'tohoku', gs.progress)).toBe(false);
  });

  it('勝利処理は東北を一度だけ記録し、しるし不足では状態を変えない', async () => {
    const c = await content();
    const gs = newGame();
    expect(completeIsland(gs, c.world, 'tohoku', 10)).toBe(gs);

    gs.progress.areaSigns = [...c.world.islands.find((island) => island.id === 'tohoku')!.areas];
    const cleared = completeIsland(gs, c.world, 'tohoku', 20);
    expect(cleared).not.toBe(gs);
    expect(cleared.progress.islandsCleared).toEqual(['tohoku']);
    expect(cleared.updatedAt).toBe(20);
    expect(completeIsland(cleared, c.world, 'tohoku', 30)).toBe(cleared);
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
        skills: ['sk-shiraberu', 'sk-hinoko'],
        recipes: ['rc-maguro-zutsuki'],
      },
      1,
    );
    expect(state.player.xp).toBe(10);
    expect(state.player.gold).toBe(105);
    expect(state.inventory['aomori-ringo']).toBe(3);
    expect(state.dex.items).toContain('aomori-ringo');
    expect(state.player.skills.filter((s) => s === 'sk-hinoko')).toHaveLength(1);
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

describe('名所エリア（青森）', () => {
  it('エリアの 中では その エリアの 表、地面の 表が あれば そちら、無い エリアの 地面は エリアの field', async () => {
    const { encounterTable } = await import('../../src/core/battle/setup');
    const { content } = await import('./helpers');
    const c = await content();
    const aomori = c.areas.get('aomori')!;
    const ids = (t: ReturnType<typeof encounterTable>) => t?.table.map((x) => x.monsterId) ?? [];
    expect(ids(encounterTable(aomori, 'field', 'shore', 'towada'))).toContain('aomori-himemassu');
    expect(ids(encounterTable(aomori, 'field', 'grass', 'hirosaki'))).toContain('aomori-sakurapon');
    // 弘前城エリアに みずべの 表は 無い → エリアの field
    expect(ids(encounterTable(aomori, 'field', 'shore', 'hirosaki'))).toContain('aomori-sakurapon');
    // エリアの 外（ダンジョン）は ふつうの 表
    expect(encounterTable(aomori, 'dungeon', null, null)?.region).toBeUndefined();
  });

  it('関所で すべての エリアが つながり、さいしょの エリアから じゅんばんに ひらける', async () => {
    const { content } = await import('./helpers');
    const c = await content();
    const a = c.areas.get('aomori')!;
    const ids = a.regions.map((r) => r.id);
    const open = new Set(a.regions.filter((r) => r.start).map((r) => r.id));
    expect(open.size).toBe(1);
    // ぬしを たおせる エリアから 関所を ひらいて いく
    for (let k = 0; k < ids.length; k++)
      for (const g of a.regionGates)
        if (open.has(g.openedBy) && g.between.some((id) => open.has(id)))
          g.between.forEach((id) => open.add(id));
    expect([...open].sort()).toEqual([...ids].sort());
    for (const r of a.regions) expect(c.monsters.has(r.boss!.monsterId), r.id).toBe(true);
  });
});
