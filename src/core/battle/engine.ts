/**
 * バトルエンジン本体（ターン制。GDD §4）。純粋関数だけ。Phaser も DOM も知らない。
 *  - act(state, command) … 1 ターンを 解決する。主人公 → オトモ（前に 立つ 仲間）→ てき の じゅんで 1 回ずつ 動く。
 *                          問題の 成績（ActionResult.score）で いりょくが かわり、まちがえても 行動は かならず 成立する。
 *                          コマンドが 成立しなかった とき（教科ゲージが たりない など）は ターンが すすまず、えらび直せる
 * { state, events } を返し、Scene は events を じゅんばんに 再生するだけ。
 * 同じ seed・同じ コマンド列なら 必ず 同じ 結果に なる（replay。対戦の リプレイ・非同期対戦の 土台）。
 */
import type { Item, Skill } from '../content/schemas';
import { createRng, type Rng } from '../rng';
import {
  finishAction,
  frontAlly,
  makeCompanion,
  resolveCompanionAction,
  resolveEnemyTurn,
  resolveHit,
} from './actionResolver';
import { comboBonus, fleeChance, recruitChance, scoreBand, scoreMultiplier } from './damage';
import type { BattleDeps } from './dependencies';
import { commandPriority, initiativeOrder } from './initiative';
import { useMusubiDama } from './musubiDama';
import { clampBattleValue, cloneBattleValue, emptyGauges } from './utils';
import type {
  BattleActionId,
  BattleActionRef,
  BattleEvent,
  BattleState,
  Combatant,
  Command,
  EnemyUnit,
  Party,
  Side,
  TargetType,
} from './types';

export interface StepOutput {
  state: BattleState;
  events: BattleEvent[];
}

type ActionContext = BattleActionRef;

function battleActionId(turn: number, ordinal: number): BattleActionId {
  return `turn:${turn}:action:${ordinal}`;
}
/** バトルで 使える 必殺技と、それを 使う 味方 */
export interface BattleSkill {
  skill: Skill;
  /** 使う 味方（主人公 か 前に 立つ オトモ）の Combatant.id */
  actorId: string;
  /** 教科の 固有スキル（settings.subjectGauge.uniqueSkills） */
  unique: boolean;
}

export const SUBJECTS = ['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo'] as const;
/** かいふく わざ：最大 HP × この割合 × いりょく倍率 */
const HEAL_RATIO = 0.25;
/** ぼうぎょ アップ・ダウン：1 ± この割合 × いりょく倍率 */
const GUARD_RATIO = 0.25;
export { emptyGauges } from './utils';
export { frontAlly, makeCompanion };

/** 必殺技の 対象。targetType を 省略したら effect から（かいふく・まもりは 自分、ほかは 敵） */
export function skillTarget(sk: Pick<Skill, 'targetType' | 'effect'>): TargetType {
  return sk.targetType ?? (sk.effect === 'heal' || sk.effect === 'buff' ? 'self' : 'singleEnemy');
}

/** その 必殺技を いま 打てるか（教科ゲージが costGauge 以上） */
export function canAfford(s: BattleState, sk: Pick<Skill, 'subject' | 'costGauge'>): boolean {
  return s.player.subjectGauges[sk.subject] >= sk.costGauge;
}

/** 主人公が いま コマンドを 出せるか（ターン制：たたかいが つづいて いて たおれて いなければ いつでも） */
export function isHeroReady(s: BattleState): boolean {
  return s.outcome === 'ongoing' && s.ally.hero.hp > 0;
}

/**
 * いま 使える 必殺技の 一覧：主人公の わざ → 前に 立つ オトモの わざ → 教科の 固有スキル
 * （固有スキルは 主人公か オトモの わざに ある 教科の ぶんだけ。その 教科の ゲージを ためて 使う）
 */
export function battleSkills(s: BattleState, def: Pick<BattleDeps, 'skills' | 'settings'>): BattleSkill[] {
  const out: BattleSkill[] = [];
  const seen = new Set<string>();
  const push = (id: string, actorId: string, unique: boolean) => {
    const sk = def.skills.get(id);
    if (!sk || seen.has(`${actorId}:${id}`)) return;
    seen.add(`${actorId}:${id}`);
    out.push({ skill: sk, actorId, unique });
  };
  const hero = s.ally.hero;
  for (const id of hero.skills) push(id, hero.id, false);
  const comp = s.companion ? s.ally.monsters.find((m) => m.id === s.companion?.id && m.hp > 0) : undefined;
  if (comp) for (const id of comp.skills) push(id, comp.id, false);
  const subjects = new Set(out.map((b) => b.skill.subject));
  for (const sub of SUBJECTS) {
    const id = def.settings.subjectGauge.uniqueSkills[sub];
    if (id && subjects.has(sub)) push(id, hero.id, true);
  }
  return out;
}

