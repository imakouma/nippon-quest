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

async function walkOneTile(
  page: Page,
  key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight',
  expected?: [number, number],
): Promise<void> {
  const canvas = page.locator('canvas[data-player-tile]');
  const before = await canvas.getAttribute('data-player-tile');
  await canvas.evaluate((element) => {
    delete (element as HTMLElement).dataset.lastMovement;
    delete (element as HTMLElement).dataset.testStepStarted;
  });
  await page.evaluate((key) => {
    const scene = window.__nq.scene.getScene('Overworld') as Phaser.Scene & {
      playerLocomotion: { phase: string };
    };
    const keyCode = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39 }[key];
    // CIとの往復中に2歩進まないよう、開始フレーム内でキーを離す。
    const release = () => {
      if (scene.playerLocomotion.phase !== 'stepping') return;
      window.dispatchEvent(new KeyboardEvent('keyup', { key, code: key, keyCode, bubbles: true }));
      scene.events.off('postupdate', release);
      scene.game.canvas.dataset.testStepStarted = 'true';
    };
    scene.events.on('postupdate', release);
  }, key);
  await page.keyboard.down(key);
  try {
    await expect(canvas).toHaveAttribute('data-test-step-started', 'true');
  } finally {
    await page.keyboard.up(key);
  }
  await expect(canvas).toHaveAttribute('data-last-movement', 'move');
  await expect(canvas).not.toHaveAttribute('data-player-tile', before!);
  if (expected) await expect(canvas).toHaveAttribute('data-player-tile', `${expected[0]},${expected[1]}`);
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
  await page.locator('canvas[data-player-tile]').click({ position: { x: 400, y: 200 } });
  await walkOneTile(page, 'ArrowRight', [71, 12]);
  const second = await getFrame();
  await page.waitForTimeout(350);
  expect(await getFrame()).not.toEqual(second);

  await page.evaluate(() => Object.defineProperty(document, 'hidden', { configurable: true, value: true }));
  const hidden = await getFrame();
  await page.waitForTimeout(500);
  expect(await getFrame()).toEqual(hidden);
  await page.evaluate(() => Reflect.deleteProperty(document, 'hidden'));
  await page.waitForTimeout(350);
  expect(await getFrame()).not.toEqual(hidden);

  await teleport(page, [44, 86], { area: 'aomori', map: 'aomori-field', devAll: true });
  const inland = await getFrame();
  await page.waitForTimeout(500);
  expect(await getFrame()).toEqual(inland);

  await teleport(page, [70, 12], { area: 'aomori', map: 'aomori-field', devAll: true });
  const coast = await getFrame();
  await page.waitForTimeout(350);
  expect(await getFrame()).not.toEqual(coast);
});
