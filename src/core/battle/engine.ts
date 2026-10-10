/**
 * バトルエンジン本体（ターン制。GDD §4）。純粋関数だけ。Phaser も DOM も知らない。
 *  - act(state, command) … 1 ターンを 解決する。主人公 → オトモ（前に 立つ 仲間）→ てき の じゅんで 1 回ずつ 動く。
 *                          問題の 成績（ActionResult.score）で いりょくが かわり、まちがえても 行動は かならず 成立する。
 *                          コマンドが 成立しなかった とき（教科ゲージが たりない など）は ターンが すすまず、えらび直せる
 * { state, events } を返し、Scene は events を じゅんばんに 再生するだけ。
 * 同じ seed・同じ コマンド列なら 必ず 同じ 結果に なる（replay。対戦の リプレイ・非同期対戦の 土台）。
 */
import type { ElementTable, Item, Monster, Settings, Skill } from '../content/schemas';
import { createRng, type Rng } from '../rng';
import { addProgressValue } from '../../shared/safeInteger';
import { comboBonus, computeDamage, fleeChance, recruitChance, scoreBand, scoreMultiplier } from './damage';
import { commandPriority, initiativeOrder } from './initiative';
import { clampBattleValue, cloneBattleValue, emptyGauges } from './utils';
import type {
  BattleEvent,
  BattleState,
  Combatant,
  Command,
  Companion,
  EnemyUnit,
  Party,
  Side,
  TargetType,
} from './types';

export interface BattleDeps {
  settings: Settings;
  elements: ElementTable;
  skills: Map<string, Skill>;
  items: Map<string, Item>;
  monsters: Map<string, Monster>;
}

