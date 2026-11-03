import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { validateKanjiCanonicalData } from '../../scripts/validate-kanji-canonical';

const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url));
const readJson = (path: string): unknown => JSON.parse(readFileSync(CONTENT + path, 'utf8'));

const validRecord = {
  character: '王',
  grade: 1,
  onyomi: [{ reading: 'オウ', examples: [{ word: '王子', reading: 'オウ' }] }],
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
      '対象の音訓と異なる用例読み',
      [{ ...validRecord, onyomi: [{ reading: 'オウ', examples: [{ word: '王子', reading: 'おうじ' }] }] }],
      '用例「王子」の対象漢字の読みは「オウ」にしてください',
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

describe('小学校1026字の正規データ', () => {
  const records = readJson('curriculum/kanji-readings.json');
  const grades = readJson('i18n/kanji-grades.json') as { byGrade: Record<string, string> };
  const ledger = readJson('quality/academic-reviews.json') as { sources: { id: string }[] };

  it('既存の学年配当表および登録済み出典と完全に一致する', () => {
    const errors = validateKanjiCanonicalData(records, {
      expectedByGrade: grades.byGrade,
      knownSourceIds: new Set(ledger.sources.map((source) => source.id)),
    });

    expect(errors).toEqual([]);
    expect(records).toHaveLength(1026);
    expect(
      Object.fromEntries(
        [1, 2, 3, 4, 5, 6].map((grade) => [
          grade,
          (records as { grade: number }[]).filter((record) => record.grade === grade).length,
        ]),
      ),
    ).toEqual({ 1: 80, 2: 160, 3: 200, 4: 202, 5: 193, 6: 191 });
  });

  it('音訓が片方だけの代表例へ存在しない読みを追加しない', () => {
    const byCharacter = new Map(
      (
        records as {
          character: string;
          onyomi: { reading: string }[];
          kunyomi: { reading: string }[];
        }[]
      ).map((record) => [record.character, record]),
    );

    expect(byCharacter.get('王')).toMatchObject({ onyomi: [{ reading: 'オウ' }], kunyomi: [] });
    expect(byCharacter.get('貝')).toMatchObject({ onyomi: [], kunyomi: [{ reading: 'かい' }] });
    expect(byCharacter.get('畑')).toMatchObject({
      onyomi: [],
      kunyomi: [{ reading: 'はた' }, { reading: 'はたけ' }],
    });
  });
});
