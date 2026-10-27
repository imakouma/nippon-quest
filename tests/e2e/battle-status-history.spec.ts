import { expect, test, type Page } from '@playwright/test';
import type Phaser from 'phaser';
import type { BattleEvent, BattleState } from '../../src/core/battle/types';
import type { BattleLaunchData } from '../../src/scenes/battle/contracts';

type HistoryBattle = Phaser.Scene & {
  state: BattleState;
  opts: BattleLaunchData;
  presentedEventCount: number;
  enqueue(events: BattleEvent[]): Promise<void>;
  syncViews(): void;
  syncHistoryView(): void;
};

declare global {
  interface Window {
    __historyPresentation?: Promise<void>;
  }
}

async function start(page: Page): Promise<void> {
  await page.goto('/?debug=battle&enemy=aomori-ringoron&lv=8');
  await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
  await page.locator('.nq-box').click();
  await expect(page.locator('[data-battle-history]')).toBeVisible();
}

async function restartInDeveloperMode(page: Page): Promise<void> {
  await page.evaluate(() => {
    const battle = window.__nq.scene.getScene('Battle') as HistoryBattle;
    battle.scene.restart({ ...battle.opts, devMode: true });
  });
  await expect(page.locator('.nq-box-next')).toBeVisible({ timeout: 60_000 });
  await page.locator('.nq-box').click();
  await expect(page.locator('[data-event-timeline-toggle]')).toBeVisible();
}

test('状態チップと履歴は演出済みイベントだけを通常HUDへ表示する', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await start(page);

  await page.evaluate(() => {
    const battle = window.__nq.scene.getScene('Battle') as HistoryBattle;
    const event: BattleEvent = {
      t: 'damage',
      actionId: 'turn:1:action:0',
      side: 'enemy',
      targetId: battle.state.enemy.id,
      amount: 1,
      critical: false,
      elementMult: 1,
      weakness: false,
      scoreBand: null,
      comboMult: 1,
    };
    battle.state.enemy.hp -= 1;
    battle.state.log.push(event);
    battle.syncViews();
    window.__historyPresentation = battle.enqueue([event]);
  });

  await expect(page.locator('[data-battle-history]')).not.toContainText('1の ダメージ！');
  await page.evaluate(() => window.__historyPresentation);
  await expect(page.locator('[data-battle-history]')).toContainText('1の ダメージ！');

  await page.evaluate(() => {
    const battle = window.__nq.scene.getScene('Battle') as HistoryBattle;
    battle.state.enemy.buffs = {
      atk: { mult: 1.25, turns: 3 },
      def: { mult: 0.75, turns: 2 },
    };
    battle.state.enemy.skipTurns = 1;
    battle.state.ally.hero.buffs = { def: { mult: 1.25, turns: 2 } };
    battle.syncViews();
  });

  const enemyEffects = page.locator('.nq-foe [data-status-effect]');
  await expect(enemyEffects).toHaveCount(3);
  await expect(enemyEffects.filter({ hasText: 'こうげき▲3T' })).toBeVisible();
  await expect(enemyEffects.filter({ hasText: 'ぼうぎょ▼2T' })).toBeVisible();
  await expect(enemyEffects.filter({ hasText: 'うごけない×1T' })).toBeVisible();
  await expect(page.locator('.nq-foe [data-status-effect="defense"]')).toHaveAttribute(
    'aria-label',
    'ぼうぎょ さがっている のこり 2ターン',
  );
  await expect(page.locator('.nq-ally-hero [data-status-effect="defense"]')).toContainText('ぼうぎょ▲2T');
  await expect(page.locator('[data-battle-history]')).toHaveAttribute('aria-live', 'off');
  await expect(page.locator('[data-event-timeline-toggle]')).toHaveCount(0);

  for (const viewport of [
    { width: 960, height: 540 },
    { width: 640, height: 360 },
  ]) {
    await page.setViewportSize(viewport);
    const [foe, history, rail] = await Promise.all([
      page.locator('.nq-panel').boundingBox(),
      page.locator('[data-battle-history]').boundingBox(),
      page.locator('.nq-bottom-rail').boundingBox(),
    ]);
    expect(foe).not.toBeNull();
    expect(history).not.toBeNull();
    expect(rail).not.toBeNull();
    expect(history!.x).toBeGreaterThanOrEqual(foe!.x + foe!.width);
    expect(history!.y + history!.height).toBeLessThanOrEqual(rail!.y);
    expect(await page.locator('.nq-battle').evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(
      true,
    );
  }
  expect(errors).toEqual([]);
});

test('開発モードのタイムラインは詳細を表示しEscapeで元のボタンへ戻る', async ({ page }) => {
  test.setTimeout(90_000);
  await start(page);
  await restartInDeveloperMode(page);

  const expected = await page.evaluate(() => {
    const battle = window.__nq.scene.getScene('Battle') as HistoryBattle;
    const before = battle.state.enemy.stats.hp;
    const events: BattleEvent[] = [
      { t: 'turnStart', turn: 1 },
      {
        t: 'act',
        actionId: 'turn:1:action:0',
        side: 'ally',
        actorId: battle.state.ally.hero.id,
        targetIds: [battle.state.enemy.id],
        command: 'attack',
      },
      {
        t: 'damage',
        actionId: 'turn:1:action:0',
        side: 'enemy',
        targetId: battle.state.enemy.id,
        amount: 5,
        critical: false,
        elementMult: 1,
        weakness: false,
        scoreBand: null,
        comboMult: 1,
      },
    ];
    battle.state.enemy.hp = before - 5;
    battle.state.log = events;
    battle.presentedEventCount = events.length;
    battle.syncViews();
    battle.syncHistoryView();
    return { before, after: before - 5 };
  });

  const toggle = page.locator('[data-event-timeline-toggle]');
  const toggleBox = await toggle.boundingBox();
  expect(toggleBox?.width).toBeGreaterThanOrEqual(48);
  expect(toggleBox?.height).toBeGreaterThanOrEqual(48);
  await toggle.focus();
  await page.keyboard.press('Enter');

  const timeline = page.locator('[data-event-timeline]');
  await expect(timeline).toBeVisible();
  await expect(timeline).toHaveAttribute('aria-live', 'off');
  await expect(timeline).toContainText('#3');
  await expect(timeline).toContainText('T1');
  await expect(timeline).toContainText('target=enemy');
  await expect(timeline).toContainText(`HP ${expected.before}→${expected.after} (-5)`);
  await expect(timeline.getByRole('button', { name: 'とじる' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(timeline).toHaveCount(0);
  await expect(toggle).toBeFocused();
});
