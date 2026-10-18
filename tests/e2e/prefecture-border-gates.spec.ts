import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

const SLOT = 1;
const TILE_SIZE = 16;

type ArrowKey = 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'ArrowUp';
type Tile = readonly [number, number];

interface TiledProperty {
  name: string;
  value: unknown;
}

interface TiledObject {
  name: string;
  type: string;
  x: number;
  y: number;
  properties?: TiledProperty[];
}

interface TiledMap {
  tilewidth: number;
  tileheight: number;
  layers: { name: string; objects?: TiledObject[] }[];
}

interface BrowserField {
  toggleDev(): void;
  events: { once(event: 'create', listener: () => void): void };
  scene: { restart(data: { mapKey: string; spawnTile: Tile; exactSpawn: true }): void };
}

interface BrowserProgress {
  areaSigns: string[];
  counters: Record<string, number>;
  currentArea: string;
  currentIsland: string;
  currentMap: string;
  eventsDone: string[];
  islandsCleared: string[];
  position: { x: number; y: number };
}

interface BrowserGame {
  registry: {
    get(key: string): unknown;
    set(key: string, value: unknown): void;
  };
  scene: { getScene(key: string): unknown };
}

interface LinkEndpoint {
  areaId: string;
  enterKey: ArrowKey;
  entryTile: Tile;
  firstTargetSpawn: string;
  firstSpawnTile: Tile;
  islandId: string;
  linkId: string;
  reciprocalSpawnTile: Tile;
  targetArea: string;
  targetMap: string;
}

const CARDINAL: readonly { dx: number; dy: number; key: ArrowKey }[] = [
  { dx: 1, dy: 0, key: 'ArrowRight' },
  { dx: -1, dy: 0, key: 'ArrowLeft' },
  { dx: 0, dy: 1, key: 'ArrowDown' },
  { dx: 0, dy: -1, key: 'ArrowUp' },
];

const property = (object: TiledObject, name: string): unknown =>
  object.properties?.find((candidate) => candidate.name === name)?.value;

function direction(from: Tile, to: Tile): ArrowKey {
  const move = CARDINAL.find(({ dx, dy }) => from[0] + dx === to[0] && from[1] + dy === to[1]);
  if (!move) throw new Error(`${from.join(',')} から ${to.join(',')} は隣接していません`);
  return move.key;
}

function mapObjects(areaId: string): { map: TiledMap; objects: TiledObject[] } {
  const map = JSON.parse(
    readFileSync(new URL(`../../maps/${areaId}-field.json`, import.meta.url), 'utf8'),
  ) as TiledMap;
  return { map, objects: map.layers.find((layer) => layer.name === 'objects')?.objects ?? [] };
}

function spawnTile(areaId: string, spawnName: string): Tile {
  const { map, objects } = mapObjects(areaId);
  const spawn = objects.find((object) => object.type === 'spawn' && object.name === spawnName);
  if (!spawn) throw new Error(`${areaId}-field に ${spawnName} がありません`);
  return [Math.floor(spawn.x / map.tilewidth), Math.floor(spawn.y / map.tileheight)];
}

function linkEndpoint(areaId: string, islandId: string, linkId: string): LinkEndpoint {
  const { map, objects } = mapObjects(areaId);
  const toTile = (object: TiledObject): Tile => [
    Math.floor(object.x / map.tilewidth),
    Math.floor(object.y / map.tileheight),
  ];
  const entry = objects.find(
    (object) => object.type === 'interPrefectureLink' && property(object, 'linkId') === linkId,
  );
  const reciprocalSpawn = objects.find(
    (object) => object.type === 'spawn' && object.name === `from_${linkId}`,
  );
  const firstSpawn = objects.find((object) => object.type === 'spawn' && object.name === 'spawn');
  if (!entry || !reciprocalSpawn || !firstSpawn)
    throw new Error(`${areaId}-field に ${linkId} の入口・到着点・通常spawnがそろっていません`);
  const entryTile = toTile(entry);
  const reciprocalSpawnTile = toTile(reciprocalSpawn);
  return {
    areaId,
    enterKey: direction(reciprocalSpawnTile, entryTile),
    entryTile,
    firstTargetSpawn: String(property(entry, 'firstTargetSpawn')),
    firstSpawnTile: toTile(firstSpawn),
    islandId,
    linkId,
    reciprocalSpawnTile,
    targetArea: String(property(entry, 'targetArea')),
    targetMap: String(property(entry, 'targetMap')),
  };
}

