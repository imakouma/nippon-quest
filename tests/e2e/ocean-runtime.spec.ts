import { expect, test, type Page } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

interface SavedFieldState {
  inventory: Record<string, number>;
  progress: {
    currentIsland: string;
    currentArea: string;
    currentMap: string;
    position: { x: number; y: number };
    areaSigns: string[];
    islandsCleared: string[];
    counters: Record<string, number>;
    eventsDone: string[];
    chestsOpened: string[];
  };
}

interface TeleportDestination {
  area: string;
  map: string;
  island?: string;
  devAll?: boolean;
}

async function startField(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('menuitem', { name: /はじめから/ })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page);
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
}

async function teleport(
  page: Page,
  tile: [number, number],
  destination: TeleportDestination = { area: 'aomori', map: 'aomori-field' },
): Promise<void> {
  await page.getByRole('button', { name: 'メニュー' }).click();
  await page.getByRole('button', { name: /ほごしゃ/ }).click();
  await page.getByLabel('こたえ').fill('12');
  await page.getByRole('button', { name: 'ひらく', exact: true }).click();
  await page.getByRole('button', { name: /JSONを(?:表示|ひょうじ)/ }).click();
  const jsonBox = page.getByLabel('セーブデータJSON');
  const state = JSON.parse(await jsonBox.inputValue()) as SavedFieldState;
  state.progress.currentArea = destination.area;
  state.progress.currentMap = destination.map;
  if (destination.island) state.progress.currentIsland = destination.island;
  state.progress.position = { x: tile[0] * 16, y: tile[1] * 16 };
  state.progress.counters['story.prologue'] = 1;
  if (destination.area === 'kagoshima') {
    state.progress.islandsCleared = [
      'tohoku',
      'hokkaido',
      'kanto',
      'hokuriku',
      'koshinetsu',
      'tokai',
      'kinki',
      'chugoku',
      'shikoku',
    ];
    state.progress.areaSigns.push('kagoshima');
  }
  if (destination.devAll) state.progress.counters['dev:all'] = 1;
  await jsonBox.fill(JSON.stringify(state));
  await page.getByRole('button', { name: /JSONを(?:読みこむ|よみこむ)/ }).click();
  await expect(page.locator('.nq-parent-content')).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator('#game-root canvas')).toHaveAttribute(
    'data-player-tile',
    `${tile[0]},${tile[1]}`,
    { timeout: 30_000 },
  );
  const menu = page.getByRole('dialog', { name: 'メニュー' });
  if (await menu.isVisible()) await menu.getByRole('button', { name: /とじる/ }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(750);
}

test('実ゲームの海面が動き続ける', async ({ page }) => {
  test.setTimeout(120_000);
  await startField(page);
  await teleport(page, [70, 12], { area: 'aomori', map: 'aomori-field', devAll: true });
  const getFrame = () =>
    page.evaluate(() => {
      const scene = window.__nq.scene.getScene('Overworld');
      const canvas = scene.textures.get('overworld-view').source[0]!.image as HTMLCanvasElement;
      return Array.from(canvas.getContext('2d')!.getImageData(0, 0, 16, 16).data);
    });
  await page.waitForTimeout(1000);
  const first = await getFrame();
  await page.waitForTimeout(350);
  expect(await getFrame()).not.toEqual(first);
  const canvas = page.locator('canvas[data-player-tile]');
  const before = await canvas.getAttribute('data-player-tile');
  await canvas.click({ position: { x: 400, y: 200 } });
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(350);
  await page.keyboard.up('ArrowRight');
  await expect(canvas).not.toHaveAttribute('data-player-tile', before!);
  const second = await getFrame();
  await page.waitForTimeout(350);
  expect(await getFrame()).not.toEqual(second);

  await teleport(page, [44, 86], { area: 'aomori', map: 'aomori-field', devAll: true });
  const inland = await getFrame();
  await page.waitForTimeout(500);
  expect(await getFrame()).toEqual(inland);

  await teleport(page, [70, 12], { area: 'aomori', map: 'aomori-field', devAll: true });
  const coast = await getFrame();
  await page.waitForTimeout(350);
  expect(await getFrame()).not.toEqual(coast);
});
