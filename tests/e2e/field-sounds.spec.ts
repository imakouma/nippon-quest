import { expect, test, type Page } from '@playwright/test';
import type Phaser from 'phaser';

interface Field extends Phaser.Scene {
  map: Phaser.Tilemaps.Tilemap;
  mapKey: string;
  player: Phaser.GameObjects.Sprite;
  blocked: Set<number>;
  transitions: Map<number, { map: string; spawn: string }>;
  chests: Map<number, { key: string; specialty?: unknown }>;
  triggers: Map<number, unknown>;
  moving: boolean;
  busy: boolean;
  inBattle: boolean;
  canWarp: boolean;
  inputLockUntil: number;
  playerLocomotion: {
    logicalTile: { x: number; y: number };
    present(): void;
  };
  fieldInput: { setTouchDirection(direction: 'right' | null): void };
  isBlocked(x: number, y: number): boolean;
  arrive(x: number, y: number): void;
  openChest(chest: unknown): Promise<void>;
}
declare global {
  interface Window {
    __fieldPlayed: { name: string; duration: number; gain: number }[];
    __fieldDecoded: string[];
    __fieldContext?: AudioContext;
  }
}

async function prepareWalk(page: Page, tile = 1, wall = false): Promise<void> {
  await page.evaluate(
    ({ tile, wall }) => {
      const field = window.__nq.scene.getScene('Overworld') as Field;
      for (let y = 2; y < field.map.height - 2; y++) {
        for (let x = 2; x < field.map.width - 6; x++) {
          const cells = Array.from({ length: 6 }, (_, n) => x + n + y * field.map.width);
          if (
            cells.some(
              (i, n) => field.isBlocked(x + n, y) || field.transitions.has(i) || field.triggers.has(i),
            )
          )
            continue;
          field.player.setPosition(x * 16 + 8, y * 16 + 8);
          field.playerLocomotion.logicalTile = { x, y };
          field.playerLocomotion.present();
          field.map.putTileAt(tile, x + 1, y, false, 'background');
          field.busy = false;
          field.inBattle = false;
          field.inputLockUntil = 0;
          if (wall) field.blocked.add(cells[1]!);
          (document.activeElement as HTMLElement | null)?.blur();
          return;
        }
      }
      throw new Error('No safe walking corridor');
    },
    { tile, wall },
  );
}

async function playOneStep(page: Page, before: number): Promise<void> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await page.evaluate(async () => {
      const field = window.__nq.scene.getScene('Overworld') as Field;
      field.fieldInput.setTouchDirection('right');
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      field.fieldInput.setTouchDirection(null);
    });
    await page.waitForTimeout(300);
    if ((await page.evaluate(() => window.__fieldPlayed.length)) > before) return;
  }
  throw new Error('一歩分の効果音が再生されませんでした');
}

