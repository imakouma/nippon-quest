import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
const kanji = JSON.parse(readFileSync('content/i18n/kanji-grades.json', 'utf8')) as {
  byGrade: Record<string, string>;
};
import { parseRuby, openKanjiAboveGrade, kanjiGradeTable } from '../../src/ui/ruby';
import { inspectQuestion } from '../../src/tools/questionLayoutAudit';

type Q = {
  id: string;
  type: string;
  explanation: string;
  payload: {
    choices?: { id: string; text: string }[];
    answer?: string;
    answers?: string[];
    promptImage?: string;
  };
};
const questions: Q[] = readdirSync('content/questions/sansu/g3').flatMap((d) =>
  readdirSync(`content/questions/sansu/g3/${d}`)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => JSON.parse(readFileSync(`content/questions/sansu/g3/${d}/${f}`, 'utf8'))),
);
const representative = questions.filter(
  (q) =>
    q.id.startsWith('sansu.g3.curriculum.') ||
    [
      '9c9ecd05ef31',
      'ad7e2d83c1a7',
      '01cc7ba3797d',
      '0d0304a60c74',
      '45eb3af8a5ca',
      '0aa8b2b89c0c',
      '28a4b749d728',
      '5942f52ae1f5',
    ].some((hash) => q.id.endsWith(hash)),
);
const plain = (text: string) =>
  openKanjiAboveGrade(parseRuby(text), 3, kanjiGradeTable(kanji.byGrade))
    .map((s) => s.base)
    .join('')
    .replace(/\\(?:dfrac|frac)\{(\d+)\}\{(\d+)\}/g, '$1$2');
const audit = JSON.parse(readFileSync('tasks/sansu-g3-source-audit.json', 'utf8')) as {
  allQuestionReview: { id: string; actions: string[] }[];
};
const changed = new Set(
  audit.allQuestionReview
    .filter((q) => !q.actions.includes('existing-retained-after-review'))
    .map((q) => q.id),
);
const examples =
  process.env.G3_FULL_REVIEW === '1'
    ? questions.filter((q) => changed.has(q.id) && q.type !== 'random-calculation')
    : representative;
for (const width of process.env.G3_FULL_REVIEW === '1' ? [390] : [390, 1280]) {
  for (const q of examples) {
    test(`${width}px grade3 answer/explanation ${q.id}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/playground.html?q=${q.id}`);
      await expect(page.locator('.pg-stage .nq-q')).toBeVisible();
      if (q.payload.promptImage)
        await expect
          .poll(() =>
            page
              .locator('.pg-stage img')
              .evaluateAll(
                (images) =>
                  images.length > 0 &&
                  images.every(
                    (i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0,
                  ),
              ),
          )
          .toBe(true);
      await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
      if (width === 1280) await page.locator('.pg-stage').screenshot({ path: `.cache/sansu-g3/${q.id}.png` });
      if (q.type === 'choice') {
        const answer = q.payload.choices!.find((c) => c.id === q.payload.answer)!;
        const buttons = page.locator('.nq-choice');
        const count = await buttons.count();
        let selected = false;
        for (let i = 0; i < count; i++) {
          const text = await buttons.nth(i).evaluate((el) => {
            const copy = el.cloneNode(true) as HTMLElement;
            copy.querySelectorAll('rt, .nq-choice-key').forEach((rt) => rt.remove());
            return copy.textContent?.trim();
          });
          if (text === plain(answer.text)) {
            await buttons.nth(i).click();
            selected = true;
            break;
          }
        }
        expect(selected, answer.text).toBe(true);
      } else {
        const inputs = page.locator('.nq-q-input input');
        for (const [i, answer] of q.payload.answers!.entries()) await inputs.nth(i).fill(answer);
        await page.locator('.nq-input-submit').click();
      }
      await expect(page.locator('.nq-feedback-correct')).toBeVisible();
      await page.getByRole('button', { name: 'かいせつ', exact: true }).click();
      await expect(page.locator('.nq-review p')).toBeVisible();
      expect(
        await page.locator('.nq-review p').evaluate((el) => {
          const copy = el.cloneNode(true) as HTMLElement;
          copy.querySelectorAll('rt, .nq-choice-key').forEach((rt) => rt.remove());
          return copy.textContent;
        }),
      ).toContain(plain(q.explanation));
      await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
    });
  }
}
