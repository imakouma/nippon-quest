# Spec: Drag Equipment

## Objective

Let players drag weapons and other equippable items from the reserve list onto valid cells around the hero, while preserving the existing click and keyboard equipment flow.

## Tech Stack

Preact pointer/drag events, existing bag view model and equipment callbacks, Vitest model tests, Playwright interaction tests.

## Commands

- Focused unit tests: `pnpm exec vitest run tests/unit/bag.test.ts tests/unit/menuView.test.ts`
- Focused E2E: `pnpm exec playwright test tests/e2e/bag-interactions.spec.ts`
- Full verification: `pnpm lint && pnpm check:architecture && pnpm test && pnpm validate:content && pnpm build`
- Preview: `pnpm nrd`

## Project Structure

- Existing bag/equipment model: remains the authority for valid cells and item movement
- Existing bag UI: adds drag source, drop target, and visual feedback only
- Existing scene callbacks: remain the mutation boundary
- Tests: cover model rules and pointer interaction

## Code Style

Reuse the current move/equip action instead of creating a second drag-specific state path. Native buttons remain available for click and keyboard users.

## Testing Strategy

Cover reserve-to-valid-cell equip, equipped-item movement, occupied-cell behavior according to existing rules, invalid drop rollback, and unchanged click/keyboard operation.

## Boundaries

- Always: expose valid drop targets visually and provide equivalent non-drag controls.
- Ask first: changing equipment adjacency rules, item compatibility, or save schema.
- Never: equip an item by bypassing model validation or make drag the only input method.

## Success Criteria

- A weapon can be dragged from the reserve list to a model-approved equipment cell.
- Equipped items can be moved between valid cells using the same existing rules.
- Invalid or cancelled drops leave state unchanged and remove all drag feedback.
- Mouse and touch-pointer behavior are supported; click and keyboard controls still work.
- Equipment state persists through the existing save path.

## Open Questions

None. Occupancy, compatibility, and placement behavior follow the existing equipment model.
