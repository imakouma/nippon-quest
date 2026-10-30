# 小1漢字の読みの統合: タスク

- [x] 回帰テスト: 2単元の読みの問題を一つの項目で表示し、件数と集合が一致することを検証する。
  - 検証: `pnpm exec playwright test tests/e2e/playground-list.spec.ts` の対象テストが実装前に失敗する。
  - 対象: `tests/e2e/playground-list.spec.ts`。依存なし。
- [x] 統合表示: 2単元に対応するツリー項目と絞り込みを実装する。
  - 完了条件: 他学年・書きに影響せず、正しい問題を選択できる。
  - 検証: 対象テストが通り、`pnpm check:fast` が成功する。
  - 対象: `src/tools/QuestionTree.tsx`、`src/tools/QuestionList.tsx`。回帰テストに依存。
- [x] 確認: 実ブラウザで表示と選択を確認し、`pnpm build` を実行する。
  - 完了条件: テスト・ビルドが通り、画面で両単元の問題が選べる。
  - 依存: 統合表示。
