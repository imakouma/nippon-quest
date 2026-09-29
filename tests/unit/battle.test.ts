import { beforeAll, describe, expect, it } from 'vitest';
import { content, deps } from './helpers';
import {
  act,
  battleSkills,
  createBattle,
  isHeroReady,
  makeCompanion,
  replay,
  type BattleDeps,
} from '../../src/core/battle/engine';
import { makeHero, makeMonster, makeParty } from '../../src/core/battle/factory';
import {
  comboBonus,
  computeDamage,
  critChance,
  recruitChance,
  scoreBand,
  scoreMultiplier,
} from '../../src/core/battle/damage';
import { createRng } from '../../src/core/rng';
import type { Skill } from '../../src/core/content/schemas';
import type { ActionResult, BattleState, Combatant, Command } from '../../src/core/battle/types';

let D: BattleDeps;
beforeAll(async () => {
  D = await deps();
});

const R = (score: number): ActionResult => ({ score, timeMs: 3000, attempts: 1 });

async function setup(
  opts: {
    level?: number;
    enemyId?: string;
    enemyLevel?: number;
    withMonster?: boolean;
    seed?: string;
    skills?: string[];
    def?: BattleDeps;
  } = {},
) {
  const c = await content();
  const hero = makeHero(
    {
      name: 'ハル',
      level: opts.level ?? 5,
      baseStats: { hp: 40, mp: 10, atk: 8, def: 6, spd: 7, wis: 5 },
      growth: { hp: 6, mp: 2, atk: 1.5, def: 1.2, spd: 1.0, wis: 1.0 },
      skills: opts.skills ?? ['sk-tashizan-giri', 'sk-shiraberu', 'sk-kanji-barrier'],
      equipment: {},
    },
    c.items,
    c.sets,
  );
  const enemyDef = c.monsters.get(opts.enemyId ?? 'aomori-ringoron')!;
  const enemy = makeMonster(enemyDef, opts.enemyLevel ?? 3, 'enemy');
  const mons = opts.withMonster ? [makeMonster(c.monsters.get('aomori-nebutan')!, 4, 'pal')] : [];
  const party = makeParty(hero, mons, { 'aomori-ringo': 2 });
  const state = createBattle({ ally: party, enemy, seed: opts.seed ?? 'test-seed' }, opts.def ?? D);
  return { state, c };
}

const toughen = <T extends Combatant>(x: T): T => ({ ...x, hp: 9999, stats: { ...x.stats, hp: 9999 } });

/** テスト中に 決着しないよう、敵も味方も HP を大きく */
function tough(s: BattleState): BattleState {
  return {
    ...s,
    enemy: toughen(s.enemy),
    ally: { ...s.ally, hero: toughen(s.ally.hero), monsters: s.ally.monsters.map(toughen) },
  };
}

/** n ターン すすめる（主人公は たたかう） */
function turns(s: BattleState, n: number, def: BattleDeps = D): BattleState {
  let cur = s;
  for (let i = 0; i < n && cur.outcome === 'ongoing'; i++) cur = act(cur, { kind: 'attack' }, def).state;
  return cur;
}

function withSkills(extra: Skill[]): BattleDeps {
  return { ...D, skills: new Map([...D.skills, ...extra.map((s) => [s.id, s] as const)]) };
}

const testSkill = (over: Partial<Skill>): Skill => ({
  id: 'sk-test',
  name: 'テスト',
  subject: 'kokugo',
  gradeRange: [1, 1],
  power: 100,
  element: 'none',
  mp: 0,
  gauge: 1,
  costGauge: 0,
  effect: 'damage',
  ...over,
});

