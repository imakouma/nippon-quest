# 算数全学年・単元内の学習順 修正記録

## 結果

- 小1〜小6の115グループ・1,842問の内容を確認し、105グループの1,421問の位置を変更。適切だった10グループは維持。
- 用語・単位・具体的な表現/直接読み取り→通常の計算/操作→複数段階・逆算・複合条件へ進む。答えや文字数だけで自動ランク付けしない。
- 小2「ひょうとグラフ」は整理済みグラフの人数を読む3問から開始。25枚のカードを探して数える問題は1〜3番目から10〜12番目へ移動。
- 六つの順序JSONだけで表示を変更。問題ID、内容、単元所属、グループ順、ゲームの抽選、保存データは不変。
- グループごとの理由と別件の教材不整合は [レビュー記録](math-learning-order-20261117-review.md) に記載。

## 検証

- RED：変更前の順序で6学年を含む10件の回帰テストがすべて順序assertで失敗。
- GREEN：mathReviewOrder / mathReviewProgression / 学年別関連テスト、8ファイル46件が成功。
- レビュー後に九九のテストを同じ段の比較（2×8→2の段の複数欄、5×9→5の段の複数欄）へ強化。2の段を一時的に逆順にした変異が失敗することを確認後、保存済みバイト列から復元。対象2ファイル22件が成功。
- 変更前後の全115グループを照合し、各グループ内のID集合・件数・metadataとグループ順が不変、全1,842問が一度だけ収録されることを確認。content/questions、content/curriculum、src の差分なし。
- pnpm check:fast（lint/architecture/typecheck:app）、テストの型検査、VITE_NQ_DEV_TOOLS=1 pnpm build が成功。buildの事前処理でcontent検証も成功。
- Playwright math-review-order.spec.ts：8件成功。全115グループの先頭/末尾計230回の問題選択と、一覧件数、保存フォルダ不変、学年間ID重複なしを検証。既存の390/1440px幅検査も成功。
- アプリ内ブラウザで小2→ひょうとグラフを開き、新しい一覧順と先頭の問題画面を目視確認。consoleのerror/warnなし。
- 確認画像：/private/tmp/nq-math-order-preview.jpg（作業版4175）。

## 配信・引き継ぎ

- 専用worktree：/Users/imamurakouma/.codex/worktrees/math-learning-order/education-2d-RPG
- 専用ブランチ：codex/math-learning-order-20261117
- 統合基点：e8efc9317f96322d7bfd2de278582fd140ceda0e。開始時に通常mergeで同期し祖先関係を確認。元checkoutの既存変更は保持。
- 正規コマンド pnpm --dir /private/tmp/nq-integrate-open-prs-20261114 nrd を実行し、/__integrated-preview のroot/headが統合checkout/上記HEADに一致することを確認。
- 統合担当の指示前なので共有ブランチへmerge/pushしていない。4174はこの変更をまだ含まない。検証用4175は検証後に停止する。
- 全E2E/全データ監査、児童による実測の難易度評価は対象外。設問欠落等の既存問題は別件として記録し、内容の修正はしていない。
