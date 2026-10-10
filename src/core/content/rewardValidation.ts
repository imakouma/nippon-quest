type RewardLike = {
  items?: { itemId: string }[];
  skills?: string[];
  recipes?: string[];
  unlockMonsters?: string[];
};

type RewardContentIndex = {
  items: ReadonlyMap<string, unknown>;
  skills: ReadonlyMap<string, unknown>;
  recipes: ReadonlyMap<string, unknown>;
  monsters: ReadonlyMap<string, unknown>;
};

/** 報酬が参照するコンテンツと、同一報酬内の重複を検証する。 */
export function checkRewardReferences(
  reward: RewardLike,
  content: RewardContentIndex,
  where: string,
): string[] {
  const errors: string[] = [];
  const checkUnique = (ids: Iterable<string>, label: string): void => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errors.push(`${where}: reward ${label} "${id}" が重複しています`);
      seen.add(id);
    }
  };

  checkUnique(
    (reward.items ?? []).map((item) => item.itemId),
    'item',
  );
  checkUnique(reward.skills ?? [], 'skill');
  checkUnique(reward.recipes ?? [], 'recipe');
  checkUnique(reward.unlockMonsters ?? [], 'unlockMonsters');
  for (const item of reward.items ?? [])
    if (!content.items.has(item.itemId)) errors.push(`${where}: reward item "${item.itemId}" が存在しません`);
  for (const skill of reward.skills ?? [])
    if (!content.skills.has(skill)) errors.push(`${where}: reward skill "${skill}" が存在しません`);
  for (const recipe of reward.recipes ?? [])
    if (!content.recipes.has(recipe)) errors.push(`${where}: reward recipe "${recipe}" が存在しません`);
  for (const monster of reward.unlockMonsters ?? [])
    if (!content.monsters.has(monster))
      errors.push(`${where}: reward unlockMonsters "${monster}" が存在しません`);
  return errors;
}
