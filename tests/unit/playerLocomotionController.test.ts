import { describe, expect, it } from 'vitest';
import { PlayerLocomotionController } from '../../src/scenes/overworld/playerLocomotionController';

const sprite = () => ({
  active: true,
  texture: { key: 'hero' },
  setTexture(key: string) {
    this.texture.key = key;
    return this;
  },
  setFrame() {
    return this;
  },
  setPosition() {
    return this;
  },
  setDepth() {
    return this;
  },
});

const shadow = () => ({
  x: 0,
  y: 0,
  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  },
  setScale() {
    return this;
  },
});

describe('PlayerLocomotionController', () => {
  it('delivers one foot plant and one arrival for one completed tile step', () => {
    const controller = new PlayerLocomotionController(
      sprite() as never,
      shadow() as never,
      16,
      'right',
      { x: 2, y: 3 },
      'hero',
    );

    expect(
      controller.dispatch({
        type: 'step',
        direction: 'right',
        from: { x: 2, y: 3 },
        to: { x: 3, y: 3 },
      }),
    ).toHaveLength(1);
    expect(controller.advance(80)).toEqual([]);
    expect(controller.advance(80).map((event) => event.type)).toEqual(['footPlanted', 'stepCompleted']);
    expect(controller.advance(160)).toEqual([]);
    expect(controller.tile()).toEqual([3, 3]);
  });

  it('interpolates one shared terrain height for the player and shadow while stepping', () => {
    const player = sprite();
    const playerShadow = shadow();
    const controller = new PlayerLocomotionController(
      player as never,
      playerShadow as never,
      16,
      'down',
      { x: 1, y: 73 },
      'hero',
      (_x, y) => (y === 73 ? 4 : y === 74 ? 3 : 0),
    );

    expect(playerShadow.y).toBe(73 * 16 + 8 - 4 * 4 + 6);
    controller.dispatch({
      type: 'step',
      direction: 'down',
      from: { x: 1, y: 73 },
      to: { x: 1, y: 74 },
    });
    controller.advance(80);
    expect(playerShadow.y).toBe(73.5 * 16 + 8 - 3.5 * 4 + 6);
    controller.advance(80);
    expect(playerShadow.y).toBe(74 * 16 + 8 - 3 * 4 + 6);
  });
});
