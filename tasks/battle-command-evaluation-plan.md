# Implementation Plan: Battle Command Evaluation

## Overview

戦闘コマンドの可否・対象・消費・ターン消費を純粋 evaluator に集約し、engine と HUD を同じ契約へ接続する。既存の有効コマンドのイベント列と決定論性を維持しながら、無効入力は型付き理由を返す非破壊な拒否へ変える。

## Dependency Graph

```text
command evaluation types + pure evaluator
  ├─ engine preflight / StepOutput
  └─ HUD leaf options
       └─ Battle Scene evaluation context
```

## Architecture Decisions

- `src/core/battle/commandEvaluation.ts` が唯一の可否判定源になる。Scene 固有条件は callback ではなく値だけの context で渡す。
- 評価入力は回答結果を除く command reference とし、実行用 `Command` から同じ reference を得る。
- `StepOutput` に evaluation を追加し、拒否時は clone 済み state、明示理由、非消費を返す。
- engine は evaluator が返した target/cost を実行に使い、同じ条件を再判定しない。
- HUD の親コマンドは leaf evaluation の集約で有効化する。表示文言は既存 i18n を維持し、core reason をユーザー向け文字列にしない。
- 新規依存、content/schema、保存形式、問題契約は変更しない。

## Task List

### Phase 1: Pure contract

- Task 1: evaluator の RED テストと最小実装
  - Acceptance: 全 command kind の allowed/reason/targets/costs/consumesTurn を返す。
  - Verification: `pnpm exec vitest run tests/unit/battleCommandEvaluation.test.ts`
  - Files: `src/core/battle/commandEvaluation.ts`, `tests/unit/battleCommandEvaluation.test.ts`

### Phase 2: Engine integration

- Task 2: `act` を evaluator の preflight と解決結果へ接続
  - Acceptance: invalid skill/item/swap/flee/recruit は throw せず非破壊に拒否し、有効コマンドの既存結果を維持する。
  - Verification: focused battle tests、`pnpm test:related`、`pnpm check:fast`
  - Files: `src/core/battle/engine.ts`, `src/core/battle/commandEvaluation.ts`, `tests/unit/battle.test.ts`

### Phase 3: HUD and Scene integration

- Task 3: HUD option と Scene 実行へ同じ context/evaluation を渡す
  - Acceptance: skill/item/swap/command option の disabled が evaluator と一致し、問題準備中・仲間化解放条件も typed context に入る。
  - Verification: focused battle/UI tests、`pnpm test:related`、`pnpm check:fast`
  - Files: `src/scenes/battle/hudViews.ts`, `src/scenes/battle/sceneModel.ts`, `src/scenes/Battle.ts`, `tests/unit/battleUi.test.ts`

### Phase 4: Review and handoff

- Task 4: 五軸自己レビュー、Graphify 更新、walkthrough、最終コミット
  - Acceptance: correctness/readability/architecture/security/performance に未解決の必須指摘がなく、担当範囲だけがコミットされる。
  - Verification: focused test、`pnpm check:fast`、変更ファイル指定の `pnpm test:related`、`git diff --check`
  - Files: `tasks/battle-command-evaluation-walkthrough.md`

## Checkpoints

### After Task 1

- evaluator のテストが RED を確認後 GREEN になる。
- pure module が Phaser、Preact、Scene、GameState、乱数へ依存しない。

### After Tasks 2–3

- engine と HUD が同じ reason を返す整合テストが通る。
- 有効コマンドの既存 BattleEvent と replay が回帰しない。

### Complete

- focused tests、`pnpm check:fast`、変更ファイル指定の `pnpm test:related` が成功する。
- 全件 `pnpm test` / `pnpm build` / `pnpm check:full` は統合担当に残す。
- 実装と walkthrough を原子的にコミットし、commit ID を報告する。

## Risks and Mitigations

| Risk                                             | Impact | Mitigation                                                           |
| ------------------------------------------------ | ------ | -------------------------------------------------------------------- |
| UI-only 条件と core 条件が再び分岐する           | 高     | 問題在庫・物語解放を typed value context にし、同じ evaluator へ渡す |
| evaluator と executor が対象や消費を二重計算する | 高     | resolvedTargets/costs を実行側が直接消費する                         |
| StepOutput 追加で呼び出し元が壊れる              | 低     | additive field にし、既存 destructuring を維持する                   |
| 無効入力の既存イベント表示が消える               | 中     | gaugeShort とボス逃走禁止イベントの互換を focused test で固定する    |
| `engine.ts` がさらに肥大化する                   | 中     | 判定契約と helper を専用モジュールに置く                             |

## Open Questions

なし。仕様承認済み。型名と reason code の最終粒度は既存規約と RED テストに合わせる。
