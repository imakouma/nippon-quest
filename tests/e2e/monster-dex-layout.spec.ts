import { expect, test } from '@playwright/test';
import type { GameState } from '../../src/core/state/schema';
import { chooseStoryCompanion } from '../../src/core/progression/storyCompanion';
import { completeNewGameSetup } from './newGame';

for (const tab of ['マナビモノ', 'とくさん']) {
  test(`${tab}図鑑は右に記録を表示し、閉じると6列に戻る`, async ({ page }, info) => {
    test.setTimeout(120_000);
    await page.goto('/?resetSaves=1');
    await page.getByRole('menuitem', { name: /はじめから/ }).click();
    await page.getByRole('button', { name: /スロット 1/ }).click();
    await completeNewGameSetup(page, '図鑑確認');
    const game = await page.evaluate(() => window.__nq.registry.get('game') as GameState);
    game.dex.items.push('aomori-ringo');
    await page.evaluate(
      (stateJson) => {
        window.__nq.registry.set('game', JSON.parse(stateJson));
      },
      JSON.stringify(chooseStoryCompanion(game, 'iwate-kagurabi')),
    );
    await page.getByRole('button', { name: 'メニュー', exact: true }).click();
    await page.getByRole('button', { name: 'ずかん', exact: true }).click();
    await page.getByRole('button', { name: tab, exact: true }).click();
    const regions = page.getByLabel(/^(?:地方|ちほう)ごとの ずかん$/);
    await regions.getByRole('button', { name: /東北/ }).click();
    const grid = page.locator('.nq-dex-numbered');
    const cards = grid.locator('[data-menu-entry]');
    const owned = grid.getByRole('button', { name: tab === 'マナビモノ' ? /なかま/ : /りんご/ });
    await expect(owned).toHaveCount(1);
    await expect(owned).not.toHaveClass(/nq-menu-unknown/);
    await expect(owned.locator('.nq-dex-card-number')).toHaveText(/^No\.\d{3}$/);
    await expect(grid.locator('.nq-menu-unknown').first().locator('.nq-opt-name')).toHaveText('？？？');
    await expect(grid.locator('.nq-party-tag')).toHaveCount(0);
    const detail = page.locator('.nq-dex-info');
    await expect(detail).toHaveCount(0);
    await owned.click();
    await expect(detail.locator('.nq-party-name')).not.toHaveText('？？？');
    const panelBox = await detail.boundingBox();
    const gridBox = await grid.boundingBox();
    expect(panelBox!.x).toBeGreaterThanOrEqual(gridBox!.x + gridBox!.width);
    await page.screenshot({ path: info.outputPath(`dex-${tab}-record.png`) });
    await owned.click();
    await expect(detail).toHaveCount(0);
    await owned.click();
    await page.locator('.nq-menu-title').click();
    await expect(detail).toHaveCount(0);
    const ownedNumber = await owned.locator('.nq-dex-card-number').textContent();

    for (const width of [960, 640]) {
      await page.setViewportSize({ width, height: (width * 9) / 16 });
      await cards.first().click();
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
      const number = cards.first().locator('.nq-dex-card-number');
      expect(await number.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      await page.screenshot({ path: info.outputPath(`dex-${tab}-${width}.png`) });
    }
    await regions.getByRole('button', { name: /北海道/ }).click();
    await regions.getByRole('button', { name: /東北/ }).click();
    await expect(owned.locator('.nq-dex-card-number')).toHaveText(ownedNumber!);
    const numbers = await cards.locator('.nq-dex-card-number').allTextContents();
    expect(new Set(numbers).size).toBe(numbers.length);
  });
}
