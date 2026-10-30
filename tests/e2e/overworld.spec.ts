import { expect, test, type Page } from '@playwright/test';
import { completeNewGameSetup } from './newGame';

interface SavedFieldState {
  inventory: Record<string, number>;
  progress: {
    currentIsland: string;
    currentArea: string;
    currentMap: string;
    position: { x: number; y: number };
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

async function interactByKeyAndTap(page: Page): Promise<void> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.locator('#game-root canvas').click({ position: { x: 480, y: 270 } });
  await page.keyboard.press('Enter');
}

async function finishDialogue(page: Page): Promise<void> {
  const dialogue = page.locator('.nq-dlg');
  for (let step = 0; step < 30 && (await dialogue.isVisible()); step += 1) {
    await dialogue.click({ position: { x: 420, y: 410 } });
    await page.waitForTimeout(60);
  }
  await expect(dialogue).toHaveCount(0);
}

async function reachChoices(page: Page): Promise<void> {
  const choices = page.locator('.nq-dlg-choices');
  for (let step = 0; step < 30 && !(await choices.isVisible()); step += 1) {
    await page.locator('.nq-dlg').click({ position: { x: 420, y: 410 } });
    await page.waitForTimeout(60);
  }
  await expect(choices).toBeVisible();
}

async function areaMapHeroPosition(page: Page): Promise<{ x: number; y: number }> {
  await page.getByRole('button', { name: /の ちずを ひらく$/, exact: true }).click();
  const hero = page.locator('.nq-wmap-hero');
  await expect(hero).toBeVisible();
  const box = await hero.boundingBox();
  if (!box) throw new Error('県の地図で主人公の位置を取得できませんでした');
  await page.getByRole('button', { name: /とじる/ }).click();
  return { x: box.x, y: box.y };
}

async function savedState(page: Page): Promise<SavedFieldState> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('nihonquest');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const state = await new Promise<SavedFieldState>((resolve, reject) => {
      const request = database.transaction('saves').objectStore('saves').get('save:1');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    database.close();
    return state;
  });
}

async function walkOneTile(page: Page, key: 'ArrowUp' | 'ArrowDown'): Promise<void> {
  const canvas = page.locator('canvas[data-player-tile]');
  const before = await canvas.getAttribute('data-player-tile');
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await canvas.evaluate((element) => delete (element as HTMLElement).dataset.lastMovement);
    await page.keyboard.press(key);
    await page.waitForTimeout(300);
    const decision = await canvas.getAttribute('data-last-movement');
    const after = await canvas.getAttribute('data-player-tile');
    if (decision === 'move' && after !== before) return;
  }
  throw new Error(`${before} から ${key} で一歩進めませんでした`);
}

async function skipArrivalStory(page: Page): Promise<void> {
  const story = page.getByRole('dialog', { name: 'ものがたりの シーン' });
  await expect(story).toBeVisible({ timeout: 10_000 });
  await story.getByRole('button', { name: 'スキップ' }).click();
  await expect(story).toHaveCount(0);
  await expect(page.locator('.nq-dlg')).toBeVisible({ timeout: 10_000 });
  await finishDialogue(page);
}

async function suppressFadeCompletionAndCountRestarts(page: Page): Promise<void> {
  await page.evaluate(() => {
    const browser = window as unknown as {
      Phaser: {
        Events: { EventEmitter: { prototype: { emit: (event: string, ...args: unknown[]) => boolean } } };
        Scenes: { ScenePlugin: { prototype: { restart: (...args: unknown[]) => unknown } } };
      };
      __mapTransitionRestarts?: number;
    };
    const emitter = browser.Phaser.Events.EventEmitter.prototype;
    const originalEmit = emitter.emit;
    emitter.emit = function (event: string, ...args: unknown[]) {
      if (event === 'camerafadeoutcomplete') return false;
      return originalEmit.call(this, event, ...args);
    };

    const scenePlugin = browser.Phaser.Scenes.ScenePlugin.prototype;
    const originalRestart = scenePlugin.restart;
    browser.__mapTransitionRestarts = 0;
    scenePlugin.restart = function (...args: unknown[]) {
      browser.__mapTransitionRestarts = (browser.__mapTransitionRestarts ?? 0) + 1;
      return originalRestart.apply(this, args);
    };
  });
}

