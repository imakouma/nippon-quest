import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
type Q = {
  id: string;
  explanation?: string;
  payload: { prompt: string; template?: string; answer?: string; choices?: { id: string; text: string }[] };
};
function read(dir: string): Q[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? read(join(dir, e.name))
      : e.name.endsWith('.json')
        ? (JSON.parse(readFileSync(join(dir, e.name), 'utf8')) as Q[])
        : [],
  );
}
const questions = [...read('content/questions/rika'), ...read('content/questions/shakai')];
const plain = (s: string) => s.replace(/\[[^\]]+\]/g, '');
const q = (id: string) => questions.find((item) => item.id === id)!;
const correct = (item: Q) => plain(item.payload.choices!.find((c) => c.id === item.payload.answer)!.text);
describe('science and social question repair', () => {
  it('scores safe magnifier use and biodiversity correctly', () => {
    expect(q('legacy.rika.g3.cur-1503-01.45d11cceb0fa').payload.answer).toBe('c1');
    expect(q('legacy.rika.g3.cur-1503-01.83348d998a7c').payload.answer).toBe('c2');
  });
  it('provides reproducible alum precipitation conditions', () => {
    const item = q('legacy.rika.g5.sci-5-8.7fbcce511f9f');
    for (const value of ['60', '20', '50', '28.7']) expect(plain(item.payload.prompt)).toContain(value);
    expect(Number.parseFloat(correct(item))).toBeCloseTo(28.7 - 5.7);
  });
  it('respects the small nonzero salt solubility change', () => {
    const item = q('legacy.rika.g5.sci-5-8.5873cbbd2dfc');
    expect(plain(item.payload.prompt)).toContain('18.5');
    expect(Number.parseFloat(correct(item))).toBeCloseTo(18.5 - 17.9);
  });
  it('specifies all three ammeter ranges', () => {
    for (const [suffix, range, result] of [
      ['2fa9f234fb43', '50 mA', '20 mA'],
      ['534dd855967a', '500 mA', '360 mA'],
      ['e389972bb978', '5 A', '1.2 A'],
    ]) {
      const item = q(`legacy.rika.g5.sci-5-9.${suffix}`);
      expect(plain(item.payload.prompt)).toContain(range);
      expect(correct(item)).toBe(result);
    }
  });
  it('identifies the false cloud/rain statement explicitly', () => {
    expect(plain(q('legacy.rika.g5.sci-5-1.aaf2066e055b').payload.prompt)).toContain('まちがっている');
  });
  it('keeps the flag distractors factual', () => {
    const item = q('legacy.shakai.g5.soc-5-1.04d970fa769f');
    expect(plain(item.payload.choices!.find((c) => c.id === 'c2')!.text)).toContain('3つ');
    expect(correct(item)).toContain('変えられることはない');
  });
  it('distinguishes national candidacy from local recall rights', () => {
    expect(plain(q('legacy.shakai.g6.soc-6-1.17758e7d3e62').payload.prompt)).toContain('国会議員');
  });
  it('keeps restored response slots and germination conditions aligned', () => {
    expect(plain(q('legacy.rika.g5.sci-5-1.b3d8a89df8aa').payload.prompt)).not.toContain('日本語名');
    expect(plain(q('legacy.rika.g5.sci-5-2.76ec94e370e1').payload.prompt)).toContain('④');
    const air = q('legacy.rika.g5.sci-5-2.a389a6eed208');
    expect(plain(air.payload.prompt)).toContain('図のA');
    expect(plain(air.payload.prompt)).toContain('20℃');
    expect(correct(air)).toBe('◯・×・20 ℃');
  });
  it('leaves no generic prompt without its question or blanks', () => {
    for (const item of questions.filter((item) => /^legacy\.rika\.g[56]\./.test(item.id))) {
      const p = plain(item.payload.prompt);
      expect(p, item.id).not.toMatch(
        /^(次の問いに答えよう。|かっこに当てはまる(?:数字や)?言葉をえらぼう。)$/,
      );
      if (/かっこに当てはまる/.test(p)) expect(p + (item.payload.template ?? ''), item.id).toMatch(/[①②□]/);
      if (!item.payload.template)
        expect(p, item.id).not.toMatch(
          /(?:実験を行った|表にした|表している|調べた|消えてしまった|比べた)。?$/,
        );
    }
  });
});
