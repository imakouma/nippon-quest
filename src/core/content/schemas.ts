/**
 * content/ 配下の JSON の「正」となる Zod スキーマ。
 * - ここを変えたら `pnpm gen:schemas` で schemas/*.schema.json を再生成し、docs/04 も更新する。
 * - 問題（questions）の payload スキーマはここではなく各レンダラーが所有する（docs/01 §3.3）。
 */
import { z } from 'zod';

export const idSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9.-]*$/, 'id は小文字英数字・ドット・ハイフンのみ')
  .describe('一意なID（小文字英数字・ドット・ハイフン）');

/** "漢字[かんじ]" 形式のルビ付きテキスト */
export const rubyTextSchema = z.string().describe('RubyText: "漢字[かんじ]" 形式');

export const subjectSchema = z.enum(['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo']);
export const gradeSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);
export const gradeRangeSchema = z
  .tuple([gradeSchema, gradeSchema])
  .refine(([a, b]) => a <= b, 'gradeRange は [小, 大]');
export const elementSchema = z.enum(['hino', 'mizu', 'mori', 'tsuchi', 'kaze', 'hikari', 'yami', 'none']);

export const statsSchema = z.object({
  hp: z.number().int().nonnegative(),
  mp: z.number().int().nonnegative(),
  atk: z.number().nonnegative(),
  def: z.number().nonnegative(),
  spd: z.number().nonnegative(),
  wis: z.number().nonnegative(),
});
export const partialStatsSchema = statsSchema.partial();

// ───────────────────────── World / Island ─────────────────────────
export const islandSchema = z.object({
  id: idSchema,
  name: rubyTextSchema,
  order: z.number().int().positive(),
  mapKey: z.string(),
  areas: z.array(idSchema).min(1),
  bossId: idSchema,
  recommendedGrade: gradeRangeSchema,
  status: z.enum(['playable', 'stub']).default('stub').describe('stub = シルエット表示のみ'),
});

export const worldSchema = z.object({
  id: idSchema,
  name: rubyTextSchema,
  islands: z.array(islandSchema).min(1),
});

// ───────────────────────── Area (都道府県) ─────────────────────────
export const motifSchema = z.object({
  id: idSchema,
  name: rubyTextSchema,
  kind: z.enum(['landmark', 'food', 'craft', 'nature', 'festival', 'history']),
  blurb: rubyTextSchema,
  imageKey: z.string(),
});

export const encounterTableSchema = z.object({
  zone: z.string().describe('field / dungeon / マップ固有ゾーン名'),
  region: idSchema
    .optional()
    .describe(
      '名所エリア（regions の id）。あれば その エリアの 中だけで つかう（エリアの 表が 無い 地面は region なしの 表）',
    ),
  table: z.array(z.object({ monsterId: idSchema, weight: z.number().positive() })).min(1),
  stepsPerCheck: z.number().int().positive().default(12),
  rate: z.number().min(0).max(1).default(0.25),
});

export const rewardSchema = z.object({
  gold: z.number().int().nonnegative().optional(),
  xp: z.number().int().nonnegative().optional(),
  items: z.array(z.object({ itemId: idSchema, n: z.number().int().positive().default(1) })).optional(),
  skills: z.array(idSchema).optional(),
  recipes: z.array(idSchema).optional(),
  unlockMonsters: z.array(idSchema).optional(),
  title: rubyTextSchema.optional(),
});

export const dialogueLineSchema = z.object({
  speaker: rubyTextSchema.optional(),
  face: z.string().optional(),
  text: rubyTextSchema,
});

export const questionRequestSchema = z.object({
  subject: subjectSchema,
  gradeRange: gradeRangeSchema,
  tags: z.array(z.string()).optional(),
  type: z.string().optional().describe('省略時はエンジンが選ぶ'),
});

export const areaEventSchema = z.object({
  id: idSchema,
  motifId: idSchema,
  trigger: z.object({ map: z.string(), objectName: z.string() }),
  once: z.boolean().default(true),
  cutinImageKey: z.string().optional(),
  dialogue: z.array(dialogueLineSchema).min(1),
  question: questionRequestSchema,
  rewardByScore: z
    .array(z.object({ min: z.number().min(0).max(1), reward: rewardSchema }))
    .min(1)
    .refine((r) => r.some((x) => x.min === 0), 'score 0 でも報酬があること（GDD §7）'),
  afterDialogue: z.array(dialogueLineSchema).optional(),
});