test('実音源をデコードし、歩行・停止・壁・消音・入口・宝箱へ効果音を同期する', async ({ page }, info) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('response', (response) => {
    if (/\/audio\/se\/(step-[^/]+|door|chest)\.mp3$/.test(response.url())) {
      requests.push(response.url());
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.addInitScript(() => {
    window.__fieldPlayed = [];
    window.__fieldDecoded = [];
    const dataNames = new WeakMap<ArrayBuffer, string>();
    const bufferNames = new WeakMap<AudioBuffer, string>();
    const originalArrayBuffer = Response.prototype.arrayBuffer;
    Response.prototype.arrayBuffer = async function () {
      const data = await originalArrayBuffer.call(this);
      if (this.url.includes('/audio/se/')) dataNames.set(data, this.url.split('/').at(-1)!);
      return data;
    };
    const originalDecode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = async function (data) {
      const name = dataNames.get(data);
      const buffer = await originalDecode.call(this, data);
      if (name && /^(step-|door\.|chest\.)/.test(name)) {
        bufferNames.set(buffer, name);
        window.__fieldDecoded.push(name);
      }
      return buffer;
    };
    const originalSource = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      window.__fieldContext = this;
      const source = originalSource.call(this);
      const originalStart = source.start.bind(source);
      const originalConnect = source.connect.bind(source);
      let gain = 0;
      source.connect = ((target: AudioNode) => {
        if (target instanceof GainNode) gain = target.gain.value;
        return originalConnect(target);
      }) as typeof source.connect;
      source.start = (...args) => {
        const name = source.buffer && bufferNames.get(source.buffer);
        if (name) window.__fieldPlayed.push({ name, duration: source.buffer!.duration, gain });
        originalStart(...args);
      };
      return source;
    };
  });
  await page.goto('/?debug=battle');
  await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
  await page.locator('.nq-box').click();
  await expect.poll(() => page.evaluate(() => window.__fieldDecoded.length)).toBe(6);
  await page.evaluate(() => {
    const game = window.__nq;
    const state = game.registry.get('game');
    game.registry.set('game', {
      ...state,
      progress: {
        ...state.progress,
        counters: { ...state.progress.counters, 'story.prologue': 1, 'dev:all': 1 },
      },
      battle: { ...state.battle, active: null },
    });
    const battle = game.scene.getScene('Battle') as Phaser.Scene & {
      leave(outcome: string, gold: number): Promise<void>;
    };
    void battle.leave('fled', 0);
  });
  await expect.poll(() => page.evaluate(() => window.__nq.scene.isActive('Battle'))).toBe(false);
  await expect(page.getByRole('button', { name: 'メニュー', exact: true })).toBeVisible();
  for (const [tile, name] of [
    [1, 'step-grass.mp3'],
    [147, 'step-sand.mp3'],
    [151, 'step-stone.mp3'],
    [153, 'step-water.mp3'],
  ] as const) {
    await prepareWalk(page, tile);
    const before = await page.evaluate(() => window.__fieldPlayed.length);
    await playOneStep(page, before);
    expect(await page.evaluate((i) => window.__fieldPlayed[i]?.name, before)).toBe(name);
    await expect
      .poll(() => page.evaluate(() => (window.__nq.scene.getScene('Overworld') as Field).moving))
      .toBe(false);
  }
  const stopped = await page.evaluate(() => window.__fieldPlayed.length);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__fieldPlayed.length)).toBe(stopped);
  await prepareWalk(page, 1, true);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__fieldPlayed.length)).toBe(stopped);
  await page.evaluate(() => {
    const game = window.__nq;
    const state = game.registry.get('game');
    game.registry.set('game', { ...state, settings: { ...state.settings, seVolume: 0 } });
  });
  await prepareWalk(page);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  await expect
    .poll(() => page.evaluate(() => (window.__nq.scene.getScene('Overworld') as Field).moving))
    .toBe(false);
  expect(await page.evaluate(() => window.__fieldPlayed.length)).toBe(stopped);
  await page.evaluate(() => {
    const game = window.__nq;
    const state = game.registry.get('game');
    game.registry.set('game', { ...state, settings: { ...state.settings, seVolume: 0.4 } });
    const field = game.scene.getScene('Overworld') as Field;
    const entrance = [...field.transitions].find(([, tr]) => tr.map.endsWith('-town'))!;
    field.canWarp = true;
    field.arrive(entrance[0] % field.map.width, Math.floor(entrance[0] / field.map.width));
  });
  await expect
    .poll(() => page.evaluate(() => (window.__nq.scene.getScene('Overworld') as Field).mapKey))
    .toBe('aomori-town');
  expect(await page.evaluate(() => window.__fieldPlayed.at(-1)?.name)).toBe('door.mp3');
  await page.evaluate(() => {
    window.__nq.scene.getScene('Overworld').scene.restart({ mapKey: 'aomori-field' });
  });
  await expect
    .poll(() => page.evaluate(() => (window.__nq.scene.getScene('Overworld') as Field).mapKey))
    .toBe('aomori-field');
  await page.evaluate(() => {
    const field = window.__nq.scene.getScene('Overworld') as Field;
    const chest = [...field.chests.values()].find((chest) => !chest.specialty)!;
    void field.openChest(chest);
  });
  await expect.poll(() => page.evaluate(() => window.__fieldPlayed.at(-1)?.name)).toBe('chest.mp3');
  const played = await page.evaluate(() => window.__fieldPlayed);
  expect(
    played
      .filter((sound) => sound.name.startsWith('step-'))
      .every((sound) => sound.duration <= 0.16 && sound.gain <= 0.3),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath('exploration-sounds.png') });
  // 開封済みセーブ状態を用意し、同じ宝箱を調べても開封音を再生しない。
  await page.evaluate(() => {
    window.__nq.scene.getScene('Overworld').scene.restart({ mapKey: 'aomori-field' });
  });
  await expect(page.locator('.nq-cutin')).toHaveCount(0);
  await page.evaluate(() => {
    const game = window.__nq;
    const field = game.scene.getScene('Overworld') as Field;
    const chest = [...field.chests.values()].find((chest) => !chest.specialty)!;
    const state = game.registry.get('game');
    game.registry.set('game', {
      ...state,
      progress: { ...state.progress, chestsOpened: [...state.progress.chestsOpened, chest.key] },
    });
    void field.openChest(chest);
  });
  await expect(page.locator('.nq-dlg')).toBeVisible();
  expect(await page.evaluate(() => window.__fieldPlayed.length)).toBe(played.length);
  expect(requests).toHaveLength(6);
  await expect.poll(() => page.evaluate(() => window.__fieldContext?.state)).toBe('running');
  expect(errors).toEqual([]);
});
