import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { TRANSPORT_LINKS, type TransportLink } from '../../scripts/data/interPrefectureLinks';
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

interface WorldData {
  islands: { id: string; areas: string[] }[];
}

interface BrowserField {
  toggleDev(): void;
  events: { once(event: 'create', listener: () => void): void };
  scene: { restart(data: { mapKey: string; spawnTile: Tile; exactSpawn: true }): void };
}

interface BrowserProgress {
  areaSigns: string[];
  chestsOpened: string[];
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
  scene: { getScene(key: string): unknown; isActive(key: string): boolean };
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

const WORLD = JSON.parse(
  readFileSync(new URL('../../content/world/japan.json', import.meta.url), 'utf8'),
) as WorldData;

const TRANSPORT_ICONS = {
  bridge: {
    bicycle: 'travel-bridge-bicycle',
    rail: 'travel-bridge-rail',
    roadVehicle: 'travel-bridge-road',
  },
  seaRoute: { ferry: 'travel-ferry' },
  tunnel: {
    rail: 'travel-tunnel-rail',
    walk: 'travel-tunnel-walk',
  },
} as const;

function islandFor(areaId: string): string {
  const island = WORLD.islands.find((candidate) => candidate.areas.includes(areaId));
  if (!island) throw new Error(`${areaId} の地方が world にありません`);
  return island.id;
}

function transportIcon(link: TransportLink): string {
  const byMode = TRANSPORT_ICONS[link.infrastructure] as Partial<Record<string, string>>;
  const icon = byMode[link.travelMode];
  if (!icon) throw new Error(`${link.id} の交通アイコンがE2E表にありません`);
  return icon;
}

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

function mapSpawnTile(mapKey: string, spawnName = 'spawn'): Tile {
  const map = JSON.parse(
    readFileSync(new URL(`../../maps/${mapKey}.json`, import.meta.url), 'utf8'),
  ) as TiledMap;
  const spawn = map.layers
    .find((layer) => layer.name === 'objects')
    ?.objects?.find((object) => object.type === 'spawn' && object.name === spawnName);
  if (!spawn) throw new Error(`${mapKey} に ${spawnName} がありません`);
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
  await markIntroductionDone(page);
  await page.getByRole('menuitem', { name: 'つづきから' }).click();
  await page.getByRole('button', { name: new RegExp(`スロット ${SLOT}`) }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
}

async function markIntroductionDone(page: Page): Promise<void> {
  await page.evaluate(async (slot) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nihonquest');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('saves', 'readwrite');
      const store = transaction.objectStore('saves');
      const request = store.get(`save:${slot}`);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const state = request.result;
        state.player.name = 'ハル';
        state.progress.counters['story.prologue'] = 1;
        state.progress.counters['story.hero-identity'] = 1;
        state.updatedAt = Date.now();
        store.put(state, `save:${slot}`);
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, SLOT);
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
          if (!state.progress.eventsDone.includes('midboss.aomori'))
            state.progress.eventsDone.push('midboss.aomori');
          state.progress.areaSigns = state.progress.areaSigns.filter((id) => id !== 'iwate');
          state.progress.eventsDone = state.progress.eventsDone.filter((id) => id !== 'midboss.iwate');
          state.progress.islandsCleared = state.progress.islandsCleared.filter((id) => id !== 'tohoku');
          delete state.progress.counters['visit:miyagi-field'];
        } else if (mode === 'unlock-iwate') {
          for (const areaId of ['aomori', 'iwate']) {
            const flag = `midboss.${areaId}`;
            if (!state.progress.eventsDone.includes(flag)) state.progress.eventsDone.push(flag);
          }
        }
        if (mode) {
          state.progress.counters['visit:iwate-field'] = 1;
          state.progress.counters['interpref:arrived:iwate'] = 1;
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
  let completed = false;
  for (let attempt = 0; attempt < 10 && !completed; attempt += 1) {
    await canvas.evaluate((element) => delete (element as HTMLElement).dataset.lastMovement);
    await pulseDirection(page, key);
    await page.waitForTimeout(300);
    decision = await canvas.getAttribute('data-last-movement');
    if (decision !== expectedDecision) continue;
    if (expectedDecision === 'move') {
      const current = await canvas.getAttribute('data-player-tile');
      completed = destination ? current === destination.join(',') : current !== before;
    } else completed = await page.locator('.nq-dlg').isVisible();
  }
  expect(completed, `${before} から ${key} の ${expectedDecision} を完了`).toBe(true);
  if (destination)
    await expect(canvas).toHaveAttribute('data-player-tile', destination.join(','), { timeout: 5_000 });
  else await expect(canvas).toHaveAttribute('data-player-tile', before ?? '');
}

async function pulseDirection(page: Page, key: ArrowKey): Promise<void> {
  await page.evaluate(async (arrow) => {
    const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-player-tile]');
    if (!canvas) throw new Error('フィールドの canvas が見つかりません');
    const before = canvas.dataset.playerTile;
    const direction = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
    }[arrow] as 'down' | 'left' | 'right' | 'up';
    const field = (window as unknown as { __nq: BrowserGame }).__nq.scene.getScene('Overworld') as {
      fieldInput: { setTouchDirection(direction: 'down' | 'left' | 'right' | 'up' | null): void };
    };
    await new Promise<void>((resolve) => {
      let timeout = 0;
      const finish = () => {
        observer.disconnect();
        window.clearTimeout(timeout);
        field.fieldInput.setTouchDirection(null);
        resolve();
      };
      const observer = new MutationObserver(() => {
        const decision = canvas.dataset.lastMovement;
        if (canvas.dataset.playerTile !== before || (decision && decision !== 'move')) finish();
      });
      observer.observe(canvas, {
        attributes: true,
        attributeFilter: ['data-last-movement', 'data-player-tile'],
      });
      timeout = window.setTimeout(finish, 1_000);
      field.fieldInput.setTouchDirection(direction);
    });
  }, key);
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

function progressionWithoutPosition(progress: BrowserProgress): Omit<BrowserProgress, 'position'> {
  const copy = structuredClone(progress) as Partial<BrowserProgress> & { fieldSnapshot?: unknown };
  delete copy.position;
  delete copy.fieldSnapshot;
  return copy as Omit<BrowserProgress, 'position'>;
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

test('開発者モードは入口を補正した栃木・埼玉の県境も往復できる', async ({ page }) => {
  test.setTimeout(120_000);
  const iwate = linkEndpoint('iwate', 'tohoku', 'land-iwate-miyagi');
  const tochigi = linkEndpoint('tochigi', islandFor('tochigi'), 'land-tochigi-saitama');
  const saitama = linkEndpoint('saitama', islandFor('saitama'), 'land-tochigi-saitama');

  await createFreshSave(page);
  await restartWithProgress(page, iwate, iwate.firstSpawnTile, 'lock-iwate');
  await toggleDev(page, true);
  await restartWithProgress(page, tochigi, tochigi.reciprocalSpawnTile);

  await crossLandBorder(page, tochigi);
  await expect(page.locator('canvas[data-player-tile]')).toHaveAttribute(
    'data-player-tile',
    saitama.reciprocalSpawnTile.join(','),
    { timeout: 30_000 },
  );

  await crossLandBorder(page, saitama);
  await expect(page.locator('canvas[data-player-tile]')).toHaveAttribute(
    'data-player-tile',
    tochigi.reciprocalSpawnTile.join(','),
    { timeout: 30_000 },
  );
});

test('開発者モードはボス・名所を起動せず進行を変更しない', async ({ page }) => {
  test.setTimeout(120_000);
  const iwate = linkEndpoint('iwate', 'tohoku', 'land-iwate-miyagi');
  const { map, objects } = mapObjects('aomori');
  const event = objects.find((object) => object.type === 'event');
  if (!event) throw new Error('aomori-field に検査用イベントがありません');
  const eventTile: Tile = [Math.floor(event.x / map.tilewidth), Math.floor(event.y / map.tileheight)];
  const eventOutsideTile: Tile = [eventTile[0] - 2, eventTile[1]];
  const eventTriggerTile: Tile = [eventTile[0] - 1, eventTile[1]];
  const chest = objects.find((object) => object.type === 'chest');
  if (!chest) throw new Error('aomori-field に検査用宝箱がありません');
  const chestTile: Tile = [Math.floor(chest.x / map.tilewidth), Math.floor(chest.y / map.tileheight)];
  const chestApproachTile: Tile = [chestTile[0] - 1, chestTile[1]];
  const town = JSON.parse(
    readFileSync(new URL('../../maps/aomori-town.json', import.meta.url), 'utf8'),
  ) as TiledMap;
  const townNpc = town.layers
    .find((layer) => layer.name === 'objects')
    ?.objects?.find((object) => object.type === 'npc' && property(object, 'role') === 'talk');
  if (!townNpc) throw new Error('aomori-town に検査用町人がいません');
  const npcTile: Tile = [Math.floor(townNpc.x / town.tilewidth), Math.floor(townNpc.y / town.tileheight)];
  const npcApproachTile: Tile = [npcTile[0] - 1, npcTile[1]];

  await createFreshSave(page);
  await restartWithProgress(page, iwate, iwate.firstSpawnTile, 'lock-iwate');
  await toggleDev(page, true);

  const restart = async (mapKey: string, tile: Tile): Promise<void> => {
    await page.evaluate(
      ({ target, spawnTile }) =>
        new Promise<void>((resolve) => {
          const game = (window as unknown as { __nq: BrowserGame }).__nq;
          const field = game.scene.getScene('Overworld') as BrowserField;
          field.events.once('create', resolve);
          field.scene.restart({ mapKey: target, spawnTile, exactSpawn: true });
        }),
      { target: mapKey, spawnTile: tile },
    );
    await expect(page.locator('canvas[data-player-tile]')).toHaveAttribute(
      'data-player-tile',
      tile.join(','),
      { timeout: 30_000 },
    );
  };

  await restart('aomori-field', eventOutsideTile);
  const before = progressionWithoutPosition(await progressSnapshot(page));
  const fieldState = await page.evaluate(() => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    const field = game.scene.getScene('Overworld') as unknown as {
      midBoss: unknown;
      regionBosses: Map<number, unknown>;
    };
    return { midBoss: field.midBoss, regionBosses: field.regionBosses.size };
  });
  expect(fieldState.midBoss).toBeNull();
  expect(fieldState.regionBosses).toBe(0);
  await pressInto(page, 'ArrowRight', 'move', eventTriggerTile);
  await expect(page.locator('.nq-cutin')).toBeHidden();
  await expect(page.locator('.nq-dlg')).toHaveCount(0);
  expect(progressionWithoutPosition(await progressSnapshot(page))).toEqual(before);

  await restart('aomori-field', chestApproachTile);
  const beforeChest = await page.evaluate(() => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    const state = game.registry.get('game') as {
      inventory: Record<string, number>;
      progress: BrowserProgress;
    };
    return { chestsOpened: [...state.progress.chestsOpened], inventory: { ...state.inventory } };
  });
  await page.evaluate(() => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    (
      game.scene.getScene('Overworld') as unknown as { routeFieldInteraction(intent: 'interact'): void }
    ).routeFieldInteraction('interact');
  });
  await expect(page.locator('.nq-cutin')).toHaveCount(0);
  await expect(page.locator('.nq-dlg')).toHaveCount(0);
  expect(
    await page.evaluate(() => {
      const game = (window as unknown as { __nq: BrowserGame }).__nq;
      const state = game.registry.get('game') as {
        inventory: Record<string, number>;
        progress: BrowserProgress;
      };
      return { chestsOpened: [...state.progress.chestsOpened], inventory: { ...state.inventory } };
    }),
  ).toEqual(beforeChest);

