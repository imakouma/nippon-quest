# Implementation Plan: Field Effect Scope

## Overview

pure coreの小さな所有権scopeを基礎に、Phaser資源の薄い登録adapterを置く。既存
`fieldFlowRuntime` は各runで子scopeを作り、DOM cleanupとmap transition cameraをそのscopeに
登録する。既存の未完了planは変更しない。

## Architecture Decisions

- scopeはcleanup callbackだけを知り、Phaser、Preact、Sceneをimportしない。
- AbortSignalをcleanupより先にabortし、resource停止が完了callbackを発火してもguardが無害化する。
- cleanupはLIFOで実行し、1件の失敗で後続cleanupを止めない。失敗は注入したreporterへ渡す。
- 子scopeは親signalへ接続し、親のScene scope終了で同じdispose経路へ入る。
- Phaser adapterは既存resourceを受け取る関数群に限定し、生成managerや演出APIを複製しない。
- 初回の本番移行はfield flowのDOM cleanupとmap transition cameraだけに限定する。

## Dependency Graph

`effectScope` → `phaserFieldEffectScope` → `fieldFlowRuntime` → `phaserMapTransitionPorts` → `Overworld`

## Task List

### Phase 1: Pure ownership contract

- [x] Task 1: fake-resourceテストをREDにし、pure scopeを実装する

### Checkpoint: Core

- [x] scope単体テストとtypecheckが通る

### Phase 2: Adapters and flow integration

- [x] Task 2: Phaser/DOM資源の薄いadapterをテスト先行で追加する
- [x] Task 3: field flowが子scopeを所有するようテスト先行で接続する

### Checkpoint: Lifecycle

- [x] 正常・cancel・親終了・例外・遅延callback競合が全て通る

### Phase 3: First production migration

- [x] Task 4: DOM cleanupとmap-transition camera effectをscopeへ移行する
- [x] Task 5: Graphify更新、5軸レビュー、全検査、E2E、preview、コミットを行う

### Checkpoint: Complete

- [x] 全成功条件を満たし、統合用コミットを報告できる

## Risks and Mitigations

| Risk                                           | Impact | Mitigation                                                 |
| ---------------------------------------------- | ------ | ---------------------------------------------------------- |
| resource停止時の完了callbackが状態を再更新する | 高     | signalを先にabortし、callbackを`guard`する                 |
| cleanup 1件の例外で残りが漏れる                | 高     | 各cleanupを独立してtry/catchし、reporterへ集約する         |
| camera resetが正常transitionのrestartを妨げる  | 中     | 既存transition順序を維持し、adapterはcleanup登録だけにする |
| Scene shutdownとflow cancelが競合する          | 高     | disposeとfinishをidempotentにし、競合テストを置く          |
| 初回差分がOverworld全体へ広がる                | 中     | 実移行をDOMとmap transitionに限定する                      |

## Open Questions

なし。
