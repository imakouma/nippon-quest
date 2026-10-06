import Phaser from 'phaser';
import type { Dir } from '../../rendering/characters';

/** 主人公のそばを飛ぶミチルを生成し、案内を開く入力だけを接続する。 */
export function createMichiruFollower(
  scene: Phaser.Scene,
  player: Phaser.GameObjects.Sprite,
  onOpen: () => void,
): Phaser.GameObjects.Sprite {
  const michiru = scene.add
    .sprite(player.x - 12, player.y - 14, 'fld.michiru')
    .setInteractive({ useHandCursor: true });
  michiru.on(
    'pointerdown',
    (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      onOpen();
    },
  );
  return michiru;
}

/** 毎フレーム、ミチルを主人公の顔の反対側へ滑らかに追従させる。 */
export function positionMichiruFollower(
  michiru: Phaser.GameObjects.Sprite,
  player: Phaser.GameObjects.Sprite,
  facing: Dir,
  time: number,
): void {
  const side = facing === 'left' ? 12 : -12;
  const targetX = player.x + side;
  const targetY = player.y - 14 + Math.sin(time / 180) * 2;
  michiru.setPosition(
    Phaser.Math.Linear(michiru.x, targetX, 0.2),
    Phaser.Math.Linear(michiru.y, targetY, 0.2),
  );
  michiru.setDepth(player.y + 1);
}
