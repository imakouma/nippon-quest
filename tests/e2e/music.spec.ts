import { expect, test, type Page } from '@playwright/test';
import type Phaser from 'phaser';
import type { BattleEvent, BattleState } from '../../src/core/battle/types';
import type { ContentIndex } from '../../src/core/content/loader';
import type { Skill } from '../../src/core/content/schemas';

declare global {
  interface Window {
    __musicAudio: HTMLAudioElement[];
    __nq: Phaser.Game;
  }
}

async function expectTrack(page: Page, id: string): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          window.__musicAudio
            .filter((audio) => !audio.paused && audio.volume > 0)
            .map((audio) => audio.src.split('/').at(-1)),
        ),
      { timeout: 20_000 },
    )
    .toEqual([`${id}-theme.mp3`]);
  await expect
    .poll(() =>
      page.evaluate(
        (track) =>
          window.__musicAudio.find((audio) => audio.src.endsWith(`/${track}-theme.mp3`))?.readyState ?? 0,
        id,
      ),
    )
    .toBeGreaterThanOrEqual(3);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__musicAudio = [];
    window.Audio = new Proxy(window.Audio, {
      construct(target, args: [string?]) {
        const audio = new target(args[0]);
        window.__musicAudio.push(audio);
        return audio;
      },
    });
  });
});

for (const interrupt of [false, true]) {
  test(`技の後もBGMを継続し演出中だけ減音する（音声中断=${interrupt}）`, async ({ page }, info) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto('/?debug=battle');
    await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
    await page.locator('.nq-box').click();
    await expectTrack(page, 'battle');
    const result = await page.evaluate(async (interrupt) => {
      const battle = window.__nq.scene.getScene('Battle') as Phaser.Scene & {
        state: BattleState;
        content: ContentIndex;
        askSkill(): Promise<{ score: number; timeMs: number; attempts: number }>;
        animate(event: BattleEvent, next?: BattleEvent): Promise<void>;
        runIntent(intent: { kind: 'skill'; entry: { actorId: string; skill: Skill } }): Promise<void>;
      };
      // 採点結果だけを固定し、行動・演出・音声は実装を通す。倒さず次のターンまで確認する。
      battle.state.enemy.hp = battle.state.enemy.stats.hp = 9999;
      battle.askSkill = async () => ({ score: 0.6, timeMs: 1000, attempts: 1 });
      const skill = battle.content.skills.get(battle.state.ally.hero.skills[0]!)!;
      const audio = window.__musicAudio.find((a) => a.src.endsWith('/battle-theme.mp3'))!;
      audio.currentTime = 10;
      const before = audio.currentTime;
      const volumes: number[] = [];
      let interrupted = false;
      const animate = battle.animate.bind(battle);
      battle.animate = async (event, next) => {
        if (event.t !== 'act' || event.command !== 'skill') return animate(event, next);
        const sample = setInterval(() => volumes.push(audio.volume), 20);
        // OS/ブラウザ由来の一時停止を注入し、同じ音源・同じ位置からの復帰を検査する。
        if (interrupt && !interrupted) {
          interrupted = true;
          audio.pause();
        }
        try {
          await animate(event, next);
        } finally {
          clearInterval(sample);
        }
      };
      await battle.runIntent({ kind: 'skill', entry: { actorId: battle.state.ally.hero.id, skill } });
      return {
        before,
        after: audio.currentTime,
        paused: audio.paused,
        volume: audio.volume,
        outcome: battle.state.outcome,
        minimumVolume: Math.min(...volumes),
        interrupted,
        settingsVolume: window.__nq.registry.get('game').settings.bgmVolume,
      };
    }, interrupt);
    expect(result.outcome).toBe('ongoing');
    expect(result.paused).toBe(false);
    expect(result.after).toBeGreaterThan(result.before);
    expect(result.volume).toBeCloseTo(0.6);
    expect(result.minimumVolume).toBeCloseTo(0.36);
    expect(result.interrupted).toBe(interrupt);
    expect(result.settingsVolume).toBe(0.6);
    expect(errors).toEqual([]);
    await expectTrack(page, 'battle');
    await info.attach('skill-music-state', { body: JSON.stringify(result), contentType: 'application/json' });
  });
}

