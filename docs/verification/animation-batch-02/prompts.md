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

## akita-boss-namahage-ou

```text
Use case: stylized-concept
Asset type: production pixel-art RPG boss sprite sheet
Input images: Image 1 is the authoritative front-view pixel-art identity and palette; Image 2 is a supporting 3D turnaround only.
Primary request: exact transparent 4-column by 2-row sprite sheet of the same Akita Namahage king, eight genuinely different frames.
Subject: red oni face, yellow eyes, square open mouth, white mane and beard, two horns, small gold crown, straw cape, red arms, wooden bucket held high on screen-left, pointing hand on screen-right, wooden feet. Preserve all parts and side placement.
Style/medium: crisp low-resolution Japanese RPG pixel art matching Image 1; limited palette, hard pixel edges, no antialiasing.
Composition: one full centered front-facing boss per equal cell, consistent scale and ground baseline, clear padding for bucket motion, no grid.
Top row idle: neutral; breathing with mane/cape lift and bucket bob; blink; settle.
Bottom row attack: wide brace; bucket pulled back overhead; strongest forward stomp and bucket swing/strike pose; heavy landing recovery.
Constraints: real changes to eyes, mane, cape, arms, bucket and feet; transparent; no detached props, extra limbs, text, effects, shadows, cropping, blur, or watermark.
```

## akita-kiritanpon

```text
Use case: stylized-concept
Asset type: production pixel-art RPG monster sprite sheet
Input images: Image 1 is authoritative pixel identity/palette; Image 2 is supporting 3D turnaround only.
Primary request: exact transparent 4x2 sprite sheet of the same cute grilled kiritanpo-on-a-stick fire creature, eight distinct frames.
Subject: cream-and-brown toasted cylindrical rice cake, tiny face and pink cheeks, one horizontal rim, orange-yellow flame crown, single brown stick below. No arms or legs.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels, no antialiasing.
Composition: one full centered front-facing character per equal cell, same baseline at stick tip, ample flame padding, no grid.
Top idle: neutral; flame leans left and body stretches; blink while flame contracts; settle with flame leaning right.
Bottom attack: flame flares and body compresses on stick; lean back; sharp forward skewer dash with long flame sweep and determined eyes; wobbling recovery.
Constraints: real flame, eye, body tilt and stick changes; preserve silhouette/colors; transparent; no new limbs, loose fireballs, text, shadows, effects, crop, blur, watermark.
```

## akita-oodama-hanabi

```text
Use case: stylized-concept
Asset type: production pixel-art RPG monster sprite sheet
Input images: Image 1 is authoritative pixel identity/palette; Image 2 is supporting 3D turnaround only.
Primary request: exact transparent 4x2 sprite sheet of the same Akita giant-firework ball monster, eight distinct frames.
Subject: round ivory firework shell, blue horizontal band and blue side outline, stern white eyes with black angled brows, tiny dark mouth, two dark feet, eight short yellow fuses with orange-red tips around the body. No arms.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels, no antialiasing.
Composition: one full centered front-facing character per cell, consistent scale/baseline, padding for fuses, no grid.
Top idle: neutral; slight breathing squash as fuse tips brighten; blink and alternating fuse curl; settle.
Bottom attack: compress low and fuses bend inward; lean/coil; explosive upward-forward launch pose with all fuses swept back and determined face; landing recovery with bouncing fuses.
Constraints: real fuse, face, feet and body changes; preserve fuse count and palette; transparent; no hands, explosion cloud, projectile, text, shadows, grid, crop, blur, watermark.
```

## chiba-kousui-hime

```text
Use case: stylized-concept
Asset type: production pixel-art RPG monster sprite sheet
Input images: Image 1 is authoritative pixel identity/palette; Image 2 is supporting 3D turnaround only.
Primary request: exact transparent 4x2 sprite sheet of the same cute Chiba Kosui pear princess, eight distinct frames.
Subject: round golden-tan speckled pear body, tiny smiling face and pink cheeks, brown stem and green leaf, white pear blossoms on screen-left, layered green leafy skirt, two small magenta feet. No arms.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels, no antialiasing.
Composition: one full centered front-facing character per cell, consistent scale/baseline, no grid.
Top idle: neutral; body gently rises while leaf and blossoms sway; blink with skirt flutter; settle.
Bottom attack: squat with leafy skirt tucked; spin/lean back with leaf and flowers trailing; strongest forward rolling body-check with determined eyes and skirt swept behind; bounce recovery.
Constraints: real changes to eyes, flower, leaf, skirt, feet and body tilt; preserve face, speckles and palette; transparent; no new limbs, loose fruit, text, effects, shadows, crop, blur, watermark.
```

