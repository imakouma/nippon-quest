import { describe, expect, it } from 'vitest';
import type { QuestionBase } from '../../src/questions/contracts';
import { kanjiCategory } from '../../src/tools/kanjiCategory';

const question = (type: string, payload: object): QuestionBase => ({
  id: 'kokugo.g2.kanji.0001',
  unit: 'kokugo.g2.kanji',
  subject: 'kokugo',
  grade: 2,
  type,
  payload,
});

describe('漢字問題の分類', () => {
  it('実際になぞる問題だけを書きに分類する', () => {
    expect(kanjiCategory(question('kanji-trace', { mode: 'trace' }))).toBe('writing');
  });
  it('漢字を選ぶだけの問題は書きに分類しない', () => {
    expect(kanjiCategory(question('choice', { prompt: '正しい漢字を選ぼう' }))).not.toBe('writing');
    expect(kanjiCategory(question('choice', { prompt: 'ただしい かん字は どれ？' }))).not.toBe('writing');
  });
  it('読みを問う問題は読みに分類する', () => {
    expect(kanjiCategory(question('choice', { prompt: '漢字の読[よ]み方は？' }))).toBe('reading');
  });
  it('単元名だけでは推測せず不明なものを要確認とする', () => {
    expect(kanjiCategory(question('choice', { prompt: '文章の組み立ては？' }))).toBe('review');
    expect(kanjiCategory(null)).toBe('review');
  });
});
