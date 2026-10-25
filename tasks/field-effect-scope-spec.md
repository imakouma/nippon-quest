# Spec: Field Effect Scope

## Objective

フィールド演出が作る一時的な副作用を、明示的な scope が所有する。正常完了、キャンセル、
Scene shutdown、処理例外のどの経路でも、登録済み資源を一度だけ解放する。遅れて届く完了
callback は scope 終了後に状態を変更しない。

初回導入では pure な所有権契約と Phaser adapter を完成させ、既存の field flow が作る DOM
overlay cleanup と map transition の camera effect を scope 配下へ移す。既存の全演出を一括移行
せず、以後 Tween、Timer、particle を小単位で登録できる入口を用意する。

## Tech Stack

- TypeScript strict
- AbortController / AbortSignal
- Phaser 3.87 の既存 Tween、TimerEvent、ParticleEmitter、Camera API
- Vitest 4 の fake resource による単体テスト

新規依存は追加しない。

## Commands

- Focused test: `pnpm exec vitest run tests/unit/effectScope.test.ts tests/unit/fieldFlowRuntime.test.ts tests/unit/phaserFieldEffectScope.test.ts tests/unit/mapTransitionPipeline.test.ts`
- Lint: `pnpm lint`
- Architecture: `pnpm check:architecture`
- Full test: `pnpm test`
- Content validation: `pnpm validate:content`
- Build: `pnpm build`
- Preview: `pnpm nrd -- --port 4175 --strictPort`

## Project Structure

- `src/core/lifecycle/effectScope.ts`: Phaser・DOM非依存の所有権とライフサイクル契約
- `src/scenes/overworld/phaserFieldEffectScope.ts`: Phaser資源をscopeへ登録する薄いadapter
- `src/scenes/overworld/fieldFlowRuntime.ts`: 1 flowにつき子scopeを作る調停層
- `src/scenes/overworld/phaserMapTransitionPorts.ts`: camera effectの最初の移行先
- `tests/unit/`: fake resource、flow、adapter、transitionの回帰テスト

## Code Style

```ts
const scope = createEffectScope();
const timer = ownTimer(scope, scene.time.addEvent(config));
const complete = scope.guard(() => applyResult());

scope.dispose('cancelled');
```

- scopeは資源の作成方法を知らず、cleanup callbackだけを逆順で所有する。
- adapterはPhaser managerを包み直さず、既存資源を受け取って登録するだけにする。
- cleanupとguardはidempotentにし、終了後の登録は即時cleanupする。

## Testing Strategy

- pure scopeはfake disposerで、正常dispose、二重dispose、外部abort、子scope、例外を検証する。
- cleanup中に1件が失敗しても残りが解放されることを検証する。
- guardしたcallbackがdispose後に無害化されることを検証する。
- field flowは正常完了、キャンセル、Scene相当の親scope終了、action例外、遅延完了競合を検証する。
- Phaser adapterは構造的fake resourceで、各資源の停止・削除・破棄・resetが一度だけ起きることを検証する。
- map transitionはabort後の完了通知でrestartしない既存契約を維持する。

## Boundaries

- Always: cleanupを一度だけ実行し、AbortSignalを先にabortしてから資源を解放する。
- Always: cleanup失敗を報告しても、残りの資源解放とinput releaseを継続する。
- Ask first: `questions/contracts.ts`、schema、保存形式、依存パッケージの変更。
- Never: Phaser manager全体の再実装、`src/core`からPhaser/DOMへの依存、既存全演出の一括移行。

## Success Criteria

- `register`、`dispose`、子scope、AbortSignal連携、idempotent cleanupがpure coreで動く。
- scope終了後にguard済みcallbackを呼んでも、ゲーム状態へ副作用を出さない。
- field flowの正常完了、キャンセル、親scope終了、例外の全経路で同じ子scopeが一度だけcleanupされる。
- Tween、TimerEvent、ParticleEmitter、camera effect、DOM overlayを既存実体のまま登録できる。
- map transitionのcamera effectとfield flowのDOM cleanupが新scopeを実際に使う。
- 必須検査と対象E2E、最新版preview確認が成功する。

## Open Questions

なし。通常の実装判断は委任時に承認済み。
