import { STANDARD_ENEMY_TACTICS, type EnemyTacticsPolicy } from './enemyPolicy';

export type BattleRulesetId = 'normal' | 'boss' | 'tutorial' | 'event';
export type FleeRule =
  { readonly mode: 'speed-check' } | { readonly mode: 'blocked' } | { readonly mode: 'guaranteed' };
export type RecruitmentRule = { readonly mode: 'standard' } | { readonly mode: 'disabled' };
export type RewardRule = { readonly mode: 'standard' } | { readonly mode: 'none' };
export type QuestionRule = { readonly mode: 'skill-driven' } | { readonly mode: 'scripted' };
export type PartyRule =
  | { readonly source: 'saved'; readonly persistence: 'standard' }
  | { readonly source: 'provided'; readonly persistence: 'discard' };

export interface BattleRuleset {
  readonly id: BattleRulesetId;
  readonly enemyTactics: EnemyTacticsPolicy;
  readonly flee: FleeRule;
  readonly recruitment: RecruitmentRule;
  readonly rewards: RewardRule;
  readonly questions: QuestionRule;
  readonly party: PartyRule;
}

export const NORMAL_BATTLE_RULESET: BattleRuleset = {
  id: 'normal',
  enemyTactics: STANDARD_ENEMY_TACTICS,
  flee: { mode: 'speed-check' },
  recruitment: { mode: 'standard' },
  rewards: { mode: 'standard' },
  questions: { mode: 'skill-driven' },
  party: { source: 'saved', persistence: 'standard' },
};

export const BOSS_BATTLE_RULESET: BattleRuleset = {
  ...NORMAL_BATTLE_RULESET,
  id: 'boss',
  flee: { mode: 'blocked' },
  recruitment: { mode: 'disabled' },
};

export const TUTORIAL_BATTLE_RULESET: BattleRuleset = {
  ...NORMAL_BATTLE_RULESET,
  id: 'tutorial',
  flee: { mode: 'blocked' },
  recruitment: { mode: 'disabled' },
  rewards: { mode: 'none' },
  questions: { mode: 'scripted' },
  party: { source: 'provided', persistence: 'discard' },
};

export const EVENT_BATTLE_RULESET: BattleRuleset = {
  ...NORMAL_BATTLE_RULESET,
  id: 'event',
};

const PRESETS: Readonly<Record<BattleRulesetId, BattleRuleset>> = {
  normal: NORMAL_BATTLE_RULESET,
  boss: BOSS_BATTLE_RULESET,
  tutorial: TUTORIAL_BATTLE_RULESET,
  event: EVENT_BATTLE_RULESET,
};

export function resolveBattleRuleset(input: {
  kind?: BattleRulesetId;
  isBossBattle?: boolean;
  canFleeBoss?: boolean;
  enemyTactics?: EnemyTacticsPolicy;
} = {}): BattleRuleset {
  const kind = input.kind ?? (input.isBossBattle ? 'boss' : 'normal');
  const preset = PRESETS[kind];
  const bossRestrictions = Boolean(input.isBossBattle && kind !== 'tutorial');
  return {
    ...preset,
    enemyTactics: input.enemyTactics ?? preset.enemyTactics,
    flee:
      bossRestrictions && !input.canFleeBoss
        ? { mode: 'blocked' }
        : bossRestrictions && input.canFleeBoss
          ? { mode: 'speed-check' }
          : preset.flee,
    recruitment: bossRestrictions ? { mode: 'disabled' } : preset.recruitment,
  };
}
