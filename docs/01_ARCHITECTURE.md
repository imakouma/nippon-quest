# 01 — アーキテクチャ仕様

> Antigravity に **コードを書かせる前に必ず読ませる** 技術仕様。GDD（`00_GAME_DESIGN.md`）が「何を作るか」、このファイルは「どう分けて作るか」。特に §3 の **問題コンテンツ／問題UI／ゲーム本体の三分割** はこのプロジェクトの生命線なので、AIがここを崩そうとしたら止めてください。

---

## 1. 技術スタック

| 項目 | 選定 | 理由 |
|---|---|---|
| ゲームエンジン | **Phaser 3**（3.80 以降） | ドット絵2D RPG の定番。タイルマップ・アニメ・入力・音が揃っていて、AIエージェントの学習データも多い |
| 言語 | **TypeScript**（`strict: true`） | AIが書いたコードの型崩れを早期に検出。JSONスキーマから型を生成できる |
| ビルド | **Vite** | 速い。GitHub Pages / Cloudflare Pages にそのままデプロイ可 |
| UIレイヤ | **Phaser の上に DOM オーバーレイ**（`Phaser.GameObjects.DOMElement` ではなく、Canvas の上に絶対配置した通常の HTML/CSS） | 問題UI（ドラッグ／なぞり／スライダー）は DOM の方が圧倒的に作りやすく、**UI担当がゲームエンジンを知らなくても Web の知識だけで作れる** |
| 問題UIのフレームワーク | **Preact**（React 互換・軽量） | UI担当が React 経験者でも入りやすい。必要なら素の DOM でも可 |
| マップ | **Tiled**（`.tmj` JSON 形式） | Phaser ネイティブ対応。マップ編集を非エンジニアにも渡せる |
| 状態管理 | 自前の `GameState`（プレーンオブジェクト）＋ Zod でバリデーション | セーブデータ＝GameState の JSON |
| 保存 | `localStorage`（設定）＋ `IndexedDB`（セーブスロット・図鑑）。`localforage` 使用可 | ログイン不要要件 |
| テスト | **Vitest**（ロジック）＋ **Playwright**（E2E スモーク） | バトル計算・ドロップ抽選・スキーマ検証はユニットテスト必須 |
| バリデーション | **Zod**（実行時）＋ `zod-to-json-schema` で JSON Schema を書き出し | 問題作成者のエディタ補完（VS Code の `$schema`）と CI の両方に効く |
| Lint/Format | ESLint + Prettier | AIの出力を揃える |
| 音 | Phaser 標準（Web Audio） | — |
| 読み上げ | Web Speech API（`speechSynthesis`, `ja-JP`） | 音声ファイルを作らずに済む。英単語は事前録音 mp3 を優先 |

Node 20 以上。パッケージマネージャは **pnpm**。

---

## 2. ディレクトリ構成

