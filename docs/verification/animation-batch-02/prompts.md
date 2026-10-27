# animation batch-02 generation prompts

Generator: built-in imagegen (`transparent_background: true`). Each character used its
matching `dist/pixels/<id>.png` as the authoritative identity/palette reference and
`dist/sheets/<id>.jpg` as the supporting turnaround reference. Generated originals are
preserved under `generated-sources/`; runtime sheets were resized to 512x256 with
nearest-neighbor sampling.

## aichi-arimatsu-zome

```text
Use case: stylized-concept
Asset type: production pixel-art RPG monster sprite sheet
Input images: Image 1 is the authoritative front-view pixel-art character identity and palette; Image 2 is a supporting 3D turnaround reference only.
Primary request: create an exact 4-column by 2-row sprite sheet for the same Aichi Arimatsu shibori cloth monster, eight genuinely different animation frames.
Subject: round indigo-purple cloth creature with white geometric shibori flower motifs, white rectangular eyes with dark pupils, tiny mouth, two bright blue side pads/ears, tiny dark feet. Preserve this identity exactly; do not invent limbs or accessories.
Style/medium: crisp low-resolution Japanese RPG pixel art, limited palette, hard pixel edges, no antialiasing, matching Image 1 rather than the 3D rendering.
Composition/framing: transparent 4x2 grid; one centered character per equal cell; consistent scale, ground baseline, front-facing orientation, generous clear padding; no visible grid.
Animation frames left-to-right:
top row idle: 1 neutral reference pose; 2 subtle breathing squash with both blue side pads lifted slightly; 3 natural blink with cloth motifs and silhouette unchanged; 4 return pose with side pads settling lower.
bottom row attack: 5 brace/compress backward; 6 lean and launch forward with side pads swept back; 7 strongest forward body-check impact pose with expressive determined eyes; 8 landing/recovery with real silhouette deformation, returning toward neutral.
Constraints: all eight cells contain exactly one full character; real per-frame changes in eyes, blue side pads and body squash; preserve face, motif placement, palette, outline and tiny feet; transparent background; no shadows, effects, text, labels, grid, watermark, extra characters, extra limbs, cropping, blur, painterly details, or interpolation.
```

## aichi-hatchon

```text
Use case: stylized-concept
Asset type: production pixel-art RPG monster sprite sheet
Input images: Image 1 is the authoritative front-view pixel-art character identity and palette; Image 2 is a supporting 3D turnaround reference only.
Primary request: create an exact 4-column by 2-row sprite sheet for the same cute Hatcho miso barrel monster, eight genuinely different animation frames.
Subject: squat tan wooden barrel creature, dark brown hoops, mound of chunky charcoal-gray miso beans on top, white rectangular eyes with black pupils, tiny dark smiling mouth, pink cheeks, two tiny brown feet. Preserve identity exactly; no arms.
Style/medium: crisp low-resolution Japanese RPG pixel art, limited palette, hard pixel edges, no antialiasing, matching Image 1.
Composition/framing: transparent 4x2 grid; one centered full character per equal cell; consistent scale and ground baseline, front-facing, generous clear padding; no visible grid.
Animation frames left-to-right:
top row idle: 1 neutral reference pose; 2 gentle barrel breathing squash and top bean mound rises; 3 blink while a few top beans settle; 4 return pose with mound bouncing down.
bottom row attack: 5 brace by compressing low; 6 barrel tips and surges forward; 7 strongest forward ram pose while several attached top beans visibly bounce upward but remain part of the character; 8 landing/recovery with barrel rocking back toward neutral.
Constraints: exactly one complete character per cell; real changes in eyes, barrel tilt, feet and bean mound; preserve face, wood colors, hoops, palette and outline; transparent background; no loose projectiles, shadows, effects, text, labels, grid, watermark, extra characters, extra arms or legs, cropping, blur, painterly detail, or interpolation.
```

## aichi-miso-yagura

```text
Use case: stylized-concept
Asset type: production pixel-art RPG monster sprite sheet
Input images: Image 1 is the authoritative front-view pixel-art character identity and palette; Image 2 is a supporting 3D turnaround reference only.
Primary request: create an exact 4-column by 2-row sprite sheet for the same Aichi miso tower monster, eight genuinely different animation frames.
Subject: tall tan wooden two-tier barrel/tower creature, dark brown rails, mound of chunky charcoal-gray miso beans on top, white rectangular eyes with black pupils, small straight dark mouth, pink cheeks, two tiny dark feet, a small wooden side peg on its left and a tall wooden square-ended paddle on its right. Preserve identity and side placement exactly.
Style/medium: crisp low-resolution Japanese RPG pixel art, limited palette, hard pixel edges, no antialiasing, matching Image 1.
Composition/framing: transparent 4x2 grid; one centered full character per equal cell; consistent scale and ground baseline, front-facing, enough padding for paddle motion; no visible grid.
Animation frames left-to-right:
top row idle: 1 neutral reference pose with paddle upright; 2 subtle breathing rise and paddle tilts slightly outward; 3 blink while top miso mound settles; 4 return pose with paddle springing upright.
bottom row attack: 5 determined brace and paddle drawn back; 6 body leans forward while paddle starts an overhead arc; 7 strongest attack pose with paddle visibly swung down and forward, feet planted, determined eyes; 8 landing/recovery with paddle low then returning toward neutral.
Constraints: exactly one complete character per cell; real per-frame changes in eyes, paddle angle, barrel lean, feet and miso mound; preserve face, palette, wooden construction, side peg and paddle; transparent background; no detached weapon, shadows, effects, text, labels, grid, watermark, extra characters, extra limbs, cropping, blur, painterly detail, or interpolation.
```
