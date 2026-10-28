# Implementation Plan: math-learning-content-pilot

## Status

Phase 2 plan for human approval. The specification in `SPEC-math-learning-content-pilot.md` is approved. No Phase 3 implementation task has started.

This file is the task-list target for this module. The unrelated, incomplete `tasks/plan.md` and `tasks/todo.md` remain untouched, and no separate Phase 3 todo file will be created.

## Objective

Implement the approved小学1年算数pilot as a content-only change:

- add exactly one approved `stage:*` tag to the exact 12 existing questions;
- preserve at least three primary questions for each target Concept;
- preserve the existing three draft misconception signals and add three approved draft signals, for exactly six in the target Units;
- prove that Question/Unit IDs, answers, rewards, v13 saves, and other agents' ownership remain unchanged.

## Planning Inputs and Evidence

### Approved sources

- `CAPABILITY_MAP-learning-roadmap-curriculum-v2.md`
- `SPEC-math-learning-content-pilot.md`
- `.agent/rules/nihonquest.md`
- `docs/00_GAME_DESIGN.md` §5, §6.3, §8
- `docs/01_ARCHITECTURE.md` §3, §5

### Current data baseline

| Target Concept                          | Current primary questions | Required after implementation |
| --------------------------------------- | ------------------------: | ----------------------------: |
| `sansu.g1.number.two-digit-place-value` |                         4 |                    at least 3 |
| `sansu.g1.addition.meaning`             |                         3 |                    at least 3 |
| `sansu.g1.operation.make-ten-strategy`  |                         6 |                    at least 3 |

- Target-Unit misconception signals: 3 total, maximum confidence 0.70.
- None of the four target question files has an academic-review ledger entry whose hash must be rewritten.
- `tests/unit/state.test.ts` already exercises versions 0 through 12 plus the current v13 schema, including current-version pass-through and export/import round trips.
- `tests/unit/learningRewards.test.ts` fixes the existing reward thresholds at three attempts and mastery 0.80, plus one correction reward per three distinct fully-corrected Question IDs.
- `scripts/validate-curriculum-graph.ts` already verifies question existence, choice answer-ID existence, rejection of the correct answer as a misconception signal, merged Concept references, and duplicate graph IDs.

### Graphify code-only findings

The local code-only graph was generated with:

```bash
graphify extract . --code-only --no-cluster
```

The graph contains 42,373 nodes. It intentionally excludes the content JSON files, so JSON IDs and mappings are verified directly and through repository validators. The graph establishes these implementation boundaries:

- `QuestionBase` fans out to the question engine, Scenes, tools, audits, and many tests. Therefore `src/questions/contracts.ts` must not change for a tag-only pilot.
- `applyLearningRewards()` is used by `buildAskEnv()` and covered by `learningRewards.test.ts`. Content metadata must not enter the reward path.
- `ensureRoadmapMasterySnapshot()` is called by new-game creation and migrations. The content pilot must not edit snapshot or migration logic.
- `questionConceptLinkSchema` already accepts the approved draft signal shape. No TypeScript schema or generated schema change is needed.

## Scope

### Implementation targets

- Four existing question JSON files for the exact 12 approved stage tags.
- Two existing curriculum JSON fragments for two draft misconception Concepts and three new draft signals.
- One dedicated Vitest file for the RED contract and all pilot invariants.

### Explicitly excluded

- `src/questions/contracts.ts`, renderers, TypeScript schemas, and `schemas/**`.
- State, migrations, `roadmapSnapshot.ts`, `learningRewards.ts`, recommendation policy, Scene, UI, and i18n.
- Question text, choices, answers, explanations, IDs, Units, and primary Concept links.
- New dependencies, generated manifests/catalogs, browser UI work, and preview changes.
- `tasks/plan.md`, `tasks/todo.md`, and any Phase 3 todo file.
- Files owned by the other Curriculum v2 agents, including `FieldUi.tsx` and `field.css`.

## Architecture Decisions

