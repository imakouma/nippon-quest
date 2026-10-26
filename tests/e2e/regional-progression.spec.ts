import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { groundOfTile, isRoadTile } from '../../src/core/world/ground';
import { completeNewGameSetup } from './newGame';

const AREA_ID = 'nagasaki';
const MAP_KEY = `${AREA_ID}-field`;
const SLOT = 1;
const TILE = 16;

const REPRESENTATIVE_AREAS = [
  { areaId: 'iwate', islandId: 'tohoku' },
  { areaId: 'hokkaido', islandId: 'hokkaido' },
  { areaId: 'ibaraki', islandId: 'kanto' },
  { areaId: 'niigata', islandId: 'hokuriku' },
  { areaId: 'yamanashi', islandId: 'koshinetsu' },
  { areaId: 'gifu', islandId: 'tokai' },
  { areaId: 'shiga', islandId: 'kinki' },
  { areaId: 'tottori', islandId: 'chugoku' },
  { areaId: 'tokushima', islandId: 'shikoku' },
  { areaId: 'fukuoka', islandId: 'kyushu-okinawa' },
] as const;

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

interface TiledLayer {
  name: string;
  type: string;
  data?: number[];
  objects?: TiledObject[];
}

interface TiledMap {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  properties?: TiledProperty[];
  layers: TiledLayer[];
}

interface AreaData {
  regions: { id: string; start?: boolean; boss?: { monsterId: string } }[];
  regionGates: { between: [string, string]; openedBy: string }[];
  encounters: {
    zone: string;
    region?: string;
    table: { monsterId: string }[];
    stepsPerCheck: number;
  }[];
}

interface RegionPartition {
  ids: string[];
  rows: string[];
}

interface BrowserGate {
  openedBy: string;
  between: [string, string];
  sprite: { texture: { key: string } };
}

interface BrowserField {
  currentRegion: string | null;
  lockedGates: Map<number, string>;
  regionGates: Map<number, BrowserGate>;
  regionBosses: Map<number, { regionId: string }>;
  transitionIcons: Map<number, { isTinted: boolean }>;
  encounterPolicyState: {
    traversedSteps: number;
    eligibleStepsSinceCheck: number;
    missedChecks: number;
    cooldownStepsRemaining: number;
  };
  midBoss: { tile: number } | null;
  warp: { tile: number; to: { id: string; mapKey: string } } | null;
  rng: { chance: (probability: number) => boolean };
  gateOpen(gate: BrowserGate): boolean;
  isLocked(tile: number): boolean;
  checkRandomEncounter(): void;
  toggleDev(): void;
  events: {
    once(event: 'create', listener: () => void): void;
  };
  scene: {
    restart(data: { mapKey: string; spawnTile: Tile; exactSpawn: true }): void;
  };
}

interface BrowserGame {
  registry: { get(key: string): unknown; set(key: string, value: unknown): void };
  scene: {
    getScene(key: string): unknown;
    isActive(key: string): boolean;
  };
}

interface Layout {
  bossApproach: { tile: Tile; key: ArrowKey };
  dungeonApproach: { tile: Tile; key: ArrowKey };
  dungeonTile: Tile;
  finalBossApproach: { tile: Tile; key: ArrowKey };
  finalRegion: string;
  encounterTile: Tile;
  encounterSteps: number;
  gate: {
    openedBy: string;
    startSide: Tile;
    enterKey: ArrowKey;
    tile: Tile;
    nextSide: Tile;
    exitKey: ArrowKey;
  };
  midBossApproach: { tile: Tile; key: ArrowKey };
  nextRegion: string;
  nextRegionMonsters: string[];
  regionCount: number;
  regionIds: string[];
  startRegion: string;
}

const CARDINAL: readonly { dx: number; dy: number; key: ArrowKey }[] = [
  { dx: 1, dy: 0, key: 'ArrowRight' },
  { dx: -1, dy: 0, key: 'ArrowLeft' },
  { dx: 0, dy: 1, key: 'ArrowDown' },
  { dx: 0, dy: -1, key: 'ArrowUp' },
];

const prop = (source: { properties?: TiledProperty[] }, name: string): unknown =>
  source.properties?.find((property) => property.name === name)?.value;

function direction(from: Tile, to: Tile): ArrowKey {
  const move = CARDINAL.find(({ dx, dy }) => from[0] + dx === to[0] && from[1] + dy === to[1]);
  if (!move) throw new Error(`${from.join(',')} から ${to.join(',')} は隣接していません`);
  return move.key;
}

