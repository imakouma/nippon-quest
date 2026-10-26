import { expect, test } from '@playwright/test';
import type Phaser from 'phaser';

for (const id of ['iwate-kagurabi', 'iwate-izumiko', 'iwate-kodamaru']) {
  test(`${id}: 採用PNGを戦闘で表示し、既存の大きさを保つ`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    const loaded: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.url().endsWith(`/assets/sprites/monsters/${id}.png`) && response.ok())
        loaded.push(response.url());
      if (response.url().includes('/assets/sprites/monsters/') && !response.ok())
        errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(`/?debug=battle&enemy=${id}&lv=1`);
    await expect(page.locator('.nq-box-text')).toBeVisible({ timeout: 60_000 });
    const image = await page.evaluate((monsterId) => {
      // ローカル検証用APIで、実際に描画されたテクスチャを確認する。
      const game = (window as unknown as { __nq: Phaser.Game }).__nq;
      const battle = game.scene.getScene('Battle');
      const sprite = battle.children.list.find(
        (child) =>
          'texture' in child && (child as Phaser.GameObjects.Image).texture.key === `mon.${monsterId}`,
      ) as Phaser.GameObjects.Image;
      const source = sprite.texture.getSourceImage() as HTMLImageElement;
      return { sourceWidth: source.naturalWidth, width: sprite.displayWidth, height: sprite.displayHeight };
    }, id);
    expect(loaded).toHaveLength(1);
    expect(image.sourceWidth).toBeGreaterThan(32);
    expect(Math.max(image.width, image.height)).toBeGreaterThanOrEqual(90);
    expect(Math.max(image.width, image.height)).toBeLessThanOrEqual(96.01);
    // 待機の呼吸アニメーションでも元の論理倍率へ戻って巨大化しない。
    await page.waitForTimeout(1100);
    const idleHeight = await page.evaluate((monsterId) => {
      const game = (window as unknown as { __nq: Phaser.Game }).__nq;
      const battle = game.scene.getScene('Battle');
      const sprite = battle.children.list.find(
        (child) =>
          'texture' in child && (child as Phaser.GameObjects.Image).texture.key === `mon.${monsterId}`,
      ) as Phaser.GameObjects.Image;
      return sprite.displayHeight;
    }, id);
    expect(idleHeight).toBeLessThanOrEqual(96.01);
    await page.screenshot({ path: testInfo.outputPath(`${id}-desktop.png`) });
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.locator('.nq-box-text')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`${id}-mobile.png`) });
    expect(errors).toEqual([]);
  });
}
