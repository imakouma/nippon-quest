# Capability Map: Animation Completion

Approved by the user on 2026-10-28.

| Module id                 | Responsibility                                                                                                      | Depends on                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `animation-coverage`      | Freeze the 111 assigned IDs, adopted references, completion states, and no-duplicate rules.                         | —                                             |
| `runtime-monsters`        | Produce and register battle animation sheets for the 89 unstarted runtime monsters.                                 | `animation-coverage`                          |
| `named-character-runtime` | Connect Michiru and Shiori to their fixed animation sheets while preserving the customizable protagonist renderer.  | `animation-coverage`                          |
| `animation-verification`  | Prove complete assignment coverage, asset validity, battle playback, responsive rendering, and catalog consistency. | `runtime-monsters`, `named-character-runtime` |

Build order: `animation-coverage` → (`runtime-monsters`, `named-character-runtime`) → `animation-verification`.

## Scope boundary

The six starter evolution sheets already count as completed animation assets. They remain outside the runtime monster manifest until the game design defines their monster records, stats, skills, and evolution conditions. Adding those gameplay definitions is not part of animation completion.

The built-in image generator is the production tool for missing sheets. This work does not configure an external model provider, add credentials, or route project prompts through OmniRoute.
