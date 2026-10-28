# Implementation Plan: curriculum-concept-connectivity

## Status

Phase 2 plan for human approval. `SPEC-curriculum-concept-connectivity.md` is approved. Implementation has not started.

The repository contains unrelated active plans, so this module uses the dedicated task list `tasks/curriculum-concept-connectivity-todo.md` and leaves `tasks/plan.md` / `tasks/todo.md` untouched.

## Objective

Connect the current 30 isolated curriculum Concepts with at least 30 evidence-backed relations, bringing the merged Concept graph from 395 to at least 425 relations and from 30 to 0 isolated Concepts. Add a regression-safe Concept-level audit while preserving the existing 280-Unit roadmap, its 336 prerequisite edges, and 0 isolated Units.

## Planning Inputs

- `SPEC-curriculum-concept-connectivity.md`
- `.agent/rules/nihonquest.md`
- `docs/00_GAME_DESIGN.md`
- `docs/01_ARCHITECTURE.md`
- `SPEC-learning-skill-tree.md`
- `SPEC-roadmap-relation-projection.md`
- Existing source records embedded in the 11 target curriculum fragments

## Current Baseline

| Metric | Current | Target |
|---|---:|---:|
| Curriculum fragments | 75 | 75 |
| Concept occurrences | 358 | 358 |
| Merged unique Concepts | 357 | 357 |
| Relations | 395 | at least 425 |
| `prerequisite` relations | 369 | evidence-dependent; must not decrease |
| Isolated Concepts | 30 | 0 |
| Unit nodes | 280 | 280 |
| Unit prerequisite edges | 336 | at least 336 |
| Isolated Units | 0 | 0 |

The 30 isolated Concepts are distributed as follows:

- Kokugo: 12
- Sansu: 7, including 3 `misconception` Concepts
- Seikatsu: 10
- Shakai: 1
- Rika / Eigo: 0

No target curriculum file currently has an academic-review ledger entry whose hash must be rewritten. Human `expert-reviewed` status is outside this work.

## Stack and Tooling

- Node `>=20`
- pnpm `10.28.0`
- TypeScript `^5.6.3`
- Zod `4.6.6`, with the existing curriculum model importing `zod/v3`
- Vitest `^4.1.12`
- Existing `tsx` audit scripts

No framework API or dependency change is planned. Source verification concerns the official curriculum documents already registered in the JSON fragments, not a new runtime API.

## Graphify Findings

The existing code-only graph identifies these boundaries:

- `mergeCurriculumGraphs()` owns global Concept identity, relation endpoint validation, and prerequisite-cycle validation.
- `buildCurriculumGraphQuality()` owns the current Unit-level structural report and is the smallest appropriate place for Concept-level quality metrics.
- `audit-roadmap-graph.ts` is the user-facing strict audit and should consume the shared quality report instead of duplicating graph logic.
- `roadmap.ts`, `roadmapRelations.ts`, UI DTOs, save data, rewards, and question contracts are downstream consumers and do not need changes.

## Architecture Decisions

1. **Source matrix before content edits.** Every proposed relation is recorded with both endpoints, kind, direction, source ID, locator, and rationale before the JSON changes.
2. **One relation per baseline isolated Concept at minimum.** Each of the 30 baseline isolated Concepts participates in at least one newly added relation; the total addition is at least 30 relations.
3. **Hard locks remain exceptional.** Use `prerequisite` only for required learning order. Use `contrast` for misconceptions, `chronological` for seasonal sequences, and `related` / `transfer` when ordering is not required.
4. **Concept quality lives beside Unit quality.** Extend `buildCurriculumGraphQuality()` with a deterministic merged-Concept summary rather than adding an ad-hoc second parser to the script.
5. **Strict audit guards the result.** `audit-roadmap-graph --strict` fails when merged isolated Concepts remain, while continuing to enforce existing Unit-level gates.
6. **No contract change.** The existing relation schema already supports all required kinds. Do not modify `model.ts`, generated schemas, or question contracts.
7. **No runtime behavior change.** Non-prerequisite relations remain guidance-only; misconception Concepts remain excluded from Unit unlock projection.