function resolveLayout(areaId = AREA_ID): Layout {
  const map = JSON.parse(
    readFileSync(new URL(`../../maps/${areaId}-field.json`, import.meta.url), 'utf8'),
  ) as TiledMap;
  const area = JSON.parse(
    readFileSync(new URL(`../../content/prefectures/${areaId}.json`, import.meta.url), 'utf8'),
  ) as AreaData;
  const rawRegions = prop(map, 'regions');
  if (typeof rawRegions !== 'string')
    throw new Error(`${areaId}-field に regions がありません。先に pnpm scaffold:maps を実行してください`);
  const regions = JSON.parse(rawRegions) as RegionPartition;
  const objects = map.layers.find((layer) => layer.name === 'objects')?.objects ?? [];
  const background = map.layers.find((layer) => layer.name === 'background')?.data ?? [];
  const collision = map.layers.find((layer) => layer.name === 'collision')?.data ?? [];
  const start = area.regions.find((region) => region.start);
  if (!start) throw new Error(`${areaId} に開始地域がありません`);
  const gateDefinition = area.regionGates.find(
    (candidate) => candidate.openedBy === start.id && candidate.between.includes(start.id),
  );
  if (!gateDefinition) throw new Error(`${start.id} の撃破で開く関所がありません`);
  const nextRegion = gateDefinition.between.find((regionId) => regionId !== start.id);
  if (!nextRegion) throw new Error(`${start.id} の次地域を解決できません`);

  const objectTile = (object: TiledObject): Tile => [
    Math.floor(object.x / map.tilewidth),
    Math.floor(object.y / map.tileheight),
  ];
  const indexOf = ([x, y]: Tile): number => y * map.width + x;
  const regionAt = ([x, y]: Tile): string | null => {
    const cell = regions.rows[y]?.[x];
    return cell && cell !== '.' ? (regions.ids[cell.charCodeAt(0) - 97] ?? null) : null;
  };
  const occupied = new Set(objects.map((object) => indexOf(objectTile(object))));
  const objectsByTile = new Map<number, TiledObject[]>();
  for (const object of objects) {
    const index = indexOf(objectTile(object));
    const entries = objectsByTile.get(index) ?? [];
    entries.push(object);
    objectsByTile.set(index, entries);
  }
  const walkable = (tile: Tile, allowObject = false): boolean => {
    const [x, y] = tile;
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
    const index = indexOf(tile);
    return (
      collision[index] !== 3 &&
      groundOfTile(background[index]) !== null &&
      (allowObject || !occupied.has(index))
    );
  };
  const neighborInRegion = (center: Tile, regionId: string): Tile | null => {
    for (const { dx, dy } of CARDINAL) {
      const candidate: Tile = [center[0] + dx, center[1] + dy];
      if (regionAt(candidate) === regionId && walkable(candidate)) return candidate;
    }
    return null;
  };

  const boss = objects.find((object) => object.type === 'regionBoss' && prop(object, 'region') === start.id);
  if (!boss) throw new Error(`${start.id} の regionBoss が nagasaki-field にありません`);
  const bossTile = objectTile(boss);
  const bossSide = neighborInRegion(bossTile, start.id);
  if (!bossSide) throw new Error(`${boss.name} に同じ地域から隣接できません`);

  const finalRegion = area.regions.at(-1);
  if (!finalRegion) throw new Error(`${areaId} に最終地域がありません`);
  const finalBoss = objects.find(
    (object) => object.type === 'regionBoss' && prop(object, 'region') === finalRegion.id,
  );
  if (!finalBoss) throw new Error(`${finalRegion.id} の regionBoss が ${areaId}-field にありません`);
  const finalBossTile = objectTile(finalBoss);
  const finalBossSide = neighborInRegion(finalBossTile, finalRegion.id);
  if (!finalBossSide) throw new Error(`${finalBoss.name} に同じ地域から隣接できません`);

  const dungeon = objects.find((object) => object.name === 'to_dungeon');
  if (!dungeon) throw new Error(`${areaId}-field に to_dungeon がありません`);
  const dungeonTile = objectTile(dungeon);
  const dungeonSide = CARDINAL.map(({ dx, dy }) => [dungeonTile[0] + dx, dungeonTile[1] + dy] as Tile).find(
    (candidate) => walkable(candidate),
  );
  if (!dungeonSide) throw new Error(`${dungeon.name} に隣接できません`);

  const midBoss = objects.find((object) => object.type === 'midboss');
  if (!midBoss) throw new Error(`${areaId}-field に midboss がありません`);
  const midBossTile = objectTile(midBoss);
  const midBossCandidates = CARDINAL.map(({ dx, dy }) => [midBossTile[0] + dx, midBossTile[1] + dy] as Tile);
  const midBossSide =
    midBossCandidates.find((candidate) => walkable(candidate)) ??
    midBossCandidates.find((candidate) => {
      if (!walkable(candidate, true)) return false;
      const occupants = objectsByTile.get(indexOf(candidate)) ?? [];
      return occupants.length > 0 && occupants.every((object) => object.type === 'regionGate');
    });
  if (!midBossSide) throw new Error(`${midBoss.name} に隣接できません`);

  const samePair = (value: unknown): boolean => {
    const actual = String(value).split(',');
    return actual.length === 2 && gateDefinition.between.every((regionId) => actual.includes(regionId));
  };
  const gateObject = objects.find(
    (object) =>
      object.type === 'regionGate' &&
      prop(object, 'openedBy') === gateDefinition.openedBy &&
      samePair(prop(object, 'between')),
  );
  if (!gateObject) throw new Error(`${gateDefinition.between.join(' ↔ ')} の関所がありません`);
  const gateTile = objectTile(gateObject);
  const startSide = neighborInRegion(gateTile, start.id);
  const nextSide = neighborInRegion(gateTile, nextRegion);
  if (!startSide || !nextSide) throw new Error(`${gateObject.name} の両側に地域内の歩行マスがありません`);

  let encounterTile: Tile | null = null;
  for (let y = 0; y < map.height && !encounterTile; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const candidate: Tile = [x, y];
      const tile = background[indexOf(candidate)];
      if (
        regionAt(candidate) === nextRegion &&
        walkable(candidate) &&
        groundOfTile(tile) !== null &&
        !isRoadTile(tile)
      ) {
        encounterTile = candidate;
        break;
      }
    }
  }
  if (!encounterTile) throw new Error(`${nextRegion} に通常エンカウント可能なマスがありません`);
  const encounter = area.encounters.find((table) => table.zone === 'field' && table.region === nextRegion);
  if (!encounter) throw new Error(`${nextRegion} の地域別 field 出現表がありません`);

  return {
    bossApproach: { tile: bossSide, key: direction(bossSide, bossTile) },
    dungeonApproach: { tile: dungeonSide, key: direction(dungeonSide, dungeonTile) },
    dungeonTile,
    finalBossApproach: { tile: finalBossSide, key: direction(finalBossSide, finalBossTile) },
    finalRegion: finalRegion.id,
    encounterTile,
    encounterSteps: encounter.stepsPerCheck,
    gate: {
      openedBy: gateDefinition.openedBy,
      startSide,
      enterKey: direction(startSide, gateTile),
      tile: gateTile,
      nextSide,
      exitKey: direction(gateTile, nextSide),
    },
    midBossApproach: { tile: midBossSide, key: direction(midBossSide, midBossTile) },
    nextRegion,
    nextRegionMonsters: encounter.table.map((entry) => entry.monsterId),
    regionCount: area.regions.length,
    regionIds: area.regions.map((region) => region.id),
    startRegion: start.id,
  };
}

