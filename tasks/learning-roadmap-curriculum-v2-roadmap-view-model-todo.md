# Phase 3 Tasks: 学習ロードマップ表示モデル

## Status

- Capability module: `roadmap-view-model`
- Approved specification: `SPEC-roadmap-view-model.md`
- Approved implementation plan: `tasks/learning-roadmap-curriculum-v2-roadmap-view-model-plan.md`
- Task-list phase: 3 — implementation task decomposition only
- Implementation status: not started
- Open questions: none

この文書は承認済み仕様と計画を、Phase 4 で順番に実行するためのチェックリストへ分解する。Phase 3 ではコード、テスト、content、UI、SPEC、plan、既存 `tasks/plan.md`、既存 `tasks/todo.md` を変更しない。Phase 4 でも、この todo 自体を実装コミットへ混ぜず、実装差分は所有3ファイルだけに限定する。

## Wave start gate

Task 1 は、次のすべてを満たすまで開始しない。

- [ ] 人間承認済みの `SPEC-roadmap-view-model.md` と専用planが、実装開始時の基点に存在する。
- [ ] 統合担当が Wave 1 `unit-progress-normalization` の実装コミットを統合し、`canonicalUnitId` と `aggregateUnitMastery` の公開契約および専用focused testsがGREENである。
- [ ] 統合担当が Wave 2 `learning-recommendation-policy` の実装コミットを統合し、`LearningRecommendationReason`、`CompletedLearningPlanReason`、`LearningPlanItem` と今日プラン生成の専用focused testsがGREENである。
- [ ] 統合担当が Wave 2 `roadmap-relation-projection` の実装コミットを統合し、`RoadmapRelationProjection`、`projectRoadmapRelations` と専用focused testsがGREENである。
- [ ] 統合担当が上記3実装コミットの完全なcommit IDと検査結果をhandoffし、それらが現在の実装基点の祖先であることを確認する。
- [ ] `git status --short` が空で、所有ファイルに別チャットの未統合差分がない。
- [ ] ベースラインの `pnpm vitest run tests/unit/roadmap.test.ts` と `pnpm check:fast` がGREENである。
- [ ] `graphify-out/graph.json` が統合基点に対して更新済みで、`roadmap.ts` と `menuModel.ts` の影響境界に新しい所有競合がない。

### Provider commit guard

現時点の各先行ブランチ先端は文書コミットであり、実装依存を満たさない。

| Provider                                               | Current documentation head                                                              | Required before Task 1                                                                      |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `codex/lr-v2-unit-progress`                            | `6c2218ea86efba40dd3519972c81eea52ef6ce92`                                              | `src/core/learning/unitProgress.ts` と専用テストを含む、後続の検証済み実装コミット          |
| `codex/lr-v2-recommendation-policy`                    | `42a9d78b88b76a8675e26603eae98fad4d8d9596`                                              | `recommendationPolicy.ts`、`learningPlan.ts` と専用テストを含む、後続の検証済み実装コミット |
| `codex/lr-v2-relations` / `codex/lr-v2-relations-spec` | `b30808a4b431c1caf69f3bc1373427e865016542` / `a31da5829da7f992299b809fd25ddc90e6bda73c` | `roadmapRelations.ts` と専用テストを含む、後続の検証済み実装コミット                        |

文書先端をcherry-pickしただけでは開始条件を満たさない。公開名や型が承認仕様と異なる場合もローカル代替を作らず、統合担当にprovider実装の整合を依頼して停止する。

## Dependency order

```text
Integrated Wave 1 implementation commit
  canonicalUnitId + aggregateUnitMastery
                    │
Integrated Wave 2 recommendation implementation commit
  LearningPlanItem + reason discriminants
                    │
Integrated Wave 2 relation implementation commit
  RoadmapRelationProjection
                    │
                    ▼
Task 1 RED ──▶ Task 2 GREEN ──▶ Checkpoint A
                    │
                    ▼
Task 3 RED ──▶ Task 4 GREEN ──▶ Checkpoint B
                    │
                    ▼
Task 5 RED ──▶ Task 6 GREEN ──▶ Checkpoint C
                    │
                    ▼
Task 7 regression, review, atomic commit, handoff
```

