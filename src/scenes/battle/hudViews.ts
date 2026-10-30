import { battleSkills, frontAlly, makeCompanion, SUBJECTS, type BattleDeps } from '../../core/battle/engine';
import {
  evaluateBattleCommand,
  type BattleCommandEvaluationContext,
} from '../../core/battle/commandEvaluation';
import type { BattleState, Combatant } from '../../core/battle/types';
import type { ContentIndex } from '../../core/content/loader';
import { heroLevel, xpToNextLevel } from '../../core/progression/battleResult';
import type { GameState } from '../../core/state/schema';
import type { Item, Skill } from '../../core/content/schemas';
import type { QuestionQuery } from '../../questions/contracts';
import type {
  AllyView,
  CommandOption,
  EnemyView,
  ItemOption,
  SkillOption,
  SubjectGaugeView,
  SwapOption,
} from '../../ui/battle/store';
import { itemIconUrl } from '../../rendering/itemIcons';
import { t } from '../../ui/i18n';
import { buildStatusEffects } from './statusEffectViews';

const selectionContext = (context: BattleCommandEvaluationContext = {}): BattleCommandEvaluationContext => ({
  ...context,
  phase: 'selection',
});

export function battleItemAvailability(
  state: BattleState,
  item: Item,
  content: ContentIndex,
  context: BattleCommandEvaluationContext = {},
): Pick<ItemOption, 'disabled' | 'blockReason' | 'reason'> {
  const evaluation = evaluateBattleCommand(
    state,
    { kind: 'item', itemId: item.id, hasActionResult: false },
    content,
    selectionContext(context),
  );
  return {
    disabled: !evaluation.allowed,
    ...(evaluation.reason ? { blockReason: evaluation.reason } : {}),
    ...(item.use?.recruit && !evaluation.allowed ? { reason: t('battle.musubiUnavailable') } : {}),
  };
}

export function buildEnemyView(state: BattleState, hp = state.enemy.hp): EnemyView {
  const enemy = state.enemy;
  return {
    name: enemy.name,
    level: enemy.level,
    hp,
    maxHp: enemy.stats.hp,
    element: enemy.element,
    weakness: enemy.weakness,
    weaknessRevealed: enemy.weaknessRevealed,
    isBoss: state.isBossBattle,
    defMult: enemy.buffs.def?.mult ?? 1,
    effects: buildStatusEffects(enemy, enemy.skipTurns),
  };
}

export function buildAllyViews(state: BattleState, game: GameState, content: ContentIndex): AllyView[] {
  const table = content.xp.hero;
  const { ratio } = xpToNextLevel(table, heroLevel(game, table), game.player.xp, game.player.levelCap);
  const front = frontAlly(state);
  const view = (combatant: Combatant, extra: Partial<AllyView>): AllyView => ({
    id: combatant.id,
    name: combatant.name,
    level: combatant.level,
    hp: combatant.hp,
    maxHp: combatant.stats.hp,
    element: combatant.element,
    isHero: combatant.isHero,
    defMult: combatant.buffs.def?.mult ?? 1,
    effects: buildStatusEffects(combatant),
    front: combatant.id === front.id,
    ...extra,
  });
  const hero = view(state.ally.hero, { xpRatio: ratio });
  const partner = state.ally.monsters[state.ally.activeMonsterIndex];
  if (!partner) return [hero];
  const companion = state.companion?.id === partner.id ? state.companion : null;
  return [hero, view(partner, { passive: companion?.passiveSkill?.subject })];
}

export function buildGaugeViews(
  state: BattleState,
  deps: BattleDeps,
  content: ContentIndex,
  previous: readonly SubjectGaugeView[],
): SubjectGaugeView[] {
  const max = content.settings.subjectGauge.max;
  const skills = battleSkills(state, deps);
  const boost = state.companion?.passiveSkill?.subject;
  return SUBJECTS.filter((subject) => skills.some((entry) => entry.skill.subject === subject)).map(
    (subject) => ({
      subject,
      value: state.player.subjectGauges[subject],
      max,
      marks: [
        ...new Set(
          skills
            .filter(
              (entry) =>
                entry.skill.subject === subject && entry.skill.costGauge > 0 && entry.skill.costGauge < max,
            )
            .map((entry) => entry.skill.costGauge),
        ),
      ],
      boosted: boost === subject,
      gain: previous.find((gauge) => gauge.subject === subject)?.gain,
    }),
  );
}

export function buildItemOptions(
  state: BattleState,
  content: ContentIndex,
  context: BattleCommandEvaluationContext = {},
): ItemOption[] {
  return Object.entries(state.ally.items).flatMap(([id, count]) => {
    const item = content.items.get(id);
    if (!item || count <= 0) return [];
    const availability = battleItemAvailability(state, item, content, context);
    if (availability.blockReason === 'item-unusable' || availability.blockReason === 'item-no-effect') {
      return [];
    }
    return [
      {
        id,
        name: item.name,
        count,
        blurb: item.blurb,
        icon: itemIconUrl(item),
        ...availability,
      },
    ];
  });
}

