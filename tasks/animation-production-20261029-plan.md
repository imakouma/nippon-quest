# Implementation Plan: Existing Animation Production Release 2026-10-29

## Overview

Integrate the completed batch-01, batch-02, and batch-03 runtime monster animations into the current production baseline. Batch-04, batch-05, and Ringoron are already present on `imakouma/main`, so they must not be reintroduced. Release only after the combined 489-character coverage passes focused, full, browser, and GitHub Pages verification.

## Architecture Decisions

- Start from the fetched `imakouma/main` production tip and work in the isolated `codex/animation-production-20261029` branch.
- Preserve animation history by cherry-picking the batch commits in order, while resolving shared test and generated-catalog conflicts against production.
- Treat the five batch manifests as the runtime source of truth and require exact unique coverage: 101 + 110 + 57 + 110 + 110 = 488 monster IDs, plus Ringoron = 489 animated characters.
- Do not claim or generate the remaining 53 of the 542 content monsters in this release.
- Roll back by reverting the final production merge commit and allowing the Pages workflow to redeploy the preceding production tree.

## Task List

### Phase 1: Controlled integration

- [ ] Cherry-pick batch-01 production commits onto the current production baseline.
- [ ] Cherry-pick batch-02 and batch-03 commits without overwriting batch-04 or batch-05.
- [ ] Regenerate the asset catalog and reconcile shared animation tests.

### Phase 2: Verification

- [ ] Prove exact 489-character unique animation coverage and zero cross-batch duplicate IDs.
- [ ] Run focused animation tests and production audits.
- [ ] Run `pnpm check:full` and the release E2E suite.
- [ ] Review the final diff and refresh the code-only Graphify graph.
- [ ] Start the canonical preview on `127.0.0.1:4174` and inspect representative batches in a real browser.

### Phase 3: Production release

- [ ] Push the integration branch and merge it into `imakouma/main`.
- [ ] Wait for the exact production SHA to pass CI and GitHub Pages deployment.
- [ ] Smoke-test the deployed Pages URL and record the rollback SHA.

## Risks and Mitigations

| Risk                                                    | Impact | Mitigation                                                                            |
| ------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| Older batch commits overwrite newer production behavior | High   | Integrate only animation commits and resolve shared files against current production. |
| Duplicate IDs select the wrong sprite sheet             | High   | Assert exact set cardinality and zero duplicates across all five manifests.           |
| Generated catalog drifts from committed assets          | High   | Regenerate with `pnpm gen:manifest` and require a clean post-build diff.              |
| Static asset volume breaks the production bundle        | Medium | Run the full build, performance budget, E2E suite, and deployed smoke test.           |

## Open Questions

None. The user explicitly approved merging the completed work and deploying it to production.