  await restart('aomori-town', npcApproachTile);
  const beforeNpc = await progressSnapshot(page);
  await page.evaluate(() => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    (
      game.scene.getScene('Overworld') as unknown as { routeFieldInteraction(intent: 'interact'): void }
    ).routeFieldInteraction('interact');
  });
  await expect(page.locator('.nq-dlg')).toHaveCount(0);
  expect(await progressSnapshot(page)).toEqual(beforeNpc);

  const niigata = mapObjects('niigata');
  const harbor = niigata.objects.find(
    (object) => object.type === 'transition' && property(object, 'targetMap') === 'niigata-enclave',
  );
  if (!harbor) throw new Error('niigata-field に離島への港がありません');
  const harborTile = mapSpawnTile('niigata-field', 'from_niigata-enclave');
  await restart('niigata-field', harborTile);
  await page.evaluate(() => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    const field = game.scene.getScene('Overworld') as unknown as {
      routeFieldInteraction(intent: 'interact'): void;
    };
    field.routeFieldInteraction('interact');
  });
  await expect(page.getByRole('menuitem', { name: 'はい' })).toBeVisible();
  await page.getByRole('menuitem', { name: 'はい' }).click();
  await clickThroughDialogue(page);
  await expect
    .poll(() => progressSnapshot(page).then((progress) => progress.currentMap))
    .toBe('niigata-enclave');

  await restart('aomori-dungeon', mapSpawnTile('aomori-dungeon'));
  expect(
    await page.evaluate(() => {
      const game = (window as unknown as { __nq: BrowserGame }).__nq;
      const field = game.scene.getScene('Overworld') as unknown as { areaBoss: unknown };
      return field.areaBoss === null;
    }),
  ).toBe(true);
  expect(
    await page.evaluate(() => {
      const game = (window as unknown as { __nq: BrowserGame }).__nq;
      const field = game.scene.getScene('Overworld') as unknown as {
        checkRandomEncounter(): void;
        inBattle: boolean;
        rng: { chance: () => boolean };
        stepCount: number;
      };
      field.stepCount = 0;
      field.rng.chance = () => true;
      field.checkRandomEncounter();
      return { battleSceneActive: game.scene.isActive('Battle'), inBattle: field.inBattle };
    }),
  ).toEqual({ battleSceneActive: false, inBattle: false });
  await expect(page.locator('.nq-battle')).toHaveCount(0);

  await restart('aomori-secret', mapSpawnTile('aomori-secret'));
  expect(
    await page.evaluate(() => {
      const game = (window as unknown as { __nq: BrowserGame }).__nq;
      const field = game.scene.getScene('Overworld') as unknown as { lastBoss: unknown };
      return field.lastBoss === null;
    }),
  ).toBe(true);

  const beforeIslandBoss = await page.evaluate(() => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    const state = game.registry.get('game') as { progress: BrowserProgress };
    state.progress.areaSigns = ['aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima'];
    game.registry.set('game', state);
    const field = game.scene.getScene('Overworld') as unknown as {
      challengeIslandBoss(islandId: string): Promise<void>;
    };
    void field.challengeIslandBoss('tohoku');
    return structuredClone(state.progress);
  });
  await expect(page.locator('.nq-dlg')).toHaveCount(0);
  expect(await progressSnapshot(page)).toEqual(beforeIslandBoss);
});

