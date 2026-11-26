import type { BattleSummary } from '../../core/progression/battleResult';

/** 図鑑への初登録と仲間化が同じ戦闘で確定したときだけ表示する。 */
export function shouldCelebrateNewRecruit(
  outcome: BattleSummary['outcome'],
  monsterId: string,
  knownMonsters: readonly string[],
): boolean {
  return outcome === 'recruited' && !knownMonsters.includes(monsterId);
}
