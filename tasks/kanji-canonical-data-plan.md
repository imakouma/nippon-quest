# Implementation Plan: kanji-canonical-data

## Overview

承認済みの `SPEC-kanji-canonical-data.md` に基づき、小学校配当1026字の学年・音読み・訓読み・用例・一次資料を `content/kanji/readings.json` に整備する。文化庁の公式HTML表から一度だけ機械抽出して手入力ミスを避け、以後のビルドと検査は外部通信せず、チェックイン済みJSONだけを検証する。

この計画は第1モジュールだけを対象とする。問題生成、問題タグ、フォルダUIは後続モジュールで扱う。

## Architecture Decisions

- 既存の `content/i18n/kanji-grades.json` を小学校配当文字と順序の比較対象にし、音訓の正は文化庁の常用漢字表とする。
- 文化庁の公式HTML表は実装時の一度だけ取得・抽出する。外部HTMLやネットワークを通常のビルド、テスト、監査の依存にしない。
- 1026字の正規データは仕様どおり一つのJSONへ保存する。抽出のためだけの恒久的な依存やランタイムコードは追加しない。
- `scripts/validate-kanji-canonical.ts` に純粋な検証関数とCLIを同居させ、テストとコマンドで同じ規則を使う。
- `audit:kanji-canonical` を追加し、既存の `validate:content` からも呼び出す。今後の問題追加やビルドで正規データの破損を見逃さない。
- `src/questions/contracts.ts` とゲームのルビ判定は変更しない。現行の学年別文字列は後方互換のため維持する。
- 一次資料は `content/quality/academic-reviews.json` に登録するが、人間の学術承認を自動的に完了扱いにしない。

## Dependency Graph

```text
検証規則と失敗テスト
        │
        ├── 文化庁・文科省の一次資料登録
        │           │
        │           └── 1026字の正規JSON
        │                       │
        └───────────────────────┤
                                └── CLI・validate:content 統合
                                              │
                                              └── 全体検査・レビュー
```

## Task List

詳細な受け入れ条件と検証手順は `tasks/kanji-canonical-data-todo.md` に記録する。

### Phase 1: Contract

- [x] Task 1: 正規漢字データの検証契約をテスト駆動で実装する

### Phase 2: Canonical data

- [x] Task 2: 一次資料を登録し、1026字の正規JSONを作成する

### Checkpoint: Canonical data

- [x] 1026字、学年別件数、既存文字集合、代表的な音訓の検査が通る
- [x] 外部通信なしで正規JSONを再検証できる

### Phase 3: Integration

- [x] Task 3: 監査コマンドをコンテンツ検証へ統合する
- [x] Task 4: 品質ゲートと差分レビューを完了する

### Checkpoint: Complete

- [x] 承認済み仕様の完了条件をすべて満たす
- [x] `pnpm audit:kanji-canonical`、関連テスト、`pnpm validate:content`、`pnpm check:fast`、`pnpm build` が通る
- [x] 人間の学術レビュー待ちであることが台帳と完了報告から分かる
- [x] `kanji-question-coverage` の仕様作成に進める状態になっている

## Verification Strategy

1. 検証関数の異常系を先にテストし、重複、学年違い、文字種違反、出典切れ、用例不整合を再現する。
2. 公式HTMLから作成した正規JSONを読み、1026字と学年別件数を固定テストする。
3. `王`、`貝`、`畑`を、存在しない音訓を空配列で保つ代表例として固定する。
4. CLI単体、コンテンツ検証、日常品質ゲート、ビルドの順で影響範囲を広げて確認する。
5. 正規データはユーザー向け表示を変えないため、このモジュールではブラウザプレビューを行わない。後続の問題・フォルダ変更時に実画面を確認する。

## Risks and Mitigations

| Risk                                       | Impact | Mitigation                                                                                             |
| ------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------ |
| 公式HTMLの改行や注記を読みとして誤抽出する | 高     | 文字種検査、用例との対応検査、代表例テスト、件数報告で機械検出し、抽出後の差分を学年単位でレビューする |
| 文化庁の用例が児童向け問題として難しすぎる | 中     | 正規データでは根拠付き用例として保持し、児童向け採用は後続の `kanji-question-coverage` で別に審査する  |
| 1026字の大きなJSONがレビューしにくい       | 中     | 学年順・既存配当順に固定し、監査結果に学年別件数と例外を要約する                                       |
| 既存の学年データと将来ずれる               | 高     | `validate:content` で文字集合と学年を毎回比較し、片方だけの変更を失敗させる                            |
| 資料照合を人間の学術承認と誤認する         | 高     | レビュー台帳では資料登録と承認記録を分離し、未承認状態を完了報告に残す                                 |

## Rollback

このモジュールは既存の問題・ゲーム状態を変更しない。問題があれば、新規JSON、検証スクリプト、テスト、package script、一次資料登録だけを一つのコミット単位で戻せる。既存の `content/i18n/kanji-grades.json` は削除・書換えしない。

## Open Questions

なし。
