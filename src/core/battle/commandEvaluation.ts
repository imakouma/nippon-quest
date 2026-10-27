import type { Item, Monster, Settings, Skill, Subject } from '../content/schemas';
import { canUseMusubiDama } from './musubiDama';
import type { BattleState, Combatant, Command, TargetType } from './types';

export const SUBJECTS = ['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo'] as const;

export interface BattleCommandDeps {
  settings: Settings;
  skills: Map<string, Skill>;
  items: Map<string, Item>;
  monsters: Map<string, Monster>;
}

export interface BattleSkill {
  skill: Skill;
  actorId: string;
  unique: boolean;
}

export type BattleCommandRef =
  | { kind: 'attack' | 'flee' | 'wait' }
  | { kind: 'skill'; skillId: string; actorId?: string }
  | { kind: 'item'; itemId: string; hasActionResult?: boolean }
  | { kind: 'swap'; monsterIndex: number }
  | { kind: 'recruit'; itemId?: string };

export type BattleCommandBlockReason =
  | 'battle-over'
  | 'hero-unavailable'
  | 'unknown-skill'
  | 'actor-unavailable'
  | 'skill-unavailable'
  | 'question-unavailable'
  | 'insufficient-gauge'
  | 'unknown-item'
  | 'item-not-owned'
  | 'item-unusable'
  | 'item-no-effect'
  | 'action-result-required'
  | 'boss-recruit-blocked'
  | 'enemy-not-recruitable'
  | 'enemy-unavailable'
  | 'invalid-swap-target'
  | 'already-active'
  | 'target-defeated'
  | 'boss-flee-blocked'
  | 'recruit-locked'
  | 'enemy-too-healthy'
  | 'invalid-recruit-gift';

export interface BattleCommandTarget {
  side: 'ally' | 'enemy';
  combatantId: string;
  monsterIndex?: number;
}

export type BattleCommandCost =
  { kind: 'gauge'; subject: Subject; amount: number } | { kind: 'item'; itemId: string; amount: number };

export interface BattleCommandEvaluation {
  allowed: boolean;
  reason: BattleCommandBlockReason | null;
  actorId: string | null;
  resolvedTargets: readonly BattleCommandTarget[];
  costs: readonly BattleCommandCost[];
  consumesTurn: boolean;
}

export interface BattleCommandEvaluationContext {
  questionSkillKeys?: ReadonlySet<string>;
  storyCompanionUnlocked?: boolean;
  phase?: 'selection' | 'execution';
}

export function battleCommandRef(command: Command, hasActionResult?: boolean): BattleCommandRef {
  switch (command.kind) {
    case 'skill':
      return { kind: 'skill', skillId: command.skillId, actorId: command.actorId };
    case 'item':
      return {
        kind: 'item',
        itemId: command.itemId,
        hasActionResult: hasActionResult ?? command.result !== undefined,
      };
    case 'swap':
      return { kind: 'swap', monsterIndex: command.monsterIndex };
    case 'recruit':
      return { kind: 'recruit', itemId: command.itemId };
    default:
      return { kind: command.kind };
  }
}

export function skillTarget(skill: Pick<Skill, 'targetType' | 'effect'>): TargetType {
  return skill.targetType ?? (skill.effect === 'heal' || skill.effect === 'buff' ? 'self' : 'singleEnemy');
}

export function canAfford(state: BattleState, skill: Pick<Skill, 'subject' | 'costGauge'>): boolean {
  return state.player.subjectGauges[skill.subject] >= skill.costGauge;
}

export function frontAlly(state: BattleState): Combatant {
  const monster = state.ally.monsters[state.ally.activeMonsterIndex];
  return monster && monster.hp > 0 ? monster : state.ally.hero;
}

export function weakestAlly(state: BattleState): BattleCommandTarget {
  const front = frontAlly(state);
  const ratio = (combatant: Combatant) => combatant.hp / Math.max(1, combatant.stats.hp);
  if (front !== state.ally.hero && ratio(front) < ratio(state.ally.hero)) {
    return {
      side: 'ally',
      combatantId: front.id,
      monsterIndex: state.ally.monsters.findIndex((monster) => monster.id === front.id),
    };
  }
  return { side: 'ally', combatantId: state.ally.hero.id };
}

