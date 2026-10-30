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
  it('読みと書きを問題単位で分ける', () => {
    expect(kanjiCategory(question('kanji-trace', { mode: 'trace' }))).toBe('writing');
    expect(kanjiCategory(question('choice', { prompt: '漢字の読[よ]み方は？' }))).toBe('reading');
    expect(kanjiCategory(question('choice', { prompt: '正しい漢字を選ぼう' }))).toBe('writing');
  });
  it('単元名だけでは推測せず不明なものを要確認とする', () => {
    expect(kanjiCategory(question('choice', { prompt: '文章の組み立ては？' }))).toBe('review');
    expect(kanjiCategory(null)).toBe('review');
  });
});
