# Battle presentation runtime tasks

## Task 1: Runtime contract tests

**Acceptance criteria:**

- [x] 順序、cancel、port failure、二重完了、shutdown、skip のテストが現行コードで失敗する。

**Verification:**

- [x] `pnpm exec vitest run tests/unit/battlePresentationRuntime.test.ts`

**Dependencies:** None

**Files likely touched:**

- `tests/unit/battlePresentationRuntime.test.ts`

**Estimated scope:** Small

## Task 2: Presentation runtime

**Acceptance criteria:**

- [x] BattleEvent を型付き command へ変換する。
- [x] queue、active task、cancel/cleanup、fast-forward が契約どおり動く。
- [x] Phaser 非依存である。

**Verification:**

- [x] focused unit test が通る。

**Dependencies:** Task 1

**Files likely touched:**

- `src/scenes/battle/presentationRuntime.ts`
- `src/scenes/battle/eventPlayback.ts`
- `tests/unit/battlePresentationRuntime.test.ts`

**Estimated scope:** Medium

## Checkpoint: Runtime

- [x] focused unit test が通る。
- [x] TypeScript が通る。

## Task 3: Battle Scene integration

**Acceptance criteria:**

- [x] Battle.ts の独自 playing/chain/play を削除する。
- [x] shutdown と error recovery が runtime cleanup を通る。

**Verification:**

- [x] `pnpm exec vitest run tests/unit/battleUi.test.ts tests/unit/battlePresentationRuntime.test.ts`

**Dependencies:** Task 2

**Files likely touched:**

- `src/scenes/Battle.ts`
- `src/scenes/battle/presentationRuntime.ts`

**Estimated scope:** Medium

## Task 4: Event animator extraction

**Acceptance criteria:**

- [x] BattleEvent の視覚演出が隣接 port 実装へ移る。
- [x] Battle.ts が 1,730 行未満になる（1,579 行）。
- [x] 既存 animation diagnostic entry point を維持する。

**Verification:**

- [x] battle unit test、typecheck、battle E2E が通る。

**Dependencies:** Task 3

**Files likely touched:**

- `src/scenes/Battle.ts`
- `src/scenes/battle/eventAnimator.ts`

**Estimated scope:** Medium

## Checkpoint: Integration

- [x] battle unit/E2E が通る。
- [x] Battle.ts の責務と行数が減る。

## Task 5: Full verification and review

**Acceptance criteria:**

- [ ] 必須5検査、preview、五軸レビューが完了する。
- [ ] Graphify code-only graph が更新される。
- [ ] walkthrough とコミット情報を残す。

**Verification:**

- [ ] `pnpm lint`
- [ ] `pnpm check:architecture`
- [ ] `pnpm test`
- [ ] `pnpm validate:content`
- [ ] `pnpm build`

**Dependencies:** Task 4

**Files likely touched:**

- `tasks/battle-presentation-runtime-walkthrough.md`
- `graphify-out/` (gitignored)

**Estimated scope:** Small
