# Implementation Plan: Field Locomotion Integration

## Overview

Integrate the five approved field-locomotion modules in dependency order, keep the current user-owned UI and mini-map changes intact, and centralize only the required `Overworld` wiring in this branch.

## Architecture Decisions

- Keep deterministic locomotion state in `src/core/`; Phaser presentation and camera ownership stay under `src/rendering/` and `src/scenes/overworld/`.
- Preserve the 16 px grid, 160 ms step duration, collision/arrival/encounter/save ordering, camera fade/flash behavior, and existing keyboard/touch inputs.
- Resolve one contextual action in the scene and pass a presentational view model to Preact; do not duplicate target lookup in UI code.
- Add only action-button CSS. Existing mini-map DOM, selectors, layout, and behavior are invariants.
- No new dependencies, save fields, terrain IDs, interaction verbs, or external assets.

## Dependency Graph

`player-locomotion-runtime` → `player-motion-rendering` / `terrain-contact-effects` / `field-camera-controller` / `context-action-ui` → centralized `Overworld` wiring → full tests and browser verification.

Graphify's local code-only graph identifies `OverworldScene` as the primary integration hub and `movementDecision` plus `save()` as existing movement boundaries to preserve.

## Task List

1. Verify the five worker commits and their focused test results.
2. Cherry-pick locomotion runtime, run focused movement tests, and inspect its contract.
3. Cherry-pick motion rendering, run focused rendering tests, and reconcile its locomotion-state dependency.
4. Cherry-pick terrain effects, camera controller, and context action UI in order, running each focused suite.
5. Wire all modules through `Overworld.ts` without modifying mini-map markup or behavior.
6. Review the complete diff across correctness, readability, architecture, security, and performance.
7. Run lint, architecture, unit, content, build, and relevant Playwright checks.
8. Restart the canonical preview on `127.0.0.1:4174` and verify movement, collision, effects, camera, actions, keyboard parity, and mini-map stability.
9. Update Graphify after material changes and commit the integration branch without merge or push.

## Risks and Mitigations

| Risk                                       | Impact | Mitigation                                                                     |
| ------------------------------------------ | ------ | ------------------------------------------------------------------------------ |
| Worker contracts disagree                  | High   | Integrate in dependency order and adapt only at narrow module boundaries.      |
| User-owned UI changes are overwritten      | High   | Stage explicit task files only; compare mini-map DOM/CSS before and after.     |
| Arrival effects fire twice                 | High   | Keep one step-completed/foot-planted path and retain focused regression tests. |
| Camera ownership conflicts with fade/flash | Medium | Move follow/focus only; leave visual FX ownership unchanged.                   |
| Browser input parity regresses             | High   | Exercise keyboard and button paths against the same resolved callback.         |

## Open Questions

None. The user approved the specifications, implementation, and integration order.
