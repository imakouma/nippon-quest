# Remaining character animations implementation plan

Specification: [`SPEC-remaining-runtime-monsters.md`](../SPEC-remaining-runtime-monsters.md)

## Goal

Produce, register, and verify character-specific 4×2 battle animation sheets for the frozen 53-monster target set. Completion means all 542 runtime monsters resolve to exactly one animation without changing gameplay data, the battle API, or the established playback contract.

This task uses dedicated plan files because `tasks/plan.md` and `tasks/todo.md` contain unrelated unfinished problem-UI audit work and must remain untouched.

## Smallest complete approach

- Reuse the existing `MONSTER_DESIGNS` art as the identity source and the existing `batch-*` manifest glob as the runtime integration point.
- Add `batch-06`; do not change `src/rendering/monsterAnimation.ts` unless a failing contract proves the current glob cannot load it.
- Reuse `normalize-sheet.ts`, `image-contract.ts`, the production ledger format, and the contact-sheet renderer. Extend them only where their current hard-coded `batch-01` paths prevent `batch-06` use.
- Use the built-in image generator once per monster in reference/edit mode. Do not add an external provider, dependency, schema, or generic asset pipeline.
- Accept generated sheets in six fixed waves. An asset remains outside the manifest until its visual review and automated checks pass.

## Dependency graph

```text
frozen 53-ID set + existing MONSTER_DESIGNS
  → failing exact-coverage and batch-06 contracts
  → transparent reference export + batch-selectable existing production tools
  → six generated/reviewed/accepted waves
  → 542-of-542 reconciliation + contact sheet
  → browser playback + full repository gates + preview
```

## Phase 1: Lock the missing-coverage contract (RED)

1. Add a focused unit contract in `tests/unit/remainingCharacterAnimations.test.ts` that derives runtime monster IDs from the same content source used by the current coverage test.
2. Assert the frozen 53-ID difference, exact `batch-06` membership, global uniqueness, and final 542-of-542 resolution through `monsterAnimationSpec`.
3. Update `tests/unit/animationBatchManifests.test.ts` only where the existing five-batch/489 assertions must become six-batch/542 assertions after completion; preserve its assignment and PNG signature checks.
4. Record the intended RED failure: `batch-06/manifest.json` and 53 accepted sheets do not yet exist.

Checkpoint: the focused test fails only for missing batch-06 production output, not because of imports, data drift, or a mismatched target list.

## Phase 2: Reuse and minimally generalize production tooling (GREEN foundation)

1. Add the smallest browser-backed reference export command under `scripts/animation-production/` only if no existing route can export `designedMonsterArt(id)` as a transparent PNG. Test exact requested IDs, transparent RGBA output, and deterministic dimensions.
2. Parameterize the existing production audit, acceptance, ledger, normalization, and contact-sheet entrypoints only where `batch-01` or the old verification directory is hard-coded. Keep defaults compatible with batch-01.
3. Store batch-06 references, prompts, accepted generated sources, hashes, reviews, and contact sheet under `docs/verification/animation-completion/remaining-runtime-monsters/`.
4. Add focused failure tests in `tests/unit/animationProductionTools.test.ts` for any new option parsing or batch-path selection before implementation.

Checkpoint: existing batch-01 audits remain green, an empty batch-06 ledger accepts exactly the frozen target set, and `pnpm check:fast` passes.

## Phase 3: Produce and accept six fixed waves

Wave membership is frozen in [`remaining-character-animations-todo.md`](remaining-character-animations-todo.md). Each wave follows the same vertical slice:

1. Export and inspect the repository reference for every wave ID.
2. Write a character-specific prompt that names signature anatomy/props plus distinct idle and attack actions.
3. Generate one 4×2 source per monster with the built-in image generator.
4. Inspect the full sheet and all eight isolated cells. Reject identity drift, count changes, cropping, text/grid/background, fake alpha, or transform-only motion.
5. Normalize accepted output to 512×256 RGBA, run the existing image contract, then write the ledger and manifest record.
6. Run the wave-focused unit/image checks plus desktop and landscape-mobile battle playback before moving to the next wave.

