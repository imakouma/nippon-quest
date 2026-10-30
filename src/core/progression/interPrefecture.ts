/** 県境門・実在交通の解放判定。表示層やマップ実装に依存しない純粋関数だけを置く。 */
import type { World } from '../content/schemas';
import { areaTravelCompleted } from './route';

export type LinkUnlockRole = 'chapter' | 'story' | 'shortcut' | 'special';

export interface InterPrefectureLinkRef {
  id: string;
  /** 解放を判定する移動方向。[現在地, 行先] の順。 */
  areas: readonly [string, string];
  /** 交通カタログが持つ監査用の役割。判定そのものはworldの攻略順から導出する。 */
  unlockRole?: LinkUnlockRole;
}

export interface LinkUnlockProgress {
  areaSigns: readonly string[];
  eventsDone: readonly string[];
  islandsCleared: readonly string[];
}

export type LinkUnlockRule =
  | { kind: 'story'; completedAreaId: string }
  | { kind: 'chapter'; clearedIslandId: string }
  | { kind: 'shortcut' }
  | { kind: 'special' };

export interface LinkAccessDecision {
  open: boolean;
  via: 'dev' | 'progression' | null;
  rule: LinkUnlockRule['kind'];
  missingAreas: readonly string[];
  missingIslands: readonly string[];
}

/** 正規の県境・実在交通から一度入った県を、旧visit汚染と区別する保存キー。 */
export const interPrefectureArrivalKey = (areaId: string): string => `interpref:arrived:${areaId}`;

interface ChapterRule {
  areas: readonly [string, string];
  clearedIslandId: string;
}

const CHAPTER_RULES: Readonly<Record<string, ChapterRule>> = {
  'aomori-hokkaido-seikan': { areas: ['aomori', 'hokkaido'], clearedIslandId: 'tohoku' },
  'hokkaido-ibaraki-ferry': { areas: ['hokkaido', 'ibaraki'], clearedIslandId: 'hokkaido' },
  'land-gunma-niigata': { areas: ['gunma', 'niigata'], clearedIslandId: 'kanto' },
  'land-niigata-nagano': { areas: ['niigata', 'nagano'], clearedIslandId: 'hokuriku' },
  'land-yamanashi-shizuoka': {
    areas: ['yamanashi', 'shizuoka'],
    clearedIslandId: 'koshinetsu',
  },
  'land-mie-shiga': { areas: ['mie', 'shiga'], clearedIslandId: 'tokai' },
  'land-hyogo-tottori': { areas: ['hyogo', 'tottori'], clearedIslandId: 'kinki' },
  'okayama-kagawa-bridge': { areas: ['okayama', 'kagawa'], clearedIslandId: 'chugoku' },
  'hiroshima-ehime-bridge': { areas: ['hiroshima', 'ehime'], clearedIslandId: 'shikoku' },
  'yamaguchi-fukuoka-kanmon': {
    areas: ['yamaguchi', 'fukuoka'],
    clearedIslandId: 'shikoku',
  },
};

/** 章間の正規経路を、案内や検査で再利用できる最小のリンク契約として返す。 */
export function interPrefectureChapterLinks(): readonly InterPrefectureLinkRef[] {
  return Object.entries(CHAPTER_RULES).map(([id, rule]) => ({
    id,
    areas: rule.areas,
    unlockRole: 'chapter',
  }));
}

const SPECIAL_RULE: ChapterRule = {
  areas: ['ehime', 'oita'],
  clearedIslandId: 'shikoku',
};

const samePair = (a: readonly [string, string], b: readonly [string, string]): boolean =>
  (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);

function islandContaining(world: World, areaId: string) {
  const matches = world.islands.filter((island) => island.areas.includes(areaId));
  if (matches.length !== 1)
    throw new Error(
      `${areaId}: world上の所属地方が${matches.length === 0 ? 'ありません' : '一意ではありません'}`,
    );
  return matches[0]!;
}

function validateCatalogRole(link: InterPrefectureLinkRef, rule: LinkUnlockRule): void {
  if (link.unlockRole !== undefined && link.unlockRole !== rule.kind)
    throw new Error(`${link.id}: unlockRole=${link.unlockRole} は導出結果 ${rule.kind} と一致しません`);
}

