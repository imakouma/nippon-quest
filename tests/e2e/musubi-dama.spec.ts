import { expect, test, type Page } from '@playwright/test';
import type Phaser from 'phaser';
import type { ActionResult, BattleState } from '../../src/core/battle/types';
import type { ContentIndex } from '../../src/core/content/loader';

type MusubiBattle = Phaser.Scene & {
  state: BattleState;
  content: ContentIndex;
  syncViews(): void;
  showCommands(): void;
  runQuestion(): Promise<ActionResult>;
};

async function start(page: Page): Promise<void> {
  await page.goto('/?debug=battle');
  await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
  await page.locator('.nq-box').click();
  await expect(page.getByRole('menuitem', { name: 'どうぐ' })).toBeVisible();
}

for (const viewport of [
  { width: 960, height: 540 },
  { width: 568, height: 320 },
]) {
  test(`むすび玉の投球と新規図鑑登録 ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    await start(page);
    await page.evaluate(() => {
      const battle = window.__nq.scene.getScene('Battle') as MusubiBattle;
      battle.state.isBossBattle = false;
      battle.state.enemy.isBoss = false;
      battle.state.enemy.hp = 1;
      battle.state.seed = 'capture-check';
      battle.state.rngState = undefined;
      battle.state.ally.hero.stats.spd = 9999;
      battle.state.enemy.stats.spd = 1;
      const game = battle.registry.get('game');
      game.dex.monsters = game.dex.monsters.filter((id: string) => id !== battle.state.enemy.refId);
      battle.state.ally.items = { 'common-musubi-dama': 2 };
      battle.runQuestion = async () => {
        window.__musubiQuestionShown = true;
        return { score: 1, timeMs: 100, attempts: 1 };
      };
      battle.syncViews();
      battle.showCommands();
    });

    await page.getByRole('menuitem', { name: 'どうぐ' }).click();
    const item = page.locator('[data-item="common-musubi-dama"]');
    await expect(item).toBeVisible();
    await expect(item).toHaveAttribute('aria-disabled', 'false');
    await item.click();

    await expect.poll(() => page.evaluate(() => window.__musubiQuestionShown)).toBe(true);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const battle = window.__nq.scene.getScene('Battle') as MusubiBattle;
          return battle.state.ally.items['common-musubi-dama'];
        }),
      )
      .toBe(1);
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const battle = window.__nq.scene.getScene('Battle');
            return battle.children.list.some(
              (child) =>
                (child as Phaser.GameObjects.Image).texture?.key === 'bt.item.musubi-dama' && child.visible,
            );
          }),
        { intervals: [50] },
      )
      .toBe(true);
    await page.waitForTimeout(200);
    await page.screenshot({ path: testInfo.outputPath('musubi-throw.png') });
    await expect(page.locator('.nq-dex-celebration')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.nq-dex-celebration')).toContainText('ずかん');
    await expect(page.locator('.nq-dex-celebration img')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('dex-registration.png') });
    await expect(page.locator('.nq-dex-celebration')).toBeVisible();
    const card = await page.locator('.nq-dex-celebration-card').boundingBox();
    expect(card).not.toBeNull();
    expect(card!.x).toBeGreaterThanOrEqual(0);
    expect(card!.y).toBeGreaterThanOrEqual(0);
    expect(card!.x + card!.width).toBeLessThanOrEqual(viewport.width);
    expect(card!.y + card!.height).toBeLessThanOrEqual(viewport.height);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const battle = window.__nq.scene.getScene('Battle') as MusubiBattle;
          return battle.registry.get('game').dex.monsters.includes(battle.state.enemy.refId);
        }),
      )
      .toBe(true);
  });
}

declare global {
  interface Window {
    __musubiQuestionShown?: boolean;
  }
}