1. **Use existing string tags only.** Each exact target question receives one controlled-vocabulary stage tag appended after its existing tags.
2. **Keep content and runtime contracts separate.** The pilot changes static JSON only; runtime code continues consuming the existing `QuestionBase` and curriculum graph contracts.
3. **Treat misconception mappings as hypotheses.** New Concepts and every QuestionLink receiving a new signal are `draft`; confidence is at most 0.70.
4. **Validate cross-fragment references through the merged graph.** The new term-2 signal may reference the existing `add-instead-difference` Concept in the foundations fragment, so the full curriculum graph validator is mandatory.
5. **Use one final implementation commit.** RED and GREEN are working-tree checkpoints; do not commit the intentionally failing RED state. After all focused gates pass, create the single logical implementation commit required by the capability map.
6. **No runtime preview in the agent slice.** This is a content-only change with no visual implementation. The integration owner performs the final 4174 preview and end-to-end roadmap verification after all modules are integrated.

## Dependency Graph

```text
approved SPEC + approved tag vocabulary
                  │
                  ▼
Task 1: dedicated RED contract test
          │                    │
          ▼                    ▼
Task 2: exact stage tags   Task 3: draft misconception data
          │                    │
          └──────────┬─────────┘
                     ▼
Task 4: focused compatibility and quality gate
                     │
                     ▼
single implementation commit → integration-owner handoff
```

Tasks 2 and 3 change independent JSON groups, but they remain sequential in this worktree so every checkpoint has one clear failure mode and no two agents edit the same checkout.

## Implementation Sequence

### Task 1: Add the dedicated RED contract

**Description:** Add one data-oriented Vitest file that loads the approved question and curriculum JSON, defines the exact target matrix, and proves all acceptance boundaries before content changes.

**Acceptance criteria:**

- The test fixes the 12 Question IDs and expected stage tags, while also recording existing non-stage tags, Unit/type, and answer values that must remain stable.
- The test requires primary coverage of at least three for each target Concept and exactly six unique target-Unit signals with confidence at most 0.70.
- The test requires the two approved misconception Concepts and every newly signaled QuestionLink to be `draft`, with the existing three signals preserved exactly.

**Verification:**

- Run `pnpm vitest run tests/unit/mathLearningContentPilot.test.ts` and record RED failures caused by missing stage tags and the current three-signal total.
- Confirm no failure is caused by a bad fixture, missing approved ID, or an unrelated existing invariant.
- Review the test diff before changing content; do not weaken or skip a failing assertion.

**Dependencies:** None.

**Files likely touched:**

- `tests/unit/mathLearningContentPilot.test.ts`

**Estimated scope:** Small — 1 file.

### Checkpoint A: RED is trustworthy

- [ ] The new test fails for the two expected missing capabilities.
- [ ] All 12 approved Question IDs and both curriculum fragments load successfully.
- [ ] No production or content file has changed yet.

### Task 2: Apply the exact stage-tag slice

**Description:** Append the approved tag to each of the 12 exact existing problems without changing question behavior or touching unlisted problems.

**Acceptance criteria:**

- Exactly 12 target-Unit questions have one stage tag each, matching the approved matrix and using all four approved values.
- Existing `prefecture:*`, `theme:*`, and other tags retain their order and values; untagged questions outside the matrix remain untagged by this module.
- Question ID, Unit, type, payload, answer, explanation, and primary Concept links remain byte-for-byte equivalent apart from the intended tag-array edits.

**Verification:**

- Run `pnpm vitest run tests/unit/mathLearningContentPilot.test.ts -t "学習段階タグ"` and require GREEN.
- Run `pnpm validate:content` after the tag edits.
- Inspect the four-file diff and verify it contains only tag additions.

**Dependencies:** Task 1 and Checkpoint A.

**Files likely touched:**

- `content/questions/sansu/g1/ringo-number-build.json`
- `content/questions/sansu/g1/kazu-kiso.json`
- `content/questions/sansu/g1/tashizan.json`
- `content/questions/sansu/g1/kuriagari-kurisagari.json`

**Estimated scope:** Medium — 4 files.

### Checkpoint B: Stage slice is isolated

