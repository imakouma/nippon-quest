# Implementation Plan: Map Object Movement Runtime

## Overview

完成済み event-command-runtime の core 契約を最小統合し、その上に有限の map object movement runtime と
`movement` event command を追加する。production SceneへPhaser依存を逆流させず、fake portで全完了契約を証明する。

## Dependency Graph

`event command contracts` → `movement command/port contracts` → `movement runtime` → `event runtime dispatch`
→ `fake-port tests` → `full repository gates`

## Architecture Decisions

- runtimeは `src/core/events/` に置き、表示層をimportしない。
- command列自体を唯一の反復単位にし、command内の回数・分岐・loopを持たせない。
- reservation objectが `commit` / `release` を所有し、runtimeは予約のライフサイクルだけを調停する。
- production event runtime portが基点に無いため、今回はcore dispatchまでを統合境界にする。
- timeoutはruntime Promiseのsettlementを保証し、port実装のabort対応だけに依存しない。

## Task List

### Phase 1: Contract and RED

- [x] Task 1: 完成済み event-command-runtime のcoreコミットを最小統合する。
- [x] Task 2: movement runtimeのpublic contractと失敗するfake-portテストを追加する。

### Checkpoint: Contract

- [x] runtime未実装によりfocused testが期待どおり失敗する。
- [x] Phaser/Scene importがcoreへ入っていない。

### Phase 2: Runtime Slices

- [x] Task 3: happy path、状態遷移、逐次await、正常cleanupを実装する。
- [x] Task 4: reservation、abort、timeout、step/time limit、例外cleanupを実装する。
- [x] Task 5: event runtimeへ `movement` command dispatchを追加する。

### Checkpoint: Behavior

- [x] focused unit testsが成功する。
- [x] `npcWander.ts` が未変更である。

### Phase 3: Review and Delivery

- [x] Task 6: five-axis reviewとmutation checkを行い、必須指摘を解消する。
- [x] Task 7: Graphify code-only graphを更新し、全必須検査を実行する。
- [x] Task 8: 一時previewを4175で起動し、アプリ初期表示とconsoleを確認して停止する。
- [x] Task 9: walkthroughを記録し、コミットする。

## Risks and Mitigations

| Risk                                     | Impact | Mitigation                                                                             |
| ---------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| event runtimeのparallel branchと競合     | 中     | core prerequisiteとmovement差分を別commitにし、cherry-pick順を明記する                 |
| portがAbortSignalを無視してPromiseが残る | 高     | runtime自身のabort/timeout raceで外側Promiseをsettleする                               |
| walk失敗で予約が残る                     | 高     | active reservationをfinally相当の単一cleanup経路でreleaseする                          |
| 汎用VMへ拡大する                         | 中     | 6種類の有限commandとevent wrapperだけに固定する                                        |
| Scene側の衝突実装が未統合                | 中     | reservation contractとfake-port試験を完成させ、production adapterは後続sliceに限定する |

## Open Questions

なし。
