# Roadmap relation lines walkthrough

## Result

`RoadmapGraph` now renders the existing `supportingLinks` DTO alongside prerequisite edges. The four supported kinds reuse the prepared `component`, `transfer`, `related`, and `chronological` CSS classes. Prerequisite progress, locking, saves, rewards, curriculum data, and layout are unchanged.

## Verification

- `pnpm exec vitest run tests/unit/roadmapMenu.test.ts` — 26 passed.
- `pnpm test:related src/ui/field/RoadmapGraph.tsx tests/unit/roadmapMenu.test.ts` — 26 passed.
- `pnpm check:fast` — lint, architecture, and app typecheck passed.
- `pnpm test` — 196 files / 1928 tests passed.
- `pnpm validate:content` — passed.
- `pnpm build` — passed.
- Production build opened at `127.0.0.1:4194`; the arithmetic roadmap rendered a `related` supporting edge with the expected class, while prerequisite-only lock progress remained intact.

The existing long `progress.spec.ts` scenario reached and passed the roadmap section, then exceeded its 420-second total timeout at the unrelated final save-reload assertion. No E2E source change was retained.
