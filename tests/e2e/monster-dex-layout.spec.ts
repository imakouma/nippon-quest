import { expect, test } from '@playwright/test';
import type { GameState } from '../../src/core/state/schema';
import { chooseStoryCompanion } from '../../src/core/progression/storyCompanion';
import { completeNewGameSetup } from './newGame';

test('モンスター図鑑は捕獲後も番号だけの6列で、上下キーも同じ列を移動する', async ({ page }, info) => {
  test.setTimeout(120_000);
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page, '図鑑確認');
  const game = await page.evaluate(() => window.__nq.registry.get('game') as GameState);
  await page.evaluate(
    (stateJson) => {
      window.__nq.registry.set('game', JSON.parse(stateJson));
    },
    JSON.stringify(chooseStoryCompanion(game, 'iwate-kagurabi')),
  );
  await page.getByRole('button', { name: 'メニュー', exact: true }).click();
  await page.getByRole('button', { name: 'ずかん', exact: true }).click();
  const regions = page.getByLabel(/^(?:地方|ちほう)ごとの ずかん$/);
  await regions.getByRole('button', { name: /東北/ }).click();
  const grid = page.locator('.nq-dex-monsters');
  const cards = grid.locator('[data-menu-entry]');
  const owned = grid.getByRole('button', { name: /なかま/ });
  await expect(owned).toHaveCount(1);
  await expect(owned).not.toHaveClass(/nq-menu-unknown/);
  await expect(owned.locator('.nq-opt-name')).toHaveText(/^No\.\d{3}$/);
  await expect(grid.locator('.nq-menu-unknown').first().locator('.nq-opt-name')).toHaveText(/^No\.\d{3}$/);
  await expect(grid.locator('.nq-party-tag')).toHaveCount(0);
  await owned.click();
  await expect(page.locator('.nq-dex-info .nq-party-name')).not.toHaveText('？？？');
  const ownedNumber = await owned.locator('.nq-opt-name').textContent();

  for (const width of [960, 640]) {
    await page.setViewportSize({ width, height: (width * 9) / 16 });
    await cards.first().click();
    await expect(cards.first()).toBeFocused();
    const boxes = await Promise.all(Array.from({ length: 7 }, (_, i) => cards.nth(i).boundingBox()));
    for (const box of boxes.slice(0, 6)) expect(box!.y).toBeCloseTo(boxes[0]!.y, 0);
    expect(boxes[5]!.x).toBeGreaterThan(boxes[4]!.x);
    expect(boxes[6]!.x).toBeCloseTo(boxes[0]!.x, 0);
    expect(boxes[6]!.y).toBeGreaterThan(boxes[0]!.y);
    await page.keyboard.press('ArrowDown');
    await expect(cards.nth(6)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(cards.first()).toBeFocused();
    await expect(grid.locator('.nq-focus')).toHaveCount(1);
    expect(await cards.first().evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    const number = cards.first().locator('.nq-opt-name');
    expect(await number.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`monster-dex-${width}.png`) });
  }
  await regions.getByRole('button', { name: /北海道/ }).click();
  await regions.getByRole('button', { name: /東北/ }).click();
  await expect(owned.locator('.nq-opt-name')).toHaveText(ownedNumber!);
  await page.getByRole('button', { name: 'とくさん', exact: true }).click();
  await expect(page.locator('.nq-dex-monsters')).toHaveCount(0);
  await expect(page.locator('.nq-dex-grid')).toBeVisible();
});
