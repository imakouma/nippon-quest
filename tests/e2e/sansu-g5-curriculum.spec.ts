import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
test.setTimeout(60_000);
import { inspectQuestion } from '../../src/tools/questionLayoutAudit';
const questions = readdirSync('content/questions/sansu/g5').flatMap((dir) =>
  readdirSync(`content/questions/sansu/g5/${dir}`).flatMap((file) =>
    JSON.parse(readFileSync(`content/questions/sansu/g5/${dir}/${file}`, 'utf8')),
  ),
) as {
  id: string;
  tags: string[];
  payload: { prompt: string; choices?: { id: string; text: string }[]; answer?: string; answers?: string[] };
}[];
const examples = questions.filter(
  (q) =>
    q.tags.includes('curriculum:gap-fill-20261116') ||
    q.tags.includes('curriculum:gap-fill-20261117') ||
    [
      '80504e20a9a0',
      '997027008cb6',
      '87b322595f48',
      'a4258a4f87fe',
      '3636d7d8c6a8',
      'bff4fed9dd55',
      '21982a371d8b',
      '768dc2c0e922',
      'b0a6a8e98e73',
      '83684515e4e8',
      '1241d895d4c9',
      '4420d004f78a',
      '21a8051338c7',
      '30e81b26e483',
    ].some((h) => q.id.endsWith(h)) ||
    [
      '38428eb9a984',
      'c98fcfd995ad',
      '1677485ba4e9',
      '01eb324fd937',
      '0d4019d6f9fd',
      '11e2c1df85ad',
      '0576dd5e31f4',
      '1f49baf419bf',
      'd143c05b3d36',
      '1a39e3e1e03b',
      '4b88b8786d56',
      '2e460d602b6d',
      '4166b036f7cd',
      '5cecda0492da',
    ].some((h) => q.id.endsWith(h)),
);
for (const width of [390, 1280])
  for (const q of examples) {
    test(`${width}px 小5正答・解説・図 ${q.id}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/playground.html?q=${q.id}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: '問題レビュー', exact: true })).toBeVisible({
        timeout: 20_000,
      });
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
      if (width === 1280 && q.tags.includes('curriculum:gap-fill-20261116'))
        await page.locator('.pg-stage').screenshot({ path: `.cache/g5-${q.id.split('.').at(-1)}.png` });
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
    });
  }
