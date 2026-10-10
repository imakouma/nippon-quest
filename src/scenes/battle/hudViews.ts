import {
  battleSkills,
  canAfford,
  canUseBattleItem,
  frontAlly,
  makeCompanion,
  SUBJECTS,
  type BattleDeps,
} from '../../core/battle/engine';
import type { BattleState, Combatant } from '../../core/battle/types';
import type { ContentIndex } from '../../core/content/loader';
import { heroLevel, xpToNextLevel } from '../../core/progression/battleResult';
import type { GameState } from '../../core/state/schema';
import type { Skill } from '../../core/content/schemas';
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
  };
}

export function buildAllyViews(state: BattleState, game: GameState, content: ContentIndex): AllyView[] {
  const table = content.xp.hero;
  const { ratio } = xpToNextLevel(table, heroLevel(game, table), game.player.xp);
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

export function buildItemOptions(state: BattleState, content: ContentIndex): ItemOption[] {
  return Object.entries(state.ally.items).flatMap(([id, count]) => {
    const item = content.items.get(id);
    if (!item || count <= 0 || !canUseBattleItem(state, item)) return [];
    return [{ id, name: item.name, count, blurb: item.blurb, icon: itemIconUrl(item) }];
  });
}

export function buildSwapOptions(state: BattleState, deps: BattleDeps): SwapOption[] {
  const ally = state.ally;
  return ally.monsters.map((monster, index) => ({
    index,
    name: monster.name,
    level: monster.level,
    hp: monster.hp,
    maxHp: monster.stats.hp,
    element: monster.element,
    passive: makeCompanion(monster, deps)?.passiveSkill?.subject,
    disabled: index === ally.activeMonsterIndex || monster.hp <= 0,
    active: index === ally.activeMonsterIndex,
  }));
}

export function buildSkillOptions(input: {
  state: BattleState;
  deps: BattleDeps;
  queryFor: (skill: Skill) => QuestionQuery;
  hasQuestion: (skill: Skill) => boolean;
  nameOf: (id: string) => string;
  preparingLabel: string;
}): SkillOption[] {
  const { state, deps } = input;
  return battleSkills(state, deps).map(({ skill, actorId }) => {
    const noQuestion = !input.hasQuestion(skill);
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
      disabled: noQuestion || !canAfford(state, skill),
      reason: noQuestion ? input.preparingLabel : undefined,
    };
  });
}

export function buildCommandOptions(input: {
  state: BattleState;
  deps: BattleDeps;
  hasQuestion: (skill: Skill) => boolean;
  itemCount: number;
  canRecruit: boolean;
}): CommandOption[] {
  const { state, deps } = input;
  const skills = battleSkills(state, deps);
  const special = skills.some(
    ({ skill }) => skill.costGauge > 0 && canAfford(state, skill) && input.hasQuestion(skill),
  );
  const list: CommandOption[] = [
    { kind: 'skill', disabled: skills.length === 0, glow: special },
    { kind: 'item', disabled: input.itemCount === 0 },
    {
      kind: 'swap',
      disabled: !state.ally.monsters.some(
        (monster, index) => index !== state.ally.activeMonsterIndex && monster.hp > 0,
      ),
    },
    input.canRecruit
      ? { kind: 'recruit', disabled: false, glow: true }
      : { kind: 'flee', disabled: state.isBossBattle },
  ];
  return list;
}