async function createFreshSave(page: Page): Promise<void> {
  await page.goto('/?resetSaves=1');
  await expect(page.getByRole('menuitem', { name: /はじめから/ })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: new RegExp(`スロット ${SLOT}`) }).click();
  await completeNewGameSetup(page);
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });

  // 起動中の Overworld が持つ古いスナップショットに、E2E用の保存内容を上書きさせない。
  await page.reload();
  await expect(page.getByRole('menuitem', { name: 'つづきから' })).toBeEnabled({ timeout: 30_000 });
}

async function seedNagasakiSave(
  page: Page,
  tile: Tile,
  legacyCompletion: false | 'areaSign' | 'midBoss' = false,
  defeatedRegionIds: readonly string[] = [],
): Promise<void> {
  await page.evaluate(
    async ({ areaId, defeatedRegions, legacy, mapKey, slot, tileSize, x, y }) => {
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
          if (!state) {
            reject(new Error(`save:${slot} がありません`));
            return;
          }
          state.player.baseStats = {
            hp: 9_999,
            mp: 999,
            scienceAtk: 9_999,
            humanitiesAtk: 9_999,
            scienceDef: 9_999,
            humanitiesDef: 9_999,
            spd: 9_999,
            wis: 9_999,
          };
          state.player.hp = 9_999;
          state.player.mp = 999;
          state.progress.currentIsland = 'kyushu-okinawa';
          state.progress.currentArea = areaId;
          state.progress.currentMap = mapKey;
          state.progress.position = { x: x * tileSize, y: y * tileSize };
          state.progress.areaSigns =
            legacy === 'areaSign' ? [areaId] : state.progress.areaSigns.filter((id: string) => id !== areaId);
          state.progress.eventsDone = state.progress.eventsDone.filter(
            (id: string) => id !== `midboss.${areaId}` && !id.startsWith(`regionboss.${areaId}.`),
          );
          if (legacy === 'midBoss') state.progress.eventsDone.push(`midboss.${areaId}`);
          for (const regionId of defeatedRegions)
            state.progress.eventsDone.push(`regionboss.${areaId}.${regionId}`);
          if (!state.progress.eventsDone.includes('tutorial.battle-basics'))
            state.progress.eventsDone.push('tutorial.battle-basics');
          state.progress.counters['story.prologue'] = 1;
          state.progress.counters['story.hero-identity'] = 1;
          state.progress.counters['story.chapter.kyushu-okinawa'] = 1;
          delete state.progress.counters['dev:all'];
          state.updatedAt = Date.now();
          store.put(state, `save:${slot}`);
        };
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
      database.close();
    },
    {
      areaId: AREA_ID,
      defeatedRegions: defeatedRegionIds,
      legacy: legacyCompletion,
      mapKey: MAP_KEY,
      slot: SLOT,
      tileSize: TILE,
      x: tile[0],
      y: tile[1],
    },
  );
}

