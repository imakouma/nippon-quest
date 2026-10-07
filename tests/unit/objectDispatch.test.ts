import { describe, expect, it } from 'vitest';
import { dispatchMapObjects } from '../../src/scenes/overworld/objectDispatch';

describe('Tiled object dispatcher', () => {
  it('種類ごとのハンドラーへタイル座標を渡し、未知の種類を無視する', () => {
    const calls: string[] = [];
    const handler = (kind: string) => (object: { name?: string }, x: number, y: number) =>
      calls.push(`${kind}:${object.name}:${x},${y}`);
    const noObject = (kind: string) => (_object: object, x: number, y: number) =>
      calls.push(`${kind}:${x},${y}`);
    dispatchMapObjects(
      [
        { type: 'transition', name: 'town', x: 32, y: 48 },
        { type: 'midboss', x: 16, y: 0 },
        { type: 'unknown', x: 0, y: 0 },
      ],
      {
        beforeAll: () => calls.push('before'),
        transition: handler('transition'),
        npc: handler('npc'),
        chest: handler('chest'),
        midboss: noObject('midboss'),
        regionGate: handler('regionGate'),
        structure: handler('structure'),
        regionBoss: handler('regionBoss'),
        boss: noObject('boss'),
        lastboss: noObject('lastboss'),
        event: handler('event'),
        landmark: handler('landmark'),
        specialty: handler('specialty'),
      },
    );
    expect(calls).toEqual(['before', 'transition:town:2,3', 'midboss:1,0']);
  });
});
