import { h, render } from 'preact';
import type { ContentIndex } from '../../core/content/loader';
import {
  chooseStoryCompanion,
  IWATE_ARRIVAL_COUNTER,
  STORY_COMPANION_IDS,
} from '../../core/progression/storyCompanion';
import type { GameState } from '../../core/state/schema';
import type { DialogueLine } from '../../ui/dialogue';
import { StoryCompanionChoice } from '../../ui/field/StoryCompanionChoice';
import { HeroIdentitySetup, type HeroIdentity } from '../../ui/title/HeroIdentitySetup';
import { t } from '../../ui/i18n';
import { playSfx } from '../../ui/sfx';
import { monsterMenuArtUrl } from '../../rendering/menuArt';
import { companionChoiceLines, companionJoinedLines, iwateArrivalLines, prologueLines } from './storyScenes';

export const PROLOGUE_COUNTER = 'story.prologue';

export interface MapStory {
  state: GameState;
  lines: DialogueLine[];
}

export function requestHeroIdentity(
  root: HTMLElement,
  initialAppearance: HeroIdentity['appearance'],
): Promise<HeroIdentity> {
  return new Promise((resolve) => {
    render(
      h(HeroIdentitySetup, {
        initialAppearance,
        onComplete: (identity) => {
          render(null, root);
          resolve(identity);
        },
      }),
      root,
    );
  });
}

/** マップへ入った直後に一度だけ始まる物語と、その記録を返す。 */
export function mapArrivalStory(mapKey: string, game: GameState, now = Date.now()): MapStory | null {
  if (mapKey === 'aomori-field' && game.progress.counters[PROLOGUE_COUNTER] === 0) {
    return {
      state: {
        ...game,
        updatedAt: now,
        progress: {
          ...game.progress,
          counters: { ...game.progress.counters, [PROLOGUE_COUNTER]: 1 },
        },
      },
      lines: prologueLines(game),
    };
  }
  if (
    mapKey !== 'iwate-town' ||
    game.party.owned.length > 0 ||
    game.progress.counters[IWATE_ARRIVAL_COUNTER]
  ) {
    return null;
  }
  const state = structuredClone(game);
  state.progress.counters[IWATE_ARRIVAL_COUNTER] = 1;
  state.updatedAt = now;
  return { state, lines: iwateArrivalLines() };
}

interface CompanionRiteOptions {
  game: GameState;
  content: ContentIndex;
  root: HTMLElement;
  talk(lines: DialogueLine[]): Promise<void>;
  save(state: GameState): void;
  afterOverlay(): void;
}

/** むすびの社で、説明から「むすび玉」による相棒加入までを進める。 */
export async function runCompanionRite(options: CompanionRiteOptions): Promise<void> {
  const { game, content, root, talk, save, afterOverlay } = options;
  if (game.party.owned.length > 0) return;
  await talk(companionChoiceLines());
  const choices = STORY_COMPANION_IDS.flatMap((id) => {
    const monster = content.monsters.get(id);
    return monster
      ? [
          {
            id,
            name: monster.name,
            element: monster.element,
            description: monster.dexBlurb,
            art: monsterMenuArtUrl(monster),
          },
        ]
      : [];
  });
  const monsterId = await new Promise<(typeof STORY_COMPANION_IDS)[number] | null>((resolve) => {
    const done = (id: (typeof STORY_COMPANION_IDS)[number] | null) => {
      render(null, root);
      afterOverlay();
      resolve(id);
    };
    render(h(StoryCompanionChoice, { options: choices, onChoose: done, onCancel: () => done(null) }), root);
  });
  if (!monsterId) {
    await talk([{ speaker: t('field.musubiKeeper'), text: t('field.musubiLater') }]);
    return;
  }
  save(chooseStoryCompanion(game, monsterId));
  const name = content.monsters.get(monsterId)?.name ?? monsterId;
  playSfx('recruit');
  await talk(companionJoinedLines(monsterId, name));
}
