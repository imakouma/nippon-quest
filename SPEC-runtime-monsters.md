# Spec: Runtime Monster Animations

Module id: `runtime-monsters`

Approved by the user on 2026-10-28.

## Objective

Produce, validate, register, and exercise battle animation sheets for the 89 `batch-01` runtime monsters that are currently `reference-ready` in `docs/verification/animation-completion/coverage.json`.

When this module is complete, `batch-01` has 101 registered runtime monsters: the existing 12 batch sheets plus all 89 newly produced sheets. Ringoron remains the separately registered existing sheet. Named people and the six visual-only starter evolutions remain outside the runtime monster manifest.

This is production asset work, not a change to monster stats, content schemas, encounter data, or battle rules.

## Approved Visual Contract

Every new runtime sheet follows the existing Ringoron and batch-01 contract:

- one transparent RGBA PNG at exactly 512×256;
- eight equal 128×128 cells in a 4-column × 2-row layout;
- top row: neutral idle, character-specific breathing motion, blink or equivalent readable secondary motion, return toward neutral;
- bottom row: character-specific wind-up, anticipation/forward motion, readable attack/contact pose, recovery toward neutral;
- a stable foot baseline or floating center across frames;
- crisp, hard-edged, medium-coarse pixel art with a limited palette and no grid, labels, shadow plane, or cross-cell effects;
- identity, silhouette, face, palette, anatomy, countable appendages, and signature props preserved from the adopted references;
- real frame-to-frame pose or appendage changes. Whole-image translation, scaling, rotation, or opacity changes alone never count as animation.

The adopted pixel reference is the face/palette/small-silhouette anchor. The adopted turnaround is the anatomy and signature-detail anchor. `assets/sprites/animations/aomori-ringoron-v1.png` is the sheet layout, pixel density, spacing, and motion-quality anchor.

## Production Method

For each of the 89 IDs:

1. Read its normalized pixel and turnaround paths from the committed coverage report and verify their hashes against the owner-maintained source library.
2. Generate one character-specific sheet from those two references plus the Ringoron anchor. Prompts describe the actual anatomy and a motion suited to that character; they do not substitute the ID or monster name into a generic prompt without visual analysis.
3. Inspect the generated source at full size and by individual 128×128 cells. Reject outputs with identity drift, duplicate/missing limbs or props, cropped frames, stray artifacts, fake transparency, text, grids, or motion that is only a transform.
4. If correction is local and identity-preserving, perform a narrowly scoped image edit. Regenerate when the pose or identity is structurally wrong.
5. Preserve the accepted generated source under `docs/verification/animation-completion/runtime-monsters/` and mechanically normalize only size, RGBA mode, nearest-neighbor scaling, and very-low-alpha background cleanup for the runtime PNG.
6. Write the runtime sheet to `assets/sprites/animations/batch-01/<id>-v1.png`, record prompt/reference/output hashes in the production ledger, and add the canonical manifest entry.

Production runs in reviewable waves of at most 10 monsters. A wave is registered only after its image checks and focused tests pass. Failed or rejected generation never enters the runtime manifest.

No external model provider or project credential is added. OmniRoute is not applicable because this module generates repository assets with the available image-production tool; it does not add an AI feature or model route to the game.

## Runtime Manifest Contract

Each accepted sheet adds exactly one entry to `assets/sprites/animations/batch-01/manifest.json`:

```json
{
  "id": "aomori-buna-taiju",
  "key": "mon.animation.aomori-buna-taiju.v1",
  "path": "sprites/animations/batch-01/aomori-buna-taiju-v1.png",
  "frameWidth": 128,
  "frameHeight": 128,
  "idle": [0, 1, 0, 3, 0, 2, 0],
  "attack": [4, 5, 6, 7, 0]
}
```

The shared loader and battle playback API do not need a new special case. Each new monster must load through `monsterAnimationSpec`, play idle automatically, play attack for normal attacks and damaging skills, return to idle, and stop on KO.

## Project Structure

```text
docs/verification/animation-completion/coverage.json
  Canonical list of the 89 reference-ready runtime monsters and adopted input hashes.

docs/verification/animation-completion/runtime-monsters/
  Accepted generated sources, production ledger, contact sheets, and visual review records.

assets/sprites/animations/batch-01/
  Normalized runtime sheets and the runtime manifest.

scripts/
  Portable image-contract and production-ledger audits. Creative pose generation does not live in runtime code.

tests/unit/
  Assignment, manifest, PNG, frame-difference, provenance, and exclusion contracts.

tests/e2e/
  Browser playback checks for idle, attack, return-to-idle, KO, and asset-load errors.
```

