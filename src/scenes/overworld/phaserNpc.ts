import type Phaser from 'phaser';
import { CHAR_H, CHAR_W, NPC_LOOKS, walkFrame, walkSheet, type Dir } from '../../rendering/characters';
import { addSheet } from '../../rendering/sheet';
import type { DialogueLine } from '../../ui/dialogue';
import type { WanderingNpc } from './npcWander';

interface CreatePhaserNpcInput {
  key: string;
  role: string;
  name: string;
  lines: DialogueLine[];
  tile: [number, number];
  mapWidth: number;
  facing: Dir;
  persistState: boolean;
  nextMoveAt: number;
  ferry?: WanderingNpc['ferry'];
}

export function createPhaserNpc(scene: Phaser.Scene, input: CreatePhaserNpcInput): WanderingNpc {
  const look = NPC_LOOKS[input.role] ?? NPC_LOOKS.talk!;
  const texture = `char.npc.${NPC_LOOKS[input.role] ? input.role : 'talk'}`;
  addSheet(scene.textures, texture, walkSheet(look), CHAR_W, CHAR_H);
  const [tileX, tileY] = input.tile;
  const x = tileX * 16 + 8;
  const y = tileY * 16 + 8;
  const shadow = scene.add
    .image(x, y + 6, 'fld.shadow')
    .setAlpha(0.3)
    .setDepth(1);
  const sprite = scene.add
    .sprite(x, y, texture, walkFrame(input.facing, 1))
    .setOrigin(0.5, 16 / CHAR_H)
    .setDepth(y);
  return {
    key: input.key,
    tile: tileY * input.mapWidth + tileX,
    facing: input.facing,
    persistState: input.persistState,
    role: input.role,
    name: input.name,
    lines: input.lines,
    sprite,
    shadow,
    home: [tileX, tileY],
    moving: false,
    nextMoveAt: input.nextMoveAt,
    ...(input.ferry ? { ferry: input.ferry } : {}),
  };
}

export function addNpcRoleSign(scene: Phaser.Scene, role: string, tileX: unknown, tileY: unknown): void {
  if (typeof tileX !== 'number' || typeof tileY !== 'number' || !scene.textures.exists(`ico.role-${role}`))
    return;
  const x = tileX * 16 + 8;
  const y = tileY * 16 + 8;
  scene.add.image(x, y, 'fld.plate').setDepth(tileY * 16 + 1);
  scene.add.image(x, y + 1, `ico.role-${role}`).setDepth(tileY * 16 + 2);
}
