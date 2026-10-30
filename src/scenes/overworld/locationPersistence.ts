import type { Area, World } from '../../core/content/schemas';
import { markMapVisited } from '../../core/progression/arena';
import {
  developerInnQuarantined,
  releaseDeveloperTravelQuarantineState,
} from '../../core/progression/developerTravel';
import { areaReachableForTravel } from '../../core/progression/interPrefecture';
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

/** 旧dev由来の宿記録を消さず、現在の攻略順で到達できる宿だけ敗北時の復帰先にする。 */
export function accessibleLastInn(
  game: GameState,
  world: World,
  areas: ReadonlyMap<string, Pick<Area, 'mapKeys'>>,
): GameState['progress']['lastInn'] {
  const inn = game.progress.lastInn;
  if (!inn) return null;
  if (developerInnQuarantined(game.progress.counters, inn.map)) return null;
  const areaId = [...areas].find(([, area]) => area.mapKeys?.town === inn.map)?.[0];
  return areaId && areaReachableForTravel(world, areaId, game.progress) ? inn : null;
}

/** 通常歩行・初回訪問・県間到着を、dev中の訪問非汚染も含めて一か所で保存する。 */
export function persistOverworldLocation(
  game: GameState,
  world: World,
  input: OverworldLocationInput,
): GameState {
  const located = input.interPrefectureArrival
    ? applyInterPrefectureArrival(
        game,
        world,
        { targetArea: input.areaId, targetMap: input.mapKey, targetTile: input.tile },
        input.now,
      )
    : rememberLocationState(game, { ...input, x: input.tile[0], y: input.tile[1] });
  if (input.devAll) return located;
  const released = releaseDeveloperTravelQuarantineState(located, input.mapKey, input.now);
  return input.interPrefectureArrival ? released : markMapVisited(released, input.mapKey, input.now);
}
