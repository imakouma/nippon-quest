# Spec: 学習ロードマップの通常表示と教科解放

## Objective

通常プレイの学習ロードマップでは学年・おすすめ時期の開発用フィルタを隠し、教科ボタンに表示される現在学年だけで迷わず進めるようにする。理科・社会・英語は、低学年の基礎教科を終えた時点で自動解放する。

## Approved behavior

- 通常モードでは「学年」「おすすめ時期」と説明ボタンを表示しない。
- 開発者モードでは既存の学年・時期フィルタ、説明ボタン、全教科を表示する。
- 通常モードで最初から表示する教科は国語・算数・生活科。
- 生活科の1・2年の必修単元をすべてクリアすると、理科と社会を表示・選択できる。
- 国語と算数の1・2年の必修単元をすべてクリアすると、英語を表示・選択できる。
- 「クリア」は既存ロードマップと同じ状態（習熟度80%以上かつ3回答以上）とし、復習状態もクリア済みとして扱う。
- `supplementary` 単元は解放条件を妨げない。
- 既存セーブの進捗から毎回導出し、新しい保存項目や移行処理は追加しない。

## Design brief and reference lock

Designing the learning roadmap for elementary-school players on landscape web/tablet.
Goal: show only the next useful subject choice in normal play while keeping diagnostic controls in developer mode.
Tone: the current compact pixel-RPG interface.
Main risk: exposing curriculum administration controls to children or hiding subjects after prerequisites are already complete.
Constraints: existing tokens, RubyText labels, 48px touch targets, no new visual language.
Research needed: direct-build comparison against the supplied screenshot and the existing roadmap screen.

- Primary reference: the supplied screenshot and the repository's current roadmap toolbar.
- Preserve: navy pixel-frame canvas, full subject names, subject colors, current-grade badges, existing focus treatment.
- Borrow only: none; this is a visibility and progression change, not a redesign.
- Reject: new lock cards, tooltips, gradients, or explanatory copy that adds clutter.
- Decision ledger: the user request owns control visibility and unlock rules; existing project tokens own all visuals; the existing mastery predicate owns completion semantics.

## Commands

- Focused tests: `pnpm vitest run tests/unit/roadmapMenu.test.ts tests/unit/roadmapSubjectUnlocks.test.ts`
- End-to-end: `pnpm playwright test tests/e2e/progress.spec.ts`
- Full checks: `pnpm lint`, `pnpm check:architecture`, `pnpm test`, `pnpm validate:content`, `pnpm build`
- Preview: `pnpm nrd -- --host 127.0.0.1 --port 4192`

## Project structure

- Unlock policy: `src/core/learning/subjectUnlocks.ts` (pure progress policy)
- Roadmap presentation: `src/ui/field/RoadmapView.tsx`
- Developer-mode boundary: `src/ui/field/MenuOverlay.tsx`, `src/scenes/Overworld.ts`
- Unit tests: `tests/unit/roadmapSubjectUnlocks.test.ts`, `tests/unit/roadmapMenu.test.ts`
- Browser test: `tests/e2e/progress.spec.ts`

## Boundaries

- Always: derive availability from roadmap nodes; preserve existing mastery and visibility rules; test normal and developer modes.
- Ask first: changing mastery thresholds, schemas, curriculum content, or persistence.
- Never: mutate save data from the UI; hide developer controls while developer mode is on; count supplementary units as prerequisites.

## Success criteria

- Normal mode has no grade/term filter DOM and exposes only currently unlocked subjects.
- Developer mode retains the existing filters and exposes every subject.
- Completing all required Seikatsu grade 1–2 nodes unlocks both Science and Social Studies.
- Completing all required Japanese and Math grade 1–2 nodes unlocks English only when both subjects are complete.
- Unit, browser, architecture, content, lint, and build checks pass.

## Open questions

None. The implementation request in the user message is treated as approval of this behavior.
