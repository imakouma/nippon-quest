import { describe, expect, it } from 'vitest';
import { commandPriority, initiativeOrder } from '../../src/core/battle/initiative';
import { createRng } from '../../src/core/rng';

describe('バトルの行動順', () => {
  it('通常行動は主人公・オトモ・敵を素早さの高い順に一度ずつ並べる', () => {
    expect(
      initiativeOrder(
        [
          { actor: 'hero', speed: 12, priority: 0 },
          { actor: 'companion', speed: 30, priority: 0 },
          { actor: 'enemy', speed: 20, priority: 0 },
        ],
        createRng('speed-order'),
      ),
    ).toEqual(['companion', 'enemy', 'hero']);
  });

  it('道具・交代・逃走は、相手の素早さにかかわらず通常行動より先になる', () => {
    for (const command of [
      { kind: 'item', itemId: 'item' } as const,
      { kind: 'swap', monsterIndex: 1 } as const,
      { kind: 'flee' } as const,
    ]) {
      expect(
        initiativeOrder(
          [
            { actor: 'hero', speed: 1, priority: commandPriority(command) },
            { actor: 'enemy', speed: 999, priority: 0 },
          ],
          createRng(command.kind),
        )[0],
      ).toBe('hero');
    }
  });

  it('同速抽選はシードで再現でき、全員がちょうど一度だけ行動する', () => {
    const entries = [
      { actor: 'hero' as const, speed: 10, priority: 0 },
      { actor: 'companion' as const, speed: 10, priority: 0 },
      { actor: 'enemy' as const, speed: 10, priority: 0 },
    ];
    const first = initiativeOrder(entries, createRng('tie-break'));
    expect(initiativeOrder(entries, createRng('tie-break'))).toEqual(first);
    expect([...first].sort()).toEqual(['companion', 'enemy', 'hero']);
  });
});