export function canUseBattleItem(state: BattleState, item: Item): boolean {
  if (item.kind !== 'consumable' || !item.use) return false;
  if (item.use.recruit) return true;
  const target = combatantForTarget(state, weakestAlly(state));
  return (!!item.use.heal && target.hp < target.stats.hp) || (!!item.use.mp && target.mp < target.stats.mp);
}

export function battleSkills(
  state: BattleState,
  deps: Pick<BattleCommandDeps, 'skills' | 'settings'>,
): BattleSkill[] {
  const skills: BattleSkill[] = [];
  const seen = new Set<string>();
  const push = (id: string, actorId: string, unique: boolean) => {
    const skill = deps.skills.get(id);
    const key = `${actorId}:${id}`;
    if (!skill || seen.has(key)) return;
    seen.add(key);
    skills.push({ skill, actorId, unique });
  };
  const hero = state.ally.hero;
  for (const id of hero.skills) push(id, hero.id, false);
  const companion = state.companion
    ? state.ally.monsters.find((monster) => monster.id === state.companion?.id && monster.hp > 0)
    : undefined;
  if (companion) for (const id of companion.skills) push(id, companion.id, false);
  const subjects = new Set(skills.map((entry) => entry.skill.subject));
  for (const subject of SUBJECTS) {
    const id = deps.settings.subjectGauge.uniqueSkills[subject];
    if (id && subjects.has(subject)) push(id, hero.id, true);
  }
  return skills;
}

const denied = (reason: BattleCommandBlockReason): BattleCommandEvaluation => ({
  allowed: false,
  reason,
  actorId: null,
  resolvedTargets: [],
  costs: [],
  consumesTurn: false,
});

const allowed = (
  actorId: string | null,
  resolvedTargets: readonly BattleCommandTarget[] = [],
  costs: readonly BattleCommandCost[] = [],
): BattleCommandEvaluation => ({
  allowed: true,
  reason: null,
  actorId,
  resolvedTargets,
  costs,
  consumesTurn: true,
});

function combatantForTarget(state: BattleState, target: BattleCommandTarget): Combatant {
  if (target.side === 'enemy') return state.enemy;
  if (target.combatantId === state.ally.hero.id) return state.ally.hero;
  return state.ally.monsters[target.monsterIndex ?? -1]!;
}

function actorById(state: BattleState, actorId: string): Combatant | undefined {
  if (actorId === state.ally.hero.id) return state.ally.hero;
  return state.ally.monsters.find((monster) => monster.id === actorId);
}

function skillTargets(state: BattleState, skill: Skill, actor: Combatant): BattleCommandTarget[] {
  const target = skillTarget(skill);
  if (target === 'singleEnemy' || target === 'allEnemies') {
    return [{ side: 'enemy', combatantId: state.enemy.id }];
  }
  const actorTarget: BattleCommandTarget = {
    side: 'ally',
    combatantId: actor.id,
    ...(actor.isHero
      ? {}
      : { monsterIndex: state.ally.monsters.findIndex((monster) => monster.id === actor.id) }),
  };
  if (target === 'self') return [actorTarget];
  const front = frontAlly(state);
  return front.id === state.ally.hero.id
    ? [{ side: 'ally', combatantId: state.ally.hero.id }]
    : [
        { side: 'ally', combatantId: state.ally.hero.id },
        {
          side: 'ally',
          combatantId: front.id,
          monsterIndex: state.ally.monsters.findIndex((monster) => monster.id === front.id),
        },
      ];
}

