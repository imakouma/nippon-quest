# Spec: Remaining Runtime Monster Animations

Module id: `remaining-runtime-monsters`

Status: approved by user on 2026-10-30.

## Objective

Complete battle animation coverage for the 53 runtime monsters that are not registered in any existing animation manifest at production commit `2aca41addedcf58fb9f5d5abb58e744932e3ed17`.

The finished game must expose an accepted battle animation through `monsterAnimationSpec` for all 542 runtime monsters. This is asset-production work only: monster definitions, stats, encounters, save data, battle rules, and animation playback code remain unchanged.

The 53 target IDs are:

```text
koshinetsu-boss
miyagi-lastboss-date-masamune
miyagi-sasakama-uo
miyazaki-boss-takachiho-no-nushi
miyazaki-mangocchi
miyazaki-tarutaru-kokko
nagano-oomori-soba
nagano-yukemuri-zaru
nagasaki-kurawan-nushi
nagasaki-mogikko
nara-happazushi
nara-somen-tsururi
niigata-boss-shinanogawa-no-nushi
niigata-kotoki
oita-boss-yukemuryu
oita-midboss-yabakeiwa
oita-yukemurin
okayama-denim-bushi
okayama-midboss-mouretsu-jersey
okinawa-goyamaru
okinawa-painapon
osaka-fusanari-don
osaka-midboss-abare-danjiri
saga-chabashira
saga-midboss-toumeika
saitama-boss-yomatsuri-daio
saitama-midboss-gon-yagura
shiga-boss-dainamazu
shiga-lastboss-ii-naosuke
shikoku-islandboss-yotsu-no-tenbin
shimane-oohi-rosoku
shimane-warigon
shizuoka-kazekiri-dako
shizuoka-unagi-nobori
tochigi-go-bellmoo
tochigi-lastboss-nasu-no-yoichi
tokushima-kazura-musasabi
tokushima-oogamedon
tokyo-daikon-zamurai
tokyo-musasabyun
tottori-boss-sakyu-majin
tottori-perawashi
toyama-fubuki-okojo
toyama-midboss-gabujishi
wakayama-bincho-homura
wakayama-mamori-toudai
wakayama-toudain
yamagata-lastboss-matsuo-basho
yamagata-yukemurin
yamaguchi-lastboss-yoshida-shoin
yamaguchi-noborigaman
yamanashi-budoon
yamanashi-momorin
```

## Approved Visual Contract

Each new asset follows the existing runtime animation contract:

- one transparent RGBA PNG at exactly 512×256;
- eight equal 128×128 cells arranged as four columns by two rows;
- top row: neutral idle, character-specific breathing motion, blink or equivalent secondary motion, return toward neutral;
- bottom row: character-specific wind-up, anticipation or forward motion, readable contact pose, recovery toward neutral;
- stable foot baseline or floating center across frames;
- crisp hard-edged pixel art, limited palette, no antialiasing, text, grid, background, baked shadow, or cross-cell effect;
- identity, silhouette, palette, anatomy, countable appendages, and signature props preserved from the repository design;
- real frame-to-frame pose or appendage changes. Translation, scaling, rotation, or opacity alone does not count as completed animation.

`assets/sprites/animations/aomori-ringoron-v1.png` and accepted batch sheets are the layout, density, spacing, and motion-quality anchors.

## Production Method

1. Derive the exact target set as `content/monsters/*.json` minus Ringoron and all existing batch manifests. The audit must fail unless the result is exactly the 53 IDs above.
2. Render a transparent reference PNG for each target from its existing `MONSTER_DESIGNS` entry. The rendered reference, monster content record, and existing design code are the identity source of truth.
3. Use the built-in image generator in edit/reference mode, one call per monster. No external provider, OmniRoute, credential, or new dependency is introduced.
4. Inspect each generated sheet at full size and as isolated cells. Reject identity drift, changed limb or prop counts, cropping, text, grids, fake transparency, stray artifacts, or transform-only motion.
5. Keep the accepted generated source and its prompt/reference/output hashes under `docs/verification/animation-completion/remaining-runtime-monsters/`.
6. Normalize only canvas size, RGBA mode, nearest-neighbor scaling, and very-low-alpha cleanup using the existing animation-production tools.
7. Save runtime sheets under `assets/sprites/animations/batch-06/<id>-v1.png` and register them in `batch-06/manifest.json`. The existing manifest glob loads the new batch without a runtime special case.

Production is split into reviewable waves of at most ten monsters. A sheet enters the manifest only after its image contract and focused tests pass. Rejected generations are never registered.

## Tech Stack