describe('ダメージ計算（BaseDamage × ScoreMultiplier × ComboBonus × ElementMultiplier）', () => {
  it('score の表：1.0 = CRITICAL ×2.0 / 0.5〜0.99 = GREAT ×1.2 / 0.01〜0.49 = GOOD ×0.8 / 0 = MISS ×0.5', () => {
    expect(D.settings.scoreMultipliers).toEqual({ perfect: 2, good: 1.2, weak: 0.8, miss: 0.5 });
    const table: [number, string, number][] = [
      [1, 'perfect', 2],
      [0.99, 'good', 1.2],
      [0.5, 'good', 1.2],
      [0.49, 'weak', 0.8],
      [0.01, 'weak', 0.8],
      [0, 'miss', 0.5],
    ];
    for (const [score, band, mult] of table) {
      expect(scoreBand(score)).toBe(band);
      expect(scoreMultiplier(score, D.settings)).toBe(mult);
    }
  });

  it('式どおり：こうげき × いりょく ÷ ぼうぎょ × 係数 × できばえ（かしこさ で 必殺技の いりょく アップ）', async () => {
    const { state } = await setup();
    const sk = D.skills.get('sk-tashizan-giri')!; // power 120 / むぞくせい
    const attacker = { ...state.ally.hero, stats: { ...state.ally.hero.stats, atk: 10, wis: 5 } };
    const defender = { ...state.enemy, stats: { ...state.enemy.stats, def: 5 } };
    const d = computeDamage({
      attacker,
      defender,
      skill: sk,
      score: 1,
      combo: 0,
      canCrit: false,
      settings: D.settings,
      elements: D.elements,
      rng: createRng('x'),
    });
    const base = ((10 * 1.2 * 1.05) / 5) * D.settings.damageScale;
    expect(d.amount).toBe(Math.round(base * 2));
    expect(d.band).toBe('perfect');
  });

  it('score が高いほど威力が上がり、score 0 でも 0 にならない', async () => {
    const { state } = await setup();
    const sk = D.skills.get('sk-tashizan-giri')!;
    const dmg = (score: number) =>
      computeDamage({
        attacker: state.ally.hero,
        defender: state.enemy,
        skill: sk,
        score,
        combo: 0,
        canCrit: false,
        settings: D.settings,
        elements: D.elements,
        rng: createRng('fixed'),
      }).amount;
    expect(dmg(1)).toBeGreaterThan(dmg(0.7));
    expect(dmg(0.7)).toBeGreaterThan(dmg(0.2));
    expect(dmg(0.2)).toBeGreaterThan(dmg(0));
    expect(dmg(0)).toBeGreaterThanOrEqual(1);
  });

  it('ComboBonus は 1 コンボ +5%、最大 +50%', () => {
    expect(comboBonus(0, D.settings)).toBe(1);
    expect(comboBonus(1, D.settings)).toBeCloseTo(1.05);
    expect(comboBonus(4, D.settings)).toBeCloseTo(1.2);
    expect(comboBonus(10, D.settings)).toBeCloseTo(1.5);
    expect(comboBonus(30, D.settings)).toBeCloseTo(1.5);
  });

  it('コンボで かいしん率が 上がる（上限あり）', () => {
    const c = D.settings.combo;
    expect(critChance(0, D.settings)).toBe(c.critBase);
    expect(critChance(5, D.settings)).toBeGreaterThan(critChance(0, D.settings));
    expect(critChance(100, D.settings)).toBe(c.critMax);
  });

  it('コンボが 長いほど 同じ 必殺技の ダメージが 上がる', async () => {
    const { state } = await setup();
    const sk = D.skills.get('sk-tashizan-giri')!;
    const dmg = (combo: number) =>
      computeDamage({
        attacker: state.ally.hero,
        defender: state.enemy,
        skill: sk,
        score: 1,
        combo,
        canCrit: false,
        settings: D.settings,
        elements: D.elements,
        rng: createRng('c'),
      }).amount;
    expect(dmg(5)).toBeGreaterThan(dmg(0));
    expect(dmg(10)).toBe(dmg(20));
  });

  it('属性相性がかかる（ヒノ → モリ は 2倍）', async () => {
    const { state } = await setup();
    const run = (id: string) =>
      computeDamage({
        attacker: state.ally.hero,
        defender: state.enemy,
        skill: D.skills.get(id)!,
        score: 1,
        combo: 0,
        canCrit: false,
        settings: D.settings,
        elements: D.elements,
        rng: createRng('k'),
      });
    const f = run('sk-hono-no-mai'); // hino
    const n = run('sk-tashizan-giri'); // none
    expect(f.elementMult).toBe(2);
    expect(n.elementMult).toBe(1);
    expect(f.amount).toBeGreaterThan(n.amount);
  });

  it('じゃくてんは判明後だけ効く', async () => {
    const { state } = await setup();
    const run = (defender: Combatant) =>
      computeDamage({
        attacker: state.ally.hero,
        defender,
        skill: D.skills.get('sk-hono-no-mai')!,
        score: 1,
        combo: 0,
        canCrit: false,
        settings: D.settings,
        elements: D.elements,
        rng: createRng('z'),
      });
    const before = run(state.enemy);
    const after = run({ ...state.enemy, weaknessRevealed: true });
    expect(before.weaknessHit).toBe(false);
    expect(after.weaknessHit).toBe(true);
    expect(after.amount).toBeGreaterThan(before.amount);
  });
});

