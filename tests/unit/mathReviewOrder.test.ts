import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { QuestionBase } from '../../src/questions/contracts';
import { mathReviewGroupsByGrade, mathReviewMatches, mathReviewRank } from '../../src/tools/mathReviewOrder';

const mathReviewGroups = mathReviewGroupsByGrade[1]!;
const directory = 'content/questions/sansu/g1';
const questions = readdirSync(directory).flatMap((unit) =>
  readdirSync(join(directory, unit)).flatMap(
    (file) => JSON.parse(readFileSync(join(directory, unit, file), 'utf8')) as QuestionBase[],
  ),
);
const find = (id: string) => questions.find((q) => q.id === id)!;

describe('小1算数の学習順レビュー', () => {
  it('現行207問を学習順に一度だけ収録する', () => {
    const ids = mathReviewGroups.flatMap((group) => group.questionIds);
    expect(questions).toHaveLength(207);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(questions.map((q) => q.id).sort());
  });
  it('基礎35問を対応から10づくりへ並べ、元の単元を変更しない', () => {
    const before = JSON.stringify(questions);
    expect(mathReviewGroups.slice(0, 7).reduce((n, group) => n + group.questionIds.length, 0)).toBe(35);
    expect(
      mathReviewMatches(find('sansu.g1.kazu-100.correspondence-0001'), 'math-review:1:correspondence'),
    ).toBe(true);
    expect(mathReviewMatches(find('sansu.g1.kazu-100.count-0002'), 'math-review:1:ordinal')).toBe(true);
    expect(
      mathReviewMatches(find('sansu.g1.kazu-100.place-value-0001'), 'math-review:1:correspondence'),
    ).toBe(false);
    expect(mathReviewRank(find('legacy.sansu.g1.math-1-1.1fa82b870bfb'))).toBeLessThan(
      mathReviewRank(find('legacy.sansu.g1.math-1-1.46333eaf85df')),
    );
    expect(JSON.stringify(questions)).toBe(before);
  });
  it('繰り上がる9+3を入門たし算に混ぜない', () => {
    const question = find('sansu.g1.tashizan.0005');
    expect(mathReviewMatches(question, 'math-review:1:addition')).toBe(false);
    expect(mathReviewMatches(question, 'math-review:1:carry-addition')).toBe(true);
  });
  it('復元済み13問を基本加減へ戻し、修復待ちに残さない', () => {
    const repaired = questions.filter((q) => q.tags?.includes('repaired:source-template-v1'));
    expect(repaired).toHaveLength(13);
    expect(questions.some((q) => q.tags?.includes('runtime:quarantined-missing-context'))).toBe(false);
    for (const q of repaired) {
      const group = q.unit.endsWith('math-1-2') ? 'addition' : 'subtraction';
      expect(mathReviewMatches(q, `math-review:1:${group}`)).toBe(true);
      expect(mathReviewMatches(q, 'math-review:1:repair')).toBe(false);
    }
  });
  it('新しい小1問題は未分類へ出し、他学年・教科は含めない', () => {
    const q = { ...questions[0]!, id: 'new-question' };
    expect(mathReviewMatches(q, 'math-review:1:unclassified')).toBe(true);
    expect(mathReviewMatches({ ...q, grade: 2 }, 'math-review:1:unclassified')).toBe(false);
    expect(mathReviewMatches({ ...q, subject: 'kokugo' }, 'math-review:1:unclassified')).toBe(false);
    expect(mathReviewMatches(null, 'math-review:1:unclassified')).toBe(false);
    expect(mathReviewMatches(q, 'math-review:2:unclassified')).toBe(false);
    expect(mathReviewMatches({ ...q, grade: 2 }, 'math-review:2:unclassified')).toBe(true);
    expect(mathReviewMatches(q, 'math-review:1:nonexistent')).toBe(false);
  });
});

for (const [grade, groups] of Object.entries(mathReviewGroupsByGrade)) {
  it(`小${grade}の全問題を一度だけ収録し、学年間で混ぜない`, () => {
    const dir = `content/questions/sansu/g${grade}`;
    const all = readdirSync(dir).flatMap((unit) =>
      readdirSync(join(dir, unit)).flatMap(
        (file) => JSON.parse(readFileSync(join(dir, unit, file), 'utf8')) as QuestionBase[],
      ),
    );
    const ids = groups.flatMap((group) => group.questionIds);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(all.map((q) => q.id).sort());
    expect(new Set(groups.map((group) => group.id)).size).toBe(groups.length);
    for (const group of groups) {
      const members = all.filter((q) => mathReviewMatches(q, `math-review:${grade}:${group.id}`));
      expect(members.map((q) => q.id).sort()).toEqual([...group.questionIds].sort());
      for (const otherGrade of [1, 2, 3, 4, 5, 6].filter((n) => n !== Number(grade)))
        expect(all.some((q) => mathReviewMatches(q, `math-review:${otherGrade}:${group.id}`))).toBe(false);
    }
  });
}

it('小1から小6まで学ぶ順を登録する', () => {
  expect(Object.keys(mathReviewGroupsByGrade)).toEqual(['1', '2', '3', '4', '5', '6']);
});