export const shopEntrySchema = z.object({ itemId: idSchema, price: z.number().int().positive() });

export const missionConditionSchema = z
  .string()
  .regex(
    /^(defeat|collect):[a-z0-9.-]+:\d+$|^perfect:(kokugo|sansu|rika|shakai|seikatsu|eigo):\d+$|^event:[a-z0-9.-]+$|^recruit:[a-z0-9.-]+$/,
    'condition の形式: defeat:<monsterId>:<n> / collect:<itemId>:<n> / perfect:<subject>:<n> / event:<eventId> / recruit:<monsterId>',
  );

export const missionSchema = z.object({
  id: idSchema,
  title: rubyTextSchema,
  giverNpc: idSchema,
  condition: missionConditionSchema,
  reward: rewardSchema,
  hint: rubyTextSchema.optional(),
});

export const npcSchema = z.object({
  id: idSchema,
  name: rubyTextSchema,
  spriteKey: z.string(),
  face: z.string().optional(),
  role: z.enum(['shop', 'smith', 'inn', 'board', 'arena', 'dex', 'talk']),
  dialogue: z.array(dialogueLineSchema).min(1),
});

/**
 * 名所エリア：県の フィールドを 名所ごとの エリア（ステージ）に わける。エリアの さかいは 山なみで かこまれ、
 * 関所（regionGates）だけ とおれる。関所は エリアの ぬしを たおすと ひらく（さいしょは start の エリアだけ）
 */
export const regionSchema = z.object({
  id: idSchema,
  name: rubyTextSchema.describe('エリアの 名前（例：弘前城[ひろさきじょう]エリア）'),
  motifs: z.array(idSchema).describe('この エリアの 名所（motifs の id）'),
  boss: z
    .object({
      monsterId: idSchema,
      level: z.number().int().positive(),
      line: rubyTextSchema.optional().describe('はなしかけた ときの ぬしの ひとこと'),
    })
    .optional()
    .describe(
      'エリアの ぬし（さいしょの 名所の そばに 立つ。たおすと openedBy が この エリアの 関所が ひらく）',
    ),
  start: z.boolean().default(false),
});
export const regionGateSchema = z.object({
  between: z.tuple([idSchema, idSchema]),
  openedBy: idSchema.describe('この エリアの ぬしを たおすと ひらく'),
});

export const areaSchema = z.object({
  id: idSchema,
  name: rubyTextSchema,
  island: idSchema,
  capital: rubyTextSchema.optional(),
  status: z.enum(['playable', 'stub']).default('stub'),
  mapKeys: z.object({ field: z.string(), town: z.string(), dungeon: z.string() }).optional(),
  motifs: z.array(motifSchema),
  encounters: z.array(encounterTableSchema).default([]),
  regions: z.array(regionSchema).default([]).describe('名所エリア（無い 県は フィールドが 1 つの エリア）'),
  regionGates: z.array(regionGateSchema).default([]),
  boss: idSchema.optional(),
  midBoss: idSchema
    .optional()
    .describe('フィールドに立つ中ボス（monsters の id）。倒すと次の県へのワープホールが開く'),
  events: z.array(areaEventSchema).default([]),
  shop: z.array(shopEntrySchema).default([]),
  missions: z.array(missionSchema).default([]),
  town: z.object({ name: rubyTextSchema, npcs: z.array(npcSchema) }).optional(),
  secret: z
    .object({
      name: rubyTextSchema.describe('裏ステージの 名前（例：仙台城[せんだいじょう] 本丸[ほんまる]）'),
      boss: idSchema.describe('ラスボス（monsters の id。その土地の 歴史上の 人物）'),
    })
    .optional()
    .describe(
      '裏ステージ：県ボスを 倒すと フィールドの 入口（scripts/data/secrets.ts の 場所）が ひらき、おくに ラスボスが いる',
    ),
});

// ───────────────────────── Monster ─────────────────────────
export const bossPhaseSchema = z.object({
  hpBelow: z.number().min(0).max(1),
  skills: z.array(idSchema).optional(),
  spriteKey: z.string().optional(),
  element: elementSchema.optional(),
  actionsPerTurn: z.number().int().positive().optional(),
  line: rubyTextSchema.optional(),
});