- [ ] The stage-focused test is GREEN.
- [ ] The full dedicated test remains RED only for the not-yet-added misconception data.
- [ ] Content validation passes and no generated file changes appear.

### Task 3: Add the draft misconception slice

**Description:** Add the two approved draft misconception Concepts and the three approved answer mappings while preserving all existing signals and primary links.

**Acceptance criteria:**

- Add `sansu.g1.misconception.tens-ones-reversed` and `sansu.g1.misconception.make-ten-arbitrary-split` with valid existing source IDs and `review.status: "draft"`.
- Add the three exact signal tuples from the SPEC; downgrade each newly signaled QuestionLink to `draft`; preserve the original three signal tuples unchanged.
- The target Units contain exactly six unique `(questionId, answerId, conceptId)` tuples, all confidence values are at most 0.70, and each answer ID is a real incorrect choice.

**Verification:**

- Run the complete `pnpm vitest run tests/unit/mathLearningContentPilot.test.ts` and require GREEN.
- Run `pnpm validate:curriculum-graph` to verify merged references, answer IDs, duplicates, and schema validity.
- Run `pnpm validate:content` and inspect the two-file curriculum diff for draft-only review changes.

**Dependencies:** Task 2 and Checkpoint B.

**Files likely touched:**

- `content/curriculum/sansu-g1-foundations.json`
- `content/curriculum/sansu-g1-term2.json`

**Estimated scope:** Small — 2 files.

### Checkpoint C: Pilot behavior is complete

- [ ] The full dedicated pilot test is GREEN.
- [ ] Curriculum graph and content validators are GREEN.
- [ ] Primary coverage remains at least `4 / 3 / 6` unless more questions were added by an integrated upstream change; it must never fall below three.
- [ ] No Concept, link, or signal added by this module is `source-checked` or `expert-reviewed`.

### Task 4: Run focused compatibility and quality gates

**Description:** Prove that the content-only pilot did not alter rewards, current v13 saves, legacy migration, runtime contracts, or architectural boundaries.

**Acceptance criteria:**

- Existing reward tests still prove the three-attempt / 0.80 mastery threshold and distinct-three-question correction reward.
- Current v13 save pass-through, export/import, roadmap grandfathering, and legacy migrations remain GREEN without production-state edits.
- The final diff contains only the seven owned implementation files and no generated, runtime, UI, plan, or other-agent file.

**Verification:**

```bash
pnpm vitest run tests/unit/mathLearningContentPilot.test.ts
pnpm vitest run tests/unit/learningRewards.test.ts tests/unit/state.test.ts tests/unit/legacyImport.test.ts
pnpm validate:curriculum-graph
pnpm validate:content
pnpm check:fast
pnpm test:related tests/unit/mathLearningContentPilot.test.ts
git diff --check
git status --short
```

`pnpm check:full`, `pnpm test`, and `pnpm build` are reserved for the integration owner after the Wave 3 commits are integrated. The agent must not run those gates concurrently with other worktrees.

**Dependencies:** Task 3 and Checkpoint C.

**Files likely touched:** None; verification only. Any failure must be fixed within the seven approved implementation files or escalated instead of expanding scope.

**Estimated scope:** Small — verification only.

### Checkpoint D: Ready for implementation commit

- [ ] Every task acceptance criterion is satisfied.
- [ ] Focused tests and validators are GREEN, with command output recorded for handoff.
- [ ] `git diff --check` succeeds.
- [ ] No dependency, lockfile, schema, manifest, catalog, runtime, UI, or unrelated task file changed.
- [ ] Review confirms rewards, saves, and gameplay progression are unaffected by construction.

## RED Test Design

The dedicated test should use descriptive `describe` blocks so intermediate checkpoints can run one slice without hiding the remaining RED contract:

1. **`学習段階タグ`** — exact matrix, one stage tag per target, four-value vocabulary, non-target exclusion, stable question fields.
2. **`primary教材カバレッジ`** — merged question links retain at least three primary problems for each target Concept.
3. **`draft誤概念シグナル`** — preserve the existing three tuples, require the new three, reject duplicates, cap confidence, and require draft review states.
4. **`報酬・セーブ境界`** — assert the content files do not introduce persistence fields or runtime reward configuration; rely on existing reward/state suites for behavior.

