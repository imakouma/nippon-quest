import { expect, test, type Page } from '@playwright/test';

/**
 * docs/02 Step 6 の E2E（ターン制バトル）：デバッグ URL で強制エンカウント。
 * 1 ターンに 主人公 → オトモ → てき が 1 回ずつ 動く。
 * 問題の中身には なるべく依存しない（たたかう は問題なしで撃てる：GDD §4.1）。
 */
async function start(page: Page, lv: number): Promise<void> {
  await page.goto(`/?debug=battle&enemy=aomori-ringoron&lv=${lv}`);
  // 文字送り速度や端末負荷に依存せず、登場メッセージをタップで最後まで送る。
  const attack = page.locator('.nq-cmd[data-cmd="attack"]:not([disabled])');
  for (let step = 0; step < 100 && !(await attack.isVisible()); step += 1) {
    const box = page.locator('.nq-box');
    if (await box.isVisible()) await box.click();
    await page.waitForTimeout(100);
  }
  await expect(attack).toBeVisible({ timeout: 10_000 });
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

test('バトル：たたかう を続けると決着がつき、フィールドに戻る', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await start(page, 1);
  const attack = page.locator('.nq-cmd[data-cmd="attack"]:not([disabled])');
  await expect(attack).toBeVisible({ timeout: 20_000 });

  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline && !(await page.locator('.nq-result').isVisible())) {
    // 自分の ターンが 来たら たたかう。タップ待ちの 文は すすめる
    if (await attack.isVisible()) await attack.first().click({ force: true });
    else if (await page.locator('.nq-box').isVisible()) await page.locator('.nq-box').click({ force: true });
    await page.waitForTimeout(250);
  }
  await expect(page.locator('.nq-result')).toBeVisible();

  // 勝っても負けても「つぎへ」（仲間化オファーなら いいえ）でフィールドへ
  if (await page.locator('.nq-result-recruit').isVisible())
    await page.locator('.nq-result-btns .nq-cmd').nth(1).click();
  else await page.locator('[data-result-close]').click();
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
  await page.locator('[data-skill="sk-hinoko"]').first().click();
  await expect(page.locator('.nq-bq')).toBeVisible({ timeout: 20_000 });
  await answerCurrentQuestion(page);
  // 不正解ならゲージ加算が0になるのが仕様。問題を閉じてターンを完走することを確認する。
  // 正解時のゲージ加算量は、乱数や問題形式に依存しない core のユニットテストで検証する。
  await expect(page.locator('.nq-bq')).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator('.nq-turn-stage')).toContainText('ターン 2', { timeout: 30_000 });
});
