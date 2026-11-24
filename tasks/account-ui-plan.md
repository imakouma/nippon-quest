# Account UI improvements — 2026-11-25

## Brief and reference lock

Improve the existing NIHON QUEST account dialog for children and guardians. The primary goals are to sign in with Google, understand where adventures are saved, and select an adventure safely. Direct build is authorized by the user's request.

Dominant visual reference: the existing account window (`tasks/account-cloud-save/google-only.png`) and title/save-slot windows. Retain the navy pixel window, cream borders, yellow headings, RubyLabel typography, and fixed 960×540 game coordinate system. Refero MCP is unavailable; bundled Refero `craft-details.md` (focus, destructive confirmation, async feedback) and `copywriting.md` (specific actions, helpful errors) supply interaction guidance.

| Decision                                                     | Evidence / rationale                                                                      |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| One prominent Google action, brief explanation before it     | Existing Google-only scope; primary-action hierarchy                                      |
| Saving steps and guardian details below the primary action   | Children need a short next step; retain privacy information without dominating the screen |
| Compact adventure rows with named status badges              | Existing save-slot model; status must not depend on color                                 |
| Separate account management from adventure saving            | Export/logout/delete are occasional actions                                               |
| Cancel-first confirmation for replacement and pending logout | Refero destructive-action/focus guidance; retain local data and explicit consent          |
| Feedback next to the top of scrollable content               | Existing bottom-only messages can be invisible                                            |

## Scope and acceptance

- Keep Google-only authentication, owner boundaries, server validation and existing data formats.
- Explain unavailable login, empty saves, pending uploads, and conflicting saves.
- Prevent duplicate requests; provide operation-specific failure messages and truthful completion messages.
- Never imply a successful cloud upload solely because the current sync routine resolved (it retains pending writes on network errors).
- Confirm conflict replacement and logout with unsent changes. Escape cancels confirmation; focus returns to the initiating action; Tab stays in the dialog including disclosures.
- Reuse current Preact/CSS stack with no new dependencies or profile data.

## Verification plan

Extend account browser regressions for failure/retry, confirmation cancellation/default focus, pending logout, keyboard navigation and narrow layouts. Run focused account tests, check:fast, test TypeScript and one build. Inspect rendered signed-out, signed-in and conflict states. Commit only this worktree; integration and production are separate.
