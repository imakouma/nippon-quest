# Spec: roadmap-relation-projection

## Objective

`content/curriculum/` の概念関係を、ロードマップが利用できる決定論的な単元関係へ投影する純粋な Core モジュールを定義する。

- `prerequisite` は単元の解放判定に使う唯一の関係とする。
- `component`、`transfer`、`related`、`chronological` は、解放を妨げない案内線として既存の表示 DTO へ投影する。
- 旧単元と現行単元の正規化は `unit-progress-normalization` の結果を受け取り、このモジュールで別実装しない。
- 循環、重複線、入力オブジェクトの変更を生じさせず、同じ入力から同じ順序の出力を返す。

対象ユーザーへの効果は、学習マップで「必ず先に身につける道」と「学びがつながる道」を区別して辿れることである。案内線によって練習やゲーム進行を新たにロックしない。

## Capability-map boundary

- Module id: `roadmap-relation-projection`
- Depends on: `unit-progress-normalization`
- Owned implementation: `src/core/learning/roadmapRelations.ts`
- Owned tests: `tests/unit/roadmapRelations.test.ts`
- Reused contracts:
  - `CurriculumGraph` / `ConceptRelation` from `src/core/learning/model.ts`
  - `RoadmapNode['supportingLinks']` and `RoadmapSupportingKind` from `src/shared/menuModel.ts`
  - canonical/display Unit resolver supplied from `unit-progress-normalization`
- Explicitly out of scope: `src/scenes/overworld/roadmap.ts`, `src/shared/menuModel.ts`, `src/ui/**`, `src/core/learning/index.ts`, curriculum JSON, schema generation, layout, visibility, node state, reward application, and persistence.

The integration owner will call this module from the roadmap/view-model work after the module is approved and implemented. This module does not wire itself into Scene or UI code.

## Existing behavior to preserve

The implementation must extract and narrow the behavior previously introduced by commit `aa94e708` (`feat: distinguish roadmap guidance from unlocks`) instead of redesigning it:

- concept relations are mapped to their display Units;
- misconception concepts, unresolved Units, and same-Unit relations are not rendered;
- `prerequisite` and supporting relations are kept in separate outputs;
- supporting links use the existing `{ sourceId, kind }` DTO;
- output is stably sorted.

The extraction corrects two gaps in that past implementation: it must prevent projected Unit cycles and must not emit overlapping duplicate lines.

## Public contract

The intended API shape is:

```ts
import type { CurriculumGraph } from './model';
import type { RoadmapNode } from '../../shared/menuModel';

type SupportingLink = NonNullable<RoadmapNode['supportingLinks']>[number];

export interface RoadmapRelationProjection {
  readonly prerequisiteIdsByTarget: ReadonlyMap<string, readonly string[]>;
  readonly supportingLinksByTarget: ReadonlyMap<string, readonly SupportingLink[]>;
}

export function projectRoadmapRelations(
  graph: Pick<CurriculumGraph, 'concepts' | 'relations'>,
  resolveDisplayUnitId: (unitId: string) => string | undefined,
): RoadmapRelationProjection;
```

The exact local type names may change during the approved implementation, but the following behavioral contract may not:

1. The Unit resolver is the boundary to `unit-progress-normalization`; relation projection must not copy or extend the alias table.
2. The function accepts curriculum data, not `GameState`, mastery, rewards, Scene objects, or UI state.
3. Every returned collection is newly allocated. The input graph, its nested arrays/objects, and resolver-owned data remain unchanged.
4. Output target keys, prerequisite source IDs, and supporting links are stable-sorted by Unit ID; supporting kinds use the fixed priority `component → transfer → related → chronological`.

## Projection rules

### Endpoint resolution

1. Build a concept-to-display-Unit lookup from non-`misconception` concepts using `resolveDisplayUnitId(concept.unit)`.
2. Ignore relations whose source or target concept is absent, is a misconception, or resolves to no displayed Unit.
3. Ignore relations whose source and target resolve to the same Unit.
4. Ignore relation kinds outside `prerequisite`, `component`, `transfer`, `related`, and `chronological`. In particular, `causal`, `spatial`, `category`, and `contrast` are not silently reclassified.

### Lock and guidance separation

