import { expect, test } from '@playwright/test';
import type Phaser from 'phaser';
import type { BattleEvent, BattleState } from '../../src/core/battle/types';
import type { ContentIndex } from '../../src/core/content/loader';

type Battle = Phaser.Scene & {
  enemySprite: Phaser.GameObjects.Sprite;
  state: BattleState;
  content: ContentIndex;
  askSkill(): Promise<{ score: number; timeMs: number; attempts: number }>;
  animate(event: BattleEvent): Promise<void>;
};

const ids = [
  'aichi-boss-kinshachi-ou',
  'aichi-kokekokkochin',
  'aichi-shiborin',
  'akita-chuken-maru',
  'akita-lastboss-satake-yoshinobu',
  'akita-wappa-toride',
  'chiba-kujukurin',
  'chiba-peanight',
  'ehime-iyokan-musha',
  'ehime-lastboss-murakami-takeyoshi',
  'fukui-boss-echizen-gani-ou',
  'fukui-lastboss-matsudaira-shungaku',
  'fukui-raputorun',
  'fukuoka-boss-hiraodaio',
  'fukuoka-midboss-banana-taisho',
  'fukuoka-suigo-maru',
  'fukushima-akatsuki-momo',
  'fukushima-kura-donburi',
  'fukushima-yaoki-koboshi',
  'gifu-kamiori-dori',
  'gifu-oriben',
  'gunma-boss-gankake-daruma',
  'gunma-kyabezukin',
  'gunma-purukon',
  'hiroshima-kakigaran',
  'hiroshima-onbashigame',
  'hokkaido-ami-melon',
  'hokkaido-hotaten',
  'hokkaido-jet-hotate',
  'hokkaido-lavendori',
  'hokuriku-islandboss-kagamiutsushi',
  'hyogo-lastboss-ikeda-terumasa',
  'hyogo-sorobanban',
  'ibaraki-aozora-hime',
  'ibaraki-hobikin',
  'ibaraki-nemofin',
  'ishikawa-gosai-bon',
  'ishikawa-kinpaku-cho',
  'ishikawa-oo-hamashion',
  'kagawa-kororibu',
  'kagawa-mizukagami',
  'kagawa-zenigani',
  'kagoshima-kurogane-boo',
  'kagoshima-nabezurun',
  'kanagawa-boss-yokohama-shishi-oh',
  'kanagawa-kazakiri-tonbi',
  'kanagawa-piihyoro',
  'kochi-boss-kuroshio-kujira',
  'kochi-lastboss-sakamoto-ryoma',
  'kumamoto-ebi-musha',
  'kumamoto-midboss-kindouro',
  'kumamoto-tatamin',
  'kyoto-chirimen-mai',
  'kyoto-hontoha-karain',
  'kyushu-okinawa-islandboss-chishikigui',
  'mie-iga-jonin',
  'mie-shinju-hime',
] as const;

