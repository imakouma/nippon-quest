# Implementation Plan: Battle Action Causality

## Overview

承認済み `tasks/battle-action-causality-spec.md` に従い、戦闘の成立行動ごとに決定論的な
`BattleActionId` を割り当て、派生 `BattleEvent` を同じ ID で束ねる。core の型と生成経路を先に
固定し、その後 presentation / animator の `next` event 推測を明示的 target へ置換する。

## Architecture Decisions

- `BattleActionId` は `turn:<turn>:action:<ordinal>` の template-literal 型とし、時刻・UUID・RNG・event
  index を使わない。
- `ActionContext` は 1 回の `act()` 解決内だけで生成し、成立した initiative slot ごとに ordinal を
  進める。無効 command は事前検証され、ID を消費しない。
- action 解決は `actionResolver.ts`、共有依存型は `dependencies.ts` へ分離し、engine の行数上限と循環依存を避ける。
- action-scoped event variant は `actionId` を必須にする。`turnStart` と成立しない command の通知は
  action scope 外のままにする。
- `act` event は `targetIds` を明示し、将来の派生 action 向けに optional `causedByActionId` を持つ。
- event 順、既存 payload、乱数呼び出し順は変更しない。因果関係だけを追加する。
- `BattleVisualCommand.next`、`BattleScene.animate(..., next)`、`BattleEventAnimator.play(..., next)` を削除し、
  animator は `act.targetIds` を使う。

## Dependency Graph

`BattleEvent contract` → `engine action context` → `musubi/item propagation` →
`presentation command` → `event animator / Battle scene` → `regression fixtures`

## Task List

### Phase 1: Contract and RED

- [x] Task 1: causality contract test を追加し、現状で RED を確認する。

### Phase 2: Core Event Bundles

- [x] Task 2: `BattleActionId` と action-scoped union を定義し、engine / musubi へ action context を通す。
- [x] Task 3: replay、multi-target、KO/outcome、無効 command の causality test を GREEN にする。

### Checkpoint: Core

- [x] focused core tests が通り、既存 event 順と RNG state が変わっていない。

### Phase 3: Presentation Consumer

- [x] Task 4: presentation / animator / Battle scene から `next` event 契約を削除する。
- [x] Task 5: 手作り BattleEvent fixture と該当 E2E の期待値を新契約へ更新する。

### Phase 4: Review and Handoff

- [x] Task 6: focused tests、`pnpm check:fast`、変更 source の `pnpm test:related` を実行する。
- [x] Task 7: correctness / readability / architecture / security / performance の自己レビューを行う。
- [x] Task 8: Graphify code-only graph を更新し、atomic commit と統合注意点を報告する。

## Risks and Mitigations

| Risk                                               | Impact | Mitigation                                                                                 |
| -------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| event fixture が多数型エラーになる                 | Medium | action-scoped fixture 用 test helper を最小限導入し、既存 payload は変えない               |
| ID 生成で RNG/replay が変わる                      | High   | 純粋な turn + ordinal 文字列のみを使い、RNG を呼ばない test を追加する                     |
| KO / victory が直前 action から外れる              | High   | `finishIfOver` と `allyDown` まで同じ context を引き回す                                   |
| item/recruit の helper 境界で ID が落ちる          | Medium | `useMusubiDama` 引数に action context を必須化する                                         |
| presentation の見た目が変わる                      | High   | `targetIds` を engine で明示し、既存 event 順と animator branch は維持する                 |
| 並行 module と `types.ts` / `engine.ts` が競合する | Medium | commit を小さく保ち、統合時は event payload と action context の両方を内容ベースで解消する |

## Verification Checkpoints

- RED: `pnpm exec vitest run tests/unit/battleActionCausality.test.ts`
- Core GREEN: `pnpm exec vitest run tests/unit/battleActionCausality.test.ts tests/unit/battle.test.ts`
- Presentation GREEN:
  `pnpm exec vitest run tests/unit/battlePresentationRuntime.test.ts tests/unit/battleUi.test.ts`
- Final focused:
  `pnpm exec vitest run tests/unit/battleActionCausality.test.ts tests/unit/battle.test.ts tests/unit/battlePresentationRuntime.test.ts tests/unit/battleUi.test.ts`
- Fast gate: `pnpm check:fast`
- Related:
  `pnpm test:related <all changed source files>`
- 統合担当だけが `pnpm check:full` を実行する。

## Open Questions

なし。仕様承認済みのため、この plan / todo 作成後は追加確認なしで実装へ進む。