async function continueFromSlot(page: Page, expectedTile?: Tile): Promise<void> {
  await page.getByRole('menuitem', { name: 'つづきから' }).click();
  await page.getByRole('button', { name: new RegExp(`スロット ${SLOT}`) }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
  if (expectedTile)
    await expect(page.locator('canvas[data-player-tile]')).toHaveAttribute(
      'data-player-tile',
      expectedTile.join(','),
      { timeout: 30_000 },
    );
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}

async function walkOne(
  page: Page,
  key: ArrowKey,
  expected: 'midboss' | 'move' | 'regionBoss',
  destination?: Tile,
): Promise<void> {
  const canvas = page.locator('canvas[data-player-tile]');
  const before = await canvas.getAttribute('data-player-tile');
  let decision: string | null = null;
  for (let attempt = 0; attempt < 10 && decision !== expected; attempt += 1) {
    await canvas.evaluate((element) => delete (element as HTMLElement).dataset.lastMovement);
    await page.keyboard.down(key);
    await page.waitForTimeout(60);
    await page.keyboard.up(key);
    await page.waitForTimeout(140);
    decision = await canvas.getAttribute('data-last-movement');
  }
  expect(decision, `${before} から ${key} の移動判定`).toBe(expected);
  if (expected === 'midboss' || expected === 'regionBoss') {
    await expect(canvas).toHaveAttribute('data-player-tile', before ?? '');
    return;
  }
  if (destination)
    await expect(canvas).toHaveAttribute('data-player-tile', destination.join(','), {
      timeout: 5_000,
    });
  else await expect.poll(() => canvas.getAttribute('data-player-tile')).not.toBe(before);
}

async function walkIntoTransition(page: Page, key: ArrowKey): Promise<void> {
  const canvas = page.locator('canvas[data-player-tile]');
  let decision: string | null = null;
  for (let attempt = 0; attempt < 10 && decision !== 'move'; attempt += 1) {
    await canvas.evaluate((element) => delete (element as HTMLElement).dataset.lastMovement);
    await page.keyboard.down(key);
    await page.waitForTimeout(60);
    await page.keyboard.up(key);
    await page.waitForTimeout(140);
    decision = await canvas.getAttribute('data-last-movement');
  }
  expect(decision, `入口へ ${key} で移動`).toBe('move');
}

async function clickThroughDialogue(page: Page): Promise<string[]> {
  const texts: string[] = [];
  for (let step = 0; step < 80; step += 1) {
    const dialogue = page.locator('.nq-dlg');
    if (!(await dialogue.isVisible())) return texts;
    texts.push(await dialogue.innerText());
    await dialogue.click({ position: { x: 420, y: 410 } });
    await page.waitForTimeout(80);
  }
  throw new Error('会話を最後まで進められませんでした');
}

async function defeatCurrentEnemy(page: Page): Promise<void> {
  await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 30_000 });
  await page.locator('.nq-box').click();
  const skillCommand = page.locator('.nq-cmd[data-cmd="skill"]');
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline && !(await page.locator('.nq-result').isVisible())) {
    if (await skillCommand.isVisible()) {
      await page.evaluate(() => {
        const game = (window as unknown as { __nq: BrowserGame }).__nq;
        const battle = game.scene.getScene('Battle') as { state: { enemy: { hp: number } } };
        battle.state.enemy.hp = 1;
      });
      await skillCommand.click();
      const skill = page.locator('[data-skill]:not(.nq-opt-off)').first();
      await expect(skill).toBeVisible({ timeout: 10_000 });
      await skill.click();
      const answer = page
        .locator('.nq-choice, .nq-q-input input, .nq-map-tap, .nq-nb-submit, .nq-pw-card, .nq-sort-submit')
        .first();
      await expect(answer).toBeVisible({ timeout: 20_000 });
      if (await page.locator('.nq-choice').first().isVisible()) {
        await page.locator('.nq-choice').first().click();
      } else if (await page.locator('.nq-q-input input').first().isVisible()) {
        const inputs = page.locator('.nq-q-input input');
        for (let index = 0; index < (await inputs.count()); index += 1) await inputs.nth(index).fill('0');
        await page.getByRole('button', { name: 'こたえる' }).click();
      } else if (await page.locator('.nq-nb-submit').isVisible()) {
        await page.locator('.nq-nb-submit').click();
      } else if (await page.locator('.nq-pw-card').first().isVisible()) {
        const cards = page.locator('.nq-pw-card');
        for (
          let index = 0;
          index < (await cards.count()) && (await page.locator('.nq-bq').isVisible());
          index += 1
        )
          await cards
            .nth(index)
            .click()
            .catch(() => undefined);
      } else if (await page.locator('.nq-sort-submit').isVisible()) {
        await page.locator('.nq-sort-submit').click();
      } else {
        await page.locator('.nq-map-tap').click({ position: { x: 20, y: 20 } });
      }
    } else if (await page.locator('.nq-box-next').isVisible())
      await page
        .locator('.nq-box')
        .click({ timeout: 1_000 })
        .catch(() => undefined);
    await page.waitForTimeout(120);
  }
  await expect(page.locator('.nq-result')).toContainText(/しょうり|勝利/, { timeout: 10_000 });
  await page.locator('[data-result-close]').click();
  for (let step = 0; step < 80 && (await page.locator('.nq-battle').isVisible()); step += 1) {
    if (await page.locator('.nq-box').isVisible())
      await page
        .locator('.nq-box')
        .click({ timeout: 1_000 })
        .catch(() => undefined);
    await page.waitForTimeout(100);
  }
  await expect(page.locator('.nq-battle')).toHaveCount(0, { timeout: 20_000 });
}

async function savedProgress(page: Page): Promise<{
  areaSigns: string[];
  counters: Record<string, number>;
  eventsDone: string[];
}> {
  return page.evaluate(async (slot) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nihonquest');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const progress = await new Promise<{
      areaSigns: string[];
      counters: Record<string, number>;
      eventsDone: string[];
    }>((resolve, reject) => {
      const request = database.transaction('saves').objectStore('saves').get(`save:${slot}`);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.progress);
    });
    database.close();
    return progress;
  }, SLOT);
}