describe('ターンの すすみかた（主人公 → オトモ → てき）', () => {
  it('はじめは ターン 1 で、主人公は すぐ 動ける', async () => {
    const { state } = await setup();
    expect(state.turn).toBe(1);
    expect(isHeroReady(state)).toBe(true);
  });

  it('1 回の コマンドで 主人公 → オトモ → てき が 1 回ずつ 動き、ターンが 1 ふえる', async () => {
    const { state } = await setup({ withMonster: true });
    const r = act(tough(state), { kind: 'attack' }, D);
    const actors = r.events.filter((e) => e.t === 'act').map((e) => (e.t === 'act' ? e.actorId : ''));
    expect(actors).toEqual(['hero', 'pal', 'enemy']);
    expect(r.events[0]?.t).toBe('turnStart');
    expect(r.state.turn).toBe(2);
  });

  it('オトモが いなければ 主人公 → てき', async () => {
    const { state } = await setup();
    const r = act(tough(state), { kind: 'attack' }, D);
    const actors = r.events.filter((e) => e.t === 'act').map((e) => (e.t === 'act' ? e.actorId : ''));
    expect(actors).toEqual(['hero', 'enemy']);
  });

  it('敵は 1 ターンに 1 回だけ 動く（ボスの フェーズでも ふえない）', async () => {
    const { state } = await setup({ level: 40, enemyId: 'iwate-boss-konjiki-no-tora', enemyLevel: 5 });
    const half: BattleState = {
      ...tough(state),
      enemy: { ...toughen(state.enemy), hp: Math.floor(state.enemy.stats.hp * 0.45) },
    };
    const r = act(half, { kind: 'attack' }, D);
    expect(r.events.some((e) => e.t === 'bossPhase')).toBe(true);
    expect(r.events.filter((e) => e.t === 'act' && e.side === 'enemy')).toHaveLength(1);
  });

  it('コマンドが 成立しなければ ターンは すすまない（ゲージが たりない）', async () => {
    const { state } = await setup({ skills: ['sk-tashizan-giri', 'sk-kuku-rush'] });
    const r = act(state, { kind: 'skill', skillId: 'sk-kuku-rush', result: R(1) }, D);
    expect(r.events.map((e) => e.t)).toEqual(['gaugeShort']);
    expect(r.state.turn).toBe(1);
    expect(r.state.enemy.hp).toBe(state.enemy.hp);
    expect(isHeroReady(r.state)).toBe(true);
  });

  it('ボスから にげられない ときも ターンは すすまない', async () => {
    const { state } = await setup({ enemyId: 'aomori-boss-tsugaru-no-nushi', enemyLevel: 5 });
    const boss = { ...tough(state), isBossBattle: true };
    const r = act(boss, { kind: 'flee' }, D);
    expect(r.events.some((e) => e.t === 'fleeAttempt' && !e.success)).toBe(true);
    expect(r.state.outcome).toBe('ongoing');
    expect(r.state.turn).toBe(1);
  });

  it('何ターンか たたかうと 味方の HP が へる（バトルは すすむ）', async () => {
    const { state } = await setup({ enemyLevel: 5 });
    const next = turns(state, 6);
    expect(next.ally.hero.hp < state.ally.hero.hp || next.outcome !== 'ongoing').toBe(true);
  });
});

