# Implementation Plan: Completed Feature Integration 2026-10-26

## Overview

Inventory every local worktree, local branch, remote branch, and open pull request; integrate completed, non-superseded game features into one release branch; verify the combined runtime; publish it to `main`; and make the integration commit available as the common baseline for development chats without discarding any uncommitted work.

## Architecture Decisions

- Use `imakouma/main` commit `5b60bec2` as the last known-good production baseline.
- Integrate only committed, completed work. Preserve the two shared worktrees containing uncommitted art-library and UI changes.
- Treat the current game design and architecture documents as authoritative. Do not merge PR #21's physical-prefecture-border progression while the current design specifies post-mid-boss warp travel.
- Treat PR #17 as superseded because its old setup screen removes the current six-grade appearance customization flow.
- Merge the completed field-locomotion integration as a unit so its five runtime modules and final grounding fix remain together.
- Keep rollback simple: revert the integration merge commit and redeploy the preceding production commit.

## Task List

### Phase 1: Inventory and classification

- [x] Record branch, worktree, dirty-state, PR, and remote inventories.
- [x] Classify candidates as already integrated, superseded, specification-conflicting, in progress, or ready to merge.
- [x] Use the local code-only Graphify graph to identify `OverworldScene` and `FieldUi` as the high-impact integration boundaries.

### Phase 2: Integrate completed work

- [x] Create a dedicated integration branch/worktree from the current production baseline.
- [x] Merge the completed field-locomotion integration commits without touching dirty source worktrees.
- [x] Resolve conflicts against the current event, encounter, persistence, map-detail, and harbor modules by preserving both feature sets.
- [x] Review the combined diff for correctness, readability, architecture, security, and performance.

### Phase 3: Verify and release

- [x] Run focused locomotion, movement, field UI, encounter, and persistence tests.
- [x] Run `pnpm lint`, `pnpm check:architecture`, `pnpm test`, `pnpm validate:content`, and `pnpm build`.
- [x] Run the relevant Playwright flows and inspect the integrated preview in a real browser.
- [x] Update the code-only Graphify graph after material changes.
- [ ] Push the integration branch and `main`, wait for CI and Pages deployment, and verify the production URL.

### Phase 4: Development-chat availability

- [ ] Fast-forward clean integration worktrees to the final release commit.
- [ ] Leave dirty or active worktrees untouched and record the exact safe sync command/commit for their owning chats.
- [ ] Report every branch included, excluded, or still awaiting a specification decision.

## Risks and Mitigations

| Risk                                             | Impact   | Mitigation                                                                                                               |
| ------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `Overworld.ts` conflicts with newer runtime work | High     | Resolve semantically at extracted module boundaries and rerun architecture checks after each resolution.                 |
| Dirty shared worktrees lose user work            | Critical | Never reset, stash, merge into, or clean those worktrees; integrate from committed refs in an isolated worktree.         |
| Old branches reintroduce removed behavior        | High     | Compare behavior and tip trees; exclude superseded branches instead of merging by branch name alone.                     |
| Physical-border travel changes progression rules | High     | Keep PR #21 out until the game-design contract is explicitly changed.                                                    |
| CI-only timing failures                          | Medium   | Run focused E2E locally, then monitor the exact release SHA through GitHub Actions before declaring deployment complete. |

## Open Questions

- Whether to replace the current post-mid-boss warp progression with PR #21's physical prefecture-border travel. This requires an explicit game-design change and is not part of the safe integration release.
