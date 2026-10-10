import { expect, test, type Page } from '@playwright/test';

test('choice：旧版の横長画像を正方形へ潰さず表示する', async ({ page }) => {
  await page.goto('/playground.html?q=legacy.sansu.g1.math-1-1.d29b83d0c753');
  const image = page.locator('.nq-q-prompt-img');
  await expect(image).toBeVisible({ timeout: 20_000 });

  const size = await image.evaluate((element: HTMLImageElement) => ({
    naturalRatio: element.naturalWidth / element.naturalHeight,
    renderedRatio: element.getBoundingClientRect().width / element.getBoundingClientRect().height,
  }));
  expect(size.naturalRatio).toBeGreaterThan(4);
  expect(size.renderedRatio).toBeCloseTo(size.naturalRatio, 1);
});

/** Playground で picture-word のサンプル（1 問目：りんごの絵）を出す */
async function showPictureWord(page: Page) {
  await page.goto('/playground.html');
  await page.locator('select#pg-file').selectOption('questions/_samples/picture-word.json');
  await expect(page.locator('textarea#pg-json')).toHaveValue(/sample\.picture-word\.0001/, {
    timeout: 10_000,
  });
  await page.click('button.pg-run');
  await expect(page.locator('.nq-q-pw')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.nq-pw-picture')).toBeVisible();
  await expect(page.locator('.nq-pw-card').first()).toHaveAttribute('aria-describedby', 'nq-question-prompt');
}

test('picture-word：絵を見て 正しい英単語を 1 回で えらぶと score 1', async ({ page }) => {
  await showPictureWord(page);
  await page.locator('.nq-pw-card', { hasText: 'apple' }).click();
  await expect(page.locator('.nq-pw-slot')).toHaveAttribute('role', 'status');
  await expect(page.locator('.pg-result')).toContainText('"score": 1', { timeout: 10_000 });
});

test('picture-word：1 回まちがえてから 正解すると score 0.5', async ({ page }) => {
  await showPictureWord(page);
  await page.locator('.nq-pw-card', { hasText: 'grapes' }).click();
  await expect(page.locator('.nq-pw-card-miss')).toHaveCount(1);
  await page.locator('.nq-pw-card', { hasText: 'apple' }).click({ timeout: 5_000 });
  await expect(page.locator('.pg-result')).toContainText('"score": 0.5', { timeout: 10_000 });
});

test('sort-order：カードの順位と移動ボタンの意味を読み上げ用に持つ', async ({ page }) => {
  await page.goto('/playground.html');
  await page.locator('select#pg-file').selectOption('questions/_samples/sort-order.json');
  await expect(page.locator('textarea#pg-json')).toHaveValue(/sample\.sort-order\.0001/, {
    timeout: 10_000,
  });
  await page.click('button.pg-run');
  const cards = page.getByRole('listitem');
  await expect(cards.first()).toHaveAttribute('aria-posinset', '1');
  await expect(cards.first()).toHaveAttribute('aria-setsize', String(await cards.count()));
  await expect(cards.first().getByRole('button').first()).toHaveAttribute('aria-label', /ひとつ まえへ/);
  await expect(cards.first().getByRole('button').nth(1)).toHaveAttribute('aria-label', /ひとつ うしろへ/);
});

test('number-build：現在値と操作部から設問を読み上げで参照できる', async ({ page }) => {
  await page.goto('/playground.html');
  await page.locator('select#pg-file').selectOption('questions/_samples/number-build.json');
  await expect(page.locator('textarea')).toHaveValue(/sample\.number-build\.blocks\.0001/, {
    timeout: 10_000,
  });
  await page.click('button.pg-run');
  const value = page.locator('.nq-nb-value');
  await expect(value).toHaveAttribute('aria-label', 'いまの すうじ 0');
  await expect(page.locator('.nq-nb-block').first()).toHaveAttribute(
    'aria-describedby',
    'nq-question-prompt',
  );
  await page.locator('.nq-nb-block').first().click();
  await expect(value).toHaveAttribute('aria-label', 'いまの すうじ 10');
  await page.locator('.nq-nb-block').first().press('Enter');
  await expect(value).toHaveAttribute('aria-label', 'いまの すうじ 20');
  await expect(page.locator('.nq-feedback')).toHaveCount(0);
});

test('number-build：数直線の矢印操作は1回ずつ進む', async ({ page }) => {
  await page.goto('/playground.html');
  await page.locator('select#pg-file').selectOption('questions/sansu/g1/ringo-number-build.json');
  await page.locator('select#pg-question').selectOption('2');
  await page.click('button.pg-run');
  const numberline = page.getByRole('slider');
  await expect(numberline).toHaveValue('0');
  await numberline.press('ArrowRight');
  await expect(numberline).toHaveValue('1');
  await expect(page.locator('.nq-nb-value')).toHaveAttribute('aria-label', 'いまの すうじ 1');
});

test('experiment：予想・操作・結果の状態を読み上げ用に持つ', async ({ page }) => {
  await page.goto('/playground.html');
  await page.locator('select#pg-file').selectOption('questions/_samples/experiment.json');
  await expect(page.locator('textarea#pg-json')).toHaveValue(/sample\.experiment\.water\.0001/, {
    timeout: 10_000,
  });
  await page.click('button.pg-run');
  const choice = page.locator('.nq-exp-choices button').first();
  await expect(choice).toHaveAttribute('aria-describedby', 'nq-exp-predict-prompt');
  await choice.click();
  await page.getByRole('button', { name: 'ためしてみる' }).click();
  const slider = page.getByRole('slider').first();
  await expect(slider).toHaveAttribute('aria-describedby', 'nq-question-prompt');
  await expect(page.locator('.nq-exp-control output').first()).toHaveAttribute('aria-live', 'polite');
  await page.getByRole('button', { name: 'じっけんする' }).click();
  await expect(page.locator('.nq-exp-outcome')).toHaveAttribute('role', 'status');
});

test('旧版の文字入力問題：複数の答えを入力して採点できる', async ({ page }) => {
  await page.goto('/playground.html?q=legacy.rika.g5.sci-5-10.19d606f94ed5');
  await expect(page.locator('.nq-q-input')).toBeVisible({ timeout: 20_000 });
  const answers = page.getByRole('textbox', { name: /こたえ/ });
  await expect(answers).toHaveCount(3);
  await expect(answers.first()).toHaveAttribute('aria-keyshortcuts', 'Enter');
  await expect(page.locator('button.nq-input-submit')).toHaveAttribute('aria-keyshortcuts', 'Enter');
  await expect(page.locator('.nq-input-key-hint')).toContainText('つぎの らんへ');
  await expect(page.locator('button.nq-input-submit')).toBeDisabled();
  await answers.nth(0).fill('1.2');
  await answers.nth(0).press('Enter');
  await expect(answers.nth(1)).toBeFocused();
  await answers.nth(1).fill('１．２');
  await answers.nth(1).press('Enter');
  await expect(answers.nth(2)).toBeFocused();
  await answers.nth(2).fill('1.2');
  await expect(page.locator('button.nq-input-submit')).toBeEnabled();
  await answers.nth(2).press('Enter');
  await expect(page.locator('.pg-result')).toContainText('"score": 1', { timeout: 10_000 });
});

test('旧版の地図問題：正しい地点をクリックして採点できる', async ({ page }) => {
  await page.goto('/playground.html?q=legacy.shakai.g3.cur-1403-01.6d0e031ce36a');
  const map = page.locator('.nq-map-tap');
  await expect(map).toBeVisible({ timeout: 20_000 });
  const box = await map.boundingBox();
  expect(box).not.toBeNull();
  await map.click({ position: { x: box!.width * 0.45, y: box!.height * 0.7 } });
  await expect(page.locator('.pg-result')).toContainText('"score": 1', { timeout: 10_000 });
});

test('地図問題：キーボードで照準を動かして地点を決定できる', async ({ page }) => {
  await page.goto('/playground.html?q=legacy.shakai.g3.cur-1403-01.6d0e031ce36a');
  const map = page.locator('.nq-map-tap');
  await expect(map).toBeVisible({ timeout: 20_000 });
  await expect(map).toHaveAttribute('aria-describedby', /nq-map-tap-instruction/);
  await map.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.nq-map-cursor')).toHaveAttribute('style', /left: 55%/);
  await expect(page.locator('#nq-map-tap-position')).toContainText('よこ 55%');
  await page.keyboard.press('Enter');
  await expect(page.locator('.nq-map-pick')).toBeVisible();
});
