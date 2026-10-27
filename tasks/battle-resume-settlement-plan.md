# Implementation Plan: Battle resume and settlement

## Overview

戦闘の永続snapshotと単調sequence ledgerをv13 stateへ追加し、純粋なsnapshot/settlement境界からBattle Scene、保存port、encounter lifecycleへ順に接続する。各sliceはfocused testを先に失敗させ、green後に個別コミットする。

## Architecture decisions

- `GameState.battle` は `nextSequence`、`finalizedThrough`、`active` だけを持つ。activeは1件に限定し、settlement履歴を無制限に増やさない。
- persisted battleのZod契約とcapture/validationは `src/core/state/battleResume.ts` に置き、`schema.ts` はcompositionに留める。
- `resolved-command` は`act`前のBattleStateとCommandを保存する。Tween中は書かず、再開時に同じcommandを再実行する。
- settlementは最新GameStateに対する純粋関数とし、報酬・level/bag同期・ledger更新を同じ返却stateで確定する。
- Sceneはregistryに登録した永続化portをawaitする。IndexedDB/localforageをSceneから直接importしない。
- settled encounterはBattleを再表示せず、Overworldが既存result policyを再開してからsnapshotを解放する。

## Dependency graph

`v13 schema/migration` → `snapshot state machine` → `idempotent settlement` → `persistence port` → `Battle wiring` → `encounter/field resume`

## Task list

### Phase 1: Persistent contract

- [x] Task 1: v13 schema、migration、新規ゲーム既定値をTDDで追加する。
- [x] Task 2: battle snapshotの生成・phase遷移・破棄判定を純粋関数で追加する。

### Checkpoint: Contract

- [x] Focused state/snapshot tests pass.
- [x] `pnpm check:fast` passes.
- [ ] Contract changes are committed.

### Phase 2: Exactly-once settlement

- [ ] Task 3: 同一battleId/sequenceを一度だけ反映するsettlement guardをTDDで追加する。
- [ ] Task 4: 保存失敗再試行、最新learning/playtime保持、加入UID固定を検証する。

### Checkpoint: Settlement

- [ ] Focused settlement/persistence tests pass.
- [ ] Changed-source `pnpm test:related` passes.
- [ ] Settlement changes are committed.

### Phase 3: Runtime integration

- [ ] Task 5: await可能なpersistence portとBattleの安全checkpointを接続する。
- [ ] Task 6: load時のactive battle再開とsettled encounterのfield acknowledgementを接続する。
- [ ] Task 7: Tween/問題/result各中断境界のruntime testsを追加する。

### Checkpoint: Runtime

- [ ] Focused Battle/encounter/save tests pass.
- [ ] `pnpm check:fast` passes.
- [ ] Changed-source `pnpm test:related` passes.
- [ ] Runtime changes are committed.

### Phase 4: Review and handoff

- [ ] Task 8: five-axis self-review、Graphify code-only update、scope/diff確認を行う。
- [ ] Task 9: focused tests、`pnpm check:fast`、変更sourceの`pnpm test:related`を最終実行する。
- [ ] Task 10: walkthroughを記録し、最終コミットを作る。

## Risks and mitigations

| Risk                                      | Impact | Mitigation                                                           |
| ----------------------------------------- | ------ | -------------------------------------------------------------------- |
| 学習履歴保存とBattle snapshotが競合する   | 高     | 常にregistryの最新stateを基底にpatchし、保存queueの完了をawaitする   |
| Tween中断で行動が二重適用される           | 高     | `resolved-command`はact前stateを保持し、Tween中はsnapshotを書かない  |
| settlement後にboss完了処理を失う          | 高     | `settled` activeをfield acknowledgementまで保持する                  |
| 古い/壊れたsnapshotでセーブ全体が読めない | 高     | snapshotだけをnullable salvageし、field checkpointへ戻す             |
| `Battle.ts`がさらに巨大化する             | 中     | schema、state machine、persistence、resume判断を専用moduleへ分離する |
| 並行変更と衝突する                        | 中     | 担当ファイルだけ変更し、共有branchへmerge/pushしない                 |

## Verification strategy

- RED/GREEN: `pnpm exec vitest run tests/unit/battleResumeSnapshot.test.ts tests/unit/battleSettlement.test.ts tests/unit/state.test.ts tests/unit/savePersistence.test.ts tests/unit/encounterLifecycle.test.ts`
- Fast: `pnpm check:fast`
- Related: `pnpm test:related <all changed source files>`
- 統合担当のみ実行するため、`pnpm test`、`pnpm build`、`pnpm check:full`は実行しない。

## Open questions

なし。承認済みspecの安全境界とv13契約を実装する。
