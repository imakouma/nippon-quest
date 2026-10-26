# Player Motion Rendering Tasks

## Task 1: Deterministic pose selection

**Acceptance criteria:**

- [x] Normalized step progress selects the planted frame at both boundaries and the requested lead foot between them.
- [x] Turn and bump states are visually distinct with integer offsets no greater than one pixel.
- [x] Consecutive `a`/`b` lead-foot states select opposite frames.

**Verification:**

- [x] `pnpm exec vitest run tests/unit/playerMotionRendering.test.ts`

**Dependencies:** None

**Files likely touched:** `src/rendering/playerMotion.ts`, `tests/unit/playerMotionRendering.test.ts`

## Task 2: Hero-frame follow-through and presentation

**Acceptance criteria:**

- [x] Existing 24×32 hero frames retain palette/transparency invariants for every registered costume.
- [x] Step frames move upper body, arms, hair, and equipment by at most one pixel while keeping idle/completion planted.
- [x] Presenter applies the correct frame after a texture change and keeps the shadow on the world anchor.

**Verification:**

- [x] `pnpm exec vitest run tests/unit/characters.test.ts tests/unit/playerMotionRendering.test.ts`
- [x] Project verification commands pass except the full-repository Prettier scan, which was stopped after prolonged unrelated-file scanning; all owned files pass ESLint and Prettier.

**Dependencies:** Task 1

**Files likely touched:** `src/rendering/characters.ts`, `src/scenes/overworld/playerMotionPresenter.ts`, focused unit tests

## Checkpoint: Complete

- [x] All module acceptance criteria are met.
- [x] Final diff is limited to the player-motion rendering module, tests, and this plan.
