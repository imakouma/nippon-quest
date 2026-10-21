import { expect, test } from '@playwright/test';

for (const viewport of [
  { width: 960, height: 540, cost: 100 },
  { width: 640, height: 360, cost: 100 },
  { width: 960, height: 540, cost: 50 },
]) {
  test(`技一覧は必要ゲージ数・量を表示してアイコンを揃える (${viewport.width}px・${viewport.cost})`, async ({
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
    const burst = page.locator('[data-skill="sk-burst-sansu"]');
    await expect(burst.locator('.nq-opt-cost-value')).toHaveText(String(viewport.cost));
    await expect(burst.locator('.nq-opt-cost')).toHaveAttribute(
      'aria-label',
      `ひつようゲージ ${viewport.cost}`,
    );
    await expect(burst).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('[data-skill="sk-tashizan-giri"] .nq-opt-charge')).toHaveText('チャージ');
    for (const value of await page.locator('.nq-opt-cost-value').allTextContents()) {
      expect(value.trim()).toMatch(/^\d+$/);
    }
    const fill = await burst.locator('.nq-opt-costbar > i').evaluate((element) => {
      const track = element.parentElement!;
      return element.clientWidth / track.clientWidth;
    });
    expect.soft(fill).toBeCloseTo(viewport.cost / 100, 2);
    const normal = page.locator('[data-skill="sk-tashizan-giri"]');
    const normalRow = await normal.boundingBox();
    const burstRow = await burst.boundingBox();
    const normalIcon = await normal.locator('.nq-opt-side > .nq-picon').boundingBox();
    const burstIcon = await burst.locator('.nq-opt-side > .nq-picon').boundingBox();
    expect.soft(normalIcon!.x - normalRow!.x).toBeCloseTo(burstIcon!.x - burstRow!.x, 0);
    const charge = await normal.locator('.nq-opt-charge').boundingBox();
    const costbar = await burst.locator('.nq-opt-costbar').boundingBox();
    expect.soft(charge!.x - normalRow!.x).toBeCloseTo(costbar!.x - burstRow!.x, 0);
    await page.screenshot({ path: info.outputPath('skill-gauge-cost.png') });
    expect(errors).toEqual([]);
  });
}
