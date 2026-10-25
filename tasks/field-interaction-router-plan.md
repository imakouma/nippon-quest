# Implementation Plan: Field Interaction Router

## Overview

pure resolverを契約先行・TDDで追加し、runtime adapterを通して既存flow/event/transition境界へ接続した後、`Overworld` の入力・到着・menu経路を薄いcandidate収集へ置換する。

## Architecture Decisions

- `intent + spatial activation + typed candidate` をresolverの唯一の入力とする。
- frame dedupeはresolver入力に直前処理frameを渡し、Sceneが非none decision時だけ更新する。
- event-command dependencyは `189e66ea` / `64ee1eda` の公開core filesだけを取り込む。schema/content/encounter変更は本タスクへ混ぜない。
- executorはmap/eventのみruntimeへ直接委譲し、既存Scene固有処理はtyped dispatch portへ戻す。

## Dependency Graph

event command contracts/runtime → resolver contracts/tests → runtime adapter/tests → Overworld candidate adapter → E2E/full gates

## Task List

1. Routerの失敗テストとpriority表契約を作る。
2. 最小resolverを実装しfocused testをgreenにする。
3. Runtime adapterの失敗テストを作り、3公開境界への委譲を実装する。
4. `Overworld` のinteract/arrive/menuをrouterへ接続する。
5. mutation review、Graphify更新、全検査、previewを行う。

## Risks and Mitigations

| Risk                                | Impact | Mitigation                                        |
| ----------------------------------- | ------ | ------------------------------------------------- |
| 既存の近傍検索と向き契約が曖昧      | 中     | 正面＋counterをspec化しunit test、field E2Eで確認 |
| async入力で二重実行                 | 高     | frame dedupeをbusyとは独立に先頭guardへ置く       |
| event branch全体のcherry-pickが競合 | 高     | core公開契約/runtimeだけを同コミットから最小統合  |
| transition演出が変わる              | 中     | 既存requestとPhaser portsをそのままexecutorへ渡す |

## Open Questions

なし。
