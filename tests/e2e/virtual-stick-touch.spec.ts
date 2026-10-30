import { expect, test } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

for (const viewport of [
  { width: 844, height: 390 },
  { width: 667, height: 375 },
]) {
  test.describe(`タッチ移動 ${viewport.width}`, () => {
    test.use({ hasTouch: true, isMobile: true, viewport });
    test('中央は静止し、4方向へ動き、指を離すと止まる', async ({ page, context }, info) => {
      test.setTimeout(120_000);
      await page.goto('/');
      await page.getByRole('menuitem', { name: /はじめから/ }).tap();
      await page.getByRole('button', { name: /スロット 1/ }).tap();
      await completeNewGameSetup(page);
      const skip = page.getByRole('button', { name: 'スキップ', exact: true });
      if (await skip.isVisible()) await skip.tap();
      const stick = page.getByRole('group', { name: 'いどうスティック' });
      await expect(stick).toBeVisible({ timeout: 40_000 });
      // 導入会話中は移動がロックされる。会話を終えてから操作を検証する。
      await page.waitForTimeout(3000);
      for (let i = 0; i < 20 && (await page.getByRole('dialog').isVisible()); i++) {
        await page.getByRole('dialog').tap({ position: { x: 180, y: 60 } });
        await page.waitForTimeout(250);
      }
      await expect(page.getByRole('dialog')).toHaveCount(0);
      const canvas = page.locator('#game-root canvas');
      const position = async () => (await canvas.getAttribute('data-player-tile'))!;
      const cdp = await context.newCDPSession(page);
      const box = (await stick.boundingBox())!;
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      const start = () =>
        cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
      const end = () => cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const initial = await position();
      await start();
      await page.waitForTimeout(600);
      await end();
      await page.waitForTimeout(400);
      expect(await position()).toBe(initial);
      for (const [dx, dy] of [
        [0, 30],
        [30, 0],
        [0, -30],
        [-30, 0],
      ] as const) {
        const before = await position();
        await start();
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: x + dx, y: y + dy, id: 1 }],
        });
        await expect(stick).toHaveClass(/is-active/);
        await expect.poll(position, { intervals: [20], timeout: 5000 }).not.toBe(before);
        await end();
        await page.waitForTimeout(350);
        const after = await position();
        const [bx, by] = before.split(',').map(Number);
        const [ax, ay] = after.split(',').map(Number);
        expect(Math.sign(ax! - bx!)).toBe(Math.sign(dx));
        expect(Math.sign(ay! - by!)).toBe(Math.sign(dy));
        await page.waitForTimeout(650);
        expect(await position()).toBe(after);
        await expect(stick).not.toHaveClass(/is-active/);
      }
      await page.screenshot({ path: info.outputPath('touch-field.png') });
    });
  });
}
