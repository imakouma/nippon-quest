import { beforeEach, describe, expect, it } from 'vitest';
import ja from '../../content/i18n/ja.json';
import { setDictionary } from '../../src/ui/i18n';
import { getTextInputSpeech, mathSpeech } from '../../src/questions/renderers/shared/questionSpeech';

beforeEach(() => setDictionary(ja));
describe('input question speech', () => {
  it('reads ruby, fractions, decimals, operators and units', () => {
    expect(mathSpeech('長[なが]さ 7.6cm ＋ 2mm = □')).toBe(
      'ながさ 7てん6センチメートル たす 2ミリメートル は しかく',
    );
    expect(mathSpeech('\\frac{1}{2} L × 3 ÷ 2')).toBe('2分の1 リットル かける 3 わる 2');
  });
  it('reads a repeated template only once and never reads answers', () => {
    expect(getTextInputSpeech({ prompt: '3+2=', template: '3+2={{INPUT}}', answers: ['5'] })).toBe(
      '3たす2はしかく',
    );
  });
  it('does not repeat a prompt when only ruby differs', () => {
    expect(
      getTextInputSpeech({
        prompt: '5人[にん]で わける。こ',
        template: '5人で わける。{{INPUT}}こ',
        answers: ['3'],
      }),
    ).toBe('5人で わける。しかくこ');
  });
  it('includes the illustration description and a separate equation', () => {
    const speech = getTextInputSpeech({
      prompt: '表[ひょう]をみよう',
      promptImageAlt: '赤[あか]が3こ',
      template: '3+{{INPUT}}=8',
      answers: ['5'],
      suffix: 'こ',
    });
    expect(speech).toBe('ひょうをみよう。あかが3こ。3たすしかくは8。こ');
    expect(speech).not.toContain('5');
  });
  it('does not repeat a unit already present in the template', () => {
    expect(
      getTextInputSpeech({ prompt: '長[なが]さは？', template: '{{INPUT}}cm', suffix: 'cm', answers: ['9'] }),
    ).toBe('ながさは？。しかくセンチメートル');
  });
});