async function currentMap(page: Page): Promise<string> {
  return page.evaluate(() => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    return (game.registry.get('game') as { progress: { currentMap: string } }).progress.currentMap;
  });
}

async function fieldSnapshot(
  page: Page,
  openedBy: string,
): Promise<{
  bossRegions: string[];
  currentRegion: string | null;
  gateOpen: boolean;
  gateTexture: string;
}> {
  return page.evaluate((regionId) => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    const field = game.scene.getScene('Overworld') as BrowserField;
    const gate = [...field.regionGates.values()].find((candidate) => candidate.openedBy === regionId);
    if (!gate) throw new Error(`${regionId} の関所がランタイムにありません`);
    return {
      bossRegions: [...field.regionBosses.values()].map((boss) => boss.regionId),
      currentRegion: field.currentRegion,
      gateOpen: field.gateOpen(gate),
      gateTexture: gate.sprite.texture.key,
    };
  }, openedBy);
}

async function allRegionalObjectsSnapshot(page: Page): Promise<{
  bossRegions: string[];
  currentRegion: string | null;
  gates: { open: boolean; texture: string }[];
}> {
  return page.evaluate(() => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    const field = game.scene.getScene('Overworld') as BrowserField;
    return {
      bossRegions: [...field.regionBosses.values()].map((boss) => boss.regionId),
      currentRegion: field.currentRegion,
      gates: [...field.regionGates.values()].map((gate) => ({
        open: field.gateOpen(gate),
        texture: gate.sprite.texture.key,
      })),
    };
  });
}

async function regionalDungeonSnapshot(page: Page): Promise<{ isTinted: boolean; locked: boolean }> {
  return page.evaluate(() => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    const field = game.scene.getScene('Overworld') as BrowserField;
    const entry = [...field.lockedGates.entries()].find(([, reason]) => reason === 'regionBosses');
    if (!entry) throw new Error('regionBosses で閉じるダンジョン入口がありません');
    const [tile] = entry;
    const icon = field.transitionIcons.get(tile);
    if (!icon) throw new Error(`ダンジョン入口 ${tile} の画像がありません`);
    return { isTinted: icon.isTinted, locked: field.isLocked(tile) };
  });
}

async function restartRepresentativeArea(
  page: Page,
  area: (typeof REPRESENTATIVE_AREAS)[number],
  tile: Tile,
  legacyCleared: boolean,
): Promise<void> {
  await page.evaluate(
    ({ areaId, islandId, legacy, mapKey, spawnTile, tileSize }) =>
      new Promise<void>((resolve) => {
        const game = (window as unknown as { __nq: BrowserGame }).__nq;
        const state = game.registry.get('game') as {
          progress: {
            areaSigns: string[];
            counters: Record<string, number>;
            currentArea: string;
            currentIsland: string;
            currentMap: string;
            eventsDone: string[];
            position: { x: number; y: number };
          };
        };
        state.progress.currentIsland = islandId;
        state.progress.currentArea = areaId;
        state.progress.currentMap = mapKey;
        state.progress.position = { x: spawnTile[0] * tileSize, y: spawnTile[1] * tileSize };
        state.progress.areaSigns = legacy
          ? [...state.progress.areaSigns.filter((id) => id !== areaId), areaId]
          : state.progress.areaSigns.filter((id) => id !== areaId);
        state.progress.eventsDone = state.progress.eventsDone.filter(
          (id) => !id.startsWith(`regionboss.${areaId}.`),
        );
        state.progress.counters['story.prologue'] = 1;
        state.progress.counters['story.hero-identity'] = 1;
        state.progress.counters[`story.chapter.${islandId}`] = 1;
        delete state.progress.counters['dev:all'];
        game.registry.set('game', state);
        const field = game.scene.getScene('Overworld') as BrowserField;
        field.events.once('create', resolve);
        field.scene.restart({ mapKey, spawnTile, exactSpawn: true });
      }),
    {
      areaId: area.areaId,
      islandId: area.islandId,
      legacy: legacyCleared,
      mapKey: `${area.areaId}-field`,
      spawnTile: tile,
      tileSize: TILE,
    },
  );
  await expect(page.locator('canvas[data-player-tile]')).toHaveAttribute('data-player-tile', tile.join(','), {
    timeout: 30_000,
  });
}