export const monsterSchema = z.object({
  id: idSchema,
  name: rubyTextSchema,
  area: idSchema,
  motifId: idSchema,
  element: elementSchema,
  weakness: elementSchema.optional().describe('「しらべる」で判明するじゃくてん'),
  baseStats: statsSchema,
  growth: z.object({
    hp: z.number(),
    mp: z.number(),
    atk: z.number(),
    def: z.number(),
    spd: z.number(),
    wis: z.number(),
  }),
  skills: z.array(idSchema).default([]),
  drops: z.array(z.object({ itemId: idSchema, rate: z.number().min(0).max(1) })).default([]),
  recruitRate: z.number().min(0).max(1).default(0),
  recruitItem: idSchema.optional(),
  xp: z.number().int().nonnegative(),
  gold: z.number().int().nonnegative(),
  spriteKey: z.string(),
  dexBlurb: rubyTextSchema,
  isBoss: z.boolean().default(false),
  bossPhases: z.array(bossPhaseSchema).optional(),
  actionIntervalMs: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('（ターン制では つかわない。だれでも 1 ターンに 1 回 動く）むかしの リアルタイム用の 周期'),
  evolution: z
    .object({
      to: idSchema.describe('しんかした あとの モンスター id'),
      item: idSchema.describe('しんかに つかう どうぐ（count こ へる）'),
      count: z.number().int().positive().optional().describe('しんかに つかう どうぐの数（省略時は 1）'),
      minLevel: z.number().int().positive().optional().describe('このレベルから しんかできる'),
    })
    .optional()
    .describe('しんか：なかまの画面で item を つかうと to に なる'),
  fieldLine: rubyTextSchema
    .optional()
    .describe(
      'フィールドで道をふさぐ中ボスのセリフ。名前は出さず「？？？」の発言として出す（無ければ共通のセリフ）',
    ),
});

// ───────────────────────── Item / Set / Recipe ─────────────────────────
export const itemKindSchema = z.enum([
  'weapon',
  'head',
  'chest',
  'legs',
  'feet',
  'consumable',
  'material',
  'key',
]);
export const equipKinds = ['weapon', 'head', 'chest', 'legs', 'feet'] as const;

export const itemSchema = z.object({
  id: idSchema,
  name: rubyTextSchema,
  kind: itemKindSchema,
  stats: partialStatsSchema.optional(),
  element: elementSchema.optional(),
  grantsSkill: idSchema.optional(),
  setId: idSchema.optional(),
  price: z.number().int().nonnegative().optional(),
  use: z.object({ heal: z.number().int().optional(), mp: z.number().int().optional() }).optional(),
  iconKey: z.string(),
  blurb: rubyTextSchema,
  areaOrigin: idSchema.optional(),
});

export const equipSetSchema = z.object({
  id: idSchema,
  name: rubyTextSchema,
  pieces: z.array(idSchema).length(5),
  bonus: z.object({
    description: rubyTextSchema,
    elementBoost: z.array(z.object({ element: elementSchema, multiplier: z.number().positive() })).optional(),
    stats: partialStatsSchema.optional(),
  }),
});

export const recipeSchema = z.object({
  id: idSchema,
  result: z.object({ itemId: idSchema, n: z.number().int().positive().default(1) }),
  materials: z.array(z.object({ itemId: idSchema, n: z.number().int().positive() })).min(1),
  gold: z.number().int().nonnegative().default(0),
  unlockedByDefault: z.boolean().default(true),
});

// ───────────────────────── Skill (わざ) ─────────────────────────
export const skillSchema = z.object({
  id: idSchema,
  name: rubyTextSchema,
  subject: subjectSchema,
  gradeRange: gradeRangeSchema,
  unitHint: z.array(z.string()).optional(),
  power: z.number().nonnegative().describe('いりょく（100 = 1 ばい）'),
  element: elementSchema,
  mp: z.number().int().nonnegative().describe('敵が使うときの MP（味方の必殺技は 教科ゲージを使う）'),
  gauge: z
    .number()
    .int()
    .min(1)
    .max(3)
    .default(1)
    .describe('必殺技の つよさ（★1〜★3）。★が 多いほど 演出が はでに なる。使う ゲージの量は costGauge'),
  costGauge: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe(
      '打つのに使う 教科ゲージ（subject の ゲージ）の量。0 は 基本わざ（いつでも打てて、こたえると ゲージが たまる）。上限は settings.subjectGauge.max',
    ),
  targetType: z
    .enum(['singleEnemy', 'allEnemies', 'self', 'party'])
    .optional()
    .describe('だれに 効くか。省略時は effect から決まる（heal・buff → self、ほかは singleEnemy）'),
  effect: z
    .enum(['damage', 'heal', 'buff', 'debuff', 'scan', 'status'])
    .default('damage')
    .describe('status は あいての うごきを おくらせる（つぎの こうげきまでの 時間が のびる）'),
  questionTags: z.array(z.string()).optional(),
  flavor: rubyTextSchema.optional().describe('説明（description）'),
});

