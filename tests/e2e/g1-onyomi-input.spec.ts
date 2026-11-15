import { expect, test } from '@playwright/test';

for (const width of [320, 768, 1024, 1440]) {
  test(`1年の音読みをひらがなで入力できる（${width}px）`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/playground.html?q=kokugo.g1.kanji-onyomi.0001');
    const stage = page.locator('.pg-stage');
    await expect(stage.getByText('一ばんおいしいパン', { exact: true })).toBeVisible();
    await expect(stage.locator('ruby')).toHaveCount(0);
    await expect(stage.locator('.nq-q-choice')).toHaveCount(0);
    await expect(stage).not.toContainText('Enter');
    await expect(stage.locator('.nq-input-key-hint')).toHaveCount(0);
    await expect(stage).not.toContainText('ひらがなで');
    await expect(stage.locator('mark')).toHaveText('一');
    const answer = stage.getByRole('textbox', { name: 'こたえ 1', exact: true });
    await expect(answer).toHaveAttribute('inputmode', 'text');
    const submit = stage.locator('.nq-input-submit');
    const initialButton = await submit.boundingBox();
    await answer.fill('イチ');
    await expect(stage.getByRole('alert')).toHaveText('ひらがなで こたえよう');
    await expect(answer).toHaveAttribute('aria-invalid', 'true');
    await submit.click();
    await expect(answer).toBeEnabled();
    expect(await submit.boundingBox()).toEqual(initialButton);
    await answer.fill('いち');
    await expect(stage).not.toContainText('ひらがなで');
    await answer.press('Enter');
    await expect(stage.locator('.nq-feedback-correct')).toBeVisible();
    await page.reload();
    await stage.getByRole('textbox', { name: 'こたえ 1', exact: true }).fill('ひと');
    await stage.locator('.nq-input-submit').click();
    await expect(stage.getByRole('status')).toContainText('おしい');
    await page.reload();
    await expect(stage.getByText('一ばんおいしいパン', { exact: true })).toBeVisible();
    await stage.screenshot({ path: `test-results/g1-onyomi-${width}.png` });
  });
}

test('読み入力のIME変換を終えてから案内し、長い例文も枠に収める', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/playground.html?q=kokugo.g1.kanji-onyomi.0001');
  const stage = page.locator('.pg-stage');
  const answer = stage.getByRole('textbox', { name: 'こたえ 1', exact: true });
  await answer.dispatchEvent('compositionstart');
  await answer.fill('ichi');
  await expect(stage).not.toContainText('ひらがなで');
  await answer.dispatchEvent('compositionend');
  await expect(stage.getByRole('alert')).toHaveText('ひらがなで こたえよう');
  await stage.screenshot({ path: 'test-results/g1-onyomi-invalid.png' });
  await page.goto('/playground.html?q=kokugo.g1.kanji-onyomi.0028');
  await expect(stage.getByText('せい糸こうじょうで いとを つくる', { exact: true })).toBeVisible();
  const promptBox = (await stage.locator('.nq-q-prompt').boundingBox())!;
  const answerBox = (await stage.getByRole('textbox', { name: 'こたえ 1', exact: true }).boundingBox())!;
  const submitBox = (await stage.locator('.nq-input-submit').boundingBox())!;
  const stageBox = (await stage.boundingBox())!;
  expect(promptBox.y + promptBox.height).toBeLessThan(answerBox.y);
  expect(answerBox.y + answerBox.height).toBeLessThan(submitBox.y);
  expect(submitBox.y + submitBox.height).toBeLessThanOrEqual(stageBox.y + stageBox.height);
  await stage.screenshot({ path: 'test-results/g1-onyomi-long.png' });
});
