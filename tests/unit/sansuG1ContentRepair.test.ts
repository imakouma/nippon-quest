import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { QuestionBase } from '../../src/questions/contracts';
import { questionHasAnswerContext } from '../../src/questions/engine/questionQuality';
import { QuestionBank } from '../../src/questions/engine/bank';
import audit from '../../imports/legacy-questions/reviews/sansu-g1-context-repair.json';
import { mathReviewMatches } from '../../src/tools/mathReviewOrder';

const dir = 'content/questions/sansu/g1';
const files = readdirSync(dir).flatMap((unit) =>
  readdirSync(join(dir, unit)).map((file) => join(dir, unit, file)),
);
const questions: QuestionBase[] = files.flatMap((file) => JSON.parse(readFileSync(file, 'utf8')));

describe('小1算数の移行欠落修復', () => {
  it('元資料の13式を復元し、計算結果と回答が一致する', () => {
    expect(audit.repairs).toHaveLength(13);
    for (const repair of audit.repairs) {
      const q = questions.find((q) => q.id === repair.id)!;
      const payload = q.payload as { prompt: string; template?: string; answers: string[] };
      const match = repair.qtextTemplate.match(/^\$(\d+)([+-])(\d+)=\$$/)!;
      const a = Number(match[1]),
        b = Number(match[3]);
      const value = match[2] === '+' ? a + b : a - b;
      expect(payload.template).toBe(`${a} ${match[2]} ${b} = {{INPUT}}`);
      expect(payload.answers).toEqual([String(value)]);
      expect(repair.answer).toBe(String(value));
      expect(q.tags).not.toContain('runtime:quarantined-missing-context');
      expect(questionHasAnswerContext(q)).toBe(true);
      expect(mathReviewMatches(q, `math-review:${repair.learningGroup}`)).toBe(true);
    }
  });
  it('全204固定問に内容のある解説があり、47件の補完対象を網羅する', () => {
    const fixed = questions.filter((q) => q.type !== 'random-calculation');
    expect(fixed).toHaveLength(204);
    expect(audit.explanationQuestionIds).toHaveLength(47);
    for (const q of fixed) expect(q.explanation?.length, q.id).toBeGreaterThan(10);
  });
  it('修復した13問をランタイムの出題候補へ戻す', async () => {
    const { bank } = await QuestionBank.load(files, async (file) => JSON.parse(readFileSync(file, 'utf8')));
    const ids = new Set(bank.all().map((q) => q.id));
    for (const repair of audit.repairs) expect(ids.has(repair.id), repair.id).toBe(true);
  });
});
