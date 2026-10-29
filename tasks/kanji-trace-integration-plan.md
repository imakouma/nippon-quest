# Implementation Plan: kanji-trace renderer integration

## Architecture decisions

- 参照 commit `eb4ee040` の採点方式と教材を移植し、現行の分割renderer構成・`zod/v3`・即時abortへ適合させる。
- `contracts.ts` と恐山イベント定義は変更しない。既存の plugin registry と query filter をそのまま使う。
- 短画面対応は kanji-trace 固有CSSの高さ制約だけに限定する。

## Dependency order

1. RED: 採点、schema、registry、タッチ、ルビ、abort、恐山候補の失敗テストを追加する。
2. GREEN: schema・view・mount・registry・i18n・CSSを最小実装する。
3. Data: 問題JSONを追加し、schema/manifestを生成する。
4. Verify: focused → related/fast → full gates → browser。
5. Review: 5軸レビュー、Graphify更新、原子的コミット。

## Risks and mitigations

| Risk                          | Mitigation                                         |
| ----------------------------- | -------------------------------------------------- |
| canvas座標がCSS縮小時にずれる | client座標をbounding rectで0〜1へ正規化する        |
| abortが正誤演出待ちになる     | pending timerを解除し、即時resolveするテストを置く |
| 360px高でボタンが画面外になる | canvasを高さにも追従させ、実ブラウザで確認する     |
| 字体差で採点が不安定          | guideと入力を同じmaskへ正規化し、許容膨張を使う    |

## Checkpoints

- REDを実測してから実装する。
- 各focused testが緑になってからデータ・生成物へ進む。
- full gates後の差分だけをレビュー・コミットする。
