# Question Browser Tree Walkthrough

## Outcome

Question Playground の既存問題表へ、生成済み `questionCatalog` を情報源とする教科 → 学年 → 単元 → セットの閲覧ツリーを追加した。4,829問を全件表示したまま開始し、セットを選ぶと既存表・検索・エラー表示をそのファイルへ絞り、「すべて」で解除できる。

## Implementation

- `QuestionTree.tsx` は階層表示とセット選択だけを担当する。中間階層はネイティブ `details/summary`、選択は `aria-pressed` 付きbuttonを使う。
- `QuestionList.tsx` は選択ファイルを既存のサンプル・ファセット・検索条件へ合成する。
- `playground.tsx` はmanifestのカタログを渡し、ID直リンクでは対象ファイルを先に表示してから全件一覧を補充する。
- 狭幅ではツリーを表の上へ積み、表だけを横スクロールさせる。カタログがない旧manifestではツリーを省略し、表を全幅表示する。

## Verification

- RED: ツリー未実装時に、`問題フォルダ` navigationが存在しない理由でfocused E2Eが失敗。
- GREEN: Playground E2E 6件（一覧、ツリー、キーボード、320px、旧manifest、ID直リンク）が成功。
- `pnpm typecheck:tools`、`pnpm lint:eslint`、`pnpm check:architecture` が成功。
- `pnpm test`: 189 files / 1,903 tests が成功。
- `pnpm validate:content` と `pnpm build` が成功。
- アプリ内ブラウザで通常幅・320px幅のセット選択、21問表示、ページ横はみ出しなし、コンソールerror/warn 0件を確認。
- `pnpm lint` は今回未変更の `SPEC-math-learning-content-pilot.md` にある既存Prettier違反だけで停止。今回変更した全ファイルの個別Prettier検査は成功。

## Review

correctness / readability / architecture / security / performance の5軸で確認した。レビュー中に旧manifestで表が1列目へ縮む問題を検出し、表だけの場合は全幅にするCSSとE2Eを追加した。ファイル絞り込み条件を反転するミューテーションでは、期待21問に対して4,808問となってテストが失敗し、回帰検知力を確認した。必須指摘は残っていない。
