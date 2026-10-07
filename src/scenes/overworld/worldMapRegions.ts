import type { ContentIndex } from '../../core/content/loader';
import type { Area, Motif } from '../../core/content/schemas';
import { canChallengeIslandBoss } from '../../core/progression/island';
import { midBossFlag, motifStamp } from '../../core/progression/route';
import type { GameState } from '../../core/state/schema';
import type { MapAreaInfo, MapRegionInfo, WorldMapData } from '../../ui/field/worldMapModel';
import { stripRuby } from '../../ui/ruby';

const SPECIALTY_KINDS: ReadonlySet<Motif['kind']> = new Set(['food', 'craft']);

export function buildWorldMapRegions(
  data: WorldMapData,
  content: ContentIndex,
  gs: GameState | undefined,
  visitedAreas: ReadonlySet<string>,
): MapRegionInfo[] {
  const islands = new Map(content.world.islands.map((island) => [island.id, island]));
  const boss = (area: Area | undefined): MapAreaInfo['boss'] => {
    if (!area?.midBoss) return 'none';
    return gs?.progress.eventsDone.includes(midBossFlag(area.id)) ? 'done' : 'yet';
  };
  return data.regions
    .filter((region) => islands.has(region.id))
    .sort((a, b) => islands.get(a.id)!.order - islands.get(b.id)!.order)
    .map((region) => {
      const island = islands.get(region.id)!;
      const foundSigns = island.areas.filter((id) => gs?.progress.areaSigns.includes(id)).length;
      const cleared = gs?.progress.islandsCleared.includes(island.id) ?? false;
      const ready = !!gs && canChallengeIslandBoss(content.world, island.id, gs.progress);
      return {
        id: region.id,
        name: island.name,
        width: region.width,
        height: region.height,
        rows: region.rows,
        status: island.status,
        islandBoss: {
          name: content.monsters.get(island.bossId)?.name ?? island.bossId,
          state: cleared ? 'done' : ready ? 'ready' : 'locked',
          foundSigns,
          requiredSigns: island.areas.length,
        },
        areas: region.areas.map((mapArea): MapAreaInfo => {
          const area = content.areas.get(mapArea.id);
          const stamps = mapArea.stamps.flatMap((id) => {
            const motif = area?.motifs.find((candidate) => candidate.id === id);
            if (!motif) return [];
            const box =
              SPECIALTY_KINDS.has(motif.kind) && !area?.events.some((event) => event.motifId === id);
            const found = gs?.dex.motifs.includes(motifStamp(mapArea.id, id));
            return [{ name: found ? stripRuby(motif.name, 'kana') : null, box }];
          });
          return {
            id: mapArea.id,
            name: area?.name ?? mapArea.id,
            capital: mapArea.capital,
            stamps,
            boss: boss(area),
            visited: island.status === 'playable' && visitedAreas.has(mapArea.id),
          };
        }),
      };
    });
}
