import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { createNewGame } from '../../src/core/state/newGame';
import {
  BATTLE_TUTORIAL_EVENT,
  BATTLE_TUTORIAL_PENDING_COUNTER,
  completeBattleTutorial,
  queueBattleTutorial,
  shouldShowBattleTutorial,
} from '../../src/core/progression/battleTutorial';
import { battleTutorialLines } from '../../src/scenes/overworld/storyScenes';
import {
  mapArrivalStory,
  queueOpeningBattleTutorial,
  runPendingBattleTutorial,
} from '../../src/scenes/overworld/storyFlow';
import { setDictionary, type I18nDict } from '../../src/ui/i18n';

describe('初回バトルチュートリアル', () => {
  const newGame = () => createNewGame({ name: 'ハル', grade: 1 }, 100);

  beforeAll(() => {
    setDictionary(
      JSON.parse(readFileSync(new URL('../../content/i18n/ja.json', import.meta.url), 'utf8')) as I18nDict,
    );
  });

  it('既存セーブには突然表示せず、pending の青森フィールドだけで表示する', () => {
    const existingSave = newGame();

    expect(shouldShowBattleTutorial('aomori-field', existingSave)).toBe(false);
    expect(shouldShowBattleTutorial('iwate-field', queueBattleTutorial(existingSave))).toBe(false);
    expect(shouldShowBattleTutorial('aomori-field', queueBattleTutorial(existingSave))).toBe(true);
  });

  it('プロローグ完了時の予約は元の状態を破壊しない', () => {
    const game = newGame();
    const queued = queueBattleTutorial(game, 200);

    expect(game.progress.counters[BATTLE_TUTORIAL_PENDING_COUNTER]).toBeUndefined();
    expect(queued.progress.counters[BATTLE_TUTORIAL_PENDING_COUNTER]).toBe(1);
    expect(queued.updatedAt).toBe(200);
  });

  it('完了すると pending を消してイベントを一度だけ記録する', () => {
    const queued = queueBattleTutorial(newGame());
    const completed = completeBattleTutorial(queued, 300);
    const completedAgain = completeBattleTutorial(completed, 400);

    expect(completed.progress.counters[BATTLE_TUTORIAL_PENDING_COUNTER]).toBeUndefined();
    expect(completed.progress.eventsDone).toContain(BATTLE_TUTORIAL_EVENT);
    expect(completedAgain.progress.eventsDone.filter((id) => id === BATTLE_TUTORIAL_EVENT)).toHaveLength(1);
    expect(completedAgain.updatedAt).toBe(400);
    expect(shouldShowBattleTutorial('aomori-field', completedAgain)).toBe(false);
  });

  it('ミチルが4画面でバトルの基本を順番に説明する', () => {
    const lines = battleTutorialLines();

    expect(lines).toHaveLength(4);
    expect(lines.every((line) => line.speaker === 'ミチル')).toBe(true);
    expect(lines[0]?.text).toContain('バトル');
    expect(lines[1]?.text).toContain('わざ');
    expect(lines[1]?.text).toContain('問題');
    expect(lines[2]?.text).toContain('ゲージ');
    expect(lines[3]?.text).toContain('にげる');
    expect(lines[3]?.text).toContain('すばやさ');
  });

  it('青森のオープニングを開始すると説明を予約する', () => {
    const story = mapArrivalStory('aomori-field', newGame(), 200);
    const queued = queueOpeningBattleTutorial(story!, 300);

    expect(queued.progress.counters[BATTLE_TUTORIAL_PENDING_COUNTER]).toBe(1);
    expect(queued.updatedAt).toBe(300);
  });

  it('保留中なら会話後に完了保存し、未対象なら何もしない', async () => {
    let game = queueBattleTutorial(newGame());
    const talks: string[][] = [];
    const shown = await runPendingBattleTutorial({
      mapKey: 'aomori-field',
      game,
      talk: async (lines) => {
        talks.push(lines.map((line) => line.text));
      },
      save: (state) => {
        game = state;
      },
      getGame: () => game,
    });

    expect(shown).toBe(true);
    expect(talks).toHaveLength(1);
    expect(talks[0]).toHaveLength(4);
    expect(game.progress.eventsDone).toContain(BATTLE_TUTORIAL_EVENT);
    expect(
      await runPendingBattleTutorial({
        mapKey: 'aomori-field',
        game,
        talk: async () => undefined,
        save: () => undefined,
        getGame: () => game,
      }),
    ).toBe(false);
  });
});
