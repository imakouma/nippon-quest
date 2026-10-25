# Field Effect Scope Tasks

## Task 1: Pure ownership scope

**Acceptance criteria:**

- [x] register/disposeがLIFOかつ一度だけ動く。
- [x] 外部abortと親scope終了が同じcleanup経路を使う。
- [x] guard済みcallbackはdispose後に無害化される。
- [x] cleanup例外が残りのcleanupを妨げない。

**Verification:** `pnpm exec vitest run tests/unit/effectScope.test.ts`

**Files:** `src/core/lifecycle/effectScope.ts`, `tests/unit/effectScope.test.ts`

## Task 2: Thin Phaser adapters

**Acceptance criteria:**

- [x] Tween、TimerEvent、ParticleEmitter、camera effect、DOM overlayを登録できる。
- [x] adapterは既存実体を返し、managerを再実装しない。

**Verification:** `pnpm exec vitest run tests/unit/phaserFieldEffectScope.test.ts`

**Files:** `src/scenes/overworld/phaserFieldEffectScope.ts`, `tests/unit/phaserFieldEffectScope.test.ts`

## Task 3: Field flow child scope

**Acceptance criteria:**

- [x] 各runが子scopeを受け取り、全終了経路で一度だけdisposeする。
- [x] 親scope終了でsignalがabortし、signalを無視するactionのrunもsettleする。
- [x] cleanup失敗後もinputをreleaseする。

**Verification:** `pnpm exec vitest run tests/unit/fieldFlowRuntime.test.ts`

**Files:** `src/scenes/overworld/fieldFlowRuntime.ts`, `tests/unit/fieldFlowRuntime.test.ts`

## Task 4: First production migration

**Acceptance criteria:**

- [x] field flowのDOM cleanupをscope登録へ移す。
- [x] map transitionのcamera effectをscope登録へ移す。
- [x] 既存transition契約を維持する。

**Verification:** `pnpm exec vitest run tests/unit/fieldFlowRuntime.test.ts tests/unit/mapTransitionPipeline.test.ts`

**Files:** `src/scenes/Overworld.ts`, `src/scenes/overworld/phaserMapTransitionPorts.ts`

## Task 5: Verification and handoff

**Acceptance criteria:**

- [x] `pnpm lint`
- [x] `pnpm check:architecture`
- [x] `pnpm test`
- [x] `pnpm validate:content`
- [x] `pnpm build`
- [x] 必要なfield E2Eと最新版previewを確認する。
- [x] Graphifyをcode-onlyで更新し、5軸レビューを完了する。
- [x] 専用ブランチへコミットする。

**Dependencies:** Tasks 1-4
