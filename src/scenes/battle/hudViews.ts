import { battleSkills, frontAlly, SUBJECTS, type BattleDeps } from '../../core/battle/engine';
import type { BattleState, Combatant } from '../../core/battle/types';
import type { ContentIndex } from '../../core/content/loader';
import { heroLevel, xpToNextLevel } from '../../core/progression/battleResult';
import type { GameState } from '../../core/state/schema';
import type { AllyView, EnemyView, SubjectGaugeView } from '../../ui/battle/store';

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
