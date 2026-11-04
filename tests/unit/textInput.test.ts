import { describe, expect, it } from 'vitest';
import {
  normalizeInput,
  textInputPayloadSchema,
  textInputScore,
} from '../../src/questions/renderers/text-input/schema';
describe('text-input', () => {
  it('全角数字・空白・桁区切りを正規化する', () => expect(normalizeInput(' ４２,１９５ ')).toBe('42195'));
  it('複数欄を部分点つきで採点する', () =>
    expect(textInputScore({ prompt: 'p', answers: ['4', '2'] }, ['4', '3'])).toBe(0.5));
});

describe('text-input numeric grading', () => {
  const score = (answer: string, value: string) =>
    textInputScore({ prompt: 'p', answers: [answer] }, [value]);

  it('同じ10進数を桁数や全角にかかわらず正解にする', () => {
    expect(score('7.6', '７．６０')).toBe(1);
    expect(score('0.5', '00.500')).toBe(1);
    expect(score('0', '-0.00')).toBe(1);
    expect(textInputScore({ prompt: 'p', answers: ['7.6', '2'] }, ['7.60', '3'])).toBe(0.5);
  });

  it('丸めで異なる値を同じにせず、数値以外の文字列一致を維持する', () => {
    expect(score('9007199254740992', '9007199254740993')).toBe(0);
    expect(score('0.1', '0.10000000000000001')).toBe(0);
    expect(score('1', '')).toBe(0);
    for (const value of ['Infinity', 'NaN', '0x10', '1e0', '1/2']) {
      expect(score('1', value)).toBe(0);
      expect(score(value, value)).toBe(1);
    }
    expect(score('1/2', '2/4')).toBe(0);
  });
});

it('画像の代替テキストを保持し、空文字を拒否する', () => {
  const payload = { prompt: 'p', answers: ['1'], promptImageAlt: '表の説明' };
  expect(textInputPayloadSchema.parse(payload).promptImageAlt).toBe('表の説明');
  expect(textInputPayloadSchema.safeParse({ ...payload, promptImageAlt: '' }).success).toBe(false);
  expect(textInputPayloadSchema.safeParse({ prompt: 'p', answers: ['1'] }).success).toBe(true);
});
