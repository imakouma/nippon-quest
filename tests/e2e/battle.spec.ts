import { expect, test, type Page } from '@playwright/test';

/**
 * docs/02 Step 6 の E2E（ターン制バトル）：デバッグ URL で強制エンカウント。
 * 1 ターンに 主人公 → オトモ → てき が 1 回ずつ 動く。
 * 問題の中身には なるべく依存しない（たたかう は問題なしで撃てる：GDD §4.1）。
 */
async function start(page: Page, lv: number, forceRecruit = false): Promise<void> {
  await page.goto(`/?debug=battle&enemy=aomori-ringoron&lv=${lv}${forceRecruit ? '&recruit=1' : ''}`);
  // 登場メッセージ（タップ待ち）→ コマンド。1 文字ずつ出し終わって ▼ が出てからタップする
  await expect(page.locator('.nq-box-text')).toContainText('リンゴロン', { timeout: 60_000 });
  await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 10_000 });
  await page.locator('.nq-box').click();
}

/** 単元には複数の問題形式が混ざり得るため、表示された形式に依存せず1回答する。 */
async function answerCurrentQuestion(page: Page): Promise<void> {
  const ready = page.locator('.nq-choice, .nq-q-input input, .nq-map-tap').first();
  await expect(ready).toBeVisible({ timeout: 20_000 });
  if (await page.locator('.nq-choice').first().isVisible()) {
    await page.locator('.nq-choice').first().click();
    return;
  }
  if (await page.locator('.nq-q-input input').first().isVisible()) {
    const inputs = page.locator('.nq-q-input input');
    for (let index = 0; index < (await inputs.count()); index += 1) await inputs.nth(index).fill('0');
    await page.getByRole('button', { name: 'こたえる' }).click();
    return;
  }
  await page.locator('.nq-map-tap').click({ position: { x: 20, y: 20 } });
}

test('バトル：報酬のあとに、キャラが動く仲間加入演出を別画面で表示する', async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await start(page, 1, true);
  const attack = page.locator('.nq-cmd[data-cmd="attack"]:not([disabled])');
  await expect(attack).toBeVisible({ timeout: 20_000 });

  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline && !(await page.locator('.nq-result').isVisible())) {
    // 自分の ターンが 来たら たたかう。タップ待ちの 文は すすめる
    if (await attack.isVisible()) await attack.click({ timeout: 2_000 }).catch(() => undefined);
    else if (await page.locator('.nq-box-next').isVisible())
      await page
        .locator('.nq-box')
        .click({ timeout: 1_000 })
        .catch(() => undefined);
    await page.waitForTimeout(250);
  }
  await expect(page.locator('.nq-result')).toBeVisible();

  await expect(page.locator('.nq-recruit-scene')).toHaveCount(0);
  await page.locator('[data-result-close]').click();
  const recruit = page.locator('.nq-recruit-scene');
  await expect(recruit).toBeVisible();
  await expect(recruit).toContainText('リンゴロン');
  const monster = recruit.locator('.nq-recruit-stage img');
  await expect(monster).toBeVisible();
  expect(await monster.evaluate((node) => getComputedStyle(node).animationName)).toContain('recruit-hop');
  await page.screenshot({ path: testInfo.outputPath('recruit-offer.png'), fullPage: true });
  await recruit.locator('.nq-result-btns .nq-cmd').nth(1).click();
  await expect(page.locator('.nq-battle')).toHaveCount(0, { timeout: 10_000 });
  expect(errors).toEqual([]);
});

test('バトル：ターンが 出て、こちらが 動くと 同じ ターンに 敵も こうげきして くる', async ({ page }) => {
  test.setTimeout(60_000);
  await start(page, 8);
  await expect(page.locator('.nq-turn-stage')).toContainText('ターン', { timeout: 10_000 });
  await expect(page.locator('.nq-sgauge')).toBeVisible();
  const attack = page.locator('.nq-cmd[data-cmd="attack"]:not([disabled])');
  await expect(attack).toBeVisible({ timeout: 20_000 });
  const beforeHp = await page.locator('.nq-ally .nq-num').allTextContents();
  await attack.click();
  // 短時間で消えるダメージ演出ではなく、ターン進行と永続するHP変化を確認する。
  await expect(page.locator('.nq-turn-stage')).toContainText('ターン 2', { timeout: 30_000 });
  expect(await page.locator('.nq-ally .nq-num').allTextContents()).not.toEqual(beforeHp);
});

test('バトル：必殺技を えらぶと 問題が出て、答えると採点されてターンが進む', async ({ page }) => {
  test.setTimeout(90_000);
  await start(page, 8);
  await page.locator('.nq-cmd[data-cmd="skill"]').click();
  await page.locator('[data-skill="sk-tashizan-giri"]').click();
  await expect(page.locator('.nq-bq')).toBeVisible({ timeout: 20_000 });
  await answerCurrentQuestion(page);
  // 不正解ならゲージ加算が0になるのが仕様。問題を閉じてターンを完走することを確認する。
  // 正解時のゲージ加算量は、乱数や問題形式に依存しない core のユニットテストで検証する。
  await expect(page.locator('.nq-bq')).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator('.nq-turn-stage')).toContainText('ターン 2', { timeout: 30_000 });
});
