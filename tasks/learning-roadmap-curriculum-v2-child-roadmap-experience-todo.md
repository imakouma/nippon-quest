# Task List: child-roadmap-experience

## Status and execution contract

- Module: `child-roadmap-experience`
- Phase: 3 / Task breakdown
- Task-list base commit: `1e0065daba4a62682916db68435365f404ec23ef`
- Approved specification: `SPEC-child-roadmap-experience.md`
- Approved plan: `tasks/learning-roadmap-curriculum-v2-child-roadmap-experience-plan.md`
- Execution order: Task 1 through Task 7 is sequential. Do not parallelize tasks that edit the same UI/test files.
- Task size: each task is one focused session and touches no more than five files.
- RED rule: every behavior change begins in its preceding RED task. Do not combine a RED task with its GREEN task.
- Ownership rule: this module edits only the files named by the task being executed. Scene, Core, shared provider contracts,
  E2E, save fixtures, and adaptive question selection remain integration-owned.
- Completion rule: do not weaken or delete an existing expectation to make a new test pass.

## Wave 3 start gate

Complete this checklist before Task 1. If any item is false, stop implementation and return the branch to the integration owner;
do not create a UI-local provider type or temporary Scene adapter.

- [ ] Record the exact integrated commit IDs for `roadmap-view-model`, `adaptive-roadmap-practice`, and
  `math-learning-content-pilot`, and verify each is an ancestor of the implementation branch with
  `git merge-base --is-ancestor <commit> HEAD`.
- [ ] Confirm the integrated provider contract exposes `questionId`, `actualUnitId`, display-ready actual Unit name,
  subject, incomplete reason, completion reason, completed/startable state, progress count, and `allComplete`.
- [ ] Confirm adaptive practice starts the exact supplied `questionId`; it must not fall back to random selection within a Unit.
- [ ] Confirm the branch starts clean and dedicated: `git status --short --branch`, `git rev-parse HEAD`, and
  `git branch --show-current` show no unrelated or uncommitted changes.
- [ ] Confirm `tasks/plan.md`, `tasks/todo.md`, `FieldUi.tsx`, `field.css`, `src/core/**`, `src/scenes/**`,
  `src/shared/menuModel.ts`, `src/questions/**`, `src/core/state/**`, and `schemas/**` are outside this module's edit set.

## Dependency order

```text
Wave 3 start gate
  └─ Task 1 RED: today-plan rendering and exact-start contract
       └─ Task 2 GREEN: today-plan UI and i18n
            └─ Checkpoint A
                 └─ Task 3 RED: focus return and polite announcement
                      └─ Task 4 GREEN: focus return and polite announcement
                           └─ Checkpoint B
                                └─ Task 5 RED: responsive, motion, and input regressions
                                     └─ Task 6 GREEN: responsive and reduced-motion finish
                                          └─ Checkpoint C
                                               └─ Task 7: module gate, review, commit, and handoff
```

## Task 1: RED — lock today-plan rendering and exact-start behavior

**Description:** Add failing component tests for the provider-owned today plan before rendering code changes. Cover exact item
counts, provider order, reason/completion copy, empty versus all-complete state, and the `questionId` callback boundary.

**Acceptance criteria:**

- [ ] Tests cover 0/1/2/3 items, partial/all-complete states, four incomplete reasons, and `review | diagnosis` completion reasons.
- [ ] Tests require subject plus actual Unit name, no placeholder/disabled CTA, and no required problem-name display.
- [ ] Tests require only an incomplete native CTA to call once with `questionId`, never `actualUnitId`, and fail for the intended missing UI behavior.

**Verification:**

```bash
pnpm test:unit tests/unit/roadmapMenu.test.ts -t "きょうの3つ|推薦理由|完了理由|開始"
git diff --check
```

The focused Vitest command must be RED because the new behavior is not implemented; its failure must be an expectation failure
for the new today-plan contract, not a fixture/type/import crash.

**Dependencies:** Wave 3 start gate.

**Files likely touched:**

- `tests/unit/roadmapMenu.test.ts`

**Estimated scope:** XS — 1 file.

## Task 2: GREEN — render today plan and route exact question identity

**Description:** Make Task 1 green by passing the integrated provider model through `MenuOverlay`, rendering a small local today
section in `RoadmapView`, adding exhaustive i18n mappings, and applying only the minimum structural styling needed for the slice.

**Acceptance criteria:**

