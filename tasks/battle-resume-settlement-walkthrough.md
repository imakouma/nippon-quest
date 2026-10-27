# Walkthrough: Battle resume and exactly-once settlement

## Delivered behavior

- Save schema v13 stores one active battle with a monotonic sequence ledger and salvages an invalid snapshot without rejecting the rest of the save.
- Battle startup persists an `awaiting-command` snapshot before accepting input.
- A selected or scored command is persisted as `resolved-command`; `act` and presentation run without another write, and the next safe state is persisted only after presentation completes.
- Battle state, battle RNG, question RNG, subject-perfect counts, terminal victory rewards, and the recruit decision are restored across scene recreation.
- Settlement applies rewards or defeat loss once to the latest `GameState`, records the finalized sequence, and retains the settled encounter result until field handling completes.
- Save failures stop progress at the safe boundary and retry the latest registry state without applying settlement again.
- Overworld resumes active battles, replays settled result policy without reopening Battle, ignores duplicate `battle:end` races, and releases the snapshot only after field handling completes.
- Snapshots whose enemy no longer exists in current content are discarded without rewards or defeat penalties.

## Verification evidence

- Focused runtime/state/settlement/encounter tests: 102 tests passed before final review; the final focused review set passed 47 tests.
- `pnpm check:fast`: lint, Prettier, architecture boundaries/Scene budgets, and app TypeScript all passed.
- `pnpm test:related <all changed source files>`: 43 files and 506 tests passed.
- `git diff --check`: passed.
- Secret-pattern scan of the change: no findings.
- Graphify code-only graph refreshed with `graphify extract . --code-only --no-cluster`; no LLM or semantic labeling was used.

Per the integration-owner instruction, `pnpm test`, `pnpm build`, and `pnpm check:full` were not run in this worktree.

## Browser check

The unbuilt Vite server was opened at `127.0.0.1:4175` in the in-app browser. The title, save-slot, and new-game setup screens rendered correctly. The browser repeatedly failed while dynamically importing the large Overworld module graph, although the same server returned the transformed entry and Overworld modules directly; therefore the changed in-game resume path was not claimed as visually verified. No production build was run because the integration owner explicitly reserved build/full gates for integration.

## Self-review

- Correctness: safe phase transitions, terminal reward data, recruit choice, stale IDs, invalid content, and latest-state settlement are covered.
- Reliability: persistence is awaited; retry uses the latest registry state; duplicate end events share one field-completion promise.
- Security/privacy: no credentials, external providers, network payloads, or new dependencies were added.
- Maintainability: persistence, Battle checkpoint orchestration, and persisted encounter orchestration live in focused modules rather than growing Scene policy logic.
- Compatibility/testing: v12 migration and save round trips remain covered; random, boss, script, and arena policies continue through the existing lifecycle.

The only required review finding was a duplicate `battle:end` race that could acknowledge a settled snapshot before the first field handler finished. It was fixed by sharing the in-flight completion promise and covered by a regression test. No required findings remain.

## Integration notes

- Branch: `codex/battle-resume-settlement`
- Base: `db5de586`
- Do not cherry-pick only the runtime commit: it depends on the earlier v13 contract and settlement commits listed in the handoff.
- Generated `graphify-out/` remains ignored and is not part of the commit.
