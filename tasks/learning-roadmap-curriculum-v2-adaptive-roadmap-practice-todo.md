# Todo: adaptive-roadmap-practice — Phase 3 implementation

## Status

- Task decomposition only; implementation has not started.
- This checklist is dedicated to Agent 4's owned adaptive-roadmap-practice slice.
- Do not edit `tasks/plan.md` or `tasks/todo.md` while executing this checklist.
- Approved specification: `SPEC-adaptive-roadmap-practice.md`.
- Approved implementation plan: `tasks/learning-roadmap-curriculum-v2-adaptive-roadmap-practice-plan.md`.

## Wave start conditions

Do not start Task 1 until every condition below is true on Agent 4's dedicated
`codex/` branch and worktree.

- [ ] The integrated base includes Wave 1 unit-progress normalization.
- [ ] The integrated base includes the Wave 2 learning-recommendation policy,
      its approved selection/result/reason types, and the public reason mapping
      for direct import.
- [ ] The integrated base includes roadmap relation projection needed by the
      recommendation policy.
- [ ] The integration owner has removed the legacy selector imports and
      assertions from `tests/unit/roadmap.test.ts` and
      `tests/unit/sansuG1Term3.test.ts`.
- [ ] Upstream focused tests are green, and `git status --short --branch` is
      clean before Agent 4 changes begin.
- [ ] Record the branch name and base commit; confirm that Agent 4 owns only
      `src/scenes/overworld/roadmapPractice.ts` and the new
      `tests/unit/roadmapPractice.test.ts`.

If an entry condition is false, stop and hand the dependency back to the
integration owner. Do not recreate, shim, or locally copy an upstream contract.

## Dependency order

`Wave start conditions -> Task 1 RED -> Task 2 GREEN -> Checkpoint 1 -> Task 3 RED -> Task 4 GREEN -> Checkpoint 2 -> Task 5 verification -> Task 6 review/commit/handoff -> Final checkpoint`

## Task 1 — RED: specify the pure recommendation adapter

### Description

Create the focused unit-test file and express the approved pure selection
contract against real upstream policy fixtures. Do not edit production code in
this task. The failing tests must demonstrate the missing adaptive behavior,
not an unrelated fixture or import failure.

### Acceptance criteria

1. Tests cover all four reasons and assert the exact
   `{ questionId, actualUnitId, reason, conceptIds }` result, including selection
   from a prerequisite unit.
2. Tests cover fresh/recent attempts, grade filtering, current/legacy/mixed
   question data, and the no-candidate `null` result.
3. Tests prove that selection inputs are unchanged and that scene RNG is not
   called.

### Verification

```bash
pnpm vitest run tests/unit/roadmapPractice.test.ts
git diff -- tests/unit/roadmapPractice.test.ts
```

The Vitest command must fail for the expected missing adaptive contract. Record
the failing assertion. Stop if it passes unexpectedly or fails before reaching
that assertion.

### Dependencies

- All Wave start conditions are satisfied.

### Files likely touched

- `tests/unit/roadmapPractice.test.ts`

### Estimated scope

Small — one focused test file in one session.

## Task 2 — GREEN: implement the pure recommendation adapter

### Description

Replace the local random roadmap selector with the smallest adapter around the
approved upstream recommendation policy. Import the upstream function, result
and reason types, and public reason mapping directly. Remove the legacy alias
handling and the old `pickRoadmapQuestionId` helper; do not add a compatibility
wrapper or duplicate policy ranking.

### Acceptance criteria

1. The adapter returns the exact approved result or `null` for the RED cases
   without mutating attempts, content, roadmap relations, or concept arrays.
2. Selection is deterministic and does not consume scene RNG.
3. The old random selector and local policy/reason duplication are absent, and
   changes remain within the two owned files.

### Verification

