import type Phaser from 'phaser';
import { ELEVATION_UNIT_PX, projectedWorldY } from '../../core/world/terrainElevation';
import { entranceIconDepth, entranceIconScale } from '../../rendering/overworld/entranceIcons';
import type { MapKind } from './geography';
import { fieldGateIcon } from './overworldFieldInteraction';

interface TransitionMarkerOptions {
  kind: MapKind;
  target: string;
  x: number;
  y: number;
  tileSize: number;
  elevation: number;
  locked: boolean;
}

export function addTransitionMarker(
  scene: Phaser.Scene,
  { kind, target, x, y, tileSize, elevation, locked }: TransitionMarkerOptions,
): Phaser.GameObjects.Image {
  const icon = fieldGateIcon(kind, target);
  const isTown = icon === 'fld.icon.town';
  const pad = scene.add
    .image(x * tileSize + tileSize / 2, projectedWorldY((y + 1) * tileSize, elevation), icon)
    .setOrigin(0.5, isTown ? 1 : 0.5)
    .setDepth(entranceIconDepth(icon, y, tileSize) - elevation * ELEVATION_UNIT_PX);
  if (isTown) pad.setDisplaySize(tileSize * entranceIconScale(target), tileSize * entranceIconScale(target));
  if (locked) pad.setTint(0x555566);
  else if (icon === 'fld.gate')
    scene.tweens.add({
      targets: pad,
      alpha: 0.55,
      yoyo: true,
      repeat: -1,
      duration: 700,
      ease: 'Stepped',
      easeParams: [3],
    });
  return pad;
}
