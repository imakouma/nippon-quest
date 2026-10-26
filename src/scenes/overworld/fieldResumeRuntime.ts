import type Phaser from 'phaser';
import type { GameState, PersistedFieldObject } from '../../core/state/schema';
import { walkFrame } from '../../rendering/characters';
import { isSavedFieldTileWalkable } from './importedLocation';
import type { MapEntryFacing, MapEntryObject } from './mapEntry';
import {
  captureFieldResume,
  fieldObjectKey,
  resolveFieldResumeObjects,
  type FieldObjectState,
} from './fieldResumeSnapshot';

export interface RuntimeFieldNpc {
  key: string;
  persistState: boolean;
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Image;
  tile: number;
  facing: MapEntryFacing;
}

interface RuntimeObject {
  definition: FieldObjectState;
  read(): FieldObjectState;
  apply(saved: PersistedFieldObject): void;
}

interface RegisterNpcInput<T extends RuntimeFieldNpc> {
  mapWidth: number;
  npc: T;
  npcs: Map<number, T>;
  blocked: Set<number>;
}

export class FieldResumeRuntime {
  private objects: RuntimeObject[] = [];

  reset(): void {
    this.objects = [];
  }

  registerNpc<T extends RuntimeFieldNpc>(
    mapWidth: number,
    npc: T,
    npcs: Map<number, T>,
    blocked: Set<number>,
  ): void {
    const input = { mapWidth, npc, npcs, blocked };
    const definition = this.readNpc(
      input,
      input.npc.tile % input.mapWidth,
      Math.floor(input.npc.tile / input.mapWidth),
    );
    this.objects.push({
      definition,
      read: () =>
        this.readNpc(input, input.npc.tile % input.mapWidth, Math.floor(input.npc.tile / input.mapWidth)),
      apply: (saved) => this.placeNpc(input, saved),
    });
  }

  restorePhaser(input: {
    mapKey: string;
    map: Phaser.Tilemaps.Tilemap;
    objects: readonly MapEntryObject[];
    collision: Phaser.Tilemaps.TilemapLayer | null;
    fieldGroundRequired: boolean;
    progress: GameState['progress'] | undefined;
  }): void {
    const restored = resolveFieldResumeObjects(
      {
        key: input.mapKey,
        width: input.map.width,
        height: input.map.height,
        objects: input.objects,
        isWalkable: (x, y) =>
          input.collision?.getTileAt(x, y)?.index !== 3 &&
          (!input.fieldGroundRequired ||
            isSavedFieldTileWalkable(input.map.getTileAt(x, y, true, 'background')?.index)),
        tileSize: 16,
      },
      this.objects.map((object) => object.definition),
      input.progress?.fieldSnapshot ?? { facing: 'down', objects: {} },
    );
    for (const object of this.objects) {
      const saved = restored[fieldObjectKey(input.mapKey, object.definition.name)];
      if (saved) object.apply(saved);
    }
  }

  captureGameState(
    game: GameState,
    input: {
      mapKey: string;
      currentArea: string;
      position: { x: number; y: number };
      facing: MapEntryFacing;
    },
  ): GameState {
    return {
      ...game,
      progress: {
        ...game.progress,
        currentMap: input.mapKey,
        currentArea: input.currentArea,
        position: input.position,
        fieldSnapshot: captureFieldResume({
          mapKey: input.mapKey,
          facing: input.facing,
          objects: this.objects.map((object) => object.read()),
          previous: game.progress.fieldSnapshot,
        }),
      },
    };
  }

  private readNpc<T extends RuntimeFieldNpc>(
    input: RegisterNpcInput<T>,
    tileX: number,
    tileY: number,
  ): FieldObjectState {
    return {
      name: input.npc.key,
      persistState: input.npc.persistState,
      tileX,
      tileY,
      facing: input.npc.facing,
      visible: input.npc.sprite.visible,
    };
  }

  private placeNpc<T extends RuntimeFieldNpc>(input: RegisterNpcInput<T>, saved: PersistedFieldObject): void {
    const { npc } = input;
    const target = saved.tileY * input.mapWidth + saved.tileX;
    if (saved.visible && target !== npc.tile && input.blocked.has(target)) return;
    input.npcs.delete(npc.tile);
    input.blocked.delete(npc.tile);
    npc.tile = target;
    npc.facing = saved.facing;
    const x = saved.tileX * 16 + 8;
    const y = saved.tileY * 16 + 8;
    npc.sprite.setPosition(x, y).setDepth(y).setVisible(saved.visible).setFrame(walkFrame(saved.facing, 1));
    npc.shadow.setPosition(x, y + 6).setVisible(saved.visible);
    if (!saved.visible) return;
    input.npcs.set(target, npc);
    input.blocked.add(target);
  }
}
