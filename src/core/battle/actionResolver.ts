import { addProgressValue } from '../../shared/safeInteger';
import type { Skill } from '../content/schemas';
import type { Rng } from '../rng';
import { comboBonus, computeDamage } from './damage';
import type { BattleDeps } from './dependencies';
import type {
  BattleActionRef,
  BattleEvent,
  BattleState,
  Combatant,
  Companion,
  EnemyUnit,
  Side,
} from './types';

/** 敵の「みを まもる」の ぼうぎょ倍率と つづく ターン数 */
const ENEMY_GUARD_MULT = 1.5;
const ENEMY_GUARD_TURNS = 1;
/** 敵の かいふく わざ：最大 HP × この割合 */
const ENEMY_HEAL_RATIO = 0.25;

/** 敵が ねらう 相手：前に 立つ オトモ。いなければ 主人公 */
export function frontAlly(s: BattleState): Combatant {
  const monster = s.ally.monsters[s.ally.activeMonsterIndex];
  return monster && monster.hp > 0 ? monster : s.ally.hero;
}

/** 出撃中の仲間から、自動行動と教科ゲージ passive を持つオトモを作る。 */
export function makeCompanion(
  monster: Combatant | undefined,
  def: Pick<BattleDeps, 'skills' | 'settings'>,
): Companion | null {
  if (!monster || monster.hp <= 0) return null;
  const skills = monster.skills.map((id) => def.skills.get(id)).filter((skill): skill is Skill => !!skill);
  const active = skills
    .filter((skill) => skill.effect === 'damage' && skill.costGauge === 0)
    .reduce<Skill | null>((best, skill) => (!best || skill.power > best.power ? skill : best), null);
  const subject = monster.subjectAffinity ?? (active ?? skills[0])?.subject;
  return {
    id: monster.id,
    name: monster.name,
    passiveSkill: subject
      ? { kind: 'gaugeBoost', subject, mult: def.settings.subjectGauge.companionBoost }
      : null,
    activeSkill: active?.id ?? null,
  };
}

function checkBossPhase(
  enemy: EnemyUnit,
  def: BattleDeps,
  events: BattleEvent[],
  action: BattleActionRef,
): void {
  if (!enemy.isBoss) return;
  const phases = def.monsters.get(enemy.refId)?.bossPhases ?? [];
  const ratio = enemy.hp / enemy.stats.hp;
  for (let index = enemy.phaseIndex + 1; index < phases.length; index++) {
    const phase = phases[index]!;
    if (ratio > phase.hpBelow) continue;
    enemy.phaseIndex = index;
    if (phase.skills) enemy.skills = phase.skills;
    if (phase.element) enemy.element = phase.element;
    events.push({ t: 'bossPhase', ...action, phaseIndex: index, line: phase.line });
  }
}

function allyDown(
  state: BattleState,
  combatant: Combatant,
  def: BattleDeps,
  events: BattleEvent[],
  action: BattleActionRef,
): void {
  events.push({ t: 'ko', ...action, side: 'ally', targetId: combatant.id });
  if (combatant.isHero || state.companion?.id !== combatant.id) return;
  const next = state.ally.monsters.findIndex((monster) => monster.hp > 0);
  if (next < 0) {
    state.companion = null;
    return;
  }
  state.ally.activeMonsterIndex = next;
  state.companion = makeCompanion(state.ally.monsters[next], def);
  events.push({
    t: 'swap',
    ...action,
    from: combatant.id,
    to: state.ally.monsters[next]!.id,
    auto: true,
  });
}

/** こうげきを当て、同じ action に damage / down / boss phase を関連付ける。 */
export function resolveHit(
  state: BattleState,
  def: BattleDeps,
  rng: Rng,
  events: BattleEvent[],
  action: BattleActionRef,
  input: {
    attacker: Combatant;
    defender: Combatant;
    side: Side;
    skill: Skill | null;
    score: number | null;
  },
): void {
  const byAlly = input.side === 'enemy';
  const damage = computeDamage({
    attacker: input.attacker,
    defender: input.defender,
    skill: input.skill,
    score: input.score,
    combo: byAlly ? state.player.comboCount : 0,
    canCrit: byAlly,
    settings: def.settings,
    elements: def.elements,
    rng,
  });
  input.defender.hp = Math.max(0, input.defender.hp - damage.amount);
  events.push({
    t: 'damage',
    ...action,
    side: input.side,
    targetId: input.defender.id,
    amount: damage.amount,
    critical: damage.critical,
    elementMult: damage.elementMult,
    weakness: damage.weaknessHit,
    scoreBand: damage.band,
    comboMult: damage.comboMult,
  });
  if (byAlly && input.defender.hp > 0) checkBossPhase(state.enemy, def, events, action);
  else if (!byAlly && input.defender.hp <= 0) allyDown(state, input.defender, def, events, action);
}

