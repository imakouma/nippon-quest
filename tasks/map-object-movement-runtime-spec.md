# Spec: Map Object Movement Runtime

## Objective

NPC と動的 map object に対して、有限の `walk` / `face` / `wait` / `emote` / `hide` / `show`
コマンド列を1件ずつ実行する Phaser 非依存 runtime を追加する。scripted movement は既存の
`npcWander` と分離し、イベント実行器から単一の typed movement command として呼び出せるようにする。

成功とは、次の状態遷移と完了契約が fake port の単体テストで観測できることを指す。

`INIT → WAITING_FOR_READY → STARTING_COMMAND → WAITING_FOR_COMPLETION → ADVANCING → FINISHED`

## Assumptions

1. `walk` は1コマンドにつき隣接1マスであり、複数マスは有限配列へ展開する。
2. 対象 object は文字列 id で識別し、座標・Sprite・Tween は port 実装だけが知る。
3. 歩行衝突は予約 port が判定し、予約できない場合は script を失敗させる。
4. event-command-runtime の完成済み core 契約を前提に、`movement` command を加算的に追加する。
5. 完成済み `codex/event-command-runtime-release` を依存として取り込み、production event runtime port から
   Phaser adapter を呼び出す。adapter は既存 NPC map、blocked set、Tween を再利用する。

## Tech Stack

- TypeScript strict / ES2022
- Vitest（Node環境、fake port による small unit test）
- 外部依存なし

## Commands

- Focused test: `pnpm exec vitest run tests/unit/mapObjectMovementRuntime.test.ts tests/unit/eventCommandRuntime.test.ts`
- Lint: `pnpm lint`
- Architecture: `pnpm check:architecture`
- Full test: `pnpm test`
- Content validation: `pnpm validate:content`
- Build: `pnpm build`
- Preview: `pnpm exec vite preview --host 127.0.0.1 --port 4175 --strictPort`

## Project Structure

- `src/core/events/mapObjectMovementRuntime.ts`: Phaser 非依存のコマンド、状態、port、実行器
- `src/core/events/contracts.ts`: event-command-runtime の `movement` command と port 契約
- `src/core/events/runtime.ts`: `movement` command の逐次dispatch
- `src/scenes/overworld/mapObjectMovementPorts.ts`: 既存 Phaser NPC を movement port へ適合
- `src/scenes/overworld/eventRuntimePorts.ts`: scripted event から movement runtime を呼ぶproduction接続
- `tests/unit/mapObjectMovementRuntime.test.ts`: 状態、順序、中断、上限、予約、cleanup、完了契約
- `tests/unit/eventCommandRuntime.test.ts`: event runtime から movement port への接続
- `tests/unit/mapObjectMovementPorts.test.ts`: NPC検索、予約、移動、向き、表示、中断のScene adapter契約
- `tasks/map-object-movement-runtime-*.md`: spec、plan、進捗、review/walkthrough

## Code Style

```ts
const commands: readonly MapObjectMovementCommand[] = [
  { type: 'face', direction: 'up' },
  { type: 'walk', direction: 'up' },
  { type: 'wait', durationMs: 120 },
  { type: 'emote', emote: 'notice' },
];

await runMapObjectMovement('npc-guide', commands, ports, { signal });
```

- discriminated union と exhaustive `switch` を使う。
- runtime は Phaser、Scene、Sprite、Tween を import しない。
- timer と abort は runtime 内で有界化し、port Promise が signal を無視しても呼び出しPromiseをsettleする。
- `Math.random`、任意ジャンプ、ループ、call/return、変数評価は追加しない。

## Runtime Contract

### Commands

- `walk { direction }`: 予約を取得し、歩行Promiseを待ち、成功時だけ予約をcommitする。
- `face { direction }`: 向きを変更し、完了Promiseを待つ。
- `wait { durationMs }`: 有限の非負時間を待つ。
- `emote { emote }`: emote開始から表示完了まで待つ。
- `hide` / `show`: 可視状態変更の完了まで待つ。

### State

- `INIT`: 入力検証前の初期状態。
- `WAITING_FOR_READY`: port が対象を操作可能にするまで待つ。
- `STARTING_COMMAND`: 現在の command index と command を通知する。
- `WAITING_FOR_COMPLETION`: 対応する port Promise を待つ。
- `ADVANCING`: 完了済みstep数を更新し、次のcommandへ進む。
- `FINISHED`: cleanup 後の唯一の正常終了状態。

### Abort, Limits, and Errors

- caller の `AbortSignal` は開始前・準備中・各command待機中に有効。
- runtime は内部 AbortController を使い、timeout 時にportへも中断を通知する。
- default最大step数と最大経過時間を定数で持ち、optionでより小さい/大きい有限値へ変更できる。
- command数がstep上限を超える場合、port commandを1件も開始しない。
- timeout / abort / collision / invalid command / port error では後続commandを開始しない。
- active reservation は失敗時にreleaseし、成功時だけcommitする。
- cleanup は全終了経路でちょうど1回呼ぶ。

### Promise Completion

- resolve: 全commandが順に完了し、cleanupが完了した後に result を返す。
- reject: abort、timeout、blocked、invalid input、port error の理由をcleanup後に返す。
- port command Promise が未settleでも、abortまたはtimeoutでruntime Promiseはsettleする。

## Testing Strategy

- RED: runtime未実装のimport failureから開始する。
- GREEN: happy pathの順序と状態を最小実装で通す。
- 続くsliceで予約、abort、timeout、step limit、port error、cleanup onceを追加する。
- event runtime testで `movement` が前後command間にawaitされ、同じsignalをportへ渡すことを固定する。
- interactionだけでなく、最終result、予約のcommit/release、後続未実行をassertする。

## Boundaries

- Always: Phaser非依存、有限配列、AbortSignal、最大step/時間、cleanup、予約解放、単体テスト。
- Ask first: 新規依存、既存contentの一括移行、外部資格情報、保存schema変更。
- Never: `npcWander` へのscript責務混在、`Math.random`、無制限loop、汎用script VM、HeartGold固有データの複製。

## Success Criteria

- 6 command種を入力順に1件ずつ実行する。
- 指定された6状態が順序どおり観測できる。
- walkだけが予約を使い、成功commit / 失敗releaseになる。
- abort、timeout、step超過、衝突、port例外で後続を止め、cleanup後にrejectする。
- 未settle portでもabort/timeoutによりruntime Promiseがsettleする。
- event-command-runtimeの `movement` commandがtyped portへdispatchされる。
- `npcWander.ts` を変更しない。
- production area event が実在 NPC を id で選び、既存衝突判定を使ってmovement列を完了できる。
- scripted movement 中は wander と同じ NPC を二重に動かさず、終了後に操作可能状態へ戻す。
- focused testとリポジトリ必須検査が成功する。

## Open Questions

なし。実データ投入は別sliceとし、このsliceではproduction adapterをfixtureで検証する。
