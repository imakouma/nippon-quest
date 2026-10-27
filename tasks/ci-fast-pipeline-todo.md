# 高速CIパイプライン

## Task 1: CI構成の回帰契約

**Description:** workflowとpackage scriptsを文字列ではなく意図として検証する単体テストを先に追加し、現状で失敗することを確認する。

**Acceptance criteria:**

- [x] 高速`check`と4 shard E2Eが別jobであることを検査する。
- [x] artifact再利用、古いrunのcancel、shard別失敗成果物、Pages依存関係を検査する。
- [x] スモーク用scriptが存在し、既存通常E2E scriptを置き換えないことを検査する。

**Verification:**

- [x] `pnpm test:related tests/unit/ciWorkflow.test.ts` が実装前に期待どおり失敗する。

**Dependencies:** None

**Files likely touched:**

- `tests/unit/ciWorkflow.test.ts`

**Estimated scope:** Small

## Task 2: build済みdistのスモーク入口

**Description:** 起動・探索・バトルの最小導線を短いE2Eにまとめ、既存`dist`をVite previewで配信するPlaywright入口を追加する。

**Acceptance criteria:**

- [x] タイトル起動、初期探索、debugバトルの3導線を短時間で検査する。
- [x] `pnpm test:e2e:smoke`は既存`dist`を再buildしない。
- [x] 通常E2Eと全問題監査の既存コマンドを維持する。

**Verification:**

- [x] `pnpm build`
- [x] 一時ポートで`pnpm test:e2e:smoke`
- [x] Task 1のpackage script契約が成功する。

**Dependencies:** Task 1

**Files likely touched:**

- `tests/e2e/ci-smoke.spec.ts`
- `tests/e2e/playwright.prebuilt.config.ts`
- `package.json`

**Estimated scope:** Medium

## Checkpoint: Fast slice

- [x] スモークが5分を大きく下回って完走する。
- [x] buildの二重実行がログにない。
- [x] 既存の通常E2E入口が変わっていない。

## Task 3: GitHub Actionsの分割

**Description:** `check`で高速ゲートとdist artifact作成を行い、後続matrixで通常E2Eを4 shardに分け、Pagesを両方の成功後へ接続する。

**Acceptance criteria:**

- [x] `check`が静的検査、全unit、content、build、smokeを含む。
- [x] E2E matrixが4 shardで同じdist artifactを使う。
- [x] 同一refの古いrunをcancelし、失敗成果物をshard別に保存する。

**Verification:**

- [x] `pnpm test:related tests/unit/ciWorkflow.test.ts`
- [x] Playwrightの単一`--list`件数と4 shard合計件数が一致する。
- [x] workflow差分を構文・権限・依存関係の観点でレビューする。

**Dependencies:** Task 2

**Files likely touched:**

- `.github/workflows/ci.yml`
- `tests/unit/ciWorkflow.test.ts`

**Estimated scope:** Small

## Checkpoint: Pipeline contract

- [x] Task 1の全契約が成功する。
- [x] E2E対象数が分割前後で一致する。
- [x] `deploy-pages`が`check`と`e2e`を要求する。

## Task 4: 全体検証とレビュー

**Description:** プロジェクト必須検査と変更範囲の5軸レビューを実施し、既知のmain失敗と新規退行を区別する。

**Acceptance criteria:**

- [x] 必須の静的・unit・content・build検査が成功する。
- [x] 変更がCI、テスト入口、計画文書の範囲に留まる。
- [x] CriticalまたはRequiredのレビュー指摘が残らない。

**Verification:**

- [x] `pnpm lint`
- [x] `pnpm check:architecture`
- [x] `pnpm test`
- [x] `pnpm validate:content`
- [x] `pnpm build`

**Dependencies:** Task 3

**Files likely touched:** None

**Estimated scope:** Small

## Task 5: 実測とWalkthrough

**Description:** ローカルのスモーク時間と、push承認後はGitHub Actionsの高速ゲート・最長shard時間を記録し、運用方法を引き継ぐ。

**Acceptance criteria:**

- [ ] before約32〜36分とGitHub上のafter各job時間を比較する（push後）。
- [x] 高速ゲート、全E2E、既知失敗の読み方を記録する。
- [ ] ブランチ、コミット、検査結果を完了報告へ含める。

**Verification:**

- [x] `tasks/ci-fast-pipeline-walkthrough.md`をレビューする。
- [ ] `git status`とコミット差分を確認する。

**Dependencies:** Task 4

**Files likely touched:**

- `tasks/ci-fast-pipeline-walkthrough.md`

**Estimated scope:** Small

## Checkpoint: Complete

- [ ] 仕様のSuccess Criteriaを満たす。
- [x] 実装・検証・既知課題が追跡可能である。
- [ ] push前にユーザーの指示を確認する。
