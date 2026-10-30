# Implementation Plan: Battle Party Presentation

## Overview

Replace the protagonist's translation-only battle idle with real pixel-frame animation and extend that
same frame-driven presentation through attacks, damage, knockout, and victory. Preserve every appearance
and equipment combination. Companion art continues to reuse the completed monster animation sheets,
while the existing recruitment, formation, status, and swap UI is protected by regression tests.

The approved source of truth is `SPEC-battle-party-presentation.md`.

## Architecture Decisions

- Keep `src/rendering/characters.ts` as the single source of customizable protagonist pixels. Do not use
  the fixed protagonist reference PNG at runtime.
- Export named frame sequences beside `BATTLE_POSE` so rendering tests and the battle scene share one
  contract for idle, attack, hurt, knockout, and victory.
- Add a small battle presentation helper under `src/scenes/battle/` that plays those frame sequences.
  Existing `BattleEvent` handling remains the state owner; no second battle or animation state machine is
  introduced.
- Keep positional motion helpers (`walk`, `hopTo`, tweened return) for stage movement, but combine them
  with pixel-changing frame sequences. Translation alone never satisfies an animation state.
- Do not change companion data or UI contracts. A companion continues to use the same monster animation
  sheet as its enemy form, flipped and presented in the ally layout with ally-specific status and swap UI.
- Do not modify field movement, NPCs, save data, schemas, dependencies, or question contracts.

## Dependency Graph

```text
Customizable hero pixel frames (`characters.ts`)
  → named battle frame sequences
    → hero battle frame player (`scenes/battle/`)
      → `Battle.ts` and `eventAnimator.ts` integration
        → protagonist browser verification
        → companion UI regression verification
          → full release gate and walkthrough
```

## Task List

### Phase 1: Frame contract

- [x] Task 1: Add a failing protagonist pixel-animation contract.
- [x] Task 2: Generate costume-aware, pixel-distinct battle frame sequences.

### Checkpoint: Frame source

- [x] Idle and action sequences contain multiple pixel-distinct frames.
- [x] Representative appearance combinations and every costume stay within 24×32 and the NQ-48 palette.
- [x] Focused unit tests pass.

### Phase 2: Battle integration

- [x] Task 3: Play protagonist frames from existing battle events and motion paths.

### Checkpoint: Runtime behavior

- [x] Idle changes pixels instead of only moving the sprite.
- [x] Normal attacks, skills, damage, knockout, and victory select and finish the correct sequence.
- [x] Surviving actions return to idle and interrupted animations leave no timer or tween running.

### Phase 3: Party regression and delivery

- [x] Task 4: Verify protagonist animation and joined-companion UI in a real browser.
- [x] Task 5: Run the full gate and record the walkthrough.

### Checkpoint: Complete

- [x] All acceptance criteria in `SPEC-battle-party-presentation.md` are met.
- [x] Recruitment, bag/formation, companion battle status, animation, and swap UI still work.
- [x] `pnpm lint`, `pnpm check:architecture`, `pnpm test`, `pnpm validate:content`, and `pnpm build` pass.
- [x] The latest preview is opened at the reproducible battle verification route.
- [x] The change is ready for code review and user approval before merge or deployment.

## Verification Checkpoints

1. After Tasks 1–2: run the focused rendering tests and inspect generated frame grids.
2. After Task 3: run related unit tests and a focused protagonist battle E2E.
3. After Task 4: run companion/recruitment E2E at 960×540 and 844×390 and inspect screenshots.
4. After Task 5: run the repository's complete integration gate and real-browser verification.

## Risks and Mitigations

| Risk                                                            | Impact | Mitigation                                                                                                         |
| --------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| New frames drop appearance or costume details                   | High   | Generate every frame through the existing `Look` and `CostumeArt` pipeline; test all costumes.                     |
| Frame playback races with movement, damage, or scene shutdown   | High   | Keep playback in the presentation runtime, cancel on state transition/shutdown, and test return-to-idle.           |
| More frames increase texture memory or startup work             | Medium | Reuse the existing per-look sheet and add only the smallest useful set of frames; measure the built asset/runtime. |
| Narrow layouts clip attack or victory poses                     | Medium | Verify sprite bounds at both 960×540 and 844×390.                                                                  |
| Companion display regresses while shared animation paths change | Medium | Keep companion code unchanged where possible and run recruitment, status, swap, and battle-sprite E2E.             |

## Open Questions

None. The user approved real pixel-frame animation for the protagonist in battle only and confirmed the
existing companion presentation model.
