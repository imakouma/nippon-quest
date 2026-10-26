# Player Locomotion Runtime Tasks

## Task 1: Runtime contract tests

- [x] 新方向は 80 ms の turning を完了してから移動できる。
- [x] 歩行は 160 ms、衝突は 100 ms で完了し、進捗は 0..1 に収まる。
- [x] 1歩につき接地・完了イベントが各1回で、先行足が交互になる。
- [x] frozen / scripted は入力を拒否し、resume は idle に戻す。
- [x] 大きな delta でも完了イベントが重複しない。
- [x] Verify: `pnpm exec vitest run tests/unit/playerLocomotion.test.ts`

## Task 2: Pure locomotion runtime

- [x] Phaser / Preact / rendering を import しない純粋状態機械を実装する。
- [x] runtime / adapter 用の `Dir` と `TilePoint` 契約を共有層へ追加し、既存 rendering の `Dir` export は変更しない。
- [x] Verify: Task 1 のテストと `pnpm check:architecture`

## Task 3: Movement-decision adapter

- [x] `move` を step、`blocked` / `stand` を bump コマンドへ変換する。
- [x] ボス・関所の既存結果は変換せず、Scene の優先処理に残す。
- [x] Verify: focused tests と既存 `movementDecision` tests

## Checkpoint: Complete

- [x] `pnpm lint`
- [x] `pnpm check:architecture`
- [x] `pnpm test`
- [x] `pnpm validate:content`
- [x] `pnpm build`
- [x] Graphify を更新し、影響範囲を確認する。
- [x] 変更を五軸レビューし、担当ファイルだけをコミットする。
