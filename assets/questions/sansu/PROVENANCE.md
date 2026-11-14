# 算数の自作図版

`g3/recess-table-1.svg`〜`recess-table-5.svg` は、このプロジェクトの教材データを罫線と文字で表にした図版。
`g1/tokei/*.svg` は、円・直線・数字をコードで配置した時計の図版。
いずれも NIHON QUEST の教材改善作業として独自に制作し、外部画像の転載、画像生成サービス、参照作品は使用していない。
プロジェクトでの編集およびゲームへの同梱配布を意図して作成したもの。外部素材のクレジット要件はない。
フォントはSVGに同梱せず、表示環境のフォントを利用する。

制作履歴: `tasks/sansu-g1-g3-five-fixes.md`、`tasks/sansu-g1-g3-learning-support.md`。

`g1/data/*.svg` は既存の `src/questions/renderers/shared/pictures.ts` の果物ドット絵を再利用した自作図版。`fruit-votes.svg` は絵1つを1人として、りんご3人・みかん2人・ぶどう1人を等間隔に並べた絵グラフ。外部素材は使用していない。

`g1/visuals/*.svg` は `scripts/generate-sansu-g1-visuals.ts` で生成した、小1算数の独自教材図版。果物・動物は既存の `pictures.ts`、花・鉛筆・人物・道具・積み木・比較図・時計はSVGの基本図形から作成。外部画像や生成AIサービスは使用していない。生成時に問題ID・学年・単元・正解の内容が不変であることを検査する。全186問の採否は `scripts/data/sansu-g1-visual-review.json` に記録。
