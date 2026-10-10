/**
 * フィールドの進行（中ボス → ワープホール → 次の県）と、名所イベントの報酬。純粋関数のテスト。
 */
import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { createNewGame } from '../../src/core/state/newGame';
import { midBossFlag, motifStamp, nextStop } from '../../src/core/progression/route';
import { canChallengeIslandBoss, completeIsland, hasAllAreaSigns } from '../../src/core/progression/island';
import { applyReward, markDone, pickReward } from '../../src/core/progression/eventReward';
import { applyArenaVictory, markMapVisited } from '../../src/core/progression/arena';

const newGame = () => createNewGame({ name: 'ハル', grade: 1 }, 0);

describe('闘技場と訪問記録', () => {
  it('勝利報酬とバッジを加算し、更新時刻を進める', () => {
    const gs = newGame();
    const rewarded = applyArenaVictory(gs, 60, 10);

    expect(rewarded.player.gold).toBe(gs.player.gold + 60);
    expect(rewarded.arena.badges).toBe(gs.arena.badges + 1);
    expect(rewarded.updatedAt).toBe(10);
    expect(gs.player.gold).toBe(100);
    expect(gs.arena.badges).toBe(0);
  });

  it('闘技場報酬とバッジが安全整数を超えない', () => {
    const gs = newGame();
    gs.player.gold = Number.MAX_SAFE_INTEGER;
    gs.arena.badges = Number.MAX_SAFE_INTEGER;

    const rewarded = applyArenaVictory(gs, 1);

    expect(rewarded.player.gold).toBe(Number.MAX_SAFE_INTEGER);
    expect(rewarded.arena.badges).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('初回訪問だけを記録し、更新時刻を進める', () => {
    const gs = newGame();
    const visited = markMapVisited(gs, 'aomori-town', 10);

    expect(visited.progress.counters['visit:aomori-town']).toBe(1);
    expect(visited.updatedAt).toBe(10);
    expect(gs.progress.counters['visit:aomori-town']).toBeUndefined();
    expect(markMapVisited(visited, 'aomori-town', 20)).toBe(visited);
  });
});

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

    gs.progress.areaSigns = ['hokkaido'];
    expect(canChallengeIslandBoss(c.world, 'hokkaido', gs.progress)).toBe(true);
  });

  it('前の地方をクリアしていなければ、後の地方のしるしが揃っていても挑戦できない', async () => {
    const c = await content();
    const gs = newGame();
    gs.progress.areaSigns = [...c.world.islands.find((island) => island.id === 'kanto')!.areas];
    expect(canChallengeIslandBoss(c.world, 'kanto', gs.progress)).toBe(false);
    gs.progress.islandsCleared = ['tohoku', 'hokkaido'];
    expect(canChallengeIslandBoss(c.world, 'kanto', gs.progress)).toBe(true);
  });

  it('勝利処理は東北を一度だけ記録し、しるし不足では状態を変えない', async () => {
    const c = await content();
    const gs = newGame();
    expect(completeIsland(gs, c.world, 'tohoku', 10)).toBe(gs);

    gs.progress.areaSigns = [...c.world.islands.find((island) => island.id === 'tohoku')!.areas];
    const cleared = completeIsland(gs, c.world, 'tohoku', 20);
    expect(cleared).not.toBe(gs);
    expect(cleared.progress.islandsCleared).toEqual(['tohoku']);
    expect(cleared.progress.counters['visit:hokkaido-field']).toBe(1);
    expect(cleared.updatedAt).toBe(20);
    expect(completeIsland(cleared, c.world, 'tohoku', 30)).toBe(cleared);
  });

  it('地方データの配列順ではなく order に従って次の地方を解放する', async () => {
    const c = await content();
    const gs = newGame();
    gs.progress.areaSigns = [...c.world.islands.find((island) => island.id === 'tohoku')!.areas];
    const reorderedWorld = { ...c.world, islands: [...c.world.islands].reverse() };

    const cleared = completeIsland(gs, reorderedWorld, 'tohoku', 20);

    expect(cleared.progress.counters['visit:hokkaido-field']).toBe(1);
  });

  it('北海道クリア後は関東最初の茨城を訪問可能にする', async () => {
    const c = await content();
    const gs = newGame();
    gs.progress.areaSigns = ['hokkaido'];
    gs.progress.islandsCleared = ['tohoku'];
    const cleared = completeIsland(gs, c.world, 'hokkaido', 20);
    expect(cleared.progress.islandsCleared).toEqual(['tohoku', 'hokkaido']);
    expect(cleared.progress.counters['visit:ibaraki-field']).toBe(1);
  });

  it('関東クリア後は北陸最初の新潟を訪問可能にする', async () => {
    const c = await content();
    const gs = newGame();
    gs.progress.areaSigns = [...c.world.islands.find((island) => island.id === 'kanto')!.areas];
    gs.progress.islandsCleared = ['tohoku', 'hokkaido'];
    const cleared = completeIsland(gs, c.world, 'kanto', 20);
    expect(cleared.progress.islandsCleared).toContain('kanto');
    expect(cleared.progress.counters['visit:niigata-field']).toBe(1);
  });

  it('北陸クリア後は甲信最初の山梨を訪問可能にする', async () => {
    const c = await content();
    const gs = newGame();
    gs.progress.areaSigns = [...c.world.islands.find((island) => island.id === 'hokuriku')!.areas];
    gs.progress.islandsCleared = ['tohoku', 'hokkaido', 'kanto'];
    const cleared = completeIsland(gs, c.world, 'hokuriku', 20);
    expect(cleared.progress.islandsCleared).toContain('hokuriku');
    expect(cleared.progress.counters['visit:yamanashi-field']).toBe(1);
  });

  it('甲信クリア後は東海最初の岐阜を訪問可能にする', async () => {
    const c = await content();
    const gs = newGame();
    gs.progress.areaSigns = [...c.world.islands.find((island) => island.id === 'koshinetsu')!.areas];
    gs.progress.islandsCleared = ['tohoku', 'hokkaido', 'kanto', 'hokuriku'];
    const cleared = completeIsland(gs, c.world, 'koshinetsu', 20);
    expect(cleared.progress.islandsCleared).toContain('koshinetsu');
    expect(cleared.progress.counters['visit:gifu-field']).toBe(1);
  });

  it('東海クリア後は近畿最初の滋賀を訪問可能にする', async () => {
    const c = await content();
    const gs = newGame();
    gs.progress.areaSigns = [...c.world.islands.find((island) => island.id === 'tokai')!.areas];
    gs.progress.islandsCleared = ['tohoku', 'hokkaido', 'kanto', 'hokuriku', 'koshinetsu'];
    const cleared = completeIsland(gs, c.world, 'tokai', 20);
    expect(cleared.progress.counters['visit:shiga-field']).toBe(1);
  });

  it('近畿クリア後は中国地方最初の鳥取を訪問可能にする', async () => {
    const c = await content();
    const gs = newGame();
    gs.progress.areaSigns = [...c.world.islands.find((island) => island.id === 'kinki')!.areas];
    gs.progress.islandsCleared = ['tohoku', 'hokkaido', 'kanto', 'hokuriku', 'koshinetsu', 'tokai'];
    const cleared = completeIsland(gs, c.world, 'kinki', 20);
    expect(cleared.progress.counters['visit:tottori-field']).toBe(1);
  });

  it('中国地方クリア後は四国最初の徳島を訪問可能にする', async () => {
    const c = await content();
    const gs = newGame();
    gs.progress.areaSigns = [...c.world.islands.find((island) => island.id === 'chugoku')!.areas];
    gs.progress.islandsCleared = ['tohoku', 'hokkaido', 'kanto', 'hokuriku', 'koshinetsu', 'tokai', 'kinki'];
    const cleared = completeIsland(gs, c.world, 'chugoku', 20);
    expect(cleared.progress.counters['visit:tokushima-field']).toBe(1);
  });

  it('四国クリア後は九州・沖縄最初の福岡を訪問可能にする', async () => {
    const c = await content();
    const gs = newGame();
    gs.progress.areaSigns = [...c.world.islands.find((island) => island.id === 'shikoku')!.areas];
    gs.progress.islandsCleared = [
      'tohoku',
      'hokkaido',
      'kanto',
      'hokuriku',
      'koshinetsu',
      'tokai',
      'kinki',
      'chugoku',
    ];
    const cleared = completeIsland(gs, c.world, 'shikoku', 20);
    expect(cleared.progress.counters['visit:fukuoka-field']).toBe(1);
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

  it('経験値・おかね・どうぐ・わざ・レシピ・モンスター解放を反映し、元の GameState は書き換えない', () => {
    const gs = newGame();
    const { state, lines } = applyReward(
      gs,
      {
        xp: 10,
        gold: 5,
        items: [{ itemId: 'aomori-ringo', n: 3 }],
        skills: ['sk-shiraberu', 'sk-hinoko'],
        recipes: ['rc-maguro-zutsuki'],
        unlockMonsters: ['aomori-itakodori'],
        title: 'ねぶた見習[みなら]い',
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
    expect(state.progress.unlockedMonsters).toEqual(['aomori-itakodori']);
    expect(state.progress.titles).toEqual(['ねぶた見習[みなら]い']);
    expect(lines.map((l) => l.kind)).toEqual([
      'xp',
      'gold',
      'item',
      'skill',
      'skill',
      'recipe',
      'monster',
      'title',
    ]);
    expect(gs.player.xp).toBe(0);
    expect(gs.progress.unlockedMonsters).toEqual([]);
    expect(gs.progress.titles).toEqual([]);
  });

  it('イベント報酬が安全整数を超えてセーブ不能にならない', () => {
    const gs = newGame();
    gs.player.xp = Number.MAX_SAFE_INTEGER;
    gs.player.gold = Number.MAX_SAFE_INTEGER;
    gs.inventory['aomori-ringo'] = Number.MAX_SAFE_INTEGER;

    const { state } = applyReward(gs, {
      xp: 1,
      gold: 1,
      items: [{ itemId: 'aomori-ringo', n: 1 }],
    });

    expect(state.player.xp).toBe(Number.MAX_SAFE_INTEGER);
    expect(state.player.gold).toBe(Number.MAX_SAFE_INTEGER);
    expect(state.inventory['aomori-ringo']).toBe(Number.MAX_SAFE_INTEGER);
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

  it('イベント報酬で解放されるモンスターは、解放前の抽選候補から除く', async () => {
    const { encounterTable, pickFromTable } = await import('../../src/core/battle/setup');
    const { createRng } = await import('../../src/core/rng');
    const { content } = await import('./helpers');
    const c = await content();
    const table = encounterTable(c.areas.get('aomori')!, 'dungeon', null, null)!;
    const gated = new Set(['aomori-itakodori']);

    const locked = Array.from({ length: 100 }, (_, index) =>
      pickFromTable(table, createRng(`locked-${index}`), { gated, unlocked: [] }),
    );
    const unlocked = Array.from({ length: 100 }, (_, index) =>
      pickFromTable(table, createRng(`unlocked-${index}`), {
        gated,
        unlocked: ['aomori-itakodori'],
      }),
    );

    expect(locked).not.toContain('aomori-itakodori');
    expect(unlocked).toContain('aomori-itakodori');
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
