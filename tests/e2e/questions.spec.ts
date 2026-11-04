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
  await page.goto('/playground.html?q=sample.picture-word.0001');
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
  await page.goto('/playground.html?q=sample.sort-order.0001');
  const cards = page.getByRole('listitem');
  await expect(cards.first()).toHaveAttribute('aria-posinset', '1');
  await expect(cards.first()).toHaveAttribute('aria-setsize', String(await cards.count()));
  await expect(cards.first().getByRole('button').first()).toHaveAttribute('aria-label', /ひとつ まえへ/);
  await expect(cards.first().getByRole('button').nth(1)).toHaveAttribute('aria-label', /ひとつ うしろへ/);
});

test('pair-match：やりなおし後にキーボードで合わせると score 1', async ({ page }) => {
  await page.goto('/playground.html?q=sample.pair-match.0002');

  const card = (text: string) => page.locator('.nq-pm-card', { hasText: text });
  await expect(card('秋田')).toHaveAttribute('aria-describedby', 'nq-question-prompt');
  for (const text of ['秋田', 'きりたんぽ']) {
    await card(text).focus();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('.nq-pm-matched')).toHaveCount(2);
  await page.getByRole('button', { name: 'やりなおす' }).click();
  await expect(page.locator('.nq-pm-matched')).toHaveCount(0);

  for (const text of ['秋田', 'きりたんぽ', '岩手', 'わんこそば']) {
    await card(text).focus();
    await page.keyboard.press('Enter');
  }

  await expect(page.locator('.pg-result')).toContainText('"score": 1', { timeout: 10_000 });
});

test('pair-match：最大6ペアが960×540の問題枠に収まる', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto('/playground.html?q=sample.pair-match.0003');

  const cards = page.locator('.nq-pm-card');
  await expect(cards).toHaveCount(12);
  const insideStage = await page.locator('.nq-q-pair-match').evaluate((stage) => {
    const bounds = stage.getBoundingClientRect();
    return [...stage.querySelectorAll('.nq-pm-card')].every((card) => {
      const rect = card.getBoundingClientRect();
      return (
        rect.left >= bounds.left &&
        rect.right <= bounds.right &&
        rect.top >= bounds.top &&
        rect.bottom <= bounds.bottom
      );
    });
  });
  expect(insideStage).toBe(true);
});

test('number-build：現在値と操作部から設問を読み上げで参照できる', async ({ page }) => {
  await page.goto('/playground.html?q=sample.number-build.blocks.0001');
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
  await page.goto('/playground.html?q=sansu.g1.kazu-100.ringo-numberline-0001');
  const numberline = page.getByRole('slider');
  await expect(numberline).toHaveValue('0');
  await numberline.press('ArrowRight');
  await expect(numberline).toHaveValue('1');
  await expect(page.locator('.nq-nb-value')).toHaveAttribute('aria-label', 'いまの すうじ 1');
});

