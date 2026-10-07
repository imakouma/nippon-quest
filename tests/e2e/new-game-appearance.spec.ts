import { expect, test } from '@playwright/test';

test('物語で初めて名前と見た目を決め、選択が反映される', async ({ page }) => {
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: '♥ はじめから' }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await page.getByRole('button', { name: 'はじめる' }).click();

  const dialogue = page.locator('.nq-dlg');
  const identity = page.getByRole('form', { name: 'ようせいとの であい' });
  await expect(dialogue.or(identity)).toBeVisible({ timeout: 30_000 });
  for (let step = 0; step < 20 && !(await identity.isVisible()); step += 1) {
    await page.keyboard.press('Enter');
  }

  await expect(identity).toBeVisible();
  const preview = page.locator('.nq-avatar-stage');
  const avatar = page.getByRole('img', { name: 'しゅじんこうの みため' });
  await expect(avatar).toBeVisible();

  const bounds = await Promise.all([preview.boundingBox(), avatar.boundingBox()]);
  expect(bounds[0]).not.toBeNull();
  expect(bounds[1]).not.toBeNull();
  expect(bounds[1]!.x).toBeGreaterThanOrEqual(bounds[0]!.x);
  expect(bounds[1]!.y).toBeGreaterThanOrEqual(bounds[0]!.y);
  expect(bounds[1]!.x + bounds[1]!.width).toBeLessThanOrEqual(bounds[0]!.x + bounds[0]!.width);
  expect(bounds[1]!.y + bounds[1]!.height).toBeLessThanOrEqual(bounds[0]!.y + bounds[0]!.height);

  const classes = () => avatar.getAttribute('class');
  const initial = await classes();

  await page.getByRole('button', { name: 'かみ 2' }).click();
  await expect.poll(classes).not.toBe(initial);
  const hairChanged = await classes();

  await page.getByRole('button', { name: 'はだ 2' }).click();
  await expect.poll(classes).not.toBe(hairChanged);
  const skinChanged = await classes();

  await page.getByRole('button', { name: 'ふく 2' }).click();
  await expect.poll(classes).not.toBe(skinChanged);

  await page.getByRole('textbox', { name: 'なまえ' }).fill('ハル');
  await page.getByRole('button', { name: 'これが わたし' }).click();

  let introducedAomori = false;
  for (let step = 0; step < 20 && (await dialogue.isVisible()); step += 1) {
    await expect(dialogue).not.toContainText('{area}');
    if ((await dialogue.textContent())?.includes('青森県')) {
      introducedAomori = true;
      break;
    }
    await page.keyboard.press('Enter');
  }
  expect(introducedAomori).toBe(true);
});
