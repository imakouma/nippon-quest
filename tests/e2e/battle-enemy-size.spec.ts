import { expect, test } from '@playwright/test';
import type Phaser from 'phaser';
import type { PixelBounds } from '../../src/rendering/monsterImageScale';

type Battle = Phaser.Scene & {
  enemySprite: Phaser.GameObjects.Image;
  layout: { enemy: { y: number } };
};

const cases = [
  { id: 'kanagawa-pichirasu', heightCm: 10, target: 60 },
  { id: 'yamanashi-suzurin', heightCm: 32, target: 60 },
  { id: 'yamanashi-suzuri-tatsujin', heightCm: 120, target: 96 * Math.sqrt(1.2) },
  { id: 'yamanashi-boss-suisho-ryu', heightCm: 350, target: 96 * Math.sqrt(3.5) },
  { id: 'toyama-boss-tateyama-ou', heightCm: 580, target: 188 },
] as const;

for (const viewport of [
  { width: 960, height: 540 },
  { width: 640, height: 360 },
]) {
  test(`設定身長を視認可能な敵サイズへ圧縮する ${viewport.width}x${viewport.height}`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(240_000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    const observed: { id: string; heightCm: number; bodyHeight: number }[] = [];
    for (const expected of cases) {
      await page.goto(`/?debug=battle&enemy=${expected.id}&lv=5`);
      await page.waitForFunction(() => window.__nq?.scene.isActive('Battle'), undefined, {
        timeout: 60_000,
      });
      const body = await page.evaluate(() => {
        const battle = window.__nq.scene.getScene('Battle') as Battle;
        const sprite = battle.enemySprite;
        const bounds = sprite.getData('visibleBodyBounds') as PixelBounds;
        const targetBodyHeight = sprite.getData('targetBodyHeight') as number;
        const bodyHeightCm = sprite.getData('bodyHeightCm') as number;
        const frameHeight = sprite.height;
        const visibleTop = sprite.y + (bounds.y - sprite.originY * frameHeight) * sprite.scaleY;
        const visibleFoot =
          sprite.y + (bounds.y + bounds.height - sprite.originY * frameHeight) * sprite.scaleY;
        const canvas = window.__nq.canvas;
        const screenScale = canvas.getBoundingClientRect().width / canvas.width;
        return {
          bodyHeightCm,
          targetBodyHeight,
          renderedBodyHeight: bounds.height * sprite.scaleY,
          screenBodyHeight: bounds.height * sprite.scaleY * screenScale,
          visibleTop,
          visibleFoot,
          groundY: battle.layout.enemy.y,
        };
      });

      expect(body.bodyHeightCm).toBe(expected.heightCm);
      expect(body.targetBodyHeight).toBeCloseTo(expected.target, 1);
      expect(body.renderedBodyHeight).toBeCloseTo(body.targetBodyHeight, 3);
      expect(body.screenBodyHeight).toBeGreaterThanOrEqual(viewport.width === 640 ? 40 : 60);
      expect(body.visibleFoot).toBeCloseTo(body.groundY, 3);
      expect(body.visibleTop).toBeGreaterThanOrEqual(90);
      observed.push({ id: expected.id, heightCm: body.bodyHeightCm, bodyHeight: body.renderedBodyHeight });
    }

    for (let index = 1; index < observed.length; index += 1) {
      expect(observed[index].bodyHeight).toBeGreaterThanOrEqual(observed[index - 1].bodyHeight - 0.001);
    }
    expect(observed.find(({ id }) => id === 'yamanashi-suzuri-tatsujin')!.bodyHeight).toBeGreaterThan(
      observed.find(({ id }) => id === 'yamanashi-suzurin')!.bodyHeight * 1.7,
    );
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('largest-enemy.png') });
  });
}
