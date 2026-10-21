import { expect, test, type Page } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

async function seedLevelCapUnlock(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nihonquest');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('saves', 'readwrite');
      const store = transaction.objectStore('saves');
      const request = store.get('save:1');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const state = request.result;
        state.player.level = 10;
        state.player.levelCap = 10;
        state.player.xp = 9564;
        state.inventory['learning-fragment'] = 3;
        state.inventory['trial-core'] = 1;
        state.dex.monsters = ['iwate-kagurabi'];
        state.progress.counters['story.prologue'] = 1;
        state.progress.counters['story.hero-identity'] = 1;
        delete state.progress.counters['tutorial.battle-basics.pending'];
        if (!state.progress.eventsDone.includes('tutorial.battle-basics'))
          state.progress.eventsDone.push('tutorial.battle-basics');
        state.updatedAt = Date.now();
        store.put(state, 'save:1');
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  });
}

test('装備の詳細を閉じても崩れず、武器をドラッグして装備・移動・取り外しできる', async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page, 'テスト');
  await page
    .getByRole('dialog', { name: 'ものがたりの シーン' })
    .getByRole('button', { name: 'スキップ' })
    .click();
  const battleTutorial = page.locator('.nq-dlg');
  await expect(battleTutorial).toBeVisible();
  for (let step = 0; step < 12 && (await battleTutorial.isVisible()); step += 1) {
    await battleTutorial.click();
  }
  await expect(battleTutorial).toHaveCount(0);

  await page.getByRole('button', { name: 'メニュー' }).click();
  await page.getByRole('button', { name: /もちもの・へんせい/ }).click();
  const bagWindow = page.locator('.nq-wmap-box');
  const bagDialog = page.getByRole('dialog', { name: /もちもの・へんせい/ });
  await expect(bagDialog).toHaveAttribute('aria-modal', 'true');
  await expect(bagDialog.getByRole('group', { name: /もちもの・へんせい/ })).toBeVisible();
  await expect(bagDialog.getByText(/バッグ \d+\/9マス/)).toBeVisible();
  const heroCell = page.getByRole('button', { name: 'テスト' });
  await expect(heroCell).toBeFocused();
  const openWidth = await bagWindow.evaluate((el) => el.getBoundingClientRect().width);

  const reserve = page.locator('.nq-bag-reserve-grid');
  const storedWeapon = page.locator('.nq-bag-reserve-tile').filter({ hasText: 'れんしゅうの ぼう' });
  for (const [width, height] of [
    [960, 540],
    [640, 540],
    [320, 568],
    [768, 1024],
    [1024, 768],
    [1440, 900],
  ] as const) {
    await page.setViewportSize({ width, height });
    const [bagBox, reserveBox, tileBox] = await Promise.all([
      page.locator('.nq-bag-grid').boundingBox(),
      reserve.boundingBox(),
      storedWeapon.boundingBox(),
    ]);
    expect(bagBox).not.toBeNull();
    expect(reserveBox).not.toBeNull();
    expect(tileBox).not.toBeNull();
    expect(reserveBox!.x).toBeGreaterThanOrEqual(bagBox!.x + bagBox!.width);
    expect(reserveBox!.height).toBeGreaterThan(bagBox!.height);
    expect(tileBox!.y).toBeGreaterThanOrEqual(reserveBox!.y);
    expect(tileBox!.y + tileBox!.height).toBeLessThanOrEqual(reserveBox!.y + reserveBox!.height);
    await expect(page.locator('.nq-party-info')).toHaveCount(0);
  }
  await page.setViewportSize({ width: 960, height: 540 });
  await page.screenshot({ path: testInfo.outputPath('reserve-right.png') });
  await heroCell.press('Enter');
  await expect(page.locator('.nq-party-info')).toBeVisible();
  await heroCell.press('Space');
  await expect(page.locator('.nq-party-info')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /とじる/ })).toBeVisible();
  await expect.poll(() => bagWindow.evaluate((el) => el.getBoundingClientRect().width)).toBe(openWidth);
  await page.screenshot({ path: testInfo.outputPath('details-closed.png') });

  await expect(reserve).toBeVisible();
  await storedWeapon.click();
  await expect(storedWeapon).toBeFocused();
  await expect(page.locator('.nq-party-name')).toContainText('れんしゅうの ぼう');
  await storedWeapon.click();
  await expect(page.locator('.nq-party-info')).toHaveCount(0);
  await storedWeapon.click();
  await expect(page.locator('.nq-party-info')).toBeVisible();
  const [reserveBox, detailBox] = await Promise.all([
    reserve.boundingBox(),
    page.locator('.nq-party-info').boundingBox(),
  ]);
  expect(reserveBox!.y + reserveBox!.height).toBeLessThanOrEqual(detailBox!.y);
  const weaponSlot = page.locator('.nq-bag-empty[data-drop-slot="weapon"]');
  await storedWeapon.dragTo(weaponSlot);
  const weapon = page.getByRole('button', { name: 'れんしゅうの ぼう' });
  await page.locator('.nq-bag-empty').first().click();
  await expect(weapon).toHaveCSS('grid-column-start', '1');
  await expect(reserve).toContainText('ひかえや もちものは ないよ');
  await page.screenshot({ path: testInfo.outputPath('weapon-moved.png') });

  await weapon.dragTo(reserve);
  await expect(page.locator('.nq-bag-grid').getByRole('button', { name: 'れんしゅうの ぼう' })).toHaveCount(
    0,
  );
  await expect(reserve.getByRole('button', { name: 'れんしゅうの ぼう' })).toBeVisible();
});

