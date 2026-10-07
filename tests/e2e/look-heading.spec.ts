import { expect, test } from '@playwright/test';

test('みため見出しの飾りと文字が重ならない', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();

  const heading = page.locator('.nq-new-game-look h3');
  const decorationWidth = await heading.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element, '::before').width),
  );
  expect(decorationWidth).toBe(12);
  const decorationShadow = await heading.evaluate(
    (element) => getComputedStyle(element, '::before').boxShadow,
  );
  expect(decorationShadow).toBe('none');
  await page.screenshot({ path: testInfo.outputPath('look-heading.png') });
});
