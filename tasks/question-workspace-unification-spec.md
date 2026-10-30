# Spec: 問題レビュー・編集ワークスペース統合

## Objective

AIを使って教材を管理する開発者が、問題を探す・解いて確認する・編集する作業を同じ画面と選択文脈のまま行えるようにする。`playground.html` を唯一の通常入口とし、別デザインの編集ページへ移動して選択問題を失うUXをなくす。

## Assumptions

1. 「ページが違う」の根本問題は配色差だけでなく、問題選択と作業文脈が別ページで切れることである。
2. 左の問題ライブラリは編集とプレビューに共通の主導線として残す。
3. 既存エディタから再利用するのはフォーム編集だけとし、JSONコード編集、共有URL、共同編集、JSON入出力は削除する。
4. 問題の編集は既存どおりブラウザ上の下書きであり、リポジトリへ直接保存する新機能は今回追加しない。

## Design Brief

Designing an integrated question review/edit workspace for AI-assisted curriculum developers on the web.
Goal: find one real repository question, review it, edit it, and return to review without losing context.
Tone: calm, practical, trustworthy developer tool.
Main risk: three competing panes becoming cramped or the editor resetting to samples.
Must remember: one selected question, one workspace, edit and preview together.
Constraints: Preact, existing question renderer, development-build-only boundary, keyboard accessibility, 320px support, no new dependency.
Research needed: existing product style and concrete workspace/mode-switching pattern.
Path: direct build after approval.

## Research Summary and Reference Lock

### Sources reviewed

- Primary: current Question Playground and the user-provided screenshots. It establishes the white canvas, green accent, restrained borders, left library, and right work area.
- Functional reference: current Question Web Editor's visual form. It establishes field-level editing and validation without requiring users to touch JSON code.
- Journey evidence: the current transition loses the selected repository question and replaces it with a sample question, while back-navigation also drops the selection.

### Reference lock

- **Primary direction:** current Question Playground.
- **Preserve:** white canvas, green primary action, compact header, left problem library, rounded bordered work cards, human-readable result display.
- **Borrow only:** the existing editor's visual form controls and validation.
- **Role rules:** green remains the primary-action/selected-state color; JSON code is not exposed as an editing surface.
- **Media strategy:** reuse the real 960×540 renderer; no decorative media or generated assets.
- **Reject:** dark editor-only shell, duplicate preview pages, sample-question reset, nested iframe, three fixed columns at medium widths.
- **Token commitments:** reuse `playground.css` surface, border, radius, type, and responsive tokens instead of maintaining a second visual system.

### Decision ledger

| Decision                                             | Source                               | Rule                                        | Why                                                              |
| ---------------------------------------------------- | ------------------------------------ | ------------------------------------------- | ---------------------------------------------------------------- |
| Left library stays visible                           | User screenshots + Playground        | Preserve the established primary navigation | A selected repository problem remains the shared context         |
| Edit form and preview are always visible together    | User request                         | One workspace, no mode switch               | Removes the extra click while keeping one selected question      |
| Preview owns rendered output/results                 | Existing Playground                  | One renderer surface                        | Removes the editor's duplicate preview without losing capability |
| Edit area owns the visual form only                  | User clarification + existing editor | Do not expose JSON code editing             | Keeps the workflow understandable for non-coders                 |
| Old editor route and its dedicated shell are deleted | User clarification                   | One canonical workspace                     | Prevents the split UX from returning through another entry point |

## Tech Stack

- Preact + TypeScript strict
- Existing question contracts/renderers and `EditorQuestionForm`
- Vitest and Playwright
- No new dependencies

## Commands

- Fast checks: `pnpm check:fast`
- Focused tests: `pnpm test:related <changed-files>`
- E2E: `E2E_USE_DEV_SERVER=1 pnpm exec playwright test tests/e2e/playground-list.spec.ts tests/e2e/smoke.spec.ts`
- Full gates: `pnpm lint && pnpm check:architecture && pnpm test && pnpm validate:content && pnpm build`
- Developer build: `VITE_NQ_DEV_TOOLS=1 pnpm build`

## Project Structure

- `src/tools/playground.tsx`: unified shell, selected question, always-visible edit and preview areas.
- `src/tools/QuestionList.tsx`: shared problem navigation; no editing logic.
- `src/tools/EditorQuestionForm.tsx`: existing visual form reused beside the preview.
- `src/tools/editor.tsx`, `editor.html`, and editor-only helpers: removed after the visual form is integrated.
- `src/tools/playground.css`: canonical workspace visual system.
- `tests/e2e/`: selection, simultaneous edit/preview, legacy entry, responsive behavior.

## Code Style

Reuse current Preact state and callback patterns; do not introduce a new global store or generic workspace framework. The edit form and preview consume the same draft state.

```tsx
<EditorQuestionForm question={draft} onQuestionChange={updateDraft} />
<section aria-label={pgText('preview')}>{/* existing renderer */}</section>
```

## Testing Strategy

- Add a failing Playwright contract before implementation.
- Verify selecting a real problem and entering Edit shows that exact ID, not a sample.
- Verify the form and real renderer are visible together and a field edit updates the preview heading immediately.
- Verify the developer build no longer generates `editor.html`.
- Keep current 960px side-by-side and 320px stacked layout tests.
- Run repository full gates and compare the rendered screen to the reference lock.

## Boundaries

### Always

- Keep the developer-tools-only build boundary.
- Preserve keyboard focus across the form and preview controls.
- Preserve existing visual-form validation behavior.
- Keep real repository problem selection as the canonical starting point.

### Ask first

- Changing `src/questions/contracts.ts` or schemas.
- Adding direct filesystem/repository save behavior.
- Adding a new persistence or collaboration mechanism.

### Never

- Add tabs, dialogs, or another mode switch between editing and previewing.
- Embed the old editor in an iframe.
- Reset an existing selected question to a sample when entering edit mode.
- Expose the workspace in the public production build.

## Success Criteria

1. The normal user flow stays on `playground.html` with editing and preview visible together.
2. The selected question ID and current draft are shared by both areas.
3. The left problem library remains their shared navigation.
4. The visual form and validation are present with no editable JSON code field.
5. The existing renderer continues to run and score the current draft.
6. `editor.html` and editor-only entry code are removed; both developer-menu links target the unified `playground.html`.
7. The integrated screen uses the Playground visual system and remains usable at 960px and 320px.
8. Public `pnpm build` excludes the developer workspace; the developer build includes it.

## Open Questions

None. The user explicitly requested removal of the edit/review switch, JSON editing, and the old editor route.
