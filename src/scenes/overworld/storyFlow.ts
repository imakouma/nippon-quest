import { h, render } from 'preact';
import type { ContentIndex } from '../../core/content/loader';
import {
  chooseStoryCompanion,
  hasStoryCompanion,
  IWATE_ARRIVAL_COUNTER,
  STORY_COMPANION_IDS,
} from '../../core/progression/storyCompanion';
import type { GameState } from '../../core/state/schema';
import { UNNAMED_HERO } from '../../core/state/newGame';
import type { DialogueLine } from '../../ui/dialogue';
import type { CutsceneKind } from '../../ui/cutscene/CutsceneOverlay';
import { StoryCompanionChoice } from '../../ui/field/StoryCompanionChoice';
import { HeroIdentitySetup, type HeroIdentity } from '../../ui/title/HeroIdentitySetup';
import { t } from '../../ui/i18n';
import { playSfx } from '../../ui/sfx';
import { monsterMenuArtUrl } from '../../rendering/menuArt';
import {
  companionChoiceLines,
  companionJoinedLines,
  hokkaidoChapterArrivalLines,
  hokurikuChapterArrivalLines,
  koshinetsuChapterArrivalLines,
  tokaiChapterArrivalLines,
  kinkiChapterArrivalLines,
  chugokuChapterArrivalLines,
  shikokuChapterArrivalLines,
  kyushuOkinawaChapterArrivalLines,
  iwateArrivalLines,
  kantoChapterArrivalLines,
  prologueLines,
  tohokuTownArrivalLines,
  type StoryTownArea,
} from './storyScenes';

export const PROLOGUE_COUNTER = 'story.prologue';
export const HERO_IDENTITY_COUNTER = 'story.hero-identity';
export const HOKKAIDO_CHAPTER_COUNTER = 'story.chapter.hokkaido';
export const KANTO_CHAPTER_COUNTER = 'story.chapter.kanto';
export const HOKURIKU_CHAPTER_COUNTER = 'story.chapter.hokuriku';
export const KOSHINETSU_CHAPTER_COUNTER = 'story.chapter.koshinetsu';
export const TOKAI_CHAPTER_COUNTER = 'story.chapter.tokai';
export const KINKI_CHAPTER_COUNTER = 'story.chapter.kinki';
export const CHUGOKU_CHAPTER_COUNTER = 'story.chapter.chugoku';
export const SHIKOKU_CHAPTER_COUNTER = 'story.chapter.shikoku';
export const KYUSHU_OKINAWA_CHAPTER_COUNTER = 'story.chapter.kyushu-okinawa';
export const townStoryCounter = (area: StoryTownArea) => `story.town.${area}`;

const TOWN_STORIES: Partial<Record<string, StoryTownArea>> = {
  'aomori-town': 'aomori',
  'miyagi-town': 'miyagi',
  'akita-town': 'akita',
  'yamagata-town': 'yamagata',
  'fukushima-town': 'fukushima',
  'hokkaido-town': 'hokkaido',
  'ibaraki-town': 'ibaraki',
  'tochigi-town': 'tochigi',
  'gunma-town': 'gunma',
  'saitama-town': 'saitama',
  'chiba-town': 'chiba',
  'tokyo-town': 'tokyo',
  'kanagawa-town': 'kanagawa',
  'niigata-town': 'niigata',
  'toyama-town': 'toyama',
  'ishikawa-town': 'ishikawa',
  'fukui-town': 'fukui',
  'yamanashi-town': 'yamanashi',
  'nagano-town': 'nagano',
  'gifu-town': 'gifu',
  'shizuoka-town': 'shizuoka',
  'aichi-town': 'aichi',
  'mie-town': 'mie',
  'shiga-town': 'shiga',
  'kyoto-town': 'kyoto',
  'osaka-town': 'osaka',
  'hyogo-town': 'hyogo',
  'nara-town': 'nara',
  'wakayama-town': 'wakayama',
  'tottori-town': 'tottori',
  'shimane-town': 'shimane',
  'okayama-town': 'okayama',
  'hiroshima-town': 'hiroshima',
  'yamaguchi-town': 'yamaguchi',
  'tokushima-town': 'tokushima',
  'kagawa-town': 'kagawa',
  'ehime-town': 'ehime',
  'kochi-town': 'kochi',
  'fukuoka-town': 'fukuoka',
  'saga-town': 'saga',
  'nagasaki-town': 'nagasaki',
  'kumamoto-town': 'kumamoto',
  'oita-town': 'oita',
  'miyazaki-town': 'miyazaki',
  'kagoshima-town': 'kagoshima',
  'okinawa-town': 'okinawa',
};

