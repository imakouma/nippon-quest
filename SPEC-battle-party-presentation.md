# Spec: Battle Party Presentation

Module id: `battle-party-presentation`

## Objective

Complete and verify the protagonist's animation specifically in the battle scene while preserving the
customizable appearance, equipped costumes, and current battle rules. The current idle presentation only
moves the whole sprite up and down by one pixel; completion requires visibly different hand-drawn pixel
frames so the character's body, clothing, hair, and stance move within the sprite. Translation-only
tweens do not count as a completed character animation. The field player, field NPCs, and story cutscenes
are outside this module.

Companions already have recruitment, formation, battle-status, swap, and battle-sprite UI. This module
must keep those surfaces working and visually consistent while the protagonist's battle motion changes.

The primary users are elementary-school players using mouse, keyboard, or touch at the 960×540 reference
size and supported narrow landscape layouts.

## Tech Stack

- Phaser 3 battle scene and sprite/tween APIs
- TypeScript with strict checking
- Existing generated character renderer in `src/rendering/characters.ts`
- Existing battle presentation modules under `src/scenes/battle/`
- Preact battle HUD under `src/ui/battle/`
- Vitest and Playwright

No dependency, content schema, save-data schema, or question contract change is required.

## Commands

```bash
pnpm test:related src/rendering/characters.ts src/scenes/Battle.ts src/scenes/battle/eventAnimator.ts src/ui/battle/BattleHud.tsx
pnpm check:fast
pnpm exec playwright test tests/e2e/battle.spec.ts tests/e2e/story-companion.spec.ts
```

The integration gate is:

```bash
pnpm lint
pnpm check:architecture
pnpm test
pnpm validate:content
pnpm build
```

## Project Structure

```text
src/rendering/characters.ts
  Customizable protagonist battle frames and costume-aware drawing.

src/scenes/Battle.ts
src/scenes/battle/eventAnimator.ts
src/scenes/battle/motions.ts
  Battle animation orchestration and motion primitives.

src/scenes/battle/hudViews.ts
src/ui/battle/BattleStatus.tsx
src/ui/battle/BattleHud.tsx
  Existing protagonist and companion status, swap, and accessibility UI.

src/ui/battle/BattleResultPanel.tsx
src/ui/field/BagOverlay.tsx
  Existing recruitment and formation surfaces that must not regress.

tests/unit/
tests/e2e/battle.spec.ts
tests/e2e/story-companion.spec.ts
  Frame contracts, battle flow, recruitment, formation, and companion display checks.
```

## Code Style

Reuse existing named battle poses and presentation helpers. A battle event selects a motion; it does not
duplicate battle rules or mutate saved party data directly.

```ts
if (isHero) target.setFrame(BATTLE_POSE.hurt);
await clock.wait(HIT_HOLD_MS);
if (state.ally.hero.hp > 0) target.setFrame(BATTLE_POSE.idle);
```

- Keep frame and timing constants named and colocated with the presentation code that owns them.
- Preserve integer pixel positions, `pixelArt: true`, and costume-aware rendering.
- Reuse `BattleEvent` and existing motion helpers instead of adding a second animation state machine.

## Testing Strategy

1. Add or extend a focused unit contract for every protagonist battle pose used at runtime. The contract
   must prove that idle and action sequences contain multiple pixel-distinct frames, not only sprite
   position changes.
2. Verify through Playwright that idle, attack, return-to-idle, damage, knockout, and victory execute in
   the real battle scene without clipping at 960×540 and 844×390.
3. Keep companion regression checks for:
   - recruitment modal with art, name, and accept/decline controls;
   - bag/formation display after joining, including reserve storage when the bag is full;
   - battle sprite and status row with name, level, HP, element/passive/status, and down state;
   - swap menu with all available companions, current selection, HP, and unusable/down state.
4. Capture screenshots for the protagonist motion checkpoints and the joined-companion battle layout.
5. Run the repository integration gate before review.

## Boundaries

### Always do

- Preserve protagonist appearance and equipped-costume differences in every new battle frame.
- Return a surviving actor to its correct idle state after an action.
- Keep companion UI keyboard-, touch-, and screen-reader-operable.
- Keep battle logic deterministic and separate from presentation.

### Ask first

- Replace the customizable protagonist with a fixed image sheet.
- Change battle rules, party limits, save data, shared contracts, or content schemas.
- Add a dependency or change the companion recruitment flow.

### Never do

- Change field walking, field NPCs, or story cutscene animation in this module.
- Drop costume rendering to simplify animation frames.
- Hide companion HP, level, active/down state, or swap availability.
- Add animation decisions to `src/core/` or use `Math.random`.

## Success Criteria

- The protagonist has visibly distinct battle idle, attack, hurt, knockout, and victory presentation.
- Idle and action animation change pixels inside the protagonist frame; moving one unchanged frame up,
  down, or across the screen is insufficient.
- The existing five normal-attack variations remain functional and finish in the correct state.
- Skills and normal attacks preserve appearance and equipped costumes without visual frame jumps.
- Every protagonist animation stays within the battle layout at 960×540 and 844×390.
- A joined companion appears as an animated battle sprite and as a named status row with level and HP.
- Recruitment, bag/formation, battle status, and swap UI remain functional and accessible.
- Focused tests fail when a required protagonist state or companion surface is removed and pass after the
  implementation.
- The repository integration gate and real-browser verification pass.

## Open Questions

None. The user clarified that protagonist animation work is limited to the battle screen and must animate
the character's pixels rather than only translating the sprite. Existing companion UI is retained and
covered as a regression contract.
