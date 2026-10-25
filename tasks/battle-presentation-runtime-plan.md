# Implementation Plan: Battle presentation runtime

## Overview

既存の narration と animation を表示コマンドへ変換する Phaser 非依存 runtime を先に作り、Battle Scene の queue 管理を置換する。その後、BattleEvent ごとの巨大な視覚演出を port 実装へ移し、回帰検査と実ブラウザ確認を行う。

## Architecture Decisions

- core `BattleEvent` は変更せず、scene 層の表示専用 discriminated union へ写像する。
- バッチは単一 queue、イベント内の明示的 parallel group だけ並列にする。
- visual port は sprite/tween/camera の最終状態反映を必ず完了し、runtime の skip は clock wait だけを短縮する。
- runtime は例外を隠さず Scene の既存 recovery へ返す。cleanup は runtime が一度だけ起動する。
- 参照リポジトリは使用せず、現行 NIHON QUEST の契約と実装だけから clean-room で構成する。

## Dependency Graph

`BattleEvent + narrate` → `display command compiler` → `presentation runtime` → `typed ports` → `Battle Scene adapter`

## Task List

### Phase 1: Runtime contract (risk first)

- Task 1: runtime の失敗テストを追加する。
- Task 2: command compiler、queue、cancel/cleanup、skip を最小実装する。

### Checkpoint: Runtime

- focused unit test が全件通る。
- runtime が Phaser を import しない。

### Phase 2: Scene integration

- Task 3: Battle Scene の playing/chain/play を runtime に置換する。
- Task 4: BattleEvent の視覚演出を `eventAnimator.ts` へ移し、Battle.ts を縮小する。

### Checkpoint: Integration

- battle unit test と typecheck が通る。
- `Battle.ts` が 1,730 行未満になる。

### Phase 3: Review and ship

- Task 5: battle E2E と preview で実動作を確認する。
- Task 6: Graphify 更新、五軸レビュー、必須検査、walkthrough、コミットを行う。

## Risks and Mitigations

| Risk                                    | Impact | Mitigation                                                                  |
| --------------------------------------- | ------ | --------------------------------------------------------------------------- |
| cancel 後も Phaser callback が残る      | High   | AbortSignal race と lifecycle cleanup で tween/camera/HUD を停止・復元      |
| queue の rejection が後続を詰まらせる   | High   | fatal error で全 task を cancel、各 task の finally は一度だけ実行          |
| skip が状態反映まで飛ばす               | High   | skippable は clock wait のみ。visual は常に実行                             |
| E2E が private animate を差し替えている | Medium | Battle.ts に薄い `animate` 委譲点を残す                                     |
| 巨大移動で見た目が変わる                | Medium | 先に runtime を統合し、演出コードは機械的移動に限定して battle E2E を再実行 |

## Open Questions

なし。
