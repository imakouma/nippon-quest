# Implementation Plan: battle-status-history

## Overview

既存 `BattleState.log` と現在の戦闘状態を表示専用モデルへ変換し、敵・味方の状態チップ、通常プレイヤー向け直近履歴、開発モード限定のイベントタイムラインを追加する。戦闘エンジンと `BattleEvent` 契約は変更せず、Sceneは演出済みログ位置と表示モデルの同期だけを担当する。

## Evidence

- Graphifyのコード専用グラフでは、`core/battle/engine.done` が `BattleState.log` を更新し、`scenes/Battle` が `hudViews` を介して `HudStore` へ表示状態を同期し、`BattleHud` が全体を購読する流れを確認した。
- `BattleState` は `Combatant.buffs.atk/def` と `EnemyUnit.skipTurns` を既に保持している。
- `narrate` と `normalizeEvents` が既存のユーザー向けRubyTextを生成しており、別の文言変換は不要。
- `HudStore` は現在すべての更新で全subscriberを呼ぶため、大きな履歴配列はselector購読とmemo境界で隔離する必要がある。

## Architecture decisions

- 表示変換は新しい `src/scenes/battle/statusHistoryViews.ts` に分離し、`hudViews.ts` と `Battle.ts` を肥大化させない。
- `BattleState.log` は変更しない。Sceneが `presentedEventCount` を保持し、演出完了後だけ表示モデルへ反映する。
- HP履歴は現在HPからログを逆走して復元し、`damage` と `heal` の各時点の `before → after` を決定論的に得る。
- `HudStore` にselector購読を追加し、履歴モデルの参照が変わったときだけ履歴コンポーネントを更新する。
- 履歴UIはmemo化した `BattleHistory` に隔離する。通常履歴はコマンド選択中だけ表示し、開発タイムラインは既存 `devMode` でのみ開ける。
- 状態チップは敵・味方の既存表示モデルへ小さい `effects` 配列を追加し、現在の戦闘状態から同期する。
- 文言は `content/i18n/ja.json` に置き、新しい依存は追加しない。

## Dependency graph

```text
BattleState.log + buffs + skipTurns
  └─ statusHistoryViews（純粋変換）
       ├─ EnemyView / AllyView.effects
       └─ HudState.history
            ├─ BattleStatus（状態チップ）
            └─ BattleHistory（通常履歴 / dev timeline）
                 └─ BattleHud配置 + Battle Scene同期
```

## Task list

### Phase 1: Pure view-model contract

- [x] Task 1: 状態効果・直近履歴・イベントタイムラインの純粋変換をTDDで実装する。

### Checkpoint: Model

- [x] 状態効果、履歴4件、HP変化、ターン/イベント番号、120件制限のfocused unit testsが通る。
- [x] `BattleState.log` が変更されない。

### Phase 2: Localized HUD rendering

- [x] Task 2: selector購読と通常履歴・devタイムラインをTDDで描画する。
- [x] Task 3: 敵・味方の状態チップと局所化文言・レスポンシブCSSを追加する。

### Checkpoint: UI contract

- [x] 無関係なstore更新で履歴selector listenerが発火しない。
- [x] 履歴とタイムラインにlive regionがなく、開閉操作がキーボード対応する。

### Phase 3: Scene integration and browser verification

- [x] Task 4: Sceneの演出済みログ同期、E2E、横画面レイアウトを実装・検証する。

### Checkpoint: Complete

- [x] focused unit/E2E testsが通る。
- [x] `pnpm check:fast` と変更ソースの `pnpm test:related` が通る。
- [x] 4175以降の一時プレビューで960×540・640×360、console、accessibilityを確認する。
- [x] Graphifyコードグラフを変更後に更新する。
- [x] 五軸自己レビューを行い、担当変更をコミットする。

## Verification checkpoints

1. RED: 新しいモデルテストが未実装関数で失敗する。
2. GREEN: 純粋変換だけでモデルテストが通る。
3. RED: selectorとDOM/E2E契約が新UI不在で失敗する。
4. GREEN: 状態チップ・履歴・タイムラインのfocused testsが通る。
5. REFACTOR: 重複変換、不要なstore更新、Scene内の分岐を除く。
6. Finish gate: `pnpm check:fast`、`pnpm test:related`、Playwright、実ブラウザ、自己レビュー。

## Risks and mitigations

| Risk                               | Impact | Mitigation                                                                 |
| ---------------------------------- | ------ | -------------------------------------------------------------------------- |
| 未演出イベントを履歴で先に見せる   | 高     | `presentedEventCount` を演出完了後に進め、表示変換へ渡す                   |
| HPの初期値が満タンでない           | 高     | 最終状態からイベントを逆走し、現在HPを起点に各変化を復元する               |
| 履歴配列でHUD全体の更新が重くなる  | 中     | selector購読、memo境界、ログ進行時だけ参照更新、表示件数上限を使う         |
| 小さい横画面でHP・チップが衝突する | 中     | チップ折返しと固定レール内の高さをE2Eで計測する                            |
| 読み上げが過去ログを繰り返す       | 高     | 履歴・timelineは `aria-live="off"`、既存一時メッセージだけをlive通知にする |
| `Battle.ts` がさらに肥大化する     | 中     | Scene変更はカウンタと1つの同期helper呼び出しに限定する                     |

## Scope control

- 変更しない: `src/core/battle/**`、ダメージ式、状態効果ルール、セーブ/schema、問題契約。
- 追加しない: ダメージ理由/内訳パネル、外部依存、永続ログ、通常UIの生イベント表示。
- 触らない: `tasks/plan.md`、`tasks/todo.md`、他モジュールのtask文書。

## Open questions

なし。仕様のAssumptions 5項目は承認済み。