export function evaluateBattleCommand(
  state: BattleState,
  ref: BattleCommandRef,
  deps: BattleCommandDeps,
  context: BattleCommandEvaluationContext = {},
): BattleCommandEvaluation {
  if (state.outcome !== 'ongoing') return denied('battle-over');
  if (state.ally.hero.hp <= 0 && ref.kind !== 'wait') return denied('hero-unavailable');

  switch (ref.kind) {
    case 'wait':
      return allowed(null);
    case 'attack':
      return allowed(state.ally.hero.id, [{ side: 'enemy', combatantId: state.enemy.id }]);
    case 'skill': {
      const skill = deps.skills.get(ref.skillId);
      if (!skill) return denied('unknown-skill');
      const actorId = ref.actorId ?? state.ally.hero.id;
      const actor = actorById(state, actorId);
      if (!actor || actor.hp <= 0) return denied('actor-unavailable');
      const entry = battleSkills(state, deps).find(
        (candidate) => candidate.skill.id === ref.skillId && candidate.actorId === actorId,
      );
      if (!entry) return denied('skill-unavailable');
      if (context.questionSkillKeys && !context.questionSkillKeys.has(`${actorId}:${ref.skillId}`)) {
        return denied('question-unavailable');
      }
      if (!canAfford(state, skill)) return denied('insufficient-gauge');
      return allowed(
        actorId,
        skillTargets(state, skill, actor),
        skill.costGauge > 0 ? [{ kind: 'gauge', subject: skill.subject, amount: skill.costGauge }] : [],
      );
    }
    case 'item': {
      const item = deps.items.get(ref.itemId);
      if (!item) return denied('unknown-item');
      if ((state.ally.items[item.id] ?? 0) <= 0) return denied('item-not-owned');
      if (item.kind !== 'consumable' || !item.use) return denied('item-unusable');
      if (item.use.recruit) {
        const monster = deps.monsters.get(state.enemy.refId);
        if (state.ruleset.recruitment.mode === 'disabled') return denied('boss-recruit-blocked');
        if (!monster || monster.recruitRate <= 0) return denied('enemy-not-recruitable');
        if (state.enemy.hp <= 0) return denied('enemy-unavailable');
        if (context.phase !== 'selection' && ref.hasActionResult !== true) {
          return denied('action-result-required');
        }
        if (
          !canUseMusubiDama({
            isBoss: false,
            hp: state.enemy.hp,
            recruitRate: monster.recruitRate,
          })
        ) {
          return denied('enemy-not-recruitable');
        }
        return allowed(
          state.ally.hero.id,
          [{ side: 'enemy', combatantId: state.enemy.id }],
          [{ kind: 'item', itemId: item.id, amount: 1 }],
        );
      }
      if (!canUseBattleItem(state, item)) return denied('item-no-effect');
      return allowed(
        state.ally.hero.id,
        [weakestAlly(state)],
        [{ kind: 'item', itemId: item.id, amount: 1 }],
      );
    }
    case 'swap': {
      const target = state.ally.monsters[ref.monsterIndex];
      if (!target) return denied('invalid-swap-target');
      if (ref.monsterIndex === state.ally.activeMonsterIndex) return denied('already-active');
      if (target.hp <= 0) return denied('target-defeated');
      return allowed(state.ally.hero.id, [
        { side: 'ally', combatantId: target.id, monsterIndex: ref.monsterIndex },
      ]);
    }
    case 'flee':
      return state.ruleset.flee.mode === 'blocked'
        ? denied('boss-flee-blocked')
        : allowed(state.ally.hero.id);
    case 'recruit': {
      if (context.storyCompanionUnlocked === false) return denied('recruit-locked');
      if (state.ruleset.recruitment.mode === 'disabled') return denied('boss-recruit-blocked');
      const monster = deps.monsters.get(state.enemy.refId);
      if (!monster || monster.recruitRate <= 0) return denied('enemy-not-recruitable');
      if (state.enemy.hp <= 0) return denied('enemy-unavailable');
      const gift = monster.recruitItem;
      if (ref.itemId !== undefined) {
        if (!gift || ref.itemId !== gift) return denied('invalid-recruit-gift');
        if ((state.ally.items[gift] ?? 0) <= 0) return denied('item-not-owned');
        return allowed(
          state.ally.hero.id,
          [{ side: 'enemy', combatantId: state.enemy.id }],
          [{ kind: 'item', itemId: gift, amount: 1 }],
        );
      }
      if (state.enemy.hp / Math.max(1, state.enemy.stats.hp) > deps.settings.recruitHpThreshold) {
        return denied('enemy-too-healthy');
      }
      return allowed(state.ally.hero.id, [{ side: 'enemy', combatantId: state.enemy.id }]);
    }
  }
}
