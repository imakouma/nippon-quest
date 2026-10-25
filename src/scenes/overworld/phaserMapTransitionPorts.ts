import Phaser from 'phaser';
import type { EffectScope } from '../../core/lifecycle/effectScope';
import type { MapTransitionPorts } from './mapTransitionPipeline';
import { ownFieldCameraEffect } from './phaserFieldEffectScope';

export function createPhaserMapTransitionPorts(
  scene: Phaser.Scene,
  closeTransientUi: () => void,
  scope: EffectScope,
): MapTransitionPorts {
  return {
    closeTransientUi,
    fadeOut: (signal) =>
      new Promise<void>((resolve) => {
        const camera = ownFieldCameraEffect(scope, scene.cameras.main);
        const event = Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE;
        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
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
