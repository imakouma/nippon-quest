import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type Phaser from 'phaser';
import type { BattleEvent, BattleState } from '../../src/core/battle/types';

type Battle = Phaser.Scene & {
  enemySprite: Phaser.GameObjects.Sprite;
  state: BattleState;
  animate(event: BattleEvent): Promise<void>;
};

const manifest = JSON.parse(readFileSync('assets/sprites/animations/batch-06/manifest.json', 'utf8')) as {
  id: string;
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  idle: number[];
  attack: number[];
}[];

for (const viewport of [
  { width: 960, height: 540 },
  { width: 640, height: 360 },
]) {
  test(`batch-06全53体の待機・攻撃・復帰・KO・表示範囲 ${viewport.width}`, async ({ page }) => {
    test.setTimeout(4 * 60_000);
    await page.setViewportSize(viewport);
    const browserErrors: string[] = [];
    page.on('pageerror', (error) => browserErrors.push(error.message));
    page.on('response', (response) => {
      if (response.url().includes('/sprites/animations/batch-06/') && !response.ok())
        browserErrors.push(`${response.status()} ${response.url()}`);
    });

    await page.goto(`/?debug=battle&enemy=${manifest[0]!.id}&lv=5`);
    await page.waitForFunction(() => window.__nq?.scene.isActive('Battle'), undefined, {
      timeout: 60_000,
    });
    await expect(page.locator('.nq-box')).toBeVisible({ timeout: 60_000 });
    await page.locator('.nq-box').click();
    await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 30_000 });
    await page.screenshot({
      path: `docs/verification/animation-completion/remaining-runtime-monsters/battle-${viewport.width}.png`,
    });

    const results = await page.evaluate(async (entries) => {
      const battle = window.__nq.scene.getScene('Battle') as Battle;
      for (const spec of entries) {
        if (!battle.textures.exists(spec.key))
          battle.load.spritesheet(spec.key, `/assets/${spec.path}`, {
            frameWidth: spec.frameWidth,
            frameHeight: spec.frameHeight,
          });
      }
      if (battle.load.list.size > 0) {
        await new Promise<void>((resolve, reject) => {
          battle.load.once('complete', () => resolve());
          battle.load.once('loaderror', (file: { src?: string }) =>
            reject(new Error(`loaderror: ${file.src ?? 'unknown'}`)),
          );
          battle.load.start();
        });
      }

      const original = battle.enemySprite;
      original.setVisible(false);
      const view = battle.cameras.main.worldView;
      const checked = [];
      for (const spec of entries) {
        const idle = `${spec.key}.idle`;
        const attackKey = `${spec.key}.attack`;
        if (!battle.anims.exists(idle)) {
          battle.anims.create({
            key: idle,
            frames: spec.idle.map((frame) => ({ key: spec.key, frame })),
            frameRate: 5,
            repeat: -1,
          });
          battle.anims.create({
            key: attackKey,
            frames: spec.attack.map((frame) => ({ key: spec.key, frame })),
            frameRate: 10,
          });
        }
        const sprite = battle.add.sprite(original.x, original.y, spec.key, 0);
        sprite
          .setOrigin(original.originX, original.originY)
          .setScale(original.scaleX, original.scaleY)
          .setFlipX(original.flipX);
        sprite.setData('monsterIdle', idle).setData('monsterAttack', attackKey);
        const frames = new Set([String(sprite.frame.name)]);
        sprite.play(idle, true);
        for (let index = 0; index < 7; index += 1) {
          sprite.anims.nextFrame();
          frames.add(String(sprite.frame.name));
        }
        sprite.play(attackKey);
        const attack = sprite.anims.currentAnim?.key;
        for (let index = 0; index < 5; index += 1) sprite.anims.nextFrame();
        sprite.play(idle, true);
        const recovered = sprite.anims.currentAnim?.key;
        const bounds = sprite.getBounds();
        sprite.anims.stop();
        sprite.setAlpha(0);
        checked.push({
          id: spec.id,
          texture: sprite.texture.key,
          idle,
          attack,
          recovered,
          frames: frames.size,
          inBounds:
            bounds.left >= view.left &&
            bounds.right <= view.right &&
            bounds.top >= view.top &&
            bounds.bottom <= view.bottom,
          stopped: !sprite.anims.isPlaying && sprite.alpha === 0,
        });
        sprite.destroy();
      }
      original.setVisible(true);
      return checked;
    }, manifest);

    expect(results).toHaveLength(53);
    for (const result of results) {
      const key = `mon.animation.${result.id}.v1`;
      expect(result.texture, result.id).toBe(key);
      expect(result.idle, result.id).toBe(`${key}.idle`);
      expect(result.attack, result.id).toBe(`${key}.attack`);
      expect(result.recovered, result.id).toBe(`${key}.idle`);
      expect(result.frames, result.id).toBeGreaterThan(2);
      expect(result.inBounds, result.id).toBe(true);
      expect(result.stopped, result.id).toBe(true);
    }

    const integration = await page.evaluate(async () => {
      const battle = window.__nq.scene.getScene('Battle') as Battle;
      const animations: string[] = [];
      battle.enemySprite.on('animationstart', (entry: Phaser.Animations.Animation) =>
        animations.push(entry.key),
      );
      await battle.animate({
        t: 'act',
        actionId: 'turn:1:action:0',
        side: 'enemy',
        actorId: battle.state.enemy.id,
        targetIds: [battle.state.ally.hero.id],
        command: 'attack',
      });
      const recovered = battle.enemySprite.anims.currentAnim?.key;
      await battle.animate({
        t: 'ko',
        actionId: 'turn:1:action:1',
        side: 'enemy',
        targetId: battle.state.enemy.id,
      });
      return {
        animations,
        recovered,
        playing: battle.enemySprite.anims.isPlaying,
        alpha: battle.enemySprite.alpha,
      };
    });
    expect(integration.animations).toContain(`${manifest[0]!.key}.attack`);
    expect(integration.recovered).toBe(`${manifest[0]!.key}.idle`);
    expect(integration.playing).toBe(false);
    expect(integration.alpha).toBe(0);
    expect(browserErrors).toEqual([]);
  });
}
