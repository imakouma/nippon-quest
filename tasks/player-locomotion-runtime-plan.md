# Implementation Plan: Player Locomotion Runtime

## Overview

`Overworld` が現在直接持つ向き変更・歩行・衝突フィードバックの時間状態を、Phaser / Preact 非依存の決定論的 runtime へ分離する。既存の衝突優先順位、到着後の encounter / transition / save 処理は変更せず、統合チャットが Scene 接続に使える最小アダプターまでを担当する。

## Architecture Decisions

- runtime と Scene アダプターが使う方向・タイル座標は `src/shared/` の中立契約に置き、core から rendering への逆依存を避ける。既存 rendering の `Dir` export は変更しない。
- runtime は明示コマンドを受ける純粋関数とし、時間は `advance` の `deltaMs` だけで進める。
- 新しい方向への最初の移動要求は 80 ms の `turning` だけを開始する。入力が保持されていれば、呼び出し側が向き変更完了後に同じ要求を再送して歩行または衝突を開始する。
- 160 ms の歩行完了時に `footPlanted` と `stepCompleted` を各1回発行し、次の先行足へ切り替える。100 ms の衝突完了時に `bumped` を1回発行する。
- `movementDecision` の優先順位は変更せず、最小アダプターは `move` / `blocked` / `stand` だけを runtime コマンドへ変換する。ボス・関所などの結果は既存 Scene の責務として返さない。
- `Overworld.ts` の最終配線、描画、カメラ、地形エフェクト、UI、ミニマップはこのブランチでは変更しない。

## Dependency Graph

`shared world contracts` → `core locomotion state machine` → `scene decision adapter` → `centralized Overworld integration (別チャット)`

## Task List

1. RED: 状態遷移、固定時間、接地・完了イベント、交互足、freeze / scripted、大きな delta の失敗テストを追加する。
2. GREEN: 共有方向・座標契約と純粋 locomotion runtime を最小実装する。
3. RED/GREEN: 既存 `movementDecision` を runtime コマンドへ変換する最小アダプターを追加する。
4. REVIEW: focused / architecture / full verification、Graphify 更新、差分レビュー、担当ファイルだけのコミットを行う。

## Risks and Mitigations

| Risk                                                   | Impact | Mitigation                                                                     |
| ------------------------------------------------------ | ------ | ------------------------------------------------------------------------------ |
| Scene 統合前の runtime と既存 tween が二重に時間を持つ | 中     | このブランチでは Scene を接続せず、統合事項を Walkthrough に明記する           |
| 大きな frame delta でイベントが重複する                | 高     | 1回の完了で idle に戻し、イベント列の件数を単体テストで固定する                |
| 方向型の重複または core → rendering 逆依存             | 中     | runtime / adapter は `src/shared/world.ts` を使い、既存 rendering には触れない |
| 既存 collision / encounter / save 契約の回帰           | 高     | `movementDecision` 自体を変更せず、既存テストと全体検査を通す                  |

## Open Questions

なし。Scene の最終接続とブラウザ入力確認は capability map の中央統合工程で行う。
