/**
 * 問題システムの「契約」。問題作成者 / UI担当 / ゲーム本体 の3者が共有する唯一の接点。
 * docs/01_ARCHITECTURE.md §3.2 と一致させること。変更は Plan で理由を明記し、レビューを通す。
 *
 * このファイルは Phaser にも Preact にも依存しない。
 */
import { z, type ZodTypeAny } from 'zod';

export type Subject = 'kokugo' | 'sansu' | 'rika' | 'shakai' | 'seikatsu' | 'eigo';
export type Grade = 1 | 2 | 3 | 4 | 5 | 6;

/** "漢字[かんじ]" 形式のルビ付き文字列 */
export type RubyText = string;

// ── 問題データ（content/questions/**.json の 1 要素） ─────────────────────
export const questionBaseSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9][a-z0-9.-]*$/)
    .describe('一意なID。例 "sansu.g1.tashizan.0001"'),
  type: z.string().min(1).describe('レンダラーのキー。例 "choice"'),
  subject: z.enum(['kokugo', 'sansu', 'rika', 'shakai', 'seikatsu', 'eigo']),
  grade: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  unit: z
    .string()
    .regex(/^(kokugo|sansu|rika|shakai|seikatsu|eigo)\.g[1-6]\.[a-z0-9-]+$/)
    .describe('単元コード'),
  tags: z.array(z.string()).optional(),
  timeLimitSec: z.number().positive().optional(),
  payload: z.unknown().describe('タイプ固有。各レンダラーの schema で検証'),
  explanation: z.string().optional().describe('解説（RubyText）'),
});

export interface QuestionBase {
  id: string;
  type: string;
  subject: Subject;
  grade: Grade;
  unit: string;
  tags?: string[];
  timeLimitSec?: number;
  payload: unknown;
  explanation?: RubyText;
}

// ── レンダラーがゲーム本体に返すもの ──────────────────────────────────
export interface QuestionResult {
  questionId: string;
  /** 0.0〜1.0。ゲーム本体（バトル・イベント）はこれしか見ない */
  score: number;
  timeMs: number;
  attempts: number;
  timedOut?: boolean;
  /** 分析用（習熟度グラフなど）。ゲームロジックには使わない */
  detail?: Record<string, unknown>;
}

// ── レンダラーの契約 ────────────────────────────────────────────────
export interface AssetResolver {
  /** "questions/eigo/apple.png" → 実際の URL */
  image(relPath: string): string;
  audio(relPath: string): string;
}

export interface RendererContext {
  /** ここに描画する（Canvas の上の DOM オーバーレイ）。空の div が渡される */
  container: HTMLElement;
  question: QuestionBase;
  /** プレイヤーの学年設定（漢字表示レベルに使う） */
  grade: Grade;
  assets: AssetResolver;
  speak: (text: string) => void;
  timeLimitMs: number;
  onProgress?: (p: { attempts: number }) => void;
  /** キャンセル用（バトル中断など）。abort されたらレンダラーは score 0 で resolve する */
  signal?: AbortSignal;
}

export interface QuestionRenderer {
  type: string;
  /** payload のスキーマ。schemas/questions/<type>.schema.json の元になる唯一の正 */
  schema: ZodTypeAny;
  /** 解答確定 or 時間切れで resolve。reject しない */
  mount(ctx: RendererContext): Promise<QuestionResult>;
  unmount?(): void;
}

// ── ゲーム本体が問題エンジンに頼むもの ────────────────────────────────
export interface QuestionQuery {
  subject: Subject;
  gradeRange: [Grade, Grade];
  tags?: string[];
  /** 特定タイプに限定（イベントなど）。省略時はエンジンが選ぶ */
  type?: string;
  excludeIds?: string[];
  preferUnits?: string[];
}

/** score → 演出カテゴリ（GDD §4.3 の表）。UI とバトルで共通利用 */
export type ScoreBand = 'perfect' | 'good' | 'weak' | 'miss';
export function scoreBand(score: number): ScoreBand {
  if (score >= 1) return 'perfect';
  if (score >= 0.5) return 'good';
  if (score > 0) return 'weak';
  return 'miss';
}
