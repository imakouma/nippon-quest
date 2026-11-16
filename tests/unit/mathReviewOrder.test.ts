import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { QuestionBase } from '../../src/questions/contracts';
import { mathReviewGroups, mathReviewMatches, mathReviewRank } from '../../src/tools/mathReviewOrder';

const directory = 'content/questions/sansu/g1';
const questions = readdirSync(directory).flatMap((unit) =>
  readdirSync(join(directory, unit)).flatMap(
    (file) => JSON.parse(readFileSync(join(directory, unit, file), 'utf8')) as QuestionBase[],
  ),
);
const find = (id: string) => questions.find((q) => q.id === id)!;

describe('小1算数の学習順レビュー', () => {
  it('現行189問を学習順に一度だけ収録する', () => {
    const ids = mathReviewGroups.flatMap((group) => group.questionIds);
    expect(questions).toHaveLength(189);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(questions.map((q) => q.id).sort());
  });
  it('基礎35問を対応から10づくりへ並べ、元の単元を変更しない', () => {
    const before = JSON.stringify(questions);
    expect(mathReviewGroups.slice(0, 7).reduce((n, group) => n + group.questionIds.length, 0)).toBe(35);
    expect(
      mathReviewMatches(find('sansu.g1.kazu-100.correspondence-0001'), 'math-review:correspondence'),
    ).toBe(true);
    expect(mathReviewMatches(find('sansu.g1.kazu-100.count-0002'), 'math-review:ordinal')).toBe(true);
    expect(mathReviewMatches(find('sansu.g1.kazu-100.place-value-0001'), 'math-review:correspondence')).toBe(
      false,
    );
    expect(mathReviewRank(find('legacy.sansu.g1.math-1-1.1fa82b870bfb'))).toBeLessThan(
      mathReviewRank(find('legacy.sansu.g1.math-1-1.46333eaf85df')),
    );
    expect(JSON.stringify(questions)).toBe(before);
  });
  it('繰り上がる9+3を入門たし算に混ぜない', () => {
    const question = find('sansu.g1.tashizan.0005');
    expect(mathReviewMatches(question, 'math-review:addition')).toBe(false);
    expect(mathReviewMatches(question, 'math-review:carry-addition')).toBe(true);
  });
  it('式欠落13問は修復待ちで、通常の計算には混ぜない', () => {
    const quarantined = questions.filter((q) => q.tags?.includes('runtime:quarantined-missing-context'));
    expect(quarantined).toHaveLength(13);
    for (const question of quarantined) {
      expect(mathReviewMatches(question, 'math-review:repair')).toBe(true);
      expect(mathReviewMatches(question, 'math-review:addition')).toBe(false);
    }
  });
  it('新しい小1問題は未分類へ出し、他学年・教科は含めない', () => {
    const q = { ...questions[0]!, id: 'new-question' };
    expect(mathReviewMatches(q, 'math-review:unclassified')).toBe(true);
    expect(mathReviewMatches({ ...q, grade: 2 }, 'math-review:unclassified')).toBe(false);
    expect(mathReviewMatches({ ...q, subject: 'kokugo' }, 'math-review:unclassified')).toBe(false);
    expect(mathReviewMatches(null, 'math-review:unclassified')).toBe(false);
    expect(mathReviewMatches(q, 'math-review:nonexistent')).toBe(false);
  });
});
