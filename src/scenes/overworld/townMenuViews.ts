import type { ContentIndex } from '../../core/content/loader';
import type { Item, Mission, Recipe, Reward } from '../../core/content/schemas';
import {
  canCraft,
  missionProgress,
  missionStatus,
  sellPrice,
  type ShopEntry,
} from '../../core/progression/town';
import type { GameState } from '../../core/state/schema';
import { itemIconUrl } from '../../rendering/itemIcons';
import type { TownRow } from '../../ui/field/TownOverlay';
import { t } from '../../ui/i18n';
import { itemKindLabel, itemStatText } from './menuEntries';

export function shopItemLines(item: Item, count: number, affordable: boolean): string[] {
  return [
    itemKindLabel(item),
    itemStatText(item),
    item.use?.heal ? t('field.bagHeal', { n: item.use.heal }) : '',
    t('field.townHave', { n: count }),
    affordable ? '' : t('field.townPoor'),
  ].filter(Boolean);
}

export function shopRows(
  stock: readonly ShopEntry[],
  items: ReadonlyMap<string, Item>,
  game: GameState,
): TownRow[] {
  const buyRows = stock.flatMap((entry): TownRow[] => {
    const item = items.get(entry.itemId);
    if (!item) return [];
    const affordable = game.player.gold >= entry.price;
    return [
      {
        key: item.id,
        name: item.name,
        icon: itemIconUrl(item),
        right: t('field.townPrice', { n: entry.price }),
        dim: !affordable,
        lines: shopItemLines(item, game.inventory[item.id] ?? 0, affordable),
        blurb: item.blurb,
        action: { label: t('field.townBuy', { n: entry.price }), ok: affordable },
      },
    ];
  });
  const sellRows = Object.entries(game.inventory).flatMap(([id, count]): TownRow[] => {
    const item = items.get(id);
    if (!item || count <= 0) return [];
    const price = sellPrice(item);
    if (price === null) return [];
    return [
      {
        key: `sell:${id}`,
        name: item.name,
        icon: itemIconUrl(item),
        right: t('field.townSellPrice', { n: price }),
        tag: t('field.townSell'),
        lines: [itemKindLabel(item), itemStatText(item), t('field.townHave', { n: count })].filter(Boolean),
        blurb: item.blurb,
        action: { label: t('field.townSellPrice', { n: price }), ok: true },
      },
    ];
  });
  return [...buyRows, ...sellRows];
}

export function smithRows(
  recipes: readonly Recipe[],
  items: ReadonlyMap<string, Item>,
  game: GameState,
): TownRow[] {
  return recipes.flatMap((recipe): TownRow[] => {
    const item = items.get(recipe.result.itemId);
    if (!item) return [];
    const craftable = canCraft(game, recipe);
    const lines = [
      t('field.townNeed'),
      ...recipe.materials.map((material) =>
        t('field.townNeedLine', {
          item: items.get(material.itemId)?.name ?? material.itemId,
          have: game.inventory[material.itemId] ?? 0,
          n: material.n,
        }),
      ),
      recipe.gold ? t('field.townCraftGold', { n: recipe.gold }) : '',
      craftable ? '' : t('field.townCantCraft'),
    ].filter(Boolean);
    return [
      {
        key: recipe.id,
        name: item.name,
        icon: itemIconUrl(item),
        tag: craftable ? t('field.townCraft') : undefined,
        dim: !craftable,
        lines,
        blurb: item.blurb,
        action: { label: t('field.townCraft'), ok: craftable },
      },
    ];
  });
}

const MISSION_STATUS_KEY = {
  new: 'field.missionNew',
  accepted: 'field.missionAccepted',
  ready: 'field.missionReady',
  done: 'field.missionDone',
} as const;

export function rewardSummary(reward: Reward, content: Pick<ContentIndex, 'items' | 'skills'>): string {
  const parts: string[] = [];
  if (reward.gold) parts.push(t('field.townRewardGold', { n: reward.gold }));
  if (reward.xp) parts.push(t('field.townRewardXp', { n: reward.xp }));
  for (const item of reward.items ?? [])
    parts.push(
      t('field.townRewardItem', {
        item: content.items.get(item.itemId)?.name ?? item.itemId,
        n: item.n ?? 1,
      }),
    );
  for (const skill of reward.skills ?? []) parts.push(content.skills.get(skill)?.name ?? skill);
  if (reward.recipes?.length) parts.push(t('field.townRewardRecipe'));
  if (reward.title) parts.push(t('field.townRewardTitle'));
  return parts.join('・');
}

export function missionRows(
  missions: readonly Mission[],
  content: Pick<ContentIndex, 'items' | 'skills'>,
  game: GameState,
): TownRow[] {
  return missions.map((mission) => {
    const status = missionStatus(game, mission);
    const progress = missionProgress(game, mission);
    const lines = [
      mission.hint ?? '',
      status === 'accepted' || status === 'ready'
        ? t('field.townProgress', { n: progress.have, need: progress.need })
        : '',
      t('field.townRewardLabel', { list: rewardSummary(mission.reward, content) }),
    ].filter(Boolean);
    return {
      key: mission.id,
      name: mission.title,
      tag: status === 'ready' ? t(MISSION_STATUS_KEY[status]) : undefined,
      sub: t(MISSION_STATUS_KEY[status]),
      dim: status === 'done',
      lines,
      action:
        status === 'done'
          ? null
          : status === 'new'
            ? { label: t('field.townAccept'), ok: true }
            : { label: t('field.townReport'), ok: status === 'ready' },
    };
  });
}
