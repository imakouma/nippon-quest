import { describe, expect, it } from 'vitest';
import skills from '../../content/skills.json';
import { content } from './helpers';
import elements from '../../content/balance/elements.json';
import { ICONS } from '../../src/rendering/icons';

describe('教科と属性の対応', () => {
  it('３教科の技は算数＝水、国語＝火、生活科＝木', () => {
    const expected: Record<string, string> = { sansu: 'mizu', kokugo: 'hino', seikatsu: 'mori' };
    for (const skill of skills) {
      if (expected[skill.subject]) expect(skill.element, skill.id).toBe(expected[skill.subject]);
    }
  });
  it('問題に割り当てた技も、実際に使う教科の属性を保つ', async () => {
    const c = await content();
    const expected: Record<string, string> = { sansu: 'mizu', kokugo: 'hino', seikatsu: 'mori' };
    for (const skill of c.skills.values()) {
      if (expected[skill.subject]) expect(skill.element, skill.id).toBe(expected[skill.subject]);
    }
  });
  it('水は火に強く、火は木に強く、木は水に強い', () => {
    expect(elements.multipliers.mizu.hino).toBeGreaterThan(1);
    expect(elements.multipliers.hino.mori).toBeGreaterThan(1);
    expect(elements.multipliers.mori.mizu).toBeGreaterThan(1);
    expect(elements.multipliers.hino.mizu).toBeLessThan(1);
    expect(elements.multipliers.mori.hino).toBeLessThan(1);
    expect(elements.multipliers.mizu.mori).toBeLessThan(1);
  });
  it('教科と属性は同じドット絵で表す', () => {
    expect(ICONS['subj-sansu']).toBe(ICONS['el-mizu']);
    expect(ICONS['subj-kokugo']).toBe(ICONS['el-hino']);
    expect(ICONS['subj-seikatsu']).toBe(ICONS['el-mori']);
    for (const name of ['el-hino', 'el-mizu', 'el-mori']) {
      expect(ICONS[name].rows).toHaveLength(8);
      expect(ICONS[name].rows.every((row) => row.length === 8)).toBe(true);
    }
  });
});
