import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/core/rng';

describe('rng', () => {
  it('同じシードなら同じ列', () => {
    const a = createRng('seed-1');
    const b = createRng('seed-1');
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });
  it('違うシードなら違う列', () => {
    expect(createRng('a').next()).not.toBe(createRng('b').next());
  });
  it('int は範囲内', () => {
    const r = createRng('x');
    for (let i = 0; i < 500; i++) {
      const v = r.int(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });
  it('chance は確率どおり（±3%）', () => {
    const r = createRng('p');
    let hit = 0;
    for (let i = 0; i < 20000; i++) if (r.chance(0.25)) hit++;
    expect(hit / 20000).toBeGreaterThan(0.22);
    expect(hit / 20000).toBeLessThan(0.28);
  });
  it('weighted は重みどおり', () => {
    const r = createRng('w');
    const count = { a: 0, b: 0 };
    for (let i = 0; i < 10000; i++)
      count[
        r.weighted([
          { item: 'a' as const, weight: 3 },
          { item: 'b' as const, weight: 1 },
        ])
      ]++;
    expect(count.a / 10000).toBeGreaterThan(0.7);
  });
  it('state から再開できる', () => {
    const a = createRng('s');
    a.next();
    a.next();
    const resumed = createRng('s', a.state());
    expect(resumed.next()).toBe(a.next());
  });
});
