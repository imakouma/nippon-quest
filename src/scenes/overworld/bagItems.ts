import type { ContentIndex } from '../../core/content/loader';
import type { Item } from '../../core/content/schemas';
import { bagContext, equipmentUnlocked, evolveRoom } from '../../core/progression/bag';
import { xpToNextLevel } from '../../core/progression/battleResult';
import { TRIAL_CORE_ID } from '../../core/progression/eventReward';
import { evolve, skillChanges } from '../../core/progression/evolution';
import { EQUIP_SLOTS, isEquip } from '../../core/progression/inventory';
import { LEARNING_FRAGMENT_ID } from '../../core/progression/learningRewards';
import {
  previewLevelCapUnlock,
  type LevelCapRules,
  type LevelCapTarget,
} from '../../core/progression/levelCap';
import { GROWTH_MAGATAMA_ID, unlockLevelCap } from '../../core/progression/levelCapUnlock';
import type { GameState } from '../../core/state/schema';
import { STARTER_EQUIPMENT_ID } from '../../core/state/starter';
import { itemIconUrl } from '../../rendering/itemIcons';
import type { BagThing } from '../../ui/field/BagOverlay';
import { t } from '../../ui/i18n';
import { itemStatText } from './menuEntries';

export interface LevelCapBagTarget extends LevelCapTarget {
  xp: number;
}

export interface LevelCapBagView {
  lines: string[];
  canUnlock: boolean;
  levelCap: number;
  maximum: number;
}

export function levelCapBagView(
  gs: GameState,
  target: LevelCapBagTarget,
  table: readonly number[],
  rules: LevelCapRules,
): LevelCapBagView {
  const maximum = target.kind === 'hero' ? rules.heroMaximum : rules.monsterMaximum;
  const step = target.kind === 'hero' && target.levelCap >= 100 ? rules.heroPost100Step : rules.standardStep;
  const nextCap = Math.min(maximum, target.levelCap + step);
  const fragments = gs.inventory[LEARNING_FRAGMENT_ID] ?? 0;
  const cores = gs.inventory[TRIAL_CORE_ID] ?? 0;
  const preview = previewLevelCapUnlock(target, { learningFragments: fragments, trialCores: cores }, rules);
  const bankedXp =
    target.level >= target.levelCap ? Math.max(0, target.xp - (table[target.levelCap - 1] ?? target.xp)) : 0;
  return {
    canUnlock: preview.ok,
    levelCap: target.levelCap,
    maximum,
    lines: [
      t('field.levelCapCurrent', { level: target.level, cap: target.levelCap, max: maximum }),
      target.levelCap >= maximum
        ? t('field.levelCapMaximum')
        : t('field.levelCapNext', { next: nextCap, amount: nextCap - target.levelCap }),
      t('field.levelCapMaterials', {
        fragments,
        fragmentNeed: rules.learningFragmentsPerUnlock,
        cores,
        coreNeed: rules.trialCoresPerUnlock,
      }),
      ...(bankedXp > 0 ? [t('field.levelCapBankedXp', { n: bankedXp })] : []),
    ],
  };
}

function levelCapBagThing(
  gs: GameState,
  target: LevelCapBagTarget,
  table: readonly number[],
  content: ContentIndex,
  extraLines: string[] = [],
): Pick<BagThing, 'growth' | 'lines'> {
  const growth = levelCapBagView(gs, target, table, content.settings.levelCaps);
  return {
    growth,
    lines: [
      ...growth.lines,
      ...(target.level < target.levelCap
        ? [levelProgressLine(table, target.level, target.xp, target.levelCap)]
        : []),
      ...extraLines,
    ],
  };
}

export const heroLevelCapBagThing = (
  gs: GameState,
  level: number,
  content: ContentIndex,
  extraLines: string[] = [],
) =>
  levelCapBagThing(
    gs,
    { kind: 'hero', level, levelCap: gs.player.levelCap, xp: gs.player.xp },
    content.xp.hero,
    content,
    extraLines,
  );

export const monsterLevelCapBagThing = (
  gs: GameState,
  monster: GameState['party']['owned'][number],
  content: ContentIndex,
) =>
  levelCapBagThing(
    gs,
    { kind: 'monster', level: monster.level, levelCap: monster.levelCap, xp: monster.xp },
    content.xp.monster,
    content,
  );

export function evolveBagThing(
  gs: GameState,
  key: string,
  name: string,
  content: ContentIndex,
): { state: GameState; message: string } | null {
  const uid = key.slice('mon:'.length);
  if (!evolveRoom(gs, uid, bagContext(gs, content)).ok) return null;
  const before = content.monsters.get(gs.party.owned.find((monster) => monster.uid === uid)?.monsterId ?? '');
  const state = evolve(gs, uid, content.monsters);
  const owned = state?.party.owned.find((monster) => monster.uid === uid);
  const after = content.monsters.get(owned?.monsterId ?? '');
  if (!state || !owned || !after) return null;
  const changes = before ? skillChanges(before, after, content.skills) : { evolved: [], learned: [] };
  return {
    state,
    message: [
      t('field.partyEvolved', { from: name, to: owned.nickname ?? after.name }),
      ...changes.evolved.map(([oldSkill, newSkill]) =>
        t('field.partySkillEvolved', { from: oldSkill.name, to: newSkill.name }),
      ),
      ...changes.learned.map((skill) => t('field.partySkillLearned', { name: skill.name })),
    ].join('\n'),
  };
}

export function growBagThing(
  gs: GameState,
  key: string,
  name: string,
  content: ContentIndex,
  now = Date.now(),
): { state: GameState; focusKey: string; message: string; success: boolean } {
  const target = key === 'hero' ? { kind: 'hero' as const } : { kind: 'monster' as const, uid: key.slice(4) };
  const result = unlockLevelCap(gs, target, content, now);
  if (!result.ok) {
    return {
      state: gs,
      focusKey: key,
      message: t(`field.levelCapFail.${result.reason}`),
      success: false,
    };
  }
  return {
    state: result.state,
    focusKey: key,
    message: t(result.newLevel > result.oldLevel ? 'field.levelCapRaisedWithLevel' : 'field.levelCapRaised', {
      item: content.items.get(GROWTH_MAGATAMA_ID)?.name ?? t('field.levelCapGrowthItem'),
      name,
      oldCap: result.oldCap,
      newCap: result.newCap,
      oldLevel: result.oldLevel,
      newLevel: result.newLevel,
    }),
    success: true,
  };
}

export function levelProgressLine(
  table: readonly number[],
  level: number,
  xp: number,
  levelCap = table.length,
): string {
  const progress = xpToNextLevel(table, level, xp, levelCap);
  return progress.need > 0 ? t('battle.nextLevel', { n: progress.need }) : t('battle.maxLevel');
}

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
