import { expect, test } from '@playwright/test';
import type { ContentIndex } from '../../src/core/content/loader';
import type { BattleDeps } from '../../src/core/battle/dependencies';

for (const viewport of [
  { width: 960, height: 540, cost: 100 },
  { width: 640, height: 360, cost: 100 },
  { width: 960, height: 540, cost: 50 },
]) {
  test(`技一覧は必要ゲージ数・量を表示して教科アイコンを揃える (${viewport.width}px・${viewport.cost})`, async ({
    page,
  }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    if (viewport.cost !== 100) {
      await page.route(/\/content\/(?:content-bundle|skills)\.json$/, async (route) => {
        const response = await route.fetch();
        const data = await response.json();
        const skills = (Array.isArray(data) ? data : data['skills.json']) as {
          id: string;
          costGauge: number;
        }[];
        const skill = skills.find((skill) => skill.id === 'sk-burst-sansu');
        expect(skill).toBeDefined();
        skill!.costGauge = viewport.cost;
        await route.fulfill({ response, json: data });
      });
    }
    await page.goto('/?debug=battle');
    await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
    await page.locator('.nq-box').click();
    await page.locator('.nq-cmd[data-cmd="skill"]').click();
    const normal = page.locator('[data-skill="sk-tashizan-giri"]');
    await expect(normal.locator('.nq-opt-charge')).toHaveCount(0);
    await page.locator('.nq-skill-details-toggle').click();
    await expect(page.locator('#nq-skill-details .nq-opt-charge')).toHaveText('10〜40チャージ');
    await page.keyboard.press('q');
    await expect(page.locator('.nq-opt-charge')).toHaveCount(0);
    await expect(normal.locator('.nq-opt-side')).toHaveCount(0);
    const normalRow = await normal.boundingBox();
    const normalIcon = await normal.locator(':scope > .nq-picon').boundingBox();
    await page.locator('[data-charge-toggle]').click();
    const burst = page.locator('[data-skill="sk-burst-sansu"]');
    await expect(burst.locator('.nq-opt-cost-value')).toHaveText(String(viewport.cost));
    await expect(burst.locator('.nq-opt-cost')).toHaveAttribute(
      'aria-label',
      `ひつようゲージ ${viewport.cost}`,
    );
    await expect(burst).toHaveAttribute('aria-disabled', 'true');
    for (const value of await page.locator('.nq-opt-cost-value').allTextContents()) {
      expect(value.trim()).toMatch(/^\d+$/);
    }
    const fill = await burst.locator('.nq-opt-costbar > i').evaluate((element) => {
      const track = element.parentElement!;
      return element.clientWidth / track.clientWidth;
    });
    expect.soft(fill).toBeCloseTo(viewport.cost / 100, 2);
    const burstRow = await burst.boundingBox();
    const burstIcon = await burst.locator(':scope > .nq-picon').boundingBox();
    expect.soft(normalIcon!.x - normalRow!.x).toBeCloseTo(burstIcon!.x - burstRow!.x, 0);
    const costbar = await burst.locator('.nq-opt-costbar').boundingBox();
    expect.soft(costbar!.x).toBeGreaterThanOrEqual(burstIcon!.x + burstIcon!.width);
    expect.soft(costbar!.x + costbar!.width).toBeLessThanOrEqual(burstRow!.x + burstRow!.width);
    await page.screenshot({ path: info.outputPath('skill-gauge-cost.png') });
    expect(errors).toEqual([]);
  });
}

test('算数バーストの戦闘威力は設定学年に応じて変わる', async ({ page }, info) => {
  for (const { grade, power } of [
    { grade: 1, power: 80 },
    { grade: 6, power: 490 },
  ]) {
    await page.goto(`/?debug=battle&grade=${grade}&resetSaves=1`);
    await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
    await page.locator('.nq-box').click();
    await page.locator('.nq-cmd[data-cmd="skill"]').click();
    await page.locator('[data-charge-toggle]').click();
    await expect(page.locator('[data-skill="sk-burst-sansu"]')).toBeVisible();
    const observed = await page.evaluate(() => {
      const battle = window.__nq.scene.getScene('Battle') as Phaser.Scene & {
        content: ContentIndex;
        deps: BattleDeps;
      };
      return battle.deps.heroSkill!(battle.content.skills.get('sk-burst-sansu')!).power;
    });
    expect(observed).toBe(power);
    await page.screenshot({ path: info.outputPath(`burst-grade-${grade}.png`) });
  }
});
