/**
 * セーブデータ（GameState）。子どものセーブを壊さないよう schemaVersion + マイグレーションを持つ。
 * 個人情報は一切入れない（GDD §8：ログイン不要・端末内保存）。
 */
import { z } from 'zod';
import { gradeSchema, idSchema, statsSchema } from '../content/schemas';

export const SCHEMA_VERSION = 1;

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
      hair: z.number().int().min(0).max(2),
      skin: z.number().int().min(0).max(2),
      cloth: z.number().int().min(0).max(2),
      hat: idSchema
        .nullable()
        .default(null)
        .describe('かぶっている かぶりもの（どうぐの id。progression/hats.ts）。null＝いつもの ぼうし'),
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
    team: z
      .array(z.string())
      .default([])
      .describe(
        'バッグに 入れた 仲間の uid（先頭が せんとう）。体の 上限は なく マスの数で きまる。空で activeUid が あれば その 1 体（progression/bag.ts）',
      ),
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