/** 行動の結果で決着した場合、KO と outcome を同じ action に関連付ける。 */
export function finishAction(
  state: BattleState,
  def: BattleDeps,
  rng: Rng,
  events: BattleEvent[],
  action: BattleActionRef,
): void {
  if (state.outcome !== 'ongoing') return;
  if (state.enemy.hp <= 0) {
    events.push({ t: 'ko', ...action, side: 'enemy', targetId: state.enemy.id });
    const monster = def.monsters.get(state.enemy.refId);
    const drops = (monster?.drops ?? []).filter((drop) => rng.chance(drop.rate)).map((drop) => drop.itemId);
    const recruitOffer = !state.enemy.isBoss && rng.chance(monster?.recruitRate ?? 0);
    const bonus = comboBonus(state.player.maxCombo, def.settings);
    state.outcome = 'victory';
    events.push({
      t: 'victory',
      ...action,
      xp: addProgressValue(0, Math.round((monster?.xp ?? 0) * bonus)),
      gold: addProgressValue(0, Math.round((monster?.gold ?? 0) * bonus)),
      drops,
      recruitOffer,
      bonus,
      maxCombo: state.player.maxCombo,
    });
    return;
  }
  if (state.ally.hero.hp <= 0 && state.ally.monsters.every((combatant) => combatant.hp <= 0)) {
    state.outcome = 'defeat';
    events.push({ t: 'defeat', ...action });
  }
}

/** 敵の initiative slot。休み・回復・攻撃・防御を 1 action bundle として解決する。 */
export function resolveEnemyTurn(
  state: BattleState,
  def: BattleDeps,
  rng: Rng,
  events: BattleEvent[],
  action: BattleActionRef,
): void {
  const enemy = state.enemy;
  if (enemy.skipTurns > 0) {
    enemy.skipTurns -= 1;
    events.push({ t: 'skipTurn', ...action, targetId: enemy.id, remain: enemy.skipTurns });
    return;
  }

  const target = frontAlly(state);
  const choice = rng.next();
  const skills = enemy.skills.map((id) => def.skills.get(id)).filter((skill): skill is Skill => !!skill);
  const healSkill = skills.find((skill) => skill.effect === 'heal');
  if (enemy.hp / enemy.stats.hp <= 0.3 && healSkill && enemy.mp >= healSkill.mp) {
    enemy.mp -= healSkill.mp;
    const before = enemy.hp;
    enemy.hp = Math.min(enemy.stats.hp, enemy.hp + Math.round(enemy.stats.hp * ENEMY_HEAL_RATIO));
    events.push({
      t: 'act',
      ...action,
      side: 'enemy',
      actorId: enemy.id,
      targetIds: [enemy.id],
      command: 'skill',
      skillId: healSkill.id,
    });
    events.push({ t: 'heal', ...action, side: 'enemy', targetId: enemy.id, amount: enemy.hp - before });
    return;
  }

  const usable = skills.filter((skill) => skill.effect === 'damage' && enemy.mp >= skill.mp);
  if (choice < 0.3 && usable.length) {
    const skill = rng.pick(usable);
    enemy.mp -= skill.mp;
    events.push({
      t: 'act',
      ...action,
      side: 'enemy',
      actorId: enemy.id,
      targetIds: [target.id],
      command: 'skill',
      skillId: skill.id,
    });
    resolveHit(state, def, rng, events, action, {
      attacker: enemy,
      defender: target,
      side: 'ally',
      skill,
      score: null,
    });
    return;
  }
  if (choice < 0.9) {
    events.push({
      t: 'act',
      ...action,
      side: 'enemy',
      actorId: enemy.id,
      targetIds: [target.id],
      command: 'attack',
    });
    resolveHit(state, def, rng, events, action, {
      attacker: enemy,
      defender: target,
      side: 'ally',
      skill: null,
      score: null,
    });
    return;
  }

  enemy.buffs.def = { mult: ENEMY_GUARD_MULT, turns: ENEMY_GUARD_TURNS + 1 };
  events.push({
    t: 'act',
    ...action,
    side: 'enemy',
    actorId: enemy.id,
    targetIds: [enemy.id],
    command: 'defend',
  });
  events.push({
    t: 'buff',
    ...action,
    side: 'enemy',
    targetId: enemy.id,
    stat: 'def',
    mult: ENEMY_GUARD_MULT,
    turns: ENEMY_GUARD_TURNS,
  });
}

/** オトモの initiative slot。 */
export function resolveCompanionAction(
  state: BattleState,
  def: BattleDeps,
  rng: Rng,
  events: BattleEvent[],
  action: BattleActionRef,
): void {
  const companion = state.companion;
  const monster = companion && state.ally.monsters.find((candidate) => candidate.id === companion.id);
  if (!companion || !monster || monster.hp <= 0) return;
  const skill = (companion.activeSkill && def.skills.get(companion.activeSkill)) || null;
  events.push({
    t: 'act',
    ...action,
    side: 'ally',
    actorId: monster.id,
    targetIds: [state.enemy.id],
    command: skill ? 'skill' : 'attack',
    skillId: skill?.id,
    auto: true,
  });
  resolveHit(state, def, rng, events, action, {
    attacker: monster,
    defender: state.enemy,
    side: 'enemy',
    skill,
    score: null,
  });
}
