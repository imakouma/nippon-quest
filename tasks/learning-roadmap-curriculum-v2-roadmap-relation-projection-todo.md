# roadmap-relation-projection Phase 3 todo

## Authority and fixed scope

- Approved specification: `SPEC-roadmap-relation-projection.md`
- Approved plan: `tasks/learning-roadmap-curriculum-v2-roadmap-relation-projection-plan.md`
- Capability module: `roadmap-relation-projection`
- Upstream dependency: `unit-progress-normalization`
- Owned implementation: `src/core/learning/roadmapRelations.ts`
- Owned test: `tests/unit/roadmapRelations.test.ts`
- Implementation order is strictly sequential. Do not run these tasks from multiple worktrees against the same files.
- Every behavior slice starts with its RED test task. Do not combine a RED task with its following implementation task, and do not commit a RED-only state.
- Do not edit `src/core/learning/index.ts`, `src/scenes/overworld/roadmap.ts`, `src/shared/menuModel.ts`, `src/ui/**`, curriculum content, schemas, generated files, GameState, save/migrations, rewards, battle selection, `tasks/plan.md`, or `tasks/todo.md`.

## Wave start conditions

- [ ] A human has approved the Phase 1 specification and Phase 2 plan.
- [ ] The approved implementation commit from `unit-progress-normalization` has been integrated before this module starts. The current spec/plan-only head of `codex/lr-v2-unit-progress` is not sufficient.
- [ ] That dependency commit makes `canonicalUnitId()` accept current, legacy-question, and raw-legacy Unit IDs and passes `tests/unit/unitProgress.test.ts`.
- [ ] The implementation branch starts clean, records its base commit, and contains no unrelated staged or unstaged change.
- [ ] If any condition fails, stop before Task 1. Do not add a local alias table or modify dependency-owned files as a workaround.

## Dependency order

```text
Task 0: Wave 1 dependency gate
  -> Task 1: RED — normalized prerequisite projection
  -> Task 2: GREEN — normalized prerequisite projection
  -> Checkpoint A
  -> Task 3: RED — supporting projection and overlap precedence
  -> Task 4: GREEN — supporting projection and overlap precedence
  -> Checkpoint B
  -> Task 5: RED — cycle safety, determinism, and input invariance
  -> Task 6: GREEN — cycle safety, determinism, and input invariance
  -> Checkpoint C
  -> Task 7: regression gates, atomic commit, and handoff
```

## Task 0: Verify the Wave 1 normalizer dependency

**Description:** In one read-only session, prove that the implementation branch contains the approved `unit-progress-normalization` implementation before any projector test or source file is created. The gate must distinguish the implemented dependency from the existing spec/plan-only branch state.

**Acceptance criteria:**

- [ ] `canonicalUnitId()` maps `sansu.g1.tashizan`, `sansu.g1.legacy-math-1-2`, and `math_1_2` to `sansu.g1.tashizan` as specified.
- [ ] The focused upstream suite passes, and the dependency implementation commit ID is recorded in the implementation handoff notes.
- [ ] This module has no diff in `src/core/learning/unitAliases.ts` or `tests/unit/unitProgress.test.ts`.

**Verification:**

```bash
pnpm vitest run tests/unit/unitProgress.test.ts
git diff -- src/core/learning/unitAliases.ts tests/unit/unitProgress.test.ts
git status --short --branch
```

**Dependencies:** Approved `unit-progress-normalization` implementation commit integrated by the integration owner.

**Files likely touched:** None.

**Estimated scope:** XS — read-only gate, one focused session.

## Task 1: RED — specify normalized prerequisite projection

**Description:** Create the dedicated test file and express the complete hard-edge contract before production code exists. Synthetic fixtures must cover canonical endpoint normalization, filtering, Unit-level deduplication, stable output ordering, and fresh non-mutating results.

**Acceptance criteria:**

- [ ] Tests require current, legacy-question, and raw-legacy concept Unit IDs to converge to one displayed prerequisite edge.
- [ ] Tests require missing/misconception/unresolved/same-Unit endpoints and unsupported relation kinds to produce no hard edge.
- [ ] Tests require duplicate prerequisite concept relations to collapse into sorted target/source entries and fail for the intended missing projector behavior.

**Verification:**

