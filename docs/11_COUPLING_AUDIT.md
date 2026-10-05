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
| P0 | `src/scenes/Overworld.ts` | 改善中・増加禁止 | 3,945行から3,519行へ縮小。図鑑カタログ、メニュー、地方・全国地図、Tiled JSON の基礎データ化と object dispatch、NPC・宝箱の表示モデルを `overworld/` へ抽出した。移動、町、イベント、地方進行の調停は残るため、機能変更時に controller / view-model / presenter を先に抽出する。行数予算をCIで固定。 |
| P0 | `src/scenes/Battle.ts` | 改善中・増加禁止 | 1,842行から1,756行へ縮小。Scene間契約、戦闘結果表示モデル、バトル後のバッグ編成、スキル・仲間化の出題条件を分離した。戦闘進行、問題のDOMライフサイクル、HUD同期は残るため、scene orchestration を優先して抽出する。行数予算をCIで固定。 |
| P1 | `src/ui/battle/BattleHud.tsx` | 改善中・増加禁止 | 857行から625行へ縮小。勝敗・報酬・仲間化の結果パネルと、キーボード操作・選択ロジックを専用モジュールへ分離した。コマンド、状態表示は残るため、次のUI変更時に command panel / party panel / gaugesへ分割する。行数予算をCIで固定。 |
| P1 | Menu表示契約 | 解消 | `roadmap.ts` と `menuEntries.ts` が `MenuOverlay.tsx` の型を直接参照していた。`src/shared/menuModel.ts` へ中立な契約を移し、Scene側整形とUI描画を分離した。 |
| P1 | 保護者UIとセーブ | 解消 | `ParentOverlay.tsx` がIndexedDB実装を含む `state/save.ts` を直接importしていた。JSON変換を純粋な `state/serialization.ts` へ分離した。保存先の操作はcomposition層に残す。 |
| P1 | `src/main.ts` と Phaser Registry/Event | 管理対象 | 起動、Scene登録、セーブ、問題バンクのcomposition rootとして結合が許される場所。ただしイベント名が文字列なので、増える場合はtyped portへまとめる。UIやcoreからRegistryを直接触らせない。 |
| P1 | `Overworld.ts` / `Battle.ts` と Registry | 管理対象 | Scene境界として現在は許容。ただし取得時の型アサーションが多い。将来 `GameServices` 型を1つ登録し、content / game / bankを個別キーで取得しない形へ寄せる。 |
| P2 | UI → Scene配下の描画資産 | 解消 | 共通描画資産を `src/rendering/` へ移し、UIからScene実装への例外を廃止した。 |
| P2 | `src/questions/engine/ask.ts` とDOM | 意図的結合 | rendererのmount先コンテナを作る責務だけを持つ。GameState、Phaser、保存先には依存していないため現状維持。DOM非依存の問題選択は `pick.ts` に分離済み。 |
| P2 | `src/core/content/loader.ts` とfetch | 意図的なadapter同居 | 読取関数を引数に渡せる設計で、検証本体は保存先を知らない。ブラウザ用readerだけがfetchを知るため許容。規模が増えた場合のみadapterファイルへ分割する。 |
| P3 | `src/rendering/**` の巨大ファイル | 密結合ではない | 大部分が生成用の静的描画命令。変更理由が「県・素材単位」で分かれ、ゲーム状態を持たない。バンドルサイズ対策は必要だが、ロジック結合の優先課題ではない。 |
| P3 | `scripts/scaffold-maps.ts` | 開発ツール負債 | 約2,500行だが実行時ゲームから独立。生成フェーズ別に分割余地はあるものの、プレイヤー向けバグへの影響が低いため後回し。 |

## 今後の防止策

`pnpm check:architecture` で次を失敗にする。

1. `core` から `ui` / `scenes` / Phaser / Preactへの依存
2. `shared` から各実装層への依存
3. UIから保存実装 `core/state/save` への直接依存
4. 問題レンダラーからPhaser、Scene、GameStateへの依存
5. `save.ts` 以外からlocalforage・Web Storage・IndexedDBへの直接アクセス
6. 巨大な `Overworld`、`Battle`、`BattleHud` の行数増加
7. UIからSceneへの直接依存
8. `src` 内の相対importによる循環依存

レビュー時は「どこに置くか」より先に、変更理由が1つか、入力と出力が型で表現できるか、外部状態を引数として受け取れるかを確認する。

## 密結合を許してよい場所

密結合そのものが常に悪いわけではない。アプリ入口のcomposition root、1コンポーネント内部の表示と専用CSS、同時に変更される小さな凝集モジュールは強く結び付いてよい。条件は、結合が局所化され、外へ漏れず、同じ理由で一緒に変更されること。AI開発では「高凝集・低結合」を目標にし、関連するものまで無理に分割しない。
