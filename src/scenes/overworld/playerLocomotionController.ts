import type Phaser from 'phaser';
import {
  advanceLocomotion,
  createLocomotionState,
  dispatchLocomotion,
  type Dir,
  type LocomotionCommand,
  type LocomotionEvent,
  type LocomotionState,
  type TilePoint,
} from '../../core/world/playerLocomotion';
import { presentPlayerMotion } from './playerMotionPresenter';

/** Scene の Phaser オブジェクトと純粋な移動ランタイムだけを接続する。 */
export class PlayerLocomotionController {
  private state: LocomotionState;
  private logicalTile: TilePoint;

  constructor(
    private readonly sprite: Phaser.GameObjects.Sprite,
    private readonly shadow: Phaser.GameObjects.Image,
    private readonly tileSize: number,
    facing: Dir,
    tile: TilePoint,
    private textureKey: string,
  ) {
    this.state = createLocomotionState(facing);
    this.logicalTile = { ...tile };
    this.present();
  }

  get phase(): LocomotionState['phase'] {
    return this.state.phase;
  }

  get facing(): Dir {
    return this.state.facing;
  }

  get moving(): boolean {
    return this.phase === 'turning' || this.phase === 'stepping' || this.phase === 'bumping';
  }

  tile(): [number, number] {
    return [this.logicalTile.x, this.logicalTile.y];
  }

  advance(deltaMs: number): LocomotionEvent[] {
    return this.apply(advanceLocomotion(this.state, deltaMs));
  }

  dispatch(command: LocomotionCommand): LocomotionEvent[] {
    return this.apply(dispatchLocomotion(this.state, command));
  }

  setTexture(textureKey: string): void {
    this.textureKey = textureKey;
    this.present();
  }

  present(): void {
    let tileX = this.logicalTile.x;
    let tileY = this.logicalTile.y;
    if (this.state.phase === 'stepping') {
      tileX += (this.state.to.x - this.state.from.x) * this.state.progress;
      tileY += (this.state.to.y - this.state.from.y) * this.state.progress;
    }
    const anchorX = tileX * this.tileSize + this.tileSize / 2;
    const anchorY = tileY * this.tileSize + this.tileSize / 2;
    presentPlayerMotion({
      sprite: this.sprite,
      shadow: this.shadow,
      textureKey: this.textureKey,
      state: this.state,
      anchorX,
      anchorY,
    });
    this.sprite.setDepth(anchorY);
  }

  private apply(result: { state: LocomotionState; events: LocomotionEvent[] }): LocomotionEvent[] {
    this.state = result.state;
    const completed = result.events.find((event) => event.type === 'stepCompleted');
    if (completed?.type === 'stepCompleted') this.logicalTile = { ...completed.to };
    this.present();
    return result.events;
  }
}