Checkpoint after every wave: only accepted IDs appear in the manifest; reference/source/runtime hashes match; focused tests, production audit, `pnpm check:fast`, `git diff --check`, and staged-diff review pass.

## Phase 4: Reconcile complete coverage

1. Require exactly 53 unique batch-06 entries and 542 unique runtime animations including Ringoron.
2. Require the set difference between content monsters and animation specs to be empty.
3. Generate and review the all-53 contact sheet; keep representative desktop/mobile screenshots rather than 106 redundant screenshots.
4. Run every new ID through the bounded E2E battle loop with ID-specific failure reporting for load, idle, attack, recovery, KO, and visible bounds.
5. Run `pnpm gen:manifest` and review only generator-owned catalog changes.

Checkpoint: zero missing/duplicate IDs, all 53 image contracts green, and both browser viewports green.

## Phase 5: Quality gate and handoff

1. Run `pnpm lint`, `pnpm check:architecture`, `pnpm test`, `pnpm validate:content`, and `pnpm build`.
2. Apply the required five-axis `code-review-and-quality` review and resolve all required findings.
3. Update Graphify in local code-only mode if source or test dependency edges changed; skip regeneration when the diff is assets/manifests/docs only.
4. Commit the approved implementation in reviewable wave commits, then provide the integration branch, commit IDs, exact coverage count, and command results.
5. Start a fresh preview from this branch on an unused worktree port and open a newly animated monster battle. Port 4174 remains reserved for the integrated production branch.

The integration owner reruns `pnpm check:full` once after merge and then refreshes the canonical 4174 preview.

## Expected change surface

- `SPEC-remaining-runtime-monsters.md`
- `tasks/remaining-character-animations-plan.md`
- `tasks/remaining-character-animations-todo.md`
- `assets/sprites/animations/batch-06/manifest.json`
- `assets/sprites/animations/batch-06/<id>-v1.png` for 53 IDs
- `docs/verification/animation-completion/remaining-runtime-monsters/`
- `tests/unit/remainingCharacterAnimations.test.ts`
- `tests/unit/animationBatchManifests.test.ts`
- existing animation-production scripts/tests only where batch-selectable paths are missing
- one bounded `tests/e2e/animation-batch-06.spec.ts`
- generated catalogs only through `pnpm gen:manifest`

## Risks and mitigations

| Risk                                                       | Impact | Mitigation                                                                                                               |
| ---------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| A generated sheet changes character identity or prop count | High   | Use exported repository art as the reference, enumerate signature parts, and inspect isolated cells before registration. |
| Generic wobble passes as animation                         | High   | Reuse internal-pixel/shape-difference audits and require distinct character-specific idle and contact poses.             |
| Hard-coded batch-01 tooling corrupts prior production      | High   | Add batch/path parameters with batch-01-compatible defaults and focused regression tests before using batch-06.          |
| 53 assets make omissions hard to notice                    | High   | Freeze exact wave membership, assert set equality, and report failures by ID.                                            |
| Generated binaries inflate or obscure review               | Medium | Commit only accepted sources/runtime outputs and hash-linked review evidence; keep waves small and atomic.               |
| Browser verification becomes slow or flaky                 | Medium | Use one bounded data-driven suite, preserve per-ID diagnostics, and commit only representative screenshots.              |
| Another chat's unfinished plan is overwritten              | High   | Keep this work in dedicated plan/todo files and the isolated worktree/branch.                                            |

## Non-goals

- Redesigning characters or replacing accepted batch-01 through batch-05 sheets.
- Changing battle timing, stats, encounters, save data, content schemas, frame layout, or public animation APIs.
- Adding configurable animation styles, a new provider abstraction, or an external AI credential.
- Merging, pushing, or updating the canonical 4174 preview before implementation and integration verification are complete.
