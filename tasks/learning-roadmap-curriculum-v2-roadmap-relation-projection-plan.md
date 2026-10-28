# Implementation Plan: roadmap-relation-projection

## Status and sources of truth

- Capability module: `roadmap-relation-projection`
- Approved specification: `SPEC-roadmap-relation-projection.md`
- Capability map: `CAPABILITY_MAP-learning-roadmap-curriculum-v2.md`
- Baseline: `8dfff95c3e0bb65502648bcec38c0c3862552da1`
- Upstream dependency: `unit-progress-normalization`
- Phase: 2 — technical implementation plan only
- Task tracking: this module-specific plan contains the ordered implementation checklist. Per explicit instruction, `tasks/plan.md`, `tasks/todo.md`, and a Phase 3 todo file are not changed.

Human approval is required before Phase 3 implementation begins.

## Overview

Add one pure Core projector that converts concept-level curriculum relations into deterministic Unit-level prerequisite and supporting-link maps. It will reuse the approved `canonicalUnitId()` behavior and existing `RoadmapNode['supportingLinks']` DTO, keep `prerequisite` as the only hard-lock relation, remove duplicate display lines, and guarantee an acyclic projected display graph without mutating inputs.

The implementation remains deliberately isolated. It creates the projection contract and dedicated tests only; later `roadmap-view-model` integration will supply displayed Unit IDs and consume the returned maps.

## Scope

### Implementation targets

- `src/core/learning/roadmapRelations.ts`
- `tests/unit/roadmapRelations.test.ts`

### Explicit non-targets

- `src/scenes/overworld/roadmap.ts`
- `src/shared/menuModel.ts`
- `src/core/learning/index.ts`
- `src/ui/**`, Scene code, layout, visibility, node-state, or practice selection
- `src/core/learning/model.ts`, question contracts, curriculum JSON, schemas, or generated files
- GameState, migrations, `roadmapSnapshot.ts`, persistence, reward code, or reward markers
- `tasks/plan.md`, `tasks/todo.md`, and any Phase 3 todo file

No new dependency, configuration, content, text, or public barrel export is required.

## Dependency graph and implementation order

```text
unit-progress-normalization implementation
  └─ canonicalUnitId(current | legacy-question | raw-legacy)
       └─ Dependency gate
            └─ Slice 1: hard prerequisite projection
                 └─ Slice 2: non-lock supporting projection
                      └─ Slice 3: cycle safety + determinism + immutability
                           └─ Focused verification + one atomic implementation commit
                                ├─ roadmap-view-model integration (outside this module)
                                └─ adaptive-roadmap-practice integration (outside this module)
```

The slices are sequential because each extends the same projection function and test fixture. Do not parallelize them or edit the same two files from multiple worktrees.

## Architecture decisions

1. Import `canonicalUnitId()` directly from `src/core/learning/unitAliases.ts`; do not copy alias maps or accept a second normalization callback.
2. Accept a `ReadonlySet<string>` of displayed Unit IDs. A normalized endpoint outside the set is unresolved and ignored.
3. Reuse `CurriculumGraph` as the input contract and derive the supporting-link item type from the existing `RoadmapNode['supportingLinks']` DTO with type-only imports.
4. Return two fresh, readonly-typed maps keyed by target Unit: prerequisite source IDs and supporting links.
5. Build a concept-to-Unit lookup once, excluding misconception concepts and unresolved Units before relation projection.
6. Normalize every candidate into a directed Unit pair and stably sort before deduplication or cycle decisions. Input array order is never a tie-breaker.
7. Process every prerequisite edge before supporting edges. A projected hard cycle throws a descriptive error; no prerequisite is silently removed.
8. For one directed Unit pair, prerequisite wins. Otherwise, supporting kinds use the approved priority `component → transfer → related → chronological`.
9. Add supporting candidates in stable order and skip only a candidate that would close a cycle in the combined graph.
10. Keep output creation read-only: no GameState, reward, clock, random, DOM, Phaser, Preact, storage, or network dependency.

## RED/GREEN/REFACTOR policy

Each slice follows the same local loop:

