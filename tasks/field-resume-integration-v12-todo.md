# Field resume snapshot v12 tasks

## Task 1: Save contract and migration

- [x] v12 schema adds only stable field snapshot data.
- [x] v0 through v11 migrate to v12 without losing progress.
- [x] save/load and JSON serialization round-trip the snapshot.
- Verify: focused state and persistence Vitest tests.

## Task 2: Pure snapshot resolver

- [x] Capture only unique `persistState: true` objects.
- [x] Preserve player/object facing and object visibility.
- [x] Ignore deleted, duplicate, invalid, out-of-range, and blocked object state.
- [x] Fall back deleted maps to a safe current-area/default map.
- Verify: `tests/unit/fieldResumeSnapshot.test.ts` fails first, then passes.

## Checkpoint: Foundation

- [x] Focused unit tests pass.
- [x] Typecheck and architecture boundaries remain valid.

## Task 3: Runtime integration

- [x] Normal load and JSON import use the common resume request.
- [x] Map transition and battle start/return/defeat checkpoint or restore through the common runtime.
- [x] Existing event/movement/interaction/encounter boundaries remain authoritative.
- Verify: focused runtime unit suites pass.

## Task 4: Browser flow

- [x] Save → reload → continue restores player and opt-in object state.
- [x] JSON import with a deleted map falls back safely.
- [x] Existing field, transition, event, battle, movement, effect, and encounter E2E regressions pass.
- Verify: dedicated and regression Playwright specs.

## Checkpoint: Complete

- [x] `pnpm lint`
- [x] `pnpm check:architecture`
- [x] `pnpm test`
- [x] `pnpm validate:content`
- [x] `pnpm build`
- [x] Graphify code-only graph updated.
- [x] Preview on a non-conflicting port has no console errors.
- [x] Five-axis self-review has no required findings.
- [x] Changes committed on the dedicated branch.
