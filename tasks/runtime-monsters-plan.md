# Runtime monsters implementation plan

Specification: [`SPEC-runtime-monsters.md`](../SPEC-runtime-monsters.md)

## Goal

Convert all 89 `reference-ready` batch-01 runtime monsters into accepted, registered, and browser-verified 4×2 battle animation sheets without changing gameplay data or the shared animation API.

## Delivery strategy

Work in nine deterministic waves: eight waves of ten IDs and a final wave of nine. Each wave is a complete vertical slice:

```text
adopted source hashes
  → character-specific prompt and generated source
  → full-size + per-cell visual inspection
  → deterministic 512×256 RGBA normalization
  → production ledger + manifest registration
  → unit/image checks
  → focused browser playback
  → atomic wave commit
```

A failed image stays unregistered. Later waves do not weaken checks added by earlier waves.

## Phase 1: Lock the production contract with failing tests

1. Add `tests/unit/animationRuntimeMonsters.test.ts` from the committed coverage report.
2. Assert the final 89-ID target set, required provenance fields, PNG layout, alpha, per-cell occupancy, margins, and meaningful pixel differences.
3. Add a production-ledger schema owned by a tool module, not runtime code.
4. Run the focused test and record the expected failure caused by missing production records and sheets.

Checkpoint: tests fail for the intended missing-production reason, not a fixture or import error.

## Phase 2: Build deterministic production tooling

1. Add a prompt-record generator that reads the coverage report and content metadata while preserving the adopted reference paths/hashes.
2. Add a runtime-sheet normalizer using existing system tooling: require an exact 2:1 generated layout, nearest-neighbor resize to 512×256, RGBA output, and alpha-under-16 cleanup. A non-2:1 source is rejected rather than cropped through a character or cell. No creative deformation happens in this script.
3. Add an image audit that measures all eight cells, safe margins, alpha, visible bounds, duplicate frames, translation-only differences, and ledger/output hashes.
4. Add a contact-sheet generator for accepted sources and runtime sheets.
5. Unit-test failure cases before implementing each rule. The existing Magurodo sword tip and Tsugaru Nurin row edge are recorded as legacy margin warnings; new sheets use the strict zero-boundary-contact policy.

Checkpoint: tooling tests and `pnpm check:fast` pass on existing completed sheets with the two documented legacy margin exceptions and intentionally reject bad fixtures.

## Phase 3: Produce waves 1–9

For every ID in a wave:

1. Verify source hashes immediately before generation.
2. Inspect both references and describe identity, countable parts, and character-appropriate idle/attack motion.
3. Generate with the two adopted references plus Ringoron as the motion/layout anchor.
4. Inspect the accepted source at original size and as eight isolated cells; edit or regenerate if any rejection condition appears.
5. Normalize the accepted source, run the image audit, and create the manifest/ledger record.
6. Run the wave-focused unit tests and browser playback at 960×540 and 640×360.
7. Update `tasks/animation-batch-01.md` only for verified IDs and commit the wave atomically.

Wave membership is fixed in [`runtime-monsters-todo.md`](runtime-monsters-todo.md). This prevents silent omission and makes restarts deterministic.

Checkpoint after each wave: source audit, image audit, manifest tests, browser playback, `git diff --check`, and staged-diff review pass.

## Phase 4: Reconcile coverage and generated catalogs

1. Regenerate the coverage report from the completed runtime manifest.
2. Require exactly 101 `produced-runtime` batch entries, zero `reference-ready` entries, one separately classified Ringoron, three people, and six visual-only evolutions.
3. Run `pnpm gen:manifest`; review generated `assets/catalog.json` and content bundle changes rather than hand-editing them.
4. Re-run the cinematic source audit and production-ledger audit.

Checkpoint: portable coverage and source provenance are both complete.

## Phase 5: Full verification and handoff

1. Run the complete batch browser suite at desktop and landscape-mobile sizes.
2. Generate an all-89 contact sheet plus representative battle screenshots.
3. Run the module gate: lint, architecture, tests, content validation, and build.
4. Apply the `code-review-and-quality` five-axis review and mutation-check a new image-contract condition.
5. Update Graphify in code-only mode.
6. Commit the module handoff, then continue to `named-character-runtime` only after its separate approved spec.

The repository-wide `pnpm check:full` runs once on the integrated branch, not concurrently during individual waves.

## Expected files

- `SPEC-runtime-monsters.md`
- `tasks/runtime-monsters-plan.md`
- `tasks/runtime-monsters-todo.md`
- `scripts/animation-production/` focused production/audit modules
- `tests/unit/animationRuntimeMonsters.test.ts`
- `tests/unit/animationProductionTools.test.ts`
- `tests/e2e/animation-batch-01.spec.ts`
- `docs/verification/animation-completion/runtime-monsters/`
- `assets/sprites/animations/batch-01/manifest.json`
- `assets/sprites/animations/batch-01/<id>-v1.png` for 89 IDs
- generated catalog files only when produced by the existing generator

## Risks and mitigations

| Risk                                   | Impact | Mitigation                                                                                                          |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| Identity drifts across eight frames    | High   | Use both adopted references, enumerate signature parts, inspect isolated cells, and regenerate structural failures. |
| A generic transform passes as motion   | High   | Compare aligned frame masks and require internal pixel/shape changes beyond translation.                            |
| Generation artifacts enter runtime     | High   | Keep generated sources unregistered until visual and automated checks both pass.                                    |
| 89 assets make failures hard to locate | High   | Fixed waves, ID-labelled tests, atomic commits, and per-ID ledger records.                                          |
| Repository size grows quickly          | Medium | Commit accepted generated sources and runtime sheets; keep rejected versions only when they document a correction.  |
| Browser suite becomes too slow         | Medium | Group bounded IDs per run while preserving ID-specific diagnostics and both viewports.                              |
| A generated catalog is edited manually | Medium | Use `pnpm gen:manifest` only and review the resulting diff.                                                         |

## Non-goals

- Named-character scene integration.
- New gameplay records for visual-only evolutions.
- New battle actions, frame layouts, stats, encounters, or content schemas.
- General high-resolution redraws or replacement character designs.
