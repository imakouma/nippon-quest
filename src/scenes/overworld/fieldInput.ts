import Phaser from 'phaser';
import type { Dir } from '../../rendering/characters';

interface FieldInputCallbacks {
  canInteract(): boolean;
  player(): Phaser.GameObjects.Sprite;
  onInteract(): void;
  onAreaMap(): void;
  onMenu(): void;
}

/** Keyboard, virtual-stick, and pointer-hold input share one direction reader. */
export class FieldInputController {
  private readonly cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd?: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private touchDirection: Dir | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly callbacks: FieldInputCallbacks,
  ) {
    const keyboard = scene.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
      this.wasd = keyboard.addKeys('W,A,S,D') as Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
      for (const event of ['keydown-SPACE', 'keydown-ENTER', 'keydown-Z'])
        keyboard.on(event, callbacks.onInteract);
      keyboard.on('keydown-M', callbacks.onAreaMap);
      keyboard.on('keydown-I', callbacks.onMenu);
    }
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!callbacks.canInteract()) return;
      const world = pointer.positionToCamera(scene.cameras.main) as Phaser.Math.Vector2;
      const player = callbacks.player();
      if (Phaser.Math.Distance.Between(player.x, player.y - 4, world.x, world.y) < 20) callbacks.onInteract();
    });
  }

  setTouchDirection(direction: Dir | null): void {
    this.touchDirection = direction;
  }

  readDirection(): Dir | null {
    const c = this.cursors;
    const k = this.wasd;
    if (c?.left.isDown || k?.A.isDown) return 'left';
    if (c?.right.isDown || k?.D.isDown) return 'right';
    if (c?.up.isDown || k?.W.isDown) return 'up';
    if (c?.down.isDown || k?.S.isDown) return 'down';
    if (this.touchDirection) return this.touchDirection;
    const pointer = this.scene.input.activePointer;
    if (!pointer.isDown || pointer.getDuration() <= 150) return null;
    const world = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
    const player = this.callbacks.player();
    const dx = world.x - player.x;
    const dy = world.y - (player.y - 4);
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) return null;
    return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
  }
}