1. Add the smallest failing test for that slice and run the dedicated test file to confirm RED for the intended reason.
2. Add the minimum production logic to make that test and all earlier cases GREEN.
3. Refactor only duplication introduced in the two owned files; rerun the dedicated tests.
4. Do not commit a RED-only intermediate state. After all checkpoints pass, create one logical implementation commit as required by the capability map.

Synthetic fixture concepts and relations are preferred over editing curriculum JSON. Current production data contains `related` and `transfer`, so `component`, `chronological`, overlaps, and cycles require explicit unit fixtures.

## Task list

### Task 0: Upstream dependency gate

**Description:** Confirm that the integrated Wave 1 implementation, not the base-only version, makes `canonicalUnitId()` map current, legacy-question, and raw-legacy IDs to the same current Unit ID. Stop before editing if the dependency is absent or its approved contract changed.

**Acceptance criteria:**

- [ ] `canonicalUnitId('sansu.g1.tashizan')` stays current.
- [ ] `canonicalUnitId('sansu.g1.legacy-math-1-2')` resolves to `sansu.g1.tashizan`.
- [ ] `canonicalUnitId('math_1_2')` resolves to `sansu.g1.tashizan`.
- [ ] No fallback alias table is added to `roadmapRelations.ts`.

**Verification:**

- [ ] `pnpm vitest run tests/unit/unitProgress.test.ts`
- [ ] Inspect `git diff -- src/core/learning/unitAliases.ts` and confirm this module has not modified the dependency-owned file.

**Dependencies:** Integrated `unit-progress-normalization` implementation.

**Files likely touched:** None by this task.

**Estimated scope:** XS, read-only gate.

### Slice 1: Project normalized prerequisite edges

**Description:** Establish the public projection shape and the complete hard-edge path: resolve concept endpoints through `canonicalUnitId()`, restrict them to displayed Units, ignore invalid display candidates, collapse concept duplicates to Unit pairs, and return stable prerequisite arrays.

**Acceptance criteria:**

- [ ] Current, legacy-question, and raw-legacy concept Units converge to the same displayed Unit edge.
- [ ] Missing concepts, misconception concepts, unresolved Units, same-Unit relations, and unsupported kinds do not create prerequisite output.
- [ ] Repeated concept-level prerequisite relations collapse to one directed Unit edge, with target keys and source arrays sorted.
- [ ] The result contains no supporting links yet and changes no input object.

**RED tests first:**

- [ ] One fixture proves three accepted Unit-ID forms converge.
- [ ] One table-driven fixture covers missing, misconception, unresolved, self, and unsupported-kind filtering.
- [ ] One duplicate fixture proves stable Unit-level prerequisite output.

**Verification:**

- [ ] RED observed with `pnpm vitest run tests/unit/roadmapRelations.test.ts` before production code.
- [ ] GREEN with `pnpm vitest run tests/unit/roadmapRelations.test.ts` after minimal implementation.

**Dependencies:** Task 0.

**Files likely touched:**

- `src/core/learning/roadmapRelations.ts`
- `tests/unit/roadmapRelations.test.ts`

**Estimated scope:** S, 2 files.

### Checkpoint A: Hard-edge contract

- [ ] Dedicated tests pass.
- [ ] Only `prerequisite` appears in `prerequisiteIdsByTarget`.
- [ ] No Scene, UI, DTO, schema, save, reward, or curriculum file changed.
- [ ] `git diff --check` passes.

### Slice 2: Add non-lock supporting projection and overlap precedence

**Description:** Project the four approved guidance kinds into the existing `{ sourceId, kind }` DTO while proving they cannot affect hard-lock output. Apply prerequisite dominance, supporting-kind priority, pair deduplication, and stable ordering.

**Acceptance criteria:**

- [ ] `component`, `transfer`, `related`, and `chronological` each produce a supporting link and never a prerequisite.
- [ ] A prerequisite/supporting overlap emits only the prerequisite line.
- [ ] Multiple supporting kinds for one directed Unit pair emit one line using `component → transfer → related → chronological`.
- [ ] Duplicate concept relations and shuffled relation order yield the same sorted supporting output.