- [ ] The overview renders 0–3 provider-ordered items and distinguishes empty candidates from `allComplete` without synthesizing items.
- [ ] Incomplete and completion reasons use exhaustive RubyText/i18n mappings; completed items are static and carry a visible symbol plus text.
- [ ] The start callback passes exactly one `questionId`; UI code does not import Scene, GameState, AttemptEvent, QuestionBank, or persistence APIs.

**Verification:**

```bash
pnpm test:unit tests/unit/roadmapMenu.test.ts -t "きょうの3つ|推薦理由|完了理由|開始"
pnpm test:related src/ui/field/RoadmapView.tsx src/ui/field/MenuOverlay.tsx tests/unit/roadmapMenu.test.ts
pnpm validate:content
git diff --check
```

**Dependencies:** Task 1.

**Files likely touched:**

- `src/ui/field/RoadmapView.tsx`
- `src/ui/field/MenuOverlay.tsx`
- `src/ui/field/menu.css`
- `content/i18n/ja.json`

**Estimated scope:** M — 4 files.

## Checkpoint A: Rendering boundary after Tasks 1–2

- [ ] Preserve the RED failure evidence from Task 1 and the GREEN result from Task 2 in the implementation handoff.
- [ ] Confirm `git diff --name-only` contains only Task 1–2 candidate files.
- [ ] Confirm the UI imports the integrated provider type rather than declaring a duplicate type or reading raw learning state.
- [ ] Confirm score 0 may display today-plan completion but no reward, mastery, save, or battle-selection code was changed.
- [ ] Confirm `tasks/plan.md`, `tasks/todo.md`, the approved SPEC/plan, Core, Scene, shared, and schema remain unchanged.

## Task 3: RED — lock focus return, fallback, and one-shot announcement

**Description:** Add failing tests for the answer-return lifecycle: initial focus, same-`questionId` focus after an answer, static
completed-item focus, heading fallback when the item disappears, and a single polite/atomic completion announcement.

**Acceptance criteria:**

- [ ] Tests require focus priority of return item → first startable today CTA → today heading without adding positive `tabIndex` values.
- [ ] Tests require the completed static item to be programmatically focusable and the status text to include item identity and progress once.
- [ ] Tests prove rerender, subject changes, Escape/X/back, close/I, Enter, and Space do not duplicate callbacks or announcements.

**Verification:**

```bash
pnpm test:unit tests/unit/roadmapMenu.test.ts -t "フォーカス|通知|戻る|Enter|Space"
git diff --check
```

The focused command must be RED only for the missing focus/announcement contract; pre-existing back and keyboard cases must remain green.

**Dependencies:** Task 2 and Checkpoint A.

**Files likely touched:**

- `tests/unit/roadmapMenu.test.ts`

**Estimated scope:** XS — 1 file.

## Task 4: GREEN — implement deterministic focus and polite completion status

**Description:** Make Task 3 green using the one-shot return `questionId` passed through `MenuOverlay`. Resolve the item by stable
data identity after DOM commit, focus the completed/static target or heading fallback, and update one dedicated polite status once.

**Acceptance criteria:**

- [ ] Initial and answer-return focus stays inside the dialog and follows the specified priority without resetting graph pan/zoom state.
- [ ] Completed items/headings use `tabIndex={-1}` only for programmatic focus; ordinary Tab order gains no extra stop.
- [ ] One `polite`/atomic status announces only an answer-return completion and does not repeat on rerender or focus movement.

**Verification:**

```bash
pnpm test:unit tests/unit/roadmapMenu.test.ts -t "フォーカス|通知|戻る|Enter|Space"
pnpm test:related src/ui/field/RoadmapView.tsx src/ui/field/MenuOverlay.tsx tests/unit/roadmapMenu.test.ts
pnpm check:architecture
git diff --check
```

**Dependencies:** Task 3.

**Files likely touched:**

- `src/ui/field/RoadmapView.tsx`
- `src/ui/field/MenuOverlay.tsx`
- `content/i18n/ja.json`

**Estimated scope:** M — 3 files.

## Checkpoint B: Interaction boundary after Tasks 3–4

- [ ] Preserve the RED failure evidence from Task 3 and the GREEN result from Task 4.
- [ ] Confirm `document.activeElement`, callback count, and live-region output are tested as user-observable behavior.
- [ ] Confirm Escape/X returns one menu level, in-screen back matches it, close/I closes the menu, and native Enter/Space fires once.
- [ ] Confirm merely opening, focusing, selecting, panning, zooming, or pinching the roadmap never writes GameState.
- [ ] Confirm no Scene, save, provider, adaptive-selection, or graph implementation file entered the diff.

