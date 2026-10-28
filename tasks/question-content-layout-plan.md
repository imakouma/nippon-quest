# Implementation Plan: 問題コンテンツの階層化

## Overview

承認済み `SPEC-question-content-layout.md` に従い、本番4,829問を教科・学年・単元・30問以下のセットへ安全に移す。移行ロジックは先に純粋関数とテストで固定し、書き込み前の完全性検査、実データ移行、manifest階層カタログ、既存監査の追従を順に実装する。

タスクは `tasks/question-content-layout-todo.md` で追跡する。既存の `tasks/plan.md` / `tasks/todo.md` は別作業が進行中のため変更しない。

## Assumptions

- 対象は `question-content-layout` のみで、PlaygroundツリーUIは後続モジュールとする。
- 問題IDと問題JSON値を正とし、旧ファイルパスは移行後の互換対象にしない。
- `_samples` は移行しない。
- 現在0件の学術レビュー記録が将来存在する場合、移行ツールは自動転記せず停止する。
- 同一コンテンツ版内の決定性は維持するが、移行前後で同じseedが同じ問題IDを選ぶ保証はしない。

## Architecture Decisions

- パス計算、グループ化、30問分割、値比較、カタログ構築はI/Oから分離した純粋関数にする。
- CLIは既定でdry-runとし、明示オプションがある場合だけ検証済みの出力を反映する。
- manifestの既存 `questions` / `questionIndex` / `questionFilesByGrade` を残し、`questionCatalog` を追加する。
- `QuestionBase` とレンダラーschemaは変更しない。
- データ移動は専用コミットにし、ロジック変更と分離してrollbackしやすくする。

## Dependency Graph

```text
純粋なレイアウト契約とテスト
        ↓
dry-run / write移行CLIと安全ガード
        ↓
実データ移行・台帳追従
        ↓
manifestカタログ・loader契約
        ↓
全体監査・レビュー・プレビュー
```

## Task List

### Phase 1: Foundation

- Task 1: レイアウト変換と完全性検査を純粋関数として実装する。
- Task 2: dry-run既定の移行CLIと学術レビュー停止条件を実装する。

### Checkpoint: Migration foundation

- 失敗するテストを先に確認し、境界値・値保存・冪等性・レビューガードのfocused testを通す。
- dry-runが既存ファイルを書き換えず、見込み323セットを報告する。

### Phase 2: Data and catalog

- Task 3: manifestへ階層カタログを追加し、loaderで後方互換に検証する。
- Task 4: 本番問題を新階層へ移し、東北台帳とレビューキューを追従させる。

### Checkpoint: Data parity

- 4,829問、309単元、ID集合、完全JSON値、単元内順序、分類件数が一致する。
- 全本番ファイルが1〜30問・単一単元・正規パスである。
- QuestionBankと既存コンテンツ監査が通る。

### Phase 3: Documentation and final verification

- Task 5: 現行構造の文書化、全体検査、5軸レビュー、確認用プレビューを完了する。

### Checkpoint: Complete

- 仕様のSuccess Criteriaをすべて満たす。
- lint、architecture、test、content validation、buildが成功する。
- 差分に問題内容の意図しない変更、秘密情報、無関係な整形がない。
- 専用ブランチにatomic commitが揃い、merge/pushはしていない。

## Verification Strategy

- RED/GREEN: `pnpm exec vitest run tests/unit/questionLayout.test.ts`
- Related: `pnpm test:related <changed source files>`
- Fast checkpoint: `pnpm check:fast`
- Data checkpoint: `pnpm test:data`, `pnpm validate:content`, `pnpm audit:academic-review`
- Final gates: `pnpm lint`, `pnpm check:architecture`, `pnpm test`, `pnpm validate:content`, `pnpm build`
- Runtime: 最新サーバーからQuestion Playgroundを開き、ID直接表示と問題読み込みを確認する。

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| 4,829問の欠落・重複・値変更 | 高 | 書き込み前後をID単位の深い比較で照合し、不一致時は反映しない |
| 旧ファイル削除中の失敗 | 高 | ステージング先を完成・検証してから置換し、Gitコミットをrollback点にする |
| 学術レビューの無効化 | 高 | レビュー記録があればwriteを停止し、自動転記しない |
| manifest/bundleの起動回帰 | 中 | 既存索引を維持し、loader・QuestionBank・buildを検証する |
| 東北監査のパス・hash固定 | 中 | 対象18 IDと承認待ち状態を維持し、新セットに合わせて監査を更新する |
| 323ファイルの大きな機械差分 | 中 | ロジックとデータを別コミットにし、集計と値parityでレビューする |

## Rollback

- ロジック、データ移行、manifest/文書追従を別コミットにする。
- 問題があれば `git revert` で対象コミットだけを戻す。
- `reset --hard`、force push、共有ブランチへの直接mergeは行わない。

## Open Questions

なし。

