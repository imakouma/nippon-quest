import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface ChoiceQuestion {
  id: string;
  payload: {
    prompt: string;
    choices: { id: string; text: string }[];
    answer: string;
  };
}

const questions = JSON.parse(
  readFileSync('content/questions/kokugo/g1/katakana.json', 'utf8'),
) as ChoiceQuestion[];

const question = (id: string) => questions.find((item) => item.id === id)!;
const correctText = (item: ChoiceQuestion) =>
  item.payload.choices.find((choice) => choice.id === item.payload.answer)?.text;

describe('1年生2学期 国語の片仮名', () => {
  it('外来語を、平仮名の音と片仮名の表記で結び付ける', () => {
    expect(question('kokugo.g1.katakana.0001').payload.prompt).toContain('「ばす」');
    expect(correctText(question('kokugo.g1.katakana.0001'))).toBe('バス');

    expect(question('kokugo.g1.katakana.0005').payload.prompt).toContain('「しゃつ」');
    expect(correctText(question('kokugo.g1.katakana.0005'))).toBe('シャツ');
  });
});