test('フィールドと町を往復すると対応する入口へ配置されて操作が戻る', async ({ page }) => {
  test.setTimeout(90_000);
  await startField(page);

  await walkOneTile(page, 'ArrowUp');
  await walkOneTile(page, 'ArrowUp');
  await expect
    .poll(async () => (await savedState(page)).progress, { timeout: 10_000 })
    .toMatchObject({ currentMap: 'aomori-town', position: { x: 400, y: 560 } });
  await skipArrivalStory(page);

  await page.waitForTimeout(450);
  await walkOneTile(page, 'ArrowDown');
  await walkOneTile(page, 'ArrowDown');
  await walkOneTile(page, 'ArrowDown');
  await expect
    .poll(async () => (await savedState(page)).progress, { timeout: 10_000 })
    .toMatchObject({ currentMap: 'aomori-field', position: { x: 976, y: 1088 } });

  await page.waitForTimeout(450);
  await walkOneTile(page, 'ArrowUp');
  await expect
    .poll(async () => (await savedState(page)).progress, { timeout: 10_000 })
    .toMatchObject({ currentMap: 'aomori-town', position: { x: 400, y: 560 } });
});

test('フィールドとダンジョンを往復すると対応する入口へ配置される', async ({ page }) => {
  test.setTimeout(90_000);
  await startField(page);
  await teleport(page, [84, 24], { area: 'aomori', map: 'aomori-field', devAll: true });

  await walkOneTile(page, 'ArrowUp');
  await expect
    .poll(async () => (await savedState(page)).progress, { timeout: 10_000 })
    .toMatchObject({ currentMap: 'aomori-dungeon', position: { x: 400, y: 560 } });

  await page.waitForTimeout(450);
  await walkOneTile(page, 'ArrowDown');
  await walkOneTile(page, 'ArrowDown');
  await walkOneTile(page, 'ArrowDown');
  await expect
    .poll(async () => (await savedState(page)).progress, { timeout: 10_000 })
    .toMatchObject({ currentMap: 'aomori-field', position: { x: 1344, y: 384 } });
});

test('船頭に頼んで県フィールドから離島へ移動する', async ({ page }) => {
  test.setTimeout(90_000);
  await startField(page);
  await teleport(page, [28, 61], {
    area: 'kagoshima',
    map: 'kagoshima-field',
    island: 'kyushu-okinawa',
  });

  await page.keyboard.press('ArrowUp');
  await interactByKeyAndTap(page);
  await expect(page.locator('.nq-dlg')).toBeVisible();
  await reachChoices(page);
  await page.getByRole('menuitem', { name: 'はい' }).click();
  await finishDialogue(page);
  await expect
    .poll(async () => (await savedState(page)).progress, { timeout: 10_000 })
    .toMatchObject({ currentMap: 'kagoshima-enclave', position: { x: 128, y: 528 } });
});

test('敗北後はフィールドの出発地点へ戻り、導入演出を再開せず入力が復帰する', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/?debug=battle&enemy=aomori-ringoron&lv=99');
  await expect(page.locator('.nq-battle')).toBeVisible({ timeout: 20_000 });
  await expect
    .poll(() =>
      page.evaluate(() => {
        const game = (window as unknown as { __nq: Phaser.Game }).__nq;
        const scene = game.scene.getScene('Overworld') as Phaser.Scene & {
          encounters: { active: { id: string } | null };
        };
        return scene.encounters.active?.id ?? null;
      }),
    )
    .not.toBeNull();
  await page.evaluate(() => {
    const game = (window as unknown as { __nq: Phaser.Game }).__nq;
    const scene = game.scene.getScene('Overworld') as Phaser.Scene & {
      encounters: { active: { id: string } | null };
    };
    const state = game.registry.get('game') as {
      progress: { counters: Record<string, number>; eventsDone: string[] };
    };
    game.registry.set('game', {
      ...state,
      progress: {
        ...state.progress,
        // 完了済みチュートリアルは導入を見終えた証拠。旧セーブでカウンターが欠けても再演しない。
        counters: { ...state.progress.counters, 'story.prologue': 0 },
        eventsDone: [...new Set([...state.progress.eventsDone, 'tutorial.battle-basics'])],
      },
    });
    const encounterId = scene.encounters.active!.id;
    const result = { outcome: 'defeat' as const, goldLost: 0 };
    const current = game.registry.get('game');
    game.registry.set('game', {
      ...current,
      battle: { ...current.battle, active: null },
    });
    game.events.emit('battle:end', { encounterId, result });
  });
  await expect(page.locator('.nq-battle')).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByRole('dialog', { name: 'ものがたりの シーン' })).toHaveCount(0);
  await page.waitForTimeout(1_000);
  await page.getByRole('button', { name: 'メニュー' }).click();
  await page.getByRole('button', { name: 'がくしゅう' }).click();
  await expect(page.getByRole('region', { name: 'がくしゅうロードマップ' })).toBeVisible();
});

