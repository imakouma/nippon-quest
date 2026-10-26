import { expect, test, type Locator } from '@playwright/test';

function overlaps(a: NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>, b: typeof a): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

test('button and keyboard routes activate the same current action once', async ({ page }) => {
  await page.goto('/context-action-audit.html');
  const action = page.getByRole('button', { name: '話す' });
  const count = page.locator('#activation-count');

  await action.click();
  await expect(count).toHaveText('1');
  await action.press('Enter');
  await expect(count).toHaveText('2');
  await action.press('Space');
  await expect(count).toHaveText('3');
  await action.press('z');
  await expect(count).toHaveText('4');

  await page.locator('#audit-ground').focus();
  for (const key of ['Enter', 'Space', 'z']) await page.keyboard.press(key);
  await expect(count).toHaveText('7');
});

for (const lock of ['moving', 'turning', 'bumping', 'busy', 'inBattle', 'overlayOwnsInput']) {
  test(`action is absent while ${lock} owns field input`, async ({ page }) => {
    await page.goto(`/context-action-audit.html?lock=${lock}`);

    await expect(page.locator('.nq-context-action')).toHaveCount(0);
  });
}

for (const viewport of [
  { width: 320, height: 540 },
  { width: 960, height: 540 },
]) {
  test(`action stays touch-friendly and clear of field controls at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/context-action-audit.html?target=chest');
    const action = page.getByRole('button', { name: '開ける' });
    const actionBox = await action.boundingBox();
    expect(actionBox).not.toBeNull();
    expect(actionBox!.width).toBeGreaterThanOrEqual(48);
    expect(actionBox!.height).toBeGreaterThanOrEqual(48);
    expect(actionBox!.x).toBeGreaterThanOrEqual(0);
    expect(actionBox!.y).toBeGreaterThanOrEqual(0);
    expect(actionBox!.x + actionBox!.width).toBeLessThanOrEqual(viewport.width);
    expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(viewport.height);

    for (const control of await page.locator('[data-required-control]').all()) {
      const controlBox = await control.boundingBox();
      expect(controlBox).not.toBeNull();
      expect(overlaps(actionBox!, controlBox!)).toBe(false);
    }
  });
}
