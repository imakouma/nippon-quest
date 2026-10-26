# Walkthrough: Player Locomotion Runtime

## 何を作ったか

- `idle / turning / stepping / bumping / scripted / frozen` の決定論的状態機械。
- 80 ms の向き変更、100 ms の衝突、160 ms の1マス歩行。
- `turned / stepStarted / footPlanted / stepCompleted / bumped` の意味イベント。
- 歩行ごとに `a / b` を交互にする先行足状態。
- frozen / scripted 中のプレイヤー入力拒否と idle への resume。
- 既存 `movementDecision` の `move / blocked / stand` だけを runtime コマンドへ変換する Scene 用アダプター。
- core runtime / Scene adapter が共有する `Dir` と `TilePoint` の中立契約。既存 rendering の `Dir` export は変更していない。

## どう確認したか

- RED: runtime 未実装で focused test が module-not-found になることを確認。
- GREEN: `playerLocomotion` と既存 `movementDecision` の focused 15件が成功。
- Mutation: 向き比較を反転すると runtime test 12件中5件が失敗し、復元後に成功。
- 最終 focused: locomotion / movementDecision / characters の18件が成功。
- `pnpm lint`、`pnpm check:architecture`、全ユニット131ファイル・1404件、`pnpm validate:content`、`pnpm build` が成功。
- Graphify のコード専用グラフを作成・更新し、runtime → adapter → 中央統合の依存方向を確認。

## スクリーンショット

なし。このブランチは純粋 runtime と最小アダプターまでで、`Overworld.ts` の表示接続は並行作業との競合を避けるため中央統合へ残している。現時点のブラウザ画面は既存 tween のままで、今回の runtime を目視検証できない。

## 統合担当への注意点

1. `OverworldScene` に `LocomotionState` を保持し、マップ reset 時に現在の向きから idle を初期化する。
2. `movementDecision` の結果を先に確定し、ボス・関所・会話の既存優先処理は維持する。`move / blocked / stand` のみ `locomotionCommandFromDecision` へ渡す。
3. `update` の delta で runtime を進め、`stepping.progress` から sprite / shadow 座標を補間する。既存 Phaser tween と二重に進めない。
4. `stepCompleted` だけで `stepCount`、位置保存、HUD、`arrive` を各1回実行する。`footPlanted` は足音・地面接触エフェクトに使う。
5. busy / battle は frozen、カットシーン移動は scripted とし、終了時に resume する。
6. キーボード、virtual stick、pointer-hold は同じ `readDir` を使い続け、turn 完了後も入力中なら次の frame で同じ要求を再送する。
7. 最終統合後に 127.0.0.1:4174 で3入力系、衝突、エンカウント、遷移、保存をブラウザ確認する。

## 残課題

- `Overworld.ts` の最終接続と runtime state を使う歩行描画。
- terrain contact effects、camera、context action UI とのイベント接続。
- 統合後のブラウザ検証とスクリーンショット。