Tasks are strictly sequential because every behavioral pair shares `tests/unit/roadmap.test.ts` and later implementation depends on the contract established by the preceding pair. RED states are working-tree checkpoints only; do not commit a deliberately failing state.

## Task 1: RED — empty view-model contract and legacy compatibility

**Description:** Add the first focused behavioral tests for an additive `buildRoadmapViewModel` contract. Characterize the existing node builders before implementation and prove that an empty upstream plan must return the same roadmap nodes with `{ items: [], allComplete: false }`. If needed, add only a compile-safe exported stub that throws an explicit not-implemented error so RED reaches the intended runtime behavior instead of failing module resolution.

**Acceptance criteria:**

- [ ] A focused test named `空の今日プランを含む表示モデルを返し、既存ノード契約を保つ` asserts node equality, empty items, and `allComplete: false`.
- [ ] Existing `buildRoadmapNodes` and `buildGameRoadmapNodes` expectations remain unchanged and are not weakened or skipped.
- [ ] The focused command reaches the new test and fails on the missing builder behavior or explicit not-implemented stub; missing exports/types, fixture setup, import paths, and unrelated tests do not fail.

**Verification:**

- [ ] Expected RED: `pnpm vitest run tests/unit/roadmap.test.ts -t "空の今日プランを含む表示モデルを返し、既存ノード契約を保つ"`
- [ ] Scope: `git diff --name-only` prints only `tests/unit/roadmap.test.ts`.

**Dependencies:** Wave start gate complete.

**Files likely touched:**

- `tests/unit/roadmap.test.ts`
- `src/scenes/overworld/roadmap.ts` only if a compile-safe RED stub is required

**Estimated scope:** Small — 1–2 files, test-first RED state with no completed behavior.

## Task 2: GREEN — additive DTO and empty builder path

**Description:** Add the approved Scene-neutral DTOs and the minimum pure `buildRoadmapViewModel` path that satisfies Task 1 without changing existing node APIs or adding UI, persistence, reward, or policy behavior.

**Acceptance criteria:**

- [ ] `RoadmapPendingReason`、`RoadmapCompletedReason`、`RoadmapUnitProgressView`、判別可能な `RoadmapTodayItem`、`RoadmapTodayPlanView`、`RoadmapViewModel` are additive exports in `menuModel.ts`.
- [ ] `buildRoadmapViewModel` returns nodes behaviorally equal to the legacy builder and an empty plan as `{ items: [], allComplete: false }`.
- [ ] Existing `RoadmapNode` fields and `buildRoadmapNodes` / `buildGameRoadmapNodes` signatures remain source-compatible.

**Verification:**

- [ ] Target GREEN: `pnpm vitest run tests/unit/roadmap.test.ts -t "空の今日プランを含む表示モデルを返し、既存ノード契約を保つ"`
- [ ] Roadmap regression: `pnpm vitest run tests/unit/roadmap.test.ts`
- [ ] Static boundary: `pnpm check:fast`

**Dependencies:** Task 1 has the intended RED failure.

**Files likely touched:**

- `src/shared/menuModel.ts`
- `src/scenes/overworld/roadmap.ts`

**Estimated scope:** Small — 2 source files.

## Checkpoint A: contract foundation after Tasks 1–2

- [ ] Task 1 RED reason was recorded and Task 2 made the same test GREEN.
- [ ] `pnpm vitest run tests/unit/roadmap.test.ts` and `pnpm check:fast` are GREEN.
- [ ] `git diff --name-only` lists only `src/shared/menuModel.ts`、`src/scenes/overworld/roadmap.ts`、`tests/unit/roadmap.test.ts`.
- [ ] Five-axis checkpoint finds no contract deletion, UI/Scene dependency, secret, unbounded work, or duplicate progress implementation.