test.describe('レベル上限のタッチ操作', () => {
  test.use({ hasTouch: true });

  test('主人公の個体上限をタッチで解放し、図鑑では既知種族だけ上限を読める', async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.goto('/?resetSaves=1');
    await page.getByRole('menuitem', { name: /はじめから/ }).click();
    await page.getByRole('button', { name: /スロット 1/ }).click();
    await completeNewGameSetup(page, 'テスト');
    const storySkip = page.getByRole('button', { name: 'スキップ' });
    if (await storySkip.isVisible()) await storySkip.click();
    await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });

    await page.reload();
    await expect(page.getByRole('menuitem', { name: 'つづきから' })).toBeEnabled({ timeout: 30_000 });
    await seedLevelCapUnlock(page);
    await page.getByRole('menuitem', { name: 'つづきから' }).click();
    await page.getByRole('button', { name: /スロット 1 Lv/ }).click();
    await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: 'メニュー' }).click();
    const menu = page.getByRole('dialog', { name: 'メニュー' });
    await menu.getByRole('button', { name: /もちもの・へんせい/ }).click();
    const bag = page.getByRole('dialog', { name: /もちもの・へんせい/ });
    await bag.getByRole('button', { name: 'テスト' }).click();
    await expect(bag.locator('.nq-party-info')).toContainText('Lv10 / じょうげん 10');
    await expect(bag.locator('.nq-party-info')).toContainText('さいご 200');
    await expect(bag.locator('.nq-party-info')).toContainText('3/3');
    await expect(bag.locator('.nq-party-info')).toContainText('1/1');

    const grow = bag.getByRole('button', { name: /そだてる/ });
    const growBox = await grow.boundingBox();
    expect(growBox).not.toBeNull();
    expect(growBox!.height).toBeGreaterThanOrEqual(48);
    await grow.focus();
    await expect(grow).toBeFocused();
    await page.touchscreen.tap(growBox!.x + growBox!.width / 2, growBox!.y + growBox!.height / 2);
    await expect(bag.locator('.nq-party-msg')).toContainText('10 → 20');
    await expect(bag.locator('.nq-party-info')).toContainText(/Lv1[1-9] \/ じょうげん 20/);
    await expect(bag.locator('[data-bag-key="hero"]')).toHaveClass(/nq-focus/);
    await page.screenshot({ path: testInfo.outputPath('hero-level-cap-unlocked.png'), fullPage: true });

    await bag.getByRole('button', { name: /とじる/ }).click();
    await menu.getByRole('button', { name: /ずかん/ }).click();
    const regions = menu.getByRole('group', { name: /^(?:地方|ちほう)ごとの ずかん$/ });
    await regions.getByRole('button', { name: /東北/ }).click();
    await menu.getByRole('button', { name: /カグラビ/ }).click();
    const detail = menu.locator('.nq-dex-info');
    await expect(detail).toContainText(/はじめの (?:上限|じょうげん) Lv10/);
    await expect(detail).toContainText(/さいごの (?:上限|じょうげん) Lv100/);
    await page.screenshot({ path: testInfo.outputPath('dex-level-caps-known.png'), fullPage: true });
    await menu.locator('[data-menu-entry]').filter({ hasText: '？？？' }).first().click();
    await expect(detail).not.toContainText(/はじめの (?:上限|じょうげん)/);
    await page.screenshot({ path: testInfo.outputPath('dex-level-caps-hidden.png'), fullPage: true });
  });
});