## Task 5: RED — lock responsive, reduced-motion, graph, and input invariants

**Description:** Add the final failing unit/CSS contract tests before visual styling. Lock semantic class hooks, reduced-motion for
today UI and the current roadmap node, and preserve the existing graph/back/input regression suite as the baseline.

**Acceptance criteria:**

- [ ] Tests require semantic today/card/CTA/focus/status hooks, no fake/disabled item, and a reduced-motion override for new motion and current-node pulsing.
- [ ] Existing tests continue to protect zoom 20–160%, wheel pan/zoom, pointer drag, pinch, click suppression, minimal ensure-visible, and no persistent zoom controls.
- [ ] Existing input tests continue to protect Tab/Shift+Tab, native Enter/Space single activation, Escape/back, mouse, touch, and pointer behavior.

**Verification:**

```bash
pnpm test:unit tests/unit/roadmapMenu.test.ts -t "レスポンシブ|モーション|ズーム|パン|ピンチ|キーボード"
pnpm test:unit tests/unit/roadmapMenu.test.ts
git diff --check
```

The first command must be RED only for the missing style/motion contract. The pre-existing graph/input cases in the full file must stay green.

**Dependencies:** Task 4 and Checkpoint B.

**Files likely touched:**

- `tests/unit/roadmapMenu.test.ts`

**Estimated scope:** XS — 1 file.

## Task 6: GREEN — finish responsive layout, target size, focus, and reduced motion

**Description:** Make Task 5 green with CSS-first changes and only the minimal `RoadmapView` markup adjustment required by those
styles. Preserve the locked visual reference and leave `RoadmapGraph.tsx` behavior unchanged.

**Acceptance criteria:**

- [ ] Today cards use a full-width overview row, fit 960×540, stack at 640×540, and preserve controls/scroll reachability at 844×390.
- [ ] Interactive targets remain at least 48×48 CSS px with visible focus; long RubyText wraps without truncating its accessible name.
- [ ] `prefers-reduced-motion: reduce` removes new motion and current-node pulsing while static color, border, symbol, and text retain meaning.

**Verification:**

```bash
pnpm test:unit tests/unit/roadmapMenu.test.ts
pnpm test:related src/ui/field/RoadmapView.tsx src/ui/field/RoadmapGraph.tsx src/ui/field/MenuOverlay.tsx tests/unit/roadmapMenu.test.ts
pnpm check:fast
pnpm validate:content
git diff --check
```

**Dependencies:** Task 5.

**Files likely touched:**

- `src/ui/field/menu.css`
- `src/ui/field/RoadmapView.tsx`

**Estimated scope:** S — 2 files.

## Checkpoint C: UI module completion after Tasks 5–6

- [ ] Preserve the RED failure evidence from Task 5 and the GREEN result from Task 6.
- [ ] Confirm `RoadmapGraph.tsx` has no diff and its graph/input regression suite passes unchanged.
- [ ] Use a temporary 4175-or-higher preview only if coordinated with the integration owner; verify 960×540, 640×540,
  844×390, 200% text zoom, keyboard, mouse, touch emulation, and reduced motion, then stop that server.
- [ ] Do not use or replace canonical port 4174 in this module worktree.
- [ ] Confirm no new dependency, renderer, persistent zoom control, generic design system, or hard-coded Japanese TSX string was added.

## Task 7: Run the module gate, review the diff, commit once, and prepare handoff

**Description:** Run the complete focused gate for the module, perform the five-axis review, fix only in-scope defects through the
appropriate earlier RED/GREEN task, then create one logical implementation commit and prepare an evidence-based integration handoff.

**Acceptance criteria:**

- [ ] Focused lint, architecture, related tests, content validation, diff checks, and five-axis review all pass with no weakened expectations.
- [ ] The final diff contains only the five allowed implementation files, with `RoadmapGraph.tsx` unchanged and no secrets or generated artifacts.
- [ ] One implementation commit records branch, commit ID, RED/GREEN evidence, verification results, preview result, and integration-owned follow-ups.

**Verification:**

```bash
pnpm lint
pnpm check:architecture
pnpm test:related src/ui/field/RoadmapView.tsx src/ui/field/RoadmapGraph.tsx src/ui/field/MenuOverlay.tsx tests/unit/roadmapMenu.test.ts
pnpm validate:content
pnpm check:fast
git diff --check
git status --short --branch
```