// ───────────────────────── Balance ─────────────────────────
export const xpTableSchema = z.object({
  hero: z.array(z.number().int().nonnegative()).min(2).describe('index = Lv, 値 = そのLvに必要な累積XP'),
  monster: z.array(z.number().int().nonnegative()).min(2),
});

export const elementTableSchema = z.object({
  elements: z.array(elementSchema),
  multipliers: z.record(elementSchema, z.record(elementSchema, z.number().positive())),
});

const bandNumbers = (n: z.ZodNumber) => z.object({ perfect: n, good: n, weak: n, miss: n });

export const settingsSchema = z.object({
  timeLimitSecByGrade: z.record(z.string(), z.number().positive()),
  scoreMultipliers: bandNumbers(z.number()).describe(
    '問題の できばえ → いりょくの 倍率（perfect=1.0 / good=0.5〜0.99 / weak=0.01〜0.49 / miss=0）',
  ),
  weaknessMultiplier: z.number().positive(),
  defeatGoldLossRate: z.number().min(0).max(1),
  recruitHpThreshold: z.number().min(0).max(1),
  recentQuestionWindow: z.number().int().positive(),
  adaptiveWeakUnitRatio: z.number().min(0).max(1),
  damageScale: z
    .number()
    .positive()
    .default(12)
    .describe('ダメージ式 BaseDamage = こうげき × いりょく ÷ ぼうぎょ × damageScale の 係数'),
  combo: z
    .object({
      perCombo: z
        .number()
        .min(0)
        .describe('1 コンボ（れんぞく せいかい）ごとの いりょく・けいけんち・おかねの 上乗せ'),
      maxBonus: z.number().min(0).describe('上乗せの 上限（0.5 = +50%）'),
      critBase: z.number().min(0).max(1).describe('かいしんの いちげき の 基本の 確率'),
      critPerCombo: z.number().min(0).max(1).describe('1 コンボごとに ふえる かいしんの 確率'),
      critMax: z.number().min(0).max(1).describe('かいしんの 確率の 上限'),
      critMultiplier: z.number().positive().describe('かいしんの いちげき の 倍率'),
    })
    .default({
      perCombo: 0.05,
      maxBonus: 0.5,
      critBase: 0.05,
      critPerCombo: 0.02,
      critMax: 0.25,
      critMultiplier: 1.5,
    })
    .describe('コンボ＆ストリーク倍率：れんぞく せいかいで いりょく・かいしん・けいけんち・おかねが ふえる'),
  subjectGauge: z
    .object({
      max: z.number().int().positive().describe('1 教科の ゲージの 上限'),
      charge: bandNumbers(z.number().int().nonnegative()).describe(
        '問題に こたえたとき その教科の ゲージに たまる量',
      ),
      companionBoost: z.number().positive().describe('オトモ（出撃中の 仲間）の 教科は この倍 たまる'),
      uniqueSkills: z
        .object({
          kokugo: idSchema,
          sansu: idSchema,
          rika: idSchema,
          shakai: idSchema,
          seikatsu: idSchema,
          eigo: idSchema,
        })
        .partial()
        .default({})
        .describe('教科ごとの 固有スキル（skills の id）。その教科の ゲージを ためれば だれでも 使える'),
    })
    .default({
      max: 100,
      charge: { perfect: 40, good: 30, weak: 15, miss: 10 },
      companionBoost: 1.5,
      uniqueSkills: {},
    })
    .describe('教科ゲージ：こたえると たまり、必殺技の costGauge ぶん つかう'),
  specialtyDropRate: z
    .number()
    .min(0)
    .max(1)
    .default(0.35)
    .describe('モンスターが その県の特産品を落とす確率（特産品ぜんぶ合わせて）'),
  turns: z
    .object({
      buffTurns: z.number().int().positive().describe('ぼうぎょ アップ・ダウンが つづく ターン数'),
      statusTurns: z
        .number()
        .int()
        .positive()
        .describe('「うごきを とめる」で 敵が 休む ターン数（できばえで のびる）'),
    })
    .default({ buffTurns: 3, statusTurns: 1 })
    .describe('ターン制の 長さ：1 ターンに 主人公・オトモ・てきが 1 回ずつ 動く'),
  bag: z
    .object({
      baseSlots: z.number().int().positive().describe('さいしょの マスの数'),
      levelsPerSlot: z
        .number()
        .int()
        .positive()
        .describe('主人公の レベルが これだけ 上がるごとに 1 マス ふえる'),
      maxSlots: z.number().int().positive().describe('マスの 上限'),
    })
    .default({ baseSlots: 3, levelsPerSlot: 2, maxSlots: 12 })
    .describe('バッグの マス：仲間（しんかの だんかい ぶん 1〜3 マス）と そうび（1 こ 1 マス）を 入れる'),
});

