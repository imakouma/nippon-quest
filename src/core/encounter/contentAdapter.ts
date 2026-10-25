import type { Area } from '../content/schemas';
import type { Rng } from '../rng';
import { isRoadTile, type Ground } from '../world/ground';
import {
  decideEncounterStep,
  type EncounterPolicyInput,
  type EncounterPolicyResult,
  type EncounterPolicyState,
} from './policy';

export type EncounterZone = 'field' | 'dungeon' | Exclude<Ground, 'grass'>;
export type EncounterTable = Area['encounters'][number];

export interface EncounterUnlocks {
  gated: ReadonlySet<string>;
  unlocked: readonly string[];
}

export interface EncounterSelection {
  enemyId: string;
  zone: EncounterZone;
  ground: Ground | null;
}

export interface EncounterStepContext {
  mapKey: string;
  area: Pick<Area, 'encounters'> | null | undefined;
  backgroundTile: number | undefined;
  ground: Ground | null;
  region: string | null;
  unlocks?: EncounterUnlocks;
}

/** マップキーから出現ゾーンを決める。町・島マップではエンカウントしない。 */
export function zoneForMap(mapKey: string): EncounterZone | null {
  if (mapKey.endsWith('-field')) return 'field';
  if (mapKey.endsWith('-dungeon')) return 'dungeon';
  return null;
}

/** フィールドの地面に専用表があればそのゾーン、なければ field を使う。 */
export function zoneForGround(
  area: Pick<Area, 'encounters'>,
  zone: EncounterZone,
  ground: Ground | null,
): EncounterZone {
  if (zone !== 'field' || !ground || ground === 'grass') return zone;
  return area.encounters.some((encounter) => !encounter.region && encounter.zone === ground)
    ? ground
    : 'field';
}

/** 地域表を優先し、無ければ県全体の地面表または field 表へ戻す。 */
export function selectEncounterTable(
  area: Pick<Area, 'encounters'>,
  zone: EncounterZone,
  ground: Ground | null,
  region: string | null,
): EncounterTable | null {
  if (region && zone === 'field') {
    const regional = area.encounters.filter((encounter) => encounter.region === region);
    if (regional.length)
      return (
        (ground && ground !== 'grass'
          ? regional.find((encounter) => encounter.zone === ground)
          : undefined) ??
        regional.find((encounter) => encounter.zone === 'field') ??
        null
      );
  }
  const selectedZone = zoneForGround(area, zone, ground);
  return area.encounters.find((encounter) => !encounter.region && encounter.zone === selectedZone) ?? null;
}

export function encounterCandidates(
  table: EncounterTable,
  unlocks?: EncounterUnlocks,
): EncounterTable['table'] {
  if (!unlocks) return table.table;
  const unlocked = new Set(unlocks.unlocked);
  return table.table.filter((entry) => !unlocks.gated.has(entry.monsterId) || unlocked.has(entry.monsterId));
}

/** Scene の一歩分の情報を、汎用 policy が受け取る入力へ変換する。 */
export function adaptEncounterStep(context: EncounterStepContext): EncounterPolicyInput<EncounterSelection> {
  const zone = zoneForMap(context.mapKey);
  if (!zone || !context.area || (zone === 'field' && isRoadTile(context.backgroundTile)))
    return { eligible: false, stepsPerCheck: 1, rate: 0, candidates: [] };

  const table = selectEncounterTable(context.area, zone, context.ground, context.region);
  if (!table) return { eligible: false, stepsPerCheck: 1, rate: 0, candidates: [] };

  const candidates = encounterCandidates(table, context.unlocks).map((entry) => ({
    encounter: { enemyId: entry.monsterId, zone, ground: context.ground },
    weight: entry.weight,
  }));
  return {
    eligible: candidates.length > 0,
    stepsPerCheck: table.stepsPerCheck,
    rate: table.rate,
    candidates,
  };
}

export function decideContentEncounterStep(
  state: EncounterPolicyState,
  context: EncounterStepContext,
  rng: Rng,
  suppressed = false,
): EncounterPolicyResult<EncounterSelection> {
  const input = adaptEncounterStep(context);
  return decideEncounterStep(state, suppressed ? { ...input, eligible: false } : input, rng);
}