/** バトルを つくる。ターン 1 から はじまる */
export function createBattle(
  opts: {
    ally: Party;
    enemy: Combatant;
    seed: string;
    isBossBattle?: boolean;
    canFleeBoss?: boolean;
  },
  def: BattleDeps,
): BattleState {
  const ally = cloneBattleValue(opts.ally);
  const alive = ally.monsters.findIndex((m) => m.hp > 0);
  if ((ally.monsters[ally.activeMonsterIndex]?.hp ?? 0) <= 0 && alive >= 0) ally.activeMonsterIndex = alive;

  const enemy: EnemyUnit = { ...cloneBattleValue(opts.enemy), skipTurns: 0 };

  return {
    turn: 1,
    ally,
    enemy,
    player: { subjectGauges: emptyGauges(), comboCount: 0, maxCombo: 0 },
    companion: makeCompanion(ally.monsters[ally.activeMonsterIndex], def),
    rngState: undefined,
    seed: opts.seed,
    outcome: 'ongoing',
    isBossBattle: opts.isBossBattle ?? enemy.isBoss,
    canFleeBoss: opts.canFleeBoss ?? false,
    log: [],
  };
}

function rngFor(s: BattleState): Rng {
  return createRng(s.seed, s.rngState);
}

function done(s: BattleState, rng: Rng | null, ev: BattleEvent[]): StepOutput {
  if (rng) s.rngState = rng.state();
  s.log.push(...ev);
  return { state: s, events: ev };
}

/** ターンの おわり：ぼうぎょ アップ・ダウンの のこりを 1 ターン へらす */
function decayBuffs(c: Combatant): void {
  for (const key of ['atk', 'def'] as const) {
    const b = c.buffs[key];
    if (b) {
      b.turns -= 1;
      if (b.turns <= 0) delete c.buffs[key];
    }
  }
}

/** かいふく・まもりの 対象（self は 使った 味方、party は 主人公と 前に 立つ オトモ） */
function allyTargets(s: BattleState, sk: Skill, actor: Combatant): Combatant[] {
  if (skillTarget(sk) !== 'party') return [actor];
  const front = frontAlly(s);
  return front !== s.ally.hero ? [s.ally.hero, front] : [s.ally.hero];
}

/** HP の 割合が いちばん 低い 味方（どうぐは この 味方に 使う） */
function weakestAlly(s: BattleState): Combatant {
  const front = frontAlly(s);
  const r = (c: Combatant) => c.hp / Math.max(1, c.stats.hp);
  return front !== s.ally.hero && r(front) < r(s.ally.hero) ? front : s.ally.hero;
}

/** 戦闘の自動対象に、回復どうぐの効果が実際にあるか。 */
export function canUseBattleItem(s: BattleState, item: Item): boolean {
  if (item.kind !== 'consumable' || !item.use) return false;
  if (item.use.recruit) return true;
  const target = weakestAlly(s);
  return (!!item.use.heal && target.hp < target.stats.hp) || (!!item.use.mp && target.mp < target.stats.mp);
}

/** こたえた 教科の ゲージを ためる（オトモの 教科なら たまりやすい） */
function chargeGauge(
  s: BattleState,
  sk: Skill,
  score: number,
  def: BattleDeps,
  ev: BattleEvent[],
  action: ActionContext,
): void {
  const g = def.settings.subjectGauge;
  const p = s.player;
  const passive = s.companion?.passiveSkill;
  const boost = passive?.subject === sk.subject ? passive.mult : 1;
  const before = p.subjectGauges[sk.subject];
  const after = Math.min(g.max, before + Math.round(g.charge[scoreBand(score)] * boost));
  if (after === before) return;
  p.subjectGauges[sk.subject] = after;
  const unlocked = battleSkills(s, def)
    .map((b) => b.skill)
    .filter((x) => x.subject === sk.subject && x.costGauge > before && x.costGauge <= after)
    .map((x) => x.id);
  ev.push({
    t: 'gaugeCharge',
    ...action,
    subject: sk.subject,
    amount: after - before,
    value: after,
    max: g.max,
    boosted: boost > 1,
    unlocked: [...new Set(unlocked)],
  });
}