test('fade 完了がなく連打されても fallback で一度だけ町へ移動する', async ({ page }) => {
  test.setTimeout(90_000);
  await startField(page);
  await suppressFadeCompletionAndCountRestarts(page);

  await walkOneTile(page, 'ArrowUp');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(180);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowUp');

  await expect
    .poll(async () => (await savedState(page)).progress, { timeout: 10_000 })
    .toMatchObject({ currentMap: 'aomori-town', position: { x: 400, y: 560 } });
  expect(
    await page.evaluate(
      () => (window as unknown as { __mapTransitionRestarts?: number }).__mapTransitionRestarts,
    ),
  ).toBe(1);
});

test('にほんちずで移動した後に入力が戻る', async ({ page }) => {
  test.setTimeout(90_000);
  await startField(page);

  await page.getByRole('button', { name: /の ちずを ひらく$/, exact: true }).click();
  await page.getByRole('button', { name: 'にほんちず' }).click();
  await page.getByRole('button', { name: /この ちほうを くわしく みる/ }).click();
  await page.getByRole('button', { name: /ここへ.*いく/ }).click();
  await expect(page.getByRole('button', { name: 'メニュー' })).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'メニュー' }).click();
  await page.getByRole('button', { name: 'がくしゅう' }).click();
  await expect(page.getByRole('region', { name: 'がくしゅうロードマップ' })).toBeVisible();
});

test('名所はキーとタップを重ねても一度だけ始まり、閉じた後に移動できる', async ({ page }) => {
  test.setTimeout(180_000);
  await startField(page);
  await teleport(page, [58, 66]);

  await interactByKeyAndTap(page);
  await expect(page.locator('.nq-cutin')).toHaveCount(1);
  await expect(page.locator('.nq-cutin')).toContainText('ねぶた');

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(350);
  await page.keyboard.up('ArrowRight');
  await page.locator('.nq-cutin').click();
  await expect(page.locator('.nq-dlg')).toBeVisible();
  await finishDialogue(page);

  const lockedPosition = await areaMapHeroPosition(page);
  await page.waitForTimeout(300);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(350);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(250);
  const releasedPosition = await areaMapHeroPosition(page);
  expect(releasedPosition.x).toBeGreaterThan(lockedPosition.x);
});

test('宝箱はキーとタップを重ねても報酬を一度だけ与え、完了後に再び調べられる', async ({ page }) => {
  test.setTimeout(180_000);
  await startField(page);
  // 宝箱そのもののマスは動的 collision で復帰先にしない。左の道から右を向いて調べる。
  await teleport(page, [122, 99]);
  await page.keyboard.press('ArrowRight');

  await interactByKeyAndTap(page);
  await expect(page.locator('.nq-cutin')).toHaveCount(1);
  await page.locator('.nq-cutin').click();
  await expect(page.locator('.nq-dlg')).toBeVisible();
  await finishDialogue(page);

  await expect
    .poll(async () => {
      const state = await savedState(page);
      return {
        apples: state.inventory['aomori-ringo'] ?? 0,
        opened: state.progress.chestsOpened.filter((key) => key === 'aomori-field:chest_aomori_field').length,
      };
    })
    .toEqual({ apples: 1, opened: 1 });

  await page.waitForTimeout(300);
  await interactByKeyAndTap(page);
  await expect(page.locator('.nq-dlg')).toContainText('からっぽ');
  await finishDialogue(page);
  expect((await savedState(page)).inventory['aomori-ringo']).toBe(1);
});

test('通常イベントはキーとタップを重ねても選択肢を一度だけ出し、見送った後に再開できる', async ({ page }) => {
  test.setTimeout(180_000);
  await startField(page);
  await teleport(page, [41, 87]);

  await interactByKeyAndTap(page);
  await expect(page.locator('.nq-cutin')).toHaveCount(1);
  await page.locator('.nq-cutin').click();
  await reachChoices(page);
  await expect(page.locator('.nq-dlg-choices')).toHaveCount(1);
  await page.getByRole('menuitem', { name: 'いいえ' }).click();
  await finishDialogue(page);
  expect((await savedState(page)).progress.eventsDone).not.toContain('aomori-ev-ringoen');

  await page.waitForTimeout(300);
  await interactByKeyAndTap(page);
  await expect(page.locator('.nq-cutin')).toHaveCount(0);
  await reachChoices(page);
  await expect(page.locator('.nq-dlg-choices')).toHaveCount(1);
});

