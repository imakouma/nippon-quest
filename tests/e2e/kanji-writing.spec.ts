import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

test.use({ baseURL: `http://127.0.0.1:${process.env.E2E_PORT ?? 4174}` });
const data: { characters: Record<string, { points: { x: number; y: number }[] }[]> } = JSON.parse(
  readFileSync(new URL('../../content/kanji/grade-one-strokes.json', import.meta.url), 'utf8'),
);

async function draw(page: Page, strokes: { x: number; y: number }[][]) {
  const canvas = page.locator('.nq-kt-canvas');
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  for (const stroke of strokes) {
    await page.mouse.move(box.x + stroke[0]!.x * box.width, box.y + stroke[0]!.y * box.height);
    await page.mouse.down();
    for (const point of stroke.filter((_, i) => i > 0 && (i % 4 === 0 || i === stroke.length - 1)))
      await page.mouse.move(box.x + point.x * box.width, box.y + point.y * box.height);
    await page.mouse.up();
  }
  await page.getByRole('button', { name: 'できた！', exact: true }).click();
}

test('一年生の音: 筆順違いを伝え、消して正しく書くと100%', async ({ page }) => {
  await page.goto('/playground.html?q=kokugo.g1.kanji-writing.0006');
  await expect(page.getByRole('heading', { name: '問題レビュー', exact: true })).toBeVisible();
  const strokes = data.characters['音']!.map((s) => s.points);
  await draw(page, [strokes[1]!, strokes[0]!, ...strokes.slice(2)]);
  await expect(page.getByRole('status')).toContainText('おしい！');
  await page.locator('.pg-preview').screenshot({ path: 'test-results/kanji-order-desktop.png' });
  await expect(page.locator('.nq-kt-canvas')).toBeVisible();
  await page.getByRole('button', { name: 'けす', exact: true }).click();
  await draw(page, strokes);
  await expect(page.locator('.pg-result-summary')).toContainText('100%', { timeout: 10000 });
  await expect(page.locator('.pg-result-summary')).toContainText('2');
});

test('一年生の一: 逆方向を検出し、細い線で再挑戦できる', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/playground.html?q=kokugo.g1.kanji-writing.0001');
  const strokes = data.characters['一']!.map((s) => s.points);
  await draw(
    page,
    strokes.map((s) => [...s].reverse()),
  );
  await expect(page.getByRole('status')).toContainText(/向|むき/);
  await page.screenshot({ path: 'test-results/kanji-direction-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'けす', exact: true }).click();
  await draw(page, strokes);
  await expect(page.locator('.pg-result-summary')).toContainText('100%', { timeout: 10000 });
  await expect(page.locator('.pg-result-summary')).toContainText('2');
});

for (const pressure of [0.02, 1]) {
  test(`模擬ペン入力: 筆圧${pressure}でも一を判定できる`, async ({ page }) => {
    await page.goto('/playground.html?q=kokugo.g1.kanji-writing.0001');
    const canvas = page.locator('.nq-kt-canvas');
    await canvas.scrollIntoViewIfNeeded();
    const box = (await canvas.boundingBox())!;
    await canvas.evaluate((element) =>
      element.addEventListener('pointerdown', (event) => {
        if (!(event instanceof PointerEvent)) return;
        element.dataset.pointerType = event.pointerType;
        element.dataset.pressure = String(event.pressure);
      }),
    );
    const pen = await page.context().newCDPSession(page);
    const points = data.characters['一']![0]!.points.filter((_, i) => i % 4 === 0 || i === 63);
    const position = (point: { x: number; y: number }) => ({
      x: box.x + point.x * box.width,
      y: box.y + point.y * box.height,
    });
    try {
      await pen.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        ...position(points[0]!),
        pointerType: 'pen',
        button: 'none',
        buttons: 0,
        force: 0,
      });
      await expect(page.getByRole('button', { name: 'けす', exact: true })).toBeDisabled();
      await pen.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        ...position(points[0]!),
        pointerType: 'pen',
        button: 'left',
        buttons: 1,
        clickCount: 1,
        force: pressure,
      });
      for (const point of points.slice(1))
        await pen.send('Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          ...position(point),
          pointerType: 'pen',
          button: 'left',
          buttons: 1,
          force: pressure,
        });
      await pen.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        ...position(points.at(-1)!),
        pointerType: 'pen',
        button: 'left',
        buttons: 0,
        clickCount: 1,
        force: 0,
      });
      await expect(canvas).toHaveAttribute('data-pointer-type', 'pen');
      expect(Number(await canvas.getAttribute('data-pressure'))).toBeCloseTo(pressure, 5);
      await page.getByRole('button', { name: 'できた！', exact: true }).click();
      await expect(page.locator('.pg-result-summary')).toContainText('100%');
    } finally {
      await pen.detach();
    }
  });
}