async function restartFieldAt(page: Page, tile: Tile): Promise<void> {
  await page.evaluate(
    ({ mapKey, spawnTile }) =>
      new Promise<void>((resolve) => {
        const game = (window as unknown as { __nq: BrowserGame }).__nq;
        const field = game.scene.getScene('Overworld') as BrowserField;
        field.events.once('create', resolve);
        field.scene.restart({ mapKey, spawnTile, exactSpawn: true });
      }),
    { mapKey: MAP_KEY, spawnTile: tile },
  );
  await expect(page.locator('canvas[data-player-tile]')).toHaveAttribute('data-player-tile', tile.join(','), {
    timeout: 30_000,
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}

test('地域ボス撃破を保存し、開いた関所から次地域の出現表へ進める', async ({ page }) => {
  test.setTimeout(300_000);
  const layout = resolveLayout();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));

  await createFreshSave(page);
  await seedNagasakiSave(page, layout.bossApproach.tile);
  await continueFromSlot(page, layout.bossApproach.tile);

  const before = await fieldSnapshot(page, layout.gate.openedBy);
  expect(before.currentRegion).toBe(layout.startRegion);
  expect(before.bossRegions).toContain(layout.startRegion);
  expect(before.gateOpen).toBe(false);
  expect(before.gateTexture).toBe('fld.gate.closed');

  await walkOne(page, layout.bossApproach.key, 'regionBoss');
  const yes = page.getByRole('menuitem', { name: 'はい' });
  for (let step = 0; step < 8 && !(await yes.isVisible()); step += 1) {
    await page.locator('.nq-dlg').click({ position: { x: 420, y: 410 } });
    await page.waitForTimeout(80);
  }
  await expect(yes).toBeVisible();
  await yes.click();
  await expect(page.locator('.nq-battle')).toBeVisible({ timeout: 30_000 });
  await defeatCurrentEnemy(page);
  await expect(page.locator('.nq-dlg')).toBeVisible({ timeout: 20_000 });
  await clickThroughDialogue(page);

  const flag = `regionboss.${AREA_ID}.${layout.startRegion}`;
  await expect
    .poll(async () => (await savedProgress(page)).eventsDone.includes(flag), { timeout: 20_000 })
    .toBe(true);
  const after = await fieldSnapshot(page, layout.gate.openedBy);
  expect(after.bossRegions).not.toContain(layout.startRegion);
  expect(after.gateOpen).toBe(true);
  expect(after.gateTexture).toBe('fld.gate.open');

  await restartFieldAt(page, layout.gate.startSide);
  await walkOne(page, layout.gate.enterKey, 'move');
  await walkOne(page, layout.gate.exitKey, 'move', layout.gate.nextSide);
  await expect
    .poll(() => fieldSnapshot(page, layout.gate.openedBy).then((snapshot) => snapshot.currentRegion))
    .toBe(layout.nextRegion);

  await restartFieldAt(page, layout.encounterTile);
  await expect
    .poll(() => fieldSnapshot(page, layout.gate.openedBy).then((snapshot) => snapshot.currentRegion))
    .toBe(layout.nextRegion);
  await page.evaluate((steps) => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    const field = game.scene.getScene('Overworld') as BrowserField;
    field.encounterPolicyState = {
      traversedSteps: 3,
      eligibleStepsSinceCheck: steps - 1,
      missedChecks: 0,
      cooldownStepsRemaining: 0,
    };
    field.rng.chance = () => true;
    field.checkRandomEncounter();
  }, layout.encounterSteps);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const game = (window as unknown as { __nq: BrowserGame }).__nq;
        return game.scene.isActive('Battle');
      }),
    )
    .toBe(true);
  const encountered = await page.evaluate(() => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    const battle = game.scene.getScene('Battle') as { state: { enemy: { refId: string } } };
    return battle.state.enemy.refId;
  });
  expect(layout.nextRegionMonsters).toContain(encountered);
  expect(errors).toEqual([]);
});

test('地域制導入前に長崎を進めた旧セーブは、地域ボスと閉鎖関所を復活させない', async ({ page }) => {
  test.setTimeout(150_000);
  const layout = resolveLayout();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));

  await createFreshSave(page);
  for (const [index, legacy] of (['areaSign', 'midBoss'] as const).entries()) {
    await seedNagasakiSave(page, layout.gate.startSide, legacy);
    await continueFromSlot(page, layout.gate.startSide);

    const progress = await savedProgress(page);
    expect(progress.areaSigns.includes(AREA_ID), `${legacy}: area sign`).toBe(legacy === 'areaSign');
    expect(progress.eventsDone.includes(`midboss.${AREA_ID}`), `${legacy}: midboss flag`).toBe(
      legacy === 'midBoss',
    );
    expect(progress.eventsDone.some((id) => id.startsWith(`regionboss.${AREA_ID}.`))).toBe(false);
    expect(progress.counters['dev:all']).toBeUndefined();
    const before = await fieldSnapshot(page, layout.gate.openedBy);
    expect(before.bossRegions, `${legacy}: bosses hidden`).toEqual([]);
    expect(before.gateOpen, `${legacy}: gate open`).toBe(true);
    expect(before.gateTexture, `${legacy}: gate texture`).toBe('fld.gate.open');

    await walkOne(page, layout.gate.enterKey, 'move');
    await walkOne(page, layout.gate.exitKey, 'move', layout.gate.nextSide);
    await expect
      .poll(() => fieldSnapshot(page, layout.gate.openedBy).then((snapshot) => snapshot.currentRegion))
      .toBe(layout.nextRegion);

    if (index === 0) {
      await page.reload();
      await expect(page.getByRole('menuitem', { name: 'つづきから' })).toBeEnabled({ timeout: 30_000 });
    }
  }
  expect(errors).toEqual([]);
});