Do not run `pnpm check:full`, the complete `pnpm test`, or `pnpm build` in this module worktree. The integration owner runs the full
gate once after merging all Wave 3 modules.

**Dependencies:** Task 6 and Checkpoint C.

**Files likely touched:** None expected; inspect the existing Task 1–6 diff. Any correction returns to the owning task and its RED test.

**Estimated scope:** XS — verification/review/commit only, 0 new files.

## Regression invariants required before handoff

- [ ] Today-plan completion never grants or relaxes `learning-fragment` mastery rewards; `mastery.n >= 3` and
  `mastery.value >= 0.8` remain required and idempotent through `masteredRewardUnits`.
- [ ] Mistake-correction rewards still require score 1 on previously missed distinct questions and remain idempotent through
  `correctedRewardQuestionIds`; score 0 today completion is not treated as correctness or mastery.
- [ ] RPG experience, gold, damage, inventory, region unlocks, and battle question selection remain unchanged, including the
  70% weakness / 30% review selection behavior.
- [ ] `SCHEMA_VERSION = 13` remains unchanged; no persistent field, migration, schema, or UI-owned normalization is added.
- [ ] Opening, focusing, selecting, scrolling, panning, zooming, pinching, or closing the roadmap does not mutate GameState.
- [ ] UI forwards `questionId` and `actualUnitId` unchanged and does not recalculate ranking, date boundaries, completion,
  candidate fill, deduplication, Unit normalization, or question choice.

## Integration-owner handoff checklist

The module implementation commit must not include these changes. Hand the commit and evidence to the single integration owner.

### Required wiring

- [ ] Pass the integrated today plan from `Overworld.openMenu().draw()` to `MenuOverlay`.
- [ ] Route the today CTA's exact `questionId` to adaptive practice; keep graph `onRoadmapSelect(unitId)` separate and never fall
  back to random Unit selection for a today item.
- [ ] After an answer, recompute the provider model and pass the starting `questionId` once when reopening the roadmap.

### Integration-owned files

- [ ] `src/scenes/Overworld.ts`
- [ ] Integrated `src/scenes/overworld/roadmapPractice.ts` or its adaptive-practice successor
- [ ] `tests/e2e/progress.spec.ts`
- [ ] `tests/e2e/ui-accessibility.spec.ts`
- [ ] The representative v13 save fixture/test selected by the integration owner

### Integration verification

- [ ] Browser-test 0/1/2/3 items, partial/all complete, score 0 completion, `review | diagnosis`, answer → return → same-item
  focus → one polite notice → reload.
- [ ] At 960×540, 640×540, and 844×390 verify bounding boxes, no page-level horizontal overflow, 48px targets, 200% text
  zoom, keyboard/mouse/touch, drag/pinch/wheel, Escape/back, and reduced motion.
- [ ] Import a representative v13 save, answer, save, and reload; compare mastery rewards, correction rewards, inventory,
  region progress, acquired roadmap progress, and 70% weakness / 30% review battle selection.
- [ ] Run `graphify update .`, the relevant `graphify affected` query, and `pnpm check:full` once on the integrated branch.
- [ ] Stop the old canonical server, start the latest integrated build on `127.0.0.1:4174`, verify the normal route with
  `?resetSaves=1` and v13 compatibility separately, and leave the verified screen open in the Codex in-app browser.

## Final clean and commit checklist

- [ ] `git diff --name-only` before commit contains only `tests/unit/roadmapMenu.test.ts`,
  `src/ui/field/RoadmapView.tsx`, `src/ui/field/MenuOverlay.tsx`, `src/ui/field/menu.css`, and `content/i18n/ja.json`.
- [ ] `RoadmapGraph.tsx`, Core, Scene, shared, questions, state/save, schema, content bundles, generated manifests,
  `tasks/plan.md`, `tasks/todo.md`, the approved SPEC/plan, and this Phase 3 todo have no implementation-time diff.
- [ ] `git diff --check`, focused verification, secret scan, and five-axis review are clean before staging.
- [ ] Stage only the allowed implementation files and create one atomic implementation commit on the dedicated `codex/` branch.
- [ ] After commit, `git status --short --branch` is clean and the handoff reports branch, full commit ID, changed files,
  RED/GREEN evidence, commands/results, preview state, invariants, and integration-owned work.

## Open questions

None. Identity, reason mappings, actual Unit display name, empty/all-complete distinction, focus lifecycle, rewards/save/input
invariants, and integration ownership are fixed by the approved specification and plan.
