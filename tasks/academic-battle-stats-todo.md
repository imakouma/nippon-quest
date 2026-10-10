# 文理ステータス・ポケモン型戦闘計算 — Task List

Source: `SPEC-academic-battle-stats.md`
Plan: `tasks/academic-battle-stats-plan.md`

## Phase 1: Baseline and contracts

### Task 1: 現行バランスの再現可能な基準を記録

**Acceptance criteria:**

- [ ] 固定シードで代表通常敵・中ボス・県ボスの戦闘指標を出力できる。
- [ ] 完璧・平均・不正解中心の3条件を比較できる。
- [ ] 変更前の結果をJSONとして保存する。

**Verification:** `pnpm exec vitest run tests/unit/battleBalance.test.ts`

**Dependencies:** None

**Files likely touched:** `scripts/audit-battle-balance.ts`, `tests/unit/battleBalance.test.ts`, `package.json`, `tests/fixtures/battle-balance-before.json`

**Estimated scope:** Medium

### Task 2: 8能力と成長設定の契約

**Acceptance criteria:**

- [ ] `Stats` がHP・MP・文理攻防・素早さ・賢さを持つ。
- [ ] 成長設定が基礎成長・5レベル・10レベル節目を表せる。
- [ ] ダメージ技が有効なカテゴリを持つ。

**Verification:** `pnpm exec vitest run tests/unit/content.test.ts`

**Dependencies:** Task 1

**Files likely touched:** `src/core/content/schemas.ts`, `tests/unit/content.test.ts`, `docs/04_CONTENT_TEMPLATES.md`

**Estimated scope:** Medium

### Task 3: 整数成長曲線

**Acceptance criteria:**

- [ ] Lv1・5・10・15・50の能力が仕様どおり計算される。
- [ ] 成長がレベルから再計算可能で、保存順序に依存しない。
- [ ] 能力は非減少かつ整数になる。

**Verification:** `pnpm exec vitest run tests/unit/battle.test.ts`

**Dependencies:** Task 2

**Files likely touched:** `src/core/battle/factory.ts`, `tests/unit/battle.test.ts`, `content/balance/settings.json`

**Estimated scope:** Medium

## Checkpoint 1

- [ ] Task 1〜3の集中テストが通る。
- [ ] 新旧成長表をLv1〜50で比較できる。

## Phase 2: Migration and content

### Task 4: 既存セーブの移行

**Acceptance criteria:**

- [ ] v9以前の能力を新形式へ一度だけ変換する。
- [ ] 現在HP/MP割合、装備、仲間、学習進捗を維持する。
- [ ] 新形式を再読込しても値が変わらない。

**Verification:** `pnpm exec vitest run tests/unit/state.test.ts`

**Dependencies:** Task 2, Task 3

**Files likely touched:** `src/core/state/schema.ts`, `src/core/state/migrations.ts`, `src/core/state/newGame.ts`, `tests/unit/state.test.ts`

**Estimated scope:** Medium

### Task 5: コンテンツ変換ツール

**Acceptance criteria:**

- [ ] 旧攻防を新しい文理攻防へ決定論的に変換する。
- [ ] HP・MP・素早さ・賢さを承認済み縮尺へ変換する。
- [ ] 技カテゴリと生活科の明示分類を生成・検証する。

**Verification:** 変換ツールのdry-runテストと `pnpm validate:content`

**Dependencies:** Task 2, Task 3

**Files likely touched:** `scripts/migrate-academic-stats.ts`, `tests/unit/academicStatsMigration.test.ts`, `package.json`, `content/skills.json`

**Estimated scope:** Medium（生成されるJSON差分は多数）

### Task 6: 全コンテンツを新契約へ移行

**Acceptance criteria:**

- [ ] 全モンスター・装備・セット・バランス設定が新能力だけを使う。
- [ ] 旧 `atk` / `def` キーが対象コンテンツに残らない。
- [ ] 変換前後の攻防比レポートに説明不能な外れ値がない。

**Verification:** `pnpm gen:schemas && pnpm validate:content && pnpm exec vitest run tests/unit/content.test.ts`

