# Walkthrough: Field Effect Scope

## 何を作ったか

- `src/core/lifecycle/effectScope.ts` にPhaser非依存の所有権scopeを追加した。
- register/dispose、親signal、子scope、cleanup例外継続、guard済みcallbackの無害化を実装した。
- Tween、TimerEvent、ParticleEmitter、camera effect、DOM overlayを既存実体のまま登録する薄いadapterを追加した。
- field flowのDOM cleanupを子scopeへ移し、正常完了、cancel、Scene shutdown、action例外で同じdispose経路を使うようにした。
- map transitionのcamera fadeをflow scopeへ登録し、abort後の遅い完了通知を無害化した。

## どう確認したか

- TDD RED: 未実装module、未接続parent scope、未所有camera effectで失敗することを確認した。
- Focused tests: 5ファイル、33件成功。
- Mutation: `guard` の条件反転をpure/flow両テストが検出し、復元後に再成功した。
- Full tests: 140ファイル、1468件成功。
- `pnpm lint`、`pnpm check:architecture`、`pnpm validate:content`、`pnpm build` 成功。
- E2E: `fade 完了がなく連打されても fallback で一度だけ町へ移動する` 成功。
- Screenshot: アプリ内ブラウザで `http://127.0.0.1:4176/` の最新版タイトル画面を確認した。
- Browser console: warning / error 0件。

## 5軸レビュー

- Correctness: cleanup競合、例外、親abort、遅延callbackをテストで固定した。
- Readability: pure scopeと薄いadapterの2層だけに限定した。
- Architecture: coreはPhaser/DOM非依存で、Sceneは調停だけを行う。構造検査も成功した。
- Security: 外部入力、資格情報、保存データの変更はない。
- Performance: cleanupはscope内の登録数に対する終了時O(n)だけで、frame hot pathへ処理を追加していない。

## 残課題

- 既存フィールド演出の全移行は行っていない。今後、触るTween/Timer/particleから小単位でadapter登録へ移す。
- production buildの既存大容量chunk警告は本変更の対象外。
