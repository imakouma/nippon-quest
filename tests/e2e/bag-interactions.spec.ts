import { expect, test, type Page } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

const pageErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on('pageerror', (e) => errors.push(e.message));
});
test.afterEach(({ page }) => {
  expect(pageErrors.get(page)).toEqual([]);
});

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

test('A案の詳細を保ち、装備をクリックとドラッグで追加・移動・取り外しできる', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page, 'テスト');
  await page.getByRole('button', { name: 'メニュー' }).click();
  await page.getByRole('button', { name: /もちもの・へんせい/ }).click();
  const bag = page.getByRole('dialog', { name: /もちもの・へんせい/ });
  const reserve = bag.locator('.nq-bag-reserve-grid');
  const storedWeapon = reserve.locator('[data-bag-key="inv:common-renshu-no-bou"]');
  await expect(bag.locator('[data-bag-key="hero"]')).toBeFocused();
  await expect(bag.locator('.nq-party-skills')).toHaveCount(0);
  await expect(bag.locator('.nq-bag-hero-bars .nq-bag-hero-bar')).toHaveCount(2);
  await expect(bag.locator('.nq-bag-hero-stat')).toHaveCount(6);
  await expect(bag.locator('.nq-bag-hero-cap')).toHaveText('10');
  await expect(bag.locator('.nq-bag-hero-cap-row')).toContainText('Max 200');
  await expect(bag.locator('.nq-bag-hero-materials')).toContainText('0/3');
  expect(await bag.locator('.nq-party-info').evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath('hero-details-b.png') });
  await bag.getByRole('button', { name: 'どうぐ', exact: true }).click();
  await page.keyboard.press('ArrowDown');
  await expect(bag.locator('.nq-party-info')).toContainText('テスト');
  await expect(storedWeapon).toHaveCount(0);
  await bag.getByRole('button', { name: 'そうび', exact: true }).click();
  await page.keyboard.press('ArrowDown');
  await expect(bag.locator('.nq-party-info')).toContainText('れんしゅうの ぼう');
  await expect(bag.locator('.nq-bag-detail-count')).toHaveText('×1');
  await expect(bag.locator('.nq-bag-detail-kind')).toContainText('ぶき');
  await expect(bag.locator('.nq-bag-effects')).toContainText('こうか');
  await expect(bag.locator('.nq-bag-effect-value')).toHaveText(['+1', '+1']);
  await expect(bag.locator('.nq-party-art img')).toHaveAttribute('src', /.+/);
  await page.screenshot({ path: testInfo.outputPath('bag-detail-weapon.png') });
  await bag.getByRole('button', { name: 'どうぐ', exact: true }).click();
  await expect(bag.locator('.nq-party-info')).toContainText('テスト');
  await bag.getByRole('button', { name: 'ぜんぶ', exact: true }).click();
  await expect(bag).toHaveAttribute('aria-modal', 'true');
  await expect(bag.locator('.nq-bag-filters button').first()).toHaveCSS('font-size', '10px');
  await expect(bag.locator(':scope > .nq-bag-message')).toHaveCount(0);
  await expect(bag.getByRole('status')).toHaveCount(0);
  for (const [width, height] of [
    [960, 540],
    [640, 540],
    [320, 568],
    [768, 1024],
    [1440, 900],
  ] as const) {
    await page.setViewportSize({ width, height });
    const [left, board, detail] = await Promise.all([
      reserve.boundingBox(),
      bag.locator('.nq-bag-grid').boundingBox(),
      bag.locator('.nq-bag-details').boundingBox(),
    ]);
    expect(left!.x + left!.width).toBeLessThanOrEqual(board!.x);
    expect(board!.x + board!.width).toBeLessThanOrEqual(detail!.x);
    expect(await bag.locator('.nq-party-info').evaluate((el) => el.clientHeight)).toBeGreaterThan(120);
    expect(await bag.locator('.nq-bag-body').evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(
      true,
    );
    const filters = bag.locator('.nq-bag-filters');
    expect(await filters.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(
      await filters
        .locator('button')
        .evaluateAll((buttons) => new Set(buttons.map((b) => (b as HTMLElement).offsetTop)).size),
    ).toBe(1);
    await expect(storedWeapon).toBeVisible();
  }
  await page.setViewportSize({ width: 960, height: 540 });
  await storedWeapon.click();
  await storedWeapon.click();
  await storedWeapon.press('Enter');
  await storedWeapon.press('Space');
  await expect(bag.locator('.nq-party-info')).toContainText('れんしゅうの ぼう');
  await expect(bag.getByRole('status')).toHaveCount(0);
  await storedWeapon.dragTo(bag.locator('.nq-bag-grid [data-bag-key="hero"]'));
  await expect(bag.getByRole('status')).toContainText('そこには おけない');
  await expect(storedWeapon).toBeVisible();
  await bag.getByRole('button', { name: 'そうびする', exact: true }).click();
  const weapon = bag.locator('.nq-bag-grid [data-bag-key="eq:weapon"]');
  await expect(weapon).toBeVisible();
  await expect(bag.locator('.nq-party-info')).toContainText('れんしゅうの ぼう');
  await bag.locator('.nq-bag-toggle').click();
  await expect(storedWeapon).toBeVisible();
  await storedWeapon.dragTo(bag.locator('.nq-bag-empty[data-cell-x="0"][data-cell-y="2"]'));
  await expect(weapon).toHaveCSS('grid-column-start', '1');
  await expect(weapon).toHaveCSS('grid-row-start', '3');
  await expect(weapon).toBeVisible();
  await weapon.click();
  await bag.locator('.nq-bag-empty').first().click();
  await expect(weapon).toHaveCSS('grid-column-start', '1');
  await weapon.dragTo(reserve);
  await expect(storedWeapon).toBeVisible();
  await storedWeapon.click();
  await bag.locator('.nq-bag-empty[data-cell-x="0"][data-cell-y="2"]').click();
  await expect(weapon).toHaveCSS('grid-row-start', '3');
  await bag.getByRole('button', { name: /とじる/ }).click();
  await page.getByRole('button', { name: /セーブ/ }).click();
  await page.reload();
  await page.getByRole('menuitem', { name: 'つづきから' }).click();
  await page.getByRole('button', { name: /スロット 1.*Lv/ }).click();
  await page.getByRole('button', { name: 'メニュー', exact: true }).click();
  await page.getByRole('button', { name: /もちもの・へんせい/ }).click();
  await expect(weapon).toHaveCSS('grid-column-start', '1');
  await expect(weapon).toHaveCSS('grid-row-start', '3');
  await page.screenshot({ path: testInfo.outputPath('bag-a-equipment.png') });
});