for (const id of ids) {
  for (const viewport of [
    { width: 960, height: 540 },
    { width: 640, height: 360 },
  ]) {
    test(`${id} の待機・通常攻撃・わざ・KOがコマ再生される ${viewport.width}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize(viewport);
      await page.bringToFront();
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('response', (response) => {
        if (response.url().includes('/sprites/animations/batch-03/') && !response.ok())
          errors.push(`${response.status()} ${response.url()}`);
      });

      await page.goto(`/?debug=battle&enemy=${id}&lv=5&resetSaves=1`);
      await expect(page.locator('.nq-box')).toBeVisible({ timeout: 60_000 });
      // 負荷の高いヘッドレス実行でもタイプライター完了を待ち続けず、実際のタップで全文表示する。
      await page.locator('.nq-box').click();
      const next = page.locator('.nq-box-next');
      const skillCommand = page.locator('.nq-cmd[data-cmd="skill"]');
      await expect
        .poll(async () => (await next.isVisible()) || (await skillCommand.isVisible()), {
          timeout: 30_000,
        })
        .toBe(true);
      const initial = await page.evaluate((monsterId) => {
        const battle = window.__nq.scene.getScene('Battle') as Battle;
        const sprite = battle.enemySprite;
        const frames: string[] = [];
        const animations: string[] = [];
        sprite.on('animationupdate', () => frames.push(sprite.frame.name));
        sprite.on('animationstart', (animation: Phaser.Animations.Animation) =>
          animations.push(animation.key),
        );
        sprite.setData('observedFrames', frames);
        sprite.setData('observedAnimations', animations);
        return {
          key: sprite.texture.key,
          expected: `mon.animation.${monsterId}.v1`,
          width: sprite.displayWidth,
          height: sprite.displayHeight,
        };
      }, id);
      expect(initial.key).toBe(initial.expected);
      expect(initial.width).toBeGreaterThan(0);
      expect(initial.height).toBeGreaterThan(0);
      const idleFrames = await page.evaluate(() => {
        const sprite = (window.__nq.scene.getScene('Battle') as Battle).enemySprite;
        const frames = new Set([sprite.frame.name]);
        for (let index = 0; index < 7; index += 1) {
          sprite.anims.nextFrame();
          frames.add(sprite.frame.name);
        }
        const idle = sprite.getData('monsterIdle') as string;
        sprite.play(idle, true);
        return { frames: [...frames], playing: sprite.anims.isPlaying, current: idle };
      });
      expect(new Set(idleFrames.frames).size).toBeGreaterThan(2);
      expect(idleFrames.playing).toBe(true);
      expect(idleFrames.current).toBe(`mon.animation.${id}.v1.idle`);

      if (await next.isVisible()) await page.locator('.nq-box').click();
      await expect(skillCommand).toBeVisible({ timeout: 30_000 });
      await page.evaluate(() => {
        const battle = window.__nq.scene.getScene('Battle') as Battle;
        battle.askSkill = async () => ({ score: 0.6, timeMs: 1000, attempts: 1 });
        battle.state.ally.hero.hp = 1000;
        battle.state.seed = 'animation-batch-03-normal-attack';
        battle.state.rngState = undefined;
        battle.state.enemy.skills = [];
      });
      await skillCommand.click();
      await page.locator('[data-skill]:not(.nq-opt-off)').first().click();
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const sprite = (window.__nq.scene.getScene('Battle') as Battle).enemySprite;
              return sprite.getData('observedAnimations') as string[];
            }),
          { timeout: 30_000 },
        )
        .toContain(`mon.animation.${id}.v1.attack`);
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const sprite = (window.__nq.scene.getScene('Battle') as Battle).enemySprite;
              return sprite.anims.currentAnim?.key;
            }),
          { timeout: 30_000 },
        )
        .toBe(`mon.animation.${id}.v1.idle`);

      const skillAttack = await page.evaluate(async (monsterId) => {
        const battle = window.__nq.scene.getScene('Battle') as Battle;
        const sprite = battle.enemySprite;
        const count = () =>
          (sprite.getData('observedAnimations') as string[]).filter((key) => key.endsWith('.attack')).length;
        const before = count();
        const monster = battle.content.monsters.get(monsterId)!;
        const skillId =
          monster.skills.find((id) => battle.content.skills.get(id)?.effect === 'damage') ??
          monster.skills[0]!;
        await battle.animate({
          t: 'act',
          actionId: 'turn:1:action:0',
          side: 'enemy',
          actorId: battle.state.enemy.id,
          targetIds: [battle.state.ally.hero.id],
          command: 'skill',
          skillId,
        });
        return { before, after: count() };
      }, id);
      expect(skillAttack.after).toBeGreaterThan(skillAttack.before);

      await page.screenshot({
        path: `docs/verification/animation-batch-03/${id}-${viewport.width}.png`,
      });
      await page.evaluate(async () => {
        const battle = window.__nq.scene.getScene('Battle') as Battle;
        await battle.animate({
          t: 'ko',
          actionId: 'turn:1:action:0',
          side: 'enemy',
          targetId: battle.state.enemy.id,
        });
      });
      expect(
        await page.evaluate(() => {
          const sprite = (window.__nq.scene.getScene('Battle') as Battle).enemySprite;
          return { playing: sprite.anims.isPlaying, alpha: sprite.alpha };
        }),
      ).toEqual({ playing: false, alpha: 0 });
      expect(errors).toEqual([]);
    });
  }
}
