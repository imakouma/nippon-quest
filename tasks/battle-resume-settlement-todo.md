# Battle resume and settlement tasks

## Task 1: v13 state contract

- [x] RED: v12→v13 migration、新規既定値、round-trip testsを追加する。
- [x] GREEN: battle ledger/snapshot schemaとmigrationを実装する。
- [x] Verify: focused `state` / `savePersistence` tests。
- Files: `src/core/state/{schema,migrations,newGame,battleResume}.ts`, related tests。

## Task 2: Safe snapshot state machine

- [x] RED: command、resolved command、result、settled、invalid snapshot testsを追加する。
- [x] GREEN: capture/restore/phase helperを実装する。
- [x] Verify: `tests/unit/battleResumeSnapshot.test.ts`。
- Files: `src/core/state/battleResume.ts`, `tests/unit/battleResumeSnapshot.test.ts`。

## Checkpoint: Contract

- [x] Focused tests pass。
- [x] `pnpm check:fast` passes。
- [x] Atomic commit created。

## Task 3: Idempotent settlement

- [x] RED: same result retry、stale ID、latest update保持、recruit uniqueness testsを追加する。
- [x] GREEN: `settleBattleOnce`を実装する。
- [x] Verify: `tests/unit/battleSettlement.test.ts`。
- Files: `src/core/progression/{battleResult,battleSettlement}.ts`, related tests。

## Checkpoint: Settlement

- [x] Focused tests pass。
- [x] Changed-source related tests pass。
- [x] Atomic commit created。

## Task 4: Persistence and Battle wiring

- [x] RED: save retry/safe checkpoint orchestration testsを追加する。
- [x] GREEN: await可能なcheckpoint portをcomposition rootとBattleへ接続する。
- [x] Tween中はsnapshotを書かず、resolved commandを再生する。
- [x] Verify: focused snapshot/persistence/Battle tests。
- Files: `src/main.ts`, `src/scenes/Battle.ts`, `src/scenes/battle/*`, related tests。

## Task 5: Encounter and field resume

- [x] RED: active battle resume、settled result resume、duplicate end testsを追加する。
- [x] GREEN: Overworld/encounter lifecycleへresume/acknowledgementを接続する。
- [x] Verify: focused encounter tests。
- Files: `src/scenes/Overworld.ts`, `src/scenes/overworld/encounterLifecycle.ts`, related tests。

## Checkpoint: Runtime

- [x] Focused tests pass。
- [x] `pnpm check:fast` passes。
- [x] Changed-source related tests pass。
- [x] Atomic commit created。

## Task 6: Review and handoff

- [x] Five-axis self-review has no required findings。
- [x] Graphify code-only graph updated without LLM/semantic labeling。
- [x] Scope and staged secret checks pass。
- [x] Walkthrough records behavior, verification, and remaining risks。
- [x] Final commit created; no merge/push。