## Task 3: RED — canonical today-plan projection

**Description:** Add focused tests for projecting 0–3 upstream `LearningPlanItem` values into honest Unit metadata and the exact same canonical progress used by full-roadmap nodes. Cover pending/completed discriminants, score-0 completion, order, invalid Units, and input immutability before implementing projection behavior.

**Acceptance criteria:**

- [ ] A `buildRoadmapViewModel today plan` test group proves legacy/current/mixed mastery yields one canonical `actualUnitId` and identical mastery, attempts, retention, and state in node and today item.
- [ ] The group covers all four pending reasons, both completed reasons, score-0 completion, stable `questionId`, 0/1/2/3 order, unmatched-Unit omission, and the non-empty `allComplete` rule.
- [ ] Frozen or cloned mastery, units, curriculum, plan, and Concept inputs remain deeply equal after the attempted call.

**Verification:**

- [ ] Expected RED: `pnpm vitest run tests/unit/roadmap.test.ts -t "buildRoadmapViewModel today plan"`
- [ ] Scope: `git diff --name-only` remains within the three owned files.

**Dependencies:** Checkpoint A complete; integrated provider types are imported directly rather than copied.

**Files likely touched:**

- `tests/unit/roadmap.test.ts`

**Estimated scope:** Small — 1 test file with focused fixtures.

## Task 4: GREEN — one progress source and today-plan projection

**Description:** Replace roadmap-local alias/mastery aggregation with the integrated `canonicalUnitId` and `aggregateUnitMastery` path where applicable, then project valid upstream plan items from the already-built canonical nodes. Preserve upstream order and reason values without re-running recommendation or completion policy.

**Acceptance criteria:**

- [ ] Full roadmap and today items read the same canonical Unit progress, including legacy/current/mixed and grandfathered progress behavior.
- [ ] Each valid item exposes stable `questionId`, real `actualUnitId`/Unit name, subject metadata, Concept IDs, discriminated reason/completed state, and no required question title.
- [ ] `allComplete` is true only for a non-empty fully completed list; unmatched Units are omitted without mutating or reordering valid inputs.

**Verification:**

- [ ] Target GREEN: `pnpm vitest run tests/unit/roadmap.test.ts -t "buildRoadmapViewModel today plan"`
- [ ] Roadmap regression: `pnpm vitest run tests/unit/roadmap.test.ts`
- [ ] Affected importers: `pnpm test:related src/scenes/overworld/roadmap.ts src/shared/menuModel.ts tests/unit/roadmap.test.ts`

**Dependencies:** Task 3 has the intended RED failure; Wave 1/2 provider implementations remain unchanged.

**Files likely touched:**

- `src/scenes/overworld/roadmap.ts`

**Estimated scope:** Small — 1 source file.

## Checkpoint B: canonical plan path after Tasks 3–4

- [ ] Task 3 RED cases are GREEN without weakening existing roadmap assertions.
- [ ] `pnpm vitest run tests/unit/roadmap.test.ts` and the exact `pnpm test:related ...` command are GREEN.
- [ ] No local alias table, mastery aggregator, recommendation ranking, Asia/Tokyo boundary, or AttemptEvent completion logic was added.
- [ ] The existing node API, Concept completeness, review state, AND prerequisites, subject entry, fog, and layout behavior remain GREEN.

## Task 5: RED — supporting relations, deterministic purity, and v13 invariants

**Description:** Add focused tests for attaching the four approved projected supporting relation kinds while proving they never become hard locks. Add representative v13 and deep-immutability fixtures that detect changes to GameState, curriculum, plan, relation input, rewards, inventory, progression, or deterministic output.

**Acceptance criteria:**

