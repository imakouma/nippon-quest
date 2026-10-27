# Battle Action Causality Tasks

## Task 1: Contract-first RED

**Description:** action identity、派生 event の束ね、replay 決定論、非隣接 target を期待する test を先に追加する。

**Acceptance criteria:**

- [x] 現行実装で causality test が意図した理由で失敗する。
- [x] test は event array の位置ではなく `actionId` と明示 target を検査する。

**Verification:**

- [x] `pnpm exec vitest run tests/unit/battleActionCausality.test.ts`

**Dependencies:** None

**Files likely touched:**

- `tests/unit/battleActionCausality.test.ts`

**Estimated scope:** Small

## Task 2: Core action context

**Description:** 型付き ID と context を定義し、engine の全成立行動と派生 event、musubi helper に伝播する。

**Acceptance criteria:**

- [x] action-scoped event は型上 `actionId` が必須になる。
- [x] 同一 turn の各行動は別 ID、同一行動の派生 event は同じ ID を持つ。
- [x] 無効 command は turn / action ID を消費しない。

**Verification:**

- [x] `pnpm exec vitest run tests/unit/battleActionCausality.test.ts tests/unit/battle.test.ts`

**Dependencies:** Task 1

**Files likely touched:**

- `src/core/battle/types.ts`
- `src/core/battle/dependencies.ts`
- `src/core/battle/engine.ts`
- `src/core/battle/actionResolver.ts`
- `src/core/battle/musubiDama.ts`
- `tests/unit/battleActionCausality.test.ts`

**Estimated scope:** Medium

## Task 3: Presentation without adjacency inference

**Description:** visual command と animator の `next` event 引数を削除し、`act.targetIds` だけで演出対象を決める。

**Acceptance criteria:**

- [x] `BattleVisualCommand` に `next` がない。
- [x] `BattleEventAnimator.play` と `BattleScene.animate` は event 1 個だけを受け取る。
- [x] act と effect の間に別 event があっても target が変わらない。

**Verification:**

- [x] `pnpm exec vitest run tests/unit/battlePresentationRuntime.test.ts tests/unit/battleUi.test.ts`

**Dependencies:** Task 2

**Files likely touched:**

- `src/scenes/battle/presentationRuntime.ts`
- `src/scenes/battle/eventAnimator.ts`
- `src/scenes/Battle.ts`
- `tests/unit/battlePresentationRuntime.test.ts`

**Estimated scope:** Medium

## Task 4: Compatibility fixtures and regression

**Description:** 手作り event fixture と既存 KO / narration expectations を新しい必須 metadata へ更新する。

**Acceptance criteria:**

- [x] 既存 event 種別、順序、payload、narration、HUD、KO の意味が変わらない。
- [x] save/content/schema へ差分がない。

**Verification:**

- [x] focused tests がすべて通る。
- [x] 変更 source を指定した `pnpm test:related` が通る。

**Dependencies:** Task 3

**Files likely touched:**

- `tests/unit/battle.test.ts`
- `tests/unit/battleUi.test.ts`
- `tests/unit/battlePresentationRuntime.test.ts`
- `tests/e2e/enemy-knockout.spec.ts`
- `tests/e2e/music.spec.ts`

**Estimated scope:** Medium

## Checkpoint: Complete

- [x] `pnpm check:fast` が通る。
- [x] focused tests と related tests が通る。
- [x] 5 軸自己レビューで Critical / Required finding がない。
- [x] Graphify を `--code-only --no-cluster` で更新する。
- [x] 担当変更を atomic commit にする。
- [x] ブランチ、全 commit ID、変更概要、検査結果、統合注意点を報告する。