/** 必殺技（問題の 成績つき）。教科ゲージが たりなければ 打たずに false（ターンは すすまない） */
function useSkill(
  s: BattleState,
  command: Extract<Command, { kind: 'skill' }>,
  def: BattleDeps,
  rng: Rng,
  ev: BattleEvent[],
  action: ActionContext,
): boolean {
  const hero = s.ally.hero;
  const actorId = command.actorId ?? hero.id;
  const entry = battleSkills(s, def).find((b) => b.skill.id === command.skillId && b.actorId === actorId);
  if (!entry) throw new Error(`skill "${command.skillId}" は "${actorId}" が いま つかえません`);
  const sk = entry.skill;
  const actor = actorId === hero.id ? hero : s.ally.monsters.find((m) => m.id === actorId)!;
  const p = s.player;
  const st = def.settings;

  const have = p.subjectGauges[sk.subject];
  if (have < sk.costGauge) {
    ev.push({ t: 'gaugeShort', subject: sk.subject, need: sk.costGauge, have });
    return false;
  }
  if (sk.costGauge > 0) {
    p.subjectGauges[sk.subject] = have - sk.costGauge;
    ev.push({
      t: 'gaugeUse',
      ...action,
      subject: sk.subject,
      amount: sk.costGauge,
      value: p.subjectGauges[sk.subject],
    });
  }

  const score = clampBattleValue(Number.isFinite(command.result.score) ? command.result.score : 0, 0, 1);
  const band = scoreBand(score);
  const mult = scoreMultiplier(score, st);
  // コンボ（Streak）：GREAT 以上なら +1、GOOD・MISS なら 0 に もどる
  if (band === 'perfect' || band === 'good') {
    p.comboCount += 1;
    p.maxCombo = Math.max(p.maxCombo, p.comboCount);
    if (p.comboCount >= 2)
      ev.push({ t: 'combo', ...action, count: p.comboCount, bonus: comboBonus(p.comboCount, st) });
  } else p.comboCount = 0;

  const targets = sk.effect === 'heal' || sk.effect === 'buff' ? allyTargets(s, sk, actor) : [s.enemy];
  ev.push({
    t: 'act',
    ...action,
    side: 'ally',
    actorId: actor.id,
    targetIds: targets.map((target) => target.id),
    command: sk.effect === 'scan' ? 'scan' : 'skill',
    skillId: sk.id,
  });
  switch (sk.effect) {
    case 'damage':
      resolveHit(s, def, rng, ev, action, {
        attacker: actor,
        defender: s.enemy,
        side: 'enemy',
        skill: sk,
        score,
      });
      break;
    case 'heal':
      for (const c of targets) {
        const before = c.hp;
        c.hp = Math.min(c.stats.hp, c.hp + Math.max(1, Math.round(c.stats.hp * HEAL_RATIO * mult)));
        ev.push({ t: 'heal', ...action, side: 'ally', targetId: c.id, amount: c.hp - before });
      }
      break;
    case 'buff': {
      const m = 1 + GUARD_RATIO * mult;
      const turns = st.turns.buffTurns;
      for (const c of targets) {
        // ターンの おわりに 1 へるので、この ターンぶんを 足して おく
        c.buffs.def = { mult: m, turns: turns + 1 };
        ev.push({ t: 'buff', ...action, side: 'ally', targetId: c.id, stat: 'def', mult: m, turns });
      }
      break;
    }
    case 'debuff': {
      const m = 1 / (1 + GUARD_RATIO * mult);
      const turns = st.turns.buffTurns;
      s.enemy.buffs.def = { mult: m, turns: turns + 1 };
      ev.push({
        t: 'buff',
        ...action,
        side: 'enemy',
        targetId: s.enemy.id,
        stat: 'def',
        mult: m,
        turns,
      });
      break;
    }
    case 'scan':
      // 理科の「しらべる」＝じゃくてん判明（GDD §4.4）
      if (score >= 0.5 && s.enemy.weakness) {
        s.enemy.weaknessRevealed = true;
        ev.push({ t: 'weaknessRevealed', ...action, targetId: s.enemy.id, element: s.enemy.weakness });
      } else ev.push({ t: 'scanFailed', ...action, targetId: s.enemy.id });
      break;
    case 'status': {
      // あいての うごきを とめる（できばえが よいほど 長く 休む）
      const turns = Math.max(1, Math.round(st.turns.statusTurns * mult));
      s.enemy.skipTurns += turns;
      ev.push({ t: 'status', ...action, targetId: s.enemy.id, turns });
      break;
    }
  }
  chargeGauge(s, sk, score, def, ev, action);
  return true;
}

