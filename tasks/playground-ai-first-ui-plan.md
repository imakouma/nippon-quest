# Implementation Plan: AI 前提の Question Playground 再設計

## Overview

承認済みの A「レビュー・ワークスペース」へ Playground を再構成し、ローカル開発者モードのゲーム内メニューから「問題一覧」「問題編集」を開けるようにする。公開用ビルドから両開発ページを除外し、既存の問題検索・実行・監査機能は維持する。

## Architecture Decisions

- Playground の問題読込・検証・実行ロジックは変更せず、Preact の構造と CSS の情報階層を組み替える。
- `QuestionList` と `QuestionTree` の既存カタログ契約を再利用し、探索領域へ配置する。
- 生 JSON と生 `QuestionResult` は削除せず、閉じた技術情報へ移す。
- 開発ツールの公開境界は、URL クエリではなくビルド入力とローカル環境判定の二重条件にする。
- ゲーム内メニューの開発ツールは既存タブ型へ混ぜず、開発者モード専用の2リンクとして追加する。
- 新規依存、問題契約、schema、manifest 形式は変更しない。

## Dependency Graph

```text
Vite dev-tool build flag ──→ production output boundary
            │
            └─→ Overworld local dev availability
                         └─→ MenuOverlay developer links

Question catalog/entries ──→ Playground explorer
Selected question ─────────→ preview header/stage/result
Raw JSON/result ───────────→ collapsed technical details
```

## Task List

### Phase 1: Regression contracts

- [x] Task 1: 開発者メニューと Playground の新しい主要動線を失敗するテストで固定する。

### Checkpoint: RED

- [x] 開発者モード専用リンクが未実装の理由でテストが失敗する。
- [x] Playground の新しいランドマークと技術情報が未実装の理由で E2E が失敗する。

### Phase 2: Developer-only boundary

- [x] Task 2: ローカル開発ビルドだけへ問題一覧・編集を含め、開発者モードのメニューから開く。

### Checkpoint: Boundary

- [x] 通常の `pnpm build` に `playground.html` が存在しない。
- [x] 開発用ビルドと HMR ではレビュー／編集を統合した Playground を開ける。
- [x] 公開ホストの `?dev` では開発者入口が出ない。

### Phase 3: Review workspace

- [x] Task 3: Playground を探索・プレビュー・結果・技術情報へ再構成する。
- [x] Task 4: 320/768/1024/1440px とキーボード操作を整える。

### Checkpoint: Behavior

- [x] 問題選択、直リンク、検索、フォルダ、実行、中断、再読込が維持される。
- [x] 結果を生 JSON なしで確認できる。
- [x] JSON と技術情報は初期状態で閉じている。

### Phase 4: Documentation and verification

- [x] Task 5: アーキテクチャ文書、全体検査、実ブラウザ確認、5軸レビューを完了する。

### Checkpoint: Complete

- [x] 標準ゲートと対象 E2E が成功する。
- [x] 開発用プレビューでゲーム内導線と Playground を確認できる。
- [x] correctness / readability / architecture / security / performance の必須指摘が残っていない。

## Task Details

### Task 1: Regression contracts

**Description:** MenuOverlay の開発者リンクと Playground のAI前提情報階層を、実装前にテストへ固定する。

**Acceptance criteria:**

- 開発者リンクは通常メニューに出ず、開発者ツールを渡した場合だけ2件出る。
- Playground は問題探索、プレビュー、結果、閉じた技術情報を持つ。
- 既存の全件数、フォルダ、直リンク契約を保持する。

**Verification:**

- focused unit と Playwright が期待した未実装理由で失敗する。

**Files likely touched:**

- `tests/unit/roadmapMenu.test.ts`
- `tests/e2e/playground-list.spec.ts`

**Estimated scope:** Small

### Task 2: Developer-only boundary

