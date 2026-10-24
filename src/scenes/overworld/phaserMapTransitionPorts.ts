import Phaser from 'phaser';
import type { MapTransitionPorts } from './mapTransitionPipeline';

export function createPhaserMapTransitionPorts(
  scene: Phaser.Scene,
  closeTransientUi: () => void,
): MapTransitionPorts {
  return {
    closeTransientUi,
    fadeOut: (signal) =>
      new Promise<void>((resolve) => {
        const camera = scene.cameras.main;
        const event = Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE;
        const finish = () => {
          camera.off(event, finish);
          signal.removeEventListener('abort', finish);
          resolve();
        };
        camera.once(event, finish);
        signal.addEventListener('abort', finish, { once: true });
        camera.fadeOut(250, 0, 0, 0);
      }),
    restart: (request) => scene.scene.restart({ transitionRequest: request }),
  };
}