```bash
pnpm vitest run tests/unit/roadmapPractice.test.ts
pnpm typecheck:app
git diff -- src/scenes/overworld/roadmapPractice.ts tests/unit/roadmapPractice.test.ts
```

### Dependencies

- Task 1 has a recorded RED failure for the intended behavior.

### Files likely touched

- `src/scenes/overworld/roadmapPractice.ts`
- `tests/unit/roadmapPractice.test.ts`

### Estimated scope

Small — two owned files in one session.

## Checkpoint 1 — selection boundary

- [ ] The focused selection tests are green.
- [ ] No ranking rule, legacy alias table, or reason mapping was copied locally.
- [ ] No production or test file outside Agent 4's two-file ownership changed.

## Task 3 — RED: specify runtime execution and context

### Description

Extend only the focused test file to specify how `runRoadmapPractice` executes
the selected question. Do not edit production code in this task. The failures
must expose the current requested-unit title, fixed reason, missing return
value, or cleanup behavior that the runtime adapter still needs to change.

### Acceptance criteria

1. Tests require the selected question to run once with the actual unit title
   and subject and require the function to return all four selection fields.
2. Tests require each of the four recommendation reasons to map through the
   approved public mapping into the existing attempt-event path.
3. Tests cover no candidate, missing/stale selected content, rejected
   `askById`, cleanup, and unchanged pre-answer learning state.

### Verification

```bash
pnpm vitest run tests/unit/roadmapPractice.test.ts
git diff -- tests/unit/roadmapPractice.test.ts
```

The Vitest command must fail at the intended runtime assertion. Record that
failure and stop on fixture, import, or unrelated failures.

### Dependencies

- Task 2 is green.
- Checkpoint 1 is complete.

### Files likely touched

- `tests/unit/roadmapPractice.test.ts`

### Estimated scope

Small — one focused test file in one session.

## Task 4 — GREEN: execute the recommendation through existing runtime seams

### Description

Update `runRoadmapPractice` to consume one recommendation, resolve the actual
unit context, call the existing `askById -> buildAskEnv -> applyLearningRewards`
path, use the upstream reason mapping, return the selection, and always clean up
the practice UI state. Do not introduce another reward, persistence, or random
selection path.

### Acceptance criteria

1. A valid selection runs exactly once with actual-unit title/subject and
   returns the approved four-field result; no candidate or stale content
   returns `null` without awarding progress.
2. All reasons reach the existing attempt-event/reward path through the
   upstream mapping, and rejected execution still restores UI state.
3. Reward thresholds, v13 save structure, battle selection behavior, and all
   pre-answer learning state remain unchanged.

### Verification

```bash
pnpm vitest run tests/unit/roadmapPractice.test.ts
pnpm typecheck:app
git diff -- src/scenes/overworld/roadmapPractice.ts tests/unit/roadmapPractice.test.ts
```

### Dependencies

- Task 3 has a recorded RED failure for the intended runtime behavior.

### Files likely touched

- `src/scenes/overworld/roadmapPractice.ts`
- `tests/unit/roadmapPractice.test.ts`

### Estimated scope

Small — two owned files in one session.

## Checkpoint 2 — runtime, rewards, and persistence boundary

- [ ] The runtime tests are green, including rejection and cleanup paths.
- [ ] The implementation still uses the existing reward path; three-answer,
      mastery `0.80`, and mistake-correction behavior is unchanged.
- [ ] Save format remains v13 with no migration/schema change, battle selection
      remains 70/30, and only the two owned files have changed.

## Task 5 — run focused regression and dependency checks

### Description

Verify the completed two-file change without modifying behavior. Run related
and adjacent regression tests, the repository fast gate, then refresh the local
code-only Graphify graph and inspect the affected nodes and reward path. Keep
`graphify-out/` untracked/ignored and out of the implementation commit.

### Acceptance criteria