## chiba-naminori-gai

```text
Use case: stylized-concept
Asset type: production pixel-art RPG monster sprite sheet
Input images: Image 1 is authoritative pixel identity/palette; Image 2 is supporting 3D turnaround only.
Primary request: exact transparent 4x2 sprite sheet of the same Chiba surfing clam monster, eight distinct frames.
Subject: smiling tan clam with white eyes on a horizontal red surfboard, large curling blue wave rising behind on screen-left with white foam. No arms or legs.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels, no antialiasing.
Composition: one full centered front-facing character per cell, consistent scale and board baseline, clear wave padding, no grid.
Top idle: neutral; wave crest lifts and clam bobs; blink as foam shifts; settle with board rocking.
Bottom attack: wave coils higher and board tips back; forward acceleration with foam swept behind; strongest surfing charge with board angled forward, wave curling over and determined eyes; splash-free landing/recovery to neutral.
Constraints: real changes to wave, foam, board angle, clam face and body; preserve side placement/palette; transparent; no limbs, detached water projectile, text, shadows, background, crop, blur, watermark.
```

## ehime-boss-ishizuchi-ou

```text
Use case: stylized-concept
Asset type: production pixel-art RPG boss sprite sheet
Input images: Image 1 is authoritative front-view pixel identity/palette; Image 2 is supporting 3D turnaround only.
Primary request: exact transparent 4x2 sprite sheet of the same Ehime Ishizuchi mountain king, eight distinct frames.
Subject: massive broad tan-brown rock humanoid, small horn-like rock ears, small gold crown, glowing yellow rectangular eyes, straight mouth, very long thick arms with dark brown fists, squat rock body and feet, small mineral markings. Preserve boss proportions.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels, no antialiasing.
Composition: one full centered front-facing boss per cell, consistent scale/baseline, padding for arm swing, no grid.
Top idle: neutral; heavy breathing with shoulders and arms lifting; blink/dim eyes and slight crown bob; settle.
Bottom attack: wide crouched brace with one huge fist drawn back; torso twists and fist rises; strongest downward-forward rock punch with planted feet, determined glowing eyes and extended arm; heavy recovery with fist down.
Constraints: real eye, shoulder, arm, fist, crown and body changes; preserve rock markings and palette; transparent; no extra weapon, debris projectile, text, effects, shadows, crop, blur, watermark.
```

## ehime-komikan

```text
Use case: stylized-concept
Asset type: production pixel-art RPG monster sprite sheet
Input images: Image 1 authoritative pixel identity/palette; Image 2 supporting 3D turnaround only.
Primary request: exact transparent 4x2 sprite sheet of the same cute Ehime small mikan monster, eight distinct frames.
Subject: simple round orange citrus body, big green leaf lying across top toward screen-left, white rectangular eyes, tiny dark smile, pink cheeks, two small orange feet; no arms.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels, no antialiasing.
Composition: one full centered front-facing character per equal cell, consistent scale/baseline, no grid.
Top idle: neutral; body breathes and leaf lifts; blink while leaf bends; settle.
Bottom attack: squat with leaf pulled back; roll/lean backward; strongest forward rolling body-check with leaf swept behind and determined eyes; bounce recovery.
Constraints: real eye, leaf, feet and body deformation changes; preserve simple identity/colors; transparent; no new limbs, loose fruit, text, effects, shadows, crop, blur, watermark.
```

## ehime-soratobi-taoru

```text
Use case: stylized-concept
Asset type: production pixel-art RPG monster sprite sheet
Input images: Image 1 authoritative pixel identity/palette; Image 2 supporting 3D turnaround only.
Primary request: exact transparent 4x2 sprite sheet of the same flying Imabari towel spirit, eight distinct frames.
Subject: wide white towel-like manta/ghost body with soft pointed top, teal double stripes on both sides and waist, friendly black-white eyes, small smile, pink cheeks, five short towel fringes below, two detached teal-striped oval tassels floating at the sides. Do not add hands or feet.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels, no antialiasing.
Composition: one full centered front-facing character per cell, same hovering baseline, padding for wing-like towel edges and tassels, no grid.
Top idle: neutral; towel edges rise and tassels orbit upward; blink with fringes curling; settle.
Bottom attack: towel folds inward and tassels pull back; gliding lean forward; strongest flying cloth-whip charge with wide swept towel silhouette, trailing tassels and determined eyes; floating recovery.
Constraints: real towel edge, fringe, tassel, eye and body-fold changes; preserve stripes/palette; transparent; no limbs, text, effects, shadows, crop, blur, watermark.
```