**RED tests first:**

- [ ] A parameterized test covers all four supporting kinds.
- [ ] One overlap fixture covers prerequisite dominance.
- [ ] One cross-kind fixture covers every priority tier and pair-level deduplication.

**Verification:**

- [ ] RED observed with `pnpm vitest run tests/unit/roadmapRelations.test.ts` before the supporting implementation.
- [ ] GREEN with the same command after minimal implementation.

**Dependencies:** Slice 1 and Checkpoint A.

**Files likely touched:**

- `src/core/learning/roadmapRelations.ts`
- `tests/unit/roadmapRelations.test.ts`

**Estimated scope:** S, 2 files.

### Checkpoint B: Hard/non-lock separation

- [ ] Dedicated tests pass.
- [ ] Supporting kinds cannot be observed in the prerequisite map.
- [ ] Every directed Unit pair has at most one visible output line.
- [ ] Type-only use of `RoadmapNode['supportingLinks']` passes the architecture boundary.
- [ ] `git diff --check` passes.

### Slice 3: Enforce cycle safety, permutation stability, and input immutability

**Description:** Complete the graph safety contract by rejecting hard cycles, pruning only cycle-closing supporting candidates after all hard edges, and proving stable output and unmodified inputs on success and error paths.

**Acceptance criteria:**

- [ ] A projected prerequisite cycle throws a descriptive error containing the involved Unit IDs.
- [ ] A reciprocal or longer supporting cycle retains the deterministic acyclic subset and never removes a prerequisite.
- [ ] Multiple permutations of concepts and relations produce equivalent normalized map entries.
- [ ] Frozen/snapshotted graph and displayed-Unit inputs remain unchanged after success and hard-cycle error paths.
- [ ] A test helper independently verifies the combined returned graph has no cycles or duplicate Unit pairs.

**RED tests first:**

- [ ] One hard-only cycle fixture proves explicit failure.
- [ ] One hard-plus-supporting fixture proves supporting pruning cannot displace hard edges.
- [ ] One reciprocal and one 3-node supporting cycle fixture prove stable pruning.
- [ ] One permutation/immutability test covers repeated calls and both outcomes.

**Verification:**

- [ ] RED observed with `pnpm vitest run tests/unit/roadmapRelations.test.ts` before cycle logic.
- [ ] GREEN with the same command after minimal cycle logic.
- [ ] `pnpm test:related src/core/learning/roadmapRelations.ts tests/unit/roadmapRelations.test.ts`
- [ ] `pnpm check:fast`

**Dependencies:** Slice 2 and Checkpoint B.

**Files likely touched:**

- `src/core/learning/roadmapRelations.ts`
- `tests/unit/roadmapRelations.test.ts`

**Estimated scope:** S, 2 files.

### Checkpoint C: Module completion

- [ ] All specification success criteria are represented by dedicated tests.
- [ ] Focused, related, and fast verification pass.
- [ ] `git diff --check` and the staged secret scan pass.
- [ ] Only the two owned implementation files are staged.
- [ ] No `graphify-out/`, `dist/`, `test-results/`, generated schema, or manifest file is staged.
- [ ] One atomic implementation commit is ready for the integration owner.

## Focused verification matrix

| Concern                         | Evidence                      | Command                                                                                       |
| ------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------- |
| Upstream ID contract            | Wave 1 canonicalization tests | `pnpm vitest run tests/unit/unitProgress.test.ts`                                             |
| Projection behavior             | Dedicated unit suite          | `pnpm vitest run tests/unit/roadmapRelations.test.ts`                                         |
| Directly affected tests         | Vitest related selection      | `pnpm test:related src/core/learning/roadmapRelations.ts tests/unit/roadmapRelations.test.ts` |
| Type/import/format/architecture | Fast repository gate          | `pnpm check:fast`                                                                             |
| Patch hygiene                   | Whitespace and scope          | `git diff --check`, `git status --short`                                                      |

Do not run `pnpm check:full`, `pnpm test`, or `pnpm build` from this parallel worktree. The integration owner runs complete gates once after combining the wave.

