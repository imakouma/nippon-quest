import { expect, test, type Page } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

async function startGame(page: Page) {
  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page);
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 40_000 });
  const storySkip = page.getByRole('button', { name: 'スキップ' });
  if (await storySkip.isVisible()) await storySkip.click();
}

for (const width of [640, 960]) {
  test(`主要UIは ${width}x540 に収まり、キーボードの現在位置が一致する`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 540 });
    await page.goto('/');

    const first = page.getByRole('menuitem').first();
    await expect(page.getByRole('menuitem')).toHaveCount(2);
    await expect(page.getByRole('menuitem', { name: /もんだいいちらん/ })).toHaveCount(0);
    await expect(page.getByText(/タップで けってい/)).toBeVisible();
    await expect(first).toBeFocused();
    const continueItem = page.getByRole('menuitem').nth(1);
    await expect(continueItem).toBeDisabled();
    await expect(continueItem).toHaveAttribute('aria-describedby', 'nq-title-disabled-note');
    await expect(page.locator('#nq-title-disabled-note')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(first).toBeFocused();
    await expect(page.locator('.nq-title-menu')).toHaveCSS('opacity', '1', { timeout: 5_000 });

    const layer = page.locator('#ui-layer');
    const box = await layer.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(541);
    const hintBox = await page.locator('.nq-title-hint').boundingBox();
    const menuBox = await page.locator('.nq-title-menu').boundingBox();
    const creditBox = await page.locator('.nq-title-credit').boundingBox();
    expect(hintBox).not.toBeNull();
    expect(menuBox).not.toBeNull();
    expect(creditBox).not.toBeNull();
    expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(hintBox!.y);
    expect(hintBox!.y + hintBox!.height).toBeLessThanOrEqual(creditBox!.y);
    await page.screenshot({ path: `/tmp/nihonquest-title-${width}x540.png` });
  });
}

test('縦向きの小画面では横向き案内を表示する', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const notice = page.locator('#nq-orientation-notice');
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('よこ');

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(notice).toBeHidden();
});

