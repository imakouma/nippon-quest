/**
 * バトル画面まわりの純粋ロジック：
 *  - GameState → Party / 出現抽選（src/core/battle/setup.ts）
 *  - バトル結果の反映（src/core/progression/battleResult.ts）
 *  - イベント → メッセージ（src/scenes/battle/narrate.ts）
 *  - 文言キーが ja.json に全部あること（i18n）
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { content } from './helpers';
import { createNewGame } from '../../src/core/state/newGame';
import { chooseStoryCompanion } from '../../src/core/progression/storyCompanion';
import { encounterLevel, partyFromGameState, pickEncounter, zoneForMap } from '../../src/core/battle/setup';
import {
  applyBattleResult,
  syncHeroLevel,
  xpToNextLevel,
  type BattleSummary,
} from '../../src/core/progression/battleResult';
import { createRng } from '../../src/core/rng';
import { normalizeEvents, narrate, type NarrateCtx } from '../../src/scenes/battle/narrate';
import { format, lookup, setDictionary, type I18nDict } from '../../src/ui/i18n';
import type { BattleEvent } from '../../src/core/battle/types';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const ja = JSON.parse(readFileSync(join(ROOT, 'content/i18n/ja.json'), 'utf8')) as I18nDict;

beforeAll(() => setDictionary(ja));

const newGame = () => chooseStoryCompanion(createNewGame({ name: 'ハル', grade: 1 }, 0), 'iwate-kagurabi');

describe('GameState → Party', () => {
  it('戦闘外で経験値を得た状態も保存用レベルへ同期できる', async () => {
    const c = await content();
    const gs = newGame();
    gs.player.xp = c.xp.hero[2]!;

    const synced = syncHeroLevel(gs, c.xp.hero);
    expect(synced.player.level).toBe(3);
    expect(gs.player.level).toBe(1);
  });

  it('主人公と相棒が入り、今の HP/MP から始まる', async () => {
    const c = await content();
    const gs = newGame();
    gs.player.hp = 12;
    const party = partyFromGameState(gs, c);
    expect(party.hero.name).toBe('ハル');
    expect(party.hero.hp).toBe(12);
    expect(party.hero.stats.hp).toBe(24);
    expect(party.monsters.map((m) => m.refId)).toEqual(['iwate-kagurabi']);
    // 入門装備は所持していても、バトルへ持ち込む消耗品ではない。
    expect(party.items).toEqual({});
  });

  it('HP 0 のセーブでも 1 で始まる（いきなり負けない）', async () => {
    const c = await content();
    const gs = newGame();
    gs.player.hp = 0;
    expect(partyFromGameState(gs, c).hero.hp).toBe(1);
  });

  it('経験値でレベルが上がると主人公の戦闘ステータスも成長する', async () => {
    const c = await content();
    const level1 = newGame();
    const level2 = newGame();
    level2.player.xp = c.xp.hero[1]!;

    const before = partyFromGameState(level1, c).hero;
    const after = partyFromGameState(level2, c).hero;
    expect(after.level).toBe(2);
    expect(after.stats.hp).toBeGreaterThan(before.stats.hp);
    expect(after.stats.scienceAtk).toBeGreaterThan(before.stats.scienceAtk);
  });

  it('content に無いモンスターは連れていかない', async () => {
    const c = await content();
    const gs = newGame();
    gs.party.owned.push({ uid: 'ghost', monsterId: 'no-such-monster', level: 1, xp: 0 });
    expect(partyFromGameState(gs, c).monsters).toHaveLength(1);
  });
});

describe('エンカウント', () => {
  it('マップキーからゾーンを決める', () => {
    expect(zoneForMap('aomori-field')).toBe('field');
    expect(zoneForMap('aomori-dungeon')).toBe('dungeon');
    expect(zoneForMap('aomori-town')).toBeNull();
    expect(zoneForMap('tohoku-island')).toBeNull();
  });

  it('県のテーブルから抽選し、同じシードなら同じ結果', async () => {
    const c = await content();
    const aomori = c.areas.get('aomori')!;
    const a = pickEncounter(aomori, 'field', createRng('enc'));
    const b = pickEncounter(aomori, 'field', createRng('enc'));
    expect(a).toBe(b);
    expect(aomori.encounters[0]!.table.map((t) => t.monsterId)).toContain(a);
  });

  it('テーブルが無い県は null', async () => {
    const c = await content();
    // 47 都道府県 ぜんぶに 出現表が 入ったので、表の 無い 県を その場で 作って ためす
    const empty = { ...c.areas.get('tokyo')!, encounters: [] };
    expect(pickEncounter(empty, 'field', createRng('x'))).toBeNull();
  });

  it('出現レベルは 1 未満にならない', () => {
    for (let i = 0; i < 50; i++) expect(encounterLevel(1, createRng(`lv${i}`))).toBeGreaterThanOrEqual(1);
  });
});

const summary = (over: Partial<BattleSummary> = {}): BattleSummary => ({
  outcome: 'victory',
  enemyRefId: 'aomori-ringoron',
  enemyLevel: 2,
  heroHp: 20,
  heroMp: 4,
  heroMaxHp: 40,
  heroMaxMp: 10,
  xp: 12,
  gold: 8,
  drops: ['aomori-ringo'],
  items: { 'akita-kiritanpo': 2 },
  recruitAccepted: false,
  perfectBySubject: { sansu: 2 },
  ...over,
});

describe('バトル結果の反映（GDD §4.5〜4.6）', () => {
  it('勝利：経験値・ゴールド・ドロップ・図鑑・カウンタ', () => {
    const { state } = applyBattleResult(newGame(), summary(), { defeatGoldLossRate: 0.1 });
    expect(state.player.xp).toBe(12);
    expect(state.player.gold).toBe(108);
    expect(state.player.hp).toBe(20);
    expect(state.inventory['aomori-ringo']).toBe(1);
    expect(state.dex.items).toContain('aomori-ringo');
    expect(state.inventory['akita-kiritanpo']).toBe(2);
    expect(state.dex.monsters).toContain('aomori-ringoron');
    expect(state.progress.counters['defeat:aomori-ringoron']).toBe(1);
    expect(state.progress.counters['perfect:sansu']).toBe(2);
  });

  it('元の GameState は書き換えない', () => {
    const gs = newGame();
    applyBattleResult(gs, summary(), { defeatGoldLossRate: 0.1 });
    expect(gs.player.xp).toBe(0);
  });

  it('勝利報酬とカウンターが安全整数を超えてセーブ不能にならない', () => {
    const gs = newGame();
    gs.player.xp = Number.MAX_SAFE_INTEGER;
    gs.player.gold = Number.MAX_SAFE_INTEGER;
    gs.inventory['aomori-ringo'] = Number.MAX_SAFE_INTEGER;
    gs.progress.counters['defeat:aomori-ringoron'] = Number.MAX_SAFE_INTEGER;
    gs.progress.counters['perfect:sansu'] = Number.MAX_SAFE_INTEGER;

    const { state } = applyBattleResult(gs, summary(), { defeatGoldLossRate: 0.1 });

    expect(state.player.xp).toBe(Number.MAX_SAFE_INTEGER);
    expect(state.player.gold).toBe(Number.MAX_SAFE_INTEGER);
    expect(state.inventory['aomori-ringo']).toBe(Number.MAX_SAFE_INTEGER);
    expect(state.progress.counters['defeat:aomori-ringoron']).toBe(Number.MAX_SAFE_INTEGER);
    expect(state.progress.counters['perfect:sansu']).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('敗北：ゴールド 10% を失い、HP/MP 全快。仲間は失わない', () => {
    const { state, goldLost } = applyBattleResult(
      newGame(),
      summary({ outcome: 'defeat', heroHp: 0, xp: 0, gold: 0, drops: [] }),
      { defeatGoldLossRate: 0.1 },
    );
    expect(goldLost).toBe(10);
    expect(state.player.gold).toBe(90);
    expect(state.player.hp).toBe(40);
    expect(state.player.mp).toBe(10);
    expect(state.player.xp).toBe(0);
    expect(state.party.owned).toHaveLength(1);
  });

  it('にげた：経験値もゴールドも増えない', () => {
    const { state } = applyBattleResult(newGame(), summary({ outcome: 'fled' }), { defeatGoldLossRate: 0.1 });
    expect(state.player.xp).toBe(0);
    expect(state.player.gold).toBe(100);
  });

  it('仲間化（さそって成功 / 勝利後に はい）でパーティに加わる', () => {
    const a = applyBattleResult(newGame(), summary({ outcome: 'recruited' }), { defeatGoldLossRate: 0.1 });
    expect(a.newMonsterUid).not.toBeNull();
    expect(a.state.party.owned.map((o) => o.monsterId)).toContain('aomori-ringoron');
    const b = applyBattleResult(newGame(), summary({ recruitAccepted: true }), { defeatGoldLossRate: 0.1 });
    expect(b.state.party.owned).toHaveLength(2);
    const c = applyBattleResult(newGame(), summary({ recruitAccepted: false }), { defeatGoldLossRate: 0.1 });
    expect(c.state.party.owned).toHaveLength(1);
  });

  it('同じモンスターを 2 回仲間にしても uid が重ならない', () => {
    let gs = newGame();
    for (let i = 0; i < 2; i++)
      gs = applyBattleResult(gs, summary({ outcome: 'recruited' }), { defeatGoldLossRate: 0.1 }).state;
    const uids = gs.party.owned.map((o) => o.uid);
    expect(new Set(uids).size).toBe(uids.length);
  });

  it('次のレベルまでの経験値（xp.json は index = Lv-1 の累積）', async () => {
    const c = await content();
    expect(xpToNextLevel(c.xp.hero, 1, 0)).toEqual({ need: 20, ratio: 0 });
    expect(xpToNextLevel(c.xp.hero, 1, 10).ratio).toBeCloseTo(0.5);
    expect(xpToNextLevel([0, 10], 2, 99)).toEqual({ need: 0, ratio: 1 });
  });
});

const ctx: NarrateCtx = {
  nameOf: (id) => ({ hero: 'ハル', pal: 'ネブタン' })[id] ?? id,
  skillName: () => 'たしざんぎり',
  itemName: () => 'りんご',
  elementName: (el) => (ja.elements as Record<string, string>)[el] ?? el,
  subjectName: (s) => (ja.subjects as Record<string, string>)[s] ?? s,
  enemyName: 'リンゴロン',
  isBossBattle: false,
};

describe('メッセージ（narrate）', () => {
  it('どうぐ → かいふく の順に並べ替える', () => {
    const ev: BattleEvent[] = [
      { t: 'heal', side: 'ally', targetId: 'hero', amount: 30 },
      { t: 'itemUsed', itemId: 'aomori-ringo', targetId: 'hero' },
    ];
    expect(normalizeEvents(ev).map((e) => e.t)).toEqual(['itemUsed', 'heal']);
  });

  it('ダメージと相性の文', () => {
    const lines = narrate(
      {
        t: 'damage',
        side: 'enemy',
        targetId: 'enemy',
        amount: 14,
        critical: false,
        elementMult: 2,
        weakness: true,
        scoreBand: 'perfect',
        comboMult: 1,
      },
      ctx,
    );
    expect(lines).toEqual(['リンゴロンに 14の ダメージ！', 'じゃくてんを ついた！', 'よく きいている！']);
  });

  it('かいしんの いちげき は ダメージの 前に 言う', () => {
    const lines = narrate(
      {
        t: 'damage',
        side: 'enemy',
        targetId: 'enemy',
        amount: 21,
        critical: true,
        elementMult: 1,
        weakness: false,
        scoreBand: null,
        comboMult: 1.1,
      },
      ctx,
    );
    expect(lines).toEqual(['かいしんの いちげき！', 'リンゴロンに 21の ダメージ！']);
  });

  it('コンボ・ゲージ・コマンドゲージの 文（いつも 出る ゲージの チャージは 文に しない）', () => {
    expect(narrate({ t: 'combo', count: 3, bonus: 1.15 }, ctx)).toEqual(['3コンボ！ いりょく +15%']);
    const charge: Extract<BattleEvent, { t: 'gaugeCharge' }> = {
      t: 'gaugeCharge',
      subject: 'sansu',
      amount: 40,
      value: 40,
      max: 100,
      boosted: false,
      unlocked: [],
    };
    expect(narrate({ ...charge, unlocked: [] }, ctx)).toEqual([]);
    expect(narrate({ ...charge, unlocked: ['sk-kuku-rush'] }, ctx)).toEqual([
      'たしざんぎりが うてるように なった！',
    ]);
    expect(narrate({ ...charge, value: 100 }, ctx)).toEqual(['さんすうゲージが まんたん！']);
    expect(narrate({ t: 'gaugeShort', subject: 'sansu', need: 50, have: 20 }, ctx)).toEqual([
      'さんすうゲージが たりない！ あと 30 ためよう',
    ]);
    expect(narrate({ t: 'turnStart', turn: 2 }, ctx)).toEqual([]);
    expect(narrate({ t: 'swap', from: 'pal', to: 'pal2', auto: true }, ctx)).toEqual([
      'pal2が まえに でた！',
    ]);
  });

  it('ボス戦で逃げられないときの文', () => {
    expect(narrate({ t: 'fleeAttempt', success: false, chance: 0 }, { ...ctx, isBossBattle: true })).toEqual([
      '強[つよ]い ワスレモノからは にげられない！',
    ]);
  });

  it('「みを まもっている」の直後の防御アップは言い直さない', () => {
    const act: BattleEvent = { t: 'act', side: 'enemy', actorId: 'enemy', command: 'defend' };
    const buff: BattleEvent = {
      t: 'buff',
      side: 'enemy',
      targetId: 'enemy',
      stat: 'def',
      mult: 1.5,
      turns: 1,
    };
    expect(narrate(buff, ctx, act)).toEqual([]);
    expect(narrate(buff, ctx)).toEqual(['リンゴロンの ぼうぎょが あがった！']);
  });

  it('全イベント型で例外を出さない', () => {
    const all: BattleEvent[] = [
      { t: 'act', side: 'ally', actorId: 'hero', command: 'skill', skillId: 'sk' },
      { t: 'act', side: 'ally', actorId: 'pal', command: 'attack', auto: true },
      { t: 'heal', side: 'ally', targetId: 'hero', amount: 3 },
      { t: 'buff', side: 'ally', targetId: 'hero', stat: 'def', mult: 1.3, turns: 3 },
      { t: 'status', targetId: 'enemy', turns: 2 },
      { t: 'skipTurn', targetId: 'enemy', remain: 0 },
      { t: 'turnStart', turn: 3 },
      { t: 'weaknessRevealed', targetId: 'enemy', element: 'hino' },
      { t: 'scanFailed', targetId: 'enemy' },
      { t: 'combo', count: 3, bonus: 1.15 },
      { t: 'gaugeCharge', subject: 'kokugo', amount: 40, value: 100, max: 100, boosted: true, unlocked: [] },
      { t: 'gaugeUse', subject: 'kokugo', amount: 50, value: 50 },
      { t: 'gaugeShort', subject: 'rika', need: 100, have: 0 },
      { t: 'itemUsed', itemId: 'aomori-ringo', targetId: 'pal' },
      { t: 'recruitGift', itemId: 'aomori-ringo', targetId: 'enemy' },
      { t: 'swap', from: 'pal', to: 'hero' },
      { t: 'recruitAttempt', targetId: 'enemy', success: false, chance: 0.1 },
      { t: 'recruited', monsterId: 'x' },
      { t: 'fleeAttempt', success: false, chance: 0.3 },
      { t: 'fled' },
      { t: 'ko', side: 'ally', targetId: 'pal' },
      { t: 'bossPhase', phaseIndex: 1, line: 'がおー' },
      { t: 'victory', xp: 1, gold: 1, drops: [], recruitOffer: false, bonus: 1, maxCombo: 0 },
      { t: 'defeat' },
    ];
    for (const e of all) for (const line of narrate(e, ctx)) expect(line).not.toMatch(/^battle\./);
  });
});

describe('文言キー（content/i18n/ja.json）', () => {
  it('空のどうぐ・いれかえを押したときの案内がある', () => {
    expect(lookup(ja, 'battle.noItems')).toBe('どうぐが ないよ');
    expect(lookup(ja, 'battle.noPartner')).toBe('いれかえられる なかまが いないよ');
  });

  it('format は {name} を埋め、知らない {x} は残す', () => {
    expect(format('{a}と{b}', { a: 1 })).toBe('1と{b}');
  });

  it('コードで使っているキーが全部 ja.json にある', () => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(n)) files.push(p);
      }
    };
    walk(join(ROOT, 'src'));
    const keys = new Set<string>();
    for (const f of files)
      for (const m of readFileSync(f, 'utf8').matchAll(
        /['"]((?:battle|cmd|ui|elements|subjects|feedback|field|question)\.[A-Za-z]+)['"]/g,
      ))
        keys.add(m[1]!);
    expect(keys.size).toBeGreaterThan(20);
    const missing = [...keys].filter((k) => lookup(ja, k) === undefined);
    expect(missing).toEqual([]);
  });
});

describe('前の セーブの どうぐ', () => {
  it('content に 無い どうぐ（なくした やくそう）は バトルに もちこまない', async () => {
    const c = await content();
    const gs = newGame();
    gs.inventory = { 'common-yakusou': 3, 'aomori-ringo': 1 };
    gs.party.bagItems = ['common-yakusou', 'aomori-ringo'];
    expect(partyFromGameState(gs, c).items).toEqual({ 'aomori-ringo': 1 });
  });
});