describe('教科ゲージ（Subject Gauge）', () => {
  it('こたえると その教科の ゲージが たまる（できばえで 量が かわり、MISS でも 少し たまる）', async () => {
    const { state } = await setup();
    const g = D.settings.subjectGauge.charge;
    const s = tough(state);
    const perfect = act(s, { kind: 'skill', skillId: 'sk-tashizan-giri', result: R(1) }, D).state;
    const miss = act(s, { kind: 'skill', skillId: 'sk-tashizan-giri', result: R(0) }, D).state;
    expect(perfect.player.subjectGauges.sansu).toBe(g.perfect);
    expect(miss.player.subjectGauges.sansu).toBe(g.miss);
    expect(g.miss).toBeGreaterThan(0);
    expect(perfect.player.subjectGauges.kokugo).toBe(0);
  });

  it('たまった ゲージを costGauge ぶん 使って 強い 必殺技を 打つ', async () => {
    const { state } = await setup({ skills: ['sk-tashizan-giri', 'sk-kuku-rush'] });
    const s: BattleState = {
      ...tough(state),
      player: { ...state.player, subjectGauges: { ...state.player.subjectGauges, sansu: 60 } },
    };
    const r = act(s, { kind: 'skill', skillId: 'sk-kuku-rush', result: R(1) }, D);
    expect(r.events.some((e) => e.t === 'gaugeUse' && e.amount === 50 && e.value === 10)).toBe(true);
    expect(r.events.some((e) => e.t === 'damage' && e.side === 'enemy')).toBe(true);
    expect(r.state.player.subjectGauges.sansu).toBe(10 + D.settings.subjectGauge.charge.perfect);
  });

  it('打てるように なった 必殺技を 知らせる（unlocked）', async () => {
    const { state } = await setup({ skills: ['sk-tashizan-giri', 'sk-kuku-rush'] });
    const s: BattleState = {
      ...tough(state),
      player: { ...state.player, subjectGauges: { ...state.player.subjectGauges, sansu: 20 } },
    };
    const r = act(s, { kind: 'skill', skillId: 'sk-tashizan-giri', result: R(1) }, D);
    const ch = r.events.find((e) => e.t === 'gaugeCharge');
    expect(ch && ch.t === 'gaugeCharge' && ch.unlocked).toEqual(['sk-kuku-rush']);
  });

  it('ゲージは 上限で 止まる', async () => {
    const { state } = await setup();
    const max = D.settings.subjectGauge.max;
    const s: BattleState = {
      ...tough(state),
      player: { ...state.player, subjectGauges: { ...state.player.subjectGauges, sansu: max - 5 } },
    };
    const r = act(s, { kind: 'skill', skillId: 'sk-tashizan-giri', result: R(1) }, D);
    expect(r.state.player.subjectGauges.sansu).toBe(max);
  });

  it('オトモの 教科は たまりやすい（パッシブ）', async () => {
    const { state } = await setup({ withMonster: true, skills: ['sk-hono-no-mai'] });
    expect(state.companion?.passiveSkill?.subject).toBe('kokugo');
    const r = act(tough(state), { kind: 'skill', skillId: 'sk-hono-no-mai', result: R(1) }, D);
    const g = D.settings.subjectGauge;
    expect(r.state.player.subjectGauges.kokugo).toBe(Math.round(g.charge.perfect * g.companionBoost));
    expect(r.events.some((e) => e.t === 'gaugeCharge' && e.boosted)).toBe(true);
  });
});

describe('コンボ＆ストリーク', () => {
  it('CRITICAL・GREAT で +1、GOOD・MISS で 0 に もどる', async () => {
    const { state } = await setup();
    let s = tough(state);
    const counts: number[] = [];
    for (const score of [1, 0.7, 0.3, 1, 0]) {
      s = act(s, { kind: 'skill', skillId: 'sk-tashizan-giri', result: R(score) }, D).state;
      counts.push(s.player.comboCount);
    }
    expect(counts).toEqual([1, 2, 0, 1, 0]);
    expect(s.player.maxCombo).toBe(2);
  });

  it('2 コンボ いじょうで combo イベント（ボーナスの 倍率つき）', async () => {
    const { state } = await setup();
    const s: BattleState = { ...tough(state), player: { ...state.player, comboCount: 3 } };
    const r = act(s, { kind: 'skill', skillId: 'sk-tashizan-giri', result: R(1) }, D);
    const e = r.events.find((x) => x.t === 'combo');
    expect(e && e.t === 'combo' && e.count).toBe(4);
    expect(e && e.t === 'combo' && e.bonus).toBeCloseTo(comboBonus(4, D.settings));
  });

  it('いちばん 長かった コンボで けいけんち・おかねが ふえる', async () => {
    const { state } = await setup({ level: 30 });
    const s: BattleState = {
      ...state,
      enemy: { ...state.enemy, hp: 1 },
      player: { ...state.player, maxCombo: 4 },
    };
    const r = act(s, { kind: 'attack' }, D);
    const v = r.events.find((e) => e.t === 'victory');
    const m = D.monsters.get('aomori-ringoron')!;
    expect(v && v.t === 'victory' && v.xp).toBe(Math.round(m.xp * comboBonus(4, D.settings)));
    expect(v && v.t === 'victory' && v.gold).toBe(Math.round(m.gold * comboBonus(4, D.settings)));
  });
});

