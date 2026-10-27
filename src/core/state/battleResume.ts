import { z } from 'zod/v3';
import type { BattleState, Command } from '../battle/types';
import {
  elementSchema,
  safeNonnegativeIntegerSchema,
  safePositiveIntegerSchema,
  statsSchema,
  subjectSchema,
} from '../content/schemas';

export const BATTLE_RESUME_FORMAT_VERSION = 1;

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number().finite(),
    z.string(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

const buffSchema = z.object({ mult: z.number().finite().nonnegative(), turns: safeNonnegativeIntegerSchema });

const combatantSchema = z.object({
  id: z.string().min(1),
  refId: z.string().min(1),
  name: z.string(),
  isHero: z.boolean(),
  level: safePositiveIntegerSchema,
  element: elementSchema,
  subjectAffinity: subjectSchema.optional(),
  weakness: elementSchema.optional(),
  weaknessRevealed: z.boolean(),
  stats: statsSchema,
  hp: safeNonnegativeIntegerSchema,
  mp: safeNonnegativeIntegerSchema,
  skills: z.array(z.string().min(1)),
  buffs: z.object({ def: buffSchema.optional(), atk: buffSchema.optional() }),
  isBoss: z.boolean(),
  phaseIndex: z.number().int().min(-1).max(Number.MAX_SAFE_INTEGER),
  actionsPerTurn: safePositiveIntegerSchema,
  elementBoost: z.record(elementSchema, z.number().finite().nonnegative()).optional(),
  elementResists: z.array(elementSchema).optional(),
});

const enemySchema = combatantSchema.extend({ skipTurns: safeNonnegativeIntegerSchema });

const subjectGaugesSchema = z.object({
  kokugo: safeNonnegativeIntegerSchema,
  sansu: safeNonnegativeIntegerSchema,
  rika: safeNonnegativeIntegerSchema,
  shakai: safeNonnegativeIntegerSchema,
  seikatsu: safeNonnegativeIntegerSchema,
  eigo: safeNonnegativeIntegerSchema,
});

const companionSchema = z
  .object({
    id: z.string().min(1),
    name: z.string(),
    passiveSkill: z
      .object({ kind: z.literal('gaugeBoost'), subject: subjectSchema, mult: z.number().finite().positive() })
      .nullable(),
    activeSkill: z.string().min(1).nullable(),
  })
  .nullable();

export const battleStateResumeSchema = z.object({
  turn: safePositiveIntegerSchema,
  ally: z.object({
    hero: combatantSchema,
    monsters: z.array(combatantSchema),
    activeMonsterIndex: safeNonnegativeIntegerSchema,
    items: z.record(z.string(), safeNonnegativeIntegerSchema),
  }),
  enemy: enemySchema,
  player: z.object({
    subjectGauges: subjectGaugesSchema,
    comboCount: safeNonnegativeIntegerSchema,
    maxCombo: safeNonnegativeIntegerSchema,
  }),
  companion: companionSchema,
  rngState: jsonValueSchema.nullable(),
  seed: z.string().min(1),
  outcome: z.enum(['ongoing', 'victory', 'defeat', 'fled', 'recruited']),
  isBossBattle: z.boolean(),
  canFleeBoss: z.boolean().optional(),
  log: z.preprocess(() => [], z.array(z.never())),
});

const actionResultSchema = z.object({
  score: z.number().finite().min(0).max(1),
  timeMs: safeNonnegativeIntegerSchema,
  attempts: safeNonnegativeIntegerSchema,
});

const commandSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('attack') }),
  z.object({
    kind: z.literal('skill'),
    skillId: z.string().min(1),
    result: actionResultSchema,
    actorId: z.string().min(1).optional(),
  }),
  z.object({
    kind: z.literal('item'),
    itemId: z.string().min(1),
    result: actionResultSchema.optional(),
    timeLimitScale: z.number().finite().positive().optional(),
  }),
  z.object({ kind: z.literal('swap'), monsterIndex: safeNonnegativeIntegerSchema }),
  z.object({
    kind: z.literal('recruit'),
    result: actionResultSchema,
    itemId: z.string().min(1).optional(),
  }),
  z.object({ kind: z.literal('flee') }),
  z.object({ kind: z.literal('wait') }),
]);

const encounterSourceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('random') }),
  z.object({ type: z.literal('mid-boss') }),
  z.object({ type: z.literal('area-boss') }),
  z.object({ type: z.literal('last-boss') }),
  z.object({ type: z.literal('region-boss'), regionId: z.string().min(1) }),
  z.object({ type: z.literal('island-boss'), islandId: z.string().min(1) }),
  z.object({ type: z.literal('arena'), opponentId: z.string().min(1) }),
  z.object({ type: z.literal('script') }),
]);

const groundSchema = z.enum(['grass', 'forest', 'mountain', 'beach', 'shore', 'farm']);
const encounterZoneSchema = z.enum(['field', 'dungeon', 'forest', 'mountain', 'beach', 'shore', 'farm']);

const battleLaunchSchema = z.object({
  enemyId: z.string().min(1),
  level: safePositiveIntegerSchema,
  zone: encounterZoneSchema,
  ground: groundSchema.optional(),
  isBoss: z.boolean().optional(),
  devMode: z.boolean().optional(),
  forceRecruitOffer: z.boolean().optional(),
  presentation: z.enum(['side', 'depth']).optional(),
  encounterId: z.string().min(1),
  encounterSource: encounterSourceSchema,
});

const battleEndPayloadSchema = z.object({
  outcome: z.enum(['victory', 'defeat', 'fled', 'recruited']),
  goldLost: safeNonnegativeIntegerSchema,
});

export type BattleResumePhase =
  | { kind: 'awaiting-command' }
  | { kind: 'resolved-command'; command: Command }
  | { kind: 'awaiting-result' }
  | { kind: 'settled'; result: PersistedBattleEndPayload };

const battleResumePhaseSchema: z.ZodType<BattleResumePhase> = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('awaiting-command') }),
  z.object({ kind: z.literal('resolved-command'), command: commandSchema }),
  z.object({ kind: z.literal('awaiting-result') }),
  z.object({ kind: z.literal('settled'), result: battleEndPayloadSchema }),
]);

export interface ActiveBattleResume {
  formatVersion: 1;
  battleId: string;
  sequence: number;
  launch: PersistedBattleLaunch;
  battleState: BattleState;
  questionSeed: string;
  questionRngState: JsonValue;
  perfectBySubject: Record<string, number>;
  phase: BattleResumePhase;
}

export type PersistedEncounterSource =
  | { type: 'random' }
  | { type: 'mid-boss' }
  | { type: 'area-boss' }
  | { type: 'last-boss' }
  | { type: 'region-boss'; regionId: string }
  | { type: 'island-boss'; islandId: string }
  | { type: 'arena'; opponentId: string }
  | { type: 'script' };

export interface PersistedBattleLaunch {
  enemyId: string;
  level: number;
  zone: 'field' | 'dungeon' | 'forest' | 'mountain' | 'beach' | 'shore' | 'farm';
  ground?: 'grass' | 'forest' | 'mountain' | 'beach' | 'shore' | 'farm';
  isBoss?: boolean;
  devMode?: boolean;
  forceRecruitOffer?: boolean;
  presentation?: 'side' | 'depth';
  encounterId: string;
  encounterSource: PersistedEncounterSource;
}

export interface PersistedBattleEndPayload {
  outcome: 'victory' | 'defeat' | 'fled' | 'recruited';
  goldLost: number;
}

export const activeBattleResumeSchema: z.ZodType<ActiveBattleResume> = z.object({
  formatVersion: z.literal(BATTLE_RESUME_FORMAT_VERSION),
  battleId: z.string().min(1),
  sequence: safePositiveIntegerSchema,
  launch: battleLaunchSchema,
  battleState: battleStateResumeSchema,
  questionSeed: z.string().min(1),
  questionRngState: jsonValueSchema,
  perfectBySubject: z.record(z.string(), safeNonnegativeIntegerSchema),
  phase: battleResumePhaseSchema,
}) as z.ZodType<ActiveBattleResume>;

