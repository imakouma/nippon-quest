# Implementation Plan: 高速CIパイプライン

## Overview

現在1つのjobで直列実行している品質検査と約30分のPlaywright全件検査を分離する。
静的検査・全ユニットテスト・production build・短いスモークを先に返し、同じbuild成果物を
4つのPlaywright shardで再利用する。テスト対象とデプロイ前ゲートは維持する。

## Architecture Decisions

- `check`を5分以内の必須高速ゲートとし、全ユニットテストと主要導線スモークを残す。
- production buildは`check`で一度だけ作り、artifact経由で後続E2Eへ渡す。
- 通常E2EはPlaywright標準の`--shard=n/4`で分割し、各runner内は安全性のため1 workerを維持する。
- 既存のprebuilt用Playwright設定を正式なCI入口へ昇格し、各shardでの再buildを避ける。
- 同一refの古いrunは`concurrency.cancel-in-progress`で中止する。
- Pagesデプロイは`check`と全E2Eの成功を要求し、品質条件を緩めない。
- 外部依存、ゲームコード、コンテンツ、既存テストのskip条件は追加しない。

## Dependency Graph

`CI契約テスト` → `prebuilt preview + smoke入口` → `check/artifact/E2E matrix` → `局所検証` → `全体検証・レビュー`

## Task List

### Phase 1: Regression contract

- [x] Task 1: CI構成の失敗する契約テストを追加する

### Phase 2: Fast vertical slice

- [x] Task 2: build済みdistを使う短いスモーク入口を追加する
- [x] Task 3: GitHub Actionsを高速ゲートと4 shardへ分離する

### Checkpoint: Pipeline contract

- [x] CI契約テストが成功する
- [x] スモークE2Eがproduction buildを再buildせず成功する
- [x] 通常E2Eの収集件数がshard分割前後で一致する

### Phase 3: Verification and review

- [x] Task 4: 局所・全体検査と5軸レビューを完了する
- [x] Task 5: ローカル実測結果と運用方法をWalkthroughへ記録する（GitHub実測はpush後）

### Checkpoint: Complete

- [x] lint、architecture、unit、content、buildが成功する
- [x] 主要導線スモークが成功する
- [x] shardごとの失敗成果物と古いrunの自動cancelがworkflowに固定される
- [x] 実行対象数を削っていないことを確認する

## Risks and Mitigations

| Risk                                          | Impact | Mitigation                                                        |
| --------------------------------------------- | ------ | ----------------------------------------------------------------- |
| shard間でテスト対象が欠落・重複する           | 高     | Playwrightの`--list`で単一実行と4 shard合計を比較する             |
| 各runnerが再buildして短縮効果が消える         | 高     | `dist` artifactとprebuilt configを契約テストで固定する            |
| shard内並列でPhaser/WebGLが不安定になる       | 高     | 各runnerの`workers: 1`を維持し、runner単位だけ並列化する          |
| 既存7件のmain E2E失敗で新構成の検証が赤になる | 中     | 既知失敗を隠さずshard別に可視化し、構成検証と製品不具合を区別する |
| runner消費が増える                            | 中     | 4 shardを上限とし、増加は別承認にする                             |
| shared planを上書きする                       | 高     | 機能別plan/todoだけを使用し、既存ファイルに触れない               |

## Open Questions

なし。GitHub上の実測にはブランチpushが必要なため、ローカル実装・検証・コミット後にpush可否を確認する。
