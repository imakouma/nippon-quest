# Unit Progress Normalization — Implementation Tasks

## Status and source of truth

- Module: `unit-progress-normalization`
- Approved spec: `SPEC-unit-progress-normalization.md`
- Approved plan: `tasks/learning-roadmap-curriculum-v2-unit-progress-normalization-plan.md`
- Capability map: `CAPABILITY_MAP-learning-roadmap-curriculum-v2.md`
- Implementation branch: `codex/lr-v2-unit-progress`
- Wave: 1
- This file is the only task list for this module. Do not edit the unrelated `tasks/todo.md`.

## Wave start conditions

- [ ] The human has approved this Phase 3 task breakdown before implementation starts.
- [ ] The branch is `codex/lr-v2-unit-progress`, based on the approved Phase 1–3 documentation commits, and `git status --short --branch` is clean.
- [ ] No other chat is editing `src/core/learning/unitAliases.ts`, `unitProgress.ts`, `learningRewards.ts`, `tests/unit/unitProgress.test.ts`, or `tests/unit/learningRewards.test.ts`.
- [ ] `graphify-out/graph.json` exists from `graphify extract . --code-only --no-cluster`; semantic labeling and external LLM backends remain unused.
- [ ] `graphify query "canonicalUnitId applyLearningRewards roadmap mergedMastery callers" --budget 7000` and affected checks still show the expected alias, roadmap, reward, and `askEnv` boundaries.
- [ ] No other module commit is required before Wave 1. Do not cherry-pick recommendation, relation, view-model, UI, or content-pilot work into this branch.
- [ ] Wave 2 modules may begin only after the final Agent 1 implementation commit is integrated and the integration owner passes the focused normalization/reward checkpoint.

## Ownership guard

### Agent 1 may change

- `src/core/learning/unitAliases.ts`
- `src/core/learning/unitProgress.ts`
- `src/core/learning/learningRewards.ts`
- `tests/unit/unitProgress.test.ts`
- `tests/unit/learningRewards.test.ts`

### Agent 1 must not change

- `src/scenes/overworld/roadmap.ts`
- `src/shared/menuModel.ts`
- `src/core/learning/index.ts`
- `src/core/progression/learningRewards.ts`
- `src/scenes/shared/askEnv.ts`
- GameState schema, schemaVersion, migrations, `roadmapSnapshot.ts`
- Question contracts, battle selection, content, UI, Scene, or other agents' files

If an owned-file collision or a need to edit an unowned file appears, stop implementation and return to Ask first. Do not expand scope inside a task.

## Task 1: RED — Canonical unit ID forms

**Description:** Add the smallest table-driven test that fixes the accepted current, legacy question, raw legacy roadmap, and unknown unit ID behavior before changing production code.

**Acceptance criteria:**

- [ ] The test expects current ID passthrough and both legacy forms to resolve to `sansu.g1.tashizan`.
- [ ] The test expects an unmapped ID to remain unchanged and does not mutate either alias map.
- [ ] The focused run fails specifically because raw `math_1_2` is not yet canonicalized; existing cases do not regress.

**Verification:**

- [ ] Run `pnpm vitest run tests/unit/unitProgress.test.ts` and record the expected non-zero RED result for the raw legacy case.
- [ ] Run `git diff --check`.

**Dependencies:** Wave start conditions

**Files likely touched:**

- `tests/unit/unitProgress.test.ts`

**Estimated scope:** XS — 1 file, one focused session

## Task 2: GREEN — Extend `canonicalUnitId()` minimally

**Description:** Make the RED contract pass by resolving raw legacy roadmap node IDs through the existing alias tables without changing any existing target or adding a new identity source.

**Acceptance criteria:**

- [ ] `canonicalUnitId()` resolves current, legacy question, and raw legacy forms deterministically while preserving unknown IDs.
- [ ] Existing `LEGACY_UNIT_ALIASES` and `LEGACY_QUESTION_UNIT_ALIASES` entries and targets remain unchanged.
- [ ] The implementation adds no recursion, migration, dependency, mutation, or unrelated cleanup.

**Verification:**

- [ ] Run `pnpm vitest run tests/unit/unitProgress.test.ts`.
- [ ] Run `pnpm test:related src/core/learning/unitAliases.ts tests/unit/unitProgress.test.ts`.
- [ ] Run `git diff --check`.

**Dependencies:** Task 1

**Files likely touched:**

- `src/core/learning/unitAliases.ts`
- `tests/unit/unitProgress.test.ts`

**Estimated scope:** Small — 2 files, one focused session

## Checkpoint 1: Canonical ID foundation

- [ ] Tasks 1–2 acceptance criteria are complete.
- [ ] The RED failure was observed before the GREEN implementation.
- [ ] Focused and related tests pass after Task 2.
- [ ] Graphify-identified direct consumers in coverage, graph quality, and roadmap have not been edited.
- [ ] Only Task 1–2 owned files are modified.

## Task 3: RED — Alias-aware mastery aggregation

**Description:** Extend the unit-progress test with the existing roadmap aggregation formula, legacy/current/mixed equivalence, edge cases, and input immutability before adding the new aggregation module.

