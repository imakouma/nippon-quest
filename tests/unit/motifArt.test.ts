import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { MOTIF_SCENES, SCENES, motifArtGrid, motifScene } from '../../src/rendering/motifArt';
import { MA } from '../../src/rendering/motifArt/kit';
import { NQ, NQ48 } from '../../src/rendering/palette';

const SPECIALTY = new Set(['food', 'craft']);

describe('名所の絵（えはがき）', () => {
  it('名所（特産品 いがい）は ぜんぶ 場面が きまっていて、その 場面が ある', async () => {
    const c = await content();
    const missing: string[] = [];
    for (const a of c.areas.values())
      for (const m of a.motifs) if (!SPECIALTY.has(m.kind) && !motifScene(m)) missing.push(`${a.id}.${m.id}`);
    expect(missing, missing.join(', ')).toEqual([]);
  });

  it('MOTIF_SCENES の 場面は ぜんぶ SCENES に ある（打ちまちがい なし）', () => {
    for (const [id, s] of Object.entries(MOTIF_SCENES))
      expect(SCENES, `${id} → ${s}`).toHaveProperty(s.split(':')[0]!);
  });

  it('32×32・色は NQ-48 だけ・わくは ink・からっぽでない', async () => {
    const c = await content();
    for (const a of c.areas.values())
      for (const m of a.motifs) {
        if (SPECIALTY.has(m.kind)) continue;
        const g = motifArtGrid(a.id, m)!;
        expect(g.length).toBe(MA);
        for (let i = 0; i < MA; i++)
          for (const col of [g[0]![i], g[MA - 1]![i], g[i]![0], g[i]![MA - 1]]) expect(col).toBe(NQ.ink);
        const cells = g.flat().filter((x): x is string => !!x);
        expect(cells.length, m.id).toBe(MA * MA);
        for (const col of cells) expect(NQ48, `${m.id}: ${col}`).toContain(col);
      }
  });
});
