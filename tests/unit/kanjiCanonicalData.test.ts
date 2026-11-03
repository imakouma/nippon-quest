import { describe, expect, it } from 'vitest';
import { validateKanjiCanonicalData } from '../../scripts/validate-kanji-canonical';

const validRecord = {
  character: '王',
  grade: 1,
  onyomi: [{ reading: 'オウ', examples: [{ word: '王子', reading: 'おうじ' }] }],
  kunyomi: [],
  sourceIds: ['mext-grade-kanji-table', 'bunka-joyo-kanji-table'],
};

const validate = (records: unknown) =>
  validateKanjiCanonicalData(records, {
    expectedByGrade: { '1': '王' },
    knownSourceIds: new Set(['mext-grade-kanji-table', 'bunka-joyo-kanji-table']),
  });

describe('正規漢字データの検証', () => {
  it('正しい最小データを変更せず受理する', () => {
    const records = [structuredClone(validRecord)];
    const before = structuredClone(records);

    expect(validate(records)).toEqual([]);
    expect(records).toEqual(before);
  });

  it.each([
    ['漢字の重複', [validRecord, validRecord], '漢字「王」が重複しています'],
    ['対象外の学年', [{ ...validRecord, grade: 7 }], 'grade は1から6'],
    [
      '平仮名の音読み',
      [{ ...validRecord, onyomi: [{ reading: 'おう', examples: [{ word: '王子', reading: 'おうじ' }] }] }],
      '音読み「おう」は片仮名',
    ],
    [
      '片仮名の訓読み',
      [
        {
          ...validRecord,
          onyomi: [],
          kunyomi: [{ reading: 'オオ', examples: [{ word: '王', reading: 'おう' }] }],
        },
      ],
      '訓読み「オオ」は平仮名',
    ],
    ['音訓なし', [{ ...validRecord, onyomi: [], kunyomi: [] }], '音読みか訓読みが必要です'],
    [
      '対象漢字を含まない用例',
      [{ ...validRecord, onyomi: [{ reading: 'オウ', examples: [{ word: '皇子', reading: 'おうじ' }] }] }],
      '用例「皇子」に対象漢字がありません',
    ],
    [
      '空の用例読み',
      [{ ...validRecord, onyomi: [{ reading: 'オウ', examples: [{ word: '王子', reading: '' }] }] }],
      '用例「王子」の読みが空です',
    ],
    [
      '未登録の出典',
      [{ ...validRecord, sourceIds: ['mext-grade-kanji-table', 'unknown-source'] }],
      '未登録の出典「unknown-source」',
    ],
  ])('%sを拒否する', (_name, records, message) => {
    expect(validate(records).some((error) => error.includes(message))).toBe(true);
  });

  it('学年別配当との文字・学年の不一致を拒否する', () => {
    expect(
      validateKanjiCanonicalData([validRecord], {
        expectedByGrade: { '1': '', '2': '王山' },
        knownSourceIds: new Set(validRecord.sourceIds),
      }),
    ).toEqual(
      expect.arrayContaining([
        '漢字「王」の学年は1ですが、配当表では2です',
        '配当表の漢字「山」が正規データにありません',
      ]),
    );
  });
});