```bash
pnpm vitest run tests/unit/roadmapRelations.test.ts
```

Expected result: RED for the new projector contract, not for fixture construction, syntax, or unrelated tests.

**Dependencies:** Task 0.

**Files likely touched:**

- `tests/unit/roadmapRelations.test.ts`

**Estimated scope:** S — 1 file, one focused test-authoring session.

## Task 2: GREEN — implement normalized prerequisite projection

**Description:** Add the smallest pure Core projector that satisfies Task 1. It must import `canonicalUnitId()` directly, use displayed Unit IDs as the resolution boundary, emit only prerequisites in the hard map, return fresh sorted collections, and avoid all Scene, UI, state, save, reward, and battle dependencies.

**Acceptance criteria:**

- [ ] `projectRoadmapRelations()` returns the approved two-map shape and satisfies every Task 1 filter, normalization, deduplication, and ordering assertion.
- [ ] Only `prerequisite` enters `prerequisiteIdsByTarget`; supporting output remains empty until its later slice.
- [ ] Inputs are not mutated, no local alias table is introduced, and the dedicated suite is GREEN.

**Verification:**

```bash
pnpm vitest run tests/unit/roadmapRelations.test.ts
git diff --check -- src/core/learning/roadmapRelations.ts tests/unit/roadmapRelations.test.ts
```

**Dependencies:** Task 1 RED observed for the intended reason.

**Files likely touched:**

- `src/core/learning/roadmapRelations.ts`

**Estimated scope:** S — 1 production file, one focused implementation session.

## Checkpoint A: Hard-edge contract after Tasks 0–2

- [ ] `pnpm vitest run tests/unit/unitProgress.test.ts tests/unit/roadmapRelations.test.ts` passes.
- [ ] Only `prerequisite` can appear in `prerequisiteIdsByTarget`.
- [ ] `git diff --name-only` lists only the two owned implementation-phase files.
- [ ] No commit is created yet; the working state is GREEN and ready for the next RED task.

## Task 3: RED — specify supporting links and pair precedence

**Description:** Extend only the dedicated tests to define the four non-lock supporting kinds, prerequisite dominance, fixed supporting-kind priority, directed-pair deduplication, and stable ordering. These tests must demonstrate that guidance cannot leak into the hard-lock map.

**Acceptance criteria:**

- [ ] Parameterized tests require `component`, `transfer`, `related`, and `chronological` to emit `{ sourceId, kind }` links and never prerequisites.
- [ ] Overlap tests require prerequisite to win over every supporting kind and require `component → transfer → related → chronological` for supporting-only pair conflicts.
- [ ] Duplicate and shuffled relation fixtures require one visible line per directed Unit pair in stable order and are RED for missing supporting behavior.

**Verification:**

```bash
pnpm vitest run tests/unit/roadmapRelations.test.ts
```

Expected result: existing prerequisite tests remain GREEN while the new supporting assertions are RED for the intended reason.

**Dependencies:** Task 2 and Checkpoint A.

**Files likely touched:**

- `tests/unit/roadmapRelations.test.ts`

**Estimated scope:** S — 1 file, one focused test-authoring session.

## Task 4: GREEN — implement supporting links and pair precedence

**Description:** Extend the projector minimally to satisfy Task 3. Resolve and sort supporting candidates independently from hard locks, remove any pair already represented by a prerequisite, select the approved kind by fixed priority, and emit the existing shared supporting-link DTO without importing UI implementation code.

**Acceptance criteria:**

- [ ] All four supporting kinds project into `supportingLinksByTarget` and cannot influence `prerequisiteIdsByTarget`.
- [ ] Every directed Unit pair emits at most one line, with prerequisite dominance and the approved supporting priority independent of input order.
- [ ] Task 1–4 dedicated tests are GREEN and architecture remains Core-safe through type-only shared DTO usage.

**Verification:**

```bash
pnpm vitest run tests/unit/roadmapRelations.test.ts
pnpm check:architecture
git diff --check -- src/core/learning/roadmapRelations.ts tests/unit/roadmapRelations.test.ts
```

**Dependencies:** Task 3 RED observed for the intended reason.

**Files likely touched:**

- `src/core/learning/roadmapRelations.ts`

**Estimated scope:** S — 1 production file, one focused implementation session.

