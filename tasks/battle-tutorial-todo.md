# 初回バトルチュートリアル Tasks

## Task 1: 一度だけ表示する進行契約

**Description:** pending・完了済み状態を扱う純粋関数をTDDで追加する。

**Acceptance criteria:**

- [ ] 新規プロローグ完了時だけpendingになる。
- [ ] 既存セーブや完了済みセーブでは表示対象にならない。
- [ ] 完了処理は冪等で、元のGameStateを破壊しない。

**Verification:** `pnpm vitest run tests/unit/battleTutorial.test.ts`

**Dependencies:** None

**Files likely touched:**

- `src/core/progression/battleTutorial.ts`
- `tests/unit/battleTutorial.test.ts`

**Estimated scope:** Small

## Task 2: ミチルのチュートリアル会話

**Description:** 仕様で承認された4項目を既存会話モデルとRubyText文言で提供する。

**Acceptance criteria:**

- [ ] 敵との遭遇、わざと問題、教科ゲージ、逃走を順に説明する。
- [ ] 「どうぐ」「いれかえ」を初回説明へ含めない。
- [ ] 文言をコードへ直書きしない。

**Verification:** 文言キーのユニットテストと `pnpm validate:content`

**Dependencies:** Task 1

**Files likely touched:**

- `src/scenes/overworld/storyScenes.ts`
- `content/i18n/ja.json`
- `tests/unit/battleTutorial.test.ts`

**Estimated scope:** Medium

## Task 3: プロローグ終了導線へ接続

**Description:** 物語画面終了後に通常会話で説明し、完了状態を保存する。

**Acceptance criteria:**

- [ ] ストーリーを通常終了・スキップした両方で表示される。
- [ ] 中断時は次回の青森フィールドで再表示される。
- [ ] 完了後は同じセーブで再表示されない。

**Verification:** `pnpm vitest run tests/unit/battleTutorial.test.ts tests/unit/storyFlow.test.ts`

**Dependencies:** Tasks 1–2

**Files likely touched:**

- `src/scenes/Overworld.ts`
- `src/scenes/overworld/storyFlow.ts` または専用調停モジュール
- `tests/unit/storyFlow.test.ts`

**Estimated scope:** Medium

## Checkpoint: Integrated behavior

- [ ] 純粋ロジックと物語導線のテストが通る。
- [ ] 既存のプロローグ・名前決定動作が変わらない。

## Task 4: 新規ゲームE2E

**Description:** 実ブラウザで初回表示と再表示防止を固定する。

**Acceptance criteria:**

- [ ] プロローグをスキップしても4項目が表示される。
- [ ] 完了後にフィールド操作へ戻る。
- [ ] 再読込後は表示されない。
- [ ] 960×540とスマホ相当幅で見切れない。

**Verification:** `pnpm exec playwright test tests/e2e/battle-tutorial.spec.ts`

**Dependencies:** Task 3

**Files likely touched:**

- `tests/e2e/battle-tutorial.spec.ts`
- 必要な場合のみ `tests/e2e/newGame.ts`

**Estimated scope:** Medium

## Task 5: 全体検査とレビュー

**Description:** 必須検査、実画面、コード品質を確認する。

**Acceptance criteria:**

- [ ] 全必須検査が成功する、または今回と無関係な既知失敗を明示する。
- [ ] 正しさ・可読性・構造・安全性・性能の必須指摘が残らない。
- [ ] 最新版を4174番で表示する。

**Verification:** リポジトリ既定の全検査

**Dependencies:** Task 4

**Files likely touched:** None

**Estimated scope:** Small