describe('オトモ（Companion）', () => {
  it('出撃中の 仲間が オトモに なる（自動わざは ゲージを 使わない いちばん 強い こうげきわざ、パッシブは その教科）', async () => {
    const c = await content();
    const taisho = makeMonster(c.monsters.get('aomori-nebuta-taisho')!, 10, 'p');
    const comp = makeCompanion(taisho, D)!;
    expect(comp.activeSkill).toBe('sk-hono-no-mai');
    expect(comp.passiveSkill?.subject).toBe('kokugo');
  });

  it('オトモは 主人公の あとに 1 回 自動で こうげきする（問題なし）', async () => {
    const { state } = await setup({ withMonster: true });
    const r = act(tough(state), { kind: 'attack' }, D);
    expect(r.events.some((e) => e.t === 'act' && e.side === 'ally' && e.auto && e.actorId === 'pal')).toBe(
      true,
    );
    expect(r.state.enemy.hp).toBeLessThan(9999);
  });

  it('敵は 前に 立つ オトモを ねらい、たおれたら 次の 仲間が 自動で 前に 出る', async () => {
    const c = await content();
    const { state } = await setup({
      withMonster: true,
      enemyId: 'aomori-boss-tsugaru-no-nushi',
      enemyLevel: 20,
    });
    const second = makeMonster(c.monsters.get('aomori-ringoron')!, 3, 'pal2');
    const s: BattleState = {
      ...state,
      ally: {
        ...state.ally,
        hero: toughen(state.ally.hero),
        monsters: [{ ...state.ally.monsters[0]!, hp: 1 }, second],
      },
      enemy: toughen(state.enemy),
    };
    const r = turns(s, 3);
    expect(r.ally.monsters[0]!.hp).toBe(0);
    expect(r.companion?.id).toBe('pal2');
    expect(r.ally.hero.hp).toBe(9999);
  });
});

describe('教科の 固有スキル・オトモの 必殺技', () => {
  const keys = (s: BattleState) => battleSkills(s, D).map((b) => `${b.actorId}:${b.skill.id}`);

  it('使える 必殺技：主人公の わざ → オトモの わざ → 教科の 固有スキル（わざの ある 教科だけ）', async () => {
    const { state } = await setup({ withMonster: true, skills: ['sk-tashizan-giri'] });
    expect(keys(state)).toEqual([
      'hero:sk-tashizan-giri',
      'pal:sk-hono-no-mai',
      `hero:${D.settings.subjectGauge.uniqueSkills.kokugo}`,
      `hero:${D.settings.subjectGauge.uniqueSkills.sansu}`,
    ]);
  });

  it('固有スキルは ゲージ まんたんで 打てて、ゲージを ぜんぶ 使う（こたえた ぶんは また たまる）', async () => {
    const { state } = await setup({ skills: ['sk-tashizan-giri'] });
    const burst = D.settings.subjectGauge.uniqueSkills.sansu!;
    const max = D.settings.subjectGauge.max;
    const short = act(tough(state), { kind: 'skill', skillId: burst, result: R(1) }, D);
    expect(short.events.some((e) => e.t === 'gaugeShort')).toBe(true);
    const full: BattleState = {
      ...tough(state),
      player: { ...state.player, subjectGauges: { ...state.player.subjectGauges, sansu: max } },
    };
    const r = act(full, { kind: 'skill', skillId: burst, result: R(1) }, D);
    expect(r.events.some((e) => e.t === 'gaugeUse' && e.amount === max && e.value === 0)).toBe(true);
    expect(r.events.some((e) => e.t === 'damage' && e.side === 'enemy')).toBe(true);
    expect(r.state.player.subjectGauges.sansu).toBe(D.settings.subjectGauge.charge.perfect);
  });

  it('オトモの 必殺技は こたえると オトモが 使う（actorId）', async () => {
    const { state } = await setup({ withMonster: true, skills: ['sk-tashizan-giri'] });
    const r = act(
      tough(state),
      { kind: 'skill', skillId: 'sk-hono-no-mai', result: R(1), actorId: 'pal' },
      D,
    );
    expect(r.events.some((e) => e.t === 'act' && e.actorId === 'pal' && e.skillId === 'sk-hono-no-mai')).toBe(
      true,
    );
    expect(r.events.some((e) => e.t === 'damage' && e.side === 'enemy')).toBe(true);
    expect(r.state.player.comboCount).toBe(1);
  });

  it('使えない わざ（知らない わざ・たおれた オトモの わざ）は エラー', async () => {
    const { state } = await setup({ withMonster: true });
    expect(() => act(state, { kind: 'skill', skillId: 'sk-fubuki', result: R(1) }, D)).toThrow();
    const down: BattleState = {
      ...state,
      ally: { ...state.ally, monsters: [{ ...state.ally.monsters[0]!, hp: 0 }] },
      companion: null,
    };
    expect(() =>
      act(down, { kind: 'skill', skillId: 'sk-hono-no-mai', result: R(1), actorId: 'pal' }, D),
    ).toThrow();
  });
});

