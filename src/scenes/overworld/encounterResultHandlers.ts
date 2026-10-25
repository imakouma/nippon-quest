import type { MapTransitionRequest } from './mapTransitionPipeline';
import type { EncounterFlowContext, EncounterResultHandlers } from './encounterLifecycle';

interface LastInn {
  map: string;
  x: number;
  y: number;
}

interface EncounterResultHandlerPorts {
  lastInn(): LastInn | null | undefined;
  currentMap(): string;
  transition(request: MapTransitionRequest, flow: EncounterFlowContext): Promise<void>;
  completeArena(opponentId: string, won: boolean): Promise<void> | void;
  completeMidBoss(): Promise<void> | void;
  completeAreaBoss(): Promise<void> | void;
  completeLastBoss(): Promise<void> | void;
  completeRegionBoss(regionId: string): Promise<void> | void;
  completeIslandBoss(islandId: string): Promise<void> | void;
}

/** Battle result policies are mapped to field actions without leaking Scene details into the lifecycle. */
export function createEncounterResultHandlers(
  ports: EncounterResultHandlerPorts,
  tileSize: number,
): EncounterResultHandlers {
  return {
    respawn: (flow) => {
      const inn = ports.lastInn();
      const request: MapTransitionRequest = inn
        ? {
            targetMap: inn.map,
            spawnName: 'spawn',
            tile: [Math.floor(inn.x / tileSize), Math.floor(inn.y / tileSize)],
            exactSpawn: true,
            reason: 'defeat',
          }
        : { targetMap: ports.currentMap(), spawnName: 'spawn', reason: 'defeat' };
      return ports.transition(request, flow);
    },
    completeArena: ports.completeArena,
    completeMidBoss: ports.completeMidBoss,
    completeAreaBoss: ports.completeAreaBoss,
    completeLastBoss: ports.completeLastBoss,
    completeRegionBoss: ports.completeRegionBoss,
    completeIslandBoss: ports.completeIslandBoss,
  };
}
