import Phaser from 'phaser';
import { render } from 'preact';

export interface OverworldRestartData {
  mapKey: string;
  spawnName: string;
  spawnTile?: [number, number];
  exactSpawn: boolean;
  interPrefectureArrival: boolean;
}

/** 背景タブで Phaser の fade 完了イベントが止まっても、必ず次のマップへ進める。 */
export function restartOverworldMap(
  scene: Phaser.Scene,
  dialogueRoot: HTMLElement,
  data: OverworldRestartData,
): void {
  render(null, dialogueRoot);
  const camera = scene.cameras.main;
  let moved = false;
  const restart = () => {
    if (moved) return;
    moved = true;
    scene.scene.restart(data);
  };
  camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, restart);
  const guard = window.setTimeout(restart, 600);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.clearTimeout(guard));
  camera.fadeOut(250, 0, 0, 0);
}
