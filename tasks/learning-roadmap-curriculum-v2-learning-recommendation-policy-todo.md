# Learning Roadmap Curriculum v2 — Learning Recommendation Policy Todo

## Status and execution contract

- Module: `learning-recommendation-policy`
- Phase: 3 — implementation task breakdown only
- Approved spec: `SPEC-learning-recommendation-policy.md`
- Approved plan: `tasks/learning-roadmap-curriculum-v2-learning-recommendation-policy-plan.md`
- Implementation tasks: 10
- Checkpoints: 5
- Required execution order: Wave start gate → Tasks 1–10 in order → integration handoff
- Open questions: none

This file is the only Phase 3 artifact. Creating it does not authorize implementation. During the later
implementation phase, each task is one focused session and touches at most five files. RED tasks deliberately
prove one missing behavior; do not commit a standalone failing RED state. Complete the paired GREEN task in the
same worktree, rerun its focused verification, then create one atomic implementation commit for that pair.

## Dependency chain

```text
Wave 1 implementation commit integrated
  canonicalUnitId + aggregateUnitMastery
                     |
                     v
Tasks 1 RED -> 2 GREEN: public contract and eligibility
                     |
                Checkpoint A
                     |
                     v
Tasks 3 RED -> 4 GREEN: due review and direct prerequisite mastery
                     |
                Checkpoint B
                     |
                     v
Tasks 5 RED -> 6 GREEN: unseen categories, deterministic ties, recent reuse
                     |
                Checkpoint C
                     |
                     v
Tasks 7 RED -> 8 GREEN: JST day and completed-item reconstruction
                     |
                Checkpoint D
                     |
                     v
Tasks 9 RED -> 10 GREEN: max-three plan, diversity, compatibility regressions
                     |
                Checkpoint E
                     |
                     v
Integration owner: exports, consumers, v13 round trip, full gate, preview
```

## Wave start gate

- [ ] Record the current implementation branch, base commit, and `git status --short`; stop if another chat is
      editing any of the four owned files.
- [ ] Confirm the upstream `unit-progress-normalization` implementation commit has been integrated into the
      working base. The current upstream tip `6c2218ea` is planning-only and is not sufficient by itself.
- [ ] Record the actual upstream implementation commit ID and verify that it provides tested
      `canonicalUnitId` and `aggregateUnitMastery` contracts, including current, legacy-question, raw-legacy,
      mixed mastery, and input immutability behavior.
- [ ] Stop and return to the integration owner if `aggregateUnitMastery` is absent, the provider contract differs
      from its approved spec, or using it would require a local alias/fallback implementation.
- [ ] Refresh or inspect the local code-only Graphify graph after the upstream commit is integrated. Do not use
      semantic labeling or an external LLM backend.
- [ ] Confirm Graphify affected results still justify leaving `review.ts`, `unitAliases.ts`, Scene/UI, save,
      rewards, and `src/core/learning/index.ts` outside this module.

Read-only gate commands:

```bash
git branch --show-current
git rev-parse HEAD
git status --short
git log --oneline -10
graphify affected 'canonicalUnitId' --json
graphify affected 'dueReviewQuestions' --json
```

## Owned implementation files

- `src/core/learning/recommendationPolicy.ts`
- `src/core/learning/learningPlan.ts`
- `tests/unit/learningRecommendationPolicy.test.ts`
- `tests/unit/learningPlan.test.ts`

No task below may modify Scene, UI, content, schemas, migrations, rewards, question contracts, barrel exports,
or existing question-selection code. If a task cannot be completed within these four files, stop and use the
integration handoff instead of widening ownership.

## Task 1: RED — public recommendation contract and eligible question set

**Description:** Add the first focused recommendation-policy tests before production code exists. The tests lock
the approved public types through usage, the fixed reason conversion table, QuestionBank/link existence,
grade-scope boundaries, canonical actual unit IDs, and fresh result data.

**Acceptance criteria:**

- [ ] Tests cover `recommendationReasonToAttemptReason` for all four detailed reasons and require only
      `due-review` to map to `review`.
- [ ] Tests reject missing-bank, linkless, question-grade-out-of-range, and concept-grade-out-of-range entries,
      while covering grade 1/6, `includeLower`, and `challengeHigher` boundaries.
- [ ] Tests require canonical `actualUnitId`, ASCII-sorted unique `conceptIds`, new output objects/arrays, and fail
      for the intended missing contract rather than fixture, syntax, or environment errors.

**Verification:**

```bash
pnpm vitest run tests/unit/learningRecommendationPolicy.test.ts
git diff --check
```