## Dependency Graph

```text
approved SPEC
    │
    ├── Task 1: source/evidence matrix
    │        │
    │        └──────────────────────────────┐
    │                                       │
    └── Task 2: RED→GREEN Concept audit     │
             │                              │
             └──────────────┬───────────────┘
                            ▼
                 Tasks 3–8: subject slices
                  Kokugo → Sansu → Seikatsu → Shakai
                            │
                            ▼
                 Task 9: full gates, preview, review
```

Subject slices are sequential in this worktree to avoid overlapping JSON edits and to give every failed validator one clear cause.

## Implementation Sequence

### Task 1: Create the relation evidence matrix

**Description:** Read the exact MEXT curriculum commentary/codes and the registered publisher sequence documents for the target Concepts. Record at least 30 candidate relations before editing curriculum JSON.

**Acceptance criteria:**

- All 30 baseline isolated Concept IDs appear in the matrix.
- Each proposed edge records `from`, `to`, relation kind, source ID, locator, direction rationale, and intended target JSON.
- Misconceptions are never `prerequisite`; reverse-grade and cross-subject hard-lock candidates are rejected before implementation.
- Only official MEXT or registered publisher sources are used; no secondary blog or AI summary is treated as evidence.

**Verification:**

- Compare the matrix Concept IDs with the baseline isolated-ID list and require an empty set difference.
- Manually review all `prerequisite` directions for grade and subject monotonicity.
- Run `git diff --check -- tasks/curriculum-concept-connectivity-evidence.md`.

**Files likely touched:**

- `tasks/curriculum-concept-connectivity-evidence.md`

**Estimated scope:** Small — 1 file.

### Task 2: Add Concept-level quality reporting with TDD

**Description:** Extend the pure graph-quality report and strict audit to expose merged Concept count, total relations, relation-kind counts, and isolated Concept IDs.

**Acceptance criteria:**

- A RED unit test first proves the missing Concept-level report, including deterministic sorting and a duplicate Concept occurrence that merges to one unique Concept.
- The GREEN implementation reports the current baseline as 357 unique Concepts, 395 relations, and 30 isolated Concepts.
- `audit-roadmap-graph` prints the Concept summary and `--strict` includes isolated Concepts in its failure policy without changing existing Unit checks.

**Verification:**

```bash
pnpm vitest run tests/unit/curriculumGraphQuality.test.ts
pnpm audit:roadmap-graph
pnpm test:related src/core/learning/graphQuality.ts tests/unit/curriculumGraphQuality.test.ts scripts/audit-roadmap-graph.ts
```

Record the expected RED assertion before implementation and GREEN output afterward.

**Files likely touched:**

- `src/core/learning/graphQuality.ts`
- `tests/unit/curriculumGraphQuality.test.ts`
- `scripts/audit-roadmap-graph.ts`

**Estimated scope:** Medium — 3 files.

### Checkpoint A: Evidence and guardrail ready

- [ ] All 30 Concepts have approved candidate relations.
- [ ] The focused quality test is GREEN after recording a trustworthy RED.
- [ ] The non-strict audit reproduces 357 / 395 / 30.
- [ ] Strict audit fails only because the 30 content relations are not implemented yet.

### Task 3: Connect the six Kokugo grade-1 Concepts

**Description:** Add at least six relations covering the five legacy-foundation Concepts and `writing.word-connections`, following kana → word/sentence progression without inventing hard dependencies.

**Acceptance criteria:**

- Each of the six baseline isolated IDs participates in a new evidence-matrix relation.
- At least six relations are added across the two files.
- Same-Unit sequencing uses `prerequisite` only when the source explicitly supports order; word-play or lateral language activities use non-lock relations when appropriate.

**Verification:**

