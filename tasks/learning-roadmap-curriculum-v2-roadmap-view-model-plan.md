# Implementation Plan: 学習ロードマップ表示モデル

## Status

- Capability module: `roadmap-view-model`
- Approved specification: `SPEC-roadmap-view-model.md`
- Capability map: `CAPABILITY_MAP-learning-roadmap-curriculum-v2.md`
- Planning base: `codex/lr-v2-view-model` at `279c706ff2f425f7cef431c4858b7337d5a87206`
- Phase: 2 — technical implementation plan only
- Implementation status: not started
- Open questions: none

この文書は Phase 3 実装の順序と検証境界を定める。既存の `tasks/plan.md` と `tasks/todo.md` は別作業の未完了計画であり、変更しない。ユーザー指示に従い、この Phase 2 では別の todo ファイルも作らない。

## Overview

既存の純粋なロードマップビルダーへ、先行モジュールが返す今日プランと非ロック関係を合成し、UI がそのまま描画できる `RoadmapViewModel` を返す。全ロードマップと今日プランは `canonicalUnitId` と `aggregateUnitMastery` による同一の正規 Unit 進捗を使い、既存の `buildRoadmapNodes` / `buildGameRoadmapNodes` 利用者を壊さない。

実装は additive contract-first とし、`GameState`、教材グラフ、推薦結果を変更しない。ロードマップ表示は保存、報酬付与、schema migration を起動しない。

## Evidence and current architecture

### Current implementation

- `src/scenes/overworld/roadmap.ts`
  - Phaser / DOM 非依存の `buildRoadmapNodes` と `buildGameRoadmapNodes` を持つ。
  - Unit alias、mastery 集約、Concept 完全性、復習期限、前提、霧、layout を一つの純粋処理で構築する。
  - 現在は today plan と supporting relation を出力しない。
- `src/shared/menuModel.ts`
  - Scene と UI の中立契約であり、既存 `RoadmapNode` と `supportingLinks` を定義する。
  - today plan と `RoadmapViewModel` の型は未定義。
- `tests/unit/roadmap.test.ts`
  - legacy/current Unit、既得進捗、Concept 完全性、AND 前提、霧、layout、旧問題選択を検証する。
  - 表示モデル、allComplete、reason union、supporting relation、v13 不変性のテストは未実装。

### Graphify code-only findings

`graphify-out/graph.json` は code-only / no-cluster で生成済み。外部 LLM と semantic labeling は使っていない。

- `graphify affected "src/scenes/overworld/roadmap.ts" --depth 3`
  - `src/scenes/Overworld.ts`、`roadmapPractice.ts`、`roadmapLayoutData.test.ts`、教科別教材回帰テストなどが直接 import する。
- `graphify affected "src/shared/menuModel.ts" --depth 3`
  - `MenuOverlay.tsx`、`RoadmapView.tsx`、`RoadmapGraph.tsx`、`ParentOverlay.tsx`、Scene helper、UI tests が参照する。

この影響範囲から、既存 export や `RoadmapNode` フィールドの削除・改名は行わず、新型と新 builder を追加する。既存の全利用者を一括移行する変更は統合担当の範囲とする。

## Implementation scope

### Files this module may modify