- TypeScript and the existing animation-production scripts.
- Built-in image generation for identity-preserving sprite-sheet production.
- Phaser's existing `monsterAnimationSpec` manifest loader and battle playback.
- Vitest for manifest, image, and coverage contracts.
- Playwright for real battle playback at desktop and landscape-mobile sizes.
- No new package or external model provider.

## Commands

During each wave:

```bash
pnpm check:animation-production
pnpm test:related src/rendering/monsterAnimation.ts tests/unit/animationBatchManifests.test.ts
pnpm check:fast
```

At completion:

```bash
pnpm gen:manifest
pnpm lint
pnpm check:architecture
pnpm test
pnpm validate:content
pnpm build
```

The integration branch runs `pnpm check:full` once after all waves are combined, following the repository concurrency rules.

## Project Structure

```text
assets/sprites/animations/batch-06/
  53 normalized runtime sheets and one manifest.

docs/verification/animation-completion/remaining-runtime-monsters/
  Rendered references, accepted generation sources, prompt/hash ledger, contact sheets, and visual review evidence.

scripts/animation-production/
  Existing normalization and audit tools. Add only the smallest missing target/reference export support if the current tools cannot produce it.

tests/unit/
  Exact 542-of-542 coverage, manifest uniqueness, PNG dimensions, transparency, occupancy, margins, and meaningful frame-difference contracts.

tests/e2e/
  Bounded real-browser playback checks with affected monster IDs reported on failure.
```

Generated catalogs are updated only with `pnpm gen:manifest`; they are never edited by hand.

## Code Style

Manifest entries keep the existing literal contract:

```json
{
  "id": "nagano-oomori-soba",
  "key": "mon.animation.nagano-oomori-soba.v1",
  "path": "sprites/animations/batch-06/nagano-oomori-soba-v1.png",
  "frameWidth": 128,
  "frameHeight": 128,
  "idle": [0, 1, 0, 3, 0, 2, 0],
  "attack": [4, 5, 6, 7, 0]
}
```

No new abstraction or configuration layer is added. Existing helpers and file formats remain authoritative.

## Testing Strategy

### Test-first contracts

Before production assets are registered, a focused test must fail because 53 runtime monsters lack animation specs. Final tests prove:

1. The content index contains 542 unique runtime monster IDs.
2. Every one of those IDs resolves through `monsterAnimationSpec` exactly once.
3. Existing batches remain unchanged and `batch-06` contains exactly the frozen 53-ID set.
4. Every new PNG is RGBA, 512×256, transparent outside the subject, and contains visible pixels in all eight cells without crossing cell boundaries.
5. Idle and attack rows contain meaningful pixel differences, and attack is not only a whole-frame transform.
6. Every accepted sheet has a hash-linked reference, prompt, generated source, runtime output, and visual-review record.
7. The production audit reports 542 animated runtime monsters and zero remaining.

### Browser verification

Every new ID is exercised through the real battle route. Tests check asset loading, at least three idle frames, attack playback, return to idle, KO stop/hide behavior, and safe visible bounds at 960×540 and 640×360. Runs may be grouped for speed but must identify the failing monster.

A contact sheet is reviewed for all 53 targets. Only representative browser screenshots are committed.

## Boundaries

### Always do

- Use the existing repository design as the visual identity source.
- Preserve the shared 4×2 frame order and runtime manifest contract.
- Keep prompts, references, accepted outputs, hashes, and review states traceable.
- Verify each wave before registering it.
- Preserve fallback behavior until a sheet is accepted and registered.

### Ask first

- Redesign or reinterpret an existing character.
- Change the shared frame layout, dimensions, playback API, or battle sizing.
- Add a dependency, external AI provider, project credential, schema, or content field.
- Replace an already accepted animation from batches 01–05.

### Never do

- Generate from a name alone when a repository design exists.
- Count duplicated frames, generic wobble, or whole-image transforms as animation.
- Edit monster stats, encounters, save data, or battle rules as part of this work.
- Put logic in `content/`, edit generated catalogs by hand, or overwrite production originals.
- Register a rejected or unreviewed image.

## Success Criteria

- All 53 frozen targets have accepted character-specific 4×2 battle sheets in `batch-06`.
- All 542 runtime monsters resolve to one animation spec; the remaining count is zero.
- New sheets pass automated image contracts and contact-sheet review.
- Every new ID passes real browser idle, attack, recovery, KO, loading, and responsive-bound checks.
- Focused tests, `check:fast`, content validation, build, and the final `check:full` gate pass.
- The user-facing preview opens an integrated battle with a newly animated target from the current branch.

## Open Questions

None. The request is to complete the remaining 53 characters without changing the established visual or runtime contract.