async function createFreshSave(page: Page): Promise<void> {
  await page.goto('/?resetSaves=1');
  await expect(page.getByRole('menuitem', { name: /はじめから/ })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: new RegExp(`スロット ${SLOT}`) }).click();
  await completeNewGameSetup(page);
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
  await page.reload();
  await expect(page.getByRole('menuitem', { name: 'つづきから' })).toBeEnabled({ timeout: 30_000 });
  await page.getByRole('menuitem', { name: 'つづきから' }).click();
  await page.getByRole('button', { name: new RegExp(`スロット ${SLOT}`) }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
}

async function restartWithProgress(
  page: Page,
  endpoint: LinkEndpoint,
  tile: Tile,
  progressMode?: 'lock-iwate' | 'unlock-iwate',
): Promise<void> {
  await page.evaluate(
    ({ areaId, islandId, mapKey, mode, spawnTile, tileSize }) =>
      new Promise<void>((resolve) => {
        const game = (window as unknown as { __nq: BrowserGame }).__nq;
        const state = game.registry.get('game') as { progress: BrowserProgress };
        state.progress.currentArea = areaId;
        state.progress.currentIsland = islandId;
        state.progress.currentMap = mapKey;
        state.progress.position = { x: spawnTile[0] * tileSize, y: spawnTile[1] * tileSize };
        if (mode === 'lock-iwate') {
          state.progress.areaSigns = state.progress.areaSigns.filter((id) => id !== 'iwate');
          state.progress.eventsDone = state.progress.eventsDone.filter((id) => id !== 'midboss.iwate');
          state.progress.islandsCleared = state.progress.islandsCleared.filter((id) => id !== 'tohoku');
          delete state.progress.counters['visit:miyagi-field'];
        } else if (mode === 'unlock-iwate' && !state.progress.eventsDone.includes('midboss.iwate')) {
          state.progress.eventsDone.push('midboss.iwate');
        }
        game.registry.set('game', state);
        const field = game.scene.getScene('Overworld') as BrowserField;
        field.events.once('create', resolve);
        field.scene.restart({ mapKey, spawnTile, exactSpawn: true });
      }),
    {
      areaId: endpoint.areaId,
      islandId: endpoint.islandId,
      mapKey: `${endpoint.areaId}-field`,
      mode: progressMode,
      spawnTile: tile,
      tileSize: TILE_SIZE,
    },
  );
  await expect(page.locator('canvas[data-player-tile]')).toHaveAttribute('data-player-tile', tile.join(','), {
    timeout: 30_000,
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}

async function pressInto(
  page: Page,
  key: ArrowKey,
  expectedDecision: string,
  destination?: Tile,
): Promise<void> {
  const canvas = page.locator('canvas[data-player-tile]');
  const before = await canvas.getAttribute('data-player-tile');
  let decision: string | null = null;
  for (let attempt = 0; attempt < 10 && decision !== expectedDecision; attempt += 1) {
    await canvas.evaluate((element) => delete (element as HTMLElement).dataset.lastMovement);
    await page.keyboard.down(key);
    await page.waitForTimeout(60);
    await page.keyboard.up(key);
    await page.waitForTimeout(150);
    decision = await canvas.getAttribute('data-last-movement');
  }
  expect(decision, `${before} から ${key} の移動判定`).toBe(expectedDecision);
  if (destination)
    await expect(canvas).toHaveAttribute('data-player-tile', destination.join(','), { timeout: 5_000 });
  else await expect(canvas).toHaveAttribute('data-player-tile', before ?? '');
}

async function clickThroughDialogue(page: Page): Promise<string[]> {
  const lines: string[] = [];
  for (let step = 0; step < 80; step += 1) {
    const dialogue = page.locator('.nq-dlg');
    if (!(await dialogue.isVisible())) return lines;
    lines.push(await dialogue.innerText());
    await dialogue.click({ position: { x: 420, y: 410 } });
    await page.waitForTimeout(80);
  }
  throw new Error('会話を最後まで進められませんでした');
}

async function toggleDev(page: Page, enabled: boolean): Promise<void> {
  await page.evaluate(() => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    const field = game.scene.getScene('Overworld') as BrowserField;
    document.documentElement.removeAttribute('data-e2e-overworld-restarted');
    field.events.once('create', () =>
      document.documentElement.setAttribute('data-e2e-overworld-restarted', 'true'),
    );
    field.toggleDev();
  });
  await expect(page.locator('.nq-dlg')).toBeVisible({ timeout: 10_000 });
  await clickThroughDialogue(page);
  await expect(page.locator('html')).toHaveAttribute('data-e2e-overworld-restarted', 'true', {
    timeout: 20_000,
  });
  await expect
    .poll(() =>
      page.evaluate(() => {
        const game = (window as unknown as { __nq: BrowserGame }).__nq;
        const state = game.registry.get('game') as { progress: BrowserProgress };
        return Boolean(state.progress.counters['dev:all']);
      }),
    )
    .toBe(enabled);
}

async function crossLandBorder(page: Page, endpoint: LinkEndpoint): Promise<void> {
  await pressInto(page, endpoint.enterKey, 'move', endpoint.entryTile);
  await expect(page.locator('.nq-dlg')).toBeVisible({ timeout: 10_000 });
  await clickThroughDialogue(page);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const game = (window as unknown as { __nq: BrowserGame }).__nq;
        return (game.registry.get('game') as { progress: BrowserProgress }).progress.currentMap;
      }),
    )
    .toBe(endpoint.targetMap);
}

