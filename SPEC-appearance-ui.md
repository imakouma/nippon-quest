# Spec: Appearance UI

## Objective

Make the existing player appearance editor clear and usable for elementary-school players without changing available appearance options or save behavior.

## Tech Stack

Preact, existing pixel-art CSS design tokens, `RubyLabel`, current appearance model, Playwright browser tests.

## Commands

- Focused tests: `pnpm exec playwright test tests/e2e/journey-setup.spec.ts tests/e2e/new-game-appearance.spec.ts tests/e2e/look-heading.spec.ts`
- Full verification: `pnpm lint && pnpm check:architecture && pnpm test && pnpm validate:content && pnpm build`
- Preview: `pnpm nrd`

## Project Structure

- Existing appearance component: retain current data flow and callbacks
- Existing appearance stylesheet: own the responsive presentation
- `tests/e2e/`: viewport, keyboard, and interaction coverage

## Code Style

Use the current design tokens and native buttons. Keep each appearance category as one labeled control group with a visible selected state.

## Testing Strategy

Verify all categories, selected states, previous/next controls, preview updates, keyboard focus, and containment at 960×540 and 640×540.

## Boundaries

- Always: preserve keyboard access, focus visibility, readable labels, and existing appearance values.
- Ask first: changing saved appearance shape or adding/removing appearance options.
- Never: encode state only through color or reduce touch targets below the existing UI standard.

## Success Criteria

- The preview is visually primary and never overlaps controls.
- Hair, skin, clothes, hairstyle, and eyes are aligned into predictable labeled rows.
- Selected options and previous/next actions are immediately distinguishable.
- The complete editor fits supported viewports without clipping or horizontal overflow.
- Existing save/apply behavior is unchanged.

## Open Questions

None. The existing pixel-RPG visual language remains authoritative.
