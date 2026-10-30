# Implementation Plan: Animation Coverage

## Overview

Implement the `animation-coverage` module from `SPEC-animation-coverage.md`. The result is a portable, machine-readable report covering all 111 assigned IDs plus a local audit that proves the 89 pending runtime monsters still have the adopted pixel and turnaround originals needed for production.

This task uses dedicated plan files because `tasks/plan.md` and `tasks/todo.md` contain unrelated unfinished work and must not be overwritten.

## Dependency Graph

```text
assignment + existing manifests + production ledgers
  → coverage contract test
  → normalized coverage report generator
  → local cinematic-source audit
  → verified coverage checkpoint
```

## Architecture Decisions

- Keep `tasks/animation-batch-assignments.json` as the canonical 111-ID input; do not introduce a competing assignment list.
- Commit normalized reference metadata and SHA-256 values, not cinematic source images.
- Make unit tests portable across worktrees and CI by testing the committed report.
- Make source-file existence and hash verification an explicit local audit with a configurable source root.
- Resolve duplicate turnaround versions from the existing adopted-generation ledgers, not lexical filename order.
- Use the built-in image generator later in `runtime-monsters`; this module neither generates images nor configures an external provider.

## Task List

### Phase 1: Contract

- [ ] Task 1: Add the failing 111-ID coverage contract test.

### Phase 2: Coverage report

- [ ] Task 2: Generate normalized classification and adopted-reference metadata.
- [ ] Task 3: Add the local cinematic-source existence and hash audit.

### Checkpoint: Coverage foundation

- [ ] Focused unit tests pass.
- [ ] Local source audit reports 111 classified IDs and 89 production-ready pending monsters.
- [ ] Missing, duplicate, or reclassified IDs fail deterministically.
- [ ] `pnpm check:fast` passes.

### Phase 3: Handoff

- [ ] Task 4: Update the production ledger and Graphify code-only graph for the completed coverage module.

### Checkpoint: Module complete

- [ ] Spec success criteria are satisfied.
- [ ] Coverage changes are committed atomically.
- [ ] The `runtime-monsters` module can consume the report without inspecting untracked source directories.

## Risks and Mitigations

| Risk                                                    | Impact | Mitigation                                                                                    |
| ------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| Duplicate turnaround versions select an obsolete design | High   | Read explicit adopted destinations from generation ledgers and record the selected path/hash. |
| Absolute paths make reports machine-specific            | Medium | Normalize paths from `assets/cinematics/` and accept a configurable local source root.        |
| Gitignored originals disappear from a worktree          | High   | Keep portable metadata tests separate from the explicit local source audit.                   |
| A future manifest update silently omits an assignment   | High   | Assert exact set equality and one classification per ID.                                      |
| Report generation reads large image bodies repeatedly   | Medium | Hash files in a streaming pass and keep unit tests metadata-only.                             |

## Open Questions

None.
