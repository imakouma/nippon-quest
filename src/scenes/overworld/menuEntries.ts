import type { ContentIndex } from '../../core/content/loader';
import type { Item } from '../../core/content/schemas';
import { canUse, EQUIP_SLOTS, isEquip } from '../../core/progression/inventory';
import type { GameState } from '../../core/state/schema';
import type { QuestionBank } from '../../questions/engine';
import type { MenuEntry, MenuTab } from '../../shared/menuModel';
import { t } from '../../ui/i18n';
import { itemIconUrl } from '../art/itemIcons';

type HeroStats = { hp: number; mp: number; atk: number; def: number; spd: number; wis: number };
type MenuView = { entries: MenuEntry[]; summary?: string; empty: string };

export function menuTabs(mistakeCount: number): {
  key: MenuTab;
  label: string;
  icon: string;
  count?: string;
  group?: string;
}[] {
  return [
    { key: 'roadmap', label: t('field.tabRoadmap'), icon: 'star' },
    {
      key: 'mistakes',
      label: t('field.tabMistakes'),
      icon: 'cmd-scan',
      count: String(mistakeCount),
    },
    { key: 'monsters', label: t('field.tabMonsters'), group: t('field.dexGroup'), icon: 'boss' },
    { key: 'specialties', label: t('field.tabSpecialties'), group: t('field.dexGroup'), icon: 'star' },
    { key: 'bag', label: t('field.tabBag'), icon: 'role-shop' },
    { key: 'equip', label: t('field.tabEquip'), icon: 'role-smith' },
    { key: 'look', label: t('field.tabLook'), icon: 'hero' },
  ];
}

export function mistakeMenu(content: ContentIndex, gs: GameState, bank?: QuestionBank): MenuView {
  const entries = gs.learning.mistakes
    .map((id): MenuEntry | null => {
      const question = bank?.get(id);
      if (!question) return null;
      const payload = question.payload as Record<string, unknown>;
      const prompt = typeof payload.prompt === 'string' ? payload.prompt : question.id;
      return {
        key: question.id,
        name: prompt,
        known: true,
        right: t('field.mistakeGrade', { n: question.grade }),
        sub: t(`subjects.${question.subject}`),
        lines: [
          t('field.mistakeUnit', { unit: content.units.get(question.unit)?.name ?? question.unit }),
          t('field.mistakeType', { type: question.type }),
        ],
        blurb: question.explanation ?? t('field.mistakeNoExplanation'),
      };
    })
    .filter((entry): entry is MenuEntry => entry !== null);
  return {
    entries,
    summary: t('field.mistakeSummary', { n: entries.length }),
    empty: t('field.mistakeEmpty'),
  };
}

export function bagMenu(
  content: ContentIndex,
  gs: GameState,
  stats: HeroStats,
  statText: (item: Item) => string,
  kindLabel: (item: Item) => string,
): MenuView {
  const order = ['consumable', 'weapon', 'head', 'chest', 'legs', 'feet', 'material', 'key'];
  const max = { hp: stats.hp, mp: stats.mp };
  const entries = Object.entries(gs.inventory)
    .filter(([id, count]) => count > 0 && content.items.has(id))
    .map(([id, count]) => ({ item: content.items.get(id)!, count }))
    .sort((a, b) => order.indexOf(a.item.kind) - order.indexOf(b.item.kind))
    .map(({ item, count }): MenuEntry => {
      const lines = [t('field.townHave', { n: count })];
      if (item.use?.heal) lines.push(t('field.bagHeal', { n: item.use.heal }));
      if (isEquip(item) && item.stats) lines.push(statText(item));
      return {
        key: item.id,
        name: item.name,
        icon: itemIconUrl(item),
        known: true,
        right: t('battle.itemCount', { n: count }),
        sub: kindLabel(item),
        lines,
        blurb: item.blurb,
        action: isEquip(item)
          ? { label: t('field.bagEquip'), ok: true }
          : item.kind === 'consumable' && item.use
            ? { label: t('field.bagUse'), ok: canUse(gs, item, max) }
            : null,
      };
    });
  return {
    entries,
    summary: t('field.menuHp', { hp: gs.player.hp, max: stats.hp, gold: gs.player.gold }),
    empty: t('field.bagEmpty'),
  };
}

export function equipmentMenu(
  content: ContentIndex,
  gs: GameState,
  stats: HeroStats,
  statText: (item: Item) => string,
): MenuView {
  const entries = EQUIP_SLOTS.map((slot): MenuEntry => {
    const id = gs.player.equipment[slot];
    const item = id ? content.items.get(id) : undefined;
    return {
      key: `slot:${slot}`,
      name: item ? item.name : t('field.equipNone'),
      icon: item ? itemIconUrl(item) : undefined,
      known: true,
      right: t(`slots.${slot}`),
      sub: t('field.equipSlot', { slot: t(`slots.${slot}`) }),
      lines: item ? [statText(item)].filter(Boolean) : [t('field.equipEmptyHint')],
      blurb: item?.blurb,
      action: item ? { label: t('field.bagUnequip'), ok: true } : null,
    };
  });
  return {
    entries,
    summary: t('field.equipStats', {
      hp: gs.player.hp,
      max: stats.hp,
      atk: stats.atk,
      def: stats.def,
      spd: stats.spd,
      wis: stats.wis,
    }),
    empty: t('field.dexEmpty'),
  };
}
