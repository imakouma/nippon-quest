# Workspace integration plan (2026-10-22)

## Goal

Preserve the shared checkout's uncommitted work without modifying that checkout,
then integrate the reviewable source/content changes onto the latest `imakouma/main`.

## Snapshot boundary

- Source base: `d3570f30e67fdbfc910679f9c9786b731f31d9ef`
- Integration branch: `codex/workspace-integration-20261022`
- Copied state: 653 modified, 1 deleted, 740 untracked files
- Verification: tracked binary diff hash and untracked path/content manifest matched
- Secret scan: no private-key or common API-token signatures detected
- Source checkout policy: read-only throughout this integration

## Constraints

- The untracked set is about 1.3 GB, mostly cinematic production assets.
- Two MP4 files exceed GitHub's normal 100 MB per-file limit:
  - `assets/cinematics/prologue-michiru/edit/base.mp4`
  - `assets/cinematics/prologue-michiru/prologue-michiru-ja.mp4`
- Keep all copied files locally. Do not add oversized media to ordinary Git history.
- Do not configure Git LFS or an external media store without an explicit storage decision.
- Storage decision for this integration: keep all 483 cinematic assets local and untracked at
  `../cinematic-assets-local` beside this worktree checkout;
  push only the Git-safe source/content/test/audio slice. Choose LFS or external object storage
  in a separate, explicit follow-up before publishing the cinematic files.
- Prefer the current game-design and architecture documents when old generated output conflicts
  with a newer source-of-truth contract.

## Integration slices

1. Preserve and inventory the copied state.
2. Separate source/content/tests from cinematic production media.
3. Commit the reviewable non-oversized slice as a recovery checkpoint.
4. Merge `imakouma/main` and resolve conflicts by feature boundary.
5. Regenerate declared generated artifacts instead of accepting stale copies blindly.
6. Run focused checks after each resolved slice.
7. Run the full repository verification set and a five-axis review.
8. Push the integration branch and open a PR; do not merge automatically.

## Merge result

- Latest integrated base: `imakouma/main` at `0b101227ab639e75e586b6f76902c18c744fbcac`.
- Exact copied source and the resolved merge remain recoverable in local-only branches
  `codex/workspace-source-snapshot-20261022-local` and
  `codex/workspace-integration-merge-20261022-local`.
- The publishable integration branch is squashed to one clean commit above the latest main so
  local absolute paths and intermediate history are not sent to the remote.
- Resolved 25 conflicts across specifications, generated audits, battle/overworld runtime,
  battle UI, music, and tests.
- Regenerated the manifest, asset catalog, curriculum audit, and curriculum-model audit.
- Focused TypeScript and unit verification passed after conflict resolution.
- Full repository verification, extra curriculum/world-map/battle-balance audits, staged security
  review, and real-browser desktop/narrow battle flows passed.

## Required verification

```bash
pnpm lint
pnpm check:architecture
pnpm test
pnpm validate:content
pnpm build
```

Also run `git diff --check`, a staged secret scan, and relevant browser/E2E checks for
user-facing changes before the PR is ready for review.
