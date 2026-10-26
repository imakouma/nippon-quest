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
  setPosition() {
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
});
