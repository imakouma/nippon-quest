/**
 * バトルの組み立て（GameState + content → Party / 出現モンスター）。純粋関数のみ。
 * Scene はここで作った Party を createBattle() に渡すだけ。
 */
import type { ContentIndex } from '../content/loader';
import type { Area } from '../content/schemas';
import { activeEquipment, adjacencyBonus, bagContext, battleRosterUids } from '../progression/bag';
import { heroLevel } from '../progression/battleResult';
import type { Rng } from '../rng';
import type { GameState } from '../state/schema';
import type { Ground } from '../world/ground';
import { makeHero, makeMonster, makeParty } from './factory';
import type { Party } from './types';

export function partyFromGameState(
  gs: GameState,
  c: Pick<ContentIndex, 'items' | 'sets' | 'monsters' | 'xp' | 'settings'>,
): Party {
  const p = gs.player;
  const hero = makeHero(
    {
      name: p.name,
      level: heroLevel(gs, c.xp.hero),
      baseStats: p.baseStats,
      growth: c.settings.heroGrowth,
      skills: p.skills,
      equipment: activeEquipment(gs),
      bonusWis: p.bonusWis,
    },
    c.items,
    c.sets,
  );
  // 戦闘は今の HP/MP から始まる（前の戦闘のダメージを持ち越す）。0 で始まらないよう最低 1
  hero.hp = Math.max(1, Math.min(hero.stats.hp, p.hp));
  hero.mp = Math.max(0, Math.min(hero.stats.mp, p.mp));

  // バッグで主人公に隣接した仲間の属性支援。戦闘方式そのものは従来のターン制を保つ。
  const adjacent = adjacencyBonus(gs, bagContext(gs, c), hero.stats);
  for (const [k, v] of Object.entries(adjacent.stats)) hero.stats[k as keyof typeof hero.stats] += v ?? 0;
  hero.hp = Math.min(hero.hp, hero.stats.hp);

  // バトルに出るのは バッグに 入れた 仲間だけ（何体でも）。あずけている 仲間は 入れかえにも出ない
  const owned = battleRosterUids(gs)
    .map((uid) => gs.party.owned.find((o) => o.uid === uid))
    .filter((o): o is NonNullable<typeof o> => !!o && c.monsters.has(o.monsterId));
  const monsters = owned.map((o) => {
    const m = makeMonster(c.monsters.get(o.monsterId)!, o.level, o.uid);
    if (o.nickname) m.name = o.nickname;
    return m;
  });
  // content に 無い どうぐ（なくした やくそう など、前の セーブに のこっている もの）は もちこまない
  const items = Object.fromEntries(
    gs.party.bagItems.flatMap((id) => {
      const item = c.items.get(id);
      const count = gs.inventory[id] ?? 0;
      return item?.kind === 'consumable' && item.use && count > 0 ? [[id, count]] : [];
    }),
  );
  const party = makeParty(hero, monsters, items);
  const active = owned.findIndex((o) => o.uid === gs.party.activeUid);
  party.activeMonsterIndex = Math.max(0, active);
  return party;
}

/** field（くさはら）・dungeon と、フィールドの 地面ごとの 出現表（src/core/world/ground.ts） */
export type EncounterZone = 'field' | 'dungeon' | Exclude<Ground, 'grass'>;

/** マップキー（"aomori-field" など）から出現ゾーンを決める。町・島マップではエンカウントしない */
export function zoneForMap(mapKey: string): EncounterZone | null {
  if (mapKey.endsWith('-field')) return 'field';
  if (mapKey.endsWith('-dungeon')) return 'dungeon';
  return null;
}

/**
 * フィールドでは 立っている 地面（すなはま・もり・やま …）の 出現表を つかう。
 * くさはらと、その県に 表の 無い 地面は ふつうの field。ダンジョンは そのまま
 */
export function zoneForGround(
  area: Pick<Area, 'encounters'>,
  zone: EncounterZone,
  ground: Ground | null,
): EncounterZone {
  if (zone !== 'field' || !ground || ground === 'grass') return zone;
  return area.encounters.some((e) => !e.region && e.zone === ground) ? ground : 'field';
}

/** 県の encounters テーブルから 1 体抽選。テーブルが無ければ null */
export function pickEncounter(area: Pick<Area, 'encounters'>, zone: EncounterZone, rng: Rng): string | null {
  const table = area.encounters.find((e) => !e.region && e.zone === zone)?.table;
  if (!table?.length) return null;
  return rng.weighted(table.map((t) => ({ item: t.monsterId, weight: t.weight })));
}

type EncounterTable = Area['encounters'][number];

export interface EncounterUnlocks {
  gated: ReadonlySet<string>;
  unlocked: readonly string[];
}

/**
 * いま つかう 出現表。名所エリア（region）の ある フィールドでは、その エリアの 表（地面の 表 → エリアの field の 表）。
 * エリアの 表が 無ければ ふつうの 表（地面 → field）
 */
export function encounterTable(
  area: Pick<Area, 'encounters'>,
  zone: EncounterZone,
  ground: Ground | null,
  region: string | null,
): EncounterTable | null {
  if (region && zone === 'field') {
    const mine = area.encounters.filter((e) => e.region === region);
    if (mine.length)
      return (
        (ground && ground !== 'grass' ? mine.find((e) => e.zone === ground) : undefined) ??
        mine.find((e) => e.zone === 'field') ??
        null
      );
  }
  const z = zoneForGround(area, zone, ground);
  return area.encounters.find((e) => !e.region && e.zone === z) ?? null;
}

/** 表から 1 体。報酬で解放されるモンスターは、解放済みになるまで候補から除く。 */
export function pickFromTable(table: EncounterTable, rng: Rng, unlocks?: EncounterUnlocks): string | null {
  const unlocked = unlocks ? new Set(unlocks.unlocked) : null;
  const candidates = unlocks
    ? table.table.filter((entry) => !unlocks.gated.has(entry.monsterId) || unlocked!.has(entry.monsterId))
    : table.table;
  if (!candidates.length) return null;
  return rng.weighted(candidates.map((entry) => ({ item: entry.monsterId, weight: entry.weight })));
}

/**
 * 出現レベル。encounters にレベル帯が無いので当面は主人公レベル±1（最低 1）。
 * レベル帯を content に持たせるかは Step 10 のバランス調整で決める。
 */
export function encounterLevel(heroLevel: number, rng: Rng): number {
  return Math.max(1, heroLevel + rng.int(-1, 1));
}
