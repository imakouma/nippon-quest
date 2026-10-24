export type MapTransitionReason = 'door' | 'warp' | 'world-map' | 'defeat' | 'script';

export interface MapTransitionRequest {
  targetMap: string;
  spawnName?: string;
  tile?: readonly [number, number];
  exactSpawn?: boolean;
  reason: MapTransitionReason;
}
