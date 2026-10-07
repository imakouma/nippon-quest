# Spec: Town Collision

## Objective

Remove invisible walls from all generated town maps. A tile that looks like open ground must be walkable unless a visible object, building edge, water boundary, or map boundary explains why movement is blocked.

## Tech Stack

TypeScript map generation in `scripts/scaffold-maps.ts`, Tiled JSON maps in `maps/`, Phaser map loading, and Vitest map validation.

## Commands

- Generate maps: `pnpm scaffold:maps`
- Focused tests: `pnpm exec vitest run tests/unit/maps.test.ts`
- Architecture: `pnpm check:architecture`
- Full verification: `pnpm lint && pnpm test && pnpm validate:content && pnpm build`

## Project Structure

- `scripts/scaffold-maps.ts`: source of generated town terrain and collision
- `scripts/data/towns.ts`: per-prefecture visual themes
- `maps/*-town.json`: generated runtime maps; do not hand-edit
- `tests/unit/maps.test.ts`: map reachability and collision invariants

## Code Style

Keep collision derived beside the tile placement that creates the visible obstacle; do not add runtime exceptions for individual towns.

## Testing Strategy

Add a generator-level invariant covering all 47 town maps, retain existing reachability checks, regenerate maps, then manually walk representative village and city layouts.

## Boundaries

- Always: fix the generator, regenerate all affected maps, preserve reachable transitions/NPCs/shops.
- Ask first: changing town dimensions, tile contracts, or map schema.
- Never: hand-edit generated town JSON or make all decorative tiles passable indiscriminately.

## Success Criteria

- Open-looking ground is not blocked by the collision layer in any generated town.
- Every transition, shop entrance, required NPC, and interactive object remains reachable.
- Visible buildings, water, trees, fences, and map edges remain blocking where appropriate.
- Automated map validation and manual browser checks pass.

## Open Questions

None. Existing visual tiles and interaction rules remain authoritative.