export interface MapStory {
  state: GameState;
  lines: DialogueLine[];
  presentation: CutsceneKind;
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

export function applyHeroIdentity(game: GameState, identity: HeroIdentity, now = Date.now()): GameState {
  const state = structuredClone(game);
  state.player.name = identity.name;
  state.player.appearance = { ...state.player.appearance, ...identity.appearance };
  state.progress.counters[HERO_IDENTITY_COUNTER] = 1;
  state.updatedAt = now;
  return state;
}

/** マップへ入った直後に一度だけ始まる物語と、その記録を返す。 */
export function mapArrivalStory(mapKey: string, game: GameState, now = Date.now()): MapStory | null {
  const identityInterrupted =
    game.player.name === UNNAMED_HERO && !game.progress.counters[HERO_IDENTITY_COUNTER];
  if (mapKey === 'aomori-field' && (!game.progress.counters[PROLOGUE_COUNTER] || identityInterrupted)) {
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
      presentation: 'opening',
    };
  }
  if (
    mapKey === 'hokkaido-field' &&
    game.progress.islandsCleared.includes('tohoku') &&
    !game.progress.counters[HOKKAIDO_CHAPTER_COUNTER]
  ) {
    const state = structuredClone(game);
    state.progress.counters[HOKKAIDO_CHAPTER_COUNTER] = 1;
    state.updatedAt = now;
    return { state, lines: hokkaidoChapterArrivalLines(game), presentation: 'chapter' };
  }
  if (
    mapKey === 'ibaraki-field' &&
    game.progress.islandsCleared.includes('hokkaido') &&
    !game.progress.counters[KANTO_CHAPTER_COUNTER]
  ) {
    const state = structuredClone(game);
    state.progress.counters[KANTO_CHAPTER_COUNTER] = 1;
    state.updatedAt = now;
    return { state, lines: kantoChapterArrivalLines(game), presentation: 'chapter' };
  }
  if (
    mapKey === 'niigata-field' &&
    game.progress.islandsCleared.includes('kanto') &&
    !game.progress.counters[HOKURIKU_CHAPTER_COUNTER]
  ) {
    const state = structuredClone(game);
    state.progress.counters[HOKURIKU_CHAPTER_COUNTER] = 1;
    state.updatedAt = now;
    return { state, lines: hokurikuChapterArrivalLines(game), presentation: 'chapter' };
  }
  if (
    mapKey === 'yamanashi-field' &&
    game.progress.islandsCleared.includes('hokuriku') &&
    !game.progress.counters[KOSHINETSU_CHAPTER_COUNTER]
  ) {
    const state = structuredClone(game);
    state.progress.counters[KOSHINETSU_CHAPTER_COUNTER] = 1;
    state.updatedAt = now;
    return { state, lines: koshinetsuChapterArrivalLines(game), presentation: 'chapter' };
  }
  if (
    mapKey === 'gifu-field' &&
    game.progress.islandsCleared.includes('koshinetsu') &&
    !game.progress.counters[TOKAI_CHAPTER_COUNTER]
  ) {
    const state = structuredClone(game);
    state.progress.counters[TOKAI_CHAPTER_COUNTER] = 1;
    state.updatedAt = now;
    return { state, lines: tokaiChapterArrivalLines(game), presentation: 'chapter' };
  }
  if (
    mapKey === 'shiga-field' &&
    game.progress.islandsCleared.includes('tokai') &&
    !game.progress.counters[KINKI_CHAPTER_COUNTER]
  ) {
    const state = structuredClone(game);
    state.progress.counters[KINKI_CHAPTER_COUNTER] = 1;
    state.updatedAt = now;
    return { state, lines: kinkiChapterArrivalLines(game), presentation: 'chapter' };
  }
  if (
    mapKey === 'tottori-field' &&
    game.progress.islandsCleared.includes('kinki') &&
    !game.progress.counters[CHUGOKU_CHAPTER_COUNTER]
  ) {
    const state = structuredClone(game);
    state.progress.counters[CHUGOKU_CHAPTER_COUNTER] = 1;
    state.updatedAt = now;
    return { state, lines: chugokuChapterArrivalLines(game), presentation: 'chapter' };
  }
  if (
    mapKey === 'tokushima-field' &&
    game.progress.islandsCleared.includes('chugoku') &&
    !game.progress.counters[SHIKOKU_CHAPTER_COUNTER]
  ) {
    const state = structuredClone(game);
    state.progress.counters[SHIKOKU_CHAPTER_COUNTER] = 1;
    state.updatedAt = now;
    return { state, lines: shikokuChapterArrivalLines(game), presentation: 'chapter' };
  }
  if (
    mapKey === 'fukuoka-field' &&
    game.progress.islandsCleared.includes('shikoku') &&
    !game.progress.counters[KYUSHU_OKINAWA_CHAPTER_COUNTER]
  ) {
    const state = structuredClone(game);
    state.progress.counters[KYUSHU_OKINAWA_CHAPTER_COUNTER] = 1;
    state.updatedAt = now;
    return { state, lines: kyushuOkinawaChapterArrivalLines(game), presentation: 'chapter' };
  }
  const townArea = TOWN_STORIES[mapKey];
  if (townArea && !game.progress.counters[townStoryCounter(townArea)]) {
    const state = structuredClone(game);
    state.progress.counters[townStoryCounter(townArea)] = 1;
    state.updatedAt = now;
    return { state, lines: tohokuTownArrivalLines(townArea, game), presentation: 'arrival' };
  }
  if (mapKey !== 'iwate-town' || hasStoryCompanion(game) || game.progress.counters[IWATE_ARRIVAL_COUNTER]) {
    return null;
  }
  const state = structuredClone(game);
  state.progress.counters[IWATE_ARRIVAL_COUNTER] = 1;
  state.updatedAt = now;
  return { state, lines: iwateArrivalLines(), presentation: 'arrival' };
}