async function progressSnapshot(page: Page): Promise<BrowserProgress> {
  return page.evaluate(() => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    return structuredClone((game.registry.get('game') as { progress: BrowserProgress }).progress);
  });
}

test('通常時は未攻略の県境門を閉じ、攻略後は初回入口から次県へ入る', async ({ page }) => {
  test.setTimeout(120_000);
  const iwate = linkEndpoint('iwate', 'tohoku', 'land-iwate-miyagi');
  const miyagi = linkEndpoint('miyagi', 'tohoku', 'land-iwate-miyagi');

  await createFreshSave(page);
  await restartWithProgress(page, iwate, iwate.reciprocalSpawnTile, 'lock-iwate');

  await pressInto(page, iwate.enterKey, 'lockedInterPrefecture');
  const lockedLines = await clickThroughDialogue(page);
  expect(lockedLines.join('\n')).toContain('宮城');
  expect(await progressSnapshot(page)).toMatchObject({ currentArea: 'iwate', currentMap: 'iwate-field' });

  await restartWithProgress(page, iwate, iwate.reciprocalSpawnTile, 'unlock-iwate');
  await crossLandBorder(page, iwate);

  expect(iwate.firstTargetSpawn).toBe('spawn');
  await expect(page.locator('canvas[data-player-tile]')).toHaveAttribute(
    'data-player-tile',
    spawnTile(miyagi.areaId, iwate.firstTargetSpawn).join(','),
    { timeout: 30_000 },
  );
  const arrived = await progressSnapshot(page);
  expect(arrived).toMatchObject({
    currentArea: 'miyagi',
    currentIsland: 'tohoku',
    currentMap: 'miyagi-field',
  });
  expect(arrived.counters['visit:miyagi-field']).toBe(1);
});