/** 主人公の コマンド。ターンを つかったら true（つかわなければ もう一度 えらべる） */
function heroCommand(
  s: BattleState,
  command: Command,
  def: BattleDeps,
  rng: Rng,
  ev: BattleEvent[],
  action: ActionContext,
): boolean {
  const hero = s.ally.hero;
  switch (command.kind) {
    case 'wait':
      // 主人公は 動かない（たおれて いる ときなど）。オトモと てきは 動く
      return true;
    case 'attack':
      // たたかう は 問題なしで いつでも 撃てる（ゲームが止まらない保証）。かわりに いりょくは 等倍
      ev.push({
        t: 'act',
        ...action,
        side: 'ally',
        actorId: hero.id,
        targetIds: [s.enemy.id],
        command: 'attack',
      });
      resolveHit(s, def, rng, ev, action, {
        attacker: hero,
        defender: s.enemy,
        side: 'enemy',
        skill: null,
        score: null,
      });
      return true;
    case 'skill':
      return useSkill(s, command, def, rng, ev, action);
    case 'item': {
      const it = def.items.get(command.itemId);
      const n = s.ally.items[command.itemId] ?? 0;
      if (!it || n <= 0) return false;
      if (it.use?.recruit)
        return useMusubiDama(s, it, def.monsters.get(s.enemy.refId), command, rng, ev, action);
      if (!canUseBattleItem(s, it)) return false;
      s.ally.items[command.itemId] = n - 1;
      const target = weakestAlly(s);
      ev.push({ t: 'itemUsed', ...action, itemId: it.id, targetId: target.id });
      if (it.use?.heal) {
        const before = target.hp;
        target.hp = Math.min(target.stats.hp, target.hp + it.use.heal);
        ev.push({ t: 'heal', ...action, side: 'ally', targetId: target.id, amount: target.hp - before });
      }
      if (it.use?.mp) target.mp = Math.min(target.stats.mp, target.mp + it.use.mp);
      return true;
    }
    case 'swap': {
      const to = s.ally.monsters[command.monsterIndex];
      if (!to || to.hp <= 0 || command.monsterIndex === s.ally.activeMonsterIndex) return false;
      const from = s.ally.monsters[s.ally.activeMonsterIndex];
      s.ally.activeMonsterIndex = command.monsterIndex;
      s.companion = makeCompanion(to, def);
      ev.push({ t: 'swap', ...action, from: from?.id ?? '', to: to.id });
      return true;
    }
    case 'recruit': {
      const m = def.monsters.get(s.enemy.refId);
      const gift = m?.recruitItem;
      const usedGift = Boolean(gift && command.itemId === gift && (s.ally.items[gift] ?? 0) > 0);
      if (usedGift && gift) {
        s.ally.items[gift]!--;
        ev.push({ t: 'recruitGift', ...action, targetId: s.enemy.id, itemId: gift });
      }
      const chance = recruitChance(
        s.enemy,
        m?.recruitRate ?? 0,
        s.enemy.hp / s.enemy.stats.hp,
        command.result.score,
        def.settings,
      );
      const success = usedGift || (chance > 0 && rng.chance(chance));
      ev.push({
        t: 'recruitAttempt',
        ...action,
        targetId: s.enemy.id,
        success,
        chance: usedGift ? 1 : chance,
      });
      if (success) {
        s.outcome = 'recruited';
        ev.push({ t: 'recruited', ...action, monsterId: s.enemy.refId });
      }
      return true;
    }
    case 'flee': {
      if (s.isBossBattle && !s.canFleeBoss) {
        // ボスからは にげられない（ターンも つかわない）
        ev.push({ t: 'fleeAttempt', success: false, chance: 0 });
        return false;
      }
      const chance = fleeChance(hero, s.enemy);
      const success = rng.chance(chance);
      ev.push({ t: 'fleeAttempt', ...action, success, chance });
      if (success) {
        s.outcome = 'fled';
        ev.push({ t: 'fled', ...action });
      }
      return true;
    }
  }
}

