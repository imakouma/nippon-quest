import type { FieldResumeSnapshot, PersistedFieldObject } from '../../core/state/schema';
import { resolveMapEntry, type MapEntry, type MapEntryFacing, type MapEntryMap } from './mapEntry';
import type { MapTransitionRequest } from './mapTransitionPipeline';

export interface FieldObjectState {
  name: string;
  persistState: boolean;
  tileX: number;
  tileY: number;
  facing: MapEntryFacing;
  visible: boolean;
}

export interface CaptureFieldResumeInput {
  mapKey: string;
  facing: MapEntryFacing;
  objects: readonly FieldObjectState[];
  previous?: FieldResumeSnapshot;
}

export interface ResolveFieldResumeInput {
  request: MapTransitionRequest;
  map: MapEntryMap;
  requestedMap: string;
  requestedPosition: { x: number; y: number };
  requestedFacing: MapEntryFacing;
  objectDefinitions: readonly FieldObjectState[];
  snapshot: FieldResumeSnapshot;
}

export interface ResolvedFieldResume {
  player: MapEntry;
  objects: Record<string, PersistedFieldObject>;
}

export const fieldObjectKey = (mapKey: string, name: string): string => `${mapKey}:${name}`;

export function captureFieldResume({
  mapKey,
  facing,
  objects,
  previous,
}: CaptureFieldResumeInput): FieldResumeSnapshot {
  const counts = countNames(objects);
  const retained = Object.fromEntries(
    Object.entries(previous?.objects ?? {}).filter(([, value]) => value.map !== mapKey),
  );
  const current = objects.flatMap((object): Array<[string, PersistedFieldObject]> => {
    if (!object.persistState || !object.name || counts.get(object.name) !== 1) return [];
    return [
      [
        fieldObjectKey(mapKey, object.name),
        {
          map: mapKey,
          tileX: object.tileX,
          tileY: object.tileY,
          facing: object.facing,
          visible: object.visible,
        },
      ],
    ];
  });
  return { facing, objects: { ...retained, ...Object.fromEntries(current) } };
}

export function resolveFieldResume({
  request,
  map,
  requestedMap,
  requestedPosition,
  requestedFacing,
  objectDefinitions,
  snapshot,
}: ResolveFieldResumeInput): ResolvedFieldResume {
  const objects = resolveFieldResumeObjects(map, objectDefinitions, snapshot);
  return {
    player: resolveMapEntry({
      request,
      map,
      saved: {
        mapKey: requestedMap,
        x: requestedPosition.x,
        y: requestedPosition.y,
        facing: requestedFacing,
      },
    }),
    objects,
  };
}

export function resolveFieldResumeObjects(
  map: MapEntryMap,
  objectDefinitions: readonly FieldObjectState[],
  snapshot: FieldResumeSnapshot,
): Record<string, PersistedFieldObject> {
  const counts = countNames(objectDefinitions);
  const definitions = new Map(objectDefinitions.map((object) => [object.name, object]));
  return Object.fromEntries(
    Object.entries(snapshot.objects).filter(([key, value]) => {
      const name = key.slice(`${map.key}:`.length);
      const definition = definitions.get(name);
      return (
        key.startsWith(`${map.key}:`) &&
        value.map === map.key &&
        definition?.persistState === true &&
        counts.get(name) === 1 &&
        value.tileX < map.width &&
        value.tileY < map.height &&
        map.isWalkable(value.tileX, value.tileY)
      );
    }),
  );
}

export function selectResumeMap(
  requestedMap: string,
  availableMaps: readonly string[],
  fallbackMap: string,
): string {
  return availableMaps.includes(requestedMap) ? requestedMap : fallbackMap;
}

function countNames(objects: readonly FieldObjectState[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const object of objects) counts.set(object.name, (counts.get(object.name) ?? 0) + 1);
  return counts;
}