**Dependencies:** Task 5

**Files likely touched:** `content/monsters/*.json`, `content/items/*.json`, `content/equipment-sets.json`, `content/balance/settings.json`, generated schemas

**Estimated scope:** Mechanical bulk update

### Task 7: 能力表示と補正ロジックの追従

**Acceptance criteria:**

- [ ] メニュー・バッグ・バトルHUDが8能力を整数表示する。
- [ ] 装備・セット・隣接・名産品補正が新能力へ正しく加算される。
- [ ] 640×540と960×540で表示が収まる。

**Verification:** 関連VitestとメニューE2E

**Dependencies:** Task 6

**Files likely touched:** `src/core/progression/bag.ts`, `src/core/progression/specialty.ts`, `src/scenes/overworld/menuEntries.ts`, `src/ui/field/BagOverlay.tsx`, `tests/unit/bag.test.ts`

**Estimated scope:** Medium（HUDは必要なら別タスクへ分割）

## Checkpoint 2

- [ ] 旧セーブが読み込める。
- [ ] 全コンテンツ検証が通る。
- [ ] 新規ゲームとメニューに8能力が表示される。

## Phase 3: Academic damage

### Task 8: 文理攻防ペア選択

**Acceptance criteria:**

- [ ] 理系・文系・balancedが仕様どおりA/Dを選ぶ。
- [ ] 補助技は攻防ペアを要求しない。
- [ ] 生活科の分類漏れを検証で検出する。

**Verification:** `pnpm exec vitest run tests/unit/battle.test.ts tests/unit/content.test.ts`

**Dependencies:** Checkpoint 2

**Files likely touched:** `src/core/battle/damage.ts`, `src/core/battle/types.ts`, `tests/unit/battle.test.ts`, `tests/unit/content.test.ts`

**Estimated scope:** Medium

### Task 9: ポケモン型基礎ダメージ

**Acceptance criteria:**

- [ ] レベル・威力・A/D・丸め順が仕様どおり。
- [ ] 賢さを整数攻撃補正へ統合する。
- [ ] 乱数85〜100%、最低1、会心・属性・問題・コンボ補正を決定論的に適用する。

**Verification:** 固定ベクトルと固定シードによる `tests/unit/battle.test.ts`

**Dependencies:** Task 8

**Files likely touched:** `src/core/battle/damage.ts`, `content/balance/settings.json`, `tests/unit/battle.test.ts`

**Estimated scope:** Medium

### Task 10: 青森戦闘の縦切り確認

**Acceptance criteria:**

- [ ] 通常敵・中ボス・県ボスで文理ダメージが動く。
- [ ] BattleEventと画面表示が整数ダメージを示す。
- [ ] 問題スコア0でも戦闘が進行する。

**Verification:** `pnpm test:e2e:battle` の対象テストと実ブラウザ確認

**Dependencies:** Task 9

**Files likely touched:** `src/scenes/Battle.ts`, `src/ui/battle/BattleStatus.tsx`, `tests/e2e/battle.spec.ts`, `tests/unit/battleUi.test.ts`

**Estimated scope:** Medium

## Checkpoint 3

- [ ] 文理ダメージのユニットテストが通る。
- [ ] 青森の代表戦闘を完走できる。

## Phase 4: Speed initiative

### Task 11: 行動Intentと順番決定

**Acceptance criteria:**

- [ ] 優先度→素早さ→シード付き同速抽選で並ぶ。
- [ ] 主人公・オトモ・敵を同じ契約で扱う。
- [ ] 同一シードで順番が再現される。

**Verification:** 追加する順番決定ユニットテスト

**Dependencies:** Checkpoint 3

**Files likely touched:** `src/core/battle/initiative.ts`, `src/core/battle/types.ts`, `tests/unit/battleInitiative.test.ts`, `src/core/battle/index.ts`

**Estimated scope:** Medium

### Task 12: バトルエンジンを素早さ順へ移行

**Acceptance criteria:**

