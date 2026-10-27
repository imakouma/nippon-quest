import { expect, test } from '@playwright/test';
import type Phaser from 'phaser';
import type { BattleEvent, BattleState } from '../../src/core/battle/types';
import type { ContentIndex } from '../../src/core/content/loader';
import type { Skill } from '../../src/core/content/schemas';

type Combat = Phaser.Scene & {
  state: BattleState;
  enemySprite: Phaser.GameObjects.Image;
  content: ContentIndex;
  askSkill(): Promise<{ score: number; timeMs: number; attempts: number }>;
  runIntent(intent: { kind: 'skill'; entry: { actorId: string; skill: Skill } }): Promise<void>;
  animate(event: BattleEvent, next?: BattleEvent): Promise<void>;
};
declare global {
  interface Window {
    __koPaused: boolean;
    __koRun: Promise<unknown>;
  }
}

for (const viewport of [
  { width: 960, height: 540 },
  // The game intentionally blocks portrait input with a rotate-device notice.
  { width: 640, height: 360 },
]) {
  test(`敵の撃破中も足元固定で7段階に潰れる (${viewport.width}px)`, async ({ page }, info) => {
    test.setTimeout(150_000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto('/?debug=battle');
    await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
    await page.locator('.nq-box').click();
    await page.screenshot({ path: info.outputPath('before.png') });
    await page.evaluate(() => {
      const battle = window.__nq.scene.getScene('Battle') as Combat;
      const enemy = battle.enemySprite;
      const width = enemy.width;
      const height = enemy.height;
      const frame = enemy.frame.name;
      let first = height,
        last = -1;
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++)
          if ((battle.textures.getPixelAlpha(x, y, enemy.texture.key, frame) ?? 0) > 0) {
            first = Math.min(first, y);
            last = Math.max(last, y);
          }
      const measure = () => ({
        x: enemy.x,
        y: enemy.y,
        scaleY: enemy.scaleY,
        alpha: enemy.alpha,
        top: enemy.y + (first - enemy.originY * enemy.height) * enemy.scaleY,
        foot: enemy.y + (last + 1 - enemy.originY * enemy.height) * enemy.scaleY,
      });
      const initial = measure();
      let before = initial;
      const frames: ReturnType<typeof measure>[] = [];
      const bursts: { x: number; y: number }[] = [];
      window.__koPaused = false;
      let pausedOnce = false;
      const sample = () => {
        frames.push(measure());
        if (!pausedOnce && enemy.scaleY < before.scaleY * 0.6 && enemy.scaleY > 0) {
          pausedOnce = true;
          window.__koPaused = true;
          battle.tweens.timeScale = 0;
        }
      };
      const events: { event: BattleEvent; position: ReturnType<typeof measure> }[] = [];
      const animate = battle.animate.bind(battle);
      battle.animate = async (event, next) => {
        events.push({ event, position: measure() });
        if (event.t !== 'ko' || event.side !== 'enemy') return animate(event, next);
        before = measure();
        // Slow only the KO clock so a busy CI worker can sample all seven steps.
        battle.tweens.timeScale = 0.1;
        battle.events.on('postupdate', sample);
        const existing = new Set(battle.children.list);
        const done = animate(event, next);
        for (const child of battle.children.list) {
          if (!existing.has(child) && child.type === 'ParticleEmitter') {
            const emitter = child as Phaser.GameObjects.Particles.ParticleEmitter;
            bursts.push({
              x: emitter.x,
              y: emitter.y,
            });
          }
        }
        await done;
        battle.events.off('postupdate', sample);
        battle.tweens.timeScale = 1;
      };
      battle.state.enemy.hp = 1;
      battle.askSkill = async () => ({ score: 0.6, timeMs: 1000, attempts: 1 });
      const skill = battle.content.skills.get(battle.state.ally.hero.skills[0]!)!;
      window.__koRun = battle
        .runIntent({ kind: 'skill', entry: { actorId: battle.state.ally.hero.id, skill } })
        .then(() => ({
          texture: { width, height, frame, first, last },
          initial,
          before,
          frames,
          bursts,
          events,
        }));
    });
    await expect.poll(() => page.evaluate(() => window.__koPaused), { timeout: 80_000 }).toBe(true);
    await page.screenshot({ path: info.outputPath('collapse-middle.png') });
    const result = await page.evaluate(async () => {
      window.__nq.scene.getScene('Battle').tweens.timeScale = 0.1;
      return (await window.__koRun) as {
        texture: unknown;
        initial: { foot: number; scaleY: number };
        before: { foot: number; alpha: number };
        frames: { foot: number; scaleY: number; alpha: number }[];
        bursts: unknown;
        events: { event: BattleEvent }[];
      };
    });
    await info.attach('enemy-coordinate-frames', {
      body: JSON.stringify(result, null, 2),
      contentType: 'application/json',
    });
    const visible = result.frames.filter((frame) => frame.alpha > 0 && frame.scaleY > 0);
    expect(visible.length).toBeGreaterThan(3);
    expect(result.before.foot).toBe(result.initial.foot);
    expect(result.before.alpha).toBe(1);
    expect(result.events.filter(({ event }) => event.t === 'ko').map(({ event }) => event)).toEqual([
      { t: 'ko', actionId: 'turn:1:action:0', side: 'enemy', targetId: 'enemy' },
    ]);
    expect(
      Math.max(...visible.map((frame) => Math.abs(frame.foot - result.before.foot))),
    ).toBeLessThanOrEqual(1);
    const steps = [
      ...new Set(result.frames.map((frame) => Math.round((1 - frame.scaleY / result.initial.scaleY) * 7))),
    ].filter((step) => step > 0);
    expect(steps).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(result.frames.at(-1)?.alpha).toBe(0);
    expect(errors).toEqual([]);
  });
}