function invalidCommandEvents(s: BattleState, command: Command, def: BattleDeps): BattleEvent[] | null {
  if (command.kind === 'skill') {
    const entry = battleSkills(s, def).find(
      (candidate) =>
        candidate.skill.id === command.skillId && candidate.actorId === (command.actorId ?? s.ally.hero.id),
    );
    if (!entry) throw new Error(`skill "${command.skillId}" は いま つかえません`);
    const have = s.player.subjectGauges[entry.skill.subject];
    if (have < entry.skill.costGauge)
      return [{ t: 'gaugeShort', subject: entry.skill.subject, need: entry.skill.costGauge, have }];
  }
  if (command.kind === 'item') {
    const item = def.items.get(command.itemId);
    if (!item || (s.ally.items[command.itemId] ?? 0) <= 0 || !canUseBattleItem(s, item)) return [];
  }
  if (command.kind === 'swap') {
    const target = s.ally.monsters[command.monsterIndex];
    if (!target || target.hp <= 0 || command.monsterIndex === s.ally.activeMonsterIndex) return [];
  }
  if (command.kind === 'flee' && s.isBossBattle && !s.canFleeBoss)
    return [{ t: 'fleeAttempt', success: false, chance: 0 }];
  return null;
}

/** 1ターンを優先度→素早さ→シード付き同速抽選の順で解決する。 */
export function act(prev: BattleState, command: Command, def: BattleDeps): StepOutput {
  const s = cloneBattleValue(prev);
  const ev: BattleEvent[] = [];
  // たおれた 主人公は コマンドを 出せない（wait なら ターンだけ すすむ）
  if (s.outcome !== 'ongoing' || (s.ally.hero.hp <= 0 && command.kind !== 'wait')) return done(s, null, ev);
  const rng = rngFor(s);

  const invalid = invalidCommandEvents(s, command, def);
  if (invalid) return done(s, rng, invalid);

  ev.push({ t: 'turnStart', turn: s.turn });
  const companion = s.ally.monsters[s.ally.activeMonsterIndex];
  const order = initiativeOrder(
    [
      { actor: 'hero', speed: s.ally.hero.stats.spd, priority: commandPriority(command) },
      ...(companion && companion.hp > 0
        ? ([{ actor: 'companion', speed: companion.stats.spd, priority: 0 }] as const)
        : []),
      { actor: 'enemy', speed: s.enemy.stats.spd, priority: 0 },
    ],
    rng,
  );
  let actionOrdinal = 0;
  for (const actor of order) {
    if (s.outcome !== 'ongoing') break;
    const action: ActionContext = { actionId: battleActionId(s.turn, actionOrdinal++) };
    if (actor === 'hero') heroCommand(s, command, def, rng, ev, action);
    else if (actor === 'companion') resolveCompanionAction(s, def, rng, ev, action);
    else resolveEnemyTurn(s, def, rng, ev, action);
    finishAction(s, def, rng, ev, action);
  }
  if (s.outcome === 'ongoing') {
    for (const c of [s.ally.hero, ...s.ally.monsters, s.enemy]) decayBuffs(c);
    s.turn += 1;
  }
  return done(s, rng, ev);
}

/** 対戦（1対1）用。両パーティとシードから決定論的なバトルを作る */
export function createArenaBattle(a: Party, b: Party, seed: string, def: BattleDeps): BattleState {
  const enemy = b.monsters[b.activeMonsterIndex] ?? b.hero;
  return createBattle({ ally: a, enemy, seed, isBossBattle: false }, def);
}

/** リプレイ：シードと コマンド列から 最終状態を 再現する */
export function replay(initial: BattleState, commands: readonly Command[], def: BattleDeps): BattleState {
  let s = initial;
  for (const command of commands) {
    if (s.outcome !== 'ongoing') break;
    s = act(s, command, def).state;
  }
  return s;
}

export type { BattleDeps } from './dependencies';
export type { BattleEvent, BattleState, Combatant, Command, Party, Side };
