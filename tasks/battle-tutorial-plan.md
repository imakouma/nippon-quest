# Implementation Plan: 初回バトルチュートリアル

## Overview

新規ゲームのプロローグ終了直後に、ミチルがバトルの基本を4段階で説明する短い会話を追加する。物語をスキップしても説明は表示し、完了後は同じセーブで再表示しない。

## Dependency graph

`battleTutorial` 純粋進行モデル
→ チュートリアル会話データとi18n文言
→ `Overworld.showPrologue()` の表示順
→ 新規ゲームE2Eと狭幅表示検証

## Architecture decisions

- 表示済み・保留中の判定と状態更新は `src/core/progression/` に置き、PhaserやPreactへ依存させない。
- 既存セーブへ突然表示しないため、今回プロローグを完了したセーブだけに pending を付ける。
- pending は説明開始前に保存し、途中終了しても次回の青森フィールドで再開できるようにする。
- 説明完了時に `progress.eventsDone` へ完了イベントを記録し、pending を解除する。
- 表示には既存の通常会話UIを使い、専用モーダルや依存パッケージは追加しない。
- `Overworld.ts` は既に大きいため、判定・文言生成を外部モジュールへ置き、Sceneには調停だけを追加する。

## Implementation order

1. 失敗するユニットテストで一度だけの状態遷移を固定する。
2. 純粋な進行モデルを実装する。
3. 会話文とRubyTextを追加し、文言テストを追加する。
4. プロローグ終了後へ接続し、スキップ・中断・再読込を扱う。
5. E2Eで新規ゲーム導線と再表示防止を検証する。
6. 全体検査、実ブラウザ確認、5軸コードレビューを行う。

## Risks and mitigations

| Risk                                  | Impact | Mitigation                                                          |
| ------------------------------------- | ------ | ------------------------------------------------------------------- |
| 既存セーブへ突然表示される            | 中     | pending がある場合だけ表示し、古いセーブにはpendingを自動付与しない |
| ストーリースキップで説明まで消える    | 高     | Cutscene完了後の独立した通常会話として表示する                      |
| 説明途中の終了で永久に消える          | 中     | 開始前にpendingを保存し、完了イベント保存まで再試行可能にする       |
| Overworld.tsの肥大化                  | 中     | 進行モデルと会話生成を専用モジュールへ分離する                      |
| E2Eヘルパーがチュートリアルで停止する | 中     | 新規ゲームヘルパーと該当E2Eを新導線へ更新する                       |

## Verification checkpoints

### Checkpoint 1: Core contract

- 未対象・pending・完了済みの3状態がテストで区別される。
- 状態更新が入力GameStateを破壊しない。

### Checkpoint 2: Integrated flow

- プロローグ終了直後にミチルの説明が始まる。
- ストーリースキップ後にも説明が始まる。
- 完了後の再読込では表示されない。

### Checkpoint 3: Release readiness

- `pnpm lint`
- `pnpm check:architecture`
- `pnpm test`
- `pnpm validate:content`
- `pnpm build`
- PC幅・スマホ相当幅で実画面確認

## Rollback

チュートリアル導線、専用進行モデル、i18n文言を同じ変更単位で戻す。保存済みのイベントIDとcounterは未知フィールドとしてゲーム進行へ影響しない。
