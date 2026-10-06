import { expect, test } from '@playwright/test';

test('主人公の見た目が枠内に収まり、髪・肌・服の変更が反映される', async ({ page }) => {
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: '♥ はじめから' }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();

  const preview = page.locator('.nq-look-preview');
  const avatar = page.locator('.nq-avatar-preview');
  await expect(avatar).toBeVisible();

  const bounds = await Promise.all([preview.boundingBox(), avatar.boundingBox()]);
  expect(bounds[0]).not.toBeNull();
  expect(bounds[1]).not.toBeNull();
  expect(bounds[1]!.x).toBeGreaterThanOrEqual(bounds[0]!.x);
  expect(bounds[1]!.y).toBeGreaterThanOrEqual(bounds[0]!.y);
  expect(bounds[1]!.x + bounds[1]!.width).toBeLessThanOrEqual(bounds[0]!.x + bounds[0]!.width);
  expect(bounds[1]!.y + bounds[1]!.height).toBeLessThanOrEqual(bounds[0]!.y + bounds[0]!.height);

  const image = () => avatar.evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL());
  const initial = await image();

  await page.getByRole('button', { name: 'かみを ひとつ すすめる' }).click();
  await expect.poll(image).not.toBe(initial);
  const hairChanged = await image();

  await page.getByRole('button', { name: 'はだを ひとつ すすめる' }).click();
  await expect.poll(image).not.toBe(hairChanged);
  const skinChanged = await image();

  await page.getByRole('button', { name: 'ふくを ひとつ すすめる' }).click();
  await expect.poll(image).not.toBe(skinChanged);
});
