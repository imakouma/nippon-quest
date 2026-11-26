import { describe, expect, it } from 'vitest';
import type Phaser from 'phaser';
import { playMusubiResult } from '../../src/scenes/battle/musubiAnimation';

async function sequence(success: boolean): Promise<string[]> {
  const events: string[] = [];
  const ball = {
    setScale() {
      return this;
    },
    setDepth() {
      return this;
    },
    destroy() {
      events.push('destroy');
    },
  };
  const scene = {
    add: { image: () => ball },
    time: {
      delayedCall: (_ms: number, done: () => void) => {
        events.push('pause');
        queueMicrotask(done);
      },
    },
    tweens: {
      add: (config: { angle?: number; onComplete(): void }) => {
        events.push(config.angle === undefined ? 'finish' : 'swing');
        queueMicrotask(config.onComplete);
      },
    },
  } as unknown as Phaser.Scene;
  await playMusubiResult(
    scene,
    { x: 100, y: 100 },
    success,
    () => events.push('result'),
    () => events.push('shake'),
  );
  return events;
}

describe('むすび玉の結果待ち', () => {
  it('成功は３回、失敗は２回揺れ、結果は揺れ終わるまで見せない', async () => {
    const success = await sequence(true);
    const failure = await sequence(false);
    expect(success.filter((event) => event === 'shake')).toHaveLength(3);
    expect(failure.filter((event) => event === 'shake')).toHaveLength(2);
    expect(success.slice(0, failure.indexOf('result'))).toEqual(failure.slice(0, failure.indexOf('result')));
    expect(success.lastIndexOf('shake')).toBeLessThan(success.indexOf('result'));
    expect(failure.lastIndexOf('shake')).toBeLessThan(failure.indexOf('result'));
  });
});