export interface StepOutput {
  state: BattleState;
  events: BattleEvent[];
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
/** 敵の かいふく わざ：最大 HP × この割合 */
const ENEMY_HEAL_RATIO = 0.25;
/** 敵の「みを まもる」の ぼうぎょ倍率と つづく ターン数 */
const ENEMY_GUARD_MULT = 1.5;
const ENEMY_GUARD_TURNS = 1;

export { emptyGauges } from './utils';

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

/** 敵が ねらう 相手：前に 立つ オトモ。いなければ 主人公 */
export function frontAlly(s: BattleState): Combatant {
  const m = s.ally.monsters[s.ally.activeMonsterIndex];
  return m && m.hp > 0 ? m : s.ally.hero;
}

/**
 * 出撃中の 仲間モンスターから オトモを つくる。
 * 自動で 使う わざは ゲージを 使わない こうげきわざ（いちばん いりょくの 高いもの）。
 * ゲージを 使う 強い わざは、プレイヤーが 問題に こたえて たのむ（battleSkills）。
 * パッシブは 自動わざの 教科の ゲージが たまりやすく なる
 */
export function makeCompanion(
  m: Combatant | undefined,
  def: Pick<BattleDeps, 'skills' | 'settings'>,
): Companion | null {
  if (!m || m.hp <= 0) return null;
  const skills = m.skills.map((id) => def.skills.get(id)).filter((sk): sk is Skill => !!sk);
  const active = skills
    .filter((sk) => sk.effect === 'damage' && sk.costGauge === 0)
    .reduce<Skill | null>((best, sk) => (!best || sk.power > best.power ? sk : best), null);
  const subject = m.subjectAffinity ?? (active ?? skills[0])?.subject;
  return {
    id: m.id,
    name: m.name,
    passiveSkill: subject
      ? { kind: 'gaugeBoost', subject, mult: def.settings.subjectGauge.companionBoost }
      : null,
    activeSkill: active?.id ?? null,
  };
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

/** ボスのフェーズ移行（HP 割合で切り替わる）。ターン制では わざ・すがたが かわる（行動の 回数は かわらない） */
function checkBossPhase(enemy: EnemyUnit, def: BattleDeps, ev: BattleEvent[]): void {
  if (!enemy.isBoss) return;
  const phases = def.monsters.get(enemy.refId)?.bossPhases ?? [];
  const ratio = enemy.hp / enemy.stats.hp;
  for (let i = enemy.phaseIndex + 1; i < phases.length; i++) {
    const p = phases[i]!;
    if (ratio > p.hpBelow) continue;
    enemy.phaseIndex = i;
    if (p.skills) enemy.skills = p.skills;
    if (p.element) enemy.element = p.element;
    ev.push({ t: 'bossPhase', phaseIndex: i, line: p.line });
  }
}

/** 味方が たおれた。前に 立つ オトモなら、生きている 次の 仲間が 自動で 前に 出る */
function allyDown(s: BattleState, c: Combatant, def: BattleDeps, ev: BattleEvent[]): void {
  ev.push({ t: 'ko', side: 'ally', targetId: c.id });
  if (c.isHero || s.companion?.id !== c.id) return;
  const next = s.ally.monsters.findIndex((m) => m.hp > 0);
  if (next < 0) {
    s.companion = null;
    return;
  }
  s.ally.activeMonsterIndex = next;
  s.companion = makeCompanion(s.ally.monsters[next], def);
  ev.push({ t: 'swap', from: c.id, to: s.ally.monsters[next]!.id, auto: true });
}

/** こうげきを 当てる（ダメージ → HP → ダウン・ボスの フェーズ） */
function hit(
  s: BattleState,
  def: BattleDeps,
  rng: Rng,
  ev: BattleEvent[],
  o: { attacker: Combatant; defender: Combatant; side: Side; skill: Skill | null; score: number | null },
): void {
  const byAlly = o.side === 'enemy';
  const d = computeDamage({
    attacker: o.attacker,
    defender: o.defender,
    skill: o.skill,
    score: o.score,
    combo: byAlly ? s.player.comboCount : 0,
    canCrit: byAlly,
    settings: def.settings,
    elements: def.elements,
    rng,
  });
  o.defender.hp = Math.max(0, o.defender.hp - d.amount);
  ev.push({
    t: 'damage',
    side: o.side,
    targetId: o.defender.id,
    amount: d.amount,
    critical: d.critical,
    elementMult: d.elementMult,
    weakness: d.weaknessHit,
    scoreBand: d.band,
    comboMult: d.comboMult,
  });
  if (byAlly && o.defender.hp > 0) checkBossPhase(s.enemy, def, ev);
  else if (o.defender.hp <= 0) allyDown(s, o.defender, def, ev);
}

function finishIfOver(s: BattleState, def: BattleDeps, rng: Rng, ev: BattleEvent[]): void {
  if (s.outcome !== 'ongoing') return;
  if (s.enemy.hp <= 0) {
    ev.push({ t: 'ko', side: 'enemy', targetId: s.enemy.id });
    const m = def.monsters.get(s.enemy.refId);
    const drops = (m?.drops ?? []).filter((d) => rng.chance(d.rate)).map((d) => d.itemId);
    const recruitOffer = !s.enemy.isBoss && rng.chance(m?.recruitRate ?? 0);
    // れんぞく せいかいの ボーナス（この バトルで いちばん 長かった コンボで けいけんち・おかねが ふえる）
    const bonus = comboBonus(s.player.maxCombo, def.settings);
    s.outcome = 'victory';
    ev.push({
      t: 'victory',
      xp: addProgressValue(0, Math.round((m?.xp ?? 0) * bonus)),
      gold: addProgressValue(0, Math.round((m?.gold ?? 0) * bonus)),
      drops,
      recruitOffer,
      bonus,
      maxCombo: s.player.maxCombo,
    });
    return;
  }
  if (s.ally.hero.hp <= 0 && s.ally.monsters.every((x) => x.hp <= 0)) {
    s.outcome = 'defeat';
    ev.push({ t: 'defeat' });
  }
}

/** 敵の ターン。シンプルAI：通常60% / わざ30% / 防御10%。HP30%以下なら回復わざを優先 */
function enemyAction(s: BattleState, def: BattleDeps, rng: Rng, ev: BattleEvent[]): void {
  const e = s.enemy;
  const target = frontAlly(s);
  const r = rng.next();
  const skills = e.skills.map((id) => def.skills.get(id)).filter((sk): sk is Skill => !!sk);
  const healSkill = skills.find((sk) => sk.effect === 'heal');
  if (e.hp / e.stats.hp <= 0.3 && healSkill && e.mp >= healSkill.mp) {
    e.mp -= healSkill.mp;
    const before = e.hp;
    e.hp = Math.min(e.stats.hp, e.hp + Math.round(e.stats.hp * ENEMY_HEAL_RATIO));
    ev.push({ t: 'act', side: 'enemy', actorId: e.id, command: 'skill', skillId: healSkill.id });
    ev.push({ t: 'heal', side: 'enemy', targetId: e.id, amount: e.hp - before });
    return;
  }
  const usable = skills.filter((sk) => sk.effect === 'damage' && e.mp >= sk.mp);
  if (r < 0.3 && usable.length) {
    const sk = rng.pick(usable);
    e.mp -= sk.mp;
    ev.push({ t: 'act', side: 'enemy', actorId: e.id, command: 'skill', skillId: sk.id });
    // 敵のわざには問題が絡まない → score は null 扱い（等倍）
    hit(s, def, rng, ev, { attacker: e, defender: target, side: 'ally', skill: sk, score: null });
  } else if (r < 0.9) {
    ev.push({ t: 'act', side: 'enemy', actorId: e.id, command: 'attack' });
    hit(s, def, rng, ev, { attacker: e, defender: target, side: 'ally', skill: null, score: null });
  } else {
    // 次の ターンまで みを まもる
    e.buffs.def = { mult: ENEMY_GUARD_MULT, turns: ENEMY_GUARD_TURNS + 1 };
    ev.push({ t: 'act', side: 'enemy', actorId: e.id, command: 'defend' });
    ev.push({
      t: 'buff',
      side: 'enemy',
      targetId: e.id,
      stat: 'def',
      mult: ENEMY_GUARD_MULT,
      turns: ENEMY_GUARD_TURNS,
    });
  }
  finishIfOver(s, def, rng, ev);
}

/** 敵の ターン（休んで いれば 何も しない） */
function enemyTurn(s: BattleState, def: BattleDeps, rng: Rng, ev: BattleEvent[]): void {
  const e = s.enemy;
  if (e.skipTurns > 0) {
    e.skipTurns -= 1;
    ev.push({ t: 'skipTurn', targetId: e.id, remain: e.skipTurns });
    return;
  }
  enemyAction(s, def, rng, ev);
}

/** オトモの ターン（問題は なし＝倍率 1、コンボは のる） */
function companionAction(s: BattleState, def: BattleDeps, rng: Rng, ev: BattleEvent[]): void {
  const c = s.companion;
  const m = c && s.ally.monsters.find((x) => x.id === c.id);
  if (!c || !m || m.hp <= 0) return;
  const sk = (c.activeSkill && def.skills.get(c.activeSkill)) || null;
  ev.push({
    t: 'act',
    side: 'ally',
    actorId: m.id,
    command: sk ? 'skill' : 'attack',
    skillId: sk?.id,
    auto: true,
  });
  hit(s, def, rng, ev, { attacker: m, defender: s.enemy, side: 'enemy', skill: sk, score: null });
  finishIfOver(s, def, rng, ev);
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
  const target = weakestAlly(s);
  return (!!item.use.heal && target.hp < target.stats.hp) || (!!item.use.mp && target.mp < target.stats.mp);
}

/** こたえた 教科の ゲージを ためる（オトモの 教科なら たまりやすい） */
function chargeGauge(s: BattleState, sk: Skill, score: number, def: BattleDeps, ev: BattleEvent[]): void {
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
    ev.push({ t: 'gaugeUse', subject: sk.subject, amount: sk.costGauge, value: p.subjectGauges[sk.subject] });
  }

  const score = clampBattleValue(Number.isFinite(command.result.score) ? command.result.score : 0, 0, 1);
  const band = scoreBand(score);
  const mult = scoreMultiplier(score, st);
  // コンボ（Streak）：GREAT 以上なら +1、GOOD・MISS なら 0 に もどる
  if (band === 'perfect' || band === 'good') {
    p.comboCount += 1;
    p.maxCombo = Math.max(p.maxCombo, p.comboCount);
    if (p.comboCount >= 2) ev.push({ t: 'combo', count: p.comboCount, bonus: comboBonus(p.comboCount, st) });
  } else p.comboCount = 0;

  ev.push({
    t: 'act',
    side: 'ally',
    actorId: actor.id,
    command: sk.effect === 'scan' ? 'scan' : 'skill',
    skillId: sk.id,
  });
  switch (sk.effect) {
    case 'damage':
      hit(s, def, rng, ev, { attacker: actor, defender: s.enemy, side: 'enemy', skill: sk, score });
      break;
    case 'heal':
      for (const c of allyTargets(s, sk, actor)) {
        const before = c.hp;
        c.hp = Math.min(c.stats.hp, c.hp + Math.max(1, Math.round(c.stats.hp * HEAL_RATIO * mult)));
        ev.push({ t: 'heal', side: 'ally', targetId: c.id, amount: c.hp - before });
      }
      break;
    case 'buff': {
      const m = 1 + GUARD_RATIO * mult;
      const turns = st.turns.buffTurns;
      for (const c of allyTargets(s, sk, actor)) {
        // ターンの おわりに 1 へるので、この ターンぶんを 足して おく
        c.buffs.def = { mult: m, turns: turns + 1 };
        ev.push({ t: 'buff', side: 'ally', targetId: c.id, stat: 'def', mult: m, turns });
      }
      break;
    }
    case 'debuff': {
      const m = 1 / (1 + GUARD_RATIO * mult);
      const turns = st.turns.buffTurns;
      s.enemy.buffs.def = { mult: m, turns: turns + 1 };
      ev.push({ t: 'buff', side: 'enemy', targetId: s.enemy.id, stat: 'def', mult: m, turns });
      break;
    }
    case 'scan':
      // 理科の「しらべる」＝じゃくてん判明（GDD §4.4）
      if (score >= 0.5 && s.enemy.weakness) {
        s.enemy.weaknessRevealed = true;
        ev.push({ t: 'weaknessRevealed', targetId: s.enemy.id, element: s.enemy.weakness });
      } else ev.push({ t: 'scanFailed', targetId: s.enemy.id });
      break;
    case 'status': {
      // あいての うごきを とめる（できばえが よいほど 長く 休む）
      const turns = Math.max(1, Math.round(st.turns.statusTurns * mult));
      s.enemy.skipTurns += turns;
      ev.push({ t: 'status', targetId: s.enemy.id, turns });
      break;
    }
  }
  chargeGauge(s, sk, score, def, ev);
  return true;
}

/** 主人公の コマンド。ターンを つかったら true（つかわなければ もう一度 えらべる） */
function heroCommand(
  s: BattleState,
  command: Command,
  def: BattleDeps,
  rng: Rng,
  ev: BattleEvent[],
): boolean {
  const hero = s.ally.hero;
  switch (command.kind) {
    case 'wait':
      // 主人公は 動かない（たおれて いる ときなど）。オトモと てきは 動く
      return true;
    case 'attack':
      // たたかう は 問題なしで いつでも 撃てる（ゲームが止まらない保証）。かわりに いりょくは 等倍
      ev.push({ t: 'act', side: 'ally', actorId: hero.id, command: 'attack' });
      hit(s, def, rng, ev, { attacker: hero, defender: s.enemy, side: 'enemy', skill: null, score: null });
      return true;
    case 'skill':
      return useSkill(s, command, def, rng, ev);
    case 'item': {
      const it = def.items.get(command.itemId);
      const n = s.ally.items[command.itemId] ?? 0;
      if (!it || n <= 0 || !canUseBattleItem(s, it)) return false;
      s.ally.items[command.itemId] = n - 1;
      const target = weakestAlly(s);
      ev.push({ t: 'itemUsed', itemId: it.id, targetId: target.id });
      if (it.use?.heal) {
        const before = target.hp;
        target.hp = Math.min(target.stats.hp, target.hp + it.use.heal);
        ev.push({ t: 'heal', side: 'ally', targetId: target.id, amount: target.hp - before });
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
      ev.push({ t: 'swap', from: from?.id ?? '', to: to.id });
      return true;
    }
    case 'recruit': {
      const m = def.monsters.get(s.enemy.refId);
      const gift = m?.recruitItem;
      const usedGift = Boolean(gift && command.itemId === gift && (s.ally.items[gift] ?? 0) > 0);
      if (usedGift && gift) {
        s.ally.items[gift]!--;
        ev.push({ t: 'recruitGift', targetId: s.enemy.id, itemId: gift });
      }
      const chance = recruitChance(
        s.enemy,
        m?.recruitRate ?? 0,
        s.enemy.hp / s.enemy.stats.hp,
        command.result.score,
        def.settings,
      );
      const success = usedGift || (chance > 0 && rng.chance(chance));
      ev.push({ t: 'recruitAttempt', targetId: s.enemy.id, success, chance: usedGift ? 1 : chance });
      if (success) {
        s.outcome = 'recruited';
        ev.push({ t: 'recruited', monsterId: s.enemy.refId });
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
      ev.push({ t: 'fleeAttempt', success, chance });
      if (success) {
        s.outcome = 'fled';
        ev.push({ t: 'fled' });
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
  for (const actor of order) {
    if (s.outcome !== 'ongoing') break;
    if (actor === 'hero') heroCommand(s, command, def, rng, ev);
    else if (actor === 'companion') companionAction(s, def, rng, ev);
    else enemyTurn(s, def, rng, ev);
    finishIfOver(s, def, rng, ev);
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

export type { BattleEvent, BattleState, Combatant, Command, Party, Side };
