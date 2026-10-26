import type {
  MapObjectDirection,
  MapObjectMovementPorts,
  MapObjectMovementReservation,
} from '../../core/events/mapObjectMovementRuntime';

interface DisplayObjectPort {
  x: number;
  y: number;
  visible: boolean;
  setDepth(depth: number): unknown;
  setFrame(frame: number): unknown;
  setPosition(x: number, y: number): unknown;
  setVisible(visible: boolean): unknown;
}

export interface ScriptedMapObject {
  key: string;
  tile: number;
  facing: MapObjectDirection;
  sprite: DisplayObjectPort;
  shadow: DisplayObjectPort;
  moving: boolean;
  nextMoveAt: number;
  targetTile?: number;
}

export interface MapObjectWalkAnimation<T extends ScriptedMapObject> {
  object: T;
  direction: MapObjectDirection;
  toX: number;
  toY: number;
  signal: AbortSignal;
  onProgress(progress: number): void;
}

export interface MapObjectMovementScene<T extends ScriptedMapObject> {
  objects: Map<number, T>;
  objectsById?: ReadonlyMap<string, T>;
  blocked: Set<number>;
  tileSize: number;
  stepMs: number;
  inside(x: number, y: number): boolean;
  indexOf(x: number, y: number): number;
  isBlocked(x: number, y: number): boolean;
  isTransition(tile: number): boolean;
  playerTile(): readonly [number, number];
  frame(direction: MapObjectDirection, step: 0 | 1 | 2): number;
  now(): number;
  delay(durationMs: number, signal: AbortSignal): Promise<void>;
  emote(object: T, emote: string, signal: AbortSignal): Promise<void>;
  animateWalk(input: MapObjectWalkAnimation<T>): Promise<void>;
}

interface SceneReservation<T extends ScriptedMapObject> extends MapObjectMovementReservation {
  object: T;
  objectId: string;
  fromTile: number;
  toTile: number;
  fromX: number;
  fromY: number;
  occupiedTile: number;
  direction: MapObjectDirection;
  released: boolean;
}

const DELTA: Record<MapObjectDirection, readonly [number, number]> = {
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
};

