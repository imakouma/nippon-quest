/**
 * セーブデータ（GameState）。子どものセーブを壊さないよう schemaVersion + マイグレーションを持つ。
 * 個人情報は一切入れない（GDD §8：ログイン不要・端末内保存）。
 */
import { z } from 'zod';
import { gradeSchema, idSchema, statsSchema } from '../content/schemas';
import { attemptEventSchema, conceptStateSchema } from '../learning/state';

export const SCHEMA_VERSION = 6;

export const equipmentSchema = z
  .object({ weapon: idSchema, head: idSchema, chest: idSchema, legs: idSchema, feet: idSchema })
  .partial();

export const ownedMonsterSchema = z.object({
  uid: z.string(),
  monsterId: idSchema,
  nickname: z.string().max(8).optional(),
  level: z.number().int().positive(),
  xp: z.number().int().nonnegative(),
});

export const bagPlacementSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  rotated: z.boolean().default(false),
});

export const masteryRecordSchema = z.object({
  value: z.number().min(0).max(1),
  n: z.number().int().nonnegative(),
  lastAt: z.number(),
});

export const gameStateSchema = z.object({
  schemaVersion: z.number().int().positive(),
  createdAt: z.number(),
  updatedAt: z.number(),
  seed: z.string(),
  player: z.object({
    name: z.string().min(1).max(6),
    appearance: z.object({
      hair: z.number().int().min(0).max(7),
      skin: z.number().int().min(0).max(6),
      cloth: z.number().int().min(0).max(9),
      hairStyle: z.number().int().min(0).max(3).default(0),
      eyes: z.number().int().min(0).max(2).default(0),
    }),
    level: z.number().int().positive(),
    xp: z.number().int().nonnegative(),
    gold: z.number().int().nonnegative(),
    baseStats: statsSchema,
    bonusWis: z.number().nonnegative().default(0),
    skills: z.array(idSchema),
    equipment: equipmentSchema,
    hp: z.number().int().nonnegative(),
    mp: z.number().int().nonnegative(),
  }),
  party: z.object({
    owned: z.array(ownedMonsterSchema),
    activeUid: z.string().nullable(),
    team: z.array(z.string()).default([]).describe('バッグに配置した仲間の uid（先頭が戦闘中のオトモ）。'),
    reserve: z
      .array(z.string())
      .max(7)
      .default([])
      .describe('編成中だがバッグ外にいる控え。team と合わせて最大7体'),
    bagPlacements: z
      .record(z.string(), bagPlacementSchema)
      .default({ hero: { x: 1, y: 1, rotated: false } })
      .describe('2Dバッグ上の配置。キーは hero / mon:<uid> / eq:<slot>'),
  }),
  inventory: z.record(idSchema, z.number().int().nonnegative()),
  progress: z.object({
    currentIsland: idSchema,
    currentArea: idSchema,
    currentMap: z.string(),
    position: z.object({ x: z.number(), y: z.number() }),
    lastInn: z.object({ map: z.string(), x: z.number(), y: z.number() }).nullable(),
    areaSigns: z.array(idSchema).describe('集めた「県のしるし」'),
    islandsCleared: z.array(idSchema),
    eventsDone: z.array(idSchema),
    chestsOpened: z.array(z.string()),
    unlockedRecipes: z.array(idSchema),
    missions: z.record(
      idSchema,
      z.object({ status: z.enum(['accepted', 'done']), progress: z.number().int().nonnegative() }),
    ),
    counters: z
      .record(z.string(), z.number().int().nonnegative())
      .describe('defeat:<id> / perfect:<subject> / collect:<id> などの集計'),
  }),
  dex: z.object({ monsters: z.array(idSchema), items: z.array(idSchema), motifs: z.array(z.string()) }),
  learning: z.object({
    grade: gradeSchema.describe('出題の学年設定'),
    includeLower: z.boolean().default(true),
    challengeHigher: z.boolean().default(false),
    kanjiLevel: gradeSchema.describe('漢字表示レベル'),
    mastery: z.record(z.string(), masteryRecordSchema),
    recent: z.array(z.string()),
    mistakes: z.array(z.string()),
    playSecondsByDate: z.record(z.string(), z.number().int().nonnegative()),
    attempts: z.array(attemptEventSchema).default([]),
    conceptStates: z.record(z.string(), conceptStateSchema).default({}),
  }),
  arena: z.object({ badges: z.number().int().nonnegative(), ghostParty: z.unknown().nullable() }),
  settings: z.object({
    bgmVolume: z.number().min(0).max(1),
    seVolume: z.number().min(0).max(1),
    timeLimitScale: z.number().positive().default(1),
  }),
});

export type GameState = z.infer<typeof gameStateSchema>;
export type OwnedMonster = z.infer<typeof ownedMonsterSchema>;
