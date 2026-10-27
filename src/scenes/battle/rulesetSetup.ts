import { resolveBattleRuleset, type BattleRuleset } from '../../core/battle/ruleset';
import type { BattleRulesetId } from '../../core/battle/ruleset';
import type { EncounterSource } from './contracts';

export interface BattleRulesetLaunchInput {
  kind?: BattleRulesetId;
  encounterSource: EncounterSource;
  isBoss?: boolean;
  devMode?: boolean;
}

/** Scene の互換入力を、戦闘中に使う唯一の ruleset へ正規化する。 */
export function resolveBattleLaunchRuleset(input: BattleRulesetLaunchInput): BattleRuleset {
  const kind = input.kind ?? (input.encounterSource.type === 'script' ? 'event' : undefined);
  return resolveBattleRuleset({
    kind,
    isBossBattle: input.isBoss ?? false,
    canFleeBoss: input.devMode ?? false,
  });
}
