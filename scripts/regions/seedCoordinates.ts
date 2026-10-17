import type { LonLat } from '../data/geo.js';

export interface SeedRegion {
  id: string;
  motifs: string[];
  start?: boolean;
}

export interface SeedEvent {
  motifId?: string;
  trigger?: { objectName: string };
}

export interface RegionSeedSources {
  explicitSeeds?: Record<string, LonLat[]>;
  landmarkSpots?: Record<string, LonLat>;
  events: SeedEvent[];
  eventSpots: Record<string, LonLat>;
  capital?: LonLat;
}

function requireCoordinates(prefId: string, regionId: string, coordinates: LonLat[]): LonLat[] {
  if (!coordinates.length) throw new Error(`${prefId}: エリア ${regionId} のたねの座標がありません`);
  return coordinates;
}

export function deriveRegionSeedCoordinates(
  prefId: string,
  region: SeedRegion,
  sources: RegionSeedSources,
): LonLat[] {
  const explicit =
    sources.explicitSeeds && Object.prototype.hasOwnProperty.call(sources.explicitSeeds, region.id)
      ? requireCoordinates(
          prefId,
          region.id,
          (sources.explicitSeeds[region.id] ?? []).map(([lon, lat]) => [lon, lat]),
        )
      : [];

  const candidates: LonLat[] = [...explicit];
  if (region.start && sources.capital) candidates.push(sources.capital);
  for (const motifId of region.motifs) {
    const landmark = sources.landmarkSpots?.[motifId];
    if (landmark) candidates.push(landmark);
    for (const event of sources.events) {
      if (event.motifId !== motifId || !event.trigger) continue;
      const eventSpot = sources.eventSpots[event.trigger.objectName];
      if (eventSpot) candidates.push(eventSpot);
    }
  }

  const seen = new Set<string>();
  const unique = candidates.flatMap(([lon, lat]): LonLat[] => {
    const key = `${lon},${lat}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [[lon, lat]];
  });
  return requireCoordinates(prefId, region.id, unique);
}

export function filterRegionSeedCoordinates(
  prefId: string,
  region: SeedRegion,
  candidates: LonLat[],
  isUsable: (coordinate: LonLat) => boolean,
  capital?: LonLat,
): LonLat[] {
  const usable = candidates.filter(isUsable).map(([lon, lat]): LonLat => [lon, lat]);
  if (usable.length) return usable;
  if (region.start && capital && isUsable(capital)) return [[capital[0], capital[1]]];
  throw new Error(`${prefId}: エリア ${region.id} のフィールド本土内にたねの座標がありません`);
}
