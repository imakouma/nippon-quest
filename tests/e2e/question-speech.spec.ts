import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window.speechSynthesis, 'speak', {
      value: (utterance: SpeechSynthesisUtterance) => {
        document.body.dataset.lastSpeech = utterance.text;
      },
    });
  });
});

for (const id of [
  'sample.kanji-trace.0003',
  'legacy.sansu.g2.math-2-17.6a31345deb9e',
  'legacy.kokugo.g3.jpn-3-15.02f3a8f0a82c',
]) {
  test(`読みが答えになる問題に音声ボタンを出さない: ${id}`, async ({ page }) => {
    await page.goto(`/playground.html?q=${id}`);
    await expect(page.locator('.nq-choice').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: 'よみあげ', exact: true })).toHaveCount(0);
    await page.locator('.nq-choice').first().click();
    await expect(page.locator('.nq-feedback')).toBeVisible();
    await expect(page.locator('body')).not.toHaveAttribute('data-last-speech');
  });
}

for (const [id, speech] of [
  ['sansu.g1.kazu-100.count-0001', 'りんごは なんこ ありますか？'],
  ['legacy.sansu.g6.math-6-9.337d7e0826ac', '比例のグラフの特徴として、正しいものをえらぼう。'],
]) {
  test(`図の答えを読み上げない: ${id}`, async ({ page }) => {
    await page.goto(`/playground.html?q=${id}`);
    await expect(page.locator('.nq-q-prompt-img')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'よみあげ', exact: true }).click();
    await expect(page.locator('body')).toHaveAttribute('data-last-speech', speech!);
    await expect(page.locator('.nq-q-prompt-img')).not.toHaveAttribute('alt', '');
  });
}

test('英語の聞き取りは指定された音声を使える', async ({ page }) => {
  await page.goto('/playground.html?q=eigo.g3.alphabet-small.0001');
  await page.getByRole('button', { name: 'よみあげ', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-last-speech', 'A');
  await expect(page.locator('.nq-q-prompt')).not.toContainText('A');
});