test('タイトル・各マップ・通常戦・ボス戦・勝敗で音源を切り替え、探索へ復帰する', async ({ page }, info) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('response', (response) => {
    if (response.url().includes('/audio/bgm/') && response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('/');
  await expect(page.locator('.nq-title-menu')).toBeVisible({ timeout: 30_000 });
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await expectTrack(page, 'title');
  await page.goto('/?debug=battle');
  await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
  await page.locator('.nq-box').click();
  await expectTrack(page, 'battle');
  await page.evaluate(() => {
    const audio = window.__musicAudio.find((a) => a.src.endsWith('/battle-theme.mp3'))!;
    audio.currentTime = audio.duration - 0.15;
  });
  await expect
    .poll(() =>
      page.evaluate(() => window.__musicAudio.find((a) => a.src.endsWith('/battle-theme.mp3'))!.currentTime),
    )
    .toBeLessThan(3);
  await page.screenshot({ path: info.outputPath('battle-music.png') });

  // ローカル専用のゲーム診断窓口で結果を固定し、描画・音源・復帰を実ブラウザで検査する。
  await page.evaluate(() => {
    const battle = window.__nq.scene.getScene('Battle') as Phaser.Scene & {
      state: { outcome: string };
      finish(): Promise<void>;
    };
    battle.state.outcome = 'victory';
    void battle.finish();
  });
  await expectTrack(page, 'victory');
  await expect(page.locator('.nq-result')).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => {
    const audio = window.__musicAudio.find((a) => a.src.endsWith('/victory-theme.mp3'))!;
    audio.currentTime = audio.duration - 0.15;
  });
  await expect.poll(() => page.evaluate(() => window.__musicAudio.every((a) => a.paused))).toBe(true);
  await page.locator('.nq-result button').first().click();
  await expectTrack(page, 'field');

  await page.evaluate(() => {
    const game = window.__nq;
    const state = game.registry.get('game');
    game.registry.set('game', {
      ...state,
      progress: { ...state.progress, counters: { ...state.progress.counters, 'story.prologue': 1 } },
    });
  });
  for (const [map, track] of [
    ['aomori-town', 'town'],
    ['aomori-dungeon', 'dungeon'],
    ['aomori-secret', 'secret'],
    ['aomori-field', 'field'],
  ]) {
    await page.evaluate((mapKey) => {
      window.__nq.scene.getScene('Overworld').scene.restart({ mapKey });
    }, map);
    await expectTrack(page, track!);
  }
  await page.screenshot({ path: info.outputPath('field-music.png') });
  await page.evaluate(() => {
    const game = window.__nq;
    const state = game.registry.get('game');
    game.registry.set('game', { ...state, settings: { ...state.settings, bgmVolume: 0 } });
  });
  await expect.poll(() => page.evaluate(() => window.__musicAudio.every((audio) => audio.paused))).toBe(true);
  await page.evaluate(() => {
    const game = window.__nq;
    const state = game.registry.get('game');
    game.registry.set('game', { ...state, settings: { ...state.settings, bgmVolume: 0.3 } });
    window.__musicAudio.find((a) => a.src.endsWith('/field-theme.mp3'))!.currentTime = 19;
    const field = game.scene.getScene('Overworld') as Phaser.Scene & { startBattle(data: unknown): void };
    field.startBattle({ enemyId: 'aomori-ringoron', level: 1, isBoss: true });
  });
  await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 20_000 });
  await page.locator('.nq-box').click();
  await expectTrack(page, 'boss');
  await page.evaluate(() => {
    const battle = window.__nq.scene.getScene('Battle') as Phaser.Scene & {
      state: { outcome: string };
      finish(): Promise<void>;
    };
    battle.state.outcome = 'defeat';
    void battle.finish();
  });
  await expectTrack(page, 'defeat');
  await expect(page.locator('.nq-result')).toBeVisible();
  await page.locator('.nq-result button').first().click();
  await expectTrack(page, 'field');
  expect(
    await page.evaluate(
      () => window.__musicAudio.find((a) => a.src.endsWith('/field-theme.mp3'))!.currentTime,
    ),
  ).toBeGreaterThanOrEqual(19);
  expect(errors).toEqual([]);
});
