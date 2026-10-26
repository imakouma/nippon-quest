# Implementation Plan: Field resume snapshot v12

## Overview

現行の save schema と統合済み field runtime 群を維持し、純粋 snapshot 契約 → Phaser adapter → 全復帰経路の順に薄く統合する。

## Architecture Decisions

- schema は additive に `progress.fieldSnapshot` を追加し、v11→v12 で既定値を補う。欠落 `schemaVersion` は v0 として v1 へ明示的に上げる。
- object snapshot は `map:name` で識別するが、保存・復元とも `persistState: true` かつマップ内で一意な名前だけを対象にする。
- object を定義位置または安全な保存位置へ先に配置し、その結果を含む collision 状態で正規 `resolveMapEntry` を呼ぶ。
- 復帰対象 map の catalog は読み込み済み content と enclave 定義から作り、削除 map は同じ area の field、最後に MVP start map へ戻す。
- Scene には wiring と checkpoint 呼び出しだけを追加し、capture / restore / fallback は専用 module に置く。

## Dependency Graph

`schema/migration` → `snapshot pure logic` → `field resume runtime adapter` → `Overworld load/import/transition/battle wiring` → `E2E`

## Task List

1. v12 schema と migration の失敗する unit 契約を追加する。
2. snapshot capture / restore / map fallback の失敗する unit 契約を追加する。
3. 最小実装で unit を green にする。
4. 現行 movement/NPC contract と Overworld の復帰経路へ runtime を接続する。
5. 保存・load/import/battle/transition E2E を追加して green にする。
6. 5軸コードレビュー、Graphify 更新、全検査、preview console、コミットを完了する。

## Risks and Mitigations

| Risk                                     | Impact | Mitigation                                                      |
| ---------------------------------------- | ------ | --------------------------------------------------------------- |
| 保存プレイヤー位置と復元objectが衝突する | 高     | object復元後に正規entry helperを呼ぶ                            |
| 古いmap名でloadが失敗する                | 高     | content由来catalogで同area field / MVP startへfallback          |
| Sceneがさらに巨大化する                  | 中     | 専用2 moduleへロジックを置き、Sceneは短いadapter呼び出しのみ    |
| NPC移動runtimeと向きがずれる             | 中     | `WanderingNpc` / scripted movement の既存契約に facing を載せる |
| 一時flowを誤保存する                     | 高     | schemaには安定field情報だけを定義し、flow状態は一切含めない     |

## Open Questions

なし。
