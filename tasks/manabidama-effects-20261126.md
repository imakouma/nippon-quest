# むすび玉と図鑑の演出

- むすび玉の使用時に、アイコンが主人公からモンスターへ飛び、玉が揺れた後に成功・失敗を見せる。
- 図鑑に未登録のモンスターを仲間にしたとき、保存が成功した後、図鑑の実際の並びにある未登録枠が埋まり、登録数が１増える演出を表示する。登録済みの種族には繰り返し表示しない。
- 確認: `pnpm check:fast`、図鑑判定・戦闘結果のユニットテスト、むすび玉使用から登録までのブラウザテスト。
- スクリーンショット: [着弾](manabidama-effects-20261126/musubi-throw.png)、[図鑑登録](manabidama-effects-20261126/dex-registration.png)、[小画面](manabidama-effects-20261126/dex-registration-narrow.png)。
- 残課題: 正規プレビューには統合後に反映される。

## 参考と演出方針

- [Pokémon公式：捕獲の流れ](https://legends.pokemon.com/en-us/news/adventure)を参考に、玉を投げ、結果が分かるまで間を置く。ただし捕獲物・音・画面は本作独自のものを使う。
- [Nintendo公式：図鑑の空欄](https://www.nintendo.com/en-gb/News/2022/November/12-spoiler-free-tips-to-kickstart-your-Pokemon-Scarlet-Pokemon-Violet-adventure--2302635.html)を参考に、実際の図鑑順の６枠を表示し、新規枠と登録数の変化を見せる。
- [妖怪ウォッチ公式：バトルでともだちになる](https://www.youkai-watch.jp/yw2/game/game06.html)の仲間になる楽しさを、本作のむすび玉・モンスター・ハートの演出で表現する。
- 既存の図鑑登録・保存ロジックと成功率は変更せず、未登録の種族を仲間にしたときだけページを表示する。
