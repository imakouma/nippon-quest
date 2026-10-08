import { h, render } from 'preact';
import type { DialogueLine } from '../../ui/dialogue';
import { CutsceneOverlay, type CutsceneKind } from '../../ui/cutscene/CutsceneOverlay';
import type { GameState } from '../../core/state/schema';
import { activeEquipment } from '../../core/progression/bag';
import { heroLook, walkSheet } from '../../rendering/characters';
import { michiruCanvas } from '../../rendering/overworld/fieldArt';
import { StoryNamePrompt } from '../../ui/cutscene/StoryNamePrompt';
import { UNNAMED_HERO } from '../../core/state/newGame';
import { t } from '../../ui/i18n';
import { prologuePreludeLines } from './storyScenes';

interface PresentCutsceneOptions {
  root: HTMLElement;
  lines: DialogueLine[];
  kind: CutsceneKind;
  game: GameState;
  fairyName: string;
  afterClose: () => void;
}

/** 自動進行する物語演出を表示し、暗転解除まで待つ。 */
export function presentCutscene(options: PresentCutsceneOptions): Promise<void> {
  return new Promise((resolve) => {
    const close = () => {
      render(null, options.root);
      options.afterClose();
      resolve();
    };
    const { game, ...view } = options;
    render(
      h(CutsceneOverlay, {
        ...view,
        heroName: game.player.name,
        heroArt: walkSheet(heroLook(game.player.appearance, activeEquipment(game)), true).toDataURL(),
        fairyArt: michiruCanvas().toDataURL(),
        onComplete: close,
      }),
      options.root,
    );
  });
}

/** オープニングの物語の中で主人公の名前を決める。 */
export function presentStoryNamePrompt(root: HTMLElement): Promise<string> {
  return new Promise((resolve) => {
    const decide = (name: string) => {
      render(null, root);
      resolve(name);
    };
    render(h(StoryNamePrompt, { onDecide: decide }), root);
  });
}

/** 入力待ち中の別更新を保ったまま、主人公名だけを確定する。 */
export function applyOpeningHeroName(game: GameState, name: string, now = Date.now()): GameState {
  return { ...game, updatedAt: now, player: { ...game.player, name } };
}

export async function askOpeningHeroName(
  mapKey: string,
  game: GameState,
  root: HTMLElement,
  getGame: () => GameState = () => game,
): Promise<GameState> {
  if (
    mapKey !== 'aomori-field' ||
    game.progress.counters['story.prologue'] ||
    game.player.name !== UNNAMED_HERO
  )
    return game;
  await presentCutscene({
    root,
    lines: prologuePreludeLines(),
    kind: 'opening',
    game,
    fairyName: t('field.prologueFairy'),
    afterClose: () => undefined,
  });
  const name = await presentStoryNamePrompt(root);
  return applyOpeningHeroName(getGame(), name);
}
