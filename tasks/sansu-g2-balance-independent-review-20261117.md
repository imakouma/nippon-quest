# 小2 balance 独立レビュー（2026-11-17）

親worktreeの新規12問の全問題文・選択肢・解説・難度分類と全20群の不足判断をread-only確認。リポジトリ変更なし。

## 結論

数学・単位・条件・学年範囲・図に必須修正は見つからない。単元内にない場面への適用や理由判断を各1問で補う意図は妥当。全群の問題数を均一化せず、九九の基礎問題多数を維持する判断も妥当。

記録調整推奨2件:

1. `sansu.g2.balance.regroup-hundreds` は standard → basic。100が3個・10が12個という直接の十進構成で、宣言基準「直接概念/単純処理」に当たる。10が10個以上になるだけで標準扱いすると、繰上がりのみでは難度を上げない方針とも不整合。集計before/afterも連動更新する。
2. addition群のjudgment/gapsは「合併場面」ではなく「増加場面」。`addition-library` は本を7冊もらい増える場面である。問題・解説・standard分類は正しい。

他のadvancedは、誤りや等分の理由を問うもの、複数条件を整理するものとしてrubric内。data-claimは合計と差の両条件を確かめる判断。単純計算の類題だけを増やす追加ではない。

## 独立計算

- four-digit-cards: 千位4、残り7/2/0を降順として4720。5000未満・各1回・4桁を満たす最大値。
- friendly-sum: (27＋3)＋16＝46。加法の順序を変えて十のまとまりを作る理由が正しい。
- larger-subtraction-paper: 125−68＝57、逆算125。
- half-shape-reason: 両方200×140の長方形。左は100×140、右は対角線による三角形でどちらも面積14000、元の半分。小2向け解説は面積公式を使わず重なる形の等分で説明している。
- data-claim: 5＋3＝8、8−6＝2人多い。
- ruler-reason: 7−2＝5 cm。0でない左端を無視する誤りを特定。
- larger-addition-cards: 82＋49＝131。
- regroup-hundreds: 300＋120＝420。
- metre-ribbon: 1 m20 cm＝120 cm、120−95＝25 cm。
- addition-library: 28＋7＝35冊。
- subtraction-oranges: 23−8＝15個。
- carry-reason: 26＋38＝64。十位への繰上がり1を落とすと54となり、指摘が一致。

## 図・構造の確認

新図half-shapes.svgと再利用play-votes.svg / ruler-start.svgをChromiumで実描画し、対応問題の条件と照合した。2種類の等分形、人数5/4/2/3/6、赤線2～7 cmの位置は一致し、ラベルの欠落なし。
画像: /private/tmp/g2-balance-review-images.png
初回ブラウザ起動はsandboxのMachPort制限で失敗、昇格後描画成功。アプリの2幅E2Eは担当者の結果を参照し、この独立レビューでは再実施していない。

read-only Python検査: baseline 30f9ffc4に対する各群の既存ID相対順は完全維持。reviewの350 IDは一意で、levels全キーと完全一致。

## 根拠・限界

東京書籍2024年度2年年間計画を再閲覧。加減の演算決定、十進位取り、長さの単位換算、計算の工夫、4桁の大小、具体物の等分に対応し、3年の除法・分数演算等は要求しない。
https://ten.tokyo-shoseki.co.jp/text/shou/sansu/data/sansu_keikaku_ryakuan_2.pdf

既存全問の難度ラベルを今回再判定したものではない。新規12問と不足判断・既存順序に限定した独立レビュー。

親担当が分類と記録の調整を採用済み。問題の正答は変更していない。