**Acceptance criteria:**

- [ ] Fixtures cover empty, current-only, legacy-only, raw legacy, mixed split, unknown, multiple units, and `n === 0` weighting.
- [ ] Expected results use `max(1, n)` weighted `value`, summed `n`, and maximum `lastAt`; duplicate-looking mixed records remain additive.
- [ ] The test snapshots or deep-compares inputs before and after and fails because `aggregateUnitMastery()` is not implemented, not because fixtures are invalid.

**Verification:**

- [ ] Run `pnpm vitest run tests/unit/unitProgress.test.ts` and record the expected non-zero RED result for the missing aggregation contract.
- [ ] Run `git diff --check`.

**Dependencies:** Checkpoint 1

**Files likely touched:**

- `tests/unit/unitProgress.test.ts`

**Estimated scope:** Small — 1 file, one focused session

## Task 4: GREEN — Implement pure mastery aggregation

**Description:** Add the smallest pure `aggregateUnitMastery()` implementation that canonicalizes keys and reproduces the roadmap formula without importing GameState, Scene, UI, or Question engine implementations.

**Acceptance criteria:**

- [ ] Output is keyed by canonical unit ID, preserves unknown units, and exactly matches the approved weighted formula.
- [ ] Legacy-only, current-only, and logically equivalent mixed-split fixtures return identical records; duplicate-looking records remain additive.
- [ ] Inputs and nested records remain unchanged, and returned records do not expose shared mutable input objects.

**Verification:**

- [ ] Run `pnpm vitest run tests/unit/unitProgress.test.ts`.
- [ ] Run `pnpm test:related src/core/learning/unitAliases.ts src/core/learning/unitProgress.ts tests/unit/unitProgress.test.ts`.
- [ ] Run `git diff --check`.

**Dependencies:** Task 3

**Files likely touched:**

- `src/core/learning/unitProgress.ts`
- `tests/unit/unitProgress.test.ts`

**Estimated scope:** Small — 2 files, one focused session

## Checkpoint 2: Progress aggregation foundation

- [ ] Tasks 3–4 acceptance criteria are complete.
- [ ] The RED failure was observed before the GREEN implementation.
- [ ] Focused and related tests pass after Task 4.
- [ ] The aggregation formula matches current `roadmap.ts` behavior and introduces no second alias table.
- [ ] Inputs remain immutable in every legacy/current/mixed fixture.

## Task 5: RED — Canonical reward idempotency and regressions

**Description:** Point the dedicated reward test at the new Core learning module and add failing behavior tests for alias-crossed mastery/markers, v13 state preservation, existing correction rewards, and repeated application.

**Acceptance criteria:**

- [ ] Legacy/current/mixed mastery and marker combinations prove one mastery reward maximum, canonical marker convergence, and no increase after state re-entry.
- [ ] A current v13 `createNewGame()` fixture keeps `schemaVersion`, mastery keys, attempts, progress, recent, mistakes, and unrelated markers unchanged.
- [ ] Existing threshold, correction-every-three, exact-score, duplicate-question, simultaneous-two-reward, inventory, and dex expectations remain covered.

**Verification:**

- [ ] Run `pnpm vitest run tests/unit/learningRewards.test.ts` and record the expected non-zero RED result for the missing Core learning reward module or alias behavior.
- [ ] Run `git diff --check`.

**Dependencies:** Checkpoint 2

**Files likely touched:**

- `tests/unit/learningRewards.test.ts`

**Estimated scope:** Small — 1 file, one focused session

## Task 6: GREEN — Implement canonical, idempotent learning rewards

**Description:** Add the Core learning reward module with the existing public contract, using canonical aggregated mastery and touched-unit marker normalization while preserving correction, inventory, and dex behavior.

**Acceptance criteria:**

- [ ] Mastery remains exactly `n >= 3 && value >= 0.8`, and all alias-crossed mastery/marker cases award a canonical unit at most once.
- [ ] Only the touched marker equivalence class is normalized to one canonical ID; no mastery key, schema, v13 field, or unrelated state is changed.
- [ ] Existing correction reward, simultaneous two-reward, inventory saturation, dex registration, reasons, and state-identity behavior pass unchanged.

**Verification:**

- [ ] Run `pnpm vitest run tests/unit/unitProgress.test.ts tests/unit/learningRewards.test.ts`.
- [ ] Run `pnpm test:related src/core/learning/unitAliases.ts src/core/learning/unitProgress.ts src/core/learning/learningRewards.ts tests/unit/unitProgress.test.ts tests/unit/learningRewards.test.ts`.
- [ ] Run `git diff --check`.

**Dependencies:** Task 5

**Files likely touched:**

- `src/core/learning/learningRewards.ts`
- `tests/unit/learningRewards.test.ts`

**Estimated scope:** Small — 2 files, one focused session

## Checkpoint 3: Reward behavior complete

- [ ] Tasks 5–6 acceptance criteria are complete.
- [ ] The RED failure was observed before the GREEN implementation.
- [ ] Legacy/current/mixed and repeated-state tests prove idempotency.
- [ ] The v13 fixture and input-immutability assertions pass.
- [ ] Existing reward thresholds, correction rewards, inventory, dex, and reason ordering remain unchanged.