- `prerequisite` contributes only to `prerequisiteIdsByTarget` and is the only output the lock predicate may consume.
- `component`, `transfer`, `related`, and `chronological` contribute only to `supportingLinksByTarget`.
- Supporting relations never enter prerequisite arrays, completion predicates, reward predicates, visibility gates, grade gates, or subject unlocks.
- If a directed Unit pair has both a `prerequisite` and any supporting relation, keep the prerequisite only. The hard edge already conveys the route and must not be visually duplicated.
- If multiple concept relations collapse to the same directed Unit pair and supporting kind, emit one link.
- If multiple supporting kinds collapse to the same directed Unit pair, emit one link using the fixed priority above. This avoids coincident duplicate paths while remaining deterministic.

### Cycle policy

The source model intentionally forbids cycles only for `prerequisite`, while a display layout requires an acyclic Unit graph. Projection therefore applies these rules:

1. Resolve, deduplicate, and sort all prerequisite Unit edges first.
2. A cycle among projected prerequisite Unit edges is invalid curriculum data. Throw a descriptive error; never drop a prerequisite silently, because that would weaken the lock contract.
3. Consider supporting candidates only after all prerequisite edges are present, in the fixed supporting-kind and Unit-ID order.
4. Omit a supporting candidate only when adding it would close a directed cycle in the combined display graph.
5. A different input array order must produce the same retained supporting subset and the same output order.

This policy preserves all valid hard requirements, keeps the runtime display safe, and permits semantically reciprocal non-prerequisite source data without creating a cyclic layout graph.

## Reward and save compatibility

Relation projection is read-only and has no reward or save authority.

- Preserve the existing mastery reward condition in `src/core/progression/learningRewards.ts`: at least 3 answers and mastery `>= 0.80`, awarded once per normalized Unit reward marker.
- Preserve the existing correction reward: a full-score correction of a previously missed, not-yet-counted question contributes toward one fragment per 3 distinct corrected questions.
- This module must not call `applyLearningRewards`, write `masteredRewardUnits` / `correctedRewardQuestionIds`, change reward IDs, or change reward quantities.
- Reward-ID normalization belongs to `unit-progress-normalization`; relation kinds and projected edges never affect reward eligibility.
- Do not add a `GameState` field, schema version, migration, counter, or serialized roadmap relation cache.
- Preserve `roadmapSnapshot.ts` grandfathering: previously earned roadmap progress remains open, and merely projecting or viewing relations cannot update the snapshot or any save field.
- Legacy/current/mixed save keys are resolved outside this module. The projector only receives their already-normalized display Unit resolver.
- Opening the roadmap with the same curriculum and resolver returns equivalent fresh output and leaves the save byte-for-byte unchanged.

## Tech stack and code style

- TypeScript strict mode.
- Pure Core logic; no Phaser, Preact, DOM, storage, clock, random number generator, or network dependency.
- Vitest for dedicated unit tests.
- No new package.

Keep the implementation as one small exported projection function plus private helpers only where they make deduplication or cycle detection readable. Prefer explicit names and immutable inputs over generic graph abstractions. Do not add a reusable graph framework for this module.

## Commands

Phase 1 specification verification:

```bash
git diff --check
git status --short
```

Approved implementation verification:

```bash
pnpm vitest run tests/unit/roadmapRelations.test.ts
pnpm test:related src/core/learning/roadmapRelations.ts tests/unit/roadmapRelations.test.ts
pnpm check:fast
```

The integration owner, after combining dependent modules, runs the repository-wide gates and browser preview defined in `AGENTS.md`. This isolated module must not run `pnpm check:full`, `pnpm test`, or `pnpm build` concurrently with other worktrees.

## Testing strategy

Implementation starts with failing tests and proceeds in the following order:

1. Project each of `component`, `transfer`, `related`, and `chronological` into the existing supporting-link DTO.
2. Keep `prerequisite` separate and prove that supporting kinds never appear in lock input.
3. Resolve legacy/current Unit IDs through the injected resolver without modifying its data.
4. Ignore unresolved concepts, misconception concepts, same-Unit edges, and non-display relation kinds.
5. Collapse repeated concept edges to one Unit edge; prove prerequisite dominance and fixed supporting-kind priority on overlaps.
6. Reject a projected prerequisite cycle with a descriptive error.
7. Deterministically omit only supporting edges that would close a combined display cycle.
8. Shuffle concepts and relations and prove byte-equivalent normalized output ordering.
9. Deep-freeze or snapshot the graph and resolver inputs and prove they remain unchanged after success and error paths.
10. Assert the final directed Unit graph contains neither duplicate pairs nor cycles.

