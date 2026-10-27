/**
 * バトルエンジン本体（ターン制。GDD §4）。純粋関数だけ。Phaser も DOM も知らない。
 *  - act(state, command) … 1 ターンを 解決する。主人公 → オトモ（前に 立つ 仲間）→ てき の じゅんで 1 回ずつ 動く。
 *                          問題の 成績（ActionResult.score）で いりょくが かわり、まちがえても 行動は かならず 成立する。
 *                          コマンドが 成立しなかった とき（教科ゲージが たりない など）は ターンが すすまず、えらび直せる
 * { state, events } を返し、Scene は events を じゅんばんに 再生するだけ。
 * 同じ seed・同じ コマンド列なら 必ず 同じ 結果に なる（replay。対戦の リプレイ・非同期対戦の 土台）。
 */
import type { Skill } from '../content/schemas';
import { createRng, type Rng } from '../rng';
import {
  battleCommandRef,
  battleSkills,
  evaluateBattleCommand,
  type BattleCommandEvaluation,
  type BattleCommandEvaluationContext,
  type BattleCommandTarget,
} from './commandEvaluation';
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
} from './types';

export interface StepOutput {
  state: BattleState;
  events: BattleEvent[];
  evaluation: BattleCommandEvaluation;
}

type ActionContext = BattleActionRef;

function battleActionId(turn: number, ordinal: number): BattleActionId {
  return `turn:${turn}:action:${ordinal}`;
}
/** かいふく わざ：最大 HP × この割合 × いりょく倍率 */
const HEAL_RATIO = 0.25;
/** ぼうぎょ アップ・ダウン：1 ± この割合 × いりょく倍率 */
const GUARD_RATIO = 0.25;
export { emptyGauges } from './utils';
export { frontAlly, makeCompanion };
export { battleSkills, canAfford, canUseBattleItem, skillTarget, SUBJECTS } from './commandEvaluation';
export type { BattleSkill } from './commandEvaluation';

