# Phase 3 Todo: curriculum-concept-connectivity

## Status

Approved for implementation on branch `codex/curriculum-concept-connectivity` from base commit `53429c9fa7e812c2e0a878c6383490e49cf9e336`.

## Start Conditions

- [x] The user approves the Phase 2 plan.
- [x] Branch name, base commit, and `git status --short` are recorded.
- [x] No other chat owns the 11 curriculum JSON files or 3 quality-audit files.
- [x] The approved spec and plan are present in this worktree.
- [x] Existing baseline commands reproduce 357 unique Concepts, 395 relations, and 30 isolated Concepts.
- [x] Existing Unit audit reproduces 280 Units, 336 edges, and 0 isolated Units.

## Task 1: Evidence matrix

- [x] Fetch only the registered official MEXT/publisher pages needed for the 30 Concepts.
- [x] Record at least 30 proposed relations in `tasks/curriculum-concept-connectivity-evidence.md`.
- [x] Include endpoints, kind, source ID, locator, direction rationale, and target file.
- [x] Confirm all 30 baseline isolated IDs are covered.
- [x] Reject unsupported, reverse-grade, cross-subject-hard-lock, and misconception-prerequisite candidates.
- [x] Run `git diff --check` for the evidence document.

## Task 2: Concept-quality audit RED→GREEN

- [x] Add a failing test for Concept count, relation-kind counts, deterministic isolated IDs, and duplicate Concept merging.
- [x] Run the focused test and record the expected RED failure.
- [x] Extend `buildCurriculumGraphQuality()` with the minimal Concept-quality output.
- [x] Update `audit-roadmap-graph.ts` to print Concept metrics and fail strict mode on isolation.
- [x] Run the focused test, related tests, and non-strict audit GREEN.
- [x] Confirm baseline output is 357 / 395 / 30.

### Checkpoint A

- [x] Evidence covers all 30 Concepts.
- [x] Quality guardrail is GREEN.
- [x] Strict audit is RED only because content isolation remains.

## Task 3: Kokugo grade 1

- [x] Add at least 6 source-backed relations.
- [x] Cover all 6 grade-1 Kokugo baseline isolated Concepts.
- [x] Run curriculum validation, non-strict audit, and related tests.
- [x] Confirm no cycle, duplicate, reverse-grade, or Unit regression.

## Task 4: Kokugo grade 2/3

- [x] Add at least 6 source-backed relations.
- [x] Cover all 6 grade-2/3 Kokugo baseline isolated Concepts.
- [x] Run curriculum validation, non-strict audit, and related tests.
- [x] Confirm Kokugo isolation is 0.

### Checkpoint B

- [x] Kokugo added at least 12 relations.
- [x] Kokugo isolation is 0.
- [x] Global structural checks remain clean.

## Task 5: Sansu grade 1

- [ ] Add at least 5 source-backed relations.
- [ ] Cover both learnable Concepts and all 3 misconception Concepts.
- [ ] Ensure every misconception relation is non-`prerequisite`.
- [ ] Preserve question links and diagnostic review states.
- [ ] Run curriculum validation, audit, and related tests.

## Task 6: Sansu grade 2

- [ ] Add at least 2 source-backed relations.
- [ ] Cover composing and ordering numbers above 1000.
- [ ] Verify direction, no reverse-grade edge, and no cycle.
- [ ] Confirm Sansu isolation is 0.

### Checkpoint C

- [ ] Kokugo + Sansu have added at least 19 relations.
- [ ] Kokugo and Sansu isolation are both 0.
- [ ] Misconceptions do not affect unlock prerequisites.

## Task 7: Seikatsu

- [ ] Add at least 7 grade-1 relations.
- [ ] Add at least 3 grade-2 relations.
- [ ] Cover all 10 Seikatsu baseline isolated Concepts.
- [ ] Use `chronological` for time order that is not a learning lock.
- [ ] Run curriculum validation, audit, and related tests.
- [ ] Confirm Seikatsu isolation is 0.

## Task 8: Shakai

- [ ] Add at least 1 grade-4 Shakai relation.
- [ ] Cover `shakai.g4.cur-1404-01`.
- [ ] Run curriculum validation and strict audit.
- [ ] Confirm global relations are at least 425 and isolation is 0.

### Checkpoint D

- [ ] 357 unique Concepts, at least 425 relations, 0 isolated Concepts.
- [ ] 280 Units, at least 336 Unit edges, 0 isolated Units.
- [ ] 0 dangling endpoints, self-relations, duplicates, prerequisite cycles, reverse-grade locks, cross-subject locks, and draft prerequisites.

## Task 9: Review and completion

- [ ] Run focused tests and `pnpm audit:roadmap-graph --strict`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm check:architecture`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm validate:content`.
- [ ] Run `pnpm build`.
- [ ] Run the review mutation and restore the file exactly.
- [ ] Perform correctness, readability, architecture, security, and performance review.
- [ ] Write `tasks/curriculum-concept-connectivity-walkthrough.md`.
- [ ] Start and inspect the latest preview on the appropriate port.
- [ ] Inspect staged diff for secrets, unrelated files, generated outputs, and formatting churn.
- [ ] Commit tested increments with descriptive messages.
- [ ] Record branch name, base commit, final commit IDs, final metrics, and all verification results.

## Out of Scope

- [ ] Do not change curriculum schema or relation kinds.
- [ ] Do not change UI, Scenes, save data, rewards, question contracts, or generated schemas.
- [ ] Do not mark any relation `expert-reviewed`.
- [ ] Do not add dependencies or external model/provider credentials.
- [ ] Do not merge or push without integration-owner instruction.
