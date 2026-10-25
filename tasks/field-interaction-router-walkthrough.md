# Walkthrough: Field Interaction Router

## 何を作ったか

- `interact` / `arrive` / `menu` の候補を、Phaser非依存のtyped pure resolverで一件に決定するようにした。
- 正面、counter越し、足元、周囲1マスの互換fallbackと、同一frame・入力lockのguardをpriority contractとして固定した。
- map transitionとevent commandを既存のfield-flow runtimeへ委譲し、別flow実行中は副作用を開始しないようにした。
- `Overworld` は候補収集と既存handlerへのdispatchだけを担当し、描画補助は `src/rendering/overworld/viewLayer.ts` へ分離した。

## どう確認したか

- Focused: router / runtime / event command / boundaryの36テストが通過。
- Mutation: 同一frame条件を反転するとrouterテスト9件中8件が失敗することを確認し、元へ戻した。
- Full gates: lint、architecture、140 test files / 1,483 tests、content validation、production buildが通過。
- Field E2E: `tests/e2e/overworld.spec.ts` の9ケースが通過。入口、fade fallback、名所、宝箱、通常イベントの重複入力を含む。
- Graphify: code-only / no-clusterで更新し、40,856 nodes / 49,408 edges。
- Browser: `http://127.0.0.1:4177/?resetSaves=1` から新規ゲームを開始し、フィールドから町へ入って到着ストーリーが表示されるところまで操作した。console warning/errorは0件。
- Screenshot: Codexのアプリ内ブラウザで、青森フィールド、町へのfade、遷移後の到着ストーリー、初期メニューを撮影・目視確認した。最終プレビューは再現可能な初期メニューへ戻した。

## 残課題

- event commandのcore runtimeは接続口までで、content/schemaへの追加は本タスクの境界外として行っていない。
- buildには既存のchunk size warningが残るが、今回のrouter変更による新規エラーはない。