test('scripted イベントは選択→問題→score 0 報酬→完了 flag を実行する', async ({ page }) => {
  test.setTimeout(120_000);
  await startField(page);
  await teleport(page, [41, 87]);

  await interactByKeyAndTap(page);
  await page.locator('.nq-cutin').click();
  await reachChoices(page);
  await page.getByRole('menuitem', { name: 'はい' }).click();
  await expect(page.locator('.nq-q')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'こたえる' }).click();
  await expect(page.locator('.nq-q')).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator('.nq-dlg')).toBeVisible();
  await finishDialogue(page);

  await expect
    .poll(async () => {
      const state = await savedState(page);
      return {
        apples: state.inventory['aomori-ringo'] ?? 0,
        completed: state.progress.eventsDone.includes('aomori-ev-ringoen'),
      };
    })
    .toEqual({ apples: 1, completed: true });
});

test('scripted movement は実在NPCを予約して1マス動かし、完了後に操作状態を戻す', async ({ page }) => {
  test.setTimeout(120_000);
  await startField(page);
  await teleport(page, [41, 87]);
  const expected = await page.evaluate(() => {
    const game = (window as unknown as { __nq: Phaser.Game }).__nq;
    const scene = game.scene.getScene('Overworld') as Phaser.Scene & {
      map: { width: number; height: number };
      player: Phaser.GameObjects.Sprite;
      npcs: Map<
        number,
        {
          key: string;
          role: string;
          name: string;
          lines: [];
          home: [number, number];
          moving: boolean;
          nextMoveAt: number;
          targetTile?: number;
          sprite: Phaser.GameObjects.Sprite;
          shadow: Phaser.GameObjects.Image;
        }
      >;
      blocked: Set<number>;
      transitions: Map<number, unknown>;
      isBlocked(x: number, y: number): boolean;
    };
    const content = game.registry.get('content') as {
      areas: Map<string, { events: Array<Record<string, unknown>> }>;
    };
    const directions = [
      { direction: 'down', dx: 0, dy: 1 },
      { direction: 'left', dx: -1, dy: 0 },
      { direction: 'right', dx: 1, dy: 0 },
      { direction: 'up', dx: 0, dy: -1 },
    ] as const;
    const player = [Math.floor(scene.player.x / 16), Math.floor(scene.player.y / 16)];
    const open = Array.from({ length: scene.map.height - 2 }, (_, y) => y + 1).flatMap((y) =>
      Array.from({ length: scene.map.width - 2 }, (_, x) => x + 1).flatMap((x) =>
        directions.map(({ direction, dx, dy }) => ({
          direction,
          fromX: x,
          fromY: y,
          x: x + dx,
          y: y + dy,
        })),
      ),
    );
    const candidate = open.find(({ fromX, fromY, x, y }) => {
      const fromTile = fromY * scene.map.width + fromX;
      const toTile = y * scene.map.width + x;
      return (
        !scene.isBlocked(fromX, fromY) &&
        !scene.isBlocked(x, y) &&
        !scene.transitions.has(fromTile) &&
        !scene.transitions.has(toTile) &&
        (player[0] !== fromX || player[1] !== fromY) &&
        (player[0] !== x || player[1] !== y)
      );
    });
    if (!candidate) throw new Error('scripted movement fixture に使える空きマスがありません');
    const objectId = 'e2e-scripted-npc';
    const fromTile = candidate.fromY * scene.map.width + candidate.fromX;
    const sprite = scene.add
      .sprite(
        candidate.fromX * 16 + 8,
        candidate.fromY * 16 + 8,
        scene.player.texture.key,
        scene.player.frame.name,
      )
      .setDepth(candidate.fromY * 16 + 8);
    const shadow = scene.add.image(sprite.x, sprite.y + 6, 'fld.shadow').setDepth(1);
    scene.npcs.set(fromTile, {
      key: objectId,
      role: 'fixture',
      name: '',
      lines: [],
      home: [candidate.fromX, candidate.fromY],
      moving: false,
      nextMoveAt: Number.POSITIVE_INFINITY,
      sprite,
      shadow,
    });
    scene.blocked.add(fromTile);
    const event = content.areas.get('aomori')!.events.find((entry) => entry.id === 'aomori-ev-ringoen')!;
    event.steps = [
      {
        type: 'movement',
        objectId,
        commands: [
          { type: 'face', direction: candidate.direction },
          { type: 'walk', direction: candidate.direction },
          { type: 'emote', emote: '!' },
          { type: 'hide' },
          { type: 'show' },
          { type: 'wait', durationMs: 20 },
        ],
      },
    ];
    return {
      objectId,
      tile: candidate.y * scene.map.width + candidate.x,
      x: candidate.x * 16 + 8,
      y: candidate.y * 16 + 8,
    };
  });

  await page.evaluate(() => {
    const game = (window as unknown as { __nq: Phaser.Game }).__nq;
    const scene = game.scene.getScene('Overworld') as Phaser.Scene & {
      triggers: Map<number, { id: string; run: () => Promise<void> }>;
    };
    const trigger = [...scene.triggers.values()].find(({ id }) => id === 'aomori-ev-ringoen');
    if (!trigger) throw new Error('scripted movement fixture のevent triggerがありません');
    void trigger.run();
  });
  await expect(page.locator('.nq-cutin')).toBeVisible({ timeout: 10_000 });
  await page.locator('.nq-cutin').click();
  await expect(page.locator('.nq-dlg')).toBeVisible();
  await finishDialogue(page);

  await expect
    .poll(() =>
      page.evaluate((objectId) => {
        const game = (window as unknown as { __nq: Phaser.Game }).__nq;
        const scene = game.scene.getScene('Overworld') as Phaser.Scene & {
          npcs: Map<number, { key: string; moving: boolean; sprite: Phaser.GameObjects.Sprite }>;
          fieldFlow: { isRunning: boolean };
        };
        const entry = [...scene.npcs.entries()].find(([, npc]) => npc.key === objectId);
        return entry
          ? {
              tile: entry[0],
              x: entry[1].sprite.x,
              y: entry[1].sprite.y,
              visible: entry[1].sprite.visible,
              moving: entry[1].moving,
              flowRunning: scene.fieldFlow.isRunning,
            }
          : null;
      }, expected.objectId),
    )
    .toEqual({
      tile: expected.tile,
      x: expected.x,
      y: expected.y,
      visible: true,
      moving: false,
      flowRunning: false,
    });
});

