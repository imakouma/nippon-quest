import { describe, expect, it, vi } from 'vitest';
vi.mock('phaser', () => ({ default: {} }));
import { FieldInputController } from '../../src/scenes/overworld/fieldInput';

describe('移動キー設定', () => {
  it('選択したキーだけで移動し、タッチ操作は常に使える', () => {
    let mode: 'both' | 'arrows' | 'wasd' = 'both';
    const key = (isDown = false) => ({ isDown });
    const controller = Object.create(FieldInputController.prototype) as FieldInputController;
    Object.assign(controller, {
      callbacks: { movementKeys: () => mode },
      cursors: { left: key(true), right: key(), up: key(), down: key() },
      wasd: { A: key(), D: key(true), W: key(), S: key() },
      touchDirection: null,
      scene: { input: { activePointer: { isDown: false } } },
    });
    expect(controller.readDirection()).toBe('left');
    mode = 'arrows';
    expect(controller.readDirection()).toBe('left');
    mode = 'wasd';
    expect(controller.readDirection()).toBe('right');
    controller.setTouchDirection('up');
    Object.assign(controller, { wasd: { A: key(), D: key(), W: key(), S: key() } });
    expect(controller.readDirection()).toBe('up');
  });
});