## fukui-kamisukin

```text
Use case: stylized-concept
Asset type: production pixel-art RPG monster sprite sheet
Input images: Image 1 authoritative pixel identity/palette; Image 2 supporting 3D turnaround only.
Primary request: exact transparent 4x2 sprite sheet of the same Echizen-washi paper spirit, eight distinct frames.
Subject: round off-white handmade paper sheet spirit with uneven pointed fringe at bottom, rectangular white eyes with black pupils, straight dark mouth, pink cheeks, four pale gray stitch marks, small tan tab at upper screen-right and teal striped paper tabs at left/right. No arms or legs.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels, no antialiasing.
Composition: one full centered hovering character per cell, consistent scale/baseline, padding for fluttering paper, no grid.
Top idle: neutral; paper billows and side tabs lift; blink while bottom fringe ripples; settle.
Bottom attack: fold/compress like an accordion; curl backward; strongest forward paper-edge slicing dash with whole sheet stretched diagonally, tabs trailing and determined eyes; unfold recovery.
Constraints: real eyes, paper folds, fringe and tab changes; preserve face/palette; transparent; no limbs, loose paper projectile, text, effects, shadows, crop, blur, watermark.
```

## fukui-midboss-kasumi-maru

```text
Use case: stylized-concept
Asset type: production pixel-art RPG midboss sprite sheet
Input images: Image 1 authoritative pixel identity/palette; Image 2 supporting 3D turnaround only.
Primary request: exact transparent 4x2 sprite sheet of the same Fukui Kasumi-maru castle warship monster, eight distinct frames.
Subject: dark gray rounded boat hull with pale wave markings and small white wake on screen-left, brown deck band, white two-tier Japanese castle superstructure with dark gray eaves, four square top windows, large white eyes in lower tier, pink cheeks, gold crown/castle ornament on top. No arms or legs.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels, no antialiasing.
Composition: one full centered front-facing character per cell, consistent waterline baseline, padding for wake and rocking tower, no grid.
Top idle: neutral; gentle hull bob and crown/tower rise; blink with wake pulse; settle.
Bottom attack: hull dips backward and wake gathers; bow pitches forward; strongest ramming surge with tower leaning, determined eyes and long attached wake; rocking recovery.
Constraints: real hull, tower, crown, eye and wake changes; preserve architecture/palette; transparent; no limbs, detached projectile, background water, text, shadows, crop, blur, watermark.
```

## fukuoka-barikatan

```text
Use case: stylized-concept
Asset type: production pixel-art RPG monster sprite sheet
Input images: Image 1 authoritative pixel identity/palette; Image 2 supporting 3D turnaround only.
Primary request: exact transparent 4x2 sprite sheet of the same spicy Hakata ramen bowl monster, eight distinct frames.
Subject: round red ramen bowl with white geometric rim band, white rectangular eyes and tiny smile, pink cheeks, two tiny red feet, white broth/noodles and small brown/yellow/green/red toppings, three orange-yellow flame-shaped spikes rising from top. No arms.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels, no antialiasing.
Composition: one full centered front-facing character per cell, consistent scale/baseline, padding for flame/noodles, no grid.
Top idle: neutral; broth/toppings bob and flames rise; blink with flames contracting; settle.
Bottom attack: bowl compresses and flames flare; lean back; strongest forward bowl charge with noodles/toppings and flames swept backward, determined eyes; wobbling landing recovery.
Constraints: real flame, topping, eye, feet and bowl-tilt changes; preserve rim pattern/palette; transparent; no loose fireball, new limbs, text, effects, shadows, crop, blur, watermark.
```

## fukuoka-lastboss-kuroda-kanbei

```text
Use case: stylized-concept
Asset type: production pixel-art historical boss sprite sheet
Input images: Image 1 authoritative pixel identity/palette; Image 2 supporting 3D turnaround only.
Primary request: exact transparent 4x2 sprite sheet of the same stylized Kuroda Kanbei boss, eight distinct frames.
Subject: compact samurai strategist with large broad red jingasa helmet with gold rim and gold cap, red side hair/guards, pale face and stern rectangular eyes, dark navy armor with red and gold trim, blue sleeves/legs, dark boots, long dark staff held upright on screen-right with a pale gold star-shaped finial. Preserve staff side and historical-game silhouette.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels, no antialiasing.
Composition: one full centered front-facing boss per cell, consistent scale/baseline, ample staff/helmet padding, no grid.
Top idle: neutral; breathing with helmet and sleeve movement; blink and staff tilt; settle upright.
Bottom attack: wide brace with staff pulled back; torso turns and staff sweeps overhead; strongest forward staff thrust/slash with planted feet, determined eyes and clear diagonal weapon pose; guarded recovery.
Constraints: real eyes, helmet, arms, staff, armor and feet changes; preserve identity/palette; transparent; one attached staff only, no extra weapons, magic effect, text, shadows, crop, blur, watermark.
```

