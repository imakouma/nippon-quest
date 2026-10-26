export interface ResumeMapArea {
  id: string;
  mapKeys?: { field: string; town: string; dungeon: string };
  secret?: unknown;
}

export interface ResumeMapEnclave {
  prefId: string;
  enclaveId: string;
}

export function availableResumeMaps(
  areas: ReadonlyMap<string, ResumeMapArea>,
  enclaves: readonly ResumeMapEnclave[],
): string[] {
  return [
    ...[...areas.values()].flatMap((area) => [
      ...Object.values(area.mapKeys ?? {}),
      ...(area.secret ? [`${area.id}-secret`] : []),
    ]),
    ...enclaves.map((enclave) => enclave.enclaveId),
  ];
}

export function resolveResumeMap(
  requestedMap: string,
  currentArea: string,
  areas: ReadonlyMap<string, ResumeMapArea>,
  enclaves: readonly ResumeMapEnclave[],
): { mapKey: string; usedFallback: boolean } {
  const available = availableResumeMaps(areas, enclaves);
  if (available.includes(requestedMap)) return { mapKey: requestedMap, usedFallback: false };
  const fallback = areas.get(currentArea)?.mapKeys?.field ?? [...areas.values()][0]?.mapKeys?.field;
  if (!fallback) throw new Error('No safe field map is available');
  return { mapKey: fallback, usedFallback: true };
}
import type { GameState } from '../../core/state/schema';

export function prepareResumeGame(
  game: GameState,
  areas: ReadonlyMap<string, ResumeMapArea>,
  enclaves: readonly ResumeMapEnclave[],
): { game: GameState; mapKey: string; usedFallback: boolean } {
  const resume = resolveResumeMap(game.progress.currentMap, game.progress.currentArea, areas, enclaves);
  return {
    game: resume.usedFallback ? { ...game, progress: { ...game.progress, currentMap: resume.mapKey } } : game,
    ...resume,
  };
}
