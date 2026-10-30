# Implementation Plan: Question Browser Tree

## Overview

生成済み `questionCatalog` を使い、Question Playground の既存問題表の左へ教科 → 学年 → 単元 → セットの閲覧ツリーを追加する。セット選択は既存表へファイル条件を1つ加えるだけとし、全件検証、検索、問題実行、ID直リンクを維持する。

## Architecture Decisions

- 階層情報は `QuestionCatalog` から直接描画し、`QuestionEntry` や問題本文から再構築しない。
- `QuestionTree.tsx` は表示とセット選択だけを担当し、問題表の絞り込みは既存フィルターを所有する `QuestionList.tsx` に置く。
- `playground.tsx` はmanifestから得たカタログをstateへ保持して渡すだけにする。
- 教科・学年・単元はネイティブ `details/summary`、セットと「すべて」はbuttonを使う。
- カタログがない場合はツリーを描画せず、既存表をそのまま表示する。
- 初期状態は全件表示。中間階層絞り込み、永続化、ツリー内検索は作らない。
- 新規依存と契約変更は行わない。

## Dependency Graph

```text
ContentManifest.questionCatalog
              ↓
      playground.tsx state
              ↓
       QuestionList props
        ↙             ↘
QuestionTree UI    file scope filter
        ↘             ↙
          existing table
```

## Task List

### Phase 1: Regression contract

- [x] Task 1: ツリー操作の失敗するE2E契約を追加する

### Checkpoint: RED

- [x] 追加したPlaywrightテストが、ツリー未実装の理由で失敗する
- [x] 既存Playgroundテストは変更前の挙動で通る

### Phase 2: Vertical slice

- [x] Task 2: カタログツリーとセット絞り込みを実装する

### Checkpoint: Behavior

- [x] 教科→学年→単元→セットを開き、セット選択と全件復帰が動く
- [x] 既存検索・行選択・ID直リンクが通る
- [x] カタログがない場合に既存表が表示される

### Phase 3: Documentation and verification

- [ ] Task 3: 文書、全体検査、実ブラウザ確認、5軸レビューを完了する

### Checkpoint: Complete

- [ ] 960px幅と320px幅で操作可能
- [ ] キーボードでセットを選択可能
- [ ] 標準ゲートと実ブラウザ確認が完了
- [ ] 必須レビュー指摘が残っていない
- [ ] 専用ブランチへatomic commitし、merge/pushしていない

## Task Details

### Task 1: ツリー操作のE2E契約

**Description:** Playwrightで、カタログ階層、問題数、セット選択による表の絞り込み、「すべて」による解除、キーボード操作を実装前に固定する。

**Acceptance criteria:**

- 教科・学年・単元・セットの各ラベルと件数をたどれる。
- セット選択後は表の行数とファイルが選択セットに一致する。
- 「すべて」とキーボード操作で全件・セットを切り替えられる。

**Verification:**

- `E2E_PORT=4188 pnpm exec playwright test tests/e2e/playground-list.spec.ts -g '問題ツリー'` が実装前に失敗する。
- 既存の同ファイル内E2Eは通る。

**Dependencies:** なし

**Files likely touched:**

- `tests/e2e/playground-list.spec.ts`

**Estimated scope:** Small

### Task 2: カタログツリーとセット絞り込み

**Description:** manifestのカタログをPlaygroundから既存一覧へ渡し、表示専用ツリーとファイルスコープ条件を追加する。狭幅ではツリーを表の上へ積む。

**Acceptance criteria:**

- ツリーは `QuestionCatalog` だけから描画され、各階層の件数を表示する。
- セット選択は既存フィルターと合成され、選択状態を `aria-pressed` で示す。
- カタログ省略時、サンプル、既存検索・エラー表示・問題実行を壊さない。

**Verification:**

- Task 1のPlaywrightテストが通る。
- `pnpm test:related src/tools/QuestionTree.tsx src/tools/QuestionList.tsx src/tools/playground.tsx` が通る。
- `pnpm typecheck:tools` と `pnpm check:architecture` が通る。

**Dependencies:** Task 1

**Files likely touched:**

- `src/tools/QuestionTree.tsx`
- `src/tools/QuestionList.tsx`
- `src/tools/playground.tsx`
- `src/tools/playground.css`
- `tests/e2e/playground-list.spec.ts`

**Estimated scope:** Medium

### Task 3: 文書・全体検証・レビュー

**Description:** 現行アーキテクチャ文書とWalkthroughを更新し、標準ゲート、デスクトップ・狭幅ブラウザ、キーボード、5軸レビューを完了する。

**Acceptance criteria:**

- docsがツリーの情報源、セット絞り込み、既存表との関係を説明する。
- correctness / readability / architecture / security / performanceの必須指摘が残らない。
- 最新ビルドを確認用ポートで開き、960px幅と320px幅を確認できる。

**Verification:**

- `pnpm lint`
- `pnpm check:architecture`
- `pnpm test`
- `pnpm validate:content`
- `pnpm build`
- Playwrightとアプリ内ブラウザでツリー操作を確認する。

**Dependencies:** Task 2

**Files likely touched:**

- `docs/01_ARCHITECTURE.md`
- `tasks/question-browser-tree-todo.md`
- `tasks/question-browser-tree-walkthrough.md`

**Estimated scope:** Medium

## Risks and Mitigations

| Risk                                         | Impact | Mitigation                                                  |
| -------------------------------------------- | ------ | ----------------------------------------------------------- |
| 既存の全件表・検索がセット選択で戻せなくなる | 高     | 明示的な「すべて」buttonとE2Eで復帰を固定する               |
| ツリーと既存フィルターの条件が競合する       | 中     | ファイル条件を既存 `pool` の手前に1条件だけ加える           |
| 323セットでツリーが長くなる                  | 中     | 教科・学年・単元をネイティブdetailsで閉じ、初期は全て閉じる |
| 狭幅で表がページ全体を押し広げる             | 中     | ツリーと表を縦積みにし、表側コンテナだけ横スクロールさせる  |
| 旧manifestでカタログがない                   | 低     | `questionCatalog` は省略可能のまま、ツリーだけ非表示にする  |

## Parallelization

主要ファイルが同じ垂直スライスに集中するため並行化しない。Task 1 → Task 2 → Task 3を順番に行う。

## Open Questions

なし。