## Reward and v13 save invariants

- The projector must not import `GameState`, `learningRewards`, `roadmapSnapshot`, migrations, save, or persistence modules.
- Existing mastery reward remains `n >= 3 && value >= 0.8`; existing correction reward remains one fragment per three distinct full-score corrections.
- Relation projection never reads or writes `masteredRewardUnits`, `correctedRewardQuestionIds`, inventory, dex, attempts, concept states, regional progress, or snapshot counters.
- No field, cache, schema version, migration, or serialization change is introduced.
- Because the function receives curriculum data plus displayed Unit IDs only, representative v13 saves remain byte-for-byte unaffected by this module.
- Integration verification of import → answer → save → reload belongs to the integration owner after view-model and answer-path wiring.

## Risks and mitigations

| Risk                                                                                      | Impact | Mitigation                                                                                                                        |
| ----------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Implementation starts from base `canonicalUnitId()` before Wave 1 adds raw legacy support | High   | Make Task 0 a hard gate; merge the approved Wave 1 implementation first and never add a local alias workaround.                   |
| Unit normalization collapses an acyclic concept graph into a hard Unit cycle              | High   | Detect after normalization and throw with Unit IDs; never drop a prerequisite.                                                    |
| Supporting cycles make layout recursion unstable                                          | High   | Add hard edges first, pre-sort supporting candidates, and skip only cycle-closing candidates; verify reciprocal and 3-node cases. |
| Hard and supporting relations render coincident duplicate lines                           | Medium | Deduplicate by directed Unit pair with unconditional prerequisite dominance.                                                      |
| Multiple supporting kinds for one pair produce input-order-dependent output               | Medium | Apply the approved fixed priority before pair selection and test shuffled input.                                                  |
| Core becomes coupled to the full UI implementation                                        | Medium | Use only a type-level reference to the existing neutral shared DTO; do not import Preact, UI components, or Scene code.           |
| Output maps or arrays share mutable input references                                      | Medium | Allocate fresh maps/arrays and run frozen/snapshot input tests on success and error paths.                                        |
| Current real data does not exercise all four kinds                                        | Medium | Use focused synthetic fixtures; do not edit curriculum JSON to manufacture coverage.                                              |
| A full gate collides with parallel worktrees                                              | Medium | Run only dedicated, related, and `check:fast`; reserve complete gates for the integration owner.                                  |

## Integration-owner handoff

The implementation agent reports the branch, commit ID, changed files, RED/GREEN evidence, focused commands, and results. The handoff must state that `src/core/learning/index.ts` was intentionally not edited.

Integration order and responsibilities:

1. Integrate the approved `unit-progress-normalization` implementation first.
2. Cherry-pick the single `roadmap-relation-projection` implementation commit.
3. Rerun `tests/unit/unitProgress.test.ts` and `tests/unit/roadmapRelations.test.ts` together.
4. Have `roadmap-view-model` construct the displayed canonical Unit-ID set and direct-import `projectRoadmapRelations` until the integration owner chooses the barrel-export point.
5. Feed only `prerequisiteIdsByTarget` into lock evaluation; pass `supportingLinksByTarget` to presentation/layout without gating practice, subjects, or game progress.
6. Keep save/reward paths unchanged and verify representative v13 saves during the integrated product gate.
7. After the wave is combined, update the local code-only Graphify graph and run affected queries for `roadmapRelations.ts`, `roadmap.ts`, and `menuModel.ts`.
8. Run the integration-owned complete checks and browser preview from the integrated branch, not this worktree.

## Final checkpoint and approval gate

Before Phase 3 starts, a human reviews this plan and confirms the three sequential slices, the two-file ownership boundary, and the handoff order. After Phase 3 implementation, stop after the atomic module commit and handoff; do not wire Scene/UI or merge into the shared branch from this worktree.

## Open questions

None. The upstream normalizer, supporting-kind priority, overlap precedence, hard-cycle error, supporting-cycle pruning, file ownership, verification scope, and integration handoff are fixed by the approved specification and capability map.
