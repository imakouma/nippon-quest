import type { World } from '../../core/content/schemas';
import { markMapVisited } from '../../core/progression/arena';
import { applyInterPrefectureArrival } from '../../core/progression/interPrefectureArrival';
import type { GameState } from '../../core/state/schema';
import { rememberLocationState } from './importedLocation';

interface OverworldLocationInput {
  mapKey: string;
  areaId: string;
  islandId: string;
  areaExists: boolean;
  tile: [number, number];
  devAll: boolean;
  interPrefectureArrival: boolean;
  now: number;
}

/** 通常歩行・初回訪問・県間到着を、dev中の訪問非汚染も含めて一か所で保存する。 */
export function persistOverworldLocation(
  game: GameState,
  world: World,
  input: OverworldLocationInput,
): GameState {
  if (input.interPrefectureArrival)
    return applyInterPrefectureArrival(
      game,
      world,
      { targetArea: input.areaId, targetMap: input.mapKey, targetTile: input.tile },
      input.now,
    );
  const [x, y] = input.tile;
  const located = rememberLocationState(game, { ...input, x, y });
  return input.devAll ? located : markMapVisited(located, input.mapKey, input.now);
}
