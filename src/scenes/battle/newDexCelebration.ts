import type { BattleSummary } from '../../core/progression/battleResult';
import type { ContentIndex } from '../../core/content/loader';
import type { GameState } from '../../core/state/schema';
import { monsterMenuArtUrl } from '../../rendering/menuArt';
import { monsterCatalog } from '../overworld/catalogs';

/** 図鑑への初登録と仲間化が同じ戦闘で確定したときだけ表示する。 */
export function shouldCelebrateNewRecruit(
  outcome: BattleSummary['outcome'],
  monsterId: string,
  knownMonsters: readonly string[],
): boolean {
  return outcome === 'recruited' && !knownMonsters.includes(monsterId);
}

export interface DexPageSlot {
  id: string;
  number: number;
  known: boolean;
  target: boolean;
}

export function buildDexPage(entries: readonly { id: string; known: boolean }[], targetId: string) {
  const index = entries.findIndex((entry) => entry.id === targetId);
  if (index < 0 || entries[index]!.known) return null;
  const first = Math.floor(index / 6) * 6;
  const before = entries.filter((entry) => entry.known).length;
  return {
    before,
    after: before + 1,
    total: entries.length,
    slots: entries.slice(first, first + 6).map((entry, offset): DexPageSlot => ({
      ...entry,
      number: first + offset + 1,
      target: entry.id === targetId,
    })),
  };
}

/** 図鑑と同じ順番・発見数から、登録前のページを組み立てる。 */
export function prepareNewDexCelebration(
  outcome: BattleSummary['outcome'],
  monsterId: string,
  game: GameState,
  content: ContentIndex,
) {
  if (!shouldCelebrateNewRecruit(outcome, monsterId, game.dex.monsters)) return null;
  const catalog = monsterCatalog(content, game, false);
  const page = buildDexPage(
    catalog.map(({ m, known }) => ({ id: m.id, known })),
    monsterId,
  );
  if (!page) return null;
  return {
    ...page,
    slots: page.slots.map((slot) => {
      const monster = content.monsters.get(slot.id);
      return {
        ...slot,
        art: monster && (slot.known || slot.target) ? monsterMenuArtUrl(monster) : undefined,
      };
    }),
  };
}
