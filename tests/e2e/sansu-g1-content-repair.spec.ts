import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const audit = JSON.parse(
  readFileSync('imports/legacy-questions/reviews/sansu-g1-context-repair.json', 'utf8'),
) as { repairs: { id: string; sourceQuestionId: string; qtextTemplate: string; answer: string }[] };
import { inspectQuestion } from '../../src/tools/questionLayoutAudit';

for (const [index, repair] of audit.repairs.entries()) {
  test(`復元した式を解いて解説を読める: ${repair.sourceQuestionId}`, async ({ page }) => {
    await page.setViewportSize({ width: index % 2 ? 1440 : 390, height: 900 });
    await page.goto(`/playground.html?q=${repair.id}`);
    const expression = repair.qtextTemplate
      .replaceAll('$', '')
      .replace(/([+\-=])/g, ' $1 ')
      .trim();
    await expect(page.locator('.nq-input-template')).toContainText(expression);
    const pad = page.getByRole('group', { name: 'すうじボタン' });
    for (const digit of repair.answer) await pad.getByRole('button', { name: digit, exact: true }).click();
    await page.getByRole('button', { name: 'こたえる', exact: true }).click();
    await expect(page.locator('.nq-feedback-correct')).toBeVisible();
    await page.getByRole('button', { name: 'かいせつ', exact: true }).click();
    await expect(page.locator('.nq-review p')).toContainText(`${expression} ${repair.answer}`);
    await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
    if (index === 0) await page.screenshot({ path: 'test-results/sansu-g1-restored-addition.png' });
  });
}

for (const example of [
  { id: 'legacy.sansu.g1.math-1-1.46b4b8263a5d', answer: '2 と 2', text: 'のこりは 2こ' },
  { id: 'legacy.sansu.g1.math-1-1.27834d1ff3be', answer: '7ばんめ', text: 'みぎの はしを 1ばんめ' },
  { id: 'legacy.sansu.g1.math-1-8.bf1c1121fe83', answer: ['4', '33'], text: '30 + 3 = 33' },
]) {
  test(`追加した考え方を表示する: ${example.id}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/playground.html?q=${example.id}`);
    if (Array.isArray(example.answer)) {
      for (const [index, answer] of example.answer.entries())
        await page.getByRole('textbox', { name: `こたえ ${index + 1}`, exact: true }).fill(answer);
      await page.getByRole('button', { name: 'こたえる', exact: true }).click();
    } else await page.locator('.nq-choice').filter({ hasText: example.answer }).click();
    await expect(page.locator('.nq-feedback-correct')).toBeVisible();
    await page.getByRole('button', { name: 'かいせつ', exact: true }).click();
    await expect(page.locator('.nq-review p')).toContainText(example.text);
    await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
    if (example.id.endsWith('bf1c1121fe83'))
      await page.screenshot({ path: 'test-results/sansu-g1-clock-explanation.png' });
  });
}

for (const [id, answer, reason] of [
  ['zero-add-right', '4', '4 + 0 = 4'],
  ['zero-add-left', '3', '0 + 3 = 3'],
  ['subtract-zero', '5', '5 - 0 = 5'],
  ['missing-part', '5', '8 - 3 = 5'],
  ['ordinal-before', '4', '5 - 1 = 4'],
]) {
  test(`再監査で補った場面を解いて理由を読める: ${id}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/playground.html?q=sansu.g1.reaudit.${id}`);
    await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
    await page.getByRole('textbox', { name: 'こたえ 1', exact: true }).fill(answer!);
    await page.getByRole('button', { name: 'こたえる', exact: true }).click();
    await expect(page.locator('.nq-feedback-correct')).toBeVisible();
    await page.getByRole('button', { name: 'かいせつ', exact: true }).click();
    await expect(page.locator('.nq-review p')).toContainText(reason!);
    await expect.poll(() => page.locator('.pg-stage').evaluate(inspectQuestion)).toEqual([]);
  });
}
