import type { ContentIndex } from '../../core/content/loader';
import type { Item } from '../../core/content/schemas';
import { equipmentUnlocked } from '../../core/progression/bag';
import { EQUIP_SLOTS, isEquip } from '../../core/progression/inventory';
import type { GameState } from '../../core/state/schema';
import { STARTER_EQUIPMENT_ID } from '../../core/state/starter';
import { itemIconUrl } from '../../rendering/itemIcons';
import type { BagThing } from '../../ui/field/BagOverlay';
import { t } from '../../ui/i18n';
import { itemStatText } from './menuEntries';

function equipmentThing(it: Item, key: string, count?: number): BagThing {
  return {
    key,
    kind: 'equip',
    equipSlot: it.kind,
    name: it.name,
    icon: itemIconUrl(it),
    art: itemIconUrl(it),
    cost: 1,
    size: { w: 1, h: 1 },
    inBag: key.startsWith('eq:'),
    count,
    sub: t('field.equipSlot', { slot: t(`slots.${it.kind}`) }),
    lines: [itemStatText(it), count === undefined ? '' : t('field.townHave', { n: count })].filter(Boolean),
    blurb: it.blurb,
  };
}

export function equippedBagThings(gs: GameState, content: ContentIndex): BagThing[] {
  return EQUIP_SLOTS.flatMap((slot) => {
    const item = content.items.get(gs.player.equipment[slot] ?? '');
    return item && (equipmentUnlocked(gs) || item.id === STARTER_EQUIPMENT_ID)
      ? [equipmentThing(item, `eq:${slot}`)]
      : [];
  });
}

export function storedBagThings(gs: GameState, content: ContentIndex): BagThing[] {
  const rank = (item: Item) => (EQUIP_SLOTS as readonly string[]).indexOf(item.kind);
  const rows = Object.entries(gs.inventory).flatMap(([id, count]): { item: Item; count: number }[] => {
    const item = content.items.get(id);
    return item && count > 0 ? [{ item, count }] : [];
  });
  const tools = rows.flatMap(({ item, count }): BagThing[] => {
    if (isEquip(item)) return [];
    return [
      {
        key: `item:${item.id}`,
        kind: 'item',
        name: item.name,
        icon: itemIconUrl(item),
        art: itemIconUrl(item),
        cost: 0,
        inBag: gs.party.bagItems.includes(item.id),
        count,
        sub: t(
          item.kind === 'consumable'
            ? 'field.itemKindTool'
            : item.kind === 'material'
              ? 'field.itemKindMaterial'
              : 'field.itemKindKey',
        ),
        lines: [item.use?.heal ? t('field.bagHeal', { n: item.use.heal }) : ''].filter(Boolean),
        blurb: item.blurb,
        action: item.kind === 'consumable' && !!item.use ? 'pack' : undefined,
      },
    ];
  });
  if (!equipmentUnlocked(gs)) {
    const starter = rows.find(({ item }) => item.id === STARTER_EQUIPMENT_ID);
    return starter
      ? [...tools, equipmentThing(starter.item, `inv:${starter.item.id}`, starter.count)]
      : tools;
  }
  return [
    ...tools,
    ...rows
      .filter(({ item }) => isEquip(item))
      .sort((a, b) => rank(a.item) - rank(b.item))
      .map(({ item, count }) => equipmentThing(item, `inv:${item.id}`, count)),
  ];
}
