# 問題コンテンツの階層化

## Task 1: レイアウト変換の純粋契約

**Description:** 問題配列をメタデータで単元分けし、30問以下の正規セットへ変換する純粋ロジックと完全性比較をTDDで作る。

**Acceptance criteria:**

- [x] `subject` / `grade` / `unit` から正規パスを導出し、不整合を拒否する。
- [x] 1・30・31・119問を空セットなしで30問以下へ分割する。
- [x] ID、完全JSON値、単元内順序、分類件数の不一致を検出する。
- [x] 正規化済み入力を再処理しても同じ出力になる。

**Verification:**

- [x] focused testが実装前に失敗する。
- [x] `pnpm exec vitest run tests/unit/questionLayout.test.ts` が通る。
- [x] 変更ファイルへ `pnpm test:related` を実行する。

**Dependencies:** なし

**Files likely touched:**

- `scripts/question-layout.ts`
- `tests/unit/questionLayout.test.ts`

**Estimated scope:** Small

## Task 2: 安全な移行CLI

**Description:** 本番問題のdry-run、書き込み、ステージング検証、学術レビュー停止条件、移行レポートを実装する。

**Acceptance criteria:**

- [x] 既定実行はファイルを書き換えず、対象数と予定差分を報告する。
- [x] 明示write時だけ、全検証成功後に正規階層へ置換する。
- [x] 移動対象のレビュー記録が1件でもあればwrite前に停止する。
- [x] 再実行で追加差分が出ない。

**Verification:**

- [x] 一時ディレクトリを使う統合テストがRED→GREENになる。
- [x] dry-run前後の `git status` に問題データ差分がない。
- [x] 現行データで4,829問・309単元・323セット見込みを報告する。

**Dependencies:** Task 1

**Files likely touched:**

- `scripts/migrate-question-layout.ts`
- `scripts/question-layout.ts`
- `tests/unit/questionLayoutMigration.test.ts`
- `package.json`

**Estimated scope:** Medium

## Checkpoint: Migration foundation

- [x] Task 1・2のfocused testsが通る。
- [ ] `pnpm check:fast` が通る。
- [ ] 基盤ロジックをatomic commitにする。

## Task 3: manifest階層カタログ

**Description:** 既存索引を保ったまま `questionCatalog` を決定論的に生成し、loaderが省略可能な契約として検証する。

**Acceptance criteria:**

- [x] 教科→学年→単元→セット、件数、タイプ一覧がmanifestへ生成される。
- [x] 本番問題だけを集計し、`_samples` を除外する。
- [x] 既存manifestにカタログがなくてもloaderが読める。
- [x] `questions`、`questionIndex`、`questionFilesByGrade`、bundle生成が維持される。

**Verification:**

- [x] catalog/loader testsがRED→GREENになる。
- [x] `pnpm gen:manifest` が成功し、同じ入力でカタログ順が安定する。
- [x] 関連unit testsが通る。

**Dependencies:** Task 1

**Files likely touched:**

- `scripts/gen-manifest.ts`
- `scripts/question-layout.ts`
- `src/core/content/loader.ts`
- `tests/unit/content.test.ts`
- `tests/unit/questionLayout.test.ts`

**Estimated scope:** Medium

## Task 4: 本番問題の移行と監査追従

**Description:** 検証済みCLIで問題を正規階層へ移し、パス・hash依存の生成物と東北承認待ち台帳を更新する。

**Acceptance criteria:**

- [ ] 4,829問・309単元・323セットとなり、完全JSON値とID集合が移行前と一致する。
- [ ] 全本番セットが正規パス、1〜30問、単一単元を満たす。
- [ ] 東北18問と「人間承認待ち」が維持され、レビューキューが新セット単位になる。
- [ ] `_samples` と `academic-reviews.json` のレビュー状態を変更しない。

**Verification:**

- [ ] `pnpm gen:manifest`
- [ ] `pnpm audit:academic-review`
- [ ] `pnpm test:data`
- [ ] `pnpm validate:content`
- [ ] QuestionBank関連テスト

**Dependencies:** Task 2、Task 3

**Files likely touched:**

- `content/questions/**`
- `content/manifest.json`
- `imports/academic-review-queue.json`
- `docs/release/tohoku-academic-ledger.md`
- `scripts/audit-tohoku-academic.ts`

**Estimated scope:** Large mechanical data move; review by parity report

## Checkpoint: Data parity

- [ ] 移行レポートの全parity項目が一致する。
- [ ] QuestionBankとコンテンツ監査が通る。
- [ ] データ移行をロジックとは別のatomic commitにする。

## Task 5: 文書・全体検証・レビュー

**Description:** 現行アーキテクチャ文書を新階層へ合わせ、全ゲート、実行時確認、5軸レビューを完了する。

**Acceptance criteria:**

- [ ] docsが正規パス、30問上限、生成カタログ、レビュー単位を説明する。
- [ ] 仕様のSuccess CriteriaとDefinition of Doneを満たす。
- [ ] 最新サーバーのQuestion Playgroundで問題を読み込み、ID直接表示できる。
- [ ] correctness/readability/architecture/security/performanceのレビューで必須指摘が残らない。

**Verification:**

- [ ] `pnpm lint`
- [ ] `pnpm check:architecture`
- [ ] `pnpm test`
- [ ] `pnpm validate:content`
- [ ] `pnpm build`
- [ ] 最新プレビューを開いて確認する。

**Dependencies:** Task 4

**Files likely touched:**

- `docs/01_ARCHITECTURE.md`
- `docs/04_CONTENT_TEMPLATES.md`
- `tasks/question-content-layout-walkthrough.md`

**Estimated scope:** Medium

## Checkpoint: Complete

- [ ] 全タスクと仕様のSuccess Criteriaが完了している。
- [ ] 未コミット差分がなく、ブランチ名・コミットID・検査結果を報告できる。
- [ ] merge/pushしていない。
