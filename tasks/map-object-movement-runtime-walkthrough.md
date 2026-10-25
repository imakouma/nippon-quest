# Walkthrough: Map Object Movement Runtime

## Outcome

- Phaser / Preact 非依存の `mapObjectMovementRuntime` を `src/core/events/` に追加した。
- `walk` / `face` / `wait` / `emote` / `hide` / `show` を有限配列として逐次実行する。
- 実行状態を `INIT` → `WAITING_FOR_READY` → `STARTING_COMMAND` →
  `WAITING_FOR_COMPLETION` → `ADVANCING` → `FINISHED` として通知できる。
- walk は reservation port を経由し、成功時だけ commit、失敗・中断時は release する。
- AbortSignal、最大 step 数、最大実行時間、port 例外、cleanup 例外を扱い、外側 Promise を必ず settle する。
- field event command に `movement` を追加し、同じ AbortSignal を movement port へ渡して完了を待つ。
- content schema と生成済み JSON Schema に6種類の movement command を反映した。
- production field event runtimeを統合し、既存NPC map / blocked set / Phaser Tweenへmovement portを接続した。
- 移動先を先行予約し、Tweenが中間点を越えた時点でoccupancyを移し、失敗・中断時は見た目とoccupancyを復元する。
- Phaser実体を使うE2Eで scripted eventから1マス移動し、完了後に入力ロックが解放されることを確認した。
- `npcWander.ts` は変更していない。

## TDD Evidence

- runtime module 未実装で focused test が失敗する RED を確認した。
- event runtime が `movement` を unknown command として拒否する RED を確認した。
- production adapter module未実装とmovement port未接続のREDを確認した。
- `isBlocked` 判定を意図的に反転するmutationでadapterの3テストが失敗することを確認し、直ちに復元した。
- step-limit 条件を意図的に反転する mutation で10テストの失敗を確認し、直ちに復元した。
- review 中に pre-aborted signal と事前 validation が重なると未処理 rejection が残るケースを再現し、
  operation ごとの abort race と開始直後の abort check で修正した。

## Review

- Correctness: 逐次 await、予約 commit/release、abort/timeout、cleanup-once、AggregateError を確認した。
- Readability: command/state を discriminated union にし、汎用 VM や loop opcode は導入していない。
- Architecture: core は Phaser / Preact / Scene を importせず、Scene 予算と依存境界を維持した。
- Security: 外部コンテンツは Zod schema で command 種類・方向・待機時間・配列長を制限する。
- Performance: command 配列は最大64件、既定30秒で打ち切り、無制限反復を持たない。

## Verification

- `pnpm lint`
- `pnpm check:architecture`
- `pnpm test` — 144 files / 1523 tests passed
- `pnpm validate:content`
- `pnpm build`
- focused movement tests — 5 files / 38 tests passed
- Playwright scripted event regression — 3 passed（movement、報酬/flag、battle→warp）
- Graphify code-only graph updated — 42651 nodes / 51435 links
- `127.0.0.1:4179` の production previewでタイトル画面を確認し、browser error / warn は0件。確認後に停止した。

## Integration Boundary

production adapterまで統合済み。実コンテンツへのmovement command配置は教材・演出設計を伴うためこのsliceには含めず、
E2E fixtureで実行経路を検証した。`npcWander` は用途とライフサイクルが異なるため、別機構のまま維持する。
