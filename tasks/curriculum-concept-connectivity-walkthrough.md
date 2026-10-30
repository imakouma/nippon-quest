# Curriculum Concept Connectivity Walkthrough

## Outcome

The merged curriculum Concept graph now has no isolated Concepts. Thirty source-backed relations were added without changing Concept identity, question links, curriculum schemas, save data, UI contracts, or generated schemas.

| Metric                  | Before | After | Delta |
| ----------------------- | -----: | ----: | ----: |
| Unique Concepts         |    357 |   357 |     0 |
| Relations               |    395 |   425 |   +30 |
| Isolated Concepts       |     30 |     0 |   -30 |
| Unit nodes              |    280 |   280 |     0 |
| Unit prerequisite edges |    336 |   337 |    +1 |
| Isolated Units          |      0 |     0 |     0 |

The 30 new relations are distributed as follows:

- `prerequisite`: 10
- `related`: 13
- `transfer`: 3
- `contrast`: 3
- `chronological`: 1

All relation evidence and direction decisions are recorded in `tasks/curriculum-concept-connectivity-evidence.md`.

## Guardrail

`buildCurriculumGraphQuality()` now reports the deduplicated Concept count, relation count by kind, and deterministically sorted isolated Concept IDs. `pnpm audit:roadmap-graph --strict` fails when any isolated Concept remains.

The focused test covers:

- duplicate Concept occurrences merging into one Concept;
- total relation and relation-kind counts;
- non-prerequisite relations counting as graph connections;
- deterministic isolated-ID ordering.

The test was first observed RED because `conceptGraph` did not exist. A review mutation then inverted the isolation predicate; the focused test failed with connected IDs in the isolated list, proving the assertion detects the core regression. The predicate was restored, and both the focused test and strict audit returned GREEN.

## Content review

- Every one of the 30 baseline isolated IDs participates in a new relation.
- No cross-subject relation was added.
- Every cross-grade prerequisite moves forward in grade.
- The three misconception Concepts use `contrast`; none participates in a prerequisite.
- Life-environment seasonal order uses `chronological`, while other non-lock relationships use `related` or `transfer`.
- No relation was marked `expert-reviewed`.
- Question links in all 11 changed curriculum fragments are byte-for-byte equivalent at the JSON value level to the base commit.

## Verification

Passed:

- `pnpm vitest run tests/unit/curriculumGraphQuality.test.ts` — 4/4 tests
- related tests after each subject slice — 18 files, 126 tests
- `pnpm validate:curriculum-graph` — 75 graphs, 358 Concept occurrences, 4,823 question links
- `pnpm audit:roadmap-graph --strict` — 357 Concepts, 425 relations, 0 isolated; all structural error counts 0
- `pnpm check:architecture`
- `pnpm validate:content`
- `pnpm build`
- targeted ESLint and Prettier checks for every changed source/content/task file
- `git diff --check`

Repository-wide pre-existing failures outside this change:

- `pnpm lint`: ESLint passes; Prettier reports only `SPEC-math-learning-content-pilot.md`. That file is unchanged from base commit `53429c9fa7e812c2e0a878c6383490e49cf9e336`.
- `pnpm test`: 1,881/1,882 tests pass. `tohokuAcademicAudit.test.ts` reports stale ledger hashes for `questions/sansu/g1/ringo-number-build.json` and `questions/sansu/g1/tashizan.json`. Both question files and `docs/release/tohoku-academic-ledger.md` are unchanged from the base commit.

## Review result

No correctness, architecture, security, or performance issue was found in the requested change. Concept aggregation is linear in the number of Concepts and relations and remains inside the existing pure graph-quality module. The audit script consumes that shared result instead of reimplementing graph traversal.

## Branch and commits

- Branch: `codex/curriculum-concept-connectivity`
- Base: `53429c9fa7e812c2e0a878c6383490e49cf9e336`
- Specification/plan: `aba4916b`
- Evidence matrix: `d494a9ce`
- Concept audit: `021157ca`
- Kokugo relations: `45808306`
- Sansu relations: `6dc0ebc5`
- Seikatsu relations: `b72cf551`
- Shakai relation: `5407423d`