## fukuoka-stroberion

```text
Use case: stylized-concept
Asset type: production pixel-art RPG monster sprite sheet
Input images: Image 1 authoritative pixel identity/palette; Image 2 supporting 3D turnaround only.
Primary request: exact transparent 4x2 sheet of the same Fukuoka strawberry monster, eight distinct frames.
Subject: broad red strawberry body with yellow seeds, green spiky leafy crown, small white flower with yellow center on top, white rectangular eyes, black pupils/brows, smiling mouth with one white tooth, pink cheeks, two dark-red feet; no arms.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels, no antialiasing. One full centered front-facing character per cell, consistent baseline, no grid.
Top idle: neutral; leafy crown and flower lift with breathing; blink and leaves fold; settle. Bottom attack: squat with leaves pulled back; lean/roll; strongest forward rolling body-check with crown swept behind and determined eyes; bounce recovery.
Constraints: real eye, leaf, flower, feet and body changes; preserve face/seeds/palette; transparent; no new limbs, loose fruit, text, effects, shadows, crop, blur, watermark.
```

## fukushima-akabekon

```text
Use case: stylized-concept
Asset type: production pixel-art RPG monster sprite sheet
Input images: Image 1 authoritative pixel identity/palette; Image 2 supporting 3D turnaround only.
Primary request: exact transparent 4x2 sheet of the same Fukushima red akabeko cow monster, eight distinct frames.
Subject: compact red four-legged cow, oversized square head, cream muzzle, two cream horns with brown bases, wide red ears, white rectangular eyes, pink cheeks, tiny tail, yellow-black flower emblems, black hooves. Preserve four-legged anatomy.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels. One full centered front-facing character per cell, consistent baseline, no grid.
Top idle: neutral; traditional bobble-head nod and ears lift; blink with tail flick; settle. Bottom attack: lower head and brace four hooves; horns tilt forward; strongest short horn charge with ears/tail swept back; planted recovery.
Constraints: real head/neck, horn, ear, tail and hoof changes; preserve emblems/palette; transparent; no extra limbs, text, effects, shadows, crop, blur, watermark.
```

## fukushima-koboshi

```text
Use case: stylized-concept
Asset type: production pixel-art RPG monster sprite sheet
Input images: Image 1 authoritative pixel identity/palette; Image 2 supporting 3D turnaround only.
Primary request: exact transparent 4x2 sheet of the same Fukushima okiagari-koboshi doll monster, eight distinct frames.
Subject: round weighted roly-poly doll, dark navy rounded hood/hair, cream face, black-white eyes, tiny smile and pink cheeks, red wrap robe with white V collar and gold belt, two short white vertical marks near bottom. No arms or legs.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels. One full centered character per cell, same contact point, no grid.
Top idle: neutral; gentle left rock; blink while rocking right; upright settle. Bottom attack: deep backward tilt; fast side roll; strongest spinning forward body ram with determined eyes and robe bands curved by motion; rebound upright recovery.
Constraints: real eye, rocking angle and robe deformation; preserve weighted-doll silhouette/palette; transparent; no limbs, text, effects, shadows, crop, blur, watermark.
```

## fukushima-momorin

```text
Use case: stylized-concept
Asset type: production pixel-art RPG monster sprite sheet
Input images: Image 1 authoritative pixel identity/palette; Image 2 supporting 3D turnaround only.
Primary request: exact transparent 4x2 sheet of the same Fukushima angel peach monster, eight distinct frames.
Subject: round pink peach body hovering, central peach seam, two green leaves on top, gold oval halo floating above, white rectangular eyes, tiny smile, darker pink cheek marks; no arms, legs, or wings.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels. One full centered hovering character per cell, consistent scale/hover baseline, halo padding, no grid.
Top idle: neutral; peach rises as leaves and halo bob; blink with halo tilt; settle. Bottom attack: compress low as halo and leaves pull back; tilt upward; strongest forward diving peach charge with halo/leaf trailing and determined eyes; floating recovery.
Constraints: real eye, leaf, halo, peach seam and squash changes; preserve palette; transparent; no limbs/wings, loose fruit, text, effects, shadows, crop, blur, watermark.
```

## gifu-kakinoki-don

