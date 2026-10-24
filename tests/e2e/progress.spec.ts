import { expect, test, type Page } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

async function expectEightStatsFit(page: Page) {
  const info = page.locator('.nq-party-info');
  const stats = info.locator('.nq-party-stats > span');
  await expect(stats).toHaveCount(8);
  for (const label of [
    /HP/,
    /MP/,
    /理系.*こうげき/,
    /文系攻撃/,
    /理系.*ぼうぎょ/,
    /文系.*ぼうぎょ/,
    /すばやさ/,
    /かしこさ/,
  ])
    await expect(info).toContainText(label);
  await expect(stats.locator('small').filter({ hasText: '文系攻撃' })).toHaveText('文系攻撃');
  await expect(info.locator('.nq-party-stats')).not.toContainText(/[[\]]/);
  const [infoBox, statsBox] = await Promise.all([
    info.boundingBox(),
    info.locator('.nq-party-stats').boundingBox(),
  ]);
  expect(infoBox).not.toBeNull();
  expect(statsBox).not.toBeNull();
  expect(statsBox!.x).toBeGreaterThanOrEqual(infoBox!.x);
  expect(statsBox!.x + statsBox!.width).toBeLessThanOrEqual(infoBox!.x + infoBox!.width + 1);
}

test('新規ゲームから2Dロードマップを開き、セーブ後に同じスロットを続行できる', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await page.goto('/?preview=roadmap-tree&resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 3/ }).click();
  await completeNewGameSetup(page, 'テスト');

  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 40_000 });
  await page.getByRole('button', { name: 'メニュー' }).click();
  const menuHome = page.locator('.nq-menu-home');
  await expect(menuHome).toBeVisible();
  for (const label of ['がくしゅう', 'まちがい', 'ずかん', 'もちもの・へんせい']) {
    await expect(menuHome.getByRole('button', { name: new RegExp(label) })).toBeVisible();
  }
  for (const card of await menuHome.locator('.nq-menu-card').all()) {
    const cardBox = await card.boundingBox();
    const labelBox = await card.locator('.nq-menu-card-label').boundingBox();
    expect(cardBox).not.toBeNull();
    expect(labelBox).not.toBeNull();
    expect(labelBox!.x).toBeGreaterThanOrEqual(cardBox!.x);
    expect(labelBox!.x + labelBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width);
  }
  const bagLabel = menuHome.locator('.nq-menu-card-party .nq-menu-card-label');
  const bagLabelBox = await bagLabel.boundingBox();
  expect(bagLabelBox).not.toBeNull();
  expect(bagLabelBox!.height).toBeLessThanOrEqual(40);
  await menuHome.getByRole('button', { name: /もちもの・へんせい/ }).focus();
  await page.keyboard.press('ArrowUp');
  await expect(menuHome.getByRole('button', { name: /もちもの・へんせい/ })).toBeFocused();
  await expect(page.getByRole('button', { name: /セーブ/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /ほごしゃ/ })).toBeVisible();
  await page.getByRole('button', { name: /セーブ/ }).click();
  await expect(page.getByText('セーブしたよ')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('menu-home.png') });
  await menuHome.getByRole('button', { name: /がくしゅう/ }).click();
  const roadmap = page.getByRole('region', { name: 'がくしゅうロードマップ' });
  await expect(roadmap).toBeVisible();
  const allSubjects = page.getByRole('button', { name: 'ぜんきょうか' });
  const allSubjectsOverview = page.locator('.nq-roadmap-overview');
  const period = page.locator('.nq-roadmap-period-range');
  await expect(allSubjects).toHaveAttribute('aria-pressed', 'true');
  await expect(allSubjectsOverview).toBeVisible();
  await expect(page.locator('.nq-roadmap-toolbar')).toBeVisible();
  await expect(page.locator('.nq-roadmap-grade-row, .nq-roadmap-term-row')).toHaveCount(0);
  await period.evaluate((input: HTMLInputElement) => {
    input.value = '1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('.nq-roadmap-period-value')).toContainText('1ねん・1がっき');
  await period.evaluate((input: HTMLInputElement) => {
    input.value = '0';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  for (const label of ['こくご', 'さんすう', 'りか', 'しゃかい', 'せいかつ', 'えいご']) {
    await expect(page.getByRole('button', { name: new RegExp(`^${label} `) })).toBeVisible();
  }
  await expect(allSubjectsOverview).toContainText('つぎ：');
  await page.getByRole('button', { name: /^さんすう・いまは/ }).click();
  await expect(roadmap).toContainText('10までのかず');
  const selection = page.locator('.nq-roadmap-selection');
  const currentUnit = page.getByRole('button', { name: '10までのかず' });
  await expect(selection).toContainText('いまの もくひょう');
  await expect(selection).toContainText('10までのかず');
  await expect(currentUnit).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.nq-roadmap-practice')).toBeVisible();
  await expect(page.getByRole('button', { name: /20までの かず/ })).toHaveCount(0);
  const frontier = page.getByRole('button', { name: /ひらく じょうけん 0\/1/ }).first();
  await expect(frontier).toBeEnabled();
  await expect(frontier).toHaveAttribute('aria-label', /0\/1/);
  await frontier.focus();
  await page.keyboard.press('Enter');
  await expect(frontier).toHaveAttribute('aria-pressed', 'true');
  await expect(selection.locator('.nq-roadmap-prerequisites')).toContainText('0/1');
  await expect(selection.locator('.nq-roadmap-prerequisites')).toContainText('まだ');
  await expect(page.locator('.nq-roadmap-practice')).toHaveCount(0);
  const [lockedMapBox, lockedNodeBox, lockedSelectionBox] = await Promise.all([
    page.locator('.nq-roadmap-map').boundingBox(),
    frontier.boundingBox(),
    selection.boundingBox(),
  ]);
  expect(lockedMapBox).not.toBeNull();
  expect(lockedNodeBox).not.toBeNull();
  expect(lockedSelectionBox).not.toBeNull();
  const lockedShellBox = await page.locator('.nq-roadmap-map-shell').boundingBox();
  expect(lockedShellBox).not.toBeNull();
  expect(lockedSelectionBox!.x + lockedSelectionBox!.width).toBeLessThanOrEqual(lockedMapBox!.x);
  expect(Math.abs(lockedSelectionBox!.height - lockedMapBox!.height)).toBeLessThan(2);
  expect(lockedSelectionBox!.width / lockedShellBox!.width).toBeGreaterThan(0.18);
  expect(lockedSelectionBox!.width / lockedShellBox!.width).toBeLessThan(0.23);
  expect(
    Math.abs(lockedNodeBox!.y + lockedNodeBox!.height / 2 - (lockedMapBox!.y + lockedMapBox!.height / 2)),
  ).toBeLessThan(2);
  await page.screenshot({ path: testInfo.outputPath('learning-roadmap-locked-condition.png') });
  await page.locator('.nq-roadmap-reset').click();
  await currentUnit.click();
  await expect(page.locator('.nq-roadmap-practice')).toBeVisible();
  const map = page.locator('.nq-roadmap-map');
  const mapShell = page.locator('.nq-roadmap-map-shell');
  const canvas = page.locator('.nq-roadmap-canvas');
  const zoom = page.locator('.nq-roadmap-zoom-value');
  const reset = page.locator('.nq-roadmap-reset');
  await expect(zoom).toHaveText('100%');
  await page.locator('.nq-roadmap-zoom-in').click();
  await expect(zoom).toHaveText('120%');
  await reset.click();
  await expect(zoom).toHaveText('100%');
  const zoomOut = page.locator('.nq-roadmap-zoom-out');
  for (let step = 0; step < 4; step += 1) await zoomOut.click();
  await expect(zoom).toHaveText('20%');
  await expect(zoomOut).toBeDisabled();
  await expect(mapShell).toHaveAttribute('data-zoom-detail', 'overview');
  await expect(currentUnit.locator('.nq-roadmap-node-name')).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath('learning-roadmap-20-percent.png') });
  await reset.click();
  await expect(mapShell).toHaveAttribute('data-zoom-detail', 'detail');
  const [mapBox, currentNodeBox, selectionBox] = await Promise.all([
    map.boundingBox(),
    page.getByRole('button', { name: '10までのかず' }).boundingBox(),
    selection.boundingBox(),
  ]);
  expect(mapBox).not.toBeNull();
  expect(currentNodeBox).not.toBeNull();
  expect(selectionBox).not.toBeNull();
  expect(
    Math.abs(currentNodeBox!.x + currentNodeBox!.width / 2 - (mapBox!.x + mapBox!.width / 2)),
  ).toBeLessThan(2);
  expect(
    Math.abs(currentNodeBox!.y + currentNodeBox!.height / 2 - (mapBox!.y + mapBox!.height / 2)),
  ).toBeLessThan(2);

  await map.click({ position: { x: 12, y: 12 } });
  await expect(selection).toHaveCount(0);
  const [expandedMapBox, expandedShellBox] = await Promise.all([
    map.boundingBox(),
    mapShell.boundingBox(),
  ]);
  expect(expandedMapBox).not.toBeNull();
  expect(expandedShellBox).not.toBeNull();
  expect(Math.abs(expandedMapBox!.width - expandedShellBox!.width)).toBeLessThan(2);
  await currentUnit.click();
  await expect(selection).toBeVisible();

  const beforeWheel = await canvas.getAttribute('style');
  await map.dispatchEvent('wheel', { deltaX: 32, deltaY: 48 });
  await expect.poll(() => canvas.getAttribute('style')).not.toBe(beforeWheel);
  await map.dispatchEvent('wheel', { ctrlKey: true, deltaY: -20, clientX: 240, clientY: 200 });
  await expect(zoom).toHaveText('110%');
  await reset.click();

  await map.dispatchEvent('pointerdown', {
    pointerId: 1,
    pointerType: 'touch',
    button: 0,
    clientX: 180,
    clientY: 200,
  });
  await map.dispatchEvent('pointerdown', {
    pointerId: 2,
    pointerType: 'touch',
    button: 0,
    clientX: 280,
    clientY: 200,
  });
  await map.dispatchEvent('pointermove', {
    pointerId: 2,
    pointerType: 'touch',
    clientX: 320,
    clientY: 200,
  });
  await expect(zoom).toHaveText('140%');
  await map.dispatchEvent('pointerup', { pointerId: 2, pointerType: 'touch' });
  await map.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch' });
  await reset.click();
  await expect(zoom).toHaveText('100%');
  await page.screenshot({ path: testInfo.outputPath('learning-roadmap-controls.png') });
  await allSubjects.click();
  await expect(allSubjectsOverview).toBeVisible();
  await page.setViewportSize({ width: 640, height: 540 });
  await expect(allSubjects).toBeVisible();
  await expect(allSubjectsOverview).toBeVisible();
  await page.getByRole('button', { name: /もどる/ }).click();
  await expect(menuHome).toBeVisible();
  await menuHome.getByRole('button', { name: /ずかん/ }).click();
  await expect(page.getByRole('button', { name: 'マナビモノ' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'とくさん' })).toBeVisible();
  const dexRegions = page.getByLabel(/^(?:地方|ちほう)ごとの ずかん$/);
  await expect(dexRegions.getByRole('button')).toHaveCount(8);
  const regionBox = await dexRegions.boundingBox();
  expect(regionBox).not.toBeNull();
  expect(regionBox!.height).toBeLessThanOrEqual(36);
  await expect(page.locator('.nq-dex-grid')).toBeVisible();
  const dexCard = page.locator('.nq-dex-grid .nq-opt').first();
  const dexCardBox = await dexCard.boundingBox();
  const dexArtBox = await dexCard.locator('.nq-menu-icon').boundingBox();
  expect(dexCardBox).not.toBeNull();
  expect(dexArtBox).not.toBeNull();
  expect(dexCardBox!.width).toBeGreaterThanOrEqual(140);
  expect(dexArtBox!.height).toBeGreaterThanOrEqual(48);
  await dexRegions.getByRole('button', { name: /東北/ }).click();
  await expect(dexRegions.getByRole('button', { name: /東北/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'とくさん' }).click();
  await expect(page.getByRole('button', { name: /もどる/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /とじる/ })).toBeVisible();
  await page.getByRole('button', { name: /もどる/ }).click();
  await expect(menuHome).toBeVisible();
  await menuHome.getByRole('button', { name: /もちもの・へんせい/ }).click();
  await expect(page.locator('.nq-bag-grid .nq-bag-cell')).toHaveCount(9);
  const heroCell = page.getByRole('button', { name: 'テスト' });
  const bagWindow = page.locator('.nq-wmap-box');
  const openWidth = await bagWindow.evaluate((el) => el.getBoundingClientRect().width);
  await expect(page.locator('.nq-party-info')).toHaveCount(0);
  await heroCell.click();
  await expect(page.locator('.nq-party-info')).toBeVisible();
  await expectEightStatsFit(page);
  await page.setViewportSize({ width: 960, height: 540 });
  await expectEightStatsFit(page);
  await page.screenshot({ path: testInfo.outputPath('bag-stat-labels.png') });
  await page.setViewportSize({ width: 640, height: 540 });
  await heroCell.click();
  await expect(page.locator('.nq-party-info')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /とじる/ })).toBeVisible();
  await expect.poll(() => bagWindow.evaluate((el) => el.getBoundingClientRect().width)).toBe(openWidth);
  await page.screenshot({ path: testInfo.outputPath('bag-details-closed.png') });
  await heroCell.click();
  await expect(page.locator('.nq-party-info')).toBeVisible();
  const storedWeapon = page.locator('.nq-bag-reserve-tile').filter({ hasText: 'れんしゅうの ぼう' });
  await storedWeapon.click();
  await storedWeapon.dragTo(page.locator('.nq-bag-empty[data-drop-slot="weapon"]'));
  const starterWeapon = page.getByRole('button', { name: 'れんしゅうの ぼう' });
  await expect(starterWeapon).toBeVisible();
  await page.locator('.nq-bag-empty').first().click();
  await expect(starterWeapon).toHaveCSS('grid-column-start', '1');
  await page.screenshot({ path: testInfo.outputPath('bag-moved.png') });
  await page.getByRole('button', { name: /とじる/ }).click();
  await expect(menuHome).toBeVisible();
  await page.getByRole('button', { name: /とじる/ }).click();

  await page.reload();
  await expect(page.getByRole('menuitem', { name: 'つづきから' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('menuitem', { name: 'つづきから' }).click();
  await expect(page.getByRole('button', { name: /スロット 3 Lv/ })).toBeVisible();
  await page.getByRole('button', { name: /スロット 3 Lv/ }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 20_000 });
});
