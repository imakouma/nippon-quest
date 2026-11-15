# Spec Delta: 小学1年生の漢字筆記判定 — V1

Status: approved direction (2026-11-15 user: 既存ライブラリで小学1年生から実装、線を細くし実際に検証)

## Objective / current behavior

既存 `tasks/kanji-trace-integration-spec.md` の面積一致による採点を、1年生配当80字について筆跡認識と筆順・画数・方向の評価へ置き換える。既存は24pxの太線で、順序や逆方向も同点になる。

## New behavior / success criteria

- kanji-recognizer の認識処理を再利用する。日本語のKanjiVGデータをローカル同梱し、ブラウザ内で判定する。筆跡を外部送信しない。
- 1年生80字をカバーし、正しい筆跡は正解、逆方向・筆順違い・画数不足/過剰・別字・塗り潰しは満点にしない。
- とめ・はね・はらいは終端の軌跡で評価する。筆圧による書道の巧拙を保証しない。データに根拠がない区別は推測で断定しない。
- ガイドと筆跡の線を細くし、240pxの筆記枠で入力線を8pxとする。
- 間違いの種類を短いRubyTextで示し、消去して再挑戦できる。
- 2年生以上・読み問題は既存動作を保持する。Canvas取得不可を満点にする処理は廃止する。

## Scope / boundaries

対象はkanji-trace renderer、ローカル筆順データ、i18n、単体/E2Eテスト、仕様と出典。Scene/core、保存形式、contracts.ts、問題payload/schemaは変えない。データのCC BY-SA表示とライブラリのライセンスを保持する。外部AIは導入しないためOmniRouteは不要。

## Verification

Vitestで80字の基準筆跡、揺らぎ、誤順序、逆向き、欠落、余分な画、別字を検証。実ブラウザで問題レビューの正解/不正解/消去と細い線、狭い画面を検証。`pnpm lint`、`pnpm check:architecture`、`pnpm test`、`pnpm validate:content`、`pnpm build`を実行。人間の子どもの筆跡による感度校正は未実施として明記する。
