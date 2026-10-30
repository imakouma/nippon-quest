# Battle Party Presentation Verification

Verified: 2026-10-30

## Implemented

- The customizable protagonist now uses Phaser sprite-sheet animation in battle.
- Idle, attack, hurt, knockout, and victory each use named pixel-frame sequences.
- Idle changes upper-body and leg pixels instead of moving one unchanged image vertically.
- All existing appearance choices and 47 equipment costumes continue through the generated battle sheet.
- Existing five normal-attack movements, skill presentation, and companion animation/UI remain in place.

## Automated verification

- `pnpm lint`
- `pnpm check:architecture`
- `pnpm test` — 202 files, 1,974 tests
- `pnpm validate:content` — 47 areas, 542 monsters, 462 items, 37 skills
- `pnpm build` — 502 modules transformed
- `pnpm exec playwright test tests/e2e/hero-battle-animation.spec.ts` — 960×540 and 844×390
- Companion regression:
  - battle recruitment presentation
  - Iwate companion choice, persistence, formation, and battle sprite

## Manual visual review

- Reviewed idle and victory screenshots at 960×540 and 844×390.
- Confirmed the protagonist, enemy, HP panel, and message panel remain within the battle viewport.
- Confirmed the victory pose faces forward with raised arms and the idle pose changes character pixels.
- Confirmed no page errors were reported by the protagonist animation E2E.

## Preview

`http://127.0.0.1:4183/?debug=battle&enemy=aomori-ringoron&lv=5`