test('新規ゲーム設定は大きな選択肢と読み上げ可能な選択状態を持つ', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();

  const setup = page.getByRole('dialog', { name: /たびの じゅんび/ });
  await expect(setup).toBeVisible();
  await expect(setup).toHaveAttribute('aria-modal', 'true');
  const grade = setup.getByRole('combobox', { name: /がくねん/ });
  await expect(grade).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(setup.getByRole('button', { name: 'もどる' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(grade).toBeFocused();
  await expect(setup.getByRole('img', { name: /しゅじんこうの みため/ })).toBeVisible();

  const colorChoice = setup.getByRole('button', { name: /^かみ 1$/ });
  const shapeChoice = setup.getByRole('button', { name: /かみがた 1/ });
  const previous = setup.getByRole('button', { name: /かみを ひとつ もどす/ });
  await expect(colorChoice).toHaveAttribute('aria-pressed', 'true');
  await expect(shapeChoice).toHaveAttribute('aria-pressed', 'true');
  for (const control of [colorChoice, shapeChoice, previous]) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  const lookBox = await setup.locator('.nq-new-game-look').boundingBox();
  const controlsBox = await setup.locator('.nq-look-controls').boundingBox();
  const actionsBox = await setup.locator('.nq-new-game-actions').boundingBox();
  expect(lookBox).not.toBeNull();
  expect(controlsBox).not.toBeNull();
  expect(actionsBox).not.toBeNull();
  expect(controlsBox!.y + controlsBox!.height).toBeLessThanOrEqual(lookBox!.y + lookBox!.height);
  expect(lookBox!.y + lookBox!.height).toBeLessThanOrEqual(actionsBox!.y);
  const hairStyleLabel = setup.locator('.nq-look-shapes > div').first().locator(':scope > span');
  const hairStyleLabelBox = await hairStyleLabel.boundingBox();
  expect(hairStyleLabelBox).not.toBeNull();
  expect(hairStyleLabelBox!.height).toBeLessThanOrEqual(36);
  await page.screenshot({ path: '/tmp/nihonquest-new-game-accessible.png' });
});

test('物語画面は読みやすい操作部と現在位置を持つ', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await page.getByRole('combobox', { name: /がくねん/ }).selectOption('1');
  await page.getByRole('button', { name: 'はじめる' }).click();

  const story = page.getByRole('dialog', { name: 'ものがたりの シーン' });
  const skip = story.getByRole('button', { name: 'スキップ' });
  const auto = story.getByRole('button', { name: /オート/ });
  await expect(story).toHaveAttribute('aria-modal', 'true');
  await expect(story).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(auto).toBeFocused();
  const skipBox = await skip.boundingBox();
  expect(skipBox).not.toBeNull();
  expect(skipBox!.height).toBeGreaterThanOrEqual(48);
  expect(
    Number.parseFloat(await skip.evaluate((node) => getComputedStyle(node).fontSize)),
  ).toBeGreaterThanOrEqual(18);
  expect(
    Number.parseFloat(
      await story.locator('.nq-cutscene-mode').evaluate((node) => getComputedStyle(node).fontSize),
    ),
  ).toBeGreaterThanOrEqual(16);
  await expect(auto).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Enter');
  await expect(auto).toHaveAttribute('aria-pressed', 'false');
  await expect(story).toHaveAttribute('data-scene-index', '0');
  const progress = story.getByRole('progressbar');
  await expect(progress).toHaveAttribute('aria-valuemin', '1');
  await expect(progress).toHaveAttribute('aria-valuenow', '1');
  await page.screenshot({ path: '/tmp/nihonquest-cutscene-accessible.png' });
});

test('メニューと保護者画面はモーダルとしてフォーカスを管理する', async ({ page }) => {
  test.setTimeout(90_000);
  await startGame(page);
  const opener = page.getByRole('button', { name: 'メニュー' });
  const openerBox = await opener.boundingBox();
  expect(openerBox).not.toBeNull();
  expect(openerBox!.height).toBeGreaterThanOrEqual(48);
  await expect(opener).toHaveCSS('opacity', '1');
  expect(
    Number.parseFloat(await page.locator('.nq-fhud-sub').evaluate((node) => getComputedStyle(node).fontSize)),
  ).toBeGreaterThanOrEqual(16);
  await opener.focus();
  await opener.click();

  const menu = page.getByRole('dialog', { name: 'メニュー' });
  await expect(menu.locator('.nq-menu-key-hint')).toContainText('やじるしキー');
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute('aria-modal', 'true');
  await expect(menu.getByRole('group', { name: 'メニュー' })).toBeVisible();
  await expect(menu.getByRole('button', { name: 'がくしゅう' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(menu.getByRole('group', { name: 'ひょうじする 教科' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu.getByRole('button', { name: 'がくしゅう' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  const selectedDexEntry = menu.locator('[data-menu-entry].nq-focus');
  await expect(selectedDexEntry).toBeFocused();
  await expect(selectedDexEntry).toHaveAttribute('aria-current', 'true');
  const dexTypes = menu.getByRole('group', { name: 'ずかん' });
  await expect(dexTypes.getByRole('button', { name: 'マナビモノ' })).toHaveAttribute('aria-pressed', 'true');
  await expect(menu.getByRole('group', { name: '地方ごとの ずかん' })).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(menu.locator('[data-menu-entry].nq-focus')).toBeFocused();
  await page.screenshot({ path: '/tmp/nihonquest-roadmap-960x540.png' });

  await page.keyboard.press('Escape');
  await expect(menu.getByRole('button', { name: 'ずかん' })).toBeFocused();
  await page.getByRole('button', { name: /ほごしゃ/ }).click();
  const parent = page.getByRole('dialog', { name: /ほごしゃ/ });
  await expect(parent).toBeVisible();
  await expect(parent).toHaveAttribute('aria-modal', 'true');
  await expect(page.getByLabel('こたえ')).toBeFocused();
  await page.screenshot({ path: '/tmp/nihonquest-parent-960x540.png' });

  await page.getByLabel('こたえ').fill('12');
  await parent.getByRole('button', { name: 'ひらく' }).click();
  await expect(parent.locator('.nq-parent-content')).toBeVisible();
  await expect(parent.getByRole('combobox', { name: '出題学年' })).toBeFocused();
  expect(
    Number.parseFloat(
      await parent
        .locator('.nq-parent-card h3')
        .first()
        .evaluate((node) => getComputedStyle(node).fontSize),
    ),
  ).toBeGreaterThanOrEqual(16);
  for (const button of await parent.locator('.nq-parent-actions button').all()) {
    const buttonBox = await button.boundingBox();
    expect(buttonBox).not.toBeNull();
    expect(buttonBox!.height).toBeGreaterThanOrEqual(44);
  }

  await page.setViewportSize({ width: 640, height: 540 });
  await expect
    .poll(async () => {
      const box = await parent.boundingBox();
      return box ? box.x + box.width : Number.POSITIVE_INFINITY;
    })
    .toBeLessThanOrEqual(641);
  const parentBox = await parent.boundingBox();
  expect(parentBox).not.toBeNull();
  expect(parentBox!.x).toBeGreaterThanOrEqual(0);
  await page.screenshot({ path: '/tmp/nihonquest-parent-640x540.png' });

  await page.keyboard.press('Escape');
  await expect(parent).toHaveCount(0);
  await expect(menu).toBeVisible();
});

test('バトル画面は狭い表示でもステージ内に収まる', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 640, height: 540 });
  await page.goto('/?debug=battle&enemy=aomori-ringoron&lv=8');
  await expect(page.locator('.nq-battle')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.nq-box-text')).toContainText('リンゴロン', { timeout: 30_000 });
  const enemyWindow = page.locator('.nq-foe');
  await expect(enemyWindow.getByText('てき', { exact: true })).toHaveCount(0);
  await expect(enemyWindow.locator('.nq-foe-level')).toHaveText('Lv 8');
  expect(
    Number.parseFloat(
      await enemyWindow.locator('.nq-foe-level').evaluate((node) => getComputedStyle(node).fontSize),
    ),
  ).toBeGreaterThanOrEqual(20);
  await expect(enemyWindow.locator('.nq-foe-hp-num')).toContainText('/');
  const message = page.locator('.nq-box');
  await message.click();
  const partyWindow = page.locator('.nq-party');
  const messageBox = await message.boundingBox();
  const partyBox = await partyWindow.boundingBox();
  expect(messageBox).not.toBeNull();
  expect(partyBox).not.toBeNull();
  expect(messageBox!.y).toBeLessThan(partyBox!.y);
  await expect(partyWindow.locator('.nq-ally-heading')).toBeVisible();
  await expect(partyWindow.locator('.nq-ally-hp')).toContainText('/');
  await expect(page.locator('.nq-box-speak')).toHaveCount(0);
  await expect(page.locator('.nq-sound')).toHaveCount(0);
  const commands = page.locator('.nq-cmdwin [data-cmd]');
  await expect(commands).toHaveCount(4);
  for (const command of await commands.all()) {
    const commandBox = await command.boundingBox();
    expect(commandBox).not.toBeNull();
    expect(commandBox!.height).toBeGreaterThan(0);
    expect(
      Number.parseFloat(await command.evaluate((node) => getComputedStyle(node).minHeight)),
    ).toBeGreaterThanOrEqual(48);
  }
  await expect(page.locator('[data-cmd="attack"]')).toHaveCount(0);
  const battleBox = await page.locator('.nq-battle').boundingBox();
  expect(battleBox).not.toBeNull();
  expect(battleBox!.x).toBeGreaterThanOrEqual(0);
  expect(battleBox!.x + battleBox!.width).toBeLessThanOrEqual(641);
  await page.screenshot({ path: '/tmp/nihonquest-battle-640x540.png' });
});