```bash
pnpm validate:curriculum-graph
pnpm audit:roadmap-graph
pnpm test:related content/curriculum/kokugo-g1-legacy-foundations.json content/curriculum/kokugo-g1-term1.json
```

**Files likely touched:**

- `content/curriculum/kokugo-g1-legacy-foundations.json`
- `content/curriculum/kokugo-g1-term1.json`

**Estimated scope:** Small — 2 files.

### Task 4: Connect the six Kokugo grade-2/3 Concepts

**Description:** Add at least six relations for grade-2 kanji recognition/readings and grade-3 idiom, sentence-structure, and accurate-copying Concepts.

**Acceptance criteria:**

- All six baseline isolated IDs participate in new relations.
- At least six relations are added across the three fragments.
- Kanji recognition precedes reading classification only where supported; idiom/koji-seigo and copying links do not become artificial Unit locks.

**Verification:**

```bash
pnpm validate:curriculum-graph
pnpm audit:roadmap-graph
pnpm test:related content/curriculum/kokugo-g2-foundations.json content/curriculum/kokugo-g3-term1.json content/curriculum/kokugo-g3-term2.json
```

**Files likely touched:**

- `content/curriculum/kokugo-g2-foundations.json`
- `content/curriculum/kokugo-g3-term1.json`
- `content/curriculum/kokugo-g3-term2.json`

**Estimated scope:** Medium — 3 files.

### Checkpoint B: Kokugo complete

- [ ] Kokugo isolated Concepts decrease from 12 to 0.
- [ ] At least 12 total relations have been added.
- [ ] No prerequisite cycle, reverse-grade edge, duplicate relation, or Unit regression appears.

### Task 5: Connect the five Sansu grade-1 Concepts

**Description:** Connect addition-within-ten and clock-reading to their established learning chains, and connect the three misconception Concepts to their correct counterparts using `contrast` or another non-lock relation.

**Acceptance criteria:**

- All five grade-1 baseline isolated IDs participate in new relations.
- At least five relations are added.
- No `misconception` Concept is the source or target of a `prerequisite` relation.
- Existing question-link diagnostic signals and review states remain unchanged.

**Verification:**

```bash
pnpm validate:curriculum-graph
pnpm audit:roadmap-graph
pnpm test:related content/curriculum/sansu-g1-foundations.json content/curriculum/sansu-g1-term2.json
```

**Files likely touched:**

- `content/curriculum/sansu-g1-foundations.json`
- `content/curriculum/sansu-g1-term2.json`

**Estimated scope:** Small — 2 files.

### Task 6: Connect the two Sansu grade-2 Concepts

**Description:** Connect composing and ordering numbers above 1000 to the established place-value progression with at least two source-backed relations.

**Acceptance criteria:**

- Both baseline isolated IDs participate in new relations.
- At least two relations are added.
- The direction follows place-value composition/representation toward comparison and order, without creating a reverse-grade edge or cycle.

**Verification:**

```bash
pnpm validate:curriculum-graph
pnpm audit:roadmap-graph
pnpm test:related content/curriculum/sansu-g2-term1.json
```

**Files likely touched:**

- `content/curriculum/sansu-g2-term1.json`

**Estimated scope:** Small — 1 file.

### Checkpoint C: Sansu complete

- [ ] Sansu isolated Concepts decrease from 7 to 0.
- [ ] At least 19 cumulative relations have been added across Kokugo and Sansu.
- [ ] All three misconception relations are non-lock relations.

### Task 7: Connect the ten Seikatsu Concepts

**Description:** Add at least ten relations covering grade-1 home, living-things, seasons, and making/playing Concepts plus grade-2 public-place safety and self-growth Concepts.

**Acceptance criteria:**

- All ten baseline isolated IDs participate in new relations.
- At least ten relations are added across the two files.
- Seasonal order uses `chronological` unless a true learning prerequisite is documented.
- Care, public-place safety, gratitude, and future-wishes links preserve the exploratory/non-lock nature of Seikatsu where no mandatory order exists.

**Verification:**

