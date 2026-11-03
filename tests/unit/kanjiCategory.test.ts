import { describe, expect, it } from 'vitest';
import type { QuestionBase } from '../../src/questions/contracts';
import {
  kanjiCategory,
  kanjiOtherKind,
  kanjiReadingKind,
  kanjiScope,
  kanjiScopeMatches,
} from '../../src/tools/kanjiCategory';
import { isKanjiUnit } from '../../src/tools/folderLayout';

const question = (type: string, payload: object, tags?: string[]): QuestionBase => ({
  id: 'kokugo.g2.kanji.0001',
  unit: 'kokugo.g2.kanji',
  subject: 'kokugo',
  grade: 2,
  type,
  tags,
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
  it('明示タグで音読みと訓読みへ分類する', () => {
    const on = question('choice', { prompt: '読みは？' }, ['kanji:reading:on']);
    const kun = question('choice', { prompt: '読みは？' }, ['kanji:reading:kun']);
    expect(kanjiCategory(on)).toBe('reading');
    expect(kanjiReadingKind(on)).toBe('on');
    expect(kanjiReadingKind(kun)).toBe('kun');
  });
  it('音訓を特定できない一般的な読み問題はその他とする', () => {
    expect(kanjiCategory(question('choice', { prompt: '漢字の読[よ]み方は？' }))).toBe('review');
  });
  it('四字熟語と対義語・類義語をその他の専用フォルダへ分類する', () => {
    expect(kanjiOtherKind(question('choice', { prompt: '正しい四字熟語はどれ？' }))).toBe('idiom');
    expect(kanjiOtherKind(question('choice', { prompt: '「一石二鳥」の意味は？' }))).toBe('idiom');
    expect(kanjiOtherKind(question('choice', { prompt: '「強い」の対義語はどれ？' }))).toBe('relation');
    expect(kanjiOtherKind(question('choice', { prompt: '文章の組み立ては？' }))).toBe('misc');
  });
  it('単元名だけでは推測せず不明なものをその他とする', () => {
    expect(kanjiCategory(question('choice', { prompt: '文章の組み立ては？' }))).toBe('review');
    expect(kanjiCategory(null)).toBe('review');
  });
  it('合成フォルダの対象問題だけを選ぶ', () => {
    const on = question('choice', { prompt: '読みは？' }, ['kanji:reading:on']);
    expect(kanjiScope(2, 'on')).toBe('kanji-scope:2:on');
    expect(kanjiScopeMatches(on, 'kanji-scope:2:on')).toBe(true);
    expect(kanjiScopeMatches(on, 'kanji-scope:2:kun')).toBe(false);
    expect(kanjiScopeMatches(on, 'kanji-scope:1:on')).toBe(false);
  });
  it('四字熟語と対義語・類義語の単元を漢字フォルダへ含める', () => {
    expect(
      isKanjiUnit('kokugo.g6.idiom', new Map([['kokugo.g6.idiom', '四[よん]字[じ]熟語[じゅくご]']])),
    ).toBe(true);
    expect(
      isKanjiUnit(
        'kokugo.g5.relation',
        new Map([['kokugo.g5.relation', 'にてる言葉[ことば]・はんたいの言葉[ことば]']]),
      ),
    ).toBe(true);
  });
});