Expected result: the Vitest command is RED because the new public contract or eligibility behavior is not yet
implemented; `git diff --check` is GREEN.

**Dependencies:** Wave start gate

**Files likely touched:**

- `tests/unit/learningRecommendationPolicy.test.ts`

**Estimated scope:** Small — 1 file

## Task 2: GREEN — implement public contract and eligibility foundation

**Description:** Implement the smallest pure `rankLearningRecommendations` foundation that satisfies Task 1.
Define the approved public types and readonly input contract, build valid question/link indexes, normalize the
actual unit through the upstream provider, and implement the fixed attempt-reason conversion.

**Acceptance criteria:**

- [ ] `rankLearningRecommendations`, all approved public types, and
      `recommendationReasonToAttemptReason` compile under TypeScript strict without `any` or implicit time/RNG.
- [ ] Only QuestionBank-backed, linked, in-scope questions/concepts are candidates; invalid entries never return
      through a fallback and `challengeHigher=true` allows at most grade 6.
- [ ] Task 1 tests and related tests pass without changing question contracts, content, schema, or provider files.

**Verification:**

```bash
pnpm vitest run tests/unit/learningRecommendationPolicy.test.ts
pnpm test:related src/core/learning/recommendationPolicy.ts tests/unit/learningRecommendationPolicy.test.ts
git diff --check
```

**Dependencies:** Task 1

**Files likely touched:**

- `src/core/learning/recommendationPolicy.ts`
- `tests/unit/learningRecommendationPolicy.test.ts`

**Estimated scope:** Small — 2 files

## Checkpoint A: Foundation after Tasks 1–2

- [ ] The intended RED reason from Task 1 and GREEN outputs from Task 2 are recorded.
- [ ] The diff contains only the two Task 2 files and imports the upstream normalization provider directly.
- [ ] Commit Tasks 1–2 atomically only after GREEN; do not commit the standalone RED state.

## Task 3: RED — due review and direct-prerequisite mastery cases

**Description:** Add focused failing cases for the two highest-priority categories. Lock the exact retention
threshold and urgency formula, one-edge prerequisite direction, shared unit mastery rules, and upstream alias
aggregation before implementing the ranking logic.

**Acceptance criteria:**

- [ ] Tests cover due boundary cases: `attempts > 0`, `dueAt <= evaluationNow`, retention below versus exactly
      `0.65`, future due dates, link weights, overdue cap, and descending summed `duePriority`.
- [ ] Tests cover direct `from -> to` prerequisites only, no grand-prerequisite traversal, missing state weakness
      of 1, `1 - understanding * confidence`, and the prerequisite question's real canonical Unit.
- [ ] Tests prove a prerequisite Unit is mastered only with complete non-misconception evidence plus an approved
      mastery condition or grandfathering, including equivalent legacy/current/mixed mastery inputs; they fail
      for the intended unimplemented ranking behavior.

**Verification:**

```bash
pnpm vitest run tests/unit/learningRecommendationPolicy.test.ts
git diff --check
```

Expected result: Vitest is RED on due/prerequisite expectations while all Task 1–2 cases remain GREEN.

**Dependencies:** Task 2 and Checkpoint A

**Files likely touched:**

- `tests/unit/learningRecommendationPolicy.test.ts`

**Estimated scope:** Medium — 1 test file with table-driven fixtures

## Task 4: GREEN — implement due and weak-prerequisite ranking

**Description:** Add the minimum category calculation needed for Task 3. Reuse `estimatedRetention`,
`canonicalUnitId`, and `aggregateUnitMastery`; keep the specification-specific retention threshold and urgency
formula local to the new module without changing existing review or roadmap code.

**Acceptance criteria:**

- [ ] Eligible due concepts produce `due-review` with the exact weighted/capped urgency sum and always outrank
      lower categories.
- [ ] Only unmastered one-edge prerequisites of eligible primary targets produce `weak-prerequisite`; mastery
      completeness, independent successes, aggregate mastery, and grandfathered IDs follow the approved rules.
- [ ] Legacy/current/mixed inputs yield the same canonical result, all Task 3 cases pass, and no alias/mastery
      fallback or transitive prerequisite traversal is introduced.

**Verification:**

```bash
pnpm vitest run tests/unit/learningRecommendationPolicy.test.ts
pnpm test:related src/core/learning/recommendationPolicy.ts tests/unit/learningRecommendationPolicy.test.ts
git diff --check
```

**Dependencies:** Task 3

**Files likely touched:**

- `src/core/learning/recommendationPolicy.ts`
- `tests/unit/learningRecommendationPolicy.test.ts`

