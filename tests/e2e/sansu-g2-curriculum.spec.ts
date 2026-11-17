import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { kanjiGradeTable, openKanjiAboveGrade, parseRuby } from '../../src/ui/ruby';
import { inspectQuestion } from '../../src/tools/questionLayoutAudit';
type Q = {
  id: string;
  type: string;
  explanation?: string;
  payload: { prompt: string; choices?: { id: string; text: string }[]; answer?: string; answers?: string[] };
};
const questions: Q[] = readdirSync('content/questions/sansu/g2').flatMap((d) =>
  JSON.parse(readFileSync(`content/questions/sansu/g2/${d}/set-001.json`, 'utf8')),
);
const grades = kanjiGradeTable(JSON.parse(readFileSync('content/i18n/kanji-grades.json', 'utf8')).byGrade);
const plain = (s: string) =>
  openKanjiAboveGrade(parseRuby(s), 2, grades)
    .map((x) => x.base)
    .join('')
    .replace(/\\(?:dfrac|frac)\{(\d+)\}\{(\d+)\}/g, '$1$2')
    .replace(/\s/g, '');
for (const [index, q] of questions.filter((q) => q.type !== 'random-calculation').entries()) {
  for (const width of q.id.startsWith('sansu.g2.balance.') ? [390, 1280] : [index % 2 ? 390 : 1280]) {
    test(`問題レビューで正答と解説を確認 ${q.id} (${width}px)`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/playground.html?q=${q.id}`);
      await expect(page.getByRole('heading', { name: '問題レビュー', exact: true })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /^問題文/ })).toHaveValue(q.payload.prompt);
      await expect(page.getByRole('textbox', { name: '解説文', exact: true })).toHaveValue(q.explanation!);
      await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
      await expect
        .poll(() =>
          page
            .locator('.pg-stage img')
            .evaluateAll((imgs) =>
              imgs.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0),
            ),
        )
        .toBe(true);
      if (q.id.includes('curriculum.') || q.id.includes('balance.'))
        await page
          .locator('.pg-stage')
          .screenshot({ path: `.cache/sansu-g2-review/${q.id}-${width}-question.png` });
      if (q.type === 'choice') {
        const a = q.payload.choices!.find((c) => c.id === q.payload.answer)!;
        const choices = page.locator('.nq-choice');
        // Ruby reading text is stripped through DOM rather than changing the mathematical label.
        const found = await choices.evaluateAll(
          (els, target) =>
            els.findIndex((el) => {
              const clone = el.cloneNode(true) as HTMLElement;
              clone.querySelectorAll('rt,rp,.nq-choice-key').forEach((n) => n.remove());
              return clone.textContent?.replace(/\s/g, '') === target;
            }),
          plain(a.text),
        );
        expect(found, q.id).toBeGreaterThanOrEqual(0);
        await choices.nth(found).click();
      } else {
        const answers = q.payload.answers!;
        if (answers.length === 1) {
          const pad = page.getByRole('group', { name: 'すうじボタン' });
          for (const d of answers[0]!) await pad.getByRole('button', { name: d, exact: true }).click();
        } else
          for (const [i, a] of answers.entries())
            await page.getByRole('textbox', { name: `こたえ ${i + 1}`, exact: true }).fill(a);
        await page.getByRole('button', { name: 'こたえる', exact: true }).click();
      }
      await expect(page.locator('.nq-feedback-correct')).toBeVisible();
      await page.getByRole('button', { name: 'かいせつ', exact: true }).click();
      await expect(page.locator('.nq-review p')).not.toBeEmpty();
      await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
      if (q.id.includes('curriculum.') || q.id.includes('balance.'))
        await page.screenshot({ path: `.cache/sansu-g2-review/${q.id}-${width}.png` });
      expect(errors).toEqual([]);
    });
  }
}
