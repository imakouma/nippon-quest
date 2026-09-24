import { expect, test, type Page } from '@playwright/test';

/**
 * docs/02 Step 6 の E2E（ターン制バトル）：デバッグ URL で強制エンカウント。
 * 1 ターンに 主人公 → オトモ → てき が 1 回ずつ 動く。
 * 問題の中身には なるべく依存しない（たたかう は問題なしで撃てる：GDD §4.1）。
 */
async function start(page: Page, lv: number): Promise<void> {
  await page.goto(`/?debug=battle&enemy=aomori-ringoron&lv=${lv}`);
  // 登場メッセージ（タップ待ち）→ コマンド。1 文字ずつ出し終わって ▼ が出てからタップする
  await expect(page.locator('.nq-box-text')).toContainText('リンゴロン', { timeout: 20_000 });
  await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 10_000 });
  await page.locator('.nq-box').click();
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
    if (await attack.isVisible()) await attack.click({ timeout: 2_000 }).catch(() => undefined);
    else if (await page.locator('.nq-box-next').isVisible())
      await page
        .locator('.nq-box')
        .click({ timeout: 1_000 })
        .catch(() => undefined);
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
  await attack.click();
  // 同じ ターンの うちに 敵が こうげき → 味方の ダメージの 数字
  await expect(page.locator('.nq-pop-hurt').first()).toBeVisible({ timeout: 20_000 });
  // 次の ターンへ
  await expect(page.locator('.nq-turn-stage')).toContainText('ターン 2', { timeout: 20_000 });
});

test('バトル：必殺技を えらぶと 問題が出て、答えると 教科ゲージが たまる', async ({ page }) => {
  test.setTimeout(90_000);
  await start(page, 8);
  await page.locator('.nq-cmd[data-cmd="skill"]').click();
  await page.locator('[data-skill="sk-tashizan-giri"]').click();
  await expect(page.locator('.nq-bq')).toBeVisible({ timeout: 10_000 });
  await page.locator('.nq-choice').first().click();
  // 採点後に問題フレームが閉じ、ダメージ数字と ゲージの「+n」が出る
  await expect(page.locator('.nq-bq')).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator('.nq-pop').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.nq-sg-gain').first()).toBeAttached({ timeout: 10_000 });
});