async function seedBagItems(page: Page) {
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('nihonquest');
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('saves', 'readwrite');
      const store = tx.objectStore('saves');
      const r = store.get('save:1');
      r.onsuccess = () => {
        const s = r.result;
        const packed = [
          'hiroshima-setoda-lemon',
          'hokkaido-tokachi-jagaimo',
          'gifu-fuyugaki',
          'shiga-omiushi',
          'gunma-tsumagoi-kyabetsu',
          'akita-kiritanpo',
        ];
        for (const id of [...packed, 'aomori-ringo', 'learning-fragment', 'aomori-ringo-no-yoroi'])
          s.inventory[id] = 3;
        s.party.bagItems = packed;
        s.party.owned.push({ uid: 'bag-test', monsterId: 'iwate-kagurabi', level: 1, levelCap: 10, xp: 0 });
        s.party.owned.push({
          uid: 'large-test',
          monsterId: 'tohoku-boss-rokufuyu',
          level: 1,
          levelCap: 10,
          xp: 0,
        });
        s.progress.counters['story.prologue'] = 1;
        s.progress.counters['story.hero-identity'] = 1;
        delete s.progress.counters['tutorial.battle-basics.pending'];
        if (!s.progress.eventsDone.includes('tutorial.battle-basics'))
          s.progress.eventsDone.push('tutorial.battle-basics');
        store.put(s, 'save:1');
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  });
}