| File                              | Planned change                                                                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/menuModel.ts`         | `RoadmapPendingReason`、`RoadmapCompletedReason`、判別可能な `RoadmapTodayItem`、`RoadmapTodayPlanView`、`RoadmapViewModel` を additive に定義する |
| `src/scenes/overworld/roadmap.ts` | 先行モジュールの出力を既存 nodes と合成する純粋 `buildRoadmapViewModel` を追加し、既存 builder を互換維持する                                      |
| `tests/unit/roadmap.test.ts`      | RED fixtures と、共通進捗、today plan、relations、純粋性、v13 互換の unit tests を追加する                                                         |

### Read-only dependencies

- `src/core/learning/unitAliases.ts`: `canonicalUnitId`
- Wave 1 `src/core/learning/unitProgress.ts`: `aggregateUnitMastery`
- Wave 2 `src/core/learning/learningPlan.ts`: 最大3件、完了復元、`allComplete` の元となる plan output
- Wave 2 `src/core/learning/recommendationPolicy.ts`: 未完了4 reason と `actualUnitId`
- Wave 2 `src/core/learning/roadmapRelations.ts`: Unit へ投影済みの supporting relations
- `src/scenes/overworld/roadmapLayout.ts`: 既存の決定論的座標
- `src/core/state/roadmapSnapshot.ts`: 既得進捗 ID の読み取り
- `src/core/state/newGame.ts`: v13 相当 fixture の作成
- `src/core/progression/learningRewards.ts`: 維持すべき報酬条件の正

実装開始前に統合担当が Wave 1/2 を取り込んだ基点へ同期し、上記公開シンボルが存在することを確認する。存在しない場合はローカル代替を作らず、統合担当へ基点更新を依頼して停止する。

## Explicitly out of scope

- `src/scenes/Overworld.ts` への配線
- `src/core/learning/index.ts` の export 変更
- `src/ui/**`、`content/i18n/ja.json`、CSS、focus 実装、回答後復帰
- 推薦順位、Asia/Tokyo 日境界、AttemptEvent の完了判定
- `src/scenes/overworld/roadmapPractice.ts` の適応出題
- `src/core/state/schema.ts`、`migrations.ts`、save API、永続フィールド
- `src/core/progression/learningRewards.ts` と報酬条件
- 教材 JSON、curriculum relation、Question 契約、schema、renderer
- roadmap layout、zoom、pan、pinch、reduced-motion
- E2E、4174 preview、full integration gate
- 既存 `tasks/plan.md`、`tasks/todo.md`、新しい Phase 3 todo ファイル

## Dependency graph and implementation order

```text
Wave 1: unit-progress-normalization
  ├─ canonicalUnitId
  └─ aggregateUnitMastery
            │
            ├───────────────┐
            ▼               ▼
Wave 2: learning plan   Wave 2: roadmap relation projection
  ├─ pending reason       └─ component / transfer / related / chronological
  ├─ completed restore                 │
  ├─ actualUnitId                      │
  └─ questionId                        │
            │                          │
            └──────────────┬───────────┘
                           ▼
Slice 1: shared DTO + empty view-model path
                           │
                           ▼
Slice 2: canonical progress + today plan projection
                           │
                           ▼
Slice 3: supporting relations + purity / v13 guards
                           │
                           ▼
Module verification and integration handoff
```

Slices are sequential. Slice 1 defines the provider/consumer contract used by Slices 2 and 3. Slice 2 establishes the single progress source before Slice 3 proves relations do not influence progress or locks. Parallel implementation inside this module is not safe because all slices share `roadmap.ts` and `roadmap.test.ts`.

## TDD and RED policy

For every behavioral slice:

1. Add one or more focused tests to `tests/unit/roadmap.test.ts`.
2. Run `pnpm vitest run tests/unit/roadmap.test.ts` and confirm the new test fails for the intended missing behavior, not for fixture or import errors.
3. Implement the minimum behavior in owned source files.
4. Re-run the focused test to GREEN.
5. Refactor only duplicated logic introduced by that slice; re-run the focused test.

Type-only DTO additions are verified through the slice's runtime builder test plus `pnpm check:fast`; no compile-only type fixture or new test file is added. Existing passing tests are not disabled, rewritten to weaker assertions, or moved.

Each slice must leave the three owned files internally coherent and focused tests GREEN. Per the Capability Map's one-logical-commit rule, RED/GREEN checkpoints remain working-tree steps and the completed implementation is committed once after all slices and module verification pass.

## Thin implementation slices

### Slice 1 — Add the shared contract and empty display-model path

**Goal:** Establish an additive, Scene-neutral contract and a minimal end-to-end builder that returns existing nodes plus an empty today-plan state.

**Dependencies:** Integrated Wave 1 `canonicalUnitId` / `aggregateUnitMastery` and Wave 2 plan/relation public contracts are present; no prior local slice.

**RED test first:**

- Import `buildRoadmapViewModel` and assert that existing roadmap input produces the same nodes as `buildRoadmapNodes`.
- Assert `todayPlan.items` is empty and `todayPlan.allComplete` is `false` when the upstream plan is empty.
- Assert the legacy `buildRoadmapNodes` result remains unchanged.

**Implementation:**

- Add approved DTOs to `src/shared/menuModel.ts` without changing existing `RoadmapNode`, `MenuEntry`, or menu tab contracts.
- Add `buildRoadmapViewModel` as a pure additive export in `roadmap.ts`.
- Keep `buildRoadmapNodes` and `buildGameRoadmapNodes` signatures and behavior compatible.

**Acceptance criteria:**

- [ ] Existing node builder tests remain byte-for-byte behaviorally equivalent.
- [ ] Empty candidates are represented as `{ items: [], allComplete: false }`.
- [ ] No UI, Scene integration, state, reward, or content file changes.

**Verification:**

- RED/GREEN: `pnpm vitest run tests/unit/roadmap.test.ts`
- Contract/architecture: `pnpm check:fast`

**Files likely touched:**

- `src/shared/menuModel.ts`
- `src/scenes/overworld/roadmap.ts`
- `tests/unit/roadmap.test.ts`

**Estimated scope:** Medium — 3 files.

### Checkpoint A — Contract compatibility

- [ ] Slice 1 focused tests are GREEN.
- [ ] `pnpm check:fast` succeeds.
- [ ] `git diff --name-only` lists only the three owned files.
- [ ] Existing exports and `RoadmapNode` fields remain available.

### Slice 2 — Project canonical progress and today-plan items

**Goal:** Map upstream pending/completed plan items to honest Unit metadata and the same progress values used by full-roadmap nodes.

**Dependencies:** Slice 1 is GREEN; integrated Wave 1/2 exports passed the preflight contract check.

**RED test first:**

- legacy/current/mixed mastery produces one canonical `actualUnitId` and the same `mastery`, `attempts`, `retention`, and `state` in node and today item.
- Pending items accept only `due-review | weak-prerequisite | unseen-primary | unseen-question` with `completed: false`.
- Restored items accept only `review | diagnosis` with `completed: true`, including score 0 completion supplied by upstream.
- `questionId` remains unchanged as the stable item ID/focus target.
- 0/1/2/3 item order is preserved; no question title is required.
- `allComplete` is false for zero or partially incomplete items and true only for one or more fully completed items.

**Implementation:**

- Replace roadmap-local alias/mastery aggregation with the integrated `canonicalUnitId` and `aggregateUnitMastery` dependency path where applicable; do not add a near-duplicate helper.
- Resolve `actualUnitId` to the already-created canonical node and project Unit name, subject, subject label, grade, Concept IDs, and node progress.
- Omit invalid plan items whose canonical Unit has no node, while preserving the relative order of valid items.
- Derive `allComplete` with the explicit non-empty guard.
- Do not recalculate recommendation rank, completion day, or AttemptEvent reason.

**Acceptance criteria:**

- [ ] Full roadmap and today plan expose identical progress for the same canonical Unit.
- [ ] The `completed` discriminant and reason values cannot form an invalid combination.
- [ ] Weak-prerequisite items show the real `actualUnitId` and Unit name, not the original goal.
- [ ] `questionId` is stable and unique according to the upstream plan order.
- [ ] Inputs are not sorted or mutated in place.

**Verification:**

- RED/GREEN: `pnpm vitest run tests/unit/roadmap.test.ts`
- Related importers after GREEN: `pnpm test:related src/scenes/overworld/roadmap.ts src/shared/menuModel.ts tests/unit/roadmap.test.ts`

**Files likely touched:**

- `src/scenes/overworld/roadmap.ts`
- `tests/unit/roadmap.test.ts`

**Estimated scope:** Small — 2 files.

### Slice 3 — Attach supporting relations and guard purity/v13 compatibility

**Goal:** Add the four approved non-lock relation lines without affecting prerequisites, locks, rewards, saves, or inputs.

**Dependencies:** Slices 1 and 2 are GREEN; the integrated relation projection returns Unit-level source/target/kind records.

**RED test first:**

- `component`、`transfer`、`related`、`chronological` are attached to the target node as `{ sourceId, kind }`.
- Duplicate `sourceId + targetId + kind` relations collapse to one and return in stable `sourceId`, then `kind` order.
- Missing source/target nodes are omitted.
- Adding supporting relations leaves `prerequisiteIds`, `blockedByNames`, `state`, `visibility`, subject availability, and today progress unchanged.
- A representative v13 `GameState` fixture, curriculum, plan, and relation input remain deeply equal before/after building the view model.
- `updatedAt`、`progress.counters`、`learning.attempts`、`learning.mastery`、reward marker arrays、inventory、region progress remain unchanged.

**Implementation:**

- Consume the integrated `roadmap-relation-projection` output; do not infer Concept direction or accept other relation kinds.
- Attach a new `supportingLinks` array to copied nodes; never push into input nodes or curriculum arrays.
- Keep `prerequisite` handling in the existing hard-lock path only.
- Do not call `ensureRoadmapMasterySnapshot`, `applyLearningRewards`, save APIs, or mutation helpers.

**Acceptance criteria:**

- [ ] Only the four approved supporting kinds reach the UI contract.
- [ ] Supporting relations never change lock, visibility, progress, practice eligibility, or rewards.
- [ ] Repeated calls with fixed `now` return deeply equal DTOs.
- [ ] Representative v13 state and all input collections remain unchanged.

**Verification:**

- RED/GREEN: `pnpm vitest run tests/unit/roadmap.test.ts`
- Related importers: `pnpm test:related src/scenes/overworld/roadmap.ts src/shared/menuModel.ts tests/unit/roadmap.test.ts`
- Static gates: `pnpm check:fast`

**Files likely touched:**

- `src/scenes/overworld/roadmap.ts`
- `tests/unit/roadmap.test.ts`

**Estimated scope:** Small — 2 files.

### Checkpoint B — Module complete

- [ ] All Slice 1–3 acceptance criteria are met.
- [ ] `pnpm vitest run tests/unit/roadmap.test.ts` succeeds.
- [ ] `pnpm test:related src/scenes/overworld/roadmap.ts src/shared/menuModel.ts tests/unit/roadmap.test.ts` succeeds.
- [ ] `pnpm check:fast` succeeds.
- [ ] `git diff --check` succeeds.
- [ ] Five-axis review finds no unresolved correctness, readability, architecture, security, or performance issues.
- [ ] Only the three owned implementation files are changed.
- [ ] One atomic implementation commit is ready for integration handoff.

## Focused verification matrix

| Contract                       | Test evidence                                       | Command                                                                                                |
| ------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Existing roadmap compatibility | Existing node, prerequisite, fog, layout tests      | `pnpm vitest run tests/unit/roadmap.test.ts`                                                           |
| Canonical progress reuse       | legacy/current/mixed node vs today item equality    | `pnpm vitest run tests/unit/roadmap.test.ts`                                                           |
| Today-plan contract            | 0–3 items, reason union, focus ID, allComplete      | `pnpm vitest run tests/unit/roadmap.test.ts`                                                           |
| Supporting relations           | four kinds, dedupe, stable order, no-lock invariant | `pnpm vitest run tests/unit/roadmap.test.ts`                                                           |
| v13 and input purity           | deep-equality fixture assertions                    | `pnpm vitest run tests/unit/roadmap.test.ts`                                                           |
| Graphify-identified importers  | related Vitest selection                            | `pnpm test:related src/scenes/overworld/roadmap.ts src/shared/menuModel.ts tests/unit/roadmap.test.ts` |
| Type, lint, architecture       | repository fast gate                                | `pnpm check:fast`                                                                                      |

Do not run `pnpm test`、`pnpm build`、`pnpm check:full` concurrently in the worker worktree. Those full gates belong to the integration owner after all Wave 3 commits are integrated.

## Existing behavior invariants

### Rewards

- Unit reward remains one `learning-fragment` when mastery first reaches `n >= 3 && value >= 0.8` for the canonical Unit.
- Correction reward remains one fragment per third unique prior mistake corrected with score 1.
- Display creation and `allComplete` never call or emulate `applyLearningRewards`.
- `masteredRewardUnits` and `correctedRewardQuestionIds` are read-only to this module.

### v13 saves

- `SCHEMA_VERSION` remains 13.
- No schema, migration, persistent daily-plan snapshot, relation cache, or setting is added.
- Existing roadmap-grandfathered counters are read-only inputs.
- Building the view model does not change `updatedAt` or trigger save/autosave.

### Ownership and compatibility

- Existing `buildRoadmapNodes` / `buildGameRoadmapNodes` exports remain available to Graphify-identified consumers.
- `RoadmapNode` existing fields remain source-compatible.
- UI and integration owners consume the additive `RoadmapViewModel`; this worker does not edit their files.

## Risks and mitigations

| Risk                                                              | Impact                                            | Mitigation                                                                                                           |
| ----------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Wave 1/2 public names or shapes differ from the approved contract | High — duplicate logic or failed integration      | Preflight exact exports after syncing the integration base; stop rather than create local substitutes                |
| Replacing local mastery merge changes legacy/current behavior     | High — progress or rewards appear rolled back     | Characterize existing behavior first; RED fixtures cover legacy/current/mixed equivalence and grandfathered progress |
| `Array.every` makes an empty plan look complete                   | Medium — UI shows false celebration               | Require `items.length > 0 && items.every(...)` and test empty/partial/full cases                                     |
| Completed and pending reason values are mixed                     | Medium — wrong explanation or impossible UI state | Use `completed` as the discriminant and assert all six allowed combinations by category                              |
| Shared DTO breaks many UI/Scene importers                         | High — wide compile failure                       | Make additions only; preserve existing exports and run Graphify-driven related tests plus `pnpm check:fast`          |
| Supporting relations accidentally become prerequisites            | High — new hard locks                             | Keep separate `supportingLinks`; compare nodes with/without relations for identical state/visibility/prerequisites   |
| In-place sorting mutates upstream plan, relations, or GameState   | High — non-deterministic save changes             | Sort copies, attach copied arrays/nodes, and deep-compare frozen or cloned fixtures                                  |
| Invalid actual Unit creates a broken action                       | Medium — unusable today card                      | Omit unmatched items and add a fixture that detects the upstream contract violation                                  |
| `roadmap.ts` grows into another large integration point           | Medium — architecture budget pressure             | Add only small pure projection helpers; no policy, persistence, UI text, or generic abstraction                      |

## Integration-owner handoff

The completed worker handoff must include:

- branch name and single implementation commit ID
- changed-file list limited to the three owned files
- exact focused and related test results
- `pnpm check:fast` result
- confirmation that v13 fixture and reward-related fields remain unchanged
- confirmation that no UI, `Overworld.ts`, `index.ts`, state schema/migration, reward, content, or todo file changed

The integration owner then:

1. Integrates Wave 1/2 dependencies before this module commit if not already present.
2. Updates `src/core/learning/index.ts` exports if the integrated public surface requires it.
3. Wires `RoadmapViewModel` into `src/scenes/Overworld.ts` and the `child-roadmap-experience` UI without changing this module's progress semantics.
4. Runs `graphify update . --no-cluster` after material integration and checks affected boundaries.
5. Runs the repository integration gates once: `pnpm lint`、`pnpm check:architecture`、`pnpm test`、`pnpm validate:content`、`pnpm build`.
6. Verifies answer → roadmap focus restoration, reload stability, empty vs all-complete UI, representative v13 import/save/reload, and the integrated `127.0.0.1:4174` preview.

## Rollback

The future implementation is one module-scoped commit. Integration can revert that commit without schema migration or data rollback because this capability adds only derived DTOs and pure projection behavior. If UI integration has already landed, revert or adjust the consumer commit first, then revert the provider commit.

## Phase 2 completion checklist

- [x] Plan covers target and non-target scope.
- [x] Dependency graph and sequential order are explicit.
- [x] Every implementation slice has acceptance criteria, RED policy, verification, dependencies, and no more than five candidate files.
- [x] Checkpoints exist after contract foundation and module completion.
- [x] Rewards, v13 compatibility, ownership, and integration handoff are explicit.
- [x] Existing unrelated plan/todo files are untouched.
- [x] No implementation, test, UI, content, or todo file is changed in Phase 2.
- [x] Open questions: none.