test('9つの実在交通を種類別に表示し、960×540と844×390に収める', async ({ page }) => {
  test.setTimeout(180_000);
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });

  await createFreshSave(page);
  await toggleDev(page, true);
  const firstLink = TRANSPORT_LINKS[1]!;
  const firstArea = firstLink.endpoints[0].areaId;
  const firstEndpoint = linkEndpoint(firstArea, islandFor(firstArea), firstLink.id);
  await restartWithProgress(page, firstEndpoint, firstEndpoint.firstSpawnTile);

  for (const link of TRANSPORT_LINKS) {
    const areaId = link.endpoints[0].areaId;
    const endpoint = linkEndpoint(areaId, islandFor(areaId), link.id);
    await restartWithProgress(page, endpoint, endpoint.reciprocalSpawnTile);
    await pressInto(page, endpoint.enterKey, 'move', endpoint.entryTile);

    const overlay = page.locator('.nq-interpref-travel');
    await expect(overlay, link.id).toBeVisible({ timeout: 10_000 });
    await expect(overlay, link.id).toHaveAttribute('data-phase', 'confirm');
    await expect(overlay.locator('[data-travel-icon]'), link.id).toHaveAttribute(
      'data-travel-icon',
      transportIcon(link),
    );
    await expect(overlay.locator('.nq-travel-route'), link.id).not.toHaveText('');
    await expect(overlay.locator('.nq-travel-endpoints'), link.id).toHaveAttribute('aria-label', / から /);
    await overlay.locator('.nq-travel-cancel').click();
    await expect(overlay, link.id).toBeHidden();
  }

  await page.setViewportSize({ width: 844, height: 390 });
  const compactLink = TRANSPORT_LINKS.find((link) => link.id === 'hyogo-tokushima-bridge')!;
  const compactArea = compactLink.endpoints[0].areaId;
  const compactEndpoint = linkEndpoint(compactArea, islandFor(compactArea), compactLink.id);
  await restartWithProgress(page, compactEndpoint, compactEndpoint.reciprocalSpawnTile);
  await pressInto(page, compactEndpoint.enterKey, 'move', compactEndpoint.entryTile);

  const compactPanel = page.locator('.nq-travel-panel');
  await expect(compactPanel).toBeVisible({ timeout: 10_000 });
  const panelBox = await compactPanel.boundingBox();
  expect(panelBox).not.toBeNull();
  expect(panelBox!.x).toBeGreaterThanOrEqual(0);
  expect(panelBox!.y).toBeGreaterThanOrEqual(0);
  expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(844);
  expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(390);
  await page.keyboard.press('Escape');
  await expect(page.locator('.nq-interpref-travel')).toBeHidden();
  expect(browserErrors).toEqual([]);
});

test('実在交通は経路を確認表示し、移動中表示をスキップして到着できる', async ({ page }) => {
  test.setTimeout(120_000);
  const hokkaido = linkEndpoint('hokkaido', 'hokkaido', 'hokkaido-ibaraki-ferry');
  const ibaraki = linkEndpoint('ibaraki', 'kanto', 'hokkaido-ibaraki-ferry');

  await createFreshSave(page);
  await toggleDev(page, true);
  await restartWithProgress(page, hokkaido, hokkaido.reciprocalSpawnTile);
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