## Task 7: Focused regression and architecture gate

**Description:** Run the module and neighboring regression gates without editing production callers, battle selection, save schema, roadmap, content, or UI.

**Acceptance criteria:**

- [ ] Unit progress and learning reward suites pass with no skipped or disabled tests, and related tests find no owned-file regression.
- [ ] Existing question selection still passes its 7割弱点／3割復習 contract, and `askEnv` integration tests remain green.
- [ ] v13 migration/state tests and `pnpm check:fast` pass without schema, architecture, lint, or app-typecheck changes.

**Verification:**

- [ ] Run `pnpm vitest run tests/unit/unitProgress.test.ts tests/unit/learningRewards.test.ts`.
- [ ] Run `pnpm vitest run tests/unit/questions.test.ts tests/unit/askEnv.test.ts`.
- [ ] Run `pnpm vitest run tests/unit/state.test.ts`.
- [ ] Run `pnpm test:related src/core/learning/unitAliases.ts src/core/learning/unitProgress.ts src/core/learning/learningRewards.ts tests/unit/unitProgress.test.ts tests/unit/learningRewards.test.ts`.
- [ ] Run `pnpm check:fast`.

**Dependencies:** Checkpoint 3

**Files likely touched:** None

**Estimated scope:** Small — verification-only, one focused session

## Task 8: Atomic implementation commit and handoff package

**Description:** Review the complete owned-file diff, create one logical implementation commit, and prepare the exact integration-owner handoff without merging, pushing, or editing unowned files.

**Acceptance criteria:**

- [ ] The staged diff contains only the five approved owned files as applicable and excludes `graphify-out/`, generated output, formatting-only changes, and secrets.
- [ ] One descriptive implementation commit records alias normalization, aggregation, reward idempotency, and their tests; the worktree is clean afterward.
- [ ] Handoff reports branch, commit ID, files, RED/GREEN evidence, focused commands, v13/battle/input regression results, and integration-owner actions.

**Verification:**

- [ ] Run `git diff --check`.
- [ ] Run `git diff --cached --check`.
- [ ] Run `git diff --cached --name-status` and confirm only approved owned files are staged.
- [ ] Run `git diff --cached | rg -ni 'password|api[_-]?key|secret|token'` and confirm no sensitive value is present.
- [ ] After commit, run `git status --short --branch` and confirm a clean worktree.

**Dependencies:** Task 7

**Files likely touched:** None beyond the Task 1–6 files being staged

**Estimated scope:** XS — review/commit/handoff, one focused session

## Checkpoint 4: Agent 1 ready for integration

- [ ] Tasks 1–8 are complete in dependency order.
- [ ] Every behavior change has recorded RED evidence followed by GREEN evidence.
- [ ] The Agent 1 implementation is one logical commit on `codex/lr-v2-unit-progress`.
- [ ] Focused, related, battle-selection, v13 state, and `check:fast` commands pass.
- [ ] The worktree is clean and no shared branch was merged or pushed.

## Integration-owner handoff checklist

- [ ] Cherry-pick the Agent 1 implementation commit only after confirming no ownership conflict.
- [ ] Prefer changing `src/core/progression/learningRewards.ts` to a compatibility re-export of `src/core/learning/learningRewards.ts`, preserving all current caller import paths.
- [ ] Replace the local mastery merge in `src/scenes/overworld/roadmap.ts` with `aggregateUnitMastery()` and verify displayed progress is unchanged for canonical saves.
- [ ] Add a `src/core/learning/index.ts` export only if downstream modules require the barrel; direct imports are otherwise valid.
- [ ] Run existing reward, `askEnv`, roadmap, level-cap, bag, notice, question-selection, and state suites after wiring.
- [ ] Verify representative legacy-only, current-only, and mixed v13 saves through import → answer → save → reload without duplicated rewards, lost inventory/dex, changed mastery keys, or regional rollback.
- [ ] Run `pnpm check:full` once on the integrated branch before Wave 2 begins.
- [ ] Update the code-only Graphify graph after material integration and keep `graphify-out/` uncommitted.

## Downstream module start conditions

- [ ] `learning-recommendation-policy` and `roadmap-relation-projection` consume the integrated Agent 1 commit, not an unmerged worktree.
- [ ] Their branches begin from the integration commit that passed the focused normalization/reward checkpoint.
- [ ] Downstream agents use the canonical progress contract through direct imports or the integration-owner export and do not recreate alias or aggregation logic.

## Final clean and commit conditions

- [ ] No unresolved question, TODO placeholder, disabled test, temporary log, or dead compatibility implementation remains in Agent 1-owned files.
- [ ] No save migration, schema version, reward threshold, battle selection, content, UI, Scene, roadmap, menu model, or barrel file changed in the Agent 1 commit.
- [ ] `git status --short --branch` is clean after the implementation commit.
- [ ] The handoff clearly states that production wiring and full integrated verification remain owned by the integration owner.

## Open questions

None. The approved spec and plan define all task behavior, dependency, ownership, regression, and integration decisions required to start implementation after this todo is approved.