```
nihonquest/
├── docs/                         ← このドキュメント一式（AIのコンテキスト）
│   ├── 00_GAME_DESIGN.md
│   ├── 01_ARCHITECTURE.md
│   └── ...
├── .agent/                       ← Antigravity のルール／ワークフロー（02_ANTIGRAVITY_PROMPTS.md 参照）
├── content/                      ★ 問題作成者・コンテンツ担当の領域（コード禁止、JSONのみ）
│   ├── world/japan.json          ← 島（地方）と area（都道府県）の一覧・順序
│   ├── prefectures/
│   │   ├── aomori.json           ← 名所・敵・ボス・イベント・ショップ・ミッション
│   │   ├── iwate.json
│   │   └── ...
│   ├── monsters/*.json           ← モンスター定義（県をまたいで使うものはここ）
│   ├── items/*.json              ← アイテム・装備・素材
│   ├── recipes.json              ← 合成レシピ
│   ├── skills.json               ← わざ（教科・学年帯・威力・属性）
│   ├── questions/                ★★ 問題作成者の主戦場
│   │   ├── sansu/g1/*.json
│   │   ├── kokugo/g2/*.json
│   │   ├── rika/g4/*.json
│   │   └── ...
│   ├── balance/                  ← 経験値テーブル、エンカウント率、ドロップ率補正
│   └── i18n/ja.json              ← システムUIの文言（ボタン名など）
├── schemas/                      ← content/ のJSONスキーマ（コードから自動生成、手で編集しない）
│   ├── questions/choice.schema.json
│   ├── questions/picture-word.schema.json
│   ├── prefecture.schema.json
│   └── ...
├── assets/                       ← 画像・音（03_IMAGE_PROMPTS.md の命名規則）
│   ├── sprites/{characters,monsters,bosses,npcs}/
│   ├── tilesets/
│   ├── ui/
│   ├── items/
│   ├── portraits/
│   └── audio/{bgm,se,words}/
├── maps/                         ← Tiled の .tmj / .tsj
├── src/
│   ├── main.ts
│   ├── core/                     ← ゲーム本体（バトル・進行・セーブ）
│   │   ├── state/                ← GameState、セーブ/ロード、Zodスキーマ
│   │   ├── battle/               ← バトルエンジン（純粋ロジック、Phaser非依存）
│   │   ├── progression/          ← レベル・習熟度・ミッション判定
│   │   ├── content/              ← content/ の読み込み・索引・型
│   │   └── rng.ts                ← シード付き乱数（対戦の決定論性）
│   ├── scenes/                   ← Phaser の Scene（Boot / Title / Overworld / Battle / Menu / Arena）
│   ├── questions/                ★ 問題システム
│   │   ├── engine/               ← 出題選択（アダプティブ）、QuestionResult、レジストリ
│   │   ├── renderers/            ★★ UI担当の主戦場（タイプごとに1フォルダ）
│   │   │   ├── choice/
│   │   │   ├── picture-word/
│   │   │   ├── number-build/
│   │   │   ├── sort-order/
│   │   │   ├── map-tap/
│   │   │   ├── experiment/
│   │   │   ├── kanji-trace/
│   │   │   └── pair-match/
│   │   └── contracts.ts          ← 両チームの契約（型定義）。変更はレビュー必須
│   ├── ui/                       ← 共通UI（ふりがな表示、ダイアログ、メニュー）
│   └── tools/                    ← 開発用ツール（後述の Question Playground など）
├── tests/
├── scripts/                      ← スキーマ生成、コンテンツ検証、画像後処理
└── package.json
```

---

## 3. 三分割の契約（最重要）

### 3.1 登場人物

```
[問題作成者]  ──編集──▶  content/questions/**/*.json
                             │ 検証: schemas/questions/<type>.schema.json
                             ▼
[問題エンジン] src/questions/engine  ── 選んだ問題を ──▶ [レンダラー] src/questions/renderers/<type>
      ▲                                                          │ 編集: UI担当
      │ pick({subject, gradeRange, tags})                        │
      │                                                          ▼ QuestionResult
[ゲーム本体] src/core, src/scenes  ◀─────────────────────────────┘
```

### 3.2 `src/questions/contracts.ts`（この形を守る）

```ts
// ── 問題データ（content/questions の1要素） ──────────────────
export type Subject = 'kokugo' | 'sansu' | 'rika' | 'shakai' | 'seikatsu' | 'eigo';
export type Grade = 1 | 2 | 3 | 4 | 5 | 6;

export interface QuestionBase {
  id: string;                 // 例 "sansu.g1.tashizan.0001"（一意。ファイル名と一致させる）
  type: string;               // レンダラーのキー。例 "choice"
  subject: Subject;
  grade: Grade;
  unit: string;               // 単元コード。例 "sansu.g1.tashizan"
  tags?: string[];            // 例 ["prefecture:aomori", "theme:apple"]
  timeLimitSec?: number;      // 省略時は学年帯のデフォルト
  payload: unknown;           // タイプ固有。各タイプの Zod スキーマで検証
  explanation?: RubyText;     // 解説（正解後に任意表示）
}

// ふりがな付きテキスト。"漢字[かんじ]" 形式の文字列（描画側でルビ化）
export type RubyText = string;

// ── レンダラーがゲーム本体に返すもの ───────────────────────
export interface QuestionResult {
  questionId: string;
  score: number;      // 0.0〜1.0。バトルはこれしか見ない
  timeMs: number;
  attempts: number;
  detail?: Record<string, unknown>;  // 分析用（保護者メニューの習熟度など）
}

// ── レンダラーの契約 ─────────────────────────────────────
export interface RendererContext {
  container: HTMLElement;       // ここに描画する（Canvas の上のオーバーレイ）
  question: QuestionBase;
  grade: Grade;                 // プレイヤーの学年設定（漢字表示レベルに使う）
  assets: AssetResolver;        // 画像・音声のURL解決（例 assets.image('items/apple')）
  speak: (text: string) => void;// 読み上げ
  timeLimitMs: number;
  onProgress?: (p: { attempts: number }) => void;
}

export interface QuestionRenderer {
  type: string;                                   // "choice" など
  schema: import('zod').ZodTypeAny;               // payload のスキーマ（ここが唯一の正）
  mount(ctx: RendererContext): Promise<QuestionResult>;  // 解答確定 or 時間切れで resolve
  unmount?(): void;
}

// ── ゲーム本体が問題エンジンに頼むもの ───────────────────
export interface QuestionQuery {
  subject: Subject;
  gradeRange: [Grade, Grade];
  tags?: string[];             // 県イベントなどで指定
  excludeIds?: string[];       // 直近出題の除外
  preferUnits?: string[];      // 習熟度の低い単元
}
```