**Estimated scope:** Medium — 2 files

## Checkpoint B: High-priority ranking after Tasks 3–4

- [ ] Due and direct-prerequisite tables match the approved formulas and category order exactly.
- [ ] Graphify or import review confirms `review.ts`, roadmap, Scene, state, and provider modules are unchanged.
- [ ] Commit Tasks 3–4 atomically after focused GREEN verification.

## Task 5: RED — unseen categories, deterministic ties, recent reuse, and immutability

**Description:** Add the remaining recommendation-policy tests before completing the comparator. These cases lock
the two fallback categories, one-candidate-per-question behavior, every tie-break key, fresh-before-recent reuse,
and non-destructive evaluation.

**Acceptance criteria:**

- [ ] Tests distinguish unseen primary evidence from supporting-only links and unseen questions from any prior
      AttemptEvent regardless of event reason or score; one question keeps only its highest category.
- [ ] Tests cover category order, category-specific priority, `diagnosticValue`, ASCII `questionId`, reversed
      input order, repeated calls, fresh-first selection, and ranked recent reuse without duplicates.
- [ ] Deep-frozen Graph, QuestionBank data, concept states, attempts, recent IDs, and mastery inputs remain
      unchanged; the new tests fail only on missing unseen/comparator/reuse behavior.

**Verification:**

```bash
pnpm vitest run tests/unit/learningRecommendationPolicy.test.ts
git diff --check
```

Expected result: Vitest is RED on the new unseen/tie/recent cases while Tasks 1–4 remain GREEN.

**Dependencies:** Task 4 and Checkpoint B

**Files likely touched:**

- `tests/unit/learningRecommendationPolicy.test.ts`

**Estimated scope:** Medium — 1 test file with deterministic fixtures

## Task 6: GREEN — complete deterministic recommendation ordering

**Description:** Complete category assignment and the explicit comparator, then apply the same ordering to fresh
and reusable recent candidates. Candidate generation must remain pure and independent of input array or Map
insertion order.

**Acceptance criteria:**

- [ ] `unseen-primary` and `unseen-question` match their exact evidence rules, and each question appears once with
      its highest applicable category.
- [ ] The comparator applies category, category priority, diagnostic value, and ASCII question ID in order;
      fresh candidates precede equally ranked recent reuse without relaxing eligibility.
- [ ] Reversed/frozen/repeated inputs return identical fresh objects and arrays, and all recommendation-policy
      focused and related tests pass without `Math.random`, `Date.now`, or input mutation.

**Verification:**

```bash
pnpm vitest run tests/unit/learningRecommendationPolicy.test.ts
pnpm test:related src/core/learning/recommendationPolicy.ts tests/unit/learningRecommendationPolicy.test.ts
git diff --check
```

**Dependencies:** Task 5

**Files likely touched:**

- `src/core/learning/recommendationPolicy.ts`
- `tests/unit/learningRecommendationPolicy.test.ts`

**Estimated scope:** Medium — 2 files

## Checkpoint C: Recommendation policy complete after Tasks 5–6

- [ ] All four categories and every tie-break key have explicit passing cases.
- [ ] Deep-freeze and reversed-input cases prove input immutability and order independence.
- [ ] Commit Tasks 5–6 atomically after focused GREEN verification.

## Task 7: RED — JST day and completed-item reconstruction

**Description:** Create the first `learningPlan` tests before production code. Lock JST-fixed day boundaries,
eligible completion reasons, deterministic first-event selection, completed union semantics, and reconstruction
only from still-valid questions and links.

**Acceptance criteria:**

- [ ] Tests cover JST 00:00 immediately before/at/after, two times in one JST day, and next-day exclusion using
      fixed timestamps without a mocked clock or locale dependence.
- [ ] Only same-day `review | diagnosis` events complete a question regardless of score, timeout, or attempts;
      battle/event/playground/unknown do not, and duplicate events use `(answeredAt, id, questionId)` order.
- [ ] Completed items preserve the stored two-value reason, never infer a detailed reason, and omit deleted,
      unlinked, or otherwise unreconstructable questions; tests fail for the intended missing plan behavior.

**Verification:**

```bash
pnpm vitest run tests/unit/learningPlan.test.ts
git diff --check
```

Expected result: Vitest is RED because `buildLearningPlan` and completed-item reconstruction are not implemented.

**Dependencies:** Task 6 and Checkpoint C

**Files likely touched:**

- `tests/unit/learningPlan.test.ts`

**Estimated scope:** Medium — 1 test file