const salvagedActiveBattleSchema = z.preprocess((value) => {
  const parsed = activeBattleResumeSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}, activeBattleResumeSchema.nullable());

export const battleResumeStateSchema = z
  .object({
    nextSequence: safePositiveIntegerSchema,
    finalizedThrough: safeNonnegativeIntegerSchema,
    active: salvagedActiveBattleSchema,
  })
  .refine((value) => value.nextSequence > value.finalizedThrough, {
    message: 'nextSequence は finalizedThrough より大きい必要があります',
  });

export type BattleResumeState = z.infer<typeof battleResumeStateSchema>;

interface BattleResumeOwner {
  seed: string;
  battle: BattleResumeState;
}

export const emptyBattleResumeState = (): BattleResumeState => ({
  nextSequence: 1,
  finalizedThrough: 0,
  active: null,
});

function normalizedBattleState(state: BattleState): BattleState {
  return battleStateResumeSchema.parse({
    ...structuredClone(state),
    rngState: state.rngState ?? null,
    log: [],
  });
}

function normalizedQuestionRngState(state: unknown): JsonValue {
  return jsonValueSchema.parse(state ?? null);
}

export function beginBattleResume<T extends BattleResumeOwner>(
  game: T,
  input: {
    launch: PersistedBattleLaunch;
    battleState: BattleState;
    questionSeed: string;
    questionRngState: unknown;
    perfectBySubject: Readonly<Record<string, number>>;
  },
): { state: T; snapshot: ActiveBattleResume } {
  if (game.battle.active) throw new Error('進行中の戦闘があります');
  const sequence = game.battle.nextSequence;
  if (sequence >= Number.MAX_SAFE_INTEGER) throw new Error('戦闘通番が上限に達しました');
  const battleId = `${game.seed}.battle.${sequence}`;
  const snapshot = activeBattleResumeSchema.parse({
    formatVersion: BATTLE_RESUME_FORMAT_VERSION,
    battleId,
    sequence,
    launch: { ...input.launch, encounterId: battleId },
    battleState: normalizedBattleState(input.battleState),
    questionSeed: input.questionSeed,
    questionRngState: normalizedQuestionRngState(input.questionRngState),
    perfectBySubject: { ...input.perfectBySubject },
    phase: { kind: 'awaiting-command' },
  });
  const state = {
    ...game,
    battle: { ...game.battle, nextSequence: sequence + 1, active: snapshot },
  } as T;
  return { state, snapshot };
}

export function checkpointBattleResume<T extends BattleResumeOwner>(
  game: T,
  battleId: string,
  checkpoint: {
    battleState: BattleState;
    questionRngState: unknown;
    perfectBySubject: Readonly<Record<string, number>>;
    phase: BattleResumePhase;
  },
): T {
  const active = game.battle.active;
  if (!active || active.battleId !== battleId || active.sequence <= game.battle.finalizedThrough) return game;
  const next = activeBattleResumeSchema.parse({
    ...active,
    battleState: normalizedBattleState(checkpoint.battleState),
    questionRngState: normalizedQuestionRngState(checkpoint.questionRngState),
    perfectBySubject: { ...checkpoint.perfectBySubject },
    phase: checkpoint.phase,
  });
  return { ...game, battle: { ...game.battle, active: next } } as T;
}

export function discardBattleResume<T extends BattleResumeOwner>(game: T, battleId: string): T {
  const active = game.battle.active;
  if (!active || active.battleId !== battleId) return game;
  return {
    ...game,
    battle: {
      ...game.battle,
      finalizedThrough: Math.max(game.battle.finalizedThrough, active.sequence),
      active: null,
    },
  } as T;
}
