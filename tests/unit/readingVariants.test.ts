import { describe, expect, it } from 'vitest';
import { textInputScore } from '../../src/questions/renderers/text-input/schema';

describe('同じ語の読みのゆれ', () => {
  it.each([
    ['貴い たいけんを する', 'とうと', 'たっと', 'い'],
    ['尊い いのちを まもる', 'とうと', 'たっと', 'い'],
    ['これは 私の ほんです', 'わたし', 'わたくし', ''],
    ['あり得る ことを かんがえる', 'う', 'え', 'る'],
  ])('%s はどちらの正しい読みも受け付ける', (prompt, answer, variant, ending) => {
    const payload = { prompt, template: `よみかた：{{INPUT}}${ending}`, answers: [answer] };
    expect(textInputScore(payload, [answer])).toBe(1);
    expect(textInputScore(payload, [variant])).toBe(1);
    expect(textInputScore(payload, ['まちがい'])).toBe(0);
    if (ending) expect(textInputScore(payload, [variant + ending])).toBe(0);
  });

  it('他の漢字や別の語へ読みのゆれを適用しない', () => {
    expect(textInputScore({ prompt: 'やむを得ない', answers: ['え'] }, ['う'])).toBe(0);
    expect(textInputScore({ prompt: '荷を はこぶ', answers: ['に'] }, ['たっと'])).toBe(0);
    expect(textInputScore({ prompt: '尊い', answers: ['たっと'] }, ['とうと'])).toBe(1);
    expect(textInputScore({ prompt: 'わたし と かこう', answers: ['わたし'] }, ['わたくし'])).toBe(0);
    expect(textInputScore({ prompt: '私りつの がっこう', answers: ['し'] }, ['わたし'])).toBe(0);
  });
});
