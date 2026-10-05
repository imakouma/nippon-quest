import type { MapObject } from './mapModels';

/** Tiled の objects レイヤーを、種別ごとの機能ハンドラーへ振り分ける。 */
export interface MapObjectHandlers<T extends MapObject> {
  beforeAll(): void;
  transition(object: T, x: number, y: number): void;
  npc(object: T, x: number, y: number): void;
  chest(object: T, x: number, y: number): void;
  midboss(object: T, x: number, y: number): void;
  regionGate(object: T, x: number, y: number): void;
  structure(object: T, x: number, y: number): void;
  regionBoss(object: T, x: number, y: number): void;
  boss(object: T, x: number, y: number): void;
  lastboss(object: T, x: number, y: number): void;
  event(object: T, x: number, y: number): void;
  landmark(object: T, x: number, y: number): void;
  specialty(object: T, x: number, y: number): void;
}

const TILE = 16;

/** 知らない object type は無視するため、マップを段階的に拡張できる。 */
export function dispatchMapObjects<T extends MapObject>(
  objects: readonly T[],
  handlers: MapObjectHandlers<T>,
): void {
  handlers.beforeAll();
  for (const object of objects) {
    const x = Math.floor((object.x ?? 0) / TILE);
    const y = Math.floor((object.y ?? 0) / TILE);
    switch (object.type) {
      case 'transition':
        handlers.transition(object, x, y);
        break;
      case 'npc':
        handlers.npc(object, x, y);
        break;
      case 'chest':
        handlers.chest(object, x, y);
        break;
      case 'midboss':
        handlers.midboss(object, x, y);
        break;
      case 'regionGate':
        handlers.regionGate(object, x, y);
        break;
      case 'structure':
        handlers.structure(object, x, y);
        break;
      case 'regionBoss':
        handlers.regionBoss(object, x, y);
        break;
      case 'boss':
        handlers.boss(object, x, y);
        break;
      case 'lastboss':
        handlers.lastboss(object, x, y);
        break;
      case 'event':
        handlers.event(object, x, y);
        break;
      case 'landmark':
        handlers.landmark(object, x, y);
        break;
      case 'specialty':
        handlers.specialty(object, x, y);
        break;
    }
  }
}