test('scripted battle→warp は encounter lifecycle と transition pipeline を一度ずつ通る', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await startField(page);
  await teleport(page, [41, 87]);
  await suppressFadeCompletionAndCountRestarts(page);
  await page.evaluate(() => {
    const game = (window as unknown as { __nq: Phaser.Game }).__nq;
    const content = game.registry.get('content') as {
      areas: Map<string, { events: Array<Record<string, unknown>> }>;
    };
    const event = content.areas
      .get('aomori')!
      .events.find((candidate) => candidate.id === 'aomori-ev-ringoen')!;
    event.steps = [
      {
        type: 'battle',
        key: 'fight',
        enemyId: 'aomori-ringoron',
        level: 1,
        isBoss: true,
      },
      {
        type: 'branch',
        condition: { type: 'battle', key: 'fight', outcome: 'victory' },
        then: [{ type: 'warp', map: 'aomori-town', spawn: 'door_field' }],
      },
    ];
  });

  await interactByKeyAndTap(page);
  await page.locator('.nq-cutin').click();
  await expect(page.locator('.nq-dlg')).toBeVisible();
  await finishDialogue(page);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const game = (window as unknown as { __nq: Phaser.Game }).__nq;
        const scene = game.scene.getScene('Overworld') as Phaser.Scene & {
          encounters: { active: { id: string } | null };
        };
        return scene.encounters.active?.id ?? null;
      }),
    )
    .not.toBeNull();
  await page.evaluate(() => {
    const game = (window as unknown as { __nq: Phaser.Game }).__nq;
    const scene = game.scene.getScene('Overworld') as Phaser.Scene & {
      encounters: { active: { id: string } | null };
    };
    const encounterId = scene.encounters.active!.id;
    const result = { encounterId, result: { outcome: 'victory', goldLost: 0 } };
    game.events.emit('battle:end', result);
    game.events.emit('battle:end', result);
  });

  await expect
    .poll(async () => (await savedState(page)).progress.currentMap, { timeout: 15_000 })
    .toBe('aomori-town');
  expect(
    await page.evaluate(
      () => (window as unknown as { __mapTransitionRestarts?: number }).__mapTransitionRestarts,
    ),
  ).toBe(1);
});

test('開発者モードのメニューから問題一覧と問題編集を開ける', async ({ page }) => {
  test.setTimeout(90_000);
  await startField(page);

  await page.getByRole('button', { name: 'かいはつしゃ', exact: true }).click();
  await finishDialogue(page);
  await page.getByRole('button', { name: 'メニュー', exact: true }).click();

  const menu = page.getByRole('dialog', { name: 'メニュー' });
  await expect(menu.getByRole('link', { name: 'もんだいいちらん' })).toHaveAttribute(
    'href',
    '/playground.html',
  );
  await expect(menu.getByRole('link', { name: 'もんだいへんしゅう' })).toHaveAttribute(
    'href',
    '/playground.html',
  );
});
