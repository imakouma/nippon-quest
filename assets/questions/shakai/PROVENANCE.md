# 社会教材図版の制作記録

`scripts/generate-shakai-visuals.ts` と `scripts/shakai-visuals/` が生成元。SVGの基本図形と自作パスで制作し、外部画像・商標・人物肖像の複製を含まない。共通描画は既存の理科図形を再利用する。

- 地図記号の形: 国土地理院 https://www.gsi.go.jp/common/000248794.pdf
- 昔の道具: 福山市神辺歴史民俗資料館 https://www.city.fukuyama.hiroshima.jp/site/kannabe-rekishiminzoku/3153.html
- 三権の関係: 衆議院 https://www.shugiin.go.jp/Internet/itdb_annai.nsf/html/statics/kokkai/kokkai_sankenbunritsu.htm
- 養殖と栽培漁業: 農林水産省 https://www.maff.go.jp/j/heya/kodomo_sodan/0306/04.html

`factory-size-chart`、`trade-chart`、`transport-chart` は既存教材画像の数値を自作図へ転記したもの。元の歴史資料の年・値を維持し、貿易図は主要2分類以外を「そのほかの品目」に集約。これは元図の「その他」と異なる。輸送の数値は丸めにより合計100%と一致しない場合がある。原図の出典記録は `imports/legacy-questions/staged.json` に維持する。数値以外のレイアウトや画像は複製しない。

町の地図、人口、気候、年表の例は架空であり、図内に「例」または「模式図」を明記。福岡の区名カードは地図ではなく、大きな四つのカードに合わせて判定位置も更新した選択図。実在の境界線を表さない。

権利台帳の人間による確認欄は自動承認しない。学術レビュー台帳の承認状態も変更しない。

林業の過去の課題と近年の変化は、林野庁の令和7年度版白書で確認。

- https://www.rinya.maff.go.jp/j/kikaku/hakusyo/r7hakusyo_h/all/chap2_1_3.html
- https://www.rinya.maff.go.jp/j/kikaku/hakusyo/r7hakusyo_h/all/chap3_1_2.html
