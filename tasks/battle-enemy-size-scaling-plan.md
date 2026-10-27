# Battle enemy size scaling implementation plan

Approved specification: [`SPEC-battle-enemy-size-scaling.md`](../SPEC-battle-enemy-size-scaling.md)

## Goal

Use the existing per-character `heightCm` settings to size enemy bodies in battle. Compress physical ratios with a square-root curve, keep small characters legible, cap large characters inside each battle layout, and measure visible pixels instead of transparent frame padding.

## Assumptions fixed by the approved spec

- `sites/nihon-quest-art-library/body-sizes.json` in the original workspace is the import source.
- `heightCm` controls uniform sprite scale; weight and bag footprint do not.
- Length and wingspan remain metadata and do not independently enlarge sprite height.
- `koshinetsu-boss` explicitly aliases the 480cm size of its current `tohoku-boss-rokufuyu` art until it receives a dedicated setting.
- Only enemy sprites change in this task. Partner and hero sizing stay unchanged.
- No new dependency is needed.

## Impact map

Graphify code-only extraction identified the direct path as:

```text
content schema/loader
  → ContentIndex
  → Battle.buildStage()
  → battle/monsterStage.ts
  → rendering/monsterImageScale.ts
```

Direct test consumers include `tests/unit/content.test.ts` and `tests/unit/monsterStage.test.ts`. Browser coverage belongs in a focused battle size E2E spec.

## Slice 1 — Runtime body-size data contract

1. Add a standalone `characterBodySizes` content schema and type without changing `Monster` or save schemas.
2. Add `content/character-body-sizes.json`, imported mechanically from the approved art-library data with only runtime fields.
3. Load the file into `ContentIndex` as one validated content kind.
4. Add reference validation proving every monster resolves to a size directly or through the single explicit compatibility alias.
5. Regenerate manifest, content bundle, and JSON schema.

TDD proof:

- First add tests that fail because the standalone body-size contract and coverage do not exist.
- Make the smallest schema/data/import changes needed to pass.

Focused verification:

```bash
pnpm test:related src/core/content/characterBodySizes.ts
pnpm validate:content
```

## Slice 2 — Physical-height compression and visible bounds

1. Replace role-based stage scaling for enemies with a pure `heightCm → targetBodyHeight` function.
2. Store logical-pixel body-size limits on `BattleLayout` so side and depth presentations have explicit reference, minimum, and maximum heights. The Phaser canvas remains 960×540; a 640×360 viewport scales those logical pixels by about 2/3.
3. Add a pure alpha-bounds scanner that finds the neutral frame's visible body bounds.
4. Convert target body height and visible body height into one stable Phaser scale.
5. Preserve aspect ratio and compute an origin anchored to the visible body's bottom center.

TDD proof:

- RED tests cover 10cm, 32cm, 38cm, 100cm, 120cm, 350cm, 580cm, monotonicity, transparent padding, and empty-alpha fallback.
- GREEN implementation uses the approved square-root curve and layout clamps.
- Mutate the square root or clamp condition during final review and confirm the tests fail, then restore it.

Focused verification:

```bash
pnpm test:related src/scenes/battle/monsterStage.ts src/rendering/monsterImageScale.ts
pnpm check:fast
```

## Slice 3 — Battle integration

1. In `Battle.buildStage()`, resolve the enemy's body-size setting.
2. Create the existing animated or fallback sprite unchanged.
3. Measure its neutral visible body bounds once after texture creation.
4. Apply the target body height, visible-body origin, and proportional shadow width.
5. Leave partner sizing and battle logic untouched.

Focused verification:

```bash
pnpm test:related src/scenes/Battle.ts src/scenes/battle/monsterStage.ts src/rendering/monsterImageScale.ts
pnpm check:fast
```

## Slice 4 — Browser verification and tuning

Add a focused Playwright spec that checks actual opaque body bounds rather than the 128px animation frame box.

Representative enemies:

- `kanagawa-pichirasu` — 10cm minimum class
- `yamanashi-suzurin` — 32cm
- `yamanashi-suzuri-tatsujin` — 120cm
- `yamanashi-boss-suisho-ryu` — 350cm
- `toyama-boss-tateyama-ou` — 580cm maximum class

Run at 960×540 and 640×360. Verify body-height ordering, lower and upper bounds, stable feet, attack return, HUD clearance, and zero console errors. Use the canonical depth view and inspect the side view as a regression check.

If the first render shows insufficient contrast or overlap, tune only the shared layout constants. Do not add per-ID corrections.

## Final review and delivery

1. Review the diff across correctness, readability, architecture, security, and performance.
2. Perform the required mutation check on the scale formula.
3. Update the Graphify code-only graph after material code changes.
4. Run the full repository gates:

```bash
pnpm lint
pnpm check:architecture
pnpm test
pnpm validate:content
pnpm build
```

5. Start a fresh worker preview on port 4175 or later and open the representative battle in the in-app browser.
6. Commit the feature branch with a descriptive conventional commit. Do not push or merge unless the user requests it.

## Done when

- Every enemy resolves to an explicit physical height.
- Small characters remain visible and large characters remain inside layout limits.
- `yamanashi-suzuri-tatsujin` renders materially larger than `yamanashi-suzurin` because of 120cm vs 32cm settings.
- Animation and fallback art use visible body pixels, not transparent frame dimensions.
- Focused tests, full gates, browser verification, and code review pass.
