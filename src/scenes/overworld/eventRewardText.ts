import type { RewardLine } from '../../core/progression/eventReward';
import type { DialogueLine } from '../../ui/dialogue';
import { t } from '../../ui/i18n';

export interface FieldRewardContent {
  items: ReadonlyMap<string, { name: string }>;
  skills: ReadonlyMap<string, { name: string }>;
  recipes: ReadonlyMap<string, { result: { itemId: string } }>;
}

export function fieldRewardText(line: RewardLine, content?: FieldRewardContent): string {
  switch (line.kind) {
    case 'xp':
      return t('field.rewardXp', { n: line.n });
    case 'gold':
      return t('field.rewardGold', { n: line.n });
    case 'item':
      return t('field.rewardItem', { item: content?.items.get(line.id)?.name ?? line.id, n: line.n });
    case 'skill':
      return t('field.rewardSkill', { skill: content?.skills.get(line.id)?.name ?? line.id });
    case 'recipe': {
      const recipe = content?.recipes.get(line.id);
      return t('field.rewardRecipe', {
        item: (recipe && content?.items.get(recipe.result.itemId)?.name) ?? line.id,
      });
    }
    case 'title':
      return t('field.rewardTitle', { title: line.id });
    case 'monster':
      return t('field.rewardMonster');
  }
}

export function fieldRewardDialogue(
  lines: readonly RewardLine[],
  content?: FieldRewardContent,
): DialogueLine[] {
  return lines.map((line) => ({ speaker: t('field.rewardSpeaker'), text: fieldRewardText(line, content) }));
}
