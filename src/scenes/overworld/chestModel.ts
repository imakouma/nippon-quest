import type { Area, Item, Motif } from '../../core/content/schemas';
import { applyReward } from '../../core/progression/eventReward';
import { motifStamp } from '../../core/progression/route';
import type { GameState } from '../../core/state/schema';

export interface ChestModel {
  key: string;
  itemId: string;
  itemName: string;
  count: number;
  opened: boolean;
  specialty?: { area: Area; motif: Motif; stamp: string };
}

/** 宝箱の中身と発見履歴を、取得元によらず同時にセーブへ反映する。 */
export function applyChestReward(
  prev: GameState,
  chest: Pick<ChestModel, 'key' | 'count' | 'specialty'>,
  item: Item | undefined,
  now = Date.now(),
): GameState {
  const state = item
    ? applyReward(prev, { items: [{ itemId: item.id, n: chest.count }] }, now).state
    : structuredClone(prev);
  if (!state.progress.chestsOpened.includes(chest.key)) state.progress.chestsOpened.push(chest.key);
  const stamp = chest.specialty?.stamp;
  if (stamp && !state.dex.motifs.includes(stamp)) state.dex.motifs.push(stamp);
  state.updatedAt = now;
  return state;
}

/** 通常宝箱の内容と開封済み状態を決める。 */
export function chestModel(input: {
  mapKey: string;
  objectName: string;
  itemId: unknown;
  itemName: unknown;
  count: unknown;
  game: GameState | undefined;
  items: ReadonlyMap<string, Item>;
  fallbackName: string;
}): ChestModel {
  const key = `${input.mapKey}:${input.objectName}`;
  const itemId = String(input.itemId ?? '');
  return {
    key,
    itemId,
    itemName: input.items.get(itemId)?.name ?? String(input.itemName ?? input.fallbackName),
    count:
      typeof input.count === 'number' && Number.isSafeInteger(input.count) && input.count > 0
        ? input.count
        : 1,
    opened: input.game?.progress.chestsOpened.includes(key) ?? false,
  };
}

/** 特産品宝箱の内容・図鑑スタンプ・開封済み状態を決める。 */
export function specialtyChestModel(input: {
  mapKey: string;
  objectName: string;
  motifId: unknown;
  area: Area | undefined;
  game: GameState | undefined;
  items: ReadonlyMap<string, Item>;
}): ChestModel | null {
  const { area } = input;
  const motif = area?.motifs.find((candidate) => candidate.id === input.motifId);
  if (!area || !motif) return null;
  const stamp = motifStamp(area.id, motif.id);
  const itemId = `${area.id}-${motif.id}`;
  return {
    key: `${input.mapKey}:${input.objectName}`,
    itemId,
    itemName: input.items.get(itemId)?.name ?? motif.name,
    count: 1,
    opened: input.game?.dex.motifs.includes(stamp) ?? false,
    specialty: { area, motif, stamp },
  };
}
