# Implementation Plan: pair-match 問題 renderer の本番復旧

## Overview

承認済みの `tasks/pair-match-renderer-spec.md` に従い、参照 commit `d40be101` の pair-match を現行 renderer 契約へ最小移植する。`contracts.ts` と既存 schema は変更せず、renderer、登録、表示、サンプル、生成 schema、回帰テストだけを追加する。

## Dependency Graph

```text
focused tests (RED)
  └─ payload schema + renderer + registry + UI styles/i18n (GREEN)
       └─ sample content + generated schema
            └─ Playground E2E + actual browser verification
                 └─ related / fast / full gates + review + commit
```

## Architecture Decisions

- `QuestionRenderer`、`RendererContext`、schema 生成方式は現行のまま再利用する。
- 参照実装の採点式、2〜6ペア、`faceDown` 既定値を維持する。
- 完了、時間切れ、abort は一つの終了経路へ集約し、abort は保留 timer を解除して即時 resolve する。
- `TimerBar`、`Feedback`、`RubyLabel`、`shuffleIds` を再利用し、新しい共通抽象や依存は追加しない。
- schema JSON は `pnpm gen:schemas` の生成物だけをコミットする。
- サンプルは現行規約どおり3問にし、ロードマップ・アニメーションには触れない。

## Task List

### Phase 1: Contract-first TDD

- Task 1: pair-match の期待動作を focused tests で固定する
  - Acceptance: schema、採点、左右列、裏向き、同列選び直し、即時 abort のテストが実装前に失敗する。
  - Verify: `pnpm vitest run tests/unit/pairMatch.test.ts tests/unit/rendererAbort.test.ts`
  - Files: `tests/unit/pairMatch.test.ts`, `tests/unit/rendererAbort.test.ts`
  - Dependencies: None
  - Scope: Small

### Checkpoint: RED

- 新規 renderer が存在しないことを原因として focused tests が失敗する。
- 失敗が環境や既存テストの不具合ではないことを確認する。

### Phase 2: Minimal renderer slice

- Task 2: 現行契約に適合する renderer を登録する
  - Acceptance: pair-match が registry から取得でき、両モードを完了でき、時間切れ/abort が score 0 で一度だけ完了する。
  - Verify: Task 1 の focused tests が成功し、`pnpm check:fast` が成功する。
  - Files: `src/questions/renderers/pair-match/schema.ts`, `src/questions/renderers/pair-match/index.tsx`, `src/questions/renderers/registry.ts`, `src/questions/renderers/shared/questions.css`, `content/i18n/ja.json`
  - Dependencies: Task 1
  - Scope: Medium

### Checkpoint: GREEN

- focused tests が成功する。
- renderer 境界に Phaser、Scene、GameState、保存先、`Math.random` が入っていない。
- 48px 以上の button、focus-visible、prompt 関連付け、裏向きカード名を確認する。

### Phase 3: Content authoring contract

- Task 3: サンプルと生成 schema を追加する
  - Acceptance: 3問のサンプルが新規 schema に適合し、content validation が成功する。
  - Verify: `pnpm gen:schemas && pnpm validate:content`
  - Files: `content/questions/_samples/pair-match.json`, `schemas/questions/pair-match.schema.json`
  - Dependencies: Task 2
  - Scope: Small

### Phase 4: Browser path

- Task 4: Playground で実操作を検証する
  - Acceptance: サンプルを開き、キーボードでペアを完成し、結果に score 1 が表示される。console error/warning がなく、960×540 の問題枠に収まる。
  - Verify: `pnpm exec playwright test tests/e2e/questions.spec.ts --grep pair-match` とアプリ内ブラウザでの手動確認。
  - Files: `tests/e2e/questions.spec.ts`
  - Dependencies: Task 3
  - Scope: Small

### Phase 5: Full verification and handoff

- Task 5: 全体ゲート、レビュー、Graphify 更新、原子的コミットを完了する
  - Acceptance: related/fast/full gates が成功し、五軸レビューで Critical/Required findings がなく、Graphify をコードのみで更新し、作業ツリーが clean になる。
  - Verify: `pnpm test:related ...`, `pnpm check:fast`, `pnpm check:full`, `git diff --check`, `git status --short`。
  - Files: task walkthrough と検証記録のみ。実装ファイルの追加変更が必要なら該当タスクへ戻る。
  - Dependencies: Task 4
  - Scope: Small

## Risks and Mitigations

| Risk                                 | Impact                                     | Mitigation                                                                    |
| ------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------- |
| 参照実装の abort が現行契約より弱い  | 次の問題へ進んだ後に旧 timer が DOM を消す | abort focused test を先に追加し、timer 解放と即時 resolve を一経路で実装      |
| 6ペアのカードが960×540枠からはみ出す | バトル中に操作できない                     | 既存問題枠で responsive grid を使い、実ブラウザで最大件数を確認               |
| 裏向きカードが読み上げ不能           | キーボード/スクリーンリーダー利用不可      | i18n の accessible name、prompt の `aria-describedby`、focus-visible をテスト |
| schema 生成で無関係な生成物が変わる  | レビュー不能な差分                         | 生成後に diff を確認し、pair-match 以外の変更は原因調査してコミットしない     |
| full gate が進行中の別作業と競合する | 重い検査の同時実行                         | この専用 worktree で単独実行し、他ブランチを取り込まない                      |

## Verification Checkpoints

- RED: 新規 focused tests が期待理由で失敗。
- GREEN: focused + `check:fast` 成功。
- Content: schema generation + content validation 成功。
- Runtime: Playwright + アプリ内ブラウザ、console、キーボード、最大ペア数確認。
- Complete: related + full gate + five-axis review + clean commit。

## Open Questions

なし。
