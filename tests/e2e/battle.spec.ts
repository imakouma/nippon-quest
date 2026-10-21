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
  await expect(page.locator('.nq-bottom-command-slot')).toHaveCount(0);
  await expect(page.locator('.nq-bottom-rail')).toHaveCount(0);
  await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 10_000 });
  await page.locator('.nq-box').click();
  await expect(page.locator('.nq-bottom-rail')).toBeVisible();
  await expect(page.locator('.nq-bottom-command-slot')).toBeVisible();
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
    const describedBy = await inputs.first().getAttribute('aria-describedby');
    expect(describedBy).toMatch(/^nq-question-(?:prompt|template)$/);
    await expect(page.locator(`#${describedBy}`)).toBeVisible();
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
  await page.keyboard.press('Tab');
  await expect(recruit.getByRole('button').nth(1)).toBeFocused();
  await expect(recruit.getByRole('button').nth(1)).toHaveClass(/nq-focus/);
  await page.keyboard.press('Shift+Tab');
  await expect(recruit.getByRole('button').first()).toHaveClass(/nq-focus/);
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

test('バトル：ターン表示を出さず、こちらが動くと次のコマンド選択へ戻る', async ({ page }) => {
  test.setTimeout(60_000);
  // lv は敵レベル。初期パーティが一撃で全滅しない条件で、1ターンの完走を確認する。
  await start(page, 1);
  await expect(page.locator('.nq-turn-stage')).toHaveCount(0);
  await expect(page.locator('.nq-sgauge')).toBeVisible();
  await expect(page.locator('.nq-cmd[data-cmd="skill"]')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('meter', { name: /リンゴロン HP/ })).toBeVisible();
  await expect(page.getByRole('meter', { name: /ハル HP/ })).toBeVisible();
  await useFirstAvailableSkill(page);
  // 敵は攻撃だけでなく防御も選ぶため、次のコマンド選択へ戻ることを確認する。
  await expect(page.locator('.nq-cmd[data-cmd="skill"]')).toBeVisible({ timeout: 30_000 });
});

