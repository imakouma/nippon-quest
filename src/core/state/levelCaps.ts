import type { GameState } from './schema';

interface MonsterInitialCap {
  initialLevelCap: number;
}

export function normalizeLevelCaps(
  state: GameState,
  monsters: ReadonlyMap<string, MonsterInitialCap>,
  heroInitialLevelCap: number,
): GameState {
  const heroLevelCap = Math.max(state.player.level, state.player.levelCap, heroInitialLevelCap);
  let changed = heroLevelCap !== state.player.levelCap;
  const owned = state.party.owned.map((monster) => {
    const initialLevelCap = monsters.get(monster.monsterId)?.initialLevelCap ?? 10;
    const levelCap = Math.max(monster.level, monster.levelCap, initialLevelCap);
    if (levelCap === monster.levelCap) return monster;
    changed = true;
    return { ...monster, levelCap };
  });

  if (!changed) return state;
  return {
    ...state,
    player: { ...state.player, levelCap: heroLevelCap },
    party: { ...state.party, owned },
  };
}
