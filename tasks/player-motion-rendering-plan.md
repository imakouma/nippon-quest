# Implementation Plan: Player Motion Rendering

## Overview

Implement the approved `player-motion-rendering` module without wiring `Overworld.ts`. The module will consume a structurally compatible locomotion presentation state, derive deterministic 3-frame poses, preserve the 24×32 hero/equipment pipeline, and expose a small Scene presenter for later integration.

## Architecture Decisions

- Keep progress-to-pose selection pure in `src/rendering/playerMotion.ts`; it imports only the shared character direction/frame helpers.
- Keep Phaser-facing mutation behind a narrow structural target contract in `src/scenes/overworld/playerMotionPresenter.ts`, so tests do not require a Scene and the later runtime can pass its state directly.
- Reuse the existing three walk frames. Motion detail is generated inside the existing 24×32 frames; NPC frames and `Overworld.ts` remain unchanged.

## Task List

### Phase 1: Pure motion contract

- [x] Add RED tests for progress boundaries, alternating feet, turn/bump feedback, integer offsets, and planted completion.
- [x] Implement the smallest pure pose selector that passes them.

### Checkpoint: Pure contract

- [x] `pnpm exec vitest run tests/unit/playerMotionRendering.test.ts` passes.

### Phase 2: Character frames and presenter

- [x] Add RED tests for 24×32 bounds, palette/transparency, restrained one-pixel follow-through, and equipment combinations.
- [x] Adjust only hero walk-frame generation and add the Scene presenter with texture-refresh coverage.

### Checkpoint: Module complete

- [x] Focused character and motion tests pass.
- [x] Focused lint/format, architecture, full unit tests, content validation, and build pass. Full-repository Prettier was stopped after prolonged scanning of unrelated files.
- [x] Diff review finds no mini-map, `Overworld.ts`, NPC-contract, or unrelated changes.

## Risks and Mitigations

| Risk                                                       | Impact | Mitigation                                                                                              |
| ---------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| Runtime module lands with a nominally different state type | Medium | Accept the approved state shape structurally and document the direct handoff.                           |
| Equipment art clips during motion                          | Medium | Keep deltas to one pixel and test every registered costume for size, bounds, palette, and transparency. |
| Presenter fights world-position tweening                   | High   | Require an explicit world anchor from the caller and apply only integer presentation offsets.           |

## Open Questions

None. `Overworld.ts` connection and browser capture are owned by the integration chat.
