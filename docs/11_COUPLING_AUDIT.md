# 密結合監査（2026-10-03）

対象は `src/`、`scripts/`、`tests/` と設定ファイル。データ・生成ドット絵の巨大さは、制御ロジックの密結合とは分けて判定した。

## 判定基準

- UI変更が保存・戦闘・進行を壊し得るか
- 下位層が Scene / DOM / Phaser / Preact を知っているか
- 表示用の型を、純粋ロジックがUI実装から借りていないか
- 永続化、グローバルイベント、Phaser Registry が複数箇所へ漏れていないか
- 1ファイルが複数の変更理由を持ち、AIが安全に全体を把握できない大きさか

## 全件リスト

| 優先度 | 場所 | 状態 | 問題と対応 |
|---|---|---|---|
| P0 | `src/scenes/Overworld.ts` | 未解消・増加禁止 | 約3,900行。移動、マップ、町、メニュー、図鑑、イベント、地方進行の調停が集中している。既存変更が多いため一括分割は禁止。次回から機能追加時に controller / view-model / presenter を先に別ファイルへ抽出する。行数予算をCIで固定。 |
| P0 | `src/scenes/Battle.ts` | 未解消・増加禁止 | 約1,840行。戦闘進行、問題出題、演出、HUD同期、報酬処理が集中。純粋戦闘計算は既に `core/battle` に分離済み。次は question flow、reward settlement、scene orchestration の順に抽出する。行数予算をCIで固定。 |
| P1 | `src/ui/battle/BattleHud.tsx` | 未解消・増加禁止 | 約850行。コマンド、状態表示、入力制御が集中。表示小部品は既にあるため、次のUI変更時に command panel / party panel / gaugesへ分割する。行数予算をCIで固定。 |
| P1 | Menu表示契約 | 解消 | `roadmap.ts` と `menuEntries.ts` が `MenuOverlay.tsx` の型を直接参照していた。`src/shared/menuModel.ts` へ中立な契約を移し、Scene側整形とUI描画を分離した。 |
| P1 | 保護者UIとセーブ | 解消 | `ParentOverlay.tsx` がIndexedDB実装を含む `state/save.ts` を直接importしていた。JSON変換を純粋な `state/serialization.ts` へ分離した。保存先の操作はcomposition層に残す。 |
| P1 | `src/main.ts` と Phaser Registry/Event | 管理対象 | 起動、Scene登録、セーブ、問題バンクのcomposition rootとして結合が許される場所。ただしイベント名が文字列なので、増える場合はtyped portへまとめる。UIやcoreからRegistryを直接触らせない。 |
| P1 | `Overworld.ts` / `Battle.ts` と Registry | 管理対象 | Scene境界として現在は許容。ただし取得時の型アサーションが多い。将来 `GameServices` 型を1つ登録し、content / game / bankを個別キーで取得しない形へ寄せる。 |
| P2 | `src/ui/PixelIcon.tsx` → `scenes/art/icons.ts` | 既存負債 | UIがScene配下の実装へ逆依存している。実体は共有描画資産なので、将来 `src/visual/` へ移動する。CIではこの既存1経路だけ許可し、新規逆依存は禁止。 |
| P2 | `AreaMap.tsx` / `WorldMapOverlay.tsx` → `scenes/art/palette.ts` | 既存負債 | 共通パレットの配置場所がScene配下になっている。将来 `src/visual/palette.ts` へ移す。既存2経路だけを許可。 |
| P2 | `src/questions/engine/ask.ts` とDOM | 意図的結合 | rendererのmount先コンテナを作る責務だけを持つ。GameState、Phaser、保存先には依存していないため現状維持。DOM非依存の問題選択は `pick.ts` に分離済み。 |
| P2 | `src/core/content/loader.ts` とfetch | 意図的なadapter同居 | 読取関数を引数に渡せる設計で、検証本体は保存先を知らない。ブラウザ用readerだけがfetchを知るため許容。規模が増えた場合のみadapterファイルへ分割する。 |
| P3 | `src/scenes/art/**` の巨大ファイル | 密結合ではない | 大部分が生成用の静的描画命令。変更理由が「県・素材単位」で分かれ、ゲーム状態を持たない。バンドルサイズ対策は必要だが、ロジック結合の優先課題ではない。 |
| P3 | `scripts/scaffold-maps.ts` | 開発ツール負債 | 約2,500行だが実行時ゲームから独立。生成フェーズ別に分割余地はあるものの、プレイヤー向けバグへの影響が低いため後回し。 |

## 今後の防止策

`pnpm check:architecture` で次を失敗にする。

1. `core` から `ui` / `scenes` / Phaser / Preactへの依存
2. `shared` から各実装層への依存
3. UIから保存実装 `core/state/save` への直接依存
4. 問題レンダラーからPhaser、Scene、GameStateへの依存
5. `save.ts` 以外からlocalforage・Web Storage・IndexedDBへの直接アクセス
6. 巨大な `Overworld`、`Battle`、`BattleHud` の行数増加
7. UIからSceneへの新規逆依存（既存のvisual資産3件だけ移行猶予）

レビュー時は「どこに置くか」より先に、変更理由が1つか、入力と出力が型で表現できるか、外部状態を引数として受け取れるかを確認する。

## 密結合を許してよい場所

密結合そのものが常に悪いわけではない。アプリ入口のcomposition root、1コンポーネント内部の表示と専用CSS、同時に変更される小さな凝集モジュールは強く結び付いてよい。条件は、結合が局所化され、外へ漏れず、同じ理由で一緒に変更されること。AI開発では「高凝集・低結合」を目標にし、関連するものまで無理に分割しない。
