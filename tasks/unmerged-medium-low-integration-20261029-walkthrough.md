# Walkthrough: 未採用の中・低優先度機能の統合

## 実装した内容

- 選択学年以下の復習問題を学年bundleへ含め、英語は小3から配信するようにした。
- 仮想スティックのtouchstart伝播を止め、問題枠全体を縦スクロール可能にした。
- 小1国語の初期技を4単元へ分け、v13以前のセーブへ重複なく追加するv14移行を実装した。
- 装備セットの未完成数、完成名、既存の戦闘効果説明をメニューと現行バッグ詳細へ表示した。
- 国語問題1588問をCSVへ書き出し、ハッシュとschemaを検査して承認行だけ反映できるレビュー手順を追加した。

## 元変更からの適応

- 旧コミットのセーブ移行は、現行v13を上書きせずv13→v14として追加した。
- 国語レビューCSVのハッシュは問題文だけでなく、ID・形式・学年・単元・タグ・制限時間・payload・解説を対象にした。
- 技術的な問題IDを子ども向け本番画面へ表示する旧変更は移植せず、レビューCSVだけで管理IDを扱うようにした。
- 実ブラウザ検証で旧メニュー用セット表示が現行バッグへ届いていないことを発見し、現行バッグモデルにも同じ表示を追加した。

## 検証結果

- `pnpm lint`: PASS
- `pnpm check:architecture`: PASS
- `pnpm test`: 185 files / 1819 tests PASS
- `pnpm validate:content`: 47 areas / 542 monsters / 462 items / 40 skills / 86 question files PASS
- `pnpm build`: PASS
- 仮想スティックE2E: 2 viewport PASS
- 長文問題監査E2E: PASS
- 装備セット現行バッグE2E: PASS
- アプリ内ブラウザ: 問題枠の `overflow-x: hidden`、`overflow-y: auto` と実行時例外なしを確認

## 画面確認

- preview: `http://127.0.0.1:4178/`
- 問題監査: `http://127.0.0.1:4178/battle-question-audit.html`
- 装備セット完了スクリーンショット: `test-results/equipment-set-progress-完成した装備セットの名前と効果をバッグ詳細に表示する/aomori-set-complete.png`

## 残る注意点

- 学術レビューは81/81問題ファイルが人による承認待ちで、今回の統合は承認作業そのものを代替しない。
- 任意アセット未配置は既存のフォールバック対象で、検証上の欠損ではない。
