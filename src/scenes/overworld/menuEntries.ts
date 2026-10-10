import type { ContentIndex } from '../../core/content/loader';
import type { Item, Monster, Motif } from '../../core/content/schemas';
import { canUse, EQUIP_SLOTS, isEquip } from '../../core/progression/inventory';
import { monsterSize } from '../../core/progression/bag';
import { specialtyTreasureBonus } from '../../core/progression/specialty';
import type { GameState } from '../../core/state/schema';
import type { QuestionBank } from '../../questions/engine';
import type { MenuEntry, MenuHomeKey, MenuTab } from '../../shared/menuModel';
import { t } from '../../ui/i18n';
import { itemIconUrl } from '../../rendering/itemIcons';
import { stripRuby } from '../../ui/ruby';
import { monsterCatalog, specialtyCatalog } from './catalogs';
import { dexRegionOf } from './geography';

type HeroStats = { hp: number; mp: number; atk: number; def: number; spd: number; wis: number };
type MenuView = { entries: MenuEntry[]; summary?: string; empty: string };
type HeroLook = GameState['player']['appearance'];

const MOTIF_KIND_KEY: Record<Motif['kind'], string> = {
  landmark: 'field.motifLandmark',
  food: 'field.motifFood',
  craft: 'field.motifCraft',
  nature: 'field.motifNature',
  festival: 'field.motifFestival',
  history: 'field.motifHistory',
};

export const motifKindLabelKey = (kind: Motif['kind']): string => MOTIF_KIND_KEY[kind];

const STAT_LABELS: Readonly<Record<string, string>> = {
  hp: 'field.statHp',
  atk: 'field.statAtk',
  def: 'field.statDef',
  spd: 'field.statSpd',
  wis: 'field.statWis',
};

export function itemStatText(item: Item): string {
  return Object.entries(item.stats ?? {})
    .map(([key, value]) => `${STAT_LABELS[key] ? t(STAT_LABELS[key]) : key.toUpperCase()}+${value}`)
    .join('　');
}

export function itemKindLabel(item: Item): string {
  if (item.kind === 'consumable') return t('field.itemKindTool');
  if (item.kind === 'material') return t('field.itemKindMaterial');
  if (item.kind === 'key') return t('field.itemKindKey');
  return t('field.itemKindEquip', { slot: t(`slots.${item.kind}`) });
}

export const LOOK_PARTS: readonly { part: keyof HeroLook; key: string }[] = [
  { part: 'hair', key: 'lookHair' },
  { part: 'skin', key: 'lookSkin' },
  { part: 'cloth', key: 'lookCloth' },
  { part: 'hairStyle', key: 'lookHairStyle' },
  { part: 'eyes', key: 'lookEyes' },
];