- [ ] 固定順を廃止し、Intent順に行動する。
- [ ] 先行KO、回復、道具、入れ替え、逃走、状態効果が正しく解決される。
- [ ] 無効コマンドではターンが進まない。

**Verification:** `pnpm exec vitest run tests/unit/battle.test.ts`

**Dependencies:** Task 11

**Files likely touched:** `src/core/battle/engine.ts`, `src/core/battle/types.ts`, `tests/unit/battle.test.ts`

**Estimated scope:** Medium

### Task 13: イベント再生とリプレイ回帰

**Acceptance criteria:**

- [ ] Sceneが新しいイベント順をそのまま再生する。
- [ ] リプレイとアリーナが同じ最終状態・イベント列になる。
- [ ] 敵先攻が画面上でも正しい順に見える。

**Verification:** Battle UI Vitest、バトルE2E、リプレイ比較

**Dependencies:** Task 12

**Files likely touched:** `src/scenes/Battle.ts`, `src/scenes/battle/narrate.ts`, `tests/unit/battleUi.test.ts`, `tests/e2e/battle.spec.ts`

**Estimated scope:** Medium

## Checkpoint 4

- [ ] 高速敵・高速主人公・高速オトモの3ケースが通る。
- [ ] 優先行動と同速抽選が再現可能。
- [ ] バトルE2Eが通る。

## Phase 5: Balance and delivery

### Task 14: 全件バランスシミュレーション

**Acceptance criteria:**

- [ ] 全通常敵・ボスを3回答条件で比較する。
- [ ] 仕様の許容範囲を超える対象をID付きで出力する。
- [ ] 変更前後レポートを保存する。

**Verification:** `pnpm audit:battle-balance`

**Dependencies:** Checkpoint 4

**Files likely touched:** `scripts/audit-battle-balance.ts`, `tests/fixtures/battle-balance-after.json`, `docs/release/battle-balance-report.md`

**Estimated scope:** Medium

### Task 15: 許容範囲への最終調整

**Acceptance criteria:**

- [ ] 通常敵とボスが仕様のターン数・勝率範囲へ収まる。
- [ ] Lv5・Lv10で通常より大きな成長を確認できる。
- [ ] 問題不正解でも進行不能にならない。

**Verification:** `pnpm audit:battle-balance && pnpm test`

**Dependencies:** Task 14

**Files likely touched:** `content/balance/settings.json`, `content/skills.json`, 必要最小限の外れ値モンスターJSON、バランスレポート

**Estimated scope:** Medium

### Task 16: 正規ドキュメント同期

**Acceptance criteria:**

- [ ] GDDに8能力・成長・ダメージ・行動順を記載する。
- [ ] アーキテクチャとコンテンツテンプレートが実装と一致する。
- [ ] 研究出典とニホンクエスト独自差分を明示する。

**Verification:** ドキュメント差分レビューと `pnpm lint`

**Dependencies:** Task 15

**Files likely touched:** `docs/00_GAME_DESIGN.md`, `docs/01_ARCHITECTURE.md`, `docs/04_CONTENT_TEMPLATES.md`, `SPEC-academic-battle-stats.md`

**Estimated scope:** Medium

### Task 17: 全体検査とプレビュー

**Acceptance criteria:**

- [ ] 全必須検査とバトルE2Eが通る。
- [ ] 新規ゲーム・旧セーブ・Lv5/Lv10・敵先攻を実ブラウザ確認する。
- [ ] 最新サーバーを5173で開き、ユーザーが確認できる。

**Verification:** `pnpm lint && pnpm check:architecture && pnpm test && pnpm validate:content && pnpm build && pnpm test:e2e:battle`

**Dependencies:** Task 16

**Files likely touched:** テストで判明した必要最小限のファイルのみ

**Estimated scope:** Medium

## Final Checkpoint

- [ ] 仕様のSuccess Criteriaをすべて満たす。
- [ ] 既存セーブを失わない。
- [ ] 相対難度を維持し、初期表示値を縮小できている。
- [ ] 文理攻防、節目成長、ポケモン型ダメージ、素早さ順を実画面で確認できる。
