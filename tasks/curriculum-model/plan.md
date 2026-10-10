# Implementation Plan: curriculum-model

## Overview

承認済み `SPEC-curriculum-model.md` に従い、単元へ課程区分・推奨学期・根拠・レビュー状態を付け、問題から単元経由で分類を導出できる基盤を作る。最初の縦スライスとして1年1学期の国語・算数・生活を登録し、既存1・2年英語を正式進捗から隔離する。

計画承認後、詳細タスクを `tasks/curriculum-model/todo.md` で管理する。既存の `tasks/plan.md` と `tasks/todo.md` は問題UI監査用として保持する。

## Dependency Graph

`unitSchema` の分類契約
→ 学年別正式課程ルールと分類導出
→ カリキュラム検証
→ 1年1学期の単元配置
→ 国語・算数・生活の学習目標グラフ
→ 監査レポートと全体検証

## Architecture Decisions

- `QuestionBase` は変更せず、問題の分類は `question.unit` と単元索引から導出する。
- 新しい単元フィールドは移行中のみ任意とし、対象スライスの完全性は専用検査で厳格化する。
- 正式課程の対応表は純粋ロジックとして一箇所に置き、UIやSceneで教科分岐しない。
- 学期配置は根拠状態と出典を必須にし、出版社間の差は `variable` または複数学期で表す。
- 学習指導要領コードは82V12を正とし、AI照合は `source-checked` までとする。
- 新規依存は追加しない。

## Task List

### Phase 1: Classification foundation

- Task 1: 単元分類スキーマの契約テストと実装
- Task 2: 正式課程判定・問題分類導出の契約テストと実装

### Checkpoint: Foundation

- 単元分類の有効・無効ケースがテストで固定される。
- 1・2年英語が正式課程判定から除外される。
- 既存単元と問題の読み込みが壊れない。

### Phase 2: Validation

- Task 3: 単元・問題・出典・課程配置の整合性検証
- Task 4: 1年1学期の単元配置と根拠登録

### Checkpoint: Placement

- 1年1学期の国語・算数・生活を抽出できる。
- 対象単元の学期・出典・レビュー状態に欠損がない。
- 1年英語は `supplementary` としてのみ抽出される。

### Phase 3: Learning-goal slices

- Task 5: 1年1学期・国語の学習目標グラフ
- Task 6: 1年1学期・算数の学習目標グラフ
- Task 7: 1年1学期・生活の学習目標グラフ

### Checkpoint: Curriculum model

- 各対象単元に学習目標、学習指導要領コード、出典、問題リンクがある。
- 前提関係と問題リンクの参照整合性検査が通る。
- 問題不足・未対応問題を機械的に数えられる。

### Phase 4: Handoff quality

- Task 8: カリキュラムカバレッジ監査レポート
- Task 9: 全体検査・コードレビュー・Graphify更新

### Checkpoint: Complete

- 承認済み仕様の成功条件をすべて満たす。
- 標準検査がすべて成功する。
- `content-audit` が利用できる1年1学期の不足・逸脱一覧が生成される。

## Risks and Mitigations

| Risk                                      | Impact | Mitigation                                                            |
| ----------------------------------------- | ------ | --------------------------------------------------------------------- |
| 学期配当を公式指定と誤認させる            | 高     | `status` と出典を必須化し、UI向け語彙を「おすすめ時期」に限定する     |
| 既存4,117問の一括変更で回帰する           | 高     | 問題本体は変更せず、単元から分類を導出する                            |
| 既存の算数1年グラフと新規データが競合する | 高     | IDを再利用し、差分追加前に重複・内容競合テストを置く                  |
| 未コミットのUI作業と衝突する              | 中     | `src/ui`、`src/scenes`、既存tasksファイルを本モジュールでは変更しない |
| 教科書会社間で配当時期が異なる            | 中     | 二社以上を照合し、不一致は `variable` または複数学期にする            |
| 問題リンク作成が主観的になる              | 中     | 主目標・補助目標・読解負荷を分離し、低確信はdraftに残す               |

## Verification Commands

```bash
pnpm validate:curriculum-graph
pnpm audit:curriculum
pnpm lint
pnpm check:architecture
pnpm test
pnpm validate:content
pnpm build
```

## Open Questions

なし。1・2年英語は承認済み仕様どおり、削除せず `supplementary` として隔離する。
