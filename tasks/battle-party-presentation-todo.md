# Battle Party Presentation Tasks

Source spec: `SPEC-battle-party-presentation.md`

## Task 1: Protagonist pixel-animation regression contract

**Description:** Add a focused test that proves the current translation-only idle is insufficient and
defines pixel-distinct frame, size, palette, transparency, appearance, and costume requirements.

**Acceptance criteria:**

- [x] Idle and action sequences require more than one distinct pixel grid.
- [x] Frames remain 24×32, transparent where expected, and within the NQ-48 palette.
- [x] Representative appearance combinations and every registered costume are covered.

**Verification:**

- [x] The new test fails before the frame implementation for the expected missing sequence.
- [x] `pnpm vitest run tests/unit/heroBattleAnimation.test.ts`

**Dependencies:** None

**Files likely touched:**

- `tests/unit/heroBattleAnimation.test.ts`

**Estimated scope:** Small

## Task 2: Costume-aware battle frame sequences

**Description:** Extend the existing generated protagonist battle sheet with the smallest useful set of
pixel-distinct idle and action frames, and expose named sequence metadata beside `BATTLE_POSE`.

**Acceptance criteria:**

- [x] Idle visibly changes body, hair, clothing, or stance pixels without relying on sprite translation.
- [x] Attack, hurt, knockout, and victory have explicit frame sequences.
- [x] All frames preserve selected appearance and equipped costume rendering.

**Verification:**

- [x] Task 1 passes.
- [x] `pnpm test:related src/rendering/characters.ts src/rendering/costumes.ts`

**Dependencies:** Task 1

**Files likely touched:**

- `src/rendering/characters.ts`
- `src/rendering/costumes.ts` only if an existing costume pose cannot express a required frame
- `tests/unit/heroBattleAnimation.test.ts`

**Estimated scope:** Medium

## Checkpoint: Frame source

- [x] Focused rendering tests pass.
- [x] Generated frames remain within the art and palette contract.
- [x] No fixed protagonist PNG is introduced into the runtime path.

## Task 3: Event-driven protagonist frame playback

**Description:** Add a small presentation helper that plays named protagonist frame sequences from the
existing battle event flow, alongside existing positional motion, and reliably restores or stops state.

**Acceptance criteria:**

- [x] Idle loops through pixel-distinct frames.
- [x] Normal attacks, skills, damage, knockout, and victory play the correct sequence.
- [x] Surviving actions return to idle; knockout and shutdown leave no active playback.

**Verification:**

- [x] `pnpm vitest run tests/unit/heroBattleAnimationRuntime.test.ts`
- [x] `pnpm test:related src/scenes/Battle.ts src/scenes/battle/eventAnimator.ts src/scenes/battle/heroAnimation.ts`

**Dependencies:** Task 2

**Files likely touched:**

- `src/scenes/battle/heroAnimation.ts`
- `src/scenes/Battle.ts`
- `src/scenes/battle/eventAnimator.ts`
- `tests/unit/heroBattleAnimationRuntime.test.ts`

**Estimated scope:** Medium

## Checkpoint: Runtime behavior

- [x] Focused rendering and runtime tests pass.
- [x] Existing positional attack variations still execute.
- [x] Presentation cleanup works during damage, knockout, and scene shutdown.

## Task 4: Browser verification and companion regression

**Description:** Verify the protagonist's real frame changes in the running battle and protect every
existing joined-companion surface from regression.

**Acceptance criteria:**

- [x] Browser checks observe multiple protagonist texture frames during idle and actions.
- [x] Protagonist frames remain in bounds at 960×540 and 844×390.
- [x] Recruitment, formation, companion sprite/status row, and swap UI remain functional and accessible.

**Verification:**

- [x] Run the protagonist E2E plus the story-companion and battle-recruitment regression flows.
- [x] Review protagonist and companion screenshots at both supported viewports.

**Dependencies:** Task 3

**Files likely touched:**

- `tests/e2e/hero-battle-animation.spec.ts`
- `tests/e2e/story-companion.spec.ts`
- `tests/e2e/battle.spec.ts` only if an existing companion assertion belongs there

**Estimated scope:** Medium

## Task 5: Full verification and walkthrough

**Description:** Run the complete quality gate, inspect the final diff, record runtime evidence, and open
the latest reproducible battle preview for review.

**Acceptance criteria:**

- [x] All repository checks pass with no new warnings attributable to this change.
- [x] The walkthrough records what changed, screenshots checked, and remaining risks.
- [x] The final diff contains no unrelated refactor, generated build output, or debug code.

**Verification:**

- [x] `pnpm lint`
- [x] `pnpm check:architecture`
- [x] `pnpm test`
- [x] `pnpm validate:content`
- [x] `pnpm build`
- [x] Real-browser verification on the latest preview

**Dependencies:** Task 4

**Files likely touched:**

- `docs/verification/battle-party-presentation/WALKTHROUGH.md`

**Estimated scope:** Small

## Checkpoint: Complete

- [x] Spec acceptance criteria and the project Definition of Done are satisfied.
- [x] Code review has no unresolved correctness, safety, accessibility, or performance findings.
- [ ] The user has reviewed the final preview before merge or deployment.
