# Spec: Animation Coverage

Module id: `animation-coverage`

## Objective

Create a deterministic coverage contract for the 111 IDs assigned to `batch-01` so later production work cannot silently omit, duplicate, or misclassify a character.

The contract must distinguish:

- runtime monsters that require a registered 4×2 battle animation sheet;
- the existing completed Ringoron sheet;
- named people whose animation integration differs from monsters;
- six starter evolution sheets that are complete visual assets but intentionally lack gameplay records.

All 89 currently unstarted runtime monsters have both a pixel reference and a four-direction turnaround in the owner-maintained cinematic source library. When multiple turnaround versions exist, the adopted or latest corrected version recorded by the existing generation ledger is selected; filename ordering alone is not authoritative.

## Tech Stack

- TypeScript with strict checking
- Vitest for the coverage contract
- JSON for assignments and animation manifests
- Markdown and JSON verification records under `docs/verification/animation-completion/`
- Existing Graphify code-only graph for impact checks

No dependency or schema change is required.

## Commands

```bash
pnpm vitest run tests/unit/animationCoverage.test.ts
pnpm test:related src/rendering/monsterAnimation.ts src/rendering/characterAnimation.ts
pnpm check:fast
```

The final integration gate remains:

```bash
pnpm lint
pnpm check:architecture
pnpm test
pnpm validate:content
pnpm build
```

## Project Structure

```text
tasks/animation-batch-assignments.json
  Canonical list of 111 assigned IDs.

tasks/animation-batch-01.md
  Human-readable production status.

assets/sprites/animations/batch-01/
  Runtime manifests and completed animation sheets.

docs/verification/animation-completion/
  Machine-readable coverage report and production evidence.

tests/unit/animationCoverage.test.ts
  Completeness, uniqueness, classification, and reference checks.
```

The cinematic source library remains a production-original store and is not copied into runtime assets.

## Code Style

Coverage records use stable IDs and explicit states rather than inferring state from filenames:

```json
{
  "id": "aomori-buna-taiju",
  "kind": "runtime-monster",
  "state": "reference-ready",
  "pixelReference": "assets/cinematics/monsters/tohoku-turnarounds-v4/pixel-references/aomori-buna-taiju.png",
  "turnaroundReference": "assets/cinematics/monsters/tohoku-turnarounds-v4/aomori-buna-taiju/turnaround-v1.png"
}
```

- IDs stay lowercase kebab-case and must match content IDs.
- Status values are closed, documented strings.
- Reference paths are repository-relative even when the cinematic originals are gitignored.
- Generated runtime files are never used as their own source reference.

## Testing Strategy

Unit tests must prove:

1. Exactly 111 unique assignment IDs are classified once.
2. Exactly 89 entries begin this initiative as `reference-ready` runtime monsters.
3. Every pending runtime monster resolves to an existing content record and has normalized pixel-reference and turnaround-reference metadata with recorded hashes.
4. The 12 completed runtime sheets, Ringoron, three named people, and six visual-only evolutions retain their intended classifications.
5. Runtime manifests contain no named people, visual-only evolutions, duplicate IDs, or Ringoron duplicate.

The portable unit test reads committed metadata and file headers only; it does not require the gitignored cinematic originals or load hundreds of full images into memory. A separate local source audit resolves the configured cinematic source root, verifies every referenced original and its recorded hash, and produces the committed report used by the portable test.

## Boundaries

### Always do

- Preserve the 111-ID assignment as the source of truth.
- Select corrected/adopted references from existing production records.
- Record every state transition from reference-ready to produced and verified.
- Keep production originals separate from runtime assets.

### Ask first

- Change the 111-ID assignment.
- Reclassify a visual-only evolution as a gameplay monster.
- Replace an adopted character design instead of animating it.
- Add a dependency or change a shared content contract.

### Never do

- Mark an ID complete because a file merely exists.
- Treat unreviewed duplicate turnaround versions as interchangeable.
- Copy all cinematic originals into the shipped asset catalog.
- Configure external model credentials or OmniRoute for this work.
- Use `Math.random` or introduce rendering-layer dependencies into `src/core/`.

## Success Criteria

- A machine-readable report classifies all 111 IDs exactly once.
- The report identifies all 89 remaining runtime monsters with usable pixel and turnaround references.
- Duplicate reference versions resolve to one documented adopted source per ID.
- Focused unit tests fail on omission, duplication, invalid classification, or missing reference metadata and pass on the approved report.
- The local source audit fails on a missing original or hash mismatch and succeeds against the owner-maintained cinematic source library.
- No runtime behavior, content schema, or generated catalog changes in this module.

## Open Questions

None. The user approved the capability boundary on 2026-10-28, including keeping the six evolution forms animation-complete but outside gameplay registration.