Generated catalogs and `content/manifest.json` are updated only through the existing generator command, never by hand.

## Testing Strategy

### Test-first contracts

Before adding production sheets, tests define and initially fail on the remaining 89 IDs. They must prove:

1. At final completion the runtime manifest contains exactly 101 unique `batch-01` runtime IDs: the existing 12 plus the 89 coverage targets.
2. Ringoron, named people, and visual-only evolutions are not duplicated into the batch runtime manifest.
3. Every manifest PNG exists, is RGBA, is exactly 512×256, and exposes eight 128×128 cells.
4. Every new sheet has transparent background pixels, visible character pixels inside every cell, safe cell margins, and no opaque pixels crossing a cell boundary.
5. Idle and attack rows contain real pixel differences. The attack contact frame differs from neutral by more than a whole-frame translation/scale baseline.
6. The production ledger maps each of the 89 IDs to the adopted input hashes, generation prompt, accepted source hash, runtime hash, and review state.
7. The coverage report transitions all 89 IDs from `reference-ready` to `produced-runtime` only after their registered files and ledger records exist.

Automated image heuristics are necessary but not sufficient. Every accepted source is also inspected in a generated contact sheet at 1× and enlarged nearest-neighbor scale.

### Browser verification

Every newly registered monster is exercised through the real battle route at 960×540 and 640×360. Verification checks:

- the expected `mon.animation.<id>.v1` texture loads without 4xx/5xx responses;
- idle visits at least three distinct frames;
- normal attack and damaging skill invoke the attack animation;
- playback returns to idle;
- KO stops animation and hides the sprite;
- displayed bounds remain within the existing battle limit and preserve aspect ratio.

The test implementation may group IDs into bounded browser runs for speed, but it must report the affected ID on failure. Representative screenshots and all-sheet contact sheets are committed; 178 near-identical browser screenshots are not required.

## Commands

During each production wave:

```bash
pnpm check:animation-sources -- --source-root /Users/imamurakouma/Documents/ChatGPT/education-2d-RPG
pnpm vitest run tests/unit/animationRuntimeMonsters.test.ts tests/unit/animationBatchManifests.test.ts
pnpm test:related src/rendering/monsterAnimation.ts src/scenes/battle/monsterAnimation.ts
pnpm check:fast
```

At module completion:

```bash
pnpm test:e2e -- tests/e2e/animation-batch-01.spec.ts
pnpm gen:manifest
pnpm lint
pnpm check:architecture
pnpm test
pnpm validate:content
pnpm build
```

The integrated branch later runs the repository-wide `pnpm check:full` gate once, following the repository concurrency rules.

## Boundaries

### Always do

- Use only the adopted reference pair and recorded hashes for each ID.
- Preserve character-specific anatomy, counts, props, palette, and silhouette.
- Keep the shared 4×2 frame order and runtime manifest contract.
- Keep generation evidence and rejected/accepted status explicit.
- Verify each wave before registering it.
- Preserve the existing fallback path until a sheet is both produced and registered.

### Ask first

- Replace or reinterpret an adopted character design.
- Change the shared frame layout, frame size, or runtime animation API.
- Add a model provider, project credential, dependency, or content/schema field.
- Register one of the six visual-only evolution forms as gameplay content.
- Hand-redraw or materially redesign a source reference instead of animating it.

### Never do

- Mark a monster complete because a PNG merely exists.
- Generate from a name alone when adopted visual references exist.
- Use a generic wobble, whole-sheet transform, or duplicated frames as the requested animation.
- Put named people, Ringoron, or visual-only evolutions into the batch runtime manifest.
- Modify monster balance, encounter data, or gameplay definitions as part of asset production.
- Overwrite cinematic production originals or edit generated catalogs by hand.

## Success Criteria

- All 89 previously reference-ready runtime monsters have accepted, character-specific 4×2 battle sheets.
- The batch runtime manifest has exactly 101 unique entries and no forbidden IDs.
- All new sheets satisfy dimensions, RGBA/transparency, per-cell occupancy/margins, and meaningful frame-difference checks.
- Every new sheet has a complete, hash-linked production record and visual review state.
- Real browser playback passes for every new ID at desktop and landscape-mobile viewports.
- Coverage generation reports zero `reference-ready` runtime monsters and 101 `produced-runtime` batch monsters, while Ringoron, people, and visual-only evolutions keep their approved classifications.
- Focused tests, `check:fast`, content validation, build, and the module E2E suite pass.
- The user-facing preview opens an integrated battle using a newly produced monster from the current branch.

## Open Questions

None. The user explicitly approved this module spec on 2026-10-28.
