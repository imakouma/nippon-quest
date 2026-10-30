# 問題レビュー・編集ワークスペース統合 — Tasks

## Task 1: 同一画面編集のE2E契約

**Acceptance criteria:**

- [x] 選択中の実問題IDが編集フォームに表示される。
- [x] 問題文をフォーム変更すると、同じ画面のプレビュー見出しへ即時反映される。
- [x] 編集画面にJSONコードtextareaが存在しない。

**Verify:** 実装前に追加E2Eが失敗し、実装後に成功する。

**Files:** `tests/e2e/playground-list.spec.ts`

## Task 2: Playgroundへフォーム編集を統合

**Acceptance criteria:**

- [x] 右側に編集フォームと実問題プレビューが同時に表示される。
- [x] `EditorQuestionForm`が選択中の下書きを更新する。
- [x] `?q=<id>`が選択問題を保持し、編集専用のURL状態を持たない。

**Verify:** Task 1 E2E、960px/320pxレスポンシブE2E。

**Files:** `src/tools/playground.tsx`, `src/tools/playground.css`, `src/tools/editorQuestionForm.tsx`, `content/i18n/ja.json`

## Task 3: PlaygroundのJSON編集UIを削除

**Acceptance criteria:**

- [x] 技術情報に編集可能な問題JSONがない。
- [x] 元ファイル、登録タイプ、生の実行結果は必要な診断情報として残る。

**Verify:** E2Eで `textarea#pg-json` が存在しない。

**Files:** `src/tools/playground.tsx`, `tests/e2e/playground-list.spec.ts`, `content/i18n/ja.json`

## Task 4: 旧エディタ入口を削除

**Acceptance criteria:**

- [x] `editor.html`, `src/tools/editor.tsx`, `src/tools/editor.css` が削除される。
- [x] 開発者ビルドに `editor.html` が生成されない。
- [x] smokeテストが単一Playground入口を検証する。

**Verify:** `VITE_NQ_DEV_TOOLS=1 pnpm build`とsmoke E2E。

**Files:** `editor.html`, `src/tools/editor.tsx`, `src/tools/editor.css`, `vite.config.ts`, `tests/e2e/smoke.spec.ts`

## Task 5: 旧エディタ専用コードを削除

**Acceptance criteria:**

- [x] collaboration、URL共有、サンプル問題コードに呼び出し元が残らない。
- [x] 対応する旧単体テストも削除される。

**Verify:** `rg`で参照ゼロ、`pnpm test:related`。

**Files:** `src/tools/collaboration.ts`, `src/tools/urlShare.ts`, `src/tools/editorSamples.ts`, `tests/unit/editor-share.test.ts`

## Task 6: 開発者メニューを統合入口へ更新

**Acceptance criteria:**

- [x] 問題一覧は `playground.html` を開く。
- [x] 問題編集も統合済みの `playground.html` を開く。
- [x] 公開環境で開発者導線が出ない既存境界を維持する。

**Verify:** `tests/unit/roadmapMenu.test.ts` と開発者モードE2E。

**Files:** `src/scenes/Overworld.ts`, `tests/unit/roadmapMenu.test.ts`

## Task 7: 文書と確認画像を更新

**Acceptance criteria:**

- [x] architecture/spec/walkthroughが単一ページ・フォーム編集・旧URL削除を説明する。
- [x] 960pxの確認画像に白＋緑の編集モードが写る。

**Verify:** 文書検索で現行仕様と矛盾する `editor.html` 記述が残らない。

**Files:** `docs/01_ARCHITECTURE.md`, `tasks/playground-ai-first-ui-spec.md`, `tasks/playground-ai-first-ui-walkthrough.md`, preview image

## Task 8: 完了ゲート

**Acceptance criteria:**

- [x] focused E2Eと全品質ゲートが成功する。
- [x] 実ブラウザで問題選択・編集・プレビュー同時表示を確認する。
- [x] コードレビューで必須指摘が残らない。

**Verify:** `pnpm lint`, `pnpm check:architecture`, `pnpm test`, `pnpm validate:content`, `pnpm build`, developer build, Playwright E2E。

**Files:** None beyond fixes found by verification.
