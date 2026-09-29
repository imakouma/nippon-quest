import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { lookup, type I18nDict } from '../../src/ui/i18n';
import { skillLook, subjectFxKey, unitFxKey } from '../../src/scenes/battle/skillLook';

const ja = JSON.parse(readFileSync(new URL('../../content/i18n/ja.json', import.meta.url), 'utf8')) as I18nDict;
const text = (k: string) => lookup(ja, k);

describe('必殺技の 見た目（タイプ・教科・単元）', () => {
  it('技が つかう 単元と 教科には、とぶ 字が ある', async () => {
    const c = await content();
    for (const sk of c.skills.values()) {
      expect(text(subjectFxKey(sk.subject)), sk.subject).toBeTruthy();
      for (const u of sk.unitHint ?? []) expect(text(unitFxKey(u)), u).toBeTruthy();
    }
  });

  it('どの 技も 字と きめの ことばが あり、タイプで 演出が かわる', async () => {
    const c = await content();
    for (const sk of c.skills.values()) {
      const look = skillLook(sk, text);
      expect(look.glyphs.length, sk.id).toBeGreaterThan(0);
      expect(look.big.length, sk.id).toBeGreaterThan(0);
    }
    expect(skillLook(c.skills.get('sk-kanji-barrier')!, text).kind).toBe('barrier');
    expect(skillLook(c.skills.get('sk-shiraberu')!, text).kind).toBe('scan');
    expect(skillLook(c.skills.get('sk-tashizan-giri')!, text).kind).toBe('attack');
  });

  it('教科で 演出が、単元で 字が かわる（たしざんは ＋の 式、九九は ×の 式、ひかりは にじ）', async () => {
    const c = await content();
    const tashi = skillLook(c.skills.get('sk-tashizan-giri')!, text);
    expect(tashi.style).toBe('equation');
    expect(tashi.big.every((w) => w.includes('＋'))).toBe(true);
    const kuku = skillLook(c.skills.get('sk-kuku-rush')!, text);
    expect(kuku.big.some((w) => w.includes('×'))).toBe(true);
    expect(skillLook(c.skills.get('sk-hikari-no-ya')!, text).extra).toBe('prism');
    expect(skillLook(c.skills.get('sk-fubuki')!, text).extra).toBe('ice');
    expect(skillLook(c.skills.get('sk-hono-no-mai')!, text).style).toBe('write');
    expect(skillLook(c.skills.get('sk-abc-shout')!, text).style).toBe('speech');
    // 単元の ない 技（バースト）は 教科の 字
    const burst = skillLook(c.skills.get('sk-burst-shakai')!, text);
    expect(burst.style).toBe('stamp');
    expect(burst.glyphs).toContain('〒');
  });
});