## Checkpoint B: Hard/non-lock separation after Tasks 3–4

- [ ] `pnpm vitest run tests/unit/roadmapRelations.test.ts` passes.
- [ ] Supporting relations are absent from the prerequisite map and therefore cannot lock a Unit, subject, practice action, or game progression.
- [ ] Every directed Unit pair has at most one returned display line.
- [ ] `git diff --name-only` still lists only the two owned files; no reward, save, battle, Scene, UI, DTO, or content file changed.

## Task 5: RED — specify cycle safety, deterministic output, and input invariance

**Description:** Extend only the dedicated tests with independent graph assertions. Cover descriptive hard-cycle rejection, stable supporting-cycle pruning after all hard edges, permutation-equivalent output, repeated-call freshness, and unchanged frozen/snapshotted inputs on success and error paths.

**Acceptance criteria:**

- [ ] Tests require a projected prerequisite cycle to throw with involved Unit IDs and require reciprocal/three-node supporting cycles to retain only the deterministic acyclic subset without removing hard edges.
- [ ] Tests require shuffled concepts/relations and repeated calls to produce equivalent sorted entries with freshly allocated maps/arrays.
- [ ] Tests deep-freeze or snapshot the graph and displayed Unit set, prove success/error input invariance, and independently reject duplicate pairs or cycles; new assertions are RED for missing cycle behavior.

**Verification:**

```bash
pnpm vitest run tests/unit/roadmapRelations.test.ts
```

Expected result: all earlier projection tests remain GREEN while the new hard-cycle/supporting-cycle assertions are RED for the intended reason.

**Dependencies:** Task 4 and Checkpoint B.

**Files likely touched:**

- `tests/unit/roadmapRelations.test.ts`

**Estimated scope:** S — 1 file, one focused test-authoring session.

## Task 6: GREEN — implement cycle safety and deterministic pruning

**Description:** Add the minimum private graph helpers needed to satisfy Task 5. Process all deduplicated hard edges first and throw on a hard cycle; then consider supporting candidates in approved kind/source/target order and skip only the edge that would close a combined directed cycle. Preserve fresh outputs and immutable inputs on both return and throw paths.

**Acceptance criteria:**

- [ ] Projected hard cycles fail descriptively without dropping a prerequisite, while supporting cycles are pruned deterministically after hard edges are fixed.
- [ ] Equivalent input permutations return equivalent acyclic, duplicate-free maps and no input reference is reused as output storage.
- [ ] The complete dedicated suite is GREEN without adding a generic graph framework, state dependency, random/clock tie-breaker, or file outside module ownership.

**Verification:**

```bash
pnpm vitest run tests/unit/roadmapRelations.test.ts
pnpm test:related src/core/learning/roadmapRelations.ts tests/unit/roadmapRelations.test.ts
git diff --check -- src/core/learning/roadmapRelations.ts tests/unit/roadmapRelations.test.ts
```

**Dependencies:** Task 5 RED observed for the intended reason.

**Files likely touched:**

- `src/core/learning/roadmapRelations.ts`

**Estimated scope:** S — 1 production file, one focused implementation session.

## Checkpoint C: Projection completion after Tasks 5–6

- [ ] `pnpm vitest run tests/unit/unitProgress.test.ts tests/unit/roadmapRelations.test.ts` passes.
- [ ] The combined returned graph is acyclic and duplicate-free; hard cycles throw and supporting cycles prune according to the fixed policy.
- [ ] Success and error paths leave the curriculum graph and displayed Unit set unchanged.
- [ ] Repeated and permuted inputs produce equivalent sorted output, with no random, clock, or input insertion-order dependency.

## Task 7: Run regression gates, create the atomic commit, and hand off

**Description:** In one final session, verify the module and explicitly prove that untouched reward, v13 save/grandfathering, and battle-question selection behavior still pass. Review the patch for ownership and secrets, create exactly one implementation commit containing only the two owned files, confirm a clean worktree, and prepare the integration-owner handoff.

**Acceptance criteria:**

- [ ] Projector, upstream normalization, reward thresholds/correction cadence, v13 save/grandfathered progress, battle-question selection, related tests, and `check:fast` all pass without edits to those regression owners.
- [ ] One atomic commit contains only `src/core/learning/roadmapRelations.ts` and `tests/unit/roadmapRelations.test.ts`; no generated or ownership-external file is staged.
- [ ] The handoff reports branch, base, upstream dependency commit, implementation commit, changed files, RED/GREEN evidence, exact command results, intentional non-targets, and a clean status.