test('開発者モードは全県境を往復でき、訪問を付けず、解除時に元位置へ戻る', async ({ page }) => {
  test.setTimeout(150_000);
  const iwate = linkEndpoint('iwate', 'tohoku', 'land-iwate-miyagi');
  const miyagi = linkEndpoint('miyagi', 'tohoku', 'land-iwate-miyagi');

  await createFreshSave(page);
  await restartWithProgress(page, iwate, iwate.firstSpawnTile, 'lock-iwate');
  const returnTile = iwate.firstSpawnTile;
  await toggleDev(page, true);
  await restartWithProgress(page, iwate, iwate.reciprocalSpawnTile);

  await crossLandBorder(page, iwate);
  await expect(page.locator('canvas[data-player-tile]')).toHaveAttribute(
    'data-player-tile',
    miyagi.reciprocalSpawnTile.join(','),
    { timeout: 30_000 },
  );
  expect((await progressSnapshot(page)).counters['visit:miyagi-field']).toBeUndefined();

  await crossLandBorder(page, miyagi);
  await expect(page.locator('canvas[data-player-tile]')).toHaveAttribute(
    'data-player-tile',
    iwate.reciprocalSpawnTile.join(','),
    { timeout: 30_000 },
  );
  await crossLandBorder(page, iwate);
  expect((await progressSnapshot(page)).counters['visit:miyagi-field']).toBeUndefined();

  await toggleDev(page, false);
  await expect
    .poll(() => progressSnapshot(page), { timeout: 30_000 })
    .toMatchObject({ currentArea: 'iwate', currentIsland: 'tohoku', currentMap: 'iwate-field' });
  await expect(page.locator('canvas[data-player-tile]')).toHaveAttribute(
    'data-player-tile',
    returnTile.join(','),
    { timeout: 30_000 },
  );
  const restored = await progressSnapshot(page);
  expect(restored.counters['dev:all']).toBeUndefined();
  expect(restored.counters['visit:miyagi-field']).toBeUndefined();
});

test('実在交通は経路を確認表示し、移動中表示をスキップして到着できる', async ({ page }) => {
  test.setTimeout(120_000);
  const hokkaido = linkEndpoint('hokkaido', 'hokkaido', 'hokkaido-ibaraki-ferry');
  const ibaraki = linkEndpoint('ibaraki', 'kanto', 'hokkaido-ibaraki-ferry');

  await createFreshSave(page);
  await restartWithProgress(page, hokkaido, hokkaido.reciprocalSpawnTile);
  await toggleDev(page, true);
  await pressInto(page, hokkaido.enterKey, 'move', hokkaido.entryTile);

  const overlay = page.locator('.nq-interpref-travel');
  await expect(overlay).toBeVisible({ timeout: 10_000 });
  await expect(overlay).toHaveAttribute('data-phase', 'confirm');
  await expect(overlay.locator('[data-travel-icon]')).toHaveAttribute('data-travel-icon', 'travel-ferry');
  await expect(overlay.locator('.nq-travel-endpoints')).toHaveAttribute(
    'aria-label',
    'とまこまいにしこう から おおあらいこう',
  );

  await overlay.locator('.nq-travel-confirm').click();
  await expect(overlay).toHaveAttribute('data-phase', 'moving');
  await expect(overlay.getByRole('progressbar')).toBeVisible();
  await overlay.locator('.nq-travel-skip').click();

  await expect
    .poll(() => progressSnapshot(page), { timeout: 30_000 })
    .toMatchObject({ currentArea: 'ibaraki', currentIsland: 'kanto', currentMap: 'ibaraki-field' });
  await expect(page.locator('canvas[data-player-tile]')).toHaveAttribute(
    'data-player-tile',
    ibaraki.reciprocalSpawnTile.join(','),
    { timeout: 30_000 },
  );
  expect((await progressSnapshot(page)).counters['visit:ibaraki-field']).toBeUndefined();
});