**Description:** 本番ビルドから開発ツールページを除外し、ローカル開発者モードのメニューへ安全なリンクを追加する。

**Acceptance criteria:**

- `?dev` は公開ホストで開発者モードを有効にしない。
- 開発者モード ON かつ開発ツール同梱時だけ2リンクを表示する。
- 通常ビルドと開発用ビルドの出力が要件どおり分かれる。

**Verification:**

- focused unit test、typecheck、通常 build の出力確認、開発用 build の出力確認。

**Files likely touched:**

- `vite.config.ts`
- `package.json`
- `src/scenes/Overworld.ts`
- `src/ui/field/MenuOverlay.tsx`
- `content/i18n/ja.json`

**Estimated scope:** Medium

### Task 3: Review workspace

**Description:** 既存ロジックを保ったまま、探索を左、プレビューと結果を右へ配置し、技術情報を折りたたむ。

**Acceptance criteria:**

- 問題未選択、選択済み、実行中、完了、エラーの状態が判別できる。
- 人間向け結果要約が表示され、生 JSON は技術情報に残る。
- ファイル、ID、JSON、登録タイプが通常画面の主役ではない。

**Verification:**

- focused Playwright、typecheck、対象ファイルの lint。

**Files likely touched:**

- `playground.html`
- `src/tools/playground.tsx`
- `src/tools/playground.css`
- `src/tools/QuestionList.tsx`
- `src/tools/QuestionTree.tsx`

**Estimated scope:** Medium

### Task 4: Responsive and keyboard polish

**Description:** レビュー・ワークスペースを各幅で操作可能にし、ネイティブ要素と可視フォーカスを整える。

**Acceptance criteria:**

- 320pxでページ全体が横にはみ出さず、表だけが必要に応じて横スクロールする。
- 768/1024/1440pxで探索とプレビューの優先順位が維持される。
- キーボードだけで問題選択、実行、技術情報開閉ができる。

**Verification:**

- focused Playwright と実ブラウザの4幅確認。

**Files likely touched:**

- `src/tools/playground.css`
- `tests/e2e/playground-list.spec.ts`

**Estimated scope:** Small

### Task 5: Documentation, gates, and review

**Description:** 文書と walkthrough を更新し、標準ゲート、ブラウザ確認、5軸レビューを完了する。

**Acceptance criteria:**

- 文書が新しい主動線と本番境界を説明する。
- 必須検査と対象 E2E が成功する。
- 最新の開発用プレビューをアプリ内ブラウザで確認できる。

**Verification:**

- `pnpm lint`
- `pnpm check:architecture`
- `pnpm test`
- `pnpm validate:content`
- `pnpm build`
- focused Playwright と実ブラウザ確認。

**Files likely touched:**

- `docs/01_ARCHITECTURE.md`
- `tasks/playground-ai-first-ui-todo.md`
- `tasks/playground-ai-first-ui-walkthrough.md`

**Estimated scope:** Medium

## Risks and Mitigations

| Risk                                                   | Impact | Mitigation                                                   |
| ------------------------------------------------------ | ------ | ------------------------------------------------------------ |
| 本番から外したページを既存 `pnpm nrd` でも開けなくなる | 高     | 開発用ビルドだけ明示フラグで両入力を含める                   |
| 保存済み `dev:all` だけで公開メニューにリンクが出る    | 高     | ローカル判定・ビルド同梱・モードONの3条件を要求する          |
| Playground 再配置で既存 E2E セレクタが壊れる           | 中     | IDと主要クラスを必要な範囲で維持し、動線テストを先に更新する |
| 大量問題一覧で再描画が重くなる                         | 中     | データ処理と200件上限を変更せず、CSSとDOM構造の変更に留める  |
| 技術情報を畳んでエラー調査が難しくなる                 | 低     | エラー要約を操作付近に残し、生データを削除しない             |

## Open Questions

なし。A案と追加の開発者モード要件はユーザー承認済み。