1. Related tests plus question, reward, and save-state regressions pass.
2. `pnpm check:fast` passes without unrelated fixes or formatting churn.
3. Graphify confirms the expected consumers and the existing
   `runRoadmapPractice -> buildAskEnv -> applyLearningRewards` path, with no new
   layer violation.

### Verification

```bash
pnpm test:related src/scenes/overworld/roadmapPractice.ts tests/unit/roadmapPractice.test.ts
pnpm vitest run tests/unit/questions.test.ts tests/unit/learningRewards.test.ts tests/unit/state.test.ts
pnpm check:fast
graphify update .
graphify affected "src/scenes/overworld/roadmapPractice.ts" --depth 2 --graph graphify-out/graph.json
graphify path "runRoadmapPractice" "applyLearningRewards" --graph graphify-out/graph.json
git status --short --branch
```

### Dependencies

- Task 4 is green.
- Checkpoint 2 is complete.

### Files likely touched

- No tracked file; `graphify-out/` may be regenerated locally and remains
  ignored.

### Estimated scope

Extra small — verification only, zero tracked files.

## Task 6 — review, atomic commit, and handoff

### Description

Review the complete diff for correctness, test quality, boundaries, security,
and maintainability. Resolve findings only inside the two owned files, rerun the
smallest verification affected by any fix, then stage exactly those files and
create one logical implementation commit. Prepare the integration-owner
handoff; do not merge or push.

### Acceptance criteria

1. Review has no unresolved critical or required finding, no secret-like value,
   no whitespace error, and the final diff is limited to the two owned files.
2. Exactly one logical implementation commit is created and the worktree is
   clean afterward.
3. Handoff records branch, commit, RED/GREEN evidence, checks run, Graphify
   result, and any unresolved issue (`None` when empty).

### Verification

```bash
git diff --check
git diff --name-only
git diff -- src/scenes/overworld/roadmapPractice.ts tests/unit/roadmapPractice.test.ts
git status --short --branch
git add src/scenes/overworld/roadmapPractice.ts tests/unit/roadmapPractice.test.ts
git diff --cached --check
git diff --cached --name-only
git diff --cached | rg -i '(api[_-]?key|secret|token|password|private[_-]?key)' || true
git commit -m "feat: adapt roadmap practice recommendations"
git rev-parse HEAD
git status --short --branch
```

### Dependencies

- Task 5 passes with no unresolved boundary or regression issue.

### Files likely touched

- `src/scenes/overworld/roadmapPractice.ts`
- `tests/unit/roadmapPractice.test.ts`

### Estimated scope

Small — review and one atomic commit in one session.

## Final checkpoint — ready for integration

- [ ] Tasks 1–6 and Checkpoints 1–2 are complete.
- [ ] The branch contains one logical Agent 4 implementation commit and has a
      clean worktree.
- [ ] No out-of-owner source, test, generated, plan, or shared task file changed.
- [ ] The handoff explicitly preserves rewards, v13 persistence, battle 70/30,
      deterministic selection, and input immutability.

## Integration-owner handoff

Agent 4 must not edit out-of-owner callers or shared tests. The integration
owner is responsible for:

- Updating any remaining imports or assertions in
  `tests/unit/roadmap.test.ts` and `tests/unit/sansuG1Term3.test.ts`.
- Deciding whether `src/scenes/overworld/index.ts` or the Overworld caller needs
  a cross-slice adjustment after cherry-pick.
- Cherry-picking the Agent 4 commit and running the integrated full gates,
  build, browser/E2E verification, and canonical `127.0.0.1:4174` preview.

## Non-regression contract

- [ ] Three answered questions, mastery threshold `0.80`, and mistake
      correction rewards are unchanged.
- [ ] Save format remains v13; no persistence key, schema, or migration is
      added.
- [ ] Battle selection remains 70/30 and is not routed through this adapter.
- [ ] Attempts, question bank, roadmap relations, and concept arrays remain
      immutable during selection.
- [ ] Game progression changes only through the existing answer/reward path.

## Open questions

None.
