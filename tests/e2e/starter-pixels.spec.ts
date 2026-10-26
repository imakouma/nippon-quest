import { expect, test } from '@playwright/test';
import type Phaser from 'phaser';

for (const id of ['iwate-kagurabi', 'iwate-izumiko', 'iwate-kodamaru']) {
  test(`${id}: 採用PNGを戦闘で表示し、既存の大きさを保つ`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.url().includes('/assets/sprites/monsters/') && !response.ok())
        errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(`/?debug=battle&enemy=${id}&lv=1`);
    await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
    const image = await page.evaluate((monsterId) => {
      // ローカル検証用APIで、実際に描画されたテクスチャを確認する。
      const game = (window as unknown as { __nq: Phaser.Game }).__nq;
      const battle = game.scene.getScene('Battle');
      const sprite = battle.children.list.find(
        (child) =>
          'texture' in child && (child as Phaser.GameObjects.Image).texture.key === `mon.${monsterId}`,
      ) as Phaser.GameObjects.Image;
      const source = sprite.texture.getSourceImage() as HTMLImageElement;
      return { url: source.src, width: sprite.displayWidth, height: sprite.displayHeight };
    }, id);
    expect(image.url).toContain(`/assets/sprites/monsters/${id}.png`);
    expect(Math.max(image.width, image.height)).toBeCloseTo(96);
    await page.screenshot({ path: testInfo.outputPath(`${id}-desktop.png`) });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('.nq-box-next')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`${id}-mobile.png`) });
    expect(errors).toEqual([]);
  });
}