describe('必殺技の 効果', () => {
  it('かいふく：できばえで 量が かわる', async () => {
    const def = withSkills([testSkill({ id: 'sk-test-heal', effect: 'heal', power: 0 })]);
    const { state } = await setup({ skills: ['sk-test-heal'], def });
    const hurt: BattleState = {
      ...tough(state),
      ally: { ...tough(state).ally, hero: { ...tough(state).ally.hero, hp: 1 } },
    };
    const heal = (score: number) => {
      const e = act(hurt, { kind: 'skill', skillId: 'sk-test-heal', result: R(score) }, def).events.find(
        (x) => x.t === 'heal' && x.side === 'ally',
      );
      return e && e.t === 'heal' ? e.amount : 0;
    };
    expect(heal(1)).toBeGreaterThan(heal(0.6));
    expect(heal(0)).toBeGreaterThan(0);
  });

  it('まもり（party）：主人公と オトモの ぼうぎょが 上がり、settings.turns.buffTurns ターンで きれる', async () => {
    const { state } = await setup({ withMonster: true });
    const r = act(tough(state), { kind: 'skill', skillId: 'sk-kanji-barrier', result: R(1) }, D);
    const targets = r.events
      .filter((e) => e.t === 'buff' && e.side === 'ally')
      .map((e) => (e.t === 'buff' ? e.targetId : ''));
    expect(targets).toEqual(['hero', 'pal']);
    expect(r.state.ally.hero.buffs.def?.mult).toBeGreaterThan(1);
    // かけた ターンの おわりで 1 へるので、のこりは buffTurns
    expect(r.state.ally.hero.buffs.def?.turns).toBe(D.settings.turns.buffTurns);
    const later = turns(r.state, D.settings.turns.buffTurns);
    expect(later.ally.hero.buffs.def).toBeUndefined();
  });

  it('status：敵は つぎの ターンを 休む（できばえで ターン数が かわる）', async () => {
    const def = withSkills([testSkill({ id: 'sk-test-stop', effect: 'status', power: 0 })]);
    const { state } = await setup({ skills: ['sk-test-stop'], def });
    const r = act(tough(state), { kind: 'skill', skillId: 'sk-test-stop', result: R(1) }, def);
    const e = r.events.find((x) => x.t === 'status');
    expect(e && e.t === 'status' && e.turns).toBe(2); // できばえ ×2.0
    // その ターンの 敵は 動けない
    expect(r.events.some((x) => x.t === 'skipTurn' && x.targetId === 'enemy')).toBe(true);
    expect(r.events.some((x) => x.t === 'act' && x.side === 'enemy')).toBe(false);
    expect(r.state.enemy.skipTurns).toBe(1);
    // つぎの ターンも 休み、その つぎから 動く
    const next = act(r.state, { kind: 'attack' }, def);
    expect(next.events.some((x) => x.t === 'skipTurn')).toBe(true);
    const after = act(next.state, { kind: 'attack' }, def);
    expect(after.events.some((x) => x.t === 'act' && x.side === 'enemy')).toBe(true);
  });

  it('しらべる（理科）でじゃくてんが判明する / まちがえると わからない', async () => {
    const { state } = await setup();
    const ok = act(tough(state), { kind: 'skill', skillId: 'sk-shiraberu', result: R(1) }, D);
    expect(ok.events.some((e) => e.t === 'weaknessRevealed')).toBe(true);
    expect(ok.state.enemy.weaknessRevealed).toBe(true);
    const ng = act(tough(state), { kind: 'skill', skillId: 'sk-shiraberu', result: R(0) }, D);
    expect(ng.events.some((e) => e.t === 'scanFailed')).toBe(true);
    expect(ng.state.enemy.weaknessRevealed).toBe(false);
  });
});

