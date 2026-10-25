import { z } from 'zod/v3';
import type { EventQuestionRequest, FieldEventCommand } from '../events/contracts';
import { MAP_OBJECT_MOVEMENT_STEP_LIMIT } from '../events/mapObjectMovementRuntime';
import type { Grade } from '../../questions/contracts';

interface MutableDialogueLine {
  speaker?: string;
  face?: string;
  text: string;
}

interface MutableQuestionRequest {
  subject: EventQuestionRequest['subject'];
  gradeRange: [Grade, Grade];
  tags?: string[];
  type?: string;
}

interface MutableReward {
  gold?: number;
  xp?: number;
  items?: { itemId: string; n: number }[];
  skills?: string[];
  recipes?: string[];
  unlockMonsters?: string[];
  title?: string;
}

interface AreaEventSchemaDependencies {
  id: z.ZodType<string>;
  rubyText: z.ZodType<string>;
  dialogueLine: z.ZodType<MutableDialogueLine>;
  questionRequest: z.ZodType<MutableQuestionRequest>;
  reward: z.ZodType<MutableReward, z.ZodTypeDef, unknown>;
  safeNonnegativeInteger: z.ZodType<number>;
  safePositiveInteger: z.ZodType<number>;
}

/** Area event schemas share content primitives while keeping recursive commands in their own module. */
export function createAreaEventSchemas(deps: AreaEventSchemaDependencies) {
  const rewardByScoreSchema = z
    .array(z.object({ min: z.number().min(0).max(1), reward: deps.reward }))
    .min(1)
    .refine((rewards) => rewards.some((entry) => entry.min === 0), 'score 0 でも報酬があること（GDD §7）');

  const legacyAreaEventSchema = z.object({
    id: deps.id,
    motifId: deps.id,
    trigger: z.object({ map: z.string(), objectName: z.string() }),
    once: z.boolean().default(true),
    cutinImageKey: z.string().optional(),
    dialogue: z.array(deps.dialogueLine).min(1),
    question: deps.questionRequest,
    rewardByScore: rewardByScoreSchema,
    afterDialogue: z.array(deps.dialogueLine).optional(),
  });

  const eventConditionSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('choice'), key: deps.id, equals: z.number().int().nonnegative() }),
    z.object({
      type: z.literal('score'),
      key: deps.id,
      min: z.number().min(0).max(1),
      max: z.number().min(0).max(1).optional(),
    }),
    z.object({ type: z.literal('battle'), key: deps.id, outcome: z.enum(['victory', 'defeat']) }),
    z.object({ type: z.literal('flag'), flag: deps.id, isSet: z.boolean().default(true) }),
  ]);

  const movementCommandSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('walk'), direction: z.enum(['down', 'left', 'right', 'up']) }),
    z.object({ type: z.literal('face'), direction: z.enum(['down', 'left', 'right', 'up']) }),
    z.object({ type: z.literal('wait'), durationMs: deps.safeNonnegativeInteger }),
    z.object({ type: z.literal('emote'), emote: z.string().min(1) }),
    z.object({ type: z.literal('hide') }),
    z.object({ type: z.literal('show') }),
  ]);

  const fieldEventCommandSchema: z.ZodType<FieldEventCommand, z.ZodTypeDef, unknown> = z.lazy(() =>
    z.discriminatedUnion('type', [
      z.object({ type: z.literal('dialogue'), lines: z.array(deps.dialogueLine).min(1) }),
      z.object({
        type: z.literal('choice'),
        key: deps.id,
        lines: z.array(deps.dialogueLine).min(1),
        choices: z.array(deps.rubyText).min(1),
      }),
      z.object({ type: z.literal('question'), key: deps.id, request: deps.questionRequest }),
      z.object({ type: z.literal('reward'), scoreKey: deps.id, table: rewardByScoreSchema }),
      z.object({ type: z.literal('set-flag'), flag: deps.id }),
      z.object({
        type: z.literal('battle'),
        key: deps.id,
        enemyId: deps.id,
        level: deps.safePositiveInteger.optional(),
        isBoss: z.boolean().optional(),
      }),
      z.object({ type: z.literal('warp'), map: z.string().min(1), spawn: z.string().min(1).optional() }),
      z.object({
        type: z.literal('movement'),
        objectId: z.string().min(1),
        commands: z.array(movementCommandSchema).min(1).max(MAP_OBJECT_MOVEMENT_STEP_LIMIT),
      }),
      z.object({
        type: z.literal('branch'),
        condition: eventConditionSchema,
        then: z.array(fieldEventCommandSchema),
        else: z.array(fieldEventCommandSchema).optional(),
      }),
    ]),
  );

  const scriptedAreaEventSchema = z.object({
    id: deps.id,
    motifId: deps.id,
    trigger: z.object({ map: z.string(), objectName: z.string() }),
    once: z.boolean().default(true),
    cutinImageKey: z.string().optional(),
    steps: z.array(fieldEventCommandSchema).min(1),
  });

  return {
    legacyAreaEventSchema,
    eventConditionSchema,
    fieldEventCommandSchema,
    scriptedAreaEventSchema,
    areaEventSchema: z.union([legacyAreaEventSchema, scriptedAreaEventSchema]),
  };
}