interface ArrivalStoryOptions {
  mapKey: string;
  game: GameState;
  root: HTMLElement;
  talk(lines: DialogueLine[]): Promise<void>;
  save(state: GameState): void;
  getGame?: () => GameState;
}

/** 到着物語を進め、青森の導入だけは主人公設定を物語の途中に挟む。 */
export async function runArrivalStory(options: ArrivalStoryOptions): Promise<boolean> {
  const { mapKey, game, root, talk, save } = options;
  const story = mapArrivalStory(mapKey, game);
  if (!story) return false;
  save(story.state);
  if (mapKey !== 'aomori-field') {
    await talk(story.lines);
    return true;
  }
  const oldName = story.state.player.name;
  await talk(story.lines.slice(0, 4));
  const identity = await requestHeroIdentity(root, story.state.player.appearance);
  save(applyHeroIdentity(options.getGame?.() ?? story.state, identity));
  await talk(
    story.lines.slice(4).map((line) => ({
      ...line,
      speaker: line.speaker === oldName ? identity.name : line.speaker,
    })),
  );
  return true;
}

interface CompanionRiteOptions {
  game: GameState;
  content: ContentIndex;
  root: HTMLElement;
  talk(lines: DialogueLine[]): Promise<void>;
  save(state: GameState): void;
  getGame?: () => GameState;
  afterOverlay(): void;
}

/** むすびの社で、説明から「むすび玉」による相棒加入までを進める。 */
export async function runCompanionRite(options: CompanionRiteOptions): Promise<void> {
  const { game, content, root, talk, save, afterOverlay } = options;
  if (hasStoryCompanion(game)) return;
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
  save(chooseStoryCompanion(options.getGame?.() ?? game, monsterId));
  const name = content.monsters.get(monsterId)?.name ?? monsterId;
  playSfx('recruit');
  await talk(companionJoinedLines(monsterId, name));
}
