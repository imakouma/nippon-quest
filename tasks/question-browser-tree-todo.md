# Question Browser Tree

## Task 1: ツリー操作のE2E契約

**Acceptance criteria:**

- [x] 教科・学年・単元・セットと各件数をたどれる。
- [x] セット選択で既存表が対象ファイルだけになる。
- [x] 「すべて」とキーボード操作で表示範囲を切り替えられる。

**Verification:**

- [x] focused E2Eが実装前に失敗する。
- [x] 既存Playground E2Eは通る。

## Task 2: カタログツリーとセット絞り込み

**Acceptance criteria:**

- [x] `QuestionCatalog` だけから階層を描画する。
- [x] セット条件を既存フィルターへ合成し、選択状態を支援技術へ伝える。
- [x] カタログ省略、サンプル、検索、エラー表示、問題実行を壊さない。

**Verification:**

- [x] focused E2Eが実装後に通る。
- [x] related tests、tools typecheck、architecture checkが通る。

## Checkpoint: Behavior

- [x] セットを選択・解除できる。
- [x] 既存検索・行選択・ID直リンクが通る。
- [x] 960px幅と320px幅で操作できる。

## Task 3: 文書・全体検証・レビュー

**Acceptance criteria:**

- [x] アーキテクチャ文書とWalkthroughを更新する。
- [x] 5軸レビューの必須指摘が残らない。
- [x] 最新ビルドを実ブラウザで確認する。

**Verification:**

- [ ] `pnpm lint`（今回未変更の `SPEC-math-learning-content-pilot.md` の既存Prettier違反のみ）
- [x] `pnpm check:architecture`
- [x] `pnpm test`
- [x] `pnpm validate:content`
- [x] `pnpm build`
- [x] Playwrightとアプリ内ブラウザ確認

## Checkpoint: Complete

- [x] 仕様のSuccess Criteriaを満たす。
- [x] 作業ツリーがcleanで、ブランチ名・コミットID・検査結果を報告できる。
- [x] merge/pushしていない。