Tests should assert observable JSON contracts rather than the order of internal helper calls. Reuse `readFileSync`/`JSON.parse` conventions from neighboring data tests; do not create a new loader or dependency for one test.

## Focused Verification Strategy

| Check                          | Owner             | Purpose                                                          |
| ------------------------------ | ----------------- | ---------------------------------------------------------------- |
| Dedicated Vitest               | module agent      | Exact tags, coverage, draft signals, stable IDs/answers          |
| `validate:curriculum-graph`    | module agent      | Zod shape, merged references, answer IDs, duplicate IDs          |
| `validate:content`             | module agent      | Whole-content schema/reference compatibility                     |
| Reward/state/legacy tests      | module agent      | Reward thresholds and v13/legacy save compatibility              |
| `check:fast`                   | module agent      | Lint, architecture boundaries, app typecheck                     |
| `check:full`, full test, build | integration owner | Integrated Wave 3 gate without concurrent worktree load          |
| 4174 preview and E2E           | integration owner | Final combined roadmap behavior and UI; no module-local UI delta |

If this worktree still lacks installed dependencies at Phase 3 start, verification must not be reported as passing. Reuse the repository's approved dependency setup or obtain approval for a frozen install; do not modify the lockfile or add packages.

## Risks and Mitigations

| Risk                                                                                  | Impact | Mitigation                                                                                                        |
| ------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| A broad tag edit changes more than 12 questions                                       | High   | Use the exact ID matrix in the RED test and manually inspect the four-file diff                                   |
| Existing tags or answers are accidentally reordered/changed                           | High   | Snapshot only stable fields in the dedicated test and require tag-only diffs in Task 2                            |
| A new signal points to a correct or nonexistent answer                                | High   | Use choice IDs fixed in the SPEC and require `validate:curriculum-graph`                                          |
| Cross-fragment misconception reference is mistaken for a local missing Concept        | Medium | Validate the merged graph, not fragments in isolation                                                             |
| Downgrading a newly signaled link from `source-checked` to `draft` appears accidental | Medium | Encode the downgrade as an explicit test and explain it in the implementation commit                              |
| Content edit invalidates an academic-review hash                                      | Medium | Current ledger has no target-file review entries; still run full content validation and do not rewrite the ledger |
| New draft Concepts are presented as expert reviewed                                   | High   | Require `draft` in tests and prohibit review promotion in diff review                                             |
| Save or reward code drifts into the implementation                                    | High   | Treat Graphify's runtime fan-out as a hard boundary and reject any production TypeScript edit                     |
| Parallel agents edit the same checkout or generated outputs                           | High   | Keep this dedicated worktree, touch only owned files, and never generate/commit manifest/schema/catalog files     |
| Missing local dependencies prevent verification                                       | Medium | Use approved frozen dependency setup before Phase 3; do not claim completion without actual command output        |

## Integration-Owner Handoff

After Checkpoint D:

1. Review the complete staged diff and secret scan, then create one atomic implementation commit such as `feat(content): add math learning stage pilot`.
2. Report the actual branch, implementation commit ID, changed-file list, primary coverage counts, signal count/max confidence, and every focused command result.
3. Report any environment limitation honestly; a missing dependency is not a passing check.
4. Leave the worktree clean. Do not merge or push to the shared integration branch.
5. The integration owner cherry-picks the reported commit, reruns `pnpm check:full` once after the Wave 3 integrations, then performs the representative v13 import/answer/save/reload path, final E2E, and the canonical `127.0.0.1:4174` preview.

## Definition of Done for the Future Implementation

- The exact approved stage matrix and six-signal contract are satisfied.
- All focused module gates are GREEN with no skipped tests.
- Existing reward behavior and v13/legacy save behavior remain GREEN.
- Only the seven approved implementation files change.
- The single implementation commit is reviewable and independently revertible.
- Human/integration review occurs before merge; the module agent does not self-merge or push.

## Open Questions

None.