No browser test is owned by this module because it creates no UI. Rendering of the projected DTO is verified by `roadmap-view-model` and `child-roadmap-experience` after integration.

## Boundaries

### Always

- Reuse existing curriculum and roadmap DTOs.
- Normalize endpoints only through the dependency-provided resolver.
- Keep the function deterministic, pure, and Scene/UI independent.
- Preserve the distinction between hard prerequisites and non-lock guidance.
- Deduplicate and cycle-check after Unit normalization, not only at concept level.
- Add behavior with a RED dedicated test first after this specification is approved.
- Touch only the owned implementation and dedicated test during the implementation phase.

### Ask first

- Any change to `src/questions/contracts.ts`, `src/core/learning/model.ts`, curriculum schema, or `src/shared/menuModel.ts`.
- Any change to `GameState`, schema version, migrations, `roadmapSnapshot.ts`, or persistence.
- Any change to the 3-answer / 0.80 mastery reward condition, correction reward condition, reward ID, or reward quantity.
- Adding a supported relation kind, changing the supporting-kind priority, or changing cycle/overlap policy.
- Treating unresolved endpoints as fatal instead of ignored.
- Adding a dependency or exporting the module through `src/core/learning/index.ts` from this worktree.

### Never

- Use a supporting relation to lock a Unit, subject, practice action, or game progression.
- Infer or author new curriculum relations from Unit order, grade, labels, or AI judgment.
- Mutate `CurriculumGraph`, Unit normalization data, `GameState`, reward state, or UI state.
- Write to storage, migration state, counters, or snapshot markers while projecting.
- Edit `roadmap.ts`, `menuModel.ts`, UI files, curriculum JSON, generated schemas, or unrelated changes in this module's implementation commit.
- Use `Math.random`, clock time, unstable insertion order, or input array order as a tie-breaker.
- Silently drop a prerequisite to repair a cycle.

## Success criteria

- All four supporting kinds project to the existing `{ sourceId, kind }` DTO and never enter prerequisite arrays.
- Only `prerequisite` can contribute to a lock predicate.
- Legacy/current Unit aliases collapse through the supplied normalizer to the same display edge.
- Same-Unit, unresolved, misconception, and unsupported-kind relations do not produce display edges.
- A directed Unit pair produces at most one visible line; prerequisite wins over guidance, and supporting overlaps use the documented priority.
- Valid prerequisite edges are retained exactly once; a projected hard cycle fails explicitly.
- The combined returned graph is acyclic and duplicate-free, including when source supporting relations are reciprocal or cyclic.
- Output is stable across repeated calls and shuffled input arrays.
- The curriculum graph, resolver-owned data, rewards, save data, snapshot markers, and schema version are unchanged.
- Existing reward thresholds and grandfathered progress behavior remain unchanged.
- Dedicated Vitest tests, related tests, and `pnpm check:fast` pass after implementation.
- No files outside the owned implementation and dedicated test are changed in the implementation commit.

## Not doing

- Wiring projected relations into `roadmap.ts`, `menuModel.ts`, layout, or UI.
- Changing curriculum content or relation review status.
- Rebuilding the prerequisite graph or introducing a named Strand taxonomy.
- Persisting projected relations or caching them in save data.
- Changing mastery, review, recommendation, subject unlock, reward, or practice selection policy.
- Guaranteeing educational correctness through structural tests; human curriculum review remains required.

## Open questions

- The exact exported resolver symbol from `unit-progress-normalization` is not present at base commit `8dfff95c`. The integration contract is fixed as `string -> display Unit ID | undefined`; the implementation should adopt the approved Wave 1 symbol without changing projection behavior.
- Human approval is required for the proposed deterministic handling of supporting cycles and cross-kind overlaps. Approval of this specification resolves that decision; otherwise revise the cycle/priority sections before implementation.
