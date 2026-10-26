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