test('どうぐが増えても詳細と操作を保ち、クリック追加・指定位置・保存復元が動く', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: 'はじめから' }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page, 'テスト');
  await page.reload();
  await expect(page.getByRole('menuitem', { name: 'つづきから' })).toBeEnabled();
  await seedBagItems(page);
  await page.getByRole('menuitem', { name: 'つづきから' }).click();
  await page.getByRole('button', { name: /スロット 1.*Lv/ }).click();
  const openBag = async () => {
    await page.getByRole('button', { name: 'メニュー', exact: true }).click();
    await page.getByRole('button', { name: /もちもの・へんせい/ }).click();
  };
  await openBag();
  const bag = page.getByRole('dialog', { name: /もちもの・へんせい/ });
  const apple = bag.locator('[data-bag-key="item:aomori-ringo"]');
  await expect(apple).toHaveAccessibleName('りんご');
  await expect(bag.locator('.nq-bag-reserve-name')).toHaveCount(0);
  await apple.click();
  await apple.click();
  await expect(bag.locator('.nq-bag-effects')).toContainText('HP');
  await expect(bag.locator('.nq-party-art img')).toHaveAttribute('src', /.+/);
  await page.screenshot({ path: testInfo.outputPath('bag-detail-apple.png') });
  for (const [width, height] of [
    [960, 540],
    [640, 540],
    [320, 568],
  ] as const) {
    await page.setViewportSize({ width, height });
    expect(await bag.locator('.nq-party-info').evaluate((el) => el.clientHeight)).toBeGreaterThan(120);
    expect(await bag.locator('.nq-bag-body').evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(
      true,
    );
    await expect(bag.locator('.nq-bag-toggle')).toBeVisible();
    await expect(bag.locator('.nq-bag-toggle')).toHaveCSS('font-size', '18px');
    await expect(bag.locator('.nq-bag-toggle')).toHaveCSS('white-space', 'nowrap');
    expect(await bag.locator('.nq-bag-toggle').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    const cardSizes = await bag.locator('.nq-bag-reserve-tile').evaluateAll((cards) =>
      cards.map((card) => ({
        height: (card as HTMLElement).offsetHeight,
        width: (card as HTMLElement).offsetWidth,
        fits: card.scrollHeight <= card.clientHeight + 1 && card.scrollWidth <= card.clientWidth + 1,
      })),
    );
    expect(
      await bag
        .locator('.nq-bag-reserve-grid')
        .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length),
    ).toBe(4);
    expect(new Set(cardSizes.map((card) => card.height)).size).toBe(1);
    expect(new Set(cardSizes.map((card) => card.width)).size).toBe(1);
    expect(cardSizes.every((card) => card.fits)).toBe(true);
    expect(cardSizes.every((card) => Math.abs(card.width - card.height) <= 1)).toBe(true);
  }
  await page.setViewportSize({ width: 960, height: 540 });
  await bag.locator('.nq-bag-toggle').click();
  await expect(bag.locator('.nq-bag-packed [data-bag-key="item:aomori-ringo"]')).toBeVisible();
  await expect(bag.locator('.nq-party-info')).toContainText('りんご');
  await apple.dragTo(bag.locator('.nq-bag-empty').first());
  await expect(bag.locator('.nq-bag-packed [data-bag-key="item:aomori-ringo"]')).toHaveCount(1);
  await expect(bag.getByRole('status')).toContainText('どうぐは マスを');
  await bag.getByRole('button', { name: /(?:前|まえ)の どうぐを/ }).click();
  await bag.getByRole('button', { name: /(?:次|つぎ)の どうぐを/ }).click();
  expect(await bag.locator('.nq-bag-packed').evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await page.screenshot({ path: testInfo.outputPath('bag-a-many-items.png') });
  await bag.locator('[data-bag-key="inv:aomori-ringo-no-yoroi"]').click();
  await expect(bag.locator('.nq-bag-toggle')).toBeDisabled();
  await expect(bag.locator('.nq-party-info')).toContainText(/東北|とうほく/);
  await bag.locator('[data-bag-key="item:learning-fragment"]').click();
  await expect(bag.locator('.nq-bag-toggle')).toBeDisabled();
  await bag.locator('[data-bag-key="mon:large-test"]').click();
  await bag.locator('[data-cell-x="2"][data-cell-y="2"]').click();
  await expect(bag.getByRole('status')).toContainText('そこには おけない');
  await expect(bag.locator('.nq-bag-grid [data-bag-key="mon:large-test"]')).toHaveCount(0);
  await bag.locator('[data-bag-key="mon:bag-test"]').click();
  await bag.locator('[data-cell-x="2"][data-cell-y="2"]').click();
  await expect(bag.locator('.nq-bag-grid [data-bag-key="mon:bag-test"]')).toHaveCSS('grid-column-start', '3');
  await expect(bag.locator('.nq-bag-grid [data-bag-key="mon:bag-test"]')).toHaveCSS('grid-row-start', '3');
  await bag.getByRole('button', { name: /とじる/ }).click();
  await page.getByRole('button', { name: /セーブ/ }).click();
  await page.reload();
  await page.getByRole('menuitem', { name: 'つづきから' }).click();
  await page.getByRole('button', { name: /スロット 1.*Lv/ }).click();
  await openBag();
  await expect(bag.locator('.nq-bag-packed [data-bag-key="item:aomori-ringo"]')).toHaveCount(1);
  await expect(bag.locator('.nq-bag-grid [data-bag-key="mon:bag-test"]')).toHaveCSS('grid-row-start', '3');
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
    await page.getByRole('button', { name: /スロット 1.*Lv/ }).click();
    await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: 'メニュー' }).click();
    const menu = page.getByRole('dialog', { name: 'メニュー' });
    await menu.getByRole('button', { name: /もちもの・へんせい/ }).click();
    const bag = page.getByRole('dialog', { name: /もちもの・へんせい/ });
    await bag.getByRole('button', { name: 'テスト' }).click();
    await expect(bag.locator('.nq-party-sub')).toContainText('Lv10 / 10');
    await expect(bag.locator('.nq-bag-hero-growth')).toContainText('200');
    await expect(bag.locator('.nq-bag-hero-cap')).toHaveText('10');
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
    await expect(bag.locator('.nq-party-sub')).toContainText(/Lv1[1-9] \/ 20/);
    await expect(bag.locator('.nq-bag-hero-cap')).toHaveText('20');
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
    await menu
      .getByRole('button', { name: /？？？/ })
      .first()
      .click();
    await expect(detail).not.toContainText(/はじめの (?:上限|じょうげん)/);
    await page.screenshot({ path: testInfo.outputPath('dex-level-caps-hidden.png'), fullPage: true });
  });
});