test('experiment：予想・操作・結果の状態を読み上げ用に持つ', async ({ page }) => {
  await page.goto('/playground.html?q=sample.experiment.water.0001');
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
  expect(box!.height).toBeGreaterThanOrEqual(48);
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

test('旧版の算数：復元した長さの式を見て答えられる', async ({ page }) => {
  await page.goto('/playground.html?q=legacy.sansu.g3.math-3-9.fe60b183f57a');
  await expect(page.locator('#nq-question-prompt')).toContainText('600m + 400m');
  await page
    .locator('.nq-choice')
    .filter({ hasText: /^\d1km$/ })
    .click();
  await page.getByRole('button', { name: 'つぎへ', exact: true }).click();
  await expect(page.locator('.pg-result')).toContainText('"score": 1');
});

test('旧版の算数：ケーキの分数を縦に表示して答えられる', async ({ page }) => {
  await page.goto('/playground.html?q=legacy.sansu.g2.math-2-17.56b737970858');
  await expect(page.locator('.nq-q-prompt .nq-fraction')).toHaveAttribute('aria-label', '4分の1');
  await expect(page.locator('.nq-q-prompt')).not.toContainText('dfrac');
  await page.getByRole('textbox', { name: /こたえ/ }).fill('4');
  await page.locator('.nq-input-submit').click();
  await page.getByRole('button', { name: 'つぎへ', exact: true }).click();
  await expect(page.locator('.pg-result')).toContainText('"score": 1');
});

for (const [answer, expected] of [
  ['7.60', 1],
  ['7.61', 0],
] as const) {
  test(`旧版の算数：小数 ${answer} を ${expected} と採点する`, async ({ page }) => {
    await page.goto('/playground.html?q=legacy.sansu.g3.math-3-15.1c00bc7a70f5');
    await page.getByRole('textbox', { name: /こたえ/ }).fill(answer);
    await page.locator('.nq-input-submit').click();
    await page.getByRole('button', { name: 'つぎへ', exact: true }).click();
    await expect(page.locator('.pg-result')).toContainText(`"score": ${expected}`);
  });
}

test('旧版の算数：罫線付きの表を見て1か所ずつ答える', async ({ page }) => {
  for (const [index, answer] of ['9', '4', '5', '37', '110'].entries()) {
    const id = 'legacy.sansu.g3.math-3-7.54bfe42d11e7' + (index ? `.${index + 1}` : '');
    await page.goto(`/playground.html?q=${id}`);
    const image = page.locator('.nq-input-illustration img');
    await expect(image).toBeVisible();
    await expect(image).not.toHaveAttribute('alt', '');
    const size = await image.boundingBox();
    expect(size?.height).toBeGreaterThan(150);
    expect((await page.locator('.nq-input-illustration').boundingBox())?.height).toBeGreaterThanOrEqual(240);
    const input = page.getByRole('textbox', { name: /こたえ/ });
    await expect(input).toHaveCount(1);
    await input.fill(answer);
    await page.locator('.nq-input-submit').click();
    await page.getByRole('button', { name: 'つぎへ', exact: true }).click();
    await expect(page.locator('.pg-result')).toContainText('"score": 1');
  }
});

test('旧版の算数：狭い画面でも表をスクロールして答えられる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/playground.html?q=legacy.sansu.g3.math-3-7.54bfe42d11e7');
  const table = page.locator('.nq-input-illustration');
  await expect(table).toBeVisible();
  expect((await table.boundingBox())?.height).toBeGreaterThanOrEqual(240);
  await table.focus();
  await page.keyboard.press('ArrowRight');
  await expect(table).toBeFocused();
  await page.screenshot({ path: 'test-results/sansu-table-mobile.png' });
  const image = table.locator('img');
  expect((await image.boundingBox())?.height).toBeGreaterThan(150);
  await page.getByRole('textbox', { name: /こたえ/ }).fill('9');
  await page.locator('.nq-input-submit').click();
  await page.getByRole('button', { name: 'つぎへ', exact: true }).click();
  await expect(page.locator('.pg-result')).toContainText('"score": 1');
});

test('旧版の算数：時計を読み、解説を自分のペースで確認する', async ({ page }) => {
  await page.goto('/playground.html?q=sansu.g1.tokei.0002');
  await expect(page.locator('.nq-q-prompt-img')).toHaveAttribute('src', /clock-03-30\.svg$/);
  await page.locator('.nq-choice').filter({ hasText: '3じ 30ぷん' }).click();
  await expect(page.locator('.nq-feedback')).toContainText('かんぺき');
  await expect(page.getByRole('button', { name: 'つぎへ', exact: true })).toBeFocused();
  await page.waitForTimeout(1200);
  await expect(page.locator('.nq-review')).toBeVisible();
  await page.getByRole('button', { name: 'かんがえかたを みる' }).click();
  await expect(page.locator('.nq-review p')).toContainText('3を すぎている');
  await expect(page.locator('.nq-review p')).toBeFocused();
  await page.screenshot({ path: 'test-results/sansu-clock-review.png' });
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('.pg-result')).toContainText('"score": 1');
});

test('旧版の算数：入力式に読みと音声ボタンがあり答えを読み上げない', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window.speechSynthesis, 'speak', {
      value: (utterance: SpeechSynthesisUtterance) => {
        document.body.dataset.lastSpeech = utterance.text;
      },
    });
  });
  await page.goto('/playground.html?q=legacy.sansu.g3.math-3-15.1c00bc7a70f5');
  await expect(page.locator('.nq-q-input ruby').first()).toBeVisible();
  await page.locator('.nq-input-speak').click();
  await expect(page.locator('body')).toHaveAttribute('data-last-speech', /センチメートル/);
  await expect(page.locator('body')).not.toHaveAttribute('data-last-speech', /7てん6/);
});