- [ ] A `buildRoadmapViewModel supporting relations and purity` test group covers four kinds, target attachment, deduplication, stable ordering, and omission of missing endpoints.
- [ ] Nodes with and without supporting relations have identical prerequisites, blocked names, state, visibility, subject availability, progress, and practice eligibility.
- [ ] Fixed-`now` calls are deeply equal and leave v13 `updatedAt`、counters、attempts、mastery、reward markers、inventory、regional progress and every input collection unchanged.

**Verification:**

- [ ] Expected RED: `pnpm vitest run tests/unit/roadmap.test.ts -t "buildRoadmapViewModel supporting relations and purity"`
- [ ] Scope: `git diff --name-only` remains within the three owned files.

**Dependencies:** Checkpoint B complete; integrated `RoadmapRelationProjection` is available.

**Files likely touched:**

- `tests/unit/roadmap.test.ts`

**Estimated scope:** Small — 1 test file with v13 and immutable-input fixtures.

## Task 6: GREEN — attach non-lock relations without state mutation

**Description:** Consume the integrated relation projection and attach copied `supportingLinks` arrays to copied target nodes. Keep prerequisite semantics in the existing hard-lock path and avoid all save, snapshot, reward, battle selection, or mutation helpers.

**Acceptance criteria:**

- [ ] Only `component | transfer | related | chronological` links are attached, deduplicated, stable-sorted, and omitted when either endpoint is absent.
- [ ] Supporting links do not change locks, visibility, progress, practice eligibility, rewards, or the upstream relation projection.
- [ ] The builder never calls `ensureRoadmapMasterySnapshot`、`applyLearningRewards`、save APIs、battle question selection, or in-place array/object mutation.

**Verification:**

- [ ] Target GREEN: `pnpm vitest run tests/unit/roadmap.test.ts -t "buildRoadmapViewModel supporting relations and purity"`
- [ ] Roadmap regression: `pnpm vitest run tests/unit/roadmap.test.ts`
- [ ] Static boundary: `pnpm check:fast`

**Dependencies:** Task 5 has the intended RED failure; Tasks 2 and 4 remain GREEN.

**Files likely touched:**

- `src/scenes/overworld/roadmap.ts`

**Estimated scope:** Small — 1 source file.

## Checkpoint C: module behavior after Tasks 5–6

- [ ] Task 5 RED cases are GREEN and fixed-`now` output is deterministic.
- [ ] Focused module suite succeeds: `pnpm vitest run tests/unit/roadmap.test.ts`.
- [ ] Graphify-identified affected tests succeed: `pnpm test:related src/scenes/overworld/roadmap.ts src/shared/menuModel.ts tests/unit/roadmap.test.ts`.
- [ ] Reward regression succeeds: `pnpm vitest run tests/unit/learningRewards.test.ts tests/unit/askEnv.test.ts`.
- [ ] Battle 7割弱点／3割復習 selection remains unchanged: `pnpm vitest run tests/unit/questions.test.ts -t "弱い単元がだいたい 7割で選ばれる"`.
- [ ] `pnpm check:fast` and `git diff --check` succeed.

## Task 7: verify, review, commit atomically, and hand off

**Description:** Run the complete module verification story, perform the five-axis review, confirm strict ownership, create one logical implementation commit, and hand the commit to the integration owner. Do not wire UI/Overworld/export barrels or run the integration owner's full concurrent gates.

**Acceptance criteria:**

- [ ] Focused, related, reward, battle-selection, v13/input-purity, and static checks all pass with no unresolved correctness, readability, architecture, security, or performance finding.
- [ ] The implementation commit changes only `roadmap.ts`、`menuModel.ts`、`roadmap.test.ts`, contains no secret, generated output, todo update, or unrelated formatting, and is one revertable logical commit.
- [ ] The handoff reports branch, full commit ID, changed files, exact command results, provider implementation commit IDs, invariant confirmations, and integration-owner follow-ups.

**Verification:**

