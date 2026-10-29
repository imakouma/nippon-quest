# Question Browser Tree

## Task 1: ツリー操作のE2E契約

**Acceptance criteria:**

- [ ] 教科・学年・単元・セットと各件数をたどれる。
- [ ] セット選択で既存表が対象ファイルだけになる。
- [ ] 「すべて」とキーボード操作で表示範囲を切り替えられる。

**Verification:**

- [ ] focused E2Eが実装前に失敗する。
- [ ] 既存Playground E2Eは通る。

## Task 2: カタログツリーとセット絞り込み

**Acceptance criteria:**

- [ ] `QuestionCatalog` だけから階層を描画する。
- [ ] セット条件を既存フィルターへ合成し、選択状態を支援技術へ伝える。
- [ ] カタログ省略、サンプル、検索、エラー表示、問題実行を壊さない。

**Verification:**

- [ ] focused E2Eが実装後に通る。
- [ ] related tests、tools typecheck、architecture checkが通る。

## Checkpoint: Behavior

- [ ] セットを選択・解除できる。
- [ ] 既存検索・行選択・ID直リンクが通る。
- [ ] 960px幅と320px幅で操作できる。

## Task 3: 文書・全体検証・レビュー

**Acceptance criteria:**

- [ ] アーキテクチャ文書とWalkthroughを更新する。
- [ ] 5軸レビューの必須指摘が残らない。
- [ ] 最新ビルドを実ブラウザで確認する。

**Verification:**

- [ ] `pnpm lint`
- [ ] `pnpm check:architecture`
- [ ] `pnpm test`
- [ ] `pnpm validate:content`
- [ ] `pnpm build`
- [ ] Playwrightとアプリ内ブラウザ確認

## Checkpoint: Complete

- [ ] 仕様のSuccess Criteriaを満たす。
- [ ] 作業ツリーがcleanで、ブランチ名・コミットID・検査結果を報告できる。
- [ ] merge/pushしていない。
