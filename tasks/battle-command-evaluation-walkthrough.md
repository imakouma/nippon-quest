# Battle Command Evaluation Walkthrough

## Outcome

戦闘コマンドの可否、拒否理由、対象、消費、ターン消費を
`src/core/battle/commandEvaluation.ts` の純粋 evaluator に集約した。engine の実行前検証と
HUD の skill/item/swap/親 command は同じ評価契約を使い、通常の無効入力では例外を投げず、
state・RNG・turn・cost を進めない。

ダメージ理由の説明 UI、content/schema、保存形式、問題契約、戦闘バランスは変更していない。

## Implementation

- `BattleCommandEvaluation` が `allowed`、typed `reason`、`actorId`、`resolvedTargets`、
  `costs`、`consumesTurn` を返す。
- `act` は evaluator の結果を `StepOutput.evaluation` に含め、許可済み target/cost を実行時に使う。
- Battle Scene は問題在庫と物語解放を値だけの `BattleCommandEvaluationContext` に正規化し、
  HUD と engine の両方へ渡す。
- HUD option は拒否理由を `blockReason` として保持する。既存の「問題準備中」とむすび玉の表示文言は
  従来どおり i18n 側で決める。
- `gaugeShort` とボス逃走禁止の既存イベントは表示互換のため維持した。

## Verification

- Focused Vitest: 3 files / 116 tests passed
- Related Vitest: 6 files / 134 tests passed
- `pnpm check:fast`: lint、architecture、app typecheck passed
- `git diff --check`: passed
- Graphify: `graphify update .` completed without an external LLM
- Mutation check: ボス逃走条件を一時的に反転すると対象テストが失敗することを確認し、変更を復元した

## Review

- Correctness: 全 command kind と必須拒否理由を直接テストし、有効コマンドの既存 battle/replay/turn
  テストを維持した。
- Readability: 可否判定を専用 core module に置き、Scene は context 作成と表示調停に限定した。
- Architecture: core は Phaser、Preact、Scene、GameState、乱数に依存せず、`check:architecture` が通過した。
- Security: 外部入力・秘密情報・新規依存・外部通信を追加していない。
- Performance: evaluator は現在の party、inventory、skill 一覧だけを走査し、永続化やネットワーク処理を行わない。

## Browser Verification Limitation

build を実行しない担当制約に従い、4176 番ポートの Vite dev server で battle E2E とアプリ内ブラウザを
試した。どちらも変更した HUD へ到達する前に `src/scenes/entries/overworld.ts` の dynamic import が失敗し、
起動画面の再試行表示で停止した。`pnpm gen:manifest` 後の単一 battle HUD テストでも同じ結果だった。
一時サーバーとブラウザ viewport は終了・復元済みで、生成物に意図しない tracked 差分はない。

統合担当は統合済みブランチで production build を作成後、`pnpm test:e2e:battle` と正規 4174 preview を
再実行すること。

## Integration Notes

- `StepOutput.evaluation` は additive field だが、独自に `StepOutput` を構築する呼び出し元があれば追従が必要。
- Scene 外から `act` / `replay` を呼ぶ場合、問題在庫・物語解放まで厳密に検証したい呼び出し元は
  `BattleCommandEvaluationContext` を渡す。省略時は従来互換の permissive な扱いになる。
- 全件 `pnpm test`、`pnpm build`、`pnpm check:full` は指示どおり統合担当に残した。
