import { expect, test, type Page } from '@playwright/test';
import type Phaser from 'phaser';
import type { BattleState } from '../../src/core/battle/types';
import type { ContentIndex } from '../../src/core/content/loader';

type MenuBattle = Phaser.Scene & {
  state: BattleState;
  content: ContentIndex;
  syncViews(): void;
  showCommands(): void;
};

async function start(page: Page) {
  await page.goto('/?debug=battle');
  await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
  await page.locator('.nq-box').click();
  await expect(page.locator('[data-cmd="skill"]')).toBeVisible();
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

test('縦並びのバトルコマンドは下矢印で次の行を選ぶ', async ({ page }) => {
  test.setTimeout(90_000);
  await start(page);
  await page.locator('[data-cmd="skill"]').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-cmd="item"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-cmd="swap"]')).toBeFocused();
});

for (const viewport of [
  { width: 960, height: 540 },
  { width: 640, height: 360 },
]) {
  test(`道具と交代は名前・所持数・HPを省略せず読める (${viewport.width}px)`, async ({ page }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    await start(page);
    // Save data is untouched: populate only this encounter with actual content definitions.
    await page.evaluate(() => {
      const battle = window.__nq.scene.getScene('Battle') as MenuBattle;
      battle.state.ally.hero.hp = 1;
      const items = [...battle.content.items.values()]
        .filter((item) => item.kind === 'consumable' && item.use?.heal)
        .slice(0, 8);
      battle.state.ally.items = Object.fromEntries(items.map((item) => [item.id, 12]));
      battle.state.ally.monsters = [
        'aomori-nebuta-taisho',
        'aomori-ringoron',
        'aomori-bunakko',
        'aomori-nebutan',
      ].map((id, index) => {
        const monster = battle.content.monsters.get(id)!;
        return {
          ...battle.state.ally.hero,
          id: `menu-${index}`,
          refId: id,
          name: monster.name,
          isHero: false,
          element: monster.element,
          skills: monster.skills,
          hp: index === 2 ? 0 : Math.round(monster.baseStats.hp),
          stats: { ...monster.baseStats, hp: Math.round(monster.baseStats.hp) },
        };
      });
      battle.state.ally.activeMonsterIndex = 0;
      battle.syncViews();
      battle.showCommands();
    });
    for (const menu of ['item', 'swap']) {
      await page.locator(`[data-cmd="${menu}"]`).click();
      const options = page.locator('.nq-menu .nq-opt');
      await expect(options.first()).toBeVisible();
      await page.screenshot({ path: info.outputPath(`${menu}-menu.png`) });
      const grid = await page.locator('.nq-menu-grid').boundingBox();
      const firstRow = await options.first().boundingBox();
      expect.soft(grid!.height).toBeGreaterThanOrEqual(firstRow!.height * 2);
      expect
        .soft(await page.locator('.nq-menu-grid').evaluate((el) => el.scrollWidth <= el.clientWidth))
        .toBe(true);
      const rows = await options.evaluateAll((elements) =>
        elements.map((row) => {
          const name = row.querySelector<HTMLElement>('.nq-opt-name')!;
          return {
            name: name.textContent,
            nameFits: name.scrollWidth <= name.clientWidth,
            rowFits: row.scrollWidth <= row.clientWidth,
            hpWidth: row.querySelector<HTMLElement>('[role="meter"]')?.clientWidth,
            hpText: row.querySelector('.nq-bar-value')?.textContent,
          };
        }),
      );
      for (const row of rows) {
        expect.soft(row.nameFits, row.name ?? '').toBe(true);
        expect.soft(row.rowFits).toBe(true);
        if (menu === 'swap') {
          expect(row.hpWidth).toBeGreaterThanOrEqual(80);
          expect(row.hpText).toMatch(/^\d+\/\d+$/);
        }
      }
      await options.first().hover();
      await page.keyboard.press('ArrowDown');
      await expect.soft(options.nth(1)).toBeFocused();
      // Keep the pointer still over the list: automatic scrolling must not steal keyboard selection.
      for (let index = 2; index < (await options.count()); index++) {
        await page.keyboard.press('ArrowDown');
        await expect(options.nth(index)).toBeFocused();
        if (menu === 'swap' && index === 2) {
          await expect(options.nth(index)).toHaveAttribute('aria-disabled', 'true');
          await page.keyboard.press('Enter');
          await expect(page.locator('.nq-menu-swap')).toBeVisible();
        }
      }
      await expect(options.last()).toBeFocused();
      await expect.soft(options.last()).toBeInViewport();
      if (menu === 'item') {
        const detail = page.locator('.nq-menu-foot-item');
        await detail.focus();
        await page.keyboard.press('ArrowUp');
        await expect(options.last()).toHaveAttribute('aria-current', 'true');
        await expect(detail).toBeFocused();
        expect(await detail.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeGreaterThan(0);
        await detail.press('End');
        await expect.poll(() => detail.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
      }
      if (viewport.width === 960) {
        for (const width of [320, 768, 1024, 1440]) {
          await page.setViewportSize({ width, height: Math.ceil((width * 9) / 16) });
          await expect(options.last()).toBeInViewport();
          expect(await page.locator('.nq-menu-grid').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
            true,
          );
        }
        await page.setViewportSize(viewport);
      }
      await page.getByRole('button', { name: /もどる/ }).click();
      await expect(page.locator('[data-cmd="skill"]')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}
