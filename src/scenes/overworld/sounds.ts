import type Phaser from 'phaser';
import type { Ground } from '../../core/world/ground';
import { groundOfTile } from '../../core/world/ground';
import type { GameState } from '../../core/state/schema';
import { playSfx, preloadFieldSfx, setSfxVolume, type SfxName } from '../../ui/sfx';
import { mapKind, type MapKind } from './geography';

export function footstepSound(kind: MapKind, ground: Ground | null): SfxName {
  if (kind === 'town' || kind === 'dungeon' || kind === 'secret' || ground === 'mountain')
    return 'step-stone';
  if (ground === 'beach') return 'step-sand';
  if (ground === 'shore') return 'step-water';
  return 'step-grass';
}

export function playFieldFootstep(mapKey: string, tile: number | undefined): void {
  playSfx(footstepSound(mapKind(mapKey), groundOfTile(tile)));
}

export function playEntranceSound(fromMap: string, toMap: string): void {
  const interior = (map: string) => ['town', 'dungeon', 'secret'].includes(mapKind(map));
  if (fromMap !== toMap && (interior(fromMap) || interior(toMap))) playSfx('door');
}

export function attachFieldSounds(scene: Phaser.Scene): void {
  const syncVolume = () => {
    const game = scene.registry.get('game') as GameState | undefined;
    setSfxVolume(game?.settings.seVolume ?? 0.8);
  };
  syncVolume();
  void preloadFieldSfx();
  scene.registry.events.on('changedata-game', syncVolume);
  scene.events.once('shutdown', () => scene.registry.events.off('changedata-game', syncVolume));
}
