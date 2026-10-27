import { expect, test } from '@playwright/test';
import type Phaser from 'phaser';
import type { BattleEvent, BattleState } from '../../src/core/battle/types';

type Combat = Phaser.Scene & { state: BattleState; animate(event: BattleEvent): Promise<void> };
declare global {
  interface Window {
    __combatPlayed: { name: string; gain: number }[];
    __combatDecoded: string[];
    __combatContext?: AudioContext;
    __combatMusic: HTMLAudioElement[];
  }
}

test('攻撃・通常/強ヒット・被ダメージ・回復を実音源で再生し、SE消音中もBGMは続く', async ({ page }, info) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('response', (response) => {
    if (/\/audio\/se\/(slash|hit|crit|hurt|heal)\.mp3$/.test(response.url())) {
      requests.push(response.url());
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.addInitScript(() => {
    window.__combatPlayed = [];
    window.__combatDecoded = [];
    window.__combatMusic = [];
    window.Audio = new Proxy(window.Audio, {
      construct(target, args: [string?]) {
        const audio = new target(args[0]);
        window.__combatMusic.push(audio);
        return audio;
      },
    });
    const dataNames = new WeakMap<ArrayBuffer, string>();
    const bufferNames = new WeakMap<AudioBuffer, string>();
    const arrayBuffer = Response.prototype.arrayBuffer;
    Response.prototype.arrayBuffer = async function () {
      const data = await arrayBuffer.call(this);
      if (/\/audio\/se\/(slash|hit|crit|hurt|heal)\.mp3$/.test(this.url))
        dataNames.set(data, this.url.split('/').at(-1)!);
      return data;
    };
    const decode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = async function (data) {
      const name = dataNames.get(data);
      const buffer = await decode.call(this, data);
      if (name) {
        bufferNames.set(buffer, name);
        window.__combatDecoded.push(name);
      }
      return buffer;
    };
    const createSource = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      window.__combatContext = this;
      const source = createSource.call(this);
      const start = source.start.bind(source);
      const connect = source.connect.bind(source);
      let gain = 0;
      source.connect = ((target: AudioNode) => {
        if (target instanceof GainNode) gain = target.gain.value;
        return connect(target);
      }) as typeof source.connect;
      source.start = (...args) => {
        const name = source.buffer && bufferNames.get(source.buffer);
        if (name) window.__combatPlayed.push({ name, gain });
        start(...args);
      };
      return source;
    };
  });
  await page.goto('/?debug=battle');
  await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
  await page.locator('.nq-box').click();
  await expect.poll(() => page.evaluate(() => window.__combatDecoded.length)).toBe(5);

  // ローカル診断窓口で結果を固定し、Sceneの実演出と音源を検査する。計算式は変更しない。
  await page.evaluate(async () => {
    const battle = window.__nq.scene.getScene('Battle') as Combat;
    const hero = battle.state.ally.hero.id;
    const enemy = battle.state.enemy.id;
    const actionId = 'turn:1:action:0' as const;
    await battle.animate({
      t: 'act',
      actionId,
      side: 'ally',
      actorId: hero,
      targetIds: [enemy],
      command: 'attack',
    });
    const damage = {
      t: 'damage',
      actionId,
      side: 'enemy',
      targetId: enemy,
      amount: 1,
      critical: false,
      elementMult: 1,
      weakness: false,
      scoreBand: 'good',
      comboMult: 1,
    } as const;
    await battle.animate(damage);
    await battle.animate({ ...damage, critical: true });
    await battle.animate({ ...damage, scoreBand: 'perfect' });
    await battle.animate({ ...damage, side: 'ally', targetId: hero });
    await battle.animate({ t: 'heal', actionId, side: 'ally', targetId: hero, amount: 1 });
  });
  expect(await page.evaluate(() => window.__combatPlayed.map((sound) => sound.name))).toEqual([
    'slash.mp3',
    'hit.mp3',
    'crit.mp3',
    'crit.mp3',
    'hurt.mp3',
    'heal.mp3',
  ]);
  expect(
    await page.evaluate(() => window.__combatPlayed.every((sound) => sound.gain > 0 && sound.gain <= 0.4)),
  ).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__combatContext?.state)).toBe('running');
  const bgmPlaying = () =>
    page.evaluate(() =>
      window.__combatMusic.some(
        (audio) => audio.src.endsWith('/battle-theme.mp3') && !audio.paused && audio.volume > 0,
      ),
    );
  await expect.poll(bgmPlaying).toBe(true);
  await page.evaluate(async () => {
    const game = window.__nq;
    const state = game.registry.get('game');
    game.registry.set('game', { ...state, settings: { ...state.settings, seVolume: 0 } });
    const battle = game.scene.getScene('Battle') as Combat;
    await battle.animate({
      t: 'heal',
      actionId: 'turn:1:action:0',
      side: 'ally',
      targetId: battle.state.ally.hero.id,
      amount: 1,
    });
  });
  expect(await page.evaluate(() => window.__combatPlayed.length)).toBe(6);
  await expect.poll(bgmPlaying).toBe(true);
  await page.evaluate(async () => {
    const game = window.__nq;
    const state = game.registry.get('game');
    game.registry.set('game', { ...state, settings: { ...state.settings, seVolume: 0.8 } });
    const battle = game.scene.getScene('Battle') as Combat;
    await battle.animate({
      t: 'heal',
      actionId: 'turn:1:action:0',
      side: 'ally',
      targetId: battle.state.ally.hero.id,
      amount: 1,
    });
  });
  expect(await page.evaluate(() => window.__combatPlayed.length)).toBe(7);
  expect(requests).toHaveLength(5);
  expect(errors).toEqual([]);
  await page.screenshot({ path: info.outputPath('battle-sounds.png') });
});