export const unitSchema = z.object({
  id: z.string().regex(/^(kokugo|sansu|rika|shakai|seikatsu|eigo)\.g[1-6]\.[a-z0-9-]+$/),
  name: rubyTextSchema,
  subject: subjectSchema,
  grade: gradeSchema,
});

export const arenaRivalSchema = z.object({
  id: idSchema,
  name: rubyTextSchema,
  face: z.string().optional(),
  heroLevel: z.number().int().positive(),
  monsters: z.array(z.object({ monsterId: idSchema, level: z.number().int().positive() })).max(3),
  equipment: z
    .object({ weapon: idSchema, head: idSchema, chest: idSchema, legs: idSchema, feet: idSchema })
    .partial(),
  intro: rubyTextSchema,
});

// ───────────────────────── 型の書き出し ─────────────────────────
export type Subject = z.infer<typeof subjectSchema>;
export type Grade = z.infer<typeof gradeSchema>;
export type GradeRange = z.infer<typeof gradeRangeSchema>;
export type Element = z.infer<typeof elementSchema>;
export type Stats = z.infer<typeof statsSchema>;
export type World = z.infer<typeof worldSchema>;
export type Island = z.infer<typeof islandSchema>;
export type Area = z.infer<typeof areaSchema>;
export type Motif = z.infer<typeof motifSchema>;
export type Monster = z.infer<typeof monsterSchema>;
export type Item = z.infer<typeof itemSchema>;
export type EquipSet = z.infer<typeof equipSetSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type Mission = z.infer<typeof missionSchema>;
export type AreaEvent = z.infer<typeof areaEventSchema>;
export type Npc = z.infer<typeof npcSchema>;
export type Reward = z.infer<typeof rewardSchema>;
export type XpTable = z.infer<typeof xpTableSchema>;
export type ElementTable = z.infer<typeof elementTableSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type Unit = z.infer<typeof unitSchema>;
export type Region = z.infer<typeof regionSchema>;
export type RegionGate = z.infer<typeof regionGateSchema>;
export type ArenaRival = z.infer<typeof arenaRivalSchema>;

/** gen-schemas / validate-content が走査する「ファイル種別 → スキーマ」の対応表 */
export const contentKinds = {
  world: { schema: worldSchema, glob: 'world/*.json', array: false },
  prefectures: { schema: areaSchema, glob: 'prefectures/*.json', array: false },
  monsters: { schema: monsterSchema, glob: 'monsters/*.json', array: false },
  items: { schema: itemSchema, glob: 'items/*.json', array: false },
  skills: { schema: skillSchema, glob: 'skills.json', array: true },
  recipes: { schema: recipeSchema, glob: 'recipes.json', array: true },
  sets: { schema: equipSetSchema, glob: 'sets.json', array: true },
  units: { schema: unitSchema, glob: 'units.json', array: true },
  xp: { schema: xpTableSchema, glob: 'balance/xp.json', array: false },
  elements: { schema: elementTableSchema, glob: 'balance/elements.json', array: false },
  settings: { schema: settingsSchema, glob: 'balance/settings.json', array: false },
  rivals: { schema: arenaRivalSchema, glob: 'arena/rivals.json', array: true },
} as const;

export type ContentKind = keyof typeof contentKinds;
