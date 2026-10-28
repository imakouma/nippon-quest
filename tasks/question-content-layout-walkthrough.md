# 問題コンテンツ階層化 Walkthrough

## 結果

- 本番4,829問を、81個の旧ファイルから309単元・323セットへ移行した。
- 正規パスを `questions/<subject>/g<grade>/<unit-slug>/set-<NNN>.json` とし、各セットを同一単元の1〜30問に制限した。
- ID、問題JSON値、単元内順序、教科・学年・単元・タイプ別件数は移行前後で一致した。
- `_samples` 5ファイルは変更せず、本番集計と学術レビュー対象から除外した。
- `manifest.json` に `questionCatalog` を生成し、問題本文を全件読まず教科→学年→単元→セットをたどれるようにした。
- 既存の平坦な `questions`、`questionIndex`、`questionFilesByGrade` と実行時 `QuestionBank` は維持した。

## 実装

- `scripts/question-layout.ts`: 正規セット生成、レイアウト検証、完全性比較、階層カタログ生成。
- `scripts/migrate-question-layout.ts`: dry-run既定、レビュー記録がある場合の停止、ステージング置換、再実行無差分の移行CLI。
- `src/core/content/manifest.ts`: manifestと問題カタログの型・境界検証。1セット30問上限もloaderで検証する。
- `tests/unit/questionSetFixture.ts`: 正規化後の複数セットを単元単位で読むテスト用ヘルパー。
- `imports/question-layout-migration.json`: 4,829問の移行結果と作成・削除ファイルの記録。

## 学術レビュー

- 323/323本番セットが人間による承認待ちで、有効な承認は0件のまま。
- 東北対象18問は4セットへ移り、すべて「人間承認待ち」を維持した。
- 問題内容や承認状態の自動変更は行っていない。

## 検証

- `pnpm check:architecture`: 成功。
- `pnpm test`: 189ファイル・1,903テスト成功。
- `pnpm validate:content`: 成功（本番323セット、サンプル込み328ファイル）。
- `pnpm build`: 成功。
- `pnpm test:data`: 9ファイル・455テスト成功。
- Playwright: 対象13テストのうち初回12成功・旧期待パス1失敗を修正し、該当テスト再実行成功。
- 実ブラウザ: `sansu.g1.kazu-100.ringo-numberline-0001` をID直リンクで開き、`questions/sansu/g1/kazu-100/set-001.json` から表示されることを確認。
- ミューテーション確認: `_samples` 除外条件を意図的に反転するとカタログテストが失敗し、復元後に成功した。
- `pnpm lint:eslint` と変更ファイルのPrettier検査: 成功。
- `pnpm lint`: 作業外の既存 `SPEC-math-learning-content-pilot.md` のPrettier違反だけで失敗。今回の差分は変更していない。

## 5軸レビュー

- correctness: 1・30・31・119問の分割、重複ID、値・順序・分類件数、再実行無差分をテスト。必須指摘なし。
- readability: manifest契約をloaderから専用モジュールへ分離し、旧パス依存テストは共通セット読込へ集約。必須指摘なし。
- architecture: `content -> loader/engine -> scenes -> ui` を維持し、アーキテクチャ検査に合格。必須指摘なし。
- security: 書き込み先は正規化済み相対パスだけに限定し、全検証後に置換。外部入力・資格情報・新依存なし。必須指摘なし。
- performance: runtimeの平坦索引を維持し、階層参照は生成カタログから行える。問題本文の追加全件走査なし。必須指摘なし。

## 確認URL

- `http://127.0.0.1:4176/playground.html?q=sansu.g1.kazu-100.ringo-numberline-0001`

Question Playground自体の教科→学年→単元→セットのツリーUIは、仕様どおり後続モジュール `question-browser-tree` の範囲とする。