test('最後の地域ボス撃破直後にダンジョン入口のロックと暗い表示を解除する', async ({ page }) => {
  test.setTimeout(150_000);
  const layout = resolveLayout();
  const defeatedBeforeFinal = layout.regionIds.filter((regionId) => regionId !== layout.finalRegion);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));

  await createFreshSave(page);
  await seedNagasakiSave(page, layout.dungeonApproach.tile, false, defeatedBeforeFinal);
  await continueFromSlot(page, layout.dungeonApproach.tile);

  expect(await regionalDungeonSnapshot(page)).toEqual({ isTinted: true, locked: true });
  await page.waitForTimeout(500);
  await walkOne(page, layout.dungeonApproach.key, 'move', layout.dungeonTile);
  await expect(page.locator('.nq-dlg')).toContainText(/まだ.*(?:地域|ちいき).*ぬし/, {
    timeout: 20_000,
  });
  expect(await currentMap(page)).toBe(MAP_KEY);
  await clickThroughDialogue(page);

  await restartFieldAt(page, layout.finalBossApproach.tile);
  await walkOne(page, layout.finalBossApproach.key, 'regionBoss');
  const yes = page.getByRole('menuitem', { name: 'はい' });
  for (let step = 0; step < 8 && !(await yes.isVisible()); step += 1) {
    await page.locator('.nq-dlg').click({ position: { x: 420, y: 410 } });
    await page.waitForTimeout(80);
  }
  await expect(yes).toBeVisible();
  await yes.click();
  await expect(page.locator('.nq-battle')).toBeVisible({ timeout: 30_000 });
  await defeatCurrentEnemy(page);
  await expect(page.locator('.nq-dlg')).toBeVisible({ timeout: 20_000 });
  const dialogue = await clickThroughDialogue(page);

  await expect
    .poll(
      async () =>
        (await savedProgress(page)).eventsDone.includes(`regionboss.${AREA_ID}.${layout.finalRegion}`),
      { timeout: 20_000 },
    )
    .toBe(true);
  expect(dialogue.join('\n')).toMatch(/ダンジョンへの.*ひらいた/);
  expect(await regionalDungeonSnapshot(page)).toEqual({ isTinted: false, locked: false });
  await restartFieldAt(page, layout.dungeonApproach.tile);
  await page.waitForTimeout(500);
  await walkIntoTransition(page, layout.dungeonApproach.key);
  await expect.poll(() => currentMap(page), { timeout: 20_000 }).toBe(`${AREA_ID}-dungeon`);
  expect(errors).toEqual([]);
});

test('開発者モードの切替直後に地域関所を通過でき、ダンジョン入口も同期する', async ({ page }) => {
  test.setTimeout(90_000);
  const area = REPRESENTATIVE_AREAS[0];
  const layout = resolveLayout(area.areaId);

  await createFreshSave(page);
  await continueFromSlot(page);
  await restartRepresentativeArea(page, area, layout.gate.startSide, false);

  expect(await regionalDungeonSnapshot(page)).toEqual({ isTinted: true, locked: true });
  expect((await allRegionalObjectsSnapshot(page)).gates.every((gate) => !gate.open)).toBe(true);

  await page.evaluate(() => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    (game.scene.getScene('Overworld') as BrowserField).toggleDev();
  });
  expect(await regionalDungeonSnapshot(page)).toEqual({ isTinted: false, locked: false });
  expect((await allRegionalObjectsSnapshot(page)).gates.every((gate) => gate.open)).toBe(true);
  await clickThroughDialogue(page);
  await walkOne(page, layout.gate.enterKey, 'move', layout.gate.tile);
  await walkOne(page, layout.gate.exitKey, 'move', layout.gate.nextSide);

  await page.evaluate(() => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    (game.scene.getScene('Overworld') as BrowserField).toggleDev();
  });
  expect(await regionalDungeonSnapshot(page)).toEqual({ isTinted: true, locked: true });
  expect((await allRegionalObjectsSnapshot(page)).gates.every((gate) => !gate.open)).toBe(true);
  await clickThroughDialogue(page);
});

test('開発者モードの切替直後に県境ワープを出し、歩いて次県へ進める', async ({ page }) => {
  test.setTimeout(90_000);
  const area = REPRESENTATIVE_AREAS[0];
  const layout = resolveLayout(area.areaId);

  await createFreshSave(page);
  await continueFromSlot(page);
  await restartRepresentativeArea(page, area, layout.midBossApproach.tile, false);

  const travelSnapshot = () =>
    page.evaluate(() => {
      const game = (window as unknown as { __nq: BrowserGame }).__nq;
      const field = game.scene.getScene('Overworld') as BrowserField;
      return {
        midBossTile: field.midBoss?.tile ?? null,
        warp: field.warp ? { tile: field.warp.tile, to: field.warp.to } : null,
      };
    });

  const initial = await travelSnapshot();
  expect(initial.midBossTile).not.toBeNull();
  expect(initial.warp).toBeNull();

  await page.evaluate(() => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    (game.scene.getScene('Overworld') as BrowserField).toggleDev();
  });
  await clickThroughDialogue(page);
  await expect.poll(async () => (await travelSnapshot()).warp?.to.id ?? null).toBe('miyagi');
  const enabled = await travelSnapshot();
  expect(enabled.midBossTile).toBeNull();
  expect(enabled.warp).toMatchObject({ to: { id: 'miyagi', mapKey: 'miyagi-field' } });
  expect(enabled.warp?.tile).toBe(initial.midBossTile);

  await page.evaluate(() => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    (game.scene.getScene('Overworld') as BrowserField).toggleDev();
  });
  await clickThroughDialogue(page);
  await expect.poll(travelSnapshot).toEqual({ midBossTile: initial.midBossTile, warp: null });
  expect(
    await page.evaluate(() => {
      const game = (window as unknown as { __nq: BrowserGame }).__nq;
      const state = game.registry.get('game') as { progress: { eventsDone: string[] } };
      return state.progress.eventsDone.includes('midboss.iwate');
    }),
  ).toBe(false);

  await page.evaluate(() => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    (game.scene.getScene('Overworld') as BrowserField).toggleDev();
  });
  await clickThroughDialogue(page);
  await expect.poll(async () => (await travelSnapshot()).warp?.to.id ?? null).toBe('miyagi');
  await walkOne(page, layout.midBossApproach.key, 'move');
  await clickThroughDialogue(page);
  await expect.poll(() => currentMap(page), { timeout: 20_000 }).toBe('miyagi-field');

  const terminalArea = REPRESENTATIVE_AREAS[1];
  const terminalLayout = resolveLayout(terminalArea.areaId);
  await page.evaluate(() => {
    const game = (window as unknown as { __nq: BrowserGame }).__nq;
    const state = game.registry.get('game') as { progress: { eventsDone: string[] } };
    state.progress.eventsDone.push('midboss.hokkaido');
    game.registry.set('game', state);
  });
  await restartRepresentativeArea(page, terminalArea, terminalLayout.midBossApproach.tile, false);
  await expect.poll(travelSnapshot).toEqual({ midBossTile: null, warp: null });
});

