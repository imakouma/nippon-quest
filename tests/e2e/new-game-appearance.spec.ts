import { expect, test } from '@playwright/test';

test('旅立ち前に見た目を選び、物語の中で名前を決められる', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();

  const setup = page.getByRole('dialog', { name: 'たびの じゅんび' });
  const avatar = setup.getByRole('img', { name: 'しゅじんこうの みため' });
  await expect(avatar).toBeVisible();
  const start = setup.getByRole('button', { name: 'はじめる' });
  await expect(setup.getByRole('combobox', { name: /がくねん/ })).toHaveValue('1');
  await expect(start).toBeEnabled();
  await expect(setup.getByText('えらんでね')).toHaveCount(0);
  for (const label of ['かみ 2', 'はだ 2', 'ふく 2', 'かみがた 2', 'め 2']) {
    const choice = setup.getByRole('button', { name: label });
    await choice.click();
    await expect(choice).toHaveAttribute('aria-pressed', 'true');
  }

  await start.click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.nq-fhud-controls')).toHaveCount(0);
  await page
    .getByRole('dialog', { name: 'ものがたりの シーン' })
    .getByRole('button', { name: 'スキップ' })
    .click();

  const namePrompt = page.getByRole('dialog', { name: /ものがたり.*(?:名前|なまえ)/ });
  await expect(namePrompt).toBeVisible({ timeout: 30_000 });
  await expect(namePrompt).toHaveAttribute('aria-modal', 'true');
  const name = namePrompt.getByRole('textbox', { name: 'なまえ' });
  await expect(name).toBeFocused();
  const decide = namePrompt.getByRole('button', { name: 'これで けってい' });
  await expect(decide).toBeDisabled();
  await expect(namePrompt.locator('.nq-story-name-hint')).toContainText('なまえを いれると');
  await name.fill('ハル');
  await expect(decide).toBeEnabled();
  await expect(namePrompt.locator('.nq-story-name-hint')).toHaveCount(0);
  await decide.click();
  await expect(page.getByRole('dialog', { name: 'ものがたりの シーン' })).toContainText('ハル');
});
