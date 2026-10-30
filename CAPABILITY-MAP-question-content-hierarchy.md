# Capability Map: Question Content Hierarchy

## Approved direction

Organize question authoring data for humans and AI while preserving the existing flat runtime `QuestionBank` used for fast filtering and random selection.

## Modules

| Module ID                 | Responsibility                                                                                                                                                                                                                                    | Depends on                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `question-content-layout` | Migrate production questions into `subject / grade / unit / set.json`, cap sets at about 30 questions, preserve question values and stable IDs, generate a compact machine-readable catalog, and provide repeatable migration/validation tooling. | —                         |
| `question-browser-tree`   | Replace the Playground’s all-in-one navigation with an accessible tree for subject → grade → unit → set, then show only the selected scope in the existing problem table and stage.                                                               | `question-content-layout` |

Build order:

```text
question-content-layout
        ↓
question-browser-tree
```

## Shared boundary

- Authoring/storage hierarchy changes; runtime selection semantics do not.
- `QuestionBase`, renderer schemas, question IDs, payloads, explanations, tags, curriculum links, mastery, and save data remain compatible.
- The generated manifest/catalog is the boundary between file layout and the Playground.
- Migration must prove that the ordered question-value multiset before and after is equivalent, apart from file paths and regenerated file-level review metadata.
- Valid human approvals must not be silently discarded. Current review ledgers are inspected before migration and updated through existing tooling or an explicit migration step.

## Explicit exclusions

- No new question type or renderer.
- No change to battle/event question scoring or adaptive selection ratios.
- No dependency addition.
- No one-question-per-file layout.
- No merge or push from this work branch.

## Verification gates

1. Data parity: IDs and complete question JSON values are preserved, no duplicates or omissions, and every production file follows the target path/size rules.
2. Runtime parity: `QuestionBank` and focused question-selection tests remain green.
3. UI behavior: tree navigation, counts, filtering, URL deep links, keyboard access, narrow layout, and existing question execution work in a real browser.
4. Repository gates: curriculum/content validation, architecture check, tests, lint, and build are run; pre-existing unrelated failures are separated from regressions.
