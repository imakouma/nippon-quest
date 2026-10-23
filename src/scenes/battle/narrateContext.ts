import type { ContentIndex } from '../../core/content/loader';
import type { BattleState } from '../../core/battle/types';
import { t } from '../../ui/i18n';
import type { NarrateCtx } from './narrate';

export function buildNarrateContext(
  state: BattleState,
  content: ContentIndex,
  nameOf: (id: string) => string,
): NarrateCtx {
  return {
    nameOf,
    skillName: (id) => content.skills.get(id)?.name ?? id,
    itemName: (id) => content.items.get(id)?.name ?? id,
    elementName: (element) => t(`elements.${element}`),
    subjectName: (subject) => t(`subjects.${subject}`),
    enemyName: state.enemy.name,
    isBossBattle: state.isBossBattle,
  };
}
