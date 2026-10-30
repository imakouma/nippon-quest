# Roadmap relation lines production plan

## Goal

Render the existing `RoadmapNode.supportingLinks` in the learning roadmap without changing prerequisite locking, saves, rewards, curriculum data, or layout.

## Scope

- `src/ui/field/RoadmapGraph.tsx`: include the four existing supporting-link kinds in the SVG edge list and reuse the prepared CSS classes.
- `tests/unit/roadmapMenu.test.ts`: prove all four kinds render distinctly alongside the prerequisite line.
- Existing CSS, DTOs, relation projection, save schema, reward logic, and content remain unchanged.

## Steps

1. Add a failing component test for `component`, `transfer`, `related`, and `chronological` edges.
2. Extend the existing edge projection in `RoadmapGraph` with the minimum typed metadata needed for CSS classes and stable keys.
3. Run focused, related, fast, architecture, content, full test, and build gates.
4. Verify the roadmap in a real browser, review the diff, commit, open a PR, merge, and verify the production deployment.

## Risks

- Supporting edges could be mistaken for prerequisites; keep the existing dashed/color classes and never add them to `prerequisiteIds`.
- Filtered or missing source nodes must remain omitted; hidden nodes keep the existing hidden-edge styling.