/** Adapts the existing Overworld NPC map and collision set to the core movement runtime. */
export function createMapObjectMovementPorts<T extends ScriptedMapObject>(
  scene: MapObjectMovementScene<T>,
): MapObjectMovementPorts {
  const reservations = new WeakMap<MapObjectMovementReservation, SceneReservation<T>>();
  const reservedTiles = new Set<number>();
  const knownObjects = new Map<string, { tile: number; object: T }>([
    ...[...(scene.objectsById?.values() ?? [])].map(
      (object) => [object.key, { tile: object.tile, object }] as const,
    ),
    ...[...scene.objects].map(([tile, object]) => [object.key, { tile, object }] as const),
  ]);

  const locate = (objectId: string): [number, T] | undefined => {
    const known = knownObjects.get(objectId);
    return known ? [known.object.tile ?? known.tile, known.object] : undefined;
  };
  const find = (objectId: string): [number, T] => {
    const entry = locate(objectId);
    if (!entry) throw new Error(`map object "${objectId}" was not found`);
    return entry;
  };
  const occupy = (reservation: SceneReservation<T>, tile: number) => {
    if (reservation.occupiedTile === tile) return;
    if (scene.objects.get(reservation.occupiedTile) === reservation.object) {
      scene.objects.delete(reservation.occupiedTile);
      scene.blocked.delete(reservation.occupiedTile);
    }
    reservation.object.tile = tile;
    if (reservation.object.sprite.visible) {
      scene.objects.set(tile, reservation.object);
      scene.blocked.add(tile);
    }
    reservation.occupiedTile = tile;
  };
  const resetVisual = (reservation: SceneReservation<T>) => {
    reservation.object.sprite.setPosition(reservation.fromX, reservation.fromY);
    reservation.object.shadow.setPosition(reservation.fromX, reservation.fromY + 6);
    reservation.object.sprite.setDepth(reservation.fromY);
    reservation.object.sprite.setFrame(scene.frame(reservation.direction, 1));
  };

  return {
    async prepare(objectId, signal) {
      let [, object] = find(objectId);
      if (object.moving) {
        await scene.delay(scene.stepMs * 2, signal);
        [, object] = find(objectId);
        if (object.moving) throw new Error(`map object "${objectId}" is still moving`);
      }
      signal.throwIfAborted();
      object.moving = true;
    },
    async reserveStep(objectId, direction, signal) {
      signal.throwIfAborted();
      const [fromTile, object] = find(objectId);
      const x = Math.floor(object.sprite.x / scene.tileSize);
      const y = Math.floor(object.sprite.y / scene.tileSize);
      const [dx, dy] = DELTA[direction];
      const toX = x + dx;
      const toY = y + dy;
      const toTile = scene.indexOf(toX, toY);
      const player = scene.playerTile();
      const targeted = [...scene.objects.values()].some(
        (candidate) => candidate !== object && candidate.targetTile === toTile,
      );
      if (
        !scene.inside(toX, toY) ||
        scene.isBlocked(toX, toY) ||
        scene.isTransition(toTile) ||
        reservedTiles.has(toTile) ||
        targeted ||
        (player[0] === toX && player[1] === toY)
      )
        return null;

      reservedTiles.add(toTile);
      object.targetTile = toTile;
      const reservation: SceneReservation<T> = {
        object,
        objectId,
        fromTile,
        toTile,
        fromX: object.sprite.x,
        fromY: object.sprite.y,
        occupiedTile: fromTile,
        direction,
        released: false,
        commit() {
          if (reservation.released) return;
          occupy(reservation, toTile);
          reservedTiles.delete(toTile);
          object.targetTile = undefined;
          reservation.released = true;
        },
        release() {
          if (reservation.released) return;
          resetVisual(reservation);
          occupy(reservation, fromTile);
          reservedTiles.delete(toTile);
          object.targetTile = undefined;
          reservation.released = true;
        },
      };
      reservations.set(reservation, reservation);
      return reservation;
    },
    async walk(objectId, direction, reservation, signal) {
      const active = reservations.get(reservation);
      if (!active || active.objectId !== objectId || active.direction !== direction)
        throw new Error('map object movement received an invalid reservation');
      const toX = active.fromX + DELTA[direction][0] * scene.tileSize;
      const toY = active.fromY + DELTA[direction][1] * scene.tileSize;
      active.object.facing = direction;
      active.object.sprite.setFrame(scene.frame(direction, 0));
      try {
        await scene.animateWalk({
          object: active.object,
          direction,
          toX,
          toY,
          signal,
          onProgress: (progress) => {
            occupy(active, progress < 0.5 ? active.fromTile : active.toTile);
            active.object.sprite.setDepth(active.object.sprite.y);
          },
        });
        signal.throwIfAborted();
        active.object.sprite.setFrame(scene.frame(direction, 1));
      } catch (error) {
        resetVisual(active);
        occupy(active, active.fromTile);
        throw error;
      }
    },
    async face(objectId, direction, signal) {
      signal.throwIfAborted();
      const object = find(objectId)[1];
      object.facing = direction;
      object.sprite.setFrame(scene.frame(direction, 1));
    },
    wait: (durationMs, signal) => scene.delay(durationMs, signal),
    emote: (objectId, emote, signal) => scene.emote(find(objectId)[1], emote, signal),
    async setVisible(objectId, visible, signal) {
      signal.throwIfAborted();
      const [tile, object] = find(objectId);
      const occupant = scene.objects.get(tile);
      if (visible && ((occupant && occupant !== object) || (!occupant && scene.blocked.has(tile))))
        throw new Error(`map object "${objectId}" cannot become visible on an occupied tile`);
      object.sprite.setVisible(visible);
      object.shadow.setVisible(visible);
      if (visible) {
        scene.objects.set(tile, object);
        scene.blocked.add(tile);
      } else if (occupant === object) {
        scene.objects.delete(tile);
        scene.blocked.delete(tile);
      }
    },
    cleanup(objectId) {
      const object = locate(objectId)?.[1];
      if (!object) return;
      object.moving = false;
      object.targetTile = undefined;
      object.nextMoveAt = Math.max(object.nextMoveAt, scene.now() + scene.stepMs);
    },
  };
}