### 3.3 ルール

1. **バトル・イベントのコードは `QuestionResult.score` 以外を見ない。** タイプ名で分岐するコードが `src/core` や `src/scenes` に現れたら設計違反。
2. **レンダラーは `RendererContext` の外の世界を知らない。** Phaser を import しない。`GameState` を触らない。
3. **`schema` はレンダラーが所有する。** `scripts/gen-schemas.ts` が全レンダラーの `schema` から `schemas/questions/*.schema.json` を生成し、問題作成者はそれで補完・検証する。
4. **問題JSONが増えてもビルド不要。** `content/` は Vite の `import.meta.glob` で読むか、`public/content` に置いて fetch する。MVPでは後者（問題作成者がファイルを置くだけでリロードで反映）。
5. 新タイプ追加の手順（UI担当）：`renderers/<type>/` を作る → `index.ts` で `QuestionRenderer` を export → `renderers/registry.ts` に1行追加 → `content/questions/_samples/<type>.json` にサンプル問題を3問 → `pnpm gen:schemas`。**これ以外のファイルを触らずに済むこと。**

### 3.5 教材の学術レビュー

- 自動検査は構造・参照・正解形式を保証するが、設問内容の学術的正確性を承認しない。
- 公式出典と承認記録は `content/quality/academic-reviews.json` に集約する。
- 人間が問題ファイルを確認したら、担当者・確認日・出典ID・ファイルの SHA-256 を `reviews` に記録する。
- 承認済みファイルの内容が変わると `pnpm validate:content` が失敗する。変更内容を再確認してからハッシュと確認日を更新する。
- 統計、制度、地名など変化し得る事実は、台帳の `changingFactsRequireCurrentSource` に従い、確認時点で最新の一次資料を使う。
- 未承認ファイル数は検証時に情報として表示する。未承認を「確認済み」とみなしてはならない。
- 未承認数は通常の `validate:content` では情報として表示し、ビルド不具合の警告と混ぜない。
  人による承認をリリース条件にする場合は `pnpm audit:academic-review:strict` を使う。
- `imageKey` / `spriteKey` に対応する外部 PNG は任意の差し替え素材である。ゲーム内生成絵のない対象は
  描画テストでエラーにし、外部 PNG がないこと自体は欠損警告にしない。

### 3.4 Question Playground（両チームの共通デバッグ画面）

`/playground.html` — ゲームを起動せずに、任意の問題JSONを貼り付け／ファイル選択して、そのタイプのレンダラーで即表示・採点確認できる画面。**MVPの最初の週に作る**（問題作成者とUI担当がゲーム本体の完成を待たずに並行作業できるようになる）。

ステージの下は **問題いちらん**（開発用。`src/tools/QuestionList.tsx`）：`content/questions` の問題を全部 表で出し（id・教科・学年・単元・タイプ・問題文・選択肢と正解・解説）、教科・学年・タイプ・単元・ことばで しぼりこめる。行を押すと その問題を上のステージで出し、URL が `?q=<問題 id>` になる（リロード・共有しても同じ問題が開く）。スキーマに合わない問題・未登録タイプ・id の重複は赤く出る。「↻ よみなおす」で JSON を置き直したあとも読み直せる。左の学年を選ぶと、ゲームと同じく まだ習っていない漢字のことばは ひらがなで出る。いちらんは問題タイプで分岐しない（`prompt`・`choices`/`words`/`cards`・`answer` という よくある形から拾う）。

---

## 4. コンテンツデータの型（要点。全文は `04_CONTENT_TEMPLATES.md`）