test('地域のぬしが残る間は中ボス戦を止め、全地域の撃破後は確認へ進む', async ({ page }) => {
  test.setTimeout(90_000);
  const layout = resolveLayout();
  const partialFlags = layout.regionIds.slice(0, -1);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));

  await createFreshSave(page);
  await seedNagasakiSave(page, layout.midBossApproach.tile, false, partialFlags);
  await continueFromSlot(page, layout.midBossApproach.tile);

  await walkOne(page, layout.midBossApproach.key, 'midboss');
  await expect(page.locator('.nq-dlg')).toContainText(/まだ.*(?:地域|ちいき).*ぬし/);
  await expect(page.locator('.nq-battle')).toHaveCount(0);
  await clickThroughDialogue(page);

  await page.evaluate(
    ({ areaId, regionIds }) => {
      const game = (window as unknown as { __nq: BrowserGame }).__nq;
      const state = game.registry.get('game') as { progress: { eventsDone: string[] } };
      state.progress.eventsDone = state.progress.eventsDone.filter(
        (id) => !id.startsWith(`regionboss.${areaId}.`),
      );
      state.progress.eventsDone.push(...regionIds.map((id) => `regionboss.${areaId}.${id}`));
      game.registry.set('game', state);
    },
    { areaId: AREA_ID, regionIds: layout.regionIds },
  );

  await walkOne(page, layout.midBossApproach.key, 'midboss');
  const yes = page.getByRole('menuitem', { name: 'はい' });
  for (let step = 0; step < 8 && !(await yes.isVisible()); step += 1) {
    await page.locator('.nq-dlg').click({ position: { x: 420, y: 410 } });
    await page.waitForTimeout(80);
  }
  await expect(yes).toBeVisible();
  await expect(page.locator('.nq-battle')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('各地方の代表県で開始地域・地域ボス・関所と旧セーブ互換が動く', async ({ page }) => {
  // 10県を新規・旧セーブの両方で再起動するため、低速なWebGL環境でも完走できる上限にする。
  test.setTimeout(360_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));

  await createFreshSave(page);
  await continueFromSlot(page);

  for (const area of REPRESENTATIVE_AREAS) {
    const layout = resolveLayout(area.areaId);

    await restartRepresentativeArea(page, area, layout.bossApproach.tile, false);
    const fresh = await allRegionalObjectsSnapshot(page);
    expect(fresh.currentRegion, `${area.areaId}: fresh start region`).toBe(layout.startRegion);
    expect(fresh.bossRegions, `${area.areaId}: fresh bosses`).toHaveLength(layout.regionCount);
    expect(fresh.bossRegions, `${area.areaId}: fresh start boss`).toContain(layout.startRegion);
    expect(fresh.gates.length, `${area.areaId}: fresh gate count`).toBeGreaterThan(0);
    expect(
      fresh.gates.every((gate) => !gate.open),
      `${area.areaId}: fresh gates closed`,
    ).toBe(true);
    expect(
      fresh.gates.every((gate) => gate.texture === 'fld.gate.closed'),
      `${area.areaId}: fresh gate textures`,
    ).toBe(true);

    await restartRepresentativeArea(page, area, layout.bossApproach.tile, true);
    const legacy = await allRegionalObjectsSnapshot(page);
    expect(legacy.currentRegion, `${area.areaId}: legacy start region`).toBe(layout.startRegion);
    expect(legacy.bossRegions, `${area.areaId}: legacy bosses hidden`).toEqual([]);
    expect(legacy.gates.length, `${area.areaId}: legacy gate count`).toBe(fresh.gates.length);
    expect(
      legacy.gates.every((gate) => gate.open),
      `${area.areaId}: legacy gates open`,
    ).toBe(true);
    expect(
      legacy.gates.every((gate) => gate.texture === 'fld.gate.open'),
      `${area.areaId}: legacy gate textures`,
    ).toBe(true);
  }

  expect(errors).toEqual([]);
});
