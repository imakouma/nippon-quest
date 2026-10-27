# Battle Command Evaluation Tasks

- [x] Task 1: pure evaluator の RED テストを追加し、全 command kind の評価契約を実装する。
  - Acceptance: allowed/reason/resolvedTargets/costs/consumesTurn を決定論的に返す。
  - Verify: `pnpm exec vitest run tests/unit/battleCommandEvaluation.test.ts`
- [x] Checkpoint: evaluator が core-only の pure module であることを確認する。
- [x] Task 2: engine の preflight と実行を evaluator に接続する。
  - Acceptance: 無効入力を非破壊に拒否し、有効入力の既存挙動を維持する。
  - Verify: focused battle tests、`pnpm test:related`、`pnpm check:fast`
- [x] Task 3: HUD と Battle Scene を同じ evaluation context へ接続する。
  - Acceptance: leaf option と親 command の disabled/reason が engine と一致する。
  - Verify: focused battle/UI tests、`pnpm test:related`、`pnpm check:fast`
- [x] Checkpoint: 既存 BattleEvent、replay、ターン進行の回帰がないことを確認する。
- [x] Task 4: Graphify 更新、五軸自己レビュー、walkthrough、最終コミットを完了する。
  - Acceptance: 必須指摘なし、担当外差分なし、作業ツリーがクリーン。
  - Verify: focused tests、`pnpm check:fast`、`pnpm test:related <changed files...>`、`git diff --check`
