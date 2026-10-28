# Animation coverage checklist

Specification: [`SPEC-animation-coverage.md`](../SPEC-animation-coverage.md)

Plan: [`animation-coverage-plan.md`](animation-coverage-plan.md)

## Task 1: Add the failing coverage contract

**Description:** Define the exact 111-ID classification and reference-metadata contract before producing the report.

**Acceptance criteria:**

- [x] The test requires exactly 111 unique IDs and exact equality with `batch-01.ids`.
- [x] The test requires the approved 12 runtime sheets, one existing sheet, three people, six visual-only evolutions, and 89 reference-ready runtime monsters.
- [x] The test rejects duplicate runtime IDs, Ringoron duplication, people in monster manifests, and visual-only evolutions in runtime manifests.

**Verification:**

- [x] Confirm the test fails because the coverage report does not yet exist.
- [x] Run `pnpm vitest run tests/unit/animationCoverage.test.ts`.

**Dependencies:** None

**Files likely touched:** `tests/unit/animationCoverage.test.ts`

**Estimated scope:** Small

## Task 2: Generate normalized coverage metadata

**Description:** Build the committed report from assignments, existing manifests, and adopted generation ledgers.

**Acceptance criteria:**

- [x] Every assigned ID has one explicit kind and state.
- [x] Each of the 89 pending runtime monsters has normalized pixel and turnaround paths plus SHA-256 metadata.
- [x] Duplicate turnaround versions resolve from adopted ledger data rather than filename sorting.

**Verification:**

- [x] Run the generator twice and confirm byte-identical output.
- [x] Run `pnpm vitest run tests/unit/animationCoverage.test.ts` and confirm it passes.

**Dependencies:** Task 1

**Files likely touched:** `scripts/build-animation-coverage.ts`, `docs/verification/animation-completion/coverage.json`, `package.json`

**Estimated scope:** Medium

## Task 3: Audit the cinematic source library

**Description:** Verify that normalized report paths resolve under a configurable source root and still match recorded hashes.

**Acceptance criteria:**

- [x] The audit succeeds for all 89 pixel references and 89 turnaround references in the owner source library.
- [x] Missing files, changed bytes, and paths outside `assets/cinematics/` fail with the affected ID.
- [x] The audit does not copy or modify production originals.

**Verification:**

- [x] Run `pnpm check:animation-sources -- --source-root /Users/imamurakouma/Documents/ChatGPT/education-2d-RPG`.
- [x] Run `pnpm check:fast`.

**Dependencies:** Task 2

**Files likely touched:** `scripts/check-animation-sources.ts`, `package.json`, `tests/unit/animationCoverage.test.ts`

**Estimated scope:** Medium

## Checkpoint: Coverage foundation

- [x] Focused unit tests pass.
- [x] Local audit reports 111 classified IDs and 89 reference-ready runtime monsters.
- [x] Failure cases for omission, duplication, missing originals, and hash mismatch are covered.
- [x] `pnpm check:fast` passes.

## Task 4: Record the verified handoff

**Description:** Mark the coverage foundation complete without claiming the animation sheets themselves are complete.

**Acceptance criteria:**

- [x] `tasks/animation-batch-01.md` distinguishes verified references from produced runtime sheets.
- [x] Graphify is updated in code-only mode after the source additions.
- [x] The commit contains only coverage-contract files and documentation.

**Verification:**

- [x] Run `git diff --check` and inspect the staged diff.
- [x] Re-run the focused test and source audit.

**Dependencies:** Tasks 1–3

**Files likely touched:** `tasks/animation-batch-01.md`, `graphify-out/` generated state

**Estimated scope:** Small

## Checkpoint: Module complete

- [x] All `SPEC-animation-coverage.md` success criteria are met.
- [x] Coverage work is committed atomically on `codex/animation-completion`.
- [x] The next module can consume the committed report.