test('バトル：コマンドと主人公情報はポケモン風の独立したコンパクトな枠に収まる', async ({ page }) => {
  test.setTimeout(60_000);
  await start(page, 8);
  const [rail, foe, commandSlot, gauge, party, heroHp, heroGauge] = await Promise.all([
    page.locator('.nq-bottom-rail').boundingBox(),
    page.locator('.nq-panel').boundingBox(),
    page.locator('.nq-bottom-command-slot').boundingBox(),
    page.locator('.nq-ally-hero .nq-sgauge').boundingBox(),
    page.locator('.nq-party').boundingBox(),
    page.locator('.nq-ally-hero .nq-bar-hp').boundingBox(),
    page.locator('.nq-ally-hero .nq-sg-bar').boundingBox(),
  ]);

  expect(rail).not.toBeNull();
  expect(foe).not.toBeNull();
  expect(commandSlot).not.toBeNull();
  expect(gauge).not.toBeNull();
  expect(party).not.toBeNull();
  expect(heroHp).not.toBeNull();
  expect(heroGauge).not.toBeNull();
  await expect(page.locator('.nq-bottom-rail')).toBeVisible();
  await expect(page.locator('.nq-bottom-rail .nq-win')).toHaveCount(0);
  await expect(page.locator('.nq-box')).toHaveCount(0);
  await expect(page.locator('.nq-foe-row')).toHaveCount(0);
  await expect(page.locator('.nq-bar-hp .nq-bar-value')).toHaveCount(2);
  expect(foe!.width).toBeLessThanOrEqual(225);
  expect(commandSlot!.width).toBeLessThanOrEqual(190);
  expect(party!.width).toBeLessThanOrEqual(260);
  expect(commandSlot!.x).toBeCloseTo(rail!.x, 0);
  expect(party!.x + party!.width).toBeCloseTo(rail!.x + rail!.width, 0);
  expect(party!.x).toBeGreaterThan(commandSlot!.x + commandSlot!.width);
  expect(gauge!.y).toBeGreaterThan(heroHp!.y);
  expect(gauge!.x).toBeGreaterThanOrEqual(heroHp!.x);
  expect(heroGauge!.width).toBeCloseTo(heroHp!.width, 0);
  await expect(page.locator('.nq-ally-hero .nq-sg-value')).toHaveText('0/100');

  // 技一覧を開いても、右下の主人公枠は動かず、舞台を覆い過ぎない高さに保つ。
  await page.locator('.nq-cmd[data-cmd="skill"]').click();
  const [menu, partyWhileMenu] = await Promise.all([
    page.locator('.nq-menu').boundingBox(),
    page.locator('.nq-party').boundingBox(),
  ]);
  expect(menu).not.toBeNull();
  expect(partyWhileMenu).not.toBeNull();
  expect(menu!.height).toBeLessThanOrEqual(216);
  expect(menu!.x + menu!.width).toBeLessThanOrEqual(partyWhileMenu!.x);
  expect(partyWhileMenu!.x).toBeCloseTo(party!.x, 0);
  await expect(page.locator('.nq-menu .nq-chip')).toHaveCount(0);
  await expect(page.locator('.nq-menu [data-skill] .nq-cur')).toHaveCount(0);
  await expect(page.locator('.nq-menu .nq-opt-side').first()).toHaveCSS('white-space', 'nowrap');
  await expect(page.locator('.nq-menu-skill .nq-menu-head')).toHaveCount(0);
  const firstSkillBox = await page.locator('.nq-menu-skill .nq-opt').first().boundingBox();
  const skillListBox = await page.locator('.nq-menu-skill .nq-menu-grid').boundingBox();
  const skillDetailBox = await page.locator('.nq-menu-foot-skill').boundingBox();
  expect(firstSkillBox!.height).toBe(40);
  expect(skillDetailBox!.x).toBeGreaterThan(skillListBox!.x + skillListBox!.width);
  expect(skillDetailBox!.height).toBe(skillListBox!.height);
  for (const skill of await page.locator('.nq-menu-skill .nq-opt').all()) {
    expect(await skill.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  }

  // 技一覧の外側を押すと、専用の「もどる」見出しなしでコマンド選択へ戻る。
  await page.locator('.nq-menu-dismiss').click({ position: { x: 940, y: 24 } });
  await expect(page.locator('.nq-menu-skill')).toHaveCount(0);
  await expect(page.locator('.nq-cmd[data-cmd="skill"]')).toBeVisible();
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
  // Hover can select a disabled row; check its idle color with focus on a usable skill.
  await page.locator('[data-skill]:not(.nq-opt-off)').first().hover();
  await expect(unavailable).toHaveAttribute('aria-disabled', 'true');
  await expect(unavailable).toHaveCSS('color', 'rgb(163, 170, 187)');
  await expect(unavailable.locator('.nq-opt-cost')).toHaveAttribute('aria-label', /^ひつようゲージ \d+$/);
  await expect(unavailable.locator('.nq-opt-cost-value')).toHaveText(/^\d+$/);
  await expect(unavailable.locator('.nq-opt-cost')).toHaveCSS('color', 'rgb(255, 210, 138)');
  await expect(unavailable.locator('.nq-opt-cost')).toHaveCSS('white-space', 'nowrap');
});

test('バトル：必殺技を えらぶと 問題が出て、答えると採点されてターンが進む', async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    window.__musicAudio = [];
    window.Audio = new Proxy(window.Audio, {
      construct(target, args: [string?]) {
        const audio = new target(args[0]);
        window.__musicAudio.push(audio);
        return audio;
      },
    });
  });
  await start(page, 1);
  await page.locator('.nq-cmd[data-cmd="skill"]').click();
  await page.locator('[data-skill="sk-tashizan-giri"]').click();
  const question = page.locator('.nq-bq');
  await expect(question).toBeVisible({ timeout: 20_000 });
  await expect(question).toHaveAttribute('aria-modal', 'true');
  expect(await question.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  await answerCurrentQuestion(page);
  // 問題を閉じて、メッセージ送りを含めてターンまたは決着まで進むことを確認する。
  // ゲージ加算量は、乱数や問題形式に依存しない core のユニットテストで検証する。
  await expect(page.locator('.nq-bq')).toHaveCount(0, { timeout: 10_000 });
  await expect
    .poll(
      async () => {
        if (await page.locator('.nq-box-next').isVisible())
          await page
            .locator('.nq-box')
            .click()
            .catch(() => undefined);
        return (
          (await page.locator('.nq-cmd[data-cmd="skill"]').isVisible()) ||
          (await page.locator('.nq-result').isVisible())
        );
      },
      { timeout: 45_000 },
    )
    .toBe(true);
  if (await page.locator('.nq-cmd[data-cmd="skill"]').isVisible()) {
    await expect
      .poll(() =>
        page.evaluate(() => {
          const audio = window.__musicAudio.find((a) => a.src.endsWith('/battle-theme.mp3'));
          return !!audio && !audio.paused && audio.volume === 0.6 && audio.currentTime > 0;
        }),
      )
      .toBe(true);
  }
});
