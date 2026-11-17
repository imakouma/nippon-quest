import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
test.setTimeout(60_000);
import { inspectQuestion } from '../../src/tools/questionLayoutAudit';
const questions = readdirSync('content/questions/sansu/g4').flatMap((dir) =>
  readdirSync(`content/questions/sansu/g4/${dir}`).flatMap((file) =>
    JSON.parse(readFileSync(`content/questions/sansu/g4/${dir}/${file}`, 'utf8')),
  ),
) as {
  id: string;
  tags: string[];
  payload: { prompt: string; choices?: { id: string; text: string }[]; answer?: string; answers?: string[] };
}[];
const examples = questions.filter(
  (q) =>
    q.tags.includes('source:original-curriculum-review') ||
    [
      '3067e6e62169',
      '0e2787ecd5a4',
      '059ff8d0c43f',
      '0194f6e1fbb5',
      '41e217e934d3',
      '24cb632a07ae',
      '026229489a63',
      '63035ed0d4c0',
      '67bb346e3fbb',
      '2172e4438493',
      '456c85f1bcb4',
      '045462a9d9e5',
      '41468bc19db0',
    ].some((h) => q.id.endsWith(h)),
);
for (const width of [390, 1280])
  for (const q of examples) {
    test(`${width}px 小4正答・解説・図 ${q.id}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/playground.html?q=${q.id}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: '問題レビュー', exact: true })).toBeVisible();
      await expect(page.locator('.pg-stage')).not.toBeEmpty();
      await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
      await expect
        .poll(() =>
          page
            .locator('.pg-stage img')
            .evaluateAll((els) =>
              els.every(
                (im) => (im as HTMLImageElement).complete && (im as HTMLImageElement).naturalWidth > 0,
              ),
            ),
        )
        .toBe(true);
      if (width === 1280 && q.tags.includes('source:original-curriculum-review'))
        await page.locator('.pg-stage').screenshot({ path: `.cache/g4-${q.id.split('.').at(-1)}.png` });
      if (q.payload.choices) {
        await expect(page.locator('.nq-choice')).toHaveCount(q.payload.choices.length);
        const source = q.payload.choices.find((c) => c.id === q.payload.answer)!.text;
        const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(
          source
            .split(/([一-龥々]+\[[^\]]+\])/)
            .map((part) => {
              const ruby = part.match(/^([一-龥々]+)\[([^\]]+)\]$/);
              return ruby ? `(?:${escape(ruby[1]!)}|${escape(ruby[2]!)})` : escape(part);
            })
            .join('')
            .replace(/\s/g, ''),
        );
        const labels = await page.locator('.nq-choice').evaluateAll((els) =>
          els.map((el) => {
            const c = el.querySelector('.nq-choice-content')!.cloneNode(true) as HTMLElement;
            c.querySelectorAll('rt').forEach((rt) => rt.remove());
            return c.textContent ?? '';
          }),
        );
        const index = labels.findIndex((s) => new RegExp(`^${pattern.source}$`).test(s.replace(/\s/g, '')));
        expect(index, JSON.stringify(labels)).toBeGreaterThanOrEqual(0);
        await page.locator('.nq-choice').nth(index).click();
      } else {
        for (const [i, answer] of q.payload.answers!.entries())
          await page.getByRole('textbox', { name: `こたえ ${i + 1}`, exact: true }).fill(answer);
        await page.getByRole('button', { name: 'こたえる', exact: true }).click();
      }
      await expect(page.locator('.nq-feedback-correct')).toBeVisible();
      await page.getByRole('button', { name: 'かいせつ', exact: true }).click();
      await expect(page.locator('.nq-review p')).not.toBeEmpty();
      await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
      await expect
        .poll(() =>
          page
            .locator('.pg-stage img')
            .evaluateAll((els) =>
              els.every(
                (im) => (im as HTMLImageElement).complete && (im as HTMLImageElement).naturalWidth > 0,
              ),
            ),
        )
        .toBe(true);
      if (width === 1280 && q.id.includes('soroban-read-236'))
        await page.screenshot({ path: '.cache/sansu-g4-soroban.png' });
    });
  }