## Task 8: GREEN — implement JST evaluation and completed-item prefix

**Description:** Implement `buildLearningPlan` far enough to compute `evaluationNow` once, rebuild valid completed
items, and preserve at most the first three completions. Use the existing recommendation public input rather than
introducing GameState, save, Scene, or UI dependencies.

**Acceptance criteria:**

- [ ] `buildLearningPlan` uses the fixed UTC+09:00 formula exactly once and passes the same `evaluationNow` to all
      recommendation/retention work for that call.
- [ ] Valid same-day completions are sorted, deduplicated, capped at three, returned first as `completed: true`,
      and retain only their stored `review | diagnosis` reason.
- [ ] Deleted/unlinked problems produce no placeholder, same-day reloads remain stable, and Task 7 focused/related
      tests pass without a save-layer import.

**Verification:**

```bash
pnpm vitest run tests/unit/learningPlan.test.ts
pnpm test:related src/core/learning/learningPlan.ts tests/unit/learningPlan.test.ts
git diff --check
```

**Dependencies:** Task 7

**Files likely touched:**

- `src/core/learning/learningPlan.ts`
- `tests/unit/learningPlan.test.ts`
- `src/core/learning/recommendationPolicy.ts` only if the approved shared input type needs an export adjustment

**Estimated scope:** Medium — 2–3 files

## Checkpoint D: Completed plan prefix after Tasks 7–8

- [ ] JST boundaries and completed-event ordering are fixed by deterministic timestamp cases.
- [ ] No completion reason is reverse-inferred and no invalid placeholder is constructed.
- [ ] Commit Tasks 7–8 atomically after focused GREEN verification.

## Task 9: RED — max-three composition, Unit diversity, and compatibility guards

**Description:** Add the final failing plan cases and compatibility guards before completing the composition.
Lock completed-first filling, question uniqueness, two-pass canonical Unit diversity, valid 0–2 results, upstream
legacy equivalence, and full input/state preservation. Establish existing reward, v13 state, and battle-selection
tests as green baselines before the final behavior change.

**Acceptance criteria:**

- [ ] Tests require completed items first, exclusion of completed question IDs, total length 0–3, different
      canonical Units in pass one, same-Unit fallback in pass two, and honest 0/1/2-item results.
- [ ] Legacy/current/mixed mastery and grandfathered fixtures produce equal plans; deep-frozen state projections,
      attempts, recent IDs, mastery, reward markers, inventory, dex, and progress remain byte-for-byte unchanged.
- [ ] Existing `learningRewards`, v13 state, and 7:3 weak/review question-selection tests are GREEN before the new
      plan-composition expectations are accepted as the intended RED.

**Verification:**

```bash
pnpm vitest run tests/unit/learningPlan.test.ts tests/unit/learningRecommendationPolicy.test.ts
pnpm vitest run tests/unit/learningRewards.test.ts tests/unit/state.test.ts tests/unit/questions.test.ts
git diff --check
```

Expected result: the first command is RED only on new plan-composition expectations; the compatibility regression
command and all previously completed cases are GREEN.

**Dependencies:** Task 8 and Checkpoint D

**Files likely touched:**

- `tests/unit/learningPlan.test.ts`
- `tests/unit/learningRecommendationPolicy.test.ts`

**Estimated scope:** Medium — 2 test files

## Task 10: GREEN — complete the daily plan and run module gates

**Description:** Fill remaining plan slots from the ranked recommendations with two-pass canonical Unit diversity,
then close all immutability and compatibility regressions. Do not wire consumers or modify reward, save, battle,
provider, Scene, UI, content, or barrel files.

**Acceptance criteria:**

- [ ] `buildLearningPlan` returns 0–3 unique questions with completed items first, ranked incomplete items next,
      different canonical Units preferred, and same-Unit fallback only when space remains.
- [ ] Completed and incomplete discriminated-union branches retain their approved two-value/four-value reasons;
      every result and `conceptIds` array is fresh and all deep-frozen inputs remain unchanged.
- [ ] Dedicated tests, reward/v13/battle-selection regressions, related tests, fast checks, curriculum validation,
      whitespace checks, ownership audit, and secret scan all pass.

**Verification:**

```bash
pnpm vitest run tests/unit/learningRecommendationPolicy.test.ts tests/unit/learningPlan.test.ts
pnpm vitest run tests/unit/learningRewards.test.ts tests/unit/state.test.ts tests/unit/questions.test.ts
pnpm test:related src/core/learning/recommendationPolicy.ts src/core/learning/learningPlan.ts tests/unit/learningRecommendationPolicy.test.ts tests/unit/learningPlan.test.ts
pnpm check:fast
pnpm validate:curriculum-graph
git diff --check
git status --short
```

