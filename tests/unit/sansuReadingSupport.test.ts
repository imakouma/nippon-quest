import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const questions = JSON.parse(
  readFileSync('content/questions/sansu/g3/legacy-math-3-5/set-001.json', 'utf8'),
) as { id: string; payload: { prompt: string } }[];

describe('算数の読み補助', () => {
  it('時刻と回数の問題文に読みを付ける', () => {
    const prompt = questions.find((q) => q.id.endsWith('98489571fd39'))!.payload.prompt;
    for (const text of [
      '午後[ごご]',
      '午前[ごぜん]',
      '時計[とけい]',
      '一回目[いっかいめ]',
      '二回目[にかいめ]',
    ])
      expect(prompt).toContain(text);
  });
});

it('分数と時刻で分の読みを区別する', () => {
  const fraction = readFileSync('content/questions/sansu/g2/legacy-math-2-17/set-001.json', 'utf8');
  const time = readFileSync('content/questions/sansu/g3/legacy-math-3-5/set-001.json', 'utf8');
  expect(fraction).toContain('何分[なんぶん]の１');
  expect(time).toContain('45分[ふん]');
});

it('隔離済みの選択問題は読み込み時に出題候補へ入らない', async () => {
  const { QuestionBank } = await import('../../src/questions/engine/bank');
  const path = 'content/questions/sansu/g3/legacy-math-3-18/set-001.json';
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const { bank, report } = await QuestionBank.load([path], async () => data);
  expect(report.quarantined).toBe(8);
  expect(bank.all().some((question) => question.tags?.includes('runtime:quarantined-missing-context'))).toBe(
    false,
  );
});
