import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import type { QuestionBase } from '../../src/questions/contracts';
import { nonMathReviewOrders, orderUnitQuestions } from '../../src/tools/nonMathReviewOrder';

const entry = (id: string, unit = 'kokugo.g1.kanji') => ({
  key: id,
  q: { id, unit, subject: 'kokugo', grade: 1 } as QuestionBase,
});

const questions = readdirSync('content/questions', { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.json') && !file.startsWith('_samples/'))
  .flatMap((file) => JSON.parse(readFileSync(`content/questions/${file}`, 'utf8')) as QuestionBase[])
  .filter((q) => q.subject !== 'sansu');

it('全教科・全学年の現行問題を元の単元に一度だけ登録する', () => {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const ids: string[] = [];
  const units = new Set<string>();
  for (const order of nonMathReviewOrders) {
    for (const group of order.groups) {
      expect(units.has(group.unit)).toBe(false);
      units.add(group.unit);
      const ordered = [...group.basic, ...group.standard, ...group.applied];
      expect(ordered.length).toBeGreaterThan(0);
      expect(group.rationale).not.toBe('');
      for (const id of ordered) {
        const q = byId.get(id);
        expect(q, id).toBeDefined();
        expect(q!.grade).toBe(group.grade);
        expect(q!.unit).toBe(group.unit);
        expect(q!.subject).toBe(order.subject === 'kanji' ? 'kokugo' : order.subject);
      }
      ids.push(...ordered);
      // 入力のファイル順に依存せず、単元全体で監査した順を復元する。
      const entries = [...ordered].reverse().map((id) => ({ q: byId.get(id)! }));
      expect(orderUnitQuestions(entries).map(({ q }) => q.id)).toEqual(ordered);
    }
  }
  expect(new Set(ids).size).toBe(ids.length);
  expect([...ids].sort()).toEqual(questions.map((q) => q.id).sort());
});

describe('算数以外の単元内学習順', () => {
  it('漢字のなぞり書きは少ない画数から始め、単字の読み入力へ進む', () => {
    const reading = entry('kokugo.g1.kanji-kunyomi.0001');
    const mountain = entry('kokugo.g1.kanji-trace.0001');
    const one = entry('kokugo.g1.kanji-writing.0001');
    const input = [reading, mountain, one];
    expect(orderUnitQuestions(input).map((e) => e.key)).toEqual([one.key, mountain.key, reading.key]);
    expect(input).toEqual([reading, mountain, one]);
  });

  it('複数単元の結果は元の単元位置を保ち、未登録問題と不正データを消さない', () => {
    const reading = entry('kokugo.g1.kanji-kunyomi.0001');
    const basic = entry('kokugo.g1.kanji-writing.0001');
    const other = entry('new-other', 'kokugo.g1.other');
    const newQuestion = entry('new-question');
    const invalid = { key: 'invalid', q: null };
    const input = [reading, other, newQuestion, invalid, basic];
    expect(orderUnitQuestions(input)).toEqual([basic, other, newQuestion, invalid, reading]);
  });

  it('算数、空配列、同一問題の安定性を保つ', () => {
    const math = { key: 'math', q: { ...entry('math').q, subject: 'sansu' } as QuestionBase };
    const basic = entry('kokugo.g1.kanji-writing.0001');
    expect(orderUnitQuestions([])).toEqual([]);
    expect(orderUnitQuestions([math, basic, basic])).toEqual([math, basic, basic]);
  });

  it('共通メタデータを読めてもpayload不正の問題は位置を保つ', () => {
    const reading = entry('kokugo.g1.kanji-kunyomi.0001');
    const broken = { ...entry('kokugo.g1.kanji-writing.0001'), problem: 'invalid payload' };
    const mountain = entry('kokugo.g1.kanji-trace.0001');
    expect(orderUnitQuestions([reading, broken, mountain])).toEqual([mountain, broken, reading]);
  });
});

it.each([
  [
    '理科のふりこの名称から周期の活用へ',
    'legacy.rika.g5.sci-5-10.07c43e687ea6',
    'legacy.rika.g5.sci-5-10.0344a263169b',
  ],
  [
    '社会の縮尺の用語から距離換算へ',
    'legacy.shakai.g3.cur-1403-01.7b6c4853f03d',
    'legacy.shakai.g3.cur-1403-01.22b761f19559',
  ],
  ['小1の文字の規則から拗音へ', 'kokugo.g1.hiragana.0018', 'kokugo.g1.hiragana.0004'],
  [
    '小2の主述の定義から抽出へ',
    'legacy.kokugo.g2.jpn-2-3.1810bf465df2',
    'legacy.kokugo.g2.jpn-2-3.54101d35f41f',
  ],
  [
    '小3の基本ローマ字から拗音へ',
    'legacy.kokugo.g3.jpn-3-15.fc237c5b020b',
    'legacy.kokugo.g3.jpn-3-15.6a96c117f7a9',
  ],
  [
    '小4の接続語の働きから適用へ',
    'legacy.kokugo.g4.jpn-4-2.0e51e42657ca',
    'source.kokugo.g4.jpn-4-2.f1bd103fc101',
  ],
  [
    '小5の語種の定義から分類へ',
    'legacy.kokugo.g5.jpn-5-4.9dcbffc29ffd',
    'legacy.kokugo.g5.jpn-5-4.12b737f65774',
  ],
  [
    '小6の敬語の分類から使い分けへ',
    'legacy.kokugo.g6.jpn-6-2.a313620c327c',
    'source.kokugo.g6.jpn-6-2.c4d48e6fc1be',
  ],
  [
    '英語の位置語から状況に合う応答へ',
    'eigo.g4.directions-requests.0013',
    'eigo.g4.directions-requests.0015',
  ],
  ['生活科の栽培計画から育ち方の比較へ', 'seikatsu.g2.vegetables.0001', 'seikatsu.g2.vegetables.0004'],
])('%s', (_label, basic, applied) => {
  const first = questions.find((q) => q.id === basic);
  const last = questions.find((q) => q.id === applied);
  expect(first).toBeDefined();
  expect(last).toBeDefined();
  expect(orderUnitQuestions([{ q: last! }, { q: first! }]).map(({ q }) => q.id)).toEqual([basic, applied]);
});