```text
Use case: stylized-concept
Asset type: production pixel-art RPG monster sprite sheet
Input images: Image 1 authoritative pixel identity/palette; Image 2 supporting 3D turnaround only.
Primary request: exact transparent 4x2 sheet of the same Gifu giant persimmon monster, eight distinct frames.
Subject: wide squat orange persimmon body with brown freckles, stern white eyes and dark brows, smiling mouth, pink cheeks, multiple large green calyx leaves on top, brown twig with green leaf and small orange fruit, several tiny orange feet. No arms.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels. One full centered front-facing character per cell, consistent baseline, top padding, no grid.
Top idle: neutral; heavy breathing and calyx/twig bob; blink while small fruit swings; settle. Bottom attack: squat and leaves fold back; roll/lean; strongest forward rolling body-check with twig/fruit and leaves swept behind, determined eyes; heavy bounce recovery.
Constraints: real eyes, calyx, twig, small fruit, feet/body changes; preserve markings/palette; transparent; no new limbs, loose fruit projectile, text, effects, shadows, crop, blur, watermark.
```

## gifu-oribe-musha

```text
Use case: stylized-concept
Asset type: production pixel-art RPG warrior sprite sheet
Input images: Image 1 authoritative pixel identity/palette; Image 2 supporting 3D turnaround only.
Primary request: exact transparent 4x2 sheet of the same Gifu Oribe pottery warrior, eight distinct frames.
Subject: compact cream ceramic warrior, dark green dripping glaze helmet/hair and rounded shoulder armor, white rectangular eyes and straight dark mouth, pink cheeks, tan-brown patterned chest plate, round green shield with cream-brown circular emblem on screen-left, tan club/staff with brown cap rising behind screen-right, short cream legs and dark shoes.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels. One full centered front-facing character per cell, consistent baseline and weapon padding, no grid.
Top idle: neutral; shoulders/shield breathe and club tilts; blink; settle. Bottom attack: shield brace and club drawn back; torso twist with club overhead; strongest forward club strike with shield tucked and planted feet; guarded recovery.
Constraints: real eye, shield, club, glaze armor and feet changes; preserve sides/palette; transparent; one attached club only, no extra limbs/weapons, text, effects, shadows, crop, blur, watermark.
```

## gifu-washigamin

```text
Use case: stylized-concept
Asset type: production pixel-art RPG paper-spirit sprite sheet
Input images: Image 1 authoritative pixel identity/palette; Image 2 supporting 3D turnaround only.
Primary request: exact transparent 4x2 sheet of the same Gifu washi paper deity, eight distinct frames.
Subject: hovering rectangular cream paper body, pale blue-gray folded top cap and side folds, small bottom point, two cyan plus-shaped ornaments at top corners, simple black eyes and smile, pink cheeks, red plus emblem on lower front. No separate legs or weapons.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels. One full centered hovering character per cell, consistent baseline/padding, no grid.
Top idle: neutral; paper billows and cyan ornaments bob; blink with side folds lifting; settle. Bottom attack: folds compress inward; body twists like folded paper; strongest forward paper-palm/body strike with side folds extended, ornaments trailing and determined eyes; unfold recovery.
Constraints: real eye, paper fold, side panel, ornaments and bottom-point changes; preserve emblem/palette; transparent; no new limbs, loose paper projectile, text, effects, shadows, crop, blur, watermark.
```

## gunma-kyabe-yoroi

```text
Use case: stylized-concept
Asset type: production pixel-art RPG armored vegetable sprite sheet
Input images: Image 1 authoritative pixel identity/palette; Image 2 supporting 3D turnaround only.
Primary request: exact transparent 4x2 sheet of the same Gunma cabbage-armor monster, eight distinct frames.
Subject: squat layered bright-green cabbage armor, pointed leafy helmet with pale yellow-green face opening, white eyes, straight dark mouth, pink cheeks, round cabbage shoulder fists at both sides, stacked leafy torso bands, several short green feet.
Style: crisp limited-palette Japanese RPG pixel art matching Image 1, hard pixels. One full centered front-facing character per cell, consistent baseline, no grid.
Top idle: neutral; armor layers and shoulder fists rise with breathing; blink and helmet leaves flex; settle. Bottom attack: crouched armor brace; one shoulder pulled back; strongest forward shoulder bash with layered leaves compressed and determined eyes; heavy recoil recovery.
Constraints: real eye, helmet leaf, shoulder, torso layers and feet changes; preserve armor silhouette/palette; transparent; no weapons or extra limbs, text, effects, shadows, crop, blur, watermark.
```