describe('コマンド', () => {
  it('たたかう は問題なしで必ず成立する', async () => {
    const { state } = await setup();
    const { state: next, events } = act(state, { kind: 'attack' }, D);
    expect(events.some((e) => e.t === 'damage' && e.side === 'enemy')).toBe(true);
    expect(next.enemy.hp).toBeLessThan(state.enemy.hp);
  });

  it('MISS でも 必殺技は 成立する（行動は かならず 出る）', async () => {
    const { state } = await setup();
    const r = act(tough(state), { kind: 'skill', skillId: 'sk-tashizan-giri', result: R(0) }, D);
    const d = r.events.find((e) => e.t === 'damage');
    expect(d && d.t === 'damage' && d.scoreBand).toBe('miss');
    expect(d && d.t === 'damage' && d.amount).toBeGreaterThanOrEqual(1);
  });

  it('どうぐは HP の 割合が いちばん 低い 味方に 使う', async () => {
    const { state } = await setup({ withMonster: true });
    const s: BattleState = {
      ...tough(state),
      ally: { ...tough(state).ally, monsters: [{ ...tough(state).ally.monsters[0]!, hp: 1 }] },
    };
    const r = act(s, { kind: 'item', itemId: 'aomori-ringo' }, D);
    expect(r.events.some((e) => e.t === 'itemUsed' && e.targetId === 'pal')).toBe(true);
    expect(r.state.ally.items['aomori-ringo']).toBe(1);
  });

  it('いれかえ で オトモが かわる', async () => {
    const c = await content();
    const { state } = await setup({ withMonster: true });
    const s: BattleState = {
      ...tough(state),
      ally: {
        ...tough(state).ally,
        monsters: [...tough(state).ally.monsters, makeMonster(c.monsters.get('aomori-ringoron')!, 3, 'pal2')],
      },
    };
    const r = act(s, { kind: 'swap', monsterIndex: 1 }, D);
    expect(r.state.companion?.id).toBe('pal2');
    expect(r.events.some((e) => e.t === 'swap' && e.to === 'pal2')).toBe(true);
  });

  it('勝利で経験値・ゴールド・ドロップが返る', async () => {
    const { state } = await setup({ level: 30 });
    const weak = { ...state, enemy: { ...state.enemy, hp: 1 } };
    const { state: next, events } = act(weak, { kind: 'attack' }, D);
    const v = events.find((e) => e.t === 'victory');
    expect(next.outcome).toBe('victory');
    expect(v && v.t === 'victory' && v.xp).toBeGreaterThan(0);
  });
});

describe('仲間化（GDD §4.6）', () => {
  it('HP が高いうちは 0%', () => {
    expect(recruitChance({ isBoss: false } as never, 0.5, 0.9, 1, D.settings)).toBe(0);
  });
  it('ボスは仲間にならない', () => {
    expect(recruitChance({ isBoss: true } as never, 0.5, 0.05, 1, D.settings)).toBe(0);
  });
  it('score 1.0 は成功率が上がる', () => {
    const low = recruitChance({ isBoss: false } as never, 0.2, 0.1, 0, D.settings);
    const high = recruitChance({ isBoss: false } as never, 0.2, 0.1, 1, D.settings);
    expect(high).toBeGreaterThan(low);
  });
  it('統計的に妥当な回数で成功する', async () => {
    let success = 0;
    for (let i = 0; i < 400; i++) {
      const { state } = await setup({ seed: `r${i}` });
      const weak = {
        ...state,
        enemy: { ...state.enemy, hp: Math.max(1, Math.floor(state.enemy.stats.hp * 0.1)) },
      };
      if (act(weak, { kind: 'recruit', result: R(1) }, D).state.outcome === 'recruited') success++;
    }
    expect(success).toBeGreaterThan(0);
    expect(success).toBeLessThan(400);
  });
});

