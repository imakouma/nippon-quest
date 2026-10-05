import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { ITEM_ICON_SIZE, itemIconDesign, itemIconGrid } from '../../src/rendering/itemIcons';
import { NQ, NQ48 } from '../../src/rendering/palette';

describe('アイテムのアイコン', () => {
  it('ぜんぶの どうぐに アイコンがあり、色は NQ-48 だけ・外周の輪郭が切れていない', async () => {
    const c = await content();
    expect(c.items.size).toBeGreaterThan(0);
    for (const it of c.items.values()) {
      const g = itemIconGrid(it);
      expect(g.length, it.id).toBe(ITEM_ICON_SIZE);
      const cells = g.flat().filter((x): x is string => !!x);
      // からっぽでない（ちゃんと かたちがある）
      expect(cells.length, it.id).toBeGreaterThan(30);
      for (const col of cells) expect(NQ48, `${it.id}: ${col}`).toContain(col);
      const S = ITEM_ICON_SIZE;
      for (let i = 0; i < S; i++)
        for (const col of [g[0]![i], g[S - 1]![i], g[i]![0], g[i]![S - 1]])
          if (col) expect(col, it.id).toBe(NQ.ink);
    }
  });

  it('地名の 文字に まどわされない（淡路の たまねぎが 魚・スイカが いか に ならない）', async () => {
    const c = await content();
    const shape = (id: string) => itemIconDesign(c.items.get(id)!).shape;
    const want: Record<string, string> = {
      'aomori-ringo': 'fruit',
      'nagano-shinshu-ringo': 'fruit',
      'hyogo-awaji-tamanegi': 'onion',
      'hyogo-awaji-senko': 'rush',
      'ishikawa-wajimanuri': 'lacquer',
      'kagoshima-sakurajima-daikon': 'root',
      'kumamoto-kumamoto-suika': 'watermelon',
      'kumamoto-yatsushiro-igusa': 'rush',
      'kagawa-ajiishi': 'ore',
      'oita-seki-aji': 'fish',
      'saga-yobuko-ika': 'squid',
      'toyama-hotaruika': 'squid',
      'gifu-hidagyu': 'steak',
      'hyogo-tajimaushi': 'steak',
      'yamagata-yonezawa-gyu': 'steak',
    };
    for (const [id, s] of Object.entries(want)) if (c.items.has(id)) expect(shape(id), id).toBe(s);
  });

  it('ほとんどの どうぐは、名前に合った かたち（種類だけの かたちに ならない）', async () => {
    const c = await content();
    const all = [...c.items.values()];
    const fallback = all.filter((it) => itemIconDesign(it).fallback).map((it) => it.id);
    expect(fallback.length / all.length, fallback.join(', ')).toBeLessThan(0.05);
  });
});
