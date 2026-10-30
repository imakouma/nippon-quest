import { expect, test, type Page } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

async function startField(page: Page): Promise<void> {
  await page.goto('/?resetSaves=1');
  await page.getByRole('menuitem', { name: /はじめから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await completeNewGameSetup(page, 'ハル');
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
}

async function continueSlot(page: Page): Promise<void> {
  await page.reload();
  await expect(page.getByRole('menuitem', { name: /つづきから/ })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('menuitem', { name: /つづきから/ }).click();
  await page.getByRole('button', { name: /スロット 1/ }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 30_000 });
}

async function savedProgress(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nihonquest');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const progress = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const request = database.transaction('saves').objectStore('saves').get('save:1');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.progress);
    });
    database.close();
    return progress;
  });
}

test('歩行位置・向き・歩き回る町人の位置/向き/表示を保存して再読込する', async ({ page }) => {
  test.setTimeout(120_000);
  await startField(page);

  await page.evaluate(() => {
    const game = window.__nq;
    const state = game.registry.get('game');
    game.registry.set('game', {
      ...state,
      progress: {
        ...state.progress,
        currentMap: 'aomori-town',
        position: { x: 25 * 16, y: 35 * 16 },
        counters: { ...state.progress.counters, 'story.prologue': 1, 'visit:aomori-town': 1 },
      },
    });
    game.scene.getScene('Overworld').scene.restart({
      transitionRequest: { targetMap: 'aomori-town', reason: 'script' },
    });
  });
  await expect(page.locator('#game-root canvas')).toHaveAttribute('data-player-tile', '25,35', {
    timeout: 30_000,
  });

  const expected = await page.evaluate(() => {
    const field = window.__nq.scene.getScene('Overworld') as Phaser.Scene & {
      map: Phaser.Tilemaps.Tilemap;
      player: Phaser.GameObjects.Sprite;
      facing: 'down' | 'left' | 'right' | 'up';
      npcs: Map<
        number,
        {
          key: string;
          persistState: boolean;
          tile: number;
          home: [number, number];
          facing: 'down' | 'left' | 'right' | 'up';
          sprite: Phaser.GameObjects.Sprite;
          shadow: Phaser.GameObjects.Image;
        }
      >;
      blocked: Set<number>;
      face(direction: 'right'): void;
      idx(x: number, y: number): number;
      isBlocked(x: number, y: number): boolean;
      checkpointField(): void;
    };
    const npc = [...field.npcs.values()].find((candidate) => candidate.persistState);
    if (!npc) throw new Error('persistState: true の NPC was not registered');
    const homeTiles = new Set([...field.npcs.values()].map((candidate) => field.idx(...candidate.home)));
    let target: [number, number] | undefined;
    for (let y = 1; y < field.map.height - 1 && !target; y += 1)
      for (let x = 1; x < field.map.width - 1; x += 1)
        if (!field.isBlocked(x, y) && !homeTiles.has(field.idx(x, y)) && (x !== 25 || y !== 35)) {
          target = [x, y];
          break;
        }
    if (!target) throw new Error('safe NPC restore tile was not found');
    field.npcs.delete(npc.tile);
    field.blocked.delete(npc.tile);
    npc.tile = field.idx(...target);
    npc.facing = 'left';
    npc.sprite
      .setPosition(target[0] * 16 + 8, target[1] * 16 + 8)
      .setFrame(4)
      .setVisible(false);
    npc.shadow.setPosition(target[0] * 16 + 8, target[1] * 16 + 14).setVisible(false);
    field.face('right');
    field.checkpointField();
    return { name: npc.key, tileX: target[0], tileY: target[1] };
  });

  await expect
    .poll(async () => savedProgress(page), { timeout: 10_000 })
    .toMatchObject({
      currentMap: 'aomori-town',
      position: { x: 25 * 16, y: 35 * 16 },
      fieldSnapshot: {
        facing: 'right',
        objects: {
          [`aomori-town:${expected.name}`]: {
            map: 'aomori-town',
            tileX: expected.tileX,
            tileY: expected.tileY,
            facing: 'left',
            visible: false,
          },
        },
      },
    });

  await continueSlot(page);
  await expect(page.locator('#game-root canvas')).toHaveAttribute('data-player-tile', '25,35', {
    timeout: 30_000,
  });
  await expect
    .poll(() =>
      page.evaluate((name) => {
        const field = window.__nq.scene.getScene('Overworld') as Phaser.Scene & {
          facing: string;
          fieldResume: {
            objects: Array<{ definition: { name: string }; read(): Record<string, unknown> }>;
          };
        };
        return {
          facing: field.facing,
          npc: field.fieldResume.objects.find((object) => object.definition.name === name)?.read(),
        };
      }, expected.name),
    )
    .toEqual({
      facing: 'right',
      npc: {
        name: expected.name,
        persistState: true,
        tileX: expected.tileX,
        tileY: expected.tileY,
        facing: 'left',
        visible: false,
      },
    });
});

test('削除済みマップのセーブは現エリアの field 既定 spawn へ戻す', async ({ page }) => {
  test.setTimeout(120_000);
  await startField(page);
  await page.evaluate(async () => {
    const state = structuredClone(window.__nq.registry.get('game'));
    state.progress.currentMap = 'deleted-aomori-map';
    state.progress.position = { x: 9_999, y: 9_999 };
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nihonquest');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const store = database.transaction('saves', 'readwrite').objectStore('saves');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(state, 'save:1');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
    database.close();
  });

  await continueSlot(page);
  await expect
    .poll(() => page.evaluate(() => window.__nq.registry.get('game').progress.currentMap))
    .toBe('aomori-field');
  await expect(page.locator('#game-root canvas')).toHaveAttribute('data-player-tile', '61,69', {
    timeout: 30_000,
  });
});