describe('決定論性（対戦・リプレイの土台）', () => {
  const commands: Command[] = [
    { kind: 'attack' },
    { kind: 'skill', skillId: 'sk-tashizan-giri', result: R(1) },
    { kind: 'attack' },
    { kind: 'skill', skillId: 'sk-tashizan-giri', result: R(0) },
    { kind: 'attack' },
  ];

  it('同じシード・同じ コマンド列なら同じ結果', async () => {
    const a = await setup({ seed: 'arena-1', withMonster: true, enemyLevel: 8 });
    const b = await setup({ seed: 'arena-1', withMonster: true, enemyLevel: 8 });
    const ra = replay(a.state, commands, D);
    const rb = replay(b.state, commands, D);
    expect(ra.log.length).toBeGreaterThan(5);
    expect(JSON.stringify(ra.log)).toBe(JSON.stringify(rb.log));
    expect(ra.enemy.hp).toBe(rb.enemy.hp);
    expect(ra.turn).toBe(rb.turn);
  });

  it('違うシードなら結果が変わる', async () => {
    const a = await setup({ seed: 'arena-1', withMonster: true, enemyLevel: 8 });
    const b = await setup({ seed: 'arena-2', withMonster: true, enemyLevel: 8 });
    const ra = replay(a.state, commands, D);
    const rb = replay(b.state, commands, D);
    expect(JSON.stringify(ra.log)).not.toBe(JSON.stringify(rb.log));
  });
});

describe('装備とセットボーナス', () => {
  it('装備でステータスが上がる', async () => {
    const c = await content();
    const spec = {
      name: 'ハル',
      level: 5,
      baseStats: { hp: 40, mp: 10, atk: 8, def: 6, spd: 7, wis: 5 },
      growth: { hp: 6, mp: 2, atk: 1.5, def: 1.2, spd: 1, wis: 1 },
      skills: [],
      equipment: {},
    };
    const bare = makeHero(spec, c.items, c.sets);
    const armed = makeHero({ ...spec, equipment: { chest: 'aomori-ringo-no-yoroi' } }, c.items, c.sets);
    expect(armed.stats.def).toBeGreaterThan(bare.stats.def);
  });

  it('5点そろうとセットボーナス（属性倍率）がつく', async () => {
    const c = await content();
    const set = c.sets.get('set-aomori')!;
    const equipment = {
      weapon: set.pieces[0]!,
      head: set.pieces[1]!,
      chest: set.pieces[2]!,
      legs: set.pieces[3]!,
      feet: set.pieces[4]!,
    };
    const hero = makeHero(
      {
        name: 'ハル',
        level: 5,
        baseStats: { hp: 40, mp: 10, atk: 8, def: 6, spd: 7, wis: 5 },
        growth: { hp: 6, mp: 2, atk: 1.5, def: 1.2, spd: 1, wis: 1 },
        skills: [],
        equipment,
      },
      c.items,
      c.sets,
    );
    expect(hero.elementBoost?.mizu).toBeGreaterThan(1);
  });
});

describe('敗北', () => {
  it('主人公と仲間が全滅したら defeat', async () => {
    const { state } = await setup({ level: 1, enemyId: 'aomori-boss-tsugaru-no-nushi', enemyLevel: 20 });
    const s: BattleState = { ...state, ally: { ...state.ally, hero: { ...state.ally.hero, hp: 1 } } };
    const r = turns(s, 10);
    expect(r.outcome).toBe('defeat');
    expect(r.log.filter((e) => e.t === 'ko' && e.targetId === 'hero')).toHaveLength(1);
  });

  it('たおれた 主人公は コマンドを 出せないが、wait なら オトモが たたかう', async () => {
    const { state } = await setup({ withMonster: true, enemyLevel: 10 });
    const down: BattleState = {
      ...state,
      ally: { ...state.ally, hero: { ...state.ally.hero, hp: 0 } },
      enemy: toughen(state.enemy),
    };
    expect(isHeroReady(down)).toBe(false);
    expect(act(down, { kind: 'attack' }, D).events).toEqual([]);
    const r = act(down, { kind: 'wait' }, D);
    expect(r.events.some((e) => e.t === 'act' && e.actorId === 'pal' && e.auto)).toBe(true);
    expect(r.state.turn).toBe(2);
  });
});