**Dependencies:** Task 9

**Files likely touched:**

- `src/core/learning/recommendationPolicy.ts`
- `src/core/learning/learningPlan.ts`
- `tests/unit/learningRecommendationPolicy.test.ts`
- `tests/unit/learningPlan.test.ts`

**Estimated scope:** Medium — 4 files

## Checkpoint E: Module implementation complete after Tasks 9–10

- [ ] Every approved spec test case maps to a passing dedicated test, including input immutability and stable
      output under repeated/reversed inputs.
- [ ] `git diff --name-only` lists only the four owned files; no schema, migration, reward, battle selection,
      content, Scene/UI, provider, generated output, or barrel export changed.
- [ ] Graphify code-only output shows no reverse dependency from Core to Scene/UI/save implementation.
- [ ] Tasks 9–10 are committed atomically only after all Task 10 commands are GREEN.

## Regression invariants that must remain true

- [ ] Learning-fragment rewards remain: first Unit mastery at `n >= 3 && value >= 0.8`, and one reward per three
      distinct fully corrected questions, with no duplicate reward after reload, replay, or alias-equivalent Unit.
- [ ] The module never calls `applyLearningRewards` and never writes inventory, dex, `masteredRewardUnits`,
      `correctedRewardQuestionIds`, attempts, recent, mastery, region progress, or roadmap snapshot data.
- [ ] Save schema remains version 13 with no new field, migration, or rewrite; legacy/current/mixed progress is read
      through the upstream normalization contract.
- [ ] Existing question-engine battle selection remains approximately 70% weak Units and 30% mastered review;
      the recommendation policy does not replace or configure `pickQuestion`.
- [ ] Empty or prerequisite-weak plans never hard-lock gameplay, region progress, battle, events, or learning UI.
- [ ] `Math.random`, implicit `Date.now()`, input mutation, dummy questions, invalid grade fallbacks, and fabricated
      detailed reasons for completed events are absent.

## Integration-owner handoff checklist

The module owner stops after Checkpoint E. The following files and behaviors are outside module ownership and must
be handled by the integration owner in later commits:

- [ ] Add approved exports to `src/core/learning/index.ts` only after all module commits are integrated.
- [ ] Wire roadmap/UI consumers separately; do not ask the module commit to edit `Overworld.ts`,
      `roadmapPractice.ts`, `FieldUi.tsx`, `field.css`, Scene, or UI files.
- [ ] At the AttemptEvent creation boundary, use only `recommendationReasonToAttemptReason`; do not persist the
      four-value detailed reason or change the existing reason enum.
- [ ] Import representative v13 legacy-only, current-only, and mixed saves, then perform
      recommendation → answer → save → reload. Confirm progression, reward markers, inventory, dex, regions, and
      plan stability are preserved without duplicate rewards.
- [ ] Re-run the integrated code-only Graphify graph and resolve any ownership-crossing wiring in a separate
      integration commit.
- [ ] When parallel work has stopped, run `pnpm check:full` once on the integrated branch; individual module
      worktrees must not concurrently run `pnpm test`, `pnpm build`, or `pnpm check:full`.
- [ ] After the later user-facing integration is complete, restart the canonical preview from the integrated build
      at `127.0.0.1:4174` and verify initial and reset-save states. The module owner does not update port 4174.

## Final commit and clean-worktree checklist

- [ ] Each RED/GREEN pair is one logical, reviewed commit; no standalone failing RED commit is retained.
- [ ] Record branch, integrated upstream commit, implementation commit IDs, and the RED failure reason/GREEN
      command results for all five pairs.
- [ ] Inspect `git diff --staged` before every commit and scan the staged diff for credentials, tokens, private
      keys, `.env` values, generated `graphify-out/`, `dist/`, and `test-results/` files.
- [ ] Confirm `git diff --check` and all Task 10 focused commands pass immediately before the final module commit.
- [ ] Confirm `git status --short` is empty after commits, or explicitly report pre-existing unrelated user changes
      without staging, formatting, moving, or deleting them.
- [ ] Report branch, base and upstream commit IDs, implementation commits, four-file change summary, focused
      verification results, Graphify result, and clean status; do not merge or push without integration-owner
      instruction.

## Completion condition

All ten tasks and five checkpoints are complete, the owned worktree is clean, and the integration-owner handoff
contains no unresolved design decision. A missing or incompatible upstream provider is a failed Wave start gate,
not permission to add a fallback or expand module ownership.
