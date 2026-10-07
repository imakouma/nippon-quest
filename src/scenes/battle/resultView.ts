import type { ContentIndex } from '../../core/content/loader';
import type { BattleEvent, BattleState } from '../../core/battle/types';
import {
  heroLevel,
  levelForXp,
  xpToNextLevel,
  type BattleSummary,
} from '../../core/progression/battleResult';
import type { GameState } from '../../core/state/schema';
import { hasStoryCompanion } from '../../core/progression/storyCompanion';
import type { ResultView } from '../../ui/battle/store';

type VictoryEvent = Extract<BattleEvent, { t: 'victory' }>;

export function battleSummary(
  state: BattleState,
  victory: VictoryEvent | null,
  perfectBySubject: Readonly<Record<string, number>>,
): BattleSummary {
  return {
    outcome: state.outcome as BattleSummary['outcome'],
    enemyRefId: state.enemy.refId,
    enemyLevel: state.enemy.level,
    heroHp: state.ally.hero.hp,
    heroMp: state.ally.hero.mp,
    heroMaxHp: state.ally.hero.stats.hp,
    heroMaxMp: state.ally.hero.stats.mp,
    xp: victory?.xp ?? 0,
    gold: victory?.gold ?? 0,
    drops: victory?.drops ?? [],
    items: { ...state.ally.items },
    recruitAccepted: false,
    perfectBySubject: { ...perfectBySubject },
  };
}

export function victoryResultView(
  summary: BattleSummary,
  victory: VictoryEvent | null,
  enemyName: string,
  game: GameState,
  content: ContentIndex,
  iconUrl: (item: ContentIndex['items'] extends Map<string, infer Item> ? Item : never) => string,
  recruitArt?: string,
  forceRecruitOffer = false,
): ResultView {
  const table = content.xp.hero;
  const { xp } = game.player;
  const from = xpToNextLevel(table, heroLevel(game, table), xp);
  const toLevel = Math.max(game.player.level, levelForXp(table, xp + summary.xp));
  const to = xpToNextLevel(table, toLevel, xp + summary.xp);
  const counts = new Map<string, number>();
  const showRecruitOffer = Boolean(victory?.recruitOffer && (hasStoryCompanion(game) || forceRecruitOffer));
  for (const id of summary.drops) counts.set(id, (counts.get(id) ?? 0) + 1);
  return {
    kind: 'victory',
    xp: summary.xp,
    gold: summary.gold,
    drops: [...counts].map(([id, count]) => {
      const item = content.items.get(id);
      return { name: item?.name ?? id, count, icon: item ? iconUrl(item) : undefined };
    }),
    xpFrom: from.ratio,
    xpTo: to.ratio,
    needNext: to.need,
    recruitName: showRecruitOffer ? enemyName : undefined,
    recruitArt: showRecruitOffer ? recruitArt : undefined,
    goldLost: 0,
    bonus: victory?.bonus ?? 1,
    maxCombo: victory?.maxCombo ?? 0,
  };
}

export const defeatResultView = (goldLost: number): ResultView => ({
  kind: 'defeat',
  xp: 0,
  gold: 0,
  drops: [],
  xpFrom: 0,
  xpTo: 0,
  needNext: 0,
  goldLost,
  bonus: 1,
  maxCombo: 0,
});
