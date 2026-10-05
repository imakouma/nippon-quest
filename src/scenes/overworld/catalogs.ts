import type { ContentIndex } from '../../core/content/loader';
import type { Area, Item, Monster, Motif } from '../../core/content/schemas';
import type { GameState } from '../../core/state/schema';
import { motifStamp } from '../../core/progression/route';
import { GEOGRAPHIC_AREA_ORDER } from './geography';

export interface SpecialtyEntry {
  area: Area;
  motif: Motif;
  itemId: string;
  item?: Item;
  known: boolean;
}

export const isSpecialtyMotif = (motif: Motif): boolean => motif.kind === 'food' || motif.kind === 'craft';

/** 図鑑の県順。ストーリー順ではなく北海道から沖縄へ北→南。 */
export function geographicAreaOrder(content: ContentIndex): string[] {
  return [...new Set([...GEOGRAPHIC_AREA_ORDER, ...content.areas.keys()])];
}

/** 発見状況を含む特産品図鑑の表示元データ。 */
export function specialtyCatalog(
  content: ContentIndex,
  game: GameState,
  revealAll: boolean,
): SpecialtyEntry[] {
  const out: SpecialtyEntry[] = [];
  const areas = geographicAreaOrder(content).flatMap((id) => content.areas.get(id) ?? []);
  for (const area of areas)
    for (const motif of area.motifs) {
      if (!isSpecialtyMotif(motif)) continue;
      const itemId = `${area.id}-${motif.id}`;
      const known =
        revealAll ||
        game.dex.motifs.includes(motifStamp(area.id, motif.id)) ||
        game.dex.items.includes(itemId) ||
        (game.inventory[itemId] ?? 0) > 0;
      out.push({ area, motif, itemId, item: content.items.get(itemId), known });
    }
  return out;
}

/** 発見状況を含むモンスター図鑑の表示元データ。 */
export function monsterCatalog(
  content: ContentIndex,
  game: GameState,
  revealAll: boolean,
): Array<{ m: Monster; known: boolean }> {
  const order = geographicAreaOrder(content);
  const areaRanks = new Map(order.map((areaId, index) => [areaId, index]));
  const rank = (monster: Monster) => areaRanks.get(monster.area) ?? order.length;
  const seen = new Set([...game.dex.monsters, ...game.party.owned.map((owned) => owned.monsterId)]);
  return [...content.monsters.values()]
    .sort((a, b) => rank(a) - rank(b) || Number(a.isBoss) - Number(b.isBoss))
    .map((monster) => ({ m: monster, known: revealAll || seen.has(monster.id) }));
}