export function buildSwapOptions(
  state: BattleState,
  deps: BattleDeps,
  context: BattleCommandEvaluationContext = {},
): SwapOption[] {
  const ally = state.ally;
  return ally.monsters.map((monster, index) => {
    const evaluation = evaluateBattleCommand(
      state,
      { kind: 'swap', monsterIndex: index },
      deps,
      selectionContext(context),
    );
    return {
      index,
      name: monster.name,
      level: monster.level,
      hp: monster.hp,
      maxHp: monster.stats.hp,
      element: monster.element,
      passive: makeCompanion(monster, deps)?.passiveSkill?.subject,
      disabled: !evaluation.allowed,
      ...(evaluation.reason ? { blockReason: evaluation.reason } : {}),
      active: index === ally.activeMonsterIndex,
    };
  });
}

export function buildSkillOptions(input: {
  state: BattleState;
  deps: BattleDeps;
  context: BattleCommandEvaluationContext;
  queryFor: (skill: Skill) => QuestionQuery;
  nameOf: (id: string) => string;
  preparingLabel: string;
}): SkillOption[] {
  const { state, deps } = input;
  return battleSkills(state, deps).map(({ skill, actorId }) => {
    const evaluation = evaluateBattleCommand(
      state,
      { kind: 'skill', skillId: skill.id, actorId },
      deps,
      selectionContext(input.context),
    );
    return {
      key: `${actorId}:${skill.id}`,
      id: skill.id,
      actorId,
      by: actorId === state.ally.hero.id ? undefined : input.nameOf(actorId),
      name: skill.name,
      subject: skill.subject,
      gradeRange: input.queryFor(skill).gradeRange,
      element: skill.element,
      stars: skill.gauge,
      cost: skill.costGauge,
      have: state.player.subjectGauges[skill.subject],
      effect: skill.effect,
      flavor: skill.flavor,
      disabled: !evaluation.allowed,
      ...(evaluation.reason ? { blockReason: evaluation.reason } : {}),
      reason: evaluation.reason === 'question-unavailable' ? input.preparingLabel : undefined,
    };
  });
}

export function buildCommandOptions(input: {
  state: BattleState;
  deps: BattleDeps;
  context: BattleCommandEvaluationContext;
}): CommandOption[] {
  const { state, deps } = input;
  const context = selectionContext(input.context);
  const skills = battleSkills(state, deps).map((entry) => ({
    entry,
    evaluation: evaluateBattleCommand(
      state,
      { kind: 'skill', skillId: entry.skill.id, actorId: entry.actorId },
      deps,
      context,
    ),
  }));
  const items = Object.entries(state.ally.items)
    .filter(([, count]) => count > 0)
    .map(([itemId]) =>
      evaluateBattleCommand(state, { kind: 'item', itemId, hasActionResult: false }, deps, context),
    );
  const swaps = state.ally.monsters.map((_, monsterIndex) =>
    evaluateBattleCommand(state, { kind: 'swap', monsterIndex }, deps, context),
  );
  const recruitItem = deps.monsters.get(state.enemy.refId)?.recruitItem;
  const recruit = evaluateBattleCommand(
    state,
    {
      kind: 'recruit',
      itemId: recruitItem && (state.ally.items[recruitItem] ?? 0) > 0 ? recruitItem : undefined,
    },
    deps,
    context,
  );
  const flee = evaluateBattleCommand(state, { kind: 'flee' }, deps, context);
  const skillAllowed = skills.some(({ evaluation }) => evaluation.allowed);
  const itemAllowed = items.some((evaluation) => evaluation.allowed);
  const swapAllowed = swaps.some((evaluation) => evaluation.allowed);
  const special = skills.some(({ entry, evaluation }) => entry.skill.costGauge > 0 && evaluation.allowed);
  const list: CommandOption[] = [
    {
      kind: 'skill',
      disabled: !skillAllowed,
      glow: special,
      ...(!skillAllowed && skills[0]?.evaluation.reason ? { blockReason: skills[0].evaluation.reason } : {}),
    },
    {
      kind: 'item',
      disabled: !itemAllowed,
      ...(!itemAllowed && items[0]?.reason ? { blockReason: items[0].reason } : {}),
    },
    {
      kind: 'swap',
      disabled: !swapAllowed,
      ...(!swapAllowed && swaps[0]?.reason ? { blockReason: swaps[0].reason } : {}),
    },
    recruit.allowed
      ? { kind: 'recruit', disabled: false, glow: true }
      : {
          kind: 'flee',
          disabled: !flee.allowed,
          ...(flee.reason ? { blockReason: flee.reason } : {}),
        },
  ];
  return list;
}
