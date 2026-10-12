import Phaser from 'phaser';
import type { MusicSession } from '../../ui/bgm';
import { attachSceneMusic } from '../shared/music';

let session: MusicSession | null = null;

export function attachBattleBgm(scene: Phaser.Scene, isBoss: boolean, teardown: () => void): void {
  const current = attachSceneMusic(scene, isBoss ? 'boss' : 'battle');
  session = current;
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    if (session === current) session = null;
    teardown();
  });
}

export function finishBattleBgm(outcome: string): void {
  if (outcome === 'victory' || outcome === 'defeat') session?.change(outcome);
}