**Verification:**

```bash
pnpm vitest run tests/unit/unitProgress.test.ts tests/unit/roadmapRelations.test.ts tests/unit/learningRewards.test.ts tests/unit/state.test.ts tests/unit/battleQuestionQueries.test.ts
pnpm test:related src/core/learning/roadmapRelations.ts tests/unit/roadmapRelations.test.ts
pnpm check:fast
git diff --check
git diff --name-only
git status --short
```

Staging and commit checks:

```bash
git add src/core/learning/roadmapRelations.ts tests/unit/roadmapRelations.test.ts
git diff --cached --check
git diff --cached --name-only
git diff --cached -- src/core/learning/roadmapRelations.ts tests/unit/roadmapRelations.test.ts | rg -n '(A[P]I_KEY|S[E]CRET|T[O]KEN|P[A]SSWORD|PRIVATE K[E]Y)'
git commit -m "feat: project roadmap relations"
git status --short --branch
```

The secret scan is successful when it prints no match; its expected process status is 1 in that case. The final status must contain only the branch header and no changed path.

**Dependencies:** Task 6 and Checkpoint C.

**Files likely touched:** None beyond staging and committing the two already-owned files.

**Estimated scope:** S — verification, review, one atomic commit, and handoff in one focused session.

## Required regression invariants

- [ ] Reward behavior remains owned by `learningRewards.ts`: mastery awards once at `n >= 3` and mastery `>= 0.80`; one correction fragment is awarded per three distinct full-score corrections. The projector neither imports nor mutates reward state.
- [ ] Save compatibility remains v13: no GameState field, schema version, migration, serialized cache, reward marker, or roadmap snapshot counter changes. Grandfathered mastery remains open and projection/viewing cannot write save state.
- [ ] Battle question selection remains owned by battle query/flow modules. Relation kinds, projected edges, and roadmap locks do not alter skill, grade, tag, recruitment, or Musubi-dama question selection.
- [ ] Input invariance is tested on both success and hard-cycle error paths: graph objects, nested arrays/objects, and the displayed Unit set remain unchanged; every output collection is freshly allocated.

## Integration-owner handoff checklist

- [ ] Integrate the approved `unit-progress-normalization` implementation before cherry-picking the projector commit.
- [ ] Cherry-pick the single projector implementation commit; do not reconstruct its changes manually.
- [ ] Keep `src/core/learning/index.ts` unchanged in this module. The integration owner decides whether and where a barrel export is needed.
- [ ] Have roadmap/view-model ownership construct the canonical displayed Unit-ID set and consume the projector; this module does not edit `roadmap.ts`, `menuModel.ts`, layout, or UI.
- [ ] Feed only `prerequisiteIdsByTarget` into lock evaluation. Pass `supportingLinksByTarget` only to presentation/layout; never to subject, practice, reward, battle, or game-progress gates.
- [ ] Run the combined Wave tests for unit normalization and relation projection, then the integration-owned complete gates and canonical `127.0.0.1:4174` preview from the integrated branch.
- [ ] Verify representative v13 import → roadmap view → answer → save → reload behavior after integration, with reward, snapshot, and battle-selection paths unchanged.
- [ ] Update the local code-only Graphify graph after integration and inspect impacts around `roadmapRelations.ts`, `roadmap.ts`, and `menuModel.ts`; do not enable semantic labeling or an external LLM backend.

## Final clean/commit conditions

- [ ] All eight Tasks and three Checkpoints are complete in dependency order.
- [ ] No RED-only state is committed; the final commit is GREEN.
- [ ] The implementation commit changes exactly the two owned files and contains no `graphify-out/`, `dist/`, `test-results/`, manifest, generated schema, content, UI, save, reward, or battle file.
- [ ] No merge or push to a shared branch is performed from the module worktree.
- [ ] The worktree is clean after the atomic commit, and the integration owner receives the complete handoff evidence.

## Open questions

None. Start conditions, dependency ownership, task order, projection behavior, test strategy, regression gates, commit boundary, and integration handoff are fixed.