export function menuTabs(mistakeCount: number): {
  key: MenuHomeKey;
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
    { key: 'monsters', label: t('field.dexGroup'), icon: 'boss' },
    { key: 'party', label: t('field.bagTitle'), icon: 'cmd-item' },
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

export interface MenuViewInput {
  content: ContentIndex;
  game: GameState;
  tab: MenuTab;
  stats: HeroStats;
  revealAll: boolean;
  bank?: QuestionBank;
  heroArt: (look: HeroLook) => string;
  monsterArt: (monster: Monster) => string;
}

/** 床屋で選べる見た目。選択中は無料表示、変更候補は料金と所持金で可否を示す。 */
export function barberRows(
  game: GameState,
  heroArt: (look: HeroLook) => string,
  price: number,
): Array<MenuEntry & { action: { label: string; ok: boolean } | null }> {
  const appearance = game.player.appearance;
  return LOOK_PARTS.flatMap(({ part, key }) =>
    t(`field.${key}Names`)
      .split(',')
      .map((name, index): MenuEntry & { action: { label: string; ok: boolean } | null } => {
        const look = { ...appearance, [part]: index };
        const selected = appearance[part] === index;
        const affordable = game.player.gold >= price;
        const art = heroArt(look);
        return {
          key: `look:${part}:${index}`,
          name: t('field.lookName', { part: t(`field.${key}`), name }),
          icon: art,
          art,
          known: true,
          tag: selected ? t('field.lookNow') : undefined,
          right: selected ? undefined : t('field.townPrice', { n: price }),
          sub: t('field.lookSub', { part: t(`field.${key}`) }),
          lines: selected ? [t('field.barberCurrent')] : [t('field.barberPrice', { n: price })],
          action: selected ? null : { label: t('field.barberChange', { n: price }), ok: affordable },
        };
      }),
  );
}

/** Scene状態を参照せず、フィールドメニューの表示モデルを組み立てる。 */
export function buildMenuView(input: MenuViewInput): MenuView {
  const { content, game, tab, stats } = input;
  const unknown = t('field.dexUnknown');
  const areaName = (id: string) => content.areas.get(id)?.name ?? unknown;

  if (tab === 'roadmap') return { entries: [], empty: '' };
  if (tab === 'mistakes') return mistakeMenu(content, game, input.bank);

  if (tab === 'monsters') {
    const owned = new Set(game.party.owned.map((entry) => entry.monsterId));
    const monsters = monsterCatalog(content, game, input.revealAll);
    const entries = monsters.map(({ m, known }, index): MenuEntry => {
      const art = input.monsterArt(m);
      const area = t('field.dexArea', { area: areaName(m.area) });
      const region = dexRegionOf(m.area);
      return {
        key: m.id,
        name: known ? m.name : unknown,
        group: region.id,
        groupLabel: t(region.nameKey),
        icon: art,
        art,
        bagSize: monsterSize(m.id, content.monsters),
        known,
        right: t('field.dexNo', { n: String(index + 1).padStart(3, '0') }),
        detailIndex: `${index + 1}/${monsters.length}`,
        tag: owned.has(m.id) ? t('field.dexOwned') : undefined,
        sub: known ? t(`elements.${m.element}`) : undefined,
        lines: known
          ? [
              area,
              m.weakness
                ? t('field.dexWeak', { el: t(`elements.${m.weakness}`) })
                : t('battle.weaknessUnknown'),
            ]
          : [area, t('field.dexNotSeen')],
        blurb: known ? m.dexBlurb : undefined,
        action: null,
      };
    });
    return { entries, empty: t('field.dexEmpty') };
  }

  if (tab === 'specialties') {
    const specialties = specialtyCatalog(content, game, input.revealAll);
    const treasure = specialtyTreasureBonus(game, content.areas, content.items);
    const percent = (rate: number) => Math.round(rate * 1000) / 10;
    const entries = specialties.map(({ area, motif, itemId, item, known }, index): MenuEntry => {
      const region = dexRegionOf(area.id);
      const areaTreasure = treasure.byArea.get(area.id)!;
      return {
        key: itemId,
        name: known ? motif.name : unknown,
        group: region.id,
        groupLabel: t(region.nameKey),
        icon: item ? itemIconUrl(item) : undefined,
        known,
        right: stripRuby(area.name, 'kana'),
        detailIndex: `${index + 1}/${specialties.length}`,
        sub: t(motifKindLabelKey(motif.kind)),
        lines: known
          ? [
              t('field.dexFrom', { area: area.name }),
              t('field.specialtyAreaBonus', {
                n: areaTreasure.found,
                total: areaTreasure.total,
                p: percent(areaTreasure.rate),
              }),
              ...(item?.use?.heal ? [t('field.bagHeal', { n: item.use.heal })] : []),
              t('field.townHave', { n: game.inventory[itemId] ?? 0 }),
            ]
          : [t('field.dexFrom', { area: area.name }), t('field.dexNotFound')],
        blurb: known ? motif.blurb : undefined,
        action: null,
      };
    });
    return {
      entries,
      summary: t('field.specialtyBonusSummary', {
        p: percent(treasure.rate),
        n: treasure.found,
        total: treasure.total,
      }),
      empty: t('field.dexEmpty'),
    };
  }

  if (tab === 'bag') return bagMenu(content, game, stats, itemStatText, itemKindLabel);

  return equipmentMenu(content, game, stats, itemStatText);
}