/** 主人公が いま コマンドを 出せるか（ターン制：たたかいが つづいて いて たおれて いなければ いつでも） */
export function isHeroReady(s: BattleState): boolean {
  return s.outcome === 'ongoing' && s.ally.hero.hp > 0;
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

function done(
  s: BattleState,
  rng: Rng | null,
  ev: BattleEvent[],
  evaluation: BattleCommandEvaluation,
): StepOutput {
  if (rng) s.rngState = rng.state();
  s.log.push(...ev);
  return { state: s, events: ev, evaluation };
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

function targetCombatant(state: BattleState, target: BattleCommandTarget): Combatant {
  if (target.side === 'enemy') return state.enemy;
  if (target.combatantId === state.ally.hero.id) return state.ally.hero;
  return state.ally.monsters[target.monsterIndex ?? -1]!;
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
  evaluation: BattleCommandEvaluation,
  def: BattleDeps,
  rng: Rng,
  ev: BattleEvent[],
  action: ActionContext,
): void {
  const actorId = evaluation.actorId!;
  const sk = def.skills.get(command.skillId)!;
  const actor = actorId === s.ally.hero.id ? s.ally.hero : s.ally.monsters.find((m) => m.id === actorId)!;
  const p = s.player;
  const st = def.settings;

  const gaugeCost = evaluation.costs.find((cost) => cost.kind === 'gauge');
  if (gaugeCost?.kind === 'gauge') {
    p.subjectGauges[gaugeCost.subject] -= gaugeCost.amount;
    ev.push({
      t: 'gaugeUse',
      ...action,
      subject: gaugeCost.subject,
      amount: gaugeCost.amount,
      value: p.subjectGauges[gaugeCost.subject],
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

  const targets = evaluation.resolvedTargets.map((target) => targetCombatant(s, target));
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
}

/** 主人公の コマンド。ターンを つかったら true（つかわなければ もう一度 えらべる） */
function heroCommand(
  s: BattleState,
  command: Command,
  evaluation: BattleCommandEvaluation,
  def: BattleDeps,
  rng: Rng,
  ev: BattleEvent[],
  action: ActionContext,
): void {
  const hero = s.ally.hero;
  switch (command.kind) {
    case 'wait':
      // 主人公は 動かない（たおれて いる ときなど）。オトモと てきは 動く
      return;
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
      return;
    case 'skill':
      useSkill(s, command, evaluation, def, rng, ev, action);
      return;
    case 'item': {
      const it = def.items.get(command.itemId)!;
      const cost = evaluation.costs.find((entry) => entry.kind === 'item');
      if (it.use?.recruit) {
        useMusubiDama(s, it, def.monsters.get(s.enemy.refId), command, rng, ev, action);
        return;
      }
      s.ally.items[command.itemId] = (s.ally.items[command.itemId] ?? 0) - (cost?.amount ?? 0);
      const target = targetCombatant(s, evaluation.resolvedTargets[0]!);
      ev.push({ t: 'itemUsed', ...action, itemId: it.id, targetId: target.id });
      if (it.use?.heal) {
        const before = target.hp;
        target.hp = Math.min(target.stats.hp, target.hp + it.use.heal);
        ev.push({ t: 'heal', ...action, side: 'ally', targetId: target.id, amount: target.hp - before });
      }
      if (it.use?.mp) target.mp = Math.min(target.stats.mp, target.mp + it.use.mp);
      return;
    }
    case 'swap': {
      const target = evaluation.resolvedTargets[0]!;
      const to = s.ally.monsters[target.monsterIndex!]!;
      const from = s.ally.monsters[s.ally.activeMonsterIndex];
      s.ally.activeMonsterIndex = target.monsterIndex!;
      s.companion = makeCompanion(to, def);
      ev.push({ t: 'swap', ...action, from: from?.id ?? '', to: to.id });
      return;
    }
    case 'recruit': {
      const m = def.monsters.get(s.enemy.refId);
      const giftCost = evaluation.costs.find((entry) => entry.kind === 'item');
      if (giftCost?.kind === 'item') {
        s.ally.items[giftCost.itemId] = (s.ally.items[giftCost.itemId] ?? 0) - giftCost.amount;
        ev.push({ t: 'recruitGift', ...action, targetId: s.enemy.id, itemId: giftCost.itemId });
      }
      const chance = recruitChance(
        s.enemy,
        m?.recruitRate ?? 0,
        s.enemy.hp / s.enemy.stats.hp,
        command.result.score,
        def.settings,
      );
      const success = Boolean(giftCost) || (chance > 0 && rng.chance(chance));
      ev.push({
        t: 'recruitAttempt',
        ...action,
        targetId: s.enemy.id,
        success,
        chance: giftCost ? 1 : chance,
      });
      if (success) {
        s.outcome = 'recruited';
        ev.push({ t: 'recruited', ...action, monsterId: s.enemy.refId });
      }
      return;
    }
    case 'flee': {
      const chance = fleeChance(hero, s.enemy);
      const success = rng.chance(chance);
      ev.push({ t: 'fleeAttempt', ...action, success, chance });
      if (success) {
        s.outcome = 'fled';
        ev.push({ t: 'fled', ...action });
      }
      return;
    }
  }
}

function rejectionEvents(
  state: BattleState,
  command: Command,
  evaluation: BattleCommandEvaluation,
  def: BattleDeps,
): BattleEvent[] {
  if (evaluation.reason === 'insufficient-gauge' && command.kind === 'skill') {
    const skill = def.skills.get(command.skillId)!;
    return [
      {
        t: 'gaugeShort',
        subject: skill.subject,
        need: skill.costGauge,
        have: state.player.subjectGauges[skill.subject],
      },
    ];
  }
  if (evaluation.reason === 'boss-flee-blocked') {
    return [{ t: 'fleeAttempt', success: false, chance: 0 }];
  }
  return [];
}

/** 1ターンを優先度→素早さ→シード付き同速抽選の順で解決する。 */
export function act(
  prev: BattleState,
  command: Command,
  def: BattleDeps,
  context: BattleCommandEvaluationContext = {},
): StepOutput {
  const s = cloneBattleValue(prev);
  const ev: BattleEvent[] = [];
  const evaluation = evaluateBattleCommand(s, battleCommandRef(command), def, {
    ...context,
    phase: 'execution',
  });
  if (!evaluation.allowed) {
    return { state: s, events: rejectionEvents(s, command, evaluation, def), evaluation };
  }

  const rng = rngFor(s);
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
    if (actor === 'hero') heroCommand(s, command, evaluation, def, rng, ev, action);
    else if (actor === 'companion') resolveCompanionAction(s, def, rng, ev, action);
    else resolveEnemyTurn(s, def, rng, ev, action);
    finishAction(s, def, rng, ev, action);
  }
  if (s.outcome === 'ongoing') {
    for (const c of [s.ally.hero, ...s.ally.monsters, s.enemy]) decayBuffs(c);
    s.turn += 1;
  }
  return done(s, rng, ev, evaluation);
}

/** 対戦（1対1）用。両パーティとシードから決定論的なバトルを作る */
export function createArenaBattle(a: Party, b: Party, seed: string, def: BattleDeps): BattleState {
  const enemy = b.monsters[b.activeMonsterIndex] ?? b.hero;
  return createBattle({ ally: a, enemy, seed, isBossBattle: false }, def);
}

/** リプレイ：シードと コマンド列から 最終状態を 再現する */
export function replay(
  initial: BattleState,
  commands: readonly Command[],
  def: BattleDeps,
  context: BattleCommandEvaluationContext = {},
): BattleState {
  let s = initial;
  for (const command of commands) {
    if (s.outcome !== 'ongoing') break;
    s = act(s, command, def, context).state;
  }
  return s;
}

export type { BattleDeps } from './dependencies';
export type { BattleEvent, BattleState, Combatant, Command, Party, Side };
