import { expect, test, type Page } from '@playwright/test';

/**
 * docs/02 Step 6 の E2E（ターン制バトル）：デバッグ URL で強制エンカウント。
 * 1 ターンに 主人公 → オトモ → てき が 1 回ずつ 動く。
 * 問題の中身には なるべく依存しない。現行の「わざ」は問題に回答して発動する。
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
  const ready = page
    .locator('.nq-choice, .nq-q-input input, .nq-map-tap, .nq-nb-submit, .nq-pw-card, .nq-sort-submit')
    .first();
  await expect(ready).toBeVisible({ timeout: 20_000 });
  if (await page.locator('.nq-choice').first().isVisible()) {
    await expect(page.locator('.nq-choice').first()).toHaveAttribute(
      'aria-describedby',
      'nq-question-prompt',
    );
    await expect(page.locator('.nq-choice').first()).toHaveAttribute('aria-keyshortcuts', '1');
    await page.locator('.nq-choice').first().click();
    return;
  }
  if (await page.locator('.nq-q-input input').first().isVisible()) {
    const inputs = page.locator('.nq-q-input input');
    await expect(inputs.first()).toHaveAttribute('aria-describedby', 'nq-question-prompt');
    for (let index = 0; index < (await inputs.count()); index += 1) await inputs.nth(index).fill('0');
    await page.getByRole('button', { name: 'こたえる' }).click();
    return;
  }
  if (await page.locator('.nq-nb-submit').isVisible()) {
    await page.locator('.nq-nb-submit').click();
    return;
  }
  if (await page.locator('.nq-pw-card').first().isVisible()) {
    const cards = page.locator('.nq-pw-card');
    for (
      let index = 0;
      index < (await cards.count()) && (await page.locator('.nq-bq').isVisible());
      index += 1
    )
      await cards
        .nth(index)
        .click()
        .catch(() => undefined);
    return;
  }
  if (await page.locator('.nq-sort-submit').isVisible()) {
    await page.locator('.nq-sort-submit').click();
    return;
  }
  await page.locator('.nq-map-tap').click({ position: { x: 20, y: 20 } });
}

async function useFirstAvailableSkill(page: Page): Promise<void> {
  await page.locator('.nq-cmd[data-cmd="skill"]').click({ timeout: 2_000 });
  const skill = page.locator('[data-skill]:not(.nq-opt-off)').first();
  await expect(skill).toBeVisible({ timeout: 10_000 });
  await skill.click();
  await answerCurrentQuestion(page);
}

test('バトル：報酬のあとに、キャラが動く仲間加入演出を別画面で表示する', async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await start(page, 1, true);
  await expect(page.locator('.nq-cmd[data-cmd="skill"]')).toBeVisible({ timeout: 20_000 });

  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline && !(await page.locator('.nq-result').isVisible())) {
    // 自分の ターンが 来たら わざを選んで1問答える。タップ待ちの 文は すすめる
    if (await page.locator('.nq-cmd[data-cmd="skill"]').isVisible())
      await useFirstAvailableSkill(page).catch(() => undefined);
    else if (await page.locator('.nq-box-next').isVisible())
      await page
        .locator('.nq-box')
        .click({ timeout: 1_000 })
        .catch(() => undefined);
    await page.waitForTimeout(250);
  }
  await expect(page.locator('.nq-result')).toBeVisible();
  const result = page.getByRole('dialog');
  await expect(result).toHaveAttribute('aria-modal', 'true');
  await expect(result.getByRole('button')).toBeFocused();

  await expect(page.locator('.nq-recruit-scene')).toHaveCount(0);
  await page.keyboard.press('z');
  const recruit = page.locator('.nq-recruit-scene');
  await expect(recruit).toBeVisible();
  await expect(recruit).toHaveAttribute('aria-modal', 'true');
  await expect(recruit.getByRole('button').first()).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(recruit.getByRole('button').nth(1)).toBeFocused();
  await expect(recruit).toContainText('リンゴロン');
  const monster = recruit.locator('.nq-recruit-stage img');
  await expect(monster).toBeVisible();
  expect(await monster.evaluate((node) => getComputedStyle(node).animationName)).toContain('recruit-hop');
  await page.screenshot({ path: testInfo.outputPath('recruit-offer.png'), fullPage: true });
  await recruit.locator('.nq-result-btns .nq-cmd').nth(1).click();
  await expect(page.locator('.nq-battle')).toHaveCount(0, { timeout: 10_000 });
  expect(errors).toEqual([]);
});

test('バトル：ターンが 出て、こちらが 動くと敵の行動後に次のターンへ進む', async ({ page }) => {
  test.setTimeout(60_000);
  await start(page, 8);
  await expect(page.locator('.nq-turn-stage')).toContainText('ターン', { timeout: 10_000 });
  await expect(page.locator('.nq-sgauge')).toBeVisible();
  await expect(page.locator('.nq-cmd[data-cmd="skill"]')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('meter', { name: /リンゴロン HP/ })).toBeVisible();
  await expect(page.getByRole('meter', { name: /ハル HP/ })).toBeVisible();
  await useFirstAvailableSkill(page);
  // 敵は攻撃だけでなく防御も選ぶため、HP変化ではなくターン完走を確認する。
  await expect(page.locator('.nq-turn-stage')).toContainText('ターン 2', { timeout: 30_000 });
});

test('バトル：教科ゲージはコマンドと主人公ステータスの間にあり、両ステータス枠は同じ幅', async ({ page }) => {
  test.setTimeout(60_000);
  await start(page, 8);
  const [enemy, commands, gauge, party] = await Promise.all([
    page.locator('.nq-panel').boundingBox(),
    page.locator('.nq-cmdwin').boundingBox(),
    page.locator('.nq-sgauge').boundingBox(),
    page.locator('.nq-party').boundingBox(),
  ]);

  expect(enemy).not.toBeNull();
  expect(commands).not.toBeNull();
  expect(gauge).not.toBeNull();
  expect(party).not.toBeNull();
  expect(party!.width).toBeCloseTo(enemy!.width, 0);
  expect(gauge!.x).toBeGreaterThan(commands!.x + commands!.width);
  expect(gauge!.x + gauge!.width).toBeLessThan(party!.x);
  expect(gauge!.y).toBeCloseTo(party!.y, 0);
});

test('バトル：矢印で選んだコマンドへ実フォーカスが追従する', async ({ page }) => {
  test.setTimeout(60_000);
  await start(page, 8);
  const skill = page.locator('.nq-cmd[data-cmd="skill"]');
  const item = page.locator('.nq-cmd[data-cmd="item"]');
  await expect(page.getByRole('menu', { name: 'コマンド' })).toBeVisible();
  await expect(page.locator('.nq-cmd[data-cmd="swap"] .nq-off')).toHaveCSS('color', 'rgb(163, 170, 187)');
  await expect(skill).toBeFocused({ timeout: 10_000 });
  await page.keyboard.press('ArrowRight');
  await expect(item).toBeFocused();
  await expect(item).toHaveClass(/nq-focus/);
  await expect(item).toHaveAttribute('aria-current', 'true');
});

test('バトル：使えない必殺技も理由を読める明るさで表示する', async ({ page }) => {
  test.setTimeout(60_000);
  await start(page, 8);
  await page.locator('.nq-cmd[data-cmd="skill"]').click();
  await expect(page.getByRole('group', { name: 'わざ' })).toBeVisible();
  const unavailable = page.locator('[data-skill].nq-opt-off').first();
  await expect(unavailable).toBeVisible();
  await expect(unavailable).toHaveAttribute('aria-disabled', 'true');
  await expect(unavailable).toHaveCSS('color', 'rgb(163, 170, 187)');
  await expect(unavailable.locator('.nq-opt-cost')).toHaveAttribute('aria-label', /ゲージ 0\//);
  await expect(unavailable.locator('.nq-opt-cost-value')).toContainText('0/');
  await expect(unavailable.locator('.nq-opt-cost')).toHaveCSS('color', 'rgb(255, 210, 138)');
  await expect(unavailable.locator('.nq-opt-cost')).toHaveCSS('white-space', 'nowrap');
});

test('バトル：必殺技を えらぶと 問題が出て、答えると採点されてターンが進む', async ({ page }) => {
  test.setTimeout(90_000);
  await start(page, 8);
  await page.locator('.nq-cmd[data-cmd="skill"]').click();
  await page.locator('[data-skill="sk-tashizan-giri"]').click();
  const question = page.locator('.nq-bq');
  await expect(question).toBeVisible({ timeout: 20_000 });
  await expect(question).toHaveAttribute('aria-modal', 'true');
  expect(await question.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  await answerCurrentQuestion(page);
  // 不正解ならゲージ加算が0になるのが仕様。問題を閉じてターンを完走することを確認する。
  // 正解時のゲージ加算量は、乱数や問題形式に依存しない core のユニットテストで検証する。
  await expect(page.locator('.nq-bq')).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator('.nq-turn-stage')).toContainText('ターン 2', { timeout: 30_000 });
});
