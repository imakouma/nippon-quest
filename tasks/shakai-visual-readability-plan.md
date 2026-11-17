# 社会の教材図とスマホ可読性

## 合意された範囲

ユーザーの「同じように…本番反映まで」に従い、算数・理科の既存方式を社会469問へ適用する。既存の問題レビュー、共通viewport、promptImageを使う。新しい画面、依存、契約変更は不要。

## Design brief / reference lock

- 小3〜小6が、形・位置・流れを文章から想像せず読み取れる教材図。
- 既存の理科SVGと算数ピクトグラムを基準に白地、濃い輪郭、短いラベル、余白を維持する（Referoの既存UI尊重・craft指針）。外部デザインのコピーや有料研究は行わない。
- 480px幅、原則260px以内、ラベル24px以上。スマホでは既存の縦レイアウトを使用する。
- 正解語を見出しや代替文に追加しない。図の情報が学習対象になる問題では形を示し、答えの名称を問う。
- 模式図、架空のデータはその旨を表示する。実在の統計値や地形を捏造しない。

## 影響と順序

1. 最新統合HEAD `2f21bc975646b7762782c85ac88ccabc1c00ff3f` を専用ブランチへ通常merge済み。Graphify code-onlyで画像契約・viewport・監査の接点を確認。
2. 全469問を確認し、ID・正答・選択肢の不変テスト、全問レビュー台帳を追加。
3. `scripts/generate-shakai-visuals.ts` と学年別の図定義、`assets/questions/shakai/visuals/`、必要な問題文を変更。既存の描画基本関数を再利用。
4. `gen:manifest`でmanifest/catalog生成。出典・権利台帳を更新し、人間のレビュー承認欄は変更しない。
5. 社会全問4サイズ監査、代表問題のスマホ縦横・回答操作、既存の共有viewport回帰検査。独立レビューと統合後の必須ゲート。
6. PRを本番へマージしデプロイ成功と公開ファイルを確認。正規プレビューは統合checkoutの4174のみ。作業プレビューは空きポートで停止まで管理。

## 検証する失敗

図と問の取り違え、欠けた設問、正解語の漏出、図の小文字、はみ出し、入力や採点の変化、画像404、正答キーの変化。新規SVGはXML解析、外部参照なし、代替文付きで検査する。

## 参考（形・事実の確認のみ、自作図）

- https://www.gsi.go.jp/common/000248794.pdf
- https://www.gsi.go.jp/KIDS/map-sign-tizukigou-2022-kajuen.htm
- https://www.city.fukuyama.hiroshima.jp/site/kannabe-rekishiminzoku/3153.html
- https://www.shugiin.go.jp/Internet/itdb_annai.nsf/html/statics/kokkai/kokkai_sankenbunritsu.htm

## 完了記録

- 社会469問を確認し、162問に124枚の自作SVGを追加・差替え。小3・小4の既存47画像の不一致と、小5の読みにくい3グラフを修正。
- ID・学年・単元・正答キーを維持。炭火アイロンの名称と長文4問の選択肢は、意味を保つ明示的な修正記録を用意した。林業の説明では過去の課題と近年の回復を区別。
- スマホ縦画面では、長い選択肢を1列にし、図の余白・問題文を調整。390×844で修正162問の本文18px以上・図幅280px以上を検査する。
- 福岡の区は架空の境界地図を作らず区名カードとして明示。カード全域で正しくタップ判定され、他のカードが正解にならないことを検査。
- 独立レビューの指摘（図の識別、時代条件、設問の欠落、正解語、カードの端タップ）を修正。
- Graphifyはcode-onlyで更新。追加の依存・契約変更はない。
- 端末実機は未確認。ブラウザのスマホ相当サイズで検証する。

- `VITEST_MAX_WORKERS=2 pnpm check:full` 成功（279ファイル・2535テスト、lint、architecture、教材・学習順監査、型、ビルド、性能予算）。
- スマホChromium 43件、全教科4サイズ監査を含むviewport・battle監査37件成功。福岡カード端の追加後もスマホ全件を再実行済み。
- アプリ内ブラウザの「問題レビュー」で図と選択肢の表示、洗濯板問題の正答フィードバックを確認。
- macOS上のWebKitは起動時に異常終了するため、WebKitの最終判定はUbuntu CIで行う。
- 本番のマージ・配信記録: https://github.com/imakouma/nippon-quest/pull/97

CIのWebKit/Ubuntuで日本語・ふりがなの行高が大きくなり6問が縮小されたため、図の余白と選択肢を再調整した。本文18px・画像280pxの基準は維持。グラフは同じ値を棒の中へ表示し、森・工場の図を横長に整理した。変更範囲を広げた列数判定は回帰を検知したため24文字の基準へ戻し、最終スマホ43件が再度成功した。

## 公開確認（2026-11-17）

- PR #97を本番mainへマージ。配信コミット `1f93d1cb7169a4091c8eaf3bece924901378060d`。https://github.com/imakouma/nippon-quest/actions/runs/43986248253 の全CI・GitHub Pages配信が成功。
- 公開SVG124枚と社会の問題JSON30ファイル、計154ファイルを取得し、ローカルとのSHA-256一致を確認。欠落・差分なし。
- 本番 `/playground.html?q=legacy.shakai.g4.cur-1404-02.b7b25c6bf36e` で見出し「問題レビュー」、390×844の図・本文・選択肢、浄水場の正答フィードバックを確認。通常幅へ戻し本番画面を開いた。
- スマホ画面: `/Users/imamurakouma/.codex/visualizations/2026/11/13/01a1d521-8def-7360-992a-3e1cb1bb08cf/shakai-production-mobile.jpg`
- 通常幅画面: `/Users/imamurakouma/.codex/visualizations/2026/11/13/01a1d521-8def-7360-992a-3e1cb1bb08cf/shakai-production-desktop.jpg`
- 再開時に統合HEAD `e8efc9317f96322d7bfd2de278582fd140ceda0e` を作業ブランチへ通常マージ。権利台帳は双方のパスを保持しcatalogを再生成。本番PRの検証済み差分とは分けて保持した。
- 統合後もcheck:full成功（285ファイル・2577テスト）、スマホ43件、全教科4サイズを含むレイアウト37件成功。正規4174サーバーは変更していない。
- 残る確認範囲: 端末実機は未検証。公開版の既存の「フォルダ構成を読み込めませんでした」表示は本変更の対象外。教科別の既定一覧、問題表示と解答操作は利用できる。
