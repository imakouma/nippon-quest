# 小1・好きな果物の絵グラフ

対象: `sansu.g1.data.0001`。基点: `c286b391`。作業ブランチ: `codex/math-fruit-pictogram`。

## 表示方針と変更

ユーザーのスクリーンショット、既存教材の表図版、既存の果物ドット絵を参考にした。
Refero の craft-details に従い、色だけに頼らず、形・名前・等間隔の並びで比較できるようにする。
外部Refero検索や外部画像サービスは使用していない。

- 丸を文章中に並べた表現を、りんご3つ・みかん2つ・ぶどう1つの絵グラフに置換。
- 調査人数として「絵1つで1人」を明記し、読み上げ・画像代替文・解説も人数に統一。
- 選択肢にも同じ果物の絵を表示。問題ID・正解IDは維持。
- 画像付き選択問題は問題文、図、選択肢の順に配置。時計など既存問題も代表回帰検査。
- 開発サーバーのSVG Content-Typeを修正。図版は既存の `pictures.ts` の独自ドット絵から作成。
- 依存追加、問題契約・スキーマ・保存処理の変更なし。

## 検証

- 変更前に新規回帰テストが丸表記で失敗することを確認。
- `pnpm check:fast` 成功（lint、architecture、typecheck:app）。
- `pnpm exec vitest run tests/unit/sansuFruitVotes.test.ts tests/unit/choiceSpeech.test.ts tests/unit/choiceLimits.test.tsx`: 12件成功。
- `E2E_PORT=4184 E2E_REUSE_SERVER=1 pnpm exec playwright test tests/e2e/question-viewport.spec.ts tests/e2e/battle-question-audit.spec.ts --grep-invert '全問題をバトル問題枠'`: 23件成功。
- `VITE_NQ_DEV_TOOLS=1 pnpm exec vite build` 成功。図版同梱を確認。
- アプリ内ブラウザで画像、りんご選択時の「かんぺき！」、解説、390px幅を確認。コンソールの警告・エラーなし。
- 確認画面: `/tmp/nihonquest-fruit-review.jpg`。
- Graphifyは選択式レンダラーをcode-onlyで解析。外部LLMは使用していない。

## 残る範囲

この1問のみ教材内容を改善。隣の花の丸表記など、他の問題は未変更。
全件問題監査・全E2Eは未実施。共有ブランチには未統合。
レビュー用URL: `http://127.0.0.1:4184/playground.html?q=sansu.g1.data.0001`。
