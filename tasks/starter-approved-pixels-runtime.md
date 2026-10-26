# 御三家・第一形態の採用ドット絵反映

## 承認と範囲

2026-10-26 ユーザー承認済みの中密度ドット絵を、カグラビ・イズミコ・コダマルの第一形態に適用する。
32×32・NQ48減色はこの3画像には適用しない。全体のアート規格は変更しない。
64×64は描き込み感の目安であり、今回のPNGの実寸ではない。
進化形、歩行シート、全体の高解像度アップデート、戦闘性能・セーブ形式の変更は対象外。

## 実装

- 承認画像から内蔵画像生成ツールで各キャラクターを透過抽出。元の顔・姿勢・配色・ドット密度を維持する指示で制作。
- `assets/sprites/monsters/iwate-{kagurabi,izumiko,kodamaru}.png` に保存。
- 選択画面・バッグ・図鑑は既存の完成PNG優先経路を使う。
- 戦闘開始時に敵と所持仲間の完成PNGを先読みする。未制作／読込失敗時は既存の仮絵を使う。
- 素材の縦横比を維持し、既存の戦闘表示枠に収める。32×32への破壊的な縮小や減色はしない。
- 既存の待機・攻撃・被弾・入替演出は同じImageオブジェクトに適用する。

## 確認項目

- 第一形態3体のPNGがゲーム配布物に含まれる。
- 相棒選択をPC／狭い画面で確認し、選択と加入・バッグ表示が動く。
- 戦闘で新PNGが読み込まれ、巨大化・切れ・背景残りがない。
- 元の32px通常・56pxボスの倍率は変わらない。
- セーブの互換性とパーティの選択は変わらない。

## 制作プロンプト

内蔵imagegenで承認済み3体比較画像を参照し、対象の1体だけを透過抽出する。
「Precise extraction, NOT a redesign. Preserve the exact approved silhouette, expression,
pose, colors, chunky pixel cluster density and simple shading. Keep every appendage intact.
Remove the other creatures and ivory background. No new details, shadows, text or 3D rendering.」

## 検証記録

- `pnpm lint`、`pnpm check:architecture`、`pnpm typecheck:app`、`pnpm typecheck:tests` 合格。
- 全単体テスト：163ファイル・1,686件合格。コンテンツ検証・本番ビルド合格。
- 追加した先読み・表示倍率テスト：5件合格。キャッシュ判定を反転させると3件が失敗し、復元後に合格することも確認。
- 御三家3体を敵として表示するE2Eは合格。完成PNGの通信と実テクスチャ、表示枠、待機後の高さを検査。
- 相棒選択・加入保存・バッグのPNG・味方のPNGを検査。スマートフォンは対応する横向き844×390で確認する。
- 最初の画面確認で待機呼吸が論理倍率へ戻って巨大化する問題を検出し、実際の画像倍率から呼吸するよう修正。
- 進化形・歩行の新コマは未制作。今回は単一PNGに既存の位置移動・待機・攻撃・被弾演出を適用する。
- 公開前の権利確認は素材台帳でholdを維持し、デザイン採用を権利承認として扱わない。
- 共有ブランチへは直接マージ・pushしない。作業ブランチは `codex/starter-approved-pixels-runtime`。
- 最新基点 `b9b076fe03f24d9b92b2cad6f683843afae3d452` を作業ブランチへ取り込み、本番ビルドと相棒フローE2Eを再確認済み。
- 最終E2E：御三家の敵表示3件合格、最新基点の選択・加入・バッグ・味方戦闘1件合格。アプリ内ブラウザでも戦闘を目視確認。

検証画像：`docs/verification/starter-pixels-20261026/selection.png`、`selection-mobile.png`、`partner-battle.png`。
