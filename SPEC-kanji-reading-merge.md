# Spec: kanji-reading-merge

## 目的と範囲

開発用の問題レビューで、漢字 → 小1 → 読みの「1年の漢字」と「かんたんな漢字」を「1年の漢字」にまとめ、両方の問題を同じ場所で探せるようにする。書きや他学年の分類は変えない。問題自体、問題 ID、単元 ID、ファイル、学習・ゲーム用の単元構造は変更しない。

## 技術構成と場所

TypeScript、Preact、Vite、Vitest、Playwright を使用する。開発用 UI は `src/tools/`、問題と単元のデータは `content/`、UI テストは `tests/e2e/` にある。既存の `QuestionTree` と `QuestionList` の選択・フィルタを利用し、生成物のカタログは手編集しない。

## コマンド

- 開発時検査: `pnpm check:fast`
- 関連テスト: `pnpm test:related src/tools/QuestionTree.tsx src/tools/QuestionList.tsx`
- ブラウザテスト: `pnpm exec playwright test tests/e2e/playground-list.spec.ts`
- 統合時の全検査: `pnpm check:full`
- 開発プレビュー: `pnpm nrd`

## コードスタイル

既存の TypeScript strict、Preact とプロジェクトのフォーマットに従う。表示名は既存の翻訳・ラベルを使う。例:

```ts
const files = new Set(unit.sets.map((set) => set.file));
```

## テスト方針と完了条件

- 2単元の読みの問題が一つの項目に収まり、両方の問題を表示できる。件数は表示対象の合計と一致し、重複や取りこぼしがない。
- 既存の分類に従い、読み以外の問題や他学年は混ざらない。
- 検索、選択、プレビュー、問題の編集・保存が従来どおり使える。
- 該当する自動テストを追加し、実ブラウザで表示と操作を確認する。

## 境界

- 常に: 既存の変更を保持し、入力と表示対象を検証する。
- 事前確認: 問題契約・ゲーム用の単元 ID やファイル構造の変更、依存追加。
- 禁止: 問題本体の削除、生成済みカタログの直接編集、本番への開発ツールの追加。

## 未決事項

なし。フォルダの追加・削除と復元は後続機能の仕様で扱う。
