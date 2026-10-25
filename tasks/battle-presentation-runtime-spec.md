# Spec: Battle presentation runtime

## Objective

`src/core/battle` が生成した `BattleEvent[]` を、戦闘結果を変更せず、順序保証された表示コマンドへ変換して再生する runtime を `src/scenes/battle/` に置く。Phaser Scene は core の状態と入力を調停し、runtime は表示バッチの直列化、キャンセル、cleanup、skip/fast-forward の範囲だけを担当する。

## Tech Stack

- TypeScript strict / Phaser 3 / Vitest
- 新規依存なし
- core battle、`QuestionResult`、content/schema は変更しない

## Commands

- Focused test: `pnpm vitest run tests/unit/battlePresentationRuntime.test.ts`
- Battle regression: `pnpm vitest run tests/unit/battleUi.test.ts tests/unit/battlePresentationRuntime.test.ts`
- Required gates: `pnpm lint`, `pnpm check:architecture`, `pnpm test`, `pnpm validate:content`, `pnpm build`
- Runtime verification: `pnpm test:e2e:battle`
- Preview: `pnpm exec vite preview --host 127.0.0.1 --port 4175 --strictPort`

## Project Structure

- `src/scenes/battle/presentationRuntime.ts`: BattleEvent から表示コマンドへの純粋変換と直列 runtime
- `src/scenes/battle/eventAnimator.ts`: sprite/tween/camera/audio/HUD を扱う Phaser port 実装
- `src/scenes/Battle.ts`: core battle、入力、runtime の結線
- `tests/unit/battlePresentationRuntime.test.ts`: runtime 契約

## Code Style

```ts
const task = runtime.enqueue(events, narrateContext);
await task;
```

- 表示コマンドは discriminated union とし、暗黙の callback 配列にしない。
- runtime は Phaser を import しない。
- port は text / clock / visual（sprite・tween・camera）/ audio / lifecycle を型で分ける。

## Testing Strategy

- RED を確認してから実装する。
- unit test でイベント順序、キャンセル、port 例外、二重完了、shutdown、skip 範囲を固定する。
- 既存 battle unit/E2E で見た目、効果音、BGM、敵 KO、勝敗復帰の回帰を確認する。
- `Battle.ts` の行数が変更前 1,730 行より確実に減ることを確認する。

## Runtime Contract

- バッチは enqueue 順に直列再生する。後続イベントは前イベントの blocking command がすべて完了するまで開始しない。
- `TALK_FIRST` のイベントだけ、同一イベント内の text と visual を並列にする。次イベントへの順序は維持する。
- `activeTaskCount` は待機中と実行中のバッチ数。各バッチは成功・失敗・キャンセルのいずれでも一度だけ完了する。
- `cancel()` と `dispose('shutdown')` は実行中・待機中を中断し、lifecycle cleanup を一度だけ呼ぶ。dispose 後は enqueue できない。
- port 例外は呼び出し元へ伝播し、runtime は残りの表示をキャンセルして cleanup する。
- `skipSkippable()` と fast-forward が省略できるのは自動ウェイトだけ。手動確認 text、visual の最終状態反映、audio scope、core battle は省略しない。

## Boundaries

- Always: BattleEvent の入力順と既存の narration/animation 意味を維持し、AbortSignal を port に渡し、異常終了時に cleanup する。
- Ask first: BattleEvent 契約、content/schema、外部依存、戦闘ルールの変更。
- Never: runtime で HP、ダメージ、勝敗、行動順、乱数を計算しない。参照作品のコード・データ・資産を取り込まない。

## Success Criteria

1. BattleEvent が型付き表示コマンドへ変換され、enqueue 順に再生される。
2. active task、cancel、port error cleanup、二重完了、scene shutdown が unit test で証明される。
3. skip/fast-forward の対象が自動ウェイトに限定され、手動 text と visual は維持される。
4. Battle Scene shutdown が runtime を dispose し、未完了 task を残さない。
5. `Battle.ts` から独自 chain/play と大きなイベント演出責務が移り、行数が 1,730 行未満になる。
6. 戦闘ルールと BattleEvent 生成に差分がなく、必須検査と battle E2E が通る。

## Open Questions

なし。通常の設計判断は委譲文で事前承認済み。