- [ ] `pnpm vitest run tests/unit/roadmap.test.ts`
- [ ] `pnpm test:related src/scenes/overworld/roadmap.ts src/shared/menuModel.ts tests/unit/roadmap.test.ts`
- [ ] `pnpm vitest run tests/unit/learningRewards.test.ts tests/unit/askEnv.test.ts`
- [ ] `pnpm vitest run tests/unit/questions.test.ts -t "弱い単元がだいたい 7割で選ばれる"`
- [ ] `pnpm check:fast`
- [ ] `git diff --check`
- [ ] `git diff --name-only` contains exactly the three owned implementation files before staging.
- [ ] `git diff --cached --check` and a staged secret scan succeed before commit.
- [ ] `git status --short --branch` contains only the branch header after commit.

**Dependencies:** Checkpoint C complete; no unresolved review finding.

**Files likely touched:**

- None — verification, review, commit, and handoff only.

**Estimated scope:** XS — 0 files changed by this task.

## Final clean and commit conditions

- [ ] RED test work was observed before each behavior implementation and no failing RED-only commit was created.
- [ ] One implementation commit contains all and only the three owned files; Phase 3 todo, SPEC, plan, content, UI, state, reward, policy, `Overworld.ts`, and `src/core/learning/index.ts` are absent from the commit.
- [ ] `SCHEMA_VERSION` remains 13; no migration, persistent daily plan, cache, save call, or autosave trigger was added.
- [ ] Unit reward remains one fragment at canonical `n >= 3 && value >= 0.8`; correction reward remains one fragment per third unique score-1 correction; both can still be earned by the same answer.
- [ ] Battle's existing weak/review 0.7 selection behavior is unchanged and no battle/query picker import enters the display builder.
- [ ] All GameState and provider inputs remain deeply unchanged; no `sort`、`push`、`splice` or assignment mutates caller-owned values.
- [ ] The branch is clean after the atomic implementation commit, and no merge or push to a shared branch was performed.

## Integration-owner handoff

This worker stops after Task 7 and reports the implementation commit. The integration owner owns the following work and files:

- [ ] Integrate the verified Wave 1/2 provider implementation commits before this module commit.
- [ ] Resolve any public export wiring in `src/core/learning/index.ts`; this worker must not edit it.
- [ ] Wire `RoadmapViewModel` through `src/scenes/Overworld.ts` into the child-roadmap UI; this worker must not edit Scene or UI files.
- [ ] Run `graphify update . --no-cluster` after material integration and inspect affected boundaries.
- [ ] Run the full gates once on the integrated state: `pnpm lint`、`pnpm check:architecture`、`pnpm test`、`pnpm validate:content`、`pnpm build`.
- [ ] Verify representative v13 import → answer → save → reload, reward/inventory/region preservation, answer-to-focus restoration, empty vs all-complete presentation, and the canonical `127.0.0.1:4174` preview.

## Explicitly excluded from these tasks

- `src/scenes/Overworld.ts` and `src/core/learning/index.ts`
- `src/ui/**`、CSS、i18n、focus、answer-return behavior、E2E、preview
- recommendation ranking、Asia/Tokyo day boundaries、AttemptEvent completion derivation
- adaptive battle/roadmap question selection and `roadmapPractice.ts`
- `GameState` schema/migrations、save APIs、reward implementation
- content、curriculum review data、Question contracts、renderers、schemas
- roadmap layout、zoom、pan、pinch、reduced-motion
- existing `tasks/plan.md`、`tasks/todo.md`、approved SPEC and plan

## Phase 3 completion checklist

- [x] Seven ordered tasks are recorded; each is one focused session and lists at most three candidate files.
- [x] Every behavior pair starts with a dedicated RED test task and has a GREEN implementation task.
- [x] Every task includes Description, no more than three acceptance criteria, exact verification commands, dependencies, files, and estimated scope.
- [x] Checkpoints follow Tasks 2, 4, and 6; final clean/commit conditions follow Task 7.
- [x] Wave gates, provider implementation commit requirements, ownership handoff, rewards, v13, battle selection, and input immutability are explicit.
- [x] Open questions: none.