/** リンクの役割を、端点の並びではなく正規のworld攻略順と明示章間表から一意に求める。 */
export function interPrefectureUnlockRule(world: World, link: InterPrefectureLinkRef): LinkUnlockRule {
  if (link.areas[0] === link.areas[1]) throw new Error(`${link.id}: 両端が同じ県です`);
  const firstIsland = islandContaining(world, link.areas[0]);
  const secondIsland = islandContaining(world, link.areas[1]);

  if (link.id === 'ehime-oita-ferry') {
    if (!samePair(link.areas, SPECIAL_RULE.areas))
      throw new Error(`${link.id}: 端点が ${SPECIAL_RULE.areas.join(' ↔ ')} と一致しません`);
    const rule: LinkUnlockRule = { kind: 'special' };
    validateCatalogRole(link, rule);
    return rule;
  }

  const chapter = CHAPTER_RULES[link.id];
  if (chapter) {
    if (!samePair(link.areas, chapter.areas))
      throw new Error(`${link.id}: 端点が ${chapter.areas.join(' ↔ ')} と一致しません`);
    const rule: LinkUnlockRule = { kind: 'chapter', clearedIslandId: chapter.clearedIslandId };
    validateCatalogRole(link, rule);
    return rule;
  }

  if (firstIsland.id === secondIsland.id) {
    const firstIndex = firstIsland.areas.indexOf(link.areas[0]);
    const secondIndex = firstIsland.areas.indexOf(link.areas[1]);
    if (Math.abs(firstIndex - secondIndex) === 1) {
      const rule: LinkUnlockRule = {
        kind: 'story',
        completedAreaId: firstIsland.areas[Math.min(firstIndex, secondIndex)]!,
      };
      validateCatalogRole(link, rule);
      return rule;
    }
  }

  const rule: LinkUnlockRule = { kind: 'shortcut' };
  validateCatalogRole(link, rule);
  return rule;
}

/** 対象地方までの全playable地方が順に開いているか。最初の地方は常に解放済み。 */
export function islandUnlockedForTravel(
  world: World,
  islandId: string,
  islandsCleared: readonly string[],
): boolean {
  const island = world.islands.find((candidate) => candidate.id === islandId);
  if (!island || island.status !== 'playable') return false;
  return world.islands
    .filter((candidate) => candidate.status === 'playable' && candidate.order < island.order)
    .every((candidate) => islandsCleared.includes(candidate.id));
}

/** 高速移動先として使える県か。訪問フラグだけでは攻略順を飛ばせない。 */
export function areaUnlockedForTravel(world: World, areaId: string, progress: LinkUnlockProgress): boolean {
  const island = world.islands.find((candidate) => candidate.areas.includes(areaId));
  if (!island || !islandUnlockedForTravel(world, island.id, progress.islandsCleared)) return false;
  const areaIndex = island.areas.indexOf(areaId);
  return island.areas.slice(0, areaIndex).every((id) => areaTravelCompleted(progress, id));
}

/** 現行順で到達済み、または前地方を終えて旧順序ですでに攻略済みの県か。 */
export function areaReachableForTravel(world: World, areaId: string, progress: LinkUnlockProgress): boolean {
  const island = world.islands.find((candidate) => candidate.areas.includes(areaId));
  if (!island) return false;
  return (
    areaUnlockedForTravel(world, areaId, progress) ||
    (islandUnlockedForTravel(world, island.id, progress.islandsCleared) &&
      areaTravelCompleted(progress, areaId))
  );
}

/** 閉鎖理由を含め、現在の進行でリンクを通れるかを副作用なしで判定する。 */
export function interPrefectureAccess(
  world: World,
  link: InterPrefectureLinkRef,
  progress: LinkUnlockProgress,
  devAll: boolean,
): LinkAccessDecision {
  const rule = interPrefectureUnlockRule(world, link);
  if (devAll) return { open: true, via: 'dev', rule: rule.kind, missingAreas: [], missingIslands: [] };

  let missingAreas: string[] = [];
  let missingIslands: string[] = [];
  if (rule.kind === 'story') {
    if (link.areas[0] === rule.completedAreaId) {
      const island = islandContaining(world, rule.completedAreaId);
      const completedIndex = island.areas.indexOf(rule.completedAreaId);
      missingAreas = island.areas
        .slice(0, completedIndex + 1)
        .filter((areaId) => !areaTravelCompleted(progress, areaId));
    }
  } else if (rule.kind === 'chapter') {
    const clearedIsland = world.islands.find((island) => island.id === rule.clearedIslandId);
    if (!clearedIsland) throw new Error(`${rule.clearedIslandId}: world上の地方がありません`);
    missingIslands = world.islands
      .filter(
        (island) =>
          island.status === 'playable' &&
          island.order <= clearedIsland.order &&
          !progress.islandsCleared.includes(island.id),
      )
      .map((island) => island.id);
  } else if (rule.kind === 'shortcut') {
    missingAreas = link.areas.filter((areaId) => !areaTravelCompleted(progress, areaId));
    missingIslands = [...new Set(link.areas.map((areaId) => islandContaining(world, areaId).id))].filter(
      (islandId) => !islandUnlockedForTravel(world, islandId, progress.islandsCleared),
    );
  } else {
    const kumamotoIsland = islandContaining(world, 'kumamoto');
    const kumamotoIndex = kumamotoIsland.areas.indexOf('kumamoto');
    missingAreas = kumamotoIsland.areas
      .slice(0, kumamotoIndex + 1)
      .filter((areaId) => !areaTravelCompleted(progress, areaId));
    const clearedIsland = world.islands.find((island) => island.id === SPECIAL_RULE.clearedIslandId)!;
    missingIslands = world.islands
      .filter(
        (island) =>
          island.status === 'playable' &&
          island.order <= clearedIsland.order &&
          !progress.islandsCleared.includes(island.id),
      )
      .map((island) => island.id);
  }

  const open = missingAreas.length === 0 && missingIslands.length === 0;
  return {
    open,
    via: open ? 'progression' : null,
    rule: rule.kind,
    missingAreas,
    missingIslands,
  };
}
