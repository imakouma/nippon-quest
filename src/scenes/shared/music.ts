import Phaser from 'phaser';
import type { GameState } from '../../core/state/schema';
import { music, type MusicSession, type MusicTrack } from '../../ui/bgm';

export function attachSceneMusic(scene: Phaser.Scene, track: MusicTrack): MusicSession {
  const volume = () => (scene.registry.get('game') as GameState | undefined)?.settings.bgmVolume ?? 0.6;
  const session = music.start(track, volume());
  const syncVolume = () => session.setVolume(volume());
  const stop = () => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, syncVolume);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, stop);
    scene.events.off(Phaser.Scenes.Events.DESTROY, stop);
    session.stop();
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, syncVolume);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, stop);
  scene.events.once(Phaser.Scenes.Events.DESTROY, stop);
  return session;
}