```bash
pnpm validate:curriculum-graph
pnpm audit:roadmap-graph
pnpm test:related content/curriculum/seikatsu-g1-term1.json content/curriculum/seikatsu-g2-foundations.json
```

**Files likely touched:**

- `content/curriculum/seikatsu-g1-term1.json`
- `content/curriculum/seikatsu-g2-foundations.json`

**Estimated scope:** Small — 2 files.

### Task 8: Connect the remaining Shakai Concept

**Description:** Connect `shakai.g4.cur-1404-01` to the grade-4 social-studies progression using one source-backed relation that preserves the no-cross-subject-hard-lock rule.

**Acceptance criteria:**

- The baseline isolated Concept participates in at least one new relation.
- The edge is within Shakai, directionally valid, and supported by the registered grade-4 MEXT source.
- The global relation count reaches at least 425 and merged isolated Concepts reach 0.

**Verification:**

```bash
pnpm validate:curriculum-graph
pnpm audit:roadmap-graph --strict
pnpm test:related content/curriculum/shakai-g4-term1.json
```

**Files likely touched:**

- `content/curriculum/shakai-g4-term1.json`

**Estimated scope:** Small — 1 file.

### Checkpoint D: Content goal complete

- [ ] Relation count is at least 425.
- [ ] Concept isolation is 0 globally and for every subject.
- [ ] Unit isolation remains 0 globally and for every subject.
- [ ] Duplicate relations, dangling endpoints, prerequisite cycles, reverse-grade locks, cross-subject locks, and draft prerequisites remain 0.

### Task 9: Final verification, review, documentation, and preview

**Description:** Run the required repository gates, perform the five-axis review, document evidence and verification, commit the completed slices, and open the latest integrated preview without presenting a worktree-only preview as canonical.

**Acceptance criteria:**

- Focused and repository gates pass.
- A mutation of the new strict isolation condition makes the focused test fail and is then restored.
- Review finds no required correctness, architecture, security, performance, or readability issue.
- Walkthrough records baseline, final metrics, source boundary, changed files, tests, and remaining human academic-review boundary.
- Preview starts from the latest branch state on an allowed non-canonical port unless this chat is explicitly acting as integration owner.

**Verification:**

```bash
pnpm lint
pnpm check:architecture
pnpm test
pnpm validate:content
pnpm build
pnpm audit:roadmap-graph --strict
git diff --check
git status --short
```

Run `pnpm check:full` only if this chat is confirmed as integration owner and no other worktree is running full gates.

**Files likely touched:**

- `tasks/curriculum-concept-connectivity-walkthrough.md`
- `tasks/curriculum-concept-connectivity-todo.md`

**Estimated scope:** Small — documentation and verification.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Relation count is increased with weak semantics | High | Require a source matrix and relation-kind review before JSON edits |
| A non-required relationship becomes a hard lock | High | Reserve `prerequisite`; explicitly use non-lock kinds for misconceptions and seasonal/lateral relations |
| A relation creates a Concept or projected Unit cycle | High | Run graph validation and roadmap audit after every subject slice |
| Existing duplicate Concept occurrence causes wrong totals | Medium | Count merged unique Concepts in the shared quality report and test the duplicate-definition case |
| Misconceptions become roadmap prerequisites | High | Add explicit checks and keep existing projection exclusion unchanged |
| Source URL or locator does not directly support a proposed edge | High | Downgrade/reclassify or reject the edge; never claim `source-checked` without direct support |
| Academic-review hash is invalidated | Medium | Target files currently have no ledger entries; rerun full content validation and do not edit the ledger |
| Parallel work edits the same files | High | Keep the dedicated worktree/branch, inspect status before each slice, and avoid unrelated files |
| Full test/build contention with another chat | Medium | Use focused gates during slices and run full gates only once at completion per AGENTS.md |

## Open Questions

None. Any candidate relation not supported by its registered source is rejected or replaced within the approved relation-policy boundaries rather than escalating scope.