```ts
// content/world/japan.json
interface World { id: 'japan'; islands: Island[] }
interface Island { id: 'tohoku'; name: RubyText; order: number; areas: string[]; bossId: string; mapKey: string }

// content/prefectures/<code>.json
interface Area {
  id: 'aomori'; name: RubyText; island: 'tohoku';
  motifs: Motif[];                 // 名所・特産品（図鑑・イベント・出題の共通ソース）
  encounters: EncounterTable[];    // ゾーンごとの出現テーブル
  boss: string;                    // monsters の id
  events: AreaEvent[];
  shop: ShopEntry[];
  missions: Mission[];
  town: { name: RubyText; npcs: Npc[] };
}
interface Motif { id: string; name: RubyText; kind: 'landmark'|'food'|'craft'|'nature'|'festival'|'history'; blurb: RubyText; imageKey: string }

// content/monsters/*.json
interface Monster {
  id: string; name: RubyText; area: string; motifId: string;
  element: Element; baseStats: Stats; growth: Growth; skills: string[];
  drops: { itemId: string; rate: number }[]; recruitRate: number; recruitItem?: string;
  xp: number; gold: number; spriteKey: string; dexBlurb: RubyText;
  isBoss?: boolean; bossPhases?: BossPhase[];
}

// content/items/*.json
interface Item {
  id: string; name: RubyText; kind: 'weapon'|'head'|'chest'|'legs'|'feet'|'consumable'|'material'|'key';
  stats?: Partial<Stats>; element?: Element; grantsSkill?: string; setId?: string;
  price?: number; iconKey: string; blurb: RubyText; areaOrigin?: string;
}

// content/skills.json（わざ）
interface Skill {
  id: string; name: RubyText; subject: Subject; gradeRange: [Grade, Grade];
  power: number; element: Element; mp: number; questionTags?: string[];
  effect?: 'damage'|'heal'|'buff'|'debuff'|'scan';   // scan = じゃくてん判明（理科）
}
```

すべての `id` は **小文字英数字とドット・ハイフンのみ**、全ファイル横断で一意。`scripts/validate-content.ts` が重複・参照切れ（存在しない `itemId` など）を CI で落とす。

---

## 5. ゲーム本体の設計メモ

- **バトルエンジンは Phaser 非依存の純粋関数群**（`src/core/battle`）。リアルタイム・コマンドゲージバトル（GDD §4）：`tick(state, dtMs)` で 時間を すすめ（敵・オトモの タイマー、コマンドゲージ）、`act(state, command)` で プレイヤーの コマンド → 新状態＋演出イベント列（`BattleEvent[]`）。Scene は `settings.realtime.tickMs` ごとに tick を よび、イベント列を再生するだけ。同じ 乱数シード＋同じ「時刻つき コマンド列」（`replay`）なら 同じ 結果 → ユニットテスト可能、対戦のリプレイ可能。
- **乱数は必ず `rng.ts`（seedrandom 等）経由。** `Math.random` 禁止（ESLint ルールで弾く）。
- **Scene 構成**：`Boot`（アセット）→ `Title` → `Overworld`（島マップ、エリア内マップを切替）→ `Battle` → `Menu`（装備・図鑑・仲間）→ `Arena`（対戦）→ `Parent`（保護者メニュー）。`Battle` と各種メニューは `Overworld` を pause して上に重ねる。
- **GameState**（セーブデータ）は1つの Zod スキーマ。`schemaVersion` を持ち、マイグレーション関数を用意（子どものセーブを壊さない）。
- **ふりがな**：`RubyText`（`"漢字[かんじ]"`）を `<ruby>` に変換する共通コンポーネント `RubyLabel`。学年設定が漢字配当学年未満なら、漢字を消してかなだけにする（配当表は `content/i18n/kanji-grades.json`）。Phaser 側（Canvas）の文字は BitmapText でルビ描画するのが面倒なので、**会話・メニューなど文章はすべて DOM オーバーレイ側で描画** する方針。
- **アセット読み込み**：Phaser の `pixelArt: true`、`roundPixels: true`、`zoom` は整数。CSS 側も `image-rendering: pixelated`。

---

## 6. 開発ワークフロー（人間 × Antigravity）

1. `docs/` を更新 → 2. Antigravity にステップ単位のプロンプト（`02_ANTIGRAVITY_PROMPTS.md`）→ 3. Implementation Plan を **人間がレビュー**（三分割が崩れていないか、`content/` にコードが混ざっていないか）→ 4. 実装 → 5. `pnpm test && pnpm validate:content && pnpm build` が通る → 6. Walkthrough（Antigravity が生成する動作説明）を確認 → 7. コミット。
- ブランチ：`main`（常に動く）／`feat/<step>`。Antigravity には feat ブランチで作業させる。
- コミットは小さく。1ステップ＝1PR 相当。
