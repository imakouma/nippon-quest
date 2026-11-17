import { readFileSync, readdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { inspectQuestion } from '../../src/tools/questionLayoutAudit';

const questions = readdirSync('content/questions/sansu/g1').flatMap((unit) => {
  const dir = `content/questions/sansu/g1/${unit}`;
  return readdirSync(dir).flatMap((file) => JSON.parse(readFileSync(`${dir}/${file}`, 'utf8')));
}) as {
  id: string;
  explanation: string;
  payload: { choices?: { id: string; text: string }[]; answer?: string; answers?: string[] };
}[];

for (const width of [390, 1280])
  for (const q of questions.filter((q) => q.id.startsWith('sansu.g1.balance.'))) {
    test(`${width}px 小1の補強問題と解説 ${q.id}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/playground.html?q=${q.id}`);
      await expect(page.getByRole('heading', { name: '問題レビュー', exact: true })).toBeVisible();
      await expect(page.locator('.pg-stage')).not.toBeEmpty();
      await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
      await expect
        .poll(() =>
          page
            .locator('.pg-stage img')
            .evaluateAll((els) =>
              els.every(
                (el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0,
              ),
            ),
        )
        .toBe(true);
      if (width === 1280)
        await page
          .locator('.pg-stage')
          .screenshot({ path: `.cache/g1-balance-${q.id.split('.').at(-1)}.png` });
      if (q.payload.choices) {
        const correct = q.payload.choices.find((c) => c.id === q.payload.answer)!;
        await page.locator('.nq-choice').filter({ hasText: correct.text }).click();
      } else {
        for (const [index, answer] of q.payload.answers!.entries())
          await page.getByRole('textbox', { name: `こたえ ${index + 1}`, exact: true }).fill(answer);
        await page.getByRole('button', { name: 'こたえる', exact: true }).click();
      }
      await expect(page.locator('.nq-feedback-correct')).toBeVisible();
      await page.getByRole('button', { name: 'かいせつ', exact: true }).click();
      await expect(page.locator('.nq-review p')).toContainText(q.explanation);
      await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
    });
  }
