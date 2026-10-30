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

## gunma-midboss-yumomi-daisho

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same Gunma yumomi general from the two references. Image 1 is authoritative for identity/palette; Image 2 only supports shape. Subject: white round hot-spring spirit wearing a gold crown and red headband, black angular eyes, pink cheeks, little white arms/body in a rectangular brown bath tub with blue/cyan/yellow mosaic bands, holding one broad wooden yumomi paddle diagonally on screen-left. Crisp limited-palette hard pixels, no antialiasing. Exactly one full centered front-facing character per equal cell, consistent scale/tub baseline, no grid. Top idle frames: neutral; steamless breathing and crown/paddle bob; blink with hand shift; settle. Bottom attack frames: paddle drawn back; body leans and paddle rises; strongest downward-forward paddle slam while tub rocks and eyes turn determined; rocking recovery. Real eye, arm, paddle, crown, body and tub-angle changes. Preserve paddle side and tub pattern. Transparent; no water background, splash projectile, extra paddle/limbs, text, effects, shadows, crop, blur or watermark.
```

## hiroshima-kakigara-don

```text
Create an exact transparent 4x2 production pixel-art RPG sprite sheet of the same Hiroshima oyster-shell monster from the two references, Image 1 authoritative. Subject: round gray layered oyster shell with many white conical spikes and dark dash markings, rectangular cream face peeking through a horizontal opening, black-white eyes, U mouth, pink cheeks, blue round side knobs, flat bright-blue water-ring base; no limbs. Crisp limited-palette hard pixel art. One full centered front-facing character per equal cell, consistent base, no grid. Top idle: neutral; shell opens slightly and blue knobs lift; blink while shell closes a little; settle. Bottom attack: shell clamps/compresses; rocks backward; strongest rolling/spinning shell body-check with spikes and base tilted, determined eyes; settles onto blue base. Real shell opening, eye, spikes, knobs and base-angle changes. Preserve palette/markings; transparent; no pearl/projectile, limbs, text, effects, shadows, crop, blur, watermark.
```

## hiroshima-midboss-fude-daisho

```text
Create an exact transparent 4x2 production pixel-art RPG midboss sprite sheet of the same Hiroshima brush general from the references, Image 1 authoritative. Subject: broad white rice-ball warrior with tall navy triangular hat/hair, black-white pixel face with yellow cheek guards and red mouth, purple shoulder wrap, red belt, dark navy legs, one long brown calligraphy brush held upright on screen-right with navy bands, red collar and dark ink bristles; small white screen-left hand. Crisp limited-palette hard pixels. One full centered front-facing figure per cell, consistent baseline, ample brush padding, no grid. Top idle: neutral; breathing and brush/hat bob; blink; settle. Bottom attack: brace with brush drawn back; twist and raise brush overhead; strongest sweeping diagonal brush strike with planted legs and determined eyes; guarded recovery. Real eye, arms, brush, hat, torso and leg changes. Preserve sides/palette; transparent; one attached brush only, no ink effect, extra limbs/weapons, text, shadow, crop, blur, watermark.
```

## hiroshima-teppan-double

```text
Create an exact transparent 4x2 production pixel-art RPG monster sprite sheet of the same Hiroshima flaming teppan double from the references, Image 1 authoritative. Subject: tall rounded yellow okonomiyaki/iron-griddle creature, brown sauce pancake top with white mayo zigzag and green/yellow garnish, three orange-red flames, two arms holding upright white metal spatulas with brown handles, black-white eyes, U mouth, pink cheeks, brown dotted lower band, green band, cream bottom, two brown feet. Crisp limited-palette hard pixels. One full centered front-facing character per cell, consistent baseline, padding for flames/spatulas, no grid. Top idle: neutral; flames and both spatulas bob; blink while toppings shift; settle. Bottom attack: crouch and pull both spatulas back; cross spatulas overhead; strongest double downward spatula chop with flames flared and determined eyes; landing recovery. Real eye, arm, spatula, flame, topping and feet changes. Preserve two spatulas and palette; transparent; no food projectile, extra tools/limbs, text, effects, shadows, crop, blur, watermark.
```

## hokkaido-homura-gitsune

```text
Create an exact transparent 4x2 production pixel-art RPG monster sprite sheet of the same Hokkaido flame fox from the references, Image 1 authoritative. Subject: compact orange four-legged fox, huge black-tipped ears with white inner tufts, white muzzle and chest, black brows/eyes and small nose, pink cheeks, red-orange-yellow flame mane, flame tuft on forehead, large curled orange tail on screen-right ending in flame, small pink flower by screen-left ear, dark paws. Crisp limited-palette hard pixels. One full centered front-facing character per cell, consistent four-paw baseline, tail padding, no grid. Top idle: neutral; mane/tail flames flicker and ears lift; blink with tail curl; settle. Bottom attack: lower four-paw hunting crouch; coil tail and lean back; strongest forward pouncing fox charge with flame mane/tail swept behind and determined eyes; four-paw landing recovery. Real eye, ear, mane, tail, body and paws changes. Preserve flower and anatomy; transparent; no extra tails/limbs, fireball, text, effects, shadows, crop, blur, watermark.
```

## hokkaido-jaga-goron

```text
Create an exact transparent 4x2 production pixel-art RPG monster sprite sheet of the same Hokkaido potato monster from the references, Image 1 authoritative. Subject: simple lumpy heart-like tan potato body with a top notch, sparse brown eyes/spots, white rectangular eyes with navy pupils, tiny U mouth, pink cheeks, two tiny brown feet; no arms. Crisp limited-palette hard pixel art. One full centered front-facing character per equal cell, consistent baseline, no grid. Top idle: neutral; gentle squash/stretch; blink while spots shift only with body deformation; settle. Bottom attack: compress low; roll/tilt backward; strongest forward rolling potato body-check with determined eyes and feet tucked; bounce recovery. Real eye, body silhouette, tilt and feet changes. Preserve simple spot pattern/palette; transparent; no sprouts/new limbs, loose potato, text, effects, shadows, crop, blur, watermark.
```

## hokkaido-lastboss-clark

```text
Create an exact transparent 4x2 production pixel-art historical RPG boss sprite sheet of the same stylized William S. Clark from the references, Image 1 authoritative. Subject: compact bearded man with brown hair and full dark-brown beard, stern rectangular eyes, long navy frock coat and trousers, white shirt with red cross-shaped tie detail, yellow buttons, dark shoes; screen-left arm raised with index finger pointing upward, screen-right arm holds a dark green book with yellow cross. Crisp limited-palette hard pixels. One full centered front-facing boss per cell, consistent baseline, arm/book padding, no grid. Top idle: neutral pointing pose; coat/beard breathing and book bob; blink with raised finger tilt; settle. Bottom attack: wide brace, book guarded and pointing arm pulled back; pivot with coat tails sweeping; strongest forward commanding finger thrust/book bash pose with determined eyes; dignified recovery. Real eye, arms, book, coat tails and feet changes. Preserve historical-game identity and item sides. Transparent; exactly one attached book, no extra limbs/items, text, effects, shadows, crop, blur, watermark.
```

## hokkaido-ryuhyo-tenshi

```text
Create an exact transparent 4x2 production pixel-art RPG monster sprite sheet of the same Hokkaido drift-ice angel from the references, Image 1 authoritative. Subject: translucent pale-cyan rounded ice spirit with head/body fused, wide raised ice-flipper arms, black brows and black-white eyes, smiling mouth, pink cheeks, orange four-petal emblem on chest, gold oval halo, three chunky light-blue ice floes as feet/base, no separate legs. Crisp limited-palette hard pixels. One full centered front-facing character per cell, consistent ice-base baseline and halo padding, no grid. Top idle: neutral; halo bobs and ice arms rise; blink while body shimmers through pixel highlights; settle. Bottom attack: compress behind ice floes with arms pulled back; lean forward and halo tilts; strongest gliding ice-body charge with arms swept behind and determined eyes; slide recovery. Real eye, halo, arms, body and ice-floe changes. Preserve emblem/palette; transparent; no extra wings/limbs, ice projectile, text, effects, shadows, crop, blur, watermark.
```

## hyogo-kuromamen

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity and palette, Image 2 only supports shape. Subject: round near-black purple kuromame bean, two green sprout leaves, white rectangular eyes, pink cheeks, tiny red smile, two dark feet; no arms. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing subject per equal cell, consistent scale and baseline, clear padding, no visible grid. Top idle frames left-to-right: neutral reference pose; breathing with appendages/accessories lifting; natural blink with secondary motion; settle. Bottom attack frames: squash low; roll diagonally; strongest rolling bean body-check with leaves swept back; bounce recovery. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides, and anatomy. Transparent background; no extra characters beyond the specified pair, no extra limbs/items, detached projectiles, text, labels, effects, shadows, cropping, blur or watermark.
```

## hyogo-soroban-shogun

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity and palette, Image 2 only supports shape. Subject: boxy dark-brown wooden soroban abacus warrior, charcoal roof rim, two brown top pegs, stern white eyes, pink cheeks, straight mouth, red horizontal bar, cream/brown hanging beads, four short blocky legs. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing subject per equal cell, consistent scale and baseline, clear padding, no visible grid. Top idle frames left-to-right: neutral reference pose; breathing with appendages/accessories lifting; natural blink with secondary motion; settle. Bottom attack frames: lower body brace and beads slide; rock backward; strongest forward abacus ram with bead rows displaced and determined eyes; heavy recovery. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides, and anatomy. Transparent background; no extra characters beyond the specified pair, no extra limbs/items, detached projectiles, text, labels, effects, shadows, cropping, blur or watermark.
```

## hyogo-tamanegin

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity and palette, Image 2 only supports shape. Subject: exactly two joined pale-yellow round onion twins side-by-side, each with one black eye, pink cheek, green sprout and one brown foot, separated by a dark central seam; no arms. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing subject per equal cell, consistent scale and baseline, clear padding, no visible grid. Top idle frames left-to-right: neutral reference pose; breathing with appendages/accessories lifting; natural blink with secondary motion; settle. Bottom attack frames: twins compress together; lean apart then recoil; strongest synchronized forward double body-check with sprouts trailing; settle side-by-side. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides, and anatomy. Transparent background; no extra characters beyond the specified pair, no extra limbs/items, detached projectiles, text, labels, effects, shadows, cropping, blur or watermark.
```

## ibaraki-hobiki-maru

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity and palette, Image 2 only supports shape. Subject: exactly two slim blue fish/net spirits side-by-side, each with diamond body, yellow brow band, one black-white eye, pink mouth, white sail/cloud cap on a short neck, and two crossed blue tail-legs; no arms. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing subject per equal cell, consistent scale and baseline, clear padding, no visible grid. Top idle frames left-to-right: neutral reference pose; breathing with appendages/accessories lifting; natural blink with secondary motion; settle. Bottom attack frames: pair crouches with crossed tails; sails lean back; strongest synchronized forward sail-charge with both bodies angled; crossed-tail landing. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides, and anatomy. Transparent background; no extra characters beyond the specified pair, no extra limbs/items, detached projectiles, text, labels, effects, shadows, cropping, blur or watermark.
```

## ibaraki-natton

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity and palette, Image 2 only supports shape. Subject: exactly two slim natto-pod twins side-by-side, each in a tall pale-yellow ribbed pod with brown rectangular face panel, one black-white eye, pink cheek, pointed top and two dark brown crossed legs; no arms. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing subject per equal cell, consistent scale and baseline, clear padding, no visible grid. Top idle frames left-to-right: neutral reference pose; breathing with appendages/accessories lifting; natural blink with secondary motion; settle. Bottom attack frames: pair folds low; pods twist opposite directions; strongest synchronized sticky pod ram with determined eyes and crossed legs lifted; upright recovery. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides, and anatomy. Transparent background; no extra characters beyond the specified pair, no extra limbs/items, detached projectiles, text, labels, effects, shadows, cropping, blur or watermark.
```

## ishikawa-boss-yukitsuri-oomatsu

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity and palette, Image 2 only supports shape. Subject: massive brown pine-tree stump boss with stern white eyes, pink cheeks, broad low root-feet, huge rounded green pine canopy topped with white snow, two tan yukitsuri ropes rising to a central post and small gold crown. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing subject per equal cell, consistent scale and baseline, clear padding, no visible grid. Top idle frames left-to-right: neutral reference pose; breathing with appendages/accessories lifting; natural blink with secondary motion; settle. Bottom attack frames: roots brace and canopy dips; ropes pull taut; strongest forward root stomp/body ram with canopy/rope/crown tilted and determined eyes; heavy settle. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides, and anatomy. Transparent background; no extra characters beyond the specified pair, no extra limbs/items, detached projectiles, text, labels, effects, shadows, cropping, blur or watermark.
```

## ishikawa-kaga-nurimaru

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity and palette, Image 2 only supports shape. Subject: red lacquer bowl/helmet spirit on a dark-brown pedestal body, gold rim and two gold top loops, white rectangular eyes, straight mouth, pink cheeks, small red side knobs, yellow flower motifs and tiny yellow chin tassel; no limbs. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing subject per equal cell, consistent scale and baseline, clear padding, no visible grid. Top idle frames left-to-right: neutral reference pose; breathing with appendages/accessories lifting; natural blink with secondary motion; settle. Bottom attack frames: pedestal compresses; bowl twists back; strongest spinning lacquer headbutt with side knobs and tassel trailing; upright recovery. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides, and anatomy. Transparent background; no extra characters beyond the specified pair, no extra limbs/items, detached projectiles, text, labels, effects, shadows, cropping, blur or watermark.
```

## ishikawa-midboss-kiriko-taisho

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity and palette, Image 2 only supports shape. Subject: square pale-yellow kiriko lantern shrine boss, red curved roof with horn tips and gold crown, red-and-gold fringe patterns, stern eyes and cheeks on lantern panel, brown four-legged wooden stand with central block. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing subject per equal cell, consistent scale and baseline, clear padding, no visible grid. Top idle frames left-to-right: neutral reference pose; breathing with appendages/accessories lifting; natural blink with secondary motion; settle. Bottom attack frames: stand crouches and lantern sways; roof pulls back; strongest forward lantern ram with stand legs planted and crown tilted; rigid recovery. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides, and anatomy. Transparent background; no extra characters beyond the specified pair, no extra limbs/items, detached projectiles, text, labels, effects, shadows, cropping, blur or watermark.
```

## kagawa-boss-oudon-ryu

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity and palette, Image 2 only supports shape. Subject: white udon dragon king rising from a red bowl with gold bands, gold crown, yellow-black eyes, open red mouth, white noodle beard with green garnish, two white arms gripping bowl, large red-orange flame/crab-like fins behind both sides. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing subject per equal cell, consistent scale and baseline, clear padding, no visible grid. Top idle frames left-to-right: neutral reference pose; breathing with appendages/accessories lifting; natural blink with secondary motion; settle. Bottom attack frames: bowl/arms brace and fins curl; dragon leans back; strongest forward bowl-and-claw surge with fins spread and determined eyes; noodle-bounce recovery. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides, and anatomy. Transparent background; no extra characters beyond the specified pair, no extra limbs/items, detached projectiles, text, labels, effects, shadows, cropping, blur or watermark.
```

## kagawa-minoribu

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity and palette, Image 2 only supports shape. Subject: round bright-green olive fruit spirit, white-black eyes, smiling dark mouth, pink cheeks, tiny green arms/feet, central top leaf and two arched spotted leaves ending in purple olives. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing subject per equal cell, consistent scale and baseline, clear padding, no visible grid. Top idle frames left-to-right: neutral reference pose; breathing with appendages/accessories lifting; natural blink with secondary motion; settle. Bottom attack frames: leaves and olives pull back; crouch; strongest forward olive body-check with purple fruits trailing and determined eyes; bounce recovery. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides, and anatomy. Transparent background; no extra characters beyond the specified pair, no extra limbs/items, detached projectiles, text, labels, effects, shadows, cropping, blur or watermark.
```

## kagawa-tsumuji-uchiwa

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity and palette, Image 2 only supports shape. Subject: round turquoise-and-cream handheld fan spirit, turquoise wing-like side fins, white forehead band, black-white eyes, smile, pink cheeks, wooden handle below, two tiny detached turquoise/navy floating hands. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing subject per equal cell, consistent scale and baseline, clear padding, no visible grid. Top idle frames left-to-right: neutral reference pose; breathing with appendages/accessories lifting; natural blink with secondary motion; settle. Bottom attack frames: fan folds/compresses and hands pull back; spin on handle; strongest forward gust-like fan body strike with side fins swept back and determined eyes; balanced recovery. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides, and anatomy. Transparent background; no extra characters beyond the specified pair, no extra limbs/items, detached projectiles, text, labels, effects, shadows, cropping, blur or watermark.
```

## kagoshima-daikon-shogun

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity and palette, Image 2 only supports shape. Subject: round white Sakurajima-daikon general, pale-green top cap with three leafy stems, black rectangular eyes/brows, smiling mouth, pink cheeks, huge dark-green leaf arms, tiny white feet, green bamboo flute held diagonally across front. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing subject per equal cell, consistent scale and baseline, clear padding, no visible grid. Top idle frames left-to-right: neutral reference pose; breathing with appendages/accessories lifting; natural blink with secondary motion; settle. Bottom attack frames: leaf arms brace and flute draws back; body twists; strongest forward bamboo-flute staff strike with leaves and top stems swept back, determined eyes; guarded recovery. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides, and anatomy. Transparent background; no extra characters beyond the specified pair, no extra limbs/items, detached projectiles, text, labels, effects, shadows, cropping, blur or watermark.
```

## kagoshima-midboss-tsubo-musha

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: cream Satsuma pottery warrior shaped like a wide vase, floral red/yellow/green motifs, blocky arms, stern eyes, tall neck with navy lid and gold crown. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: draw arms back; twist vase body; strongest double-arm pottery punch with lid/crown tilted; stable recovery. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## kagoshima-watari-zuru

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: gray-and-white crane bird with long tan beak, red forehead patch, black crest, raised gray wings, tail, black legs, pink cheek. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: crouch with wings folded; wings sweep down; strongest forward flying beak charge with wings fully extended and legs tucked; landing. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## kanagawa-karakuri-jo

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: boxy wooden mechanical castle creature, square cream face panel, stern eyes, pink cheeks, wood-block side fists, four feet, layered charcoal castle roof with white window strip and gold horn corners. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: wood fists pull back; roof/body twist; strongest forward mechanical double-fist ram; rigid reset. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## kanagawa-pichirasu

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: white round shirasu spirit on a pale-blue narrow stem and puddle base, blue cap, blue side fins, black rectangular eyes, pink cheeks, tiny mouth, two tiny detached pale-blue motes. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: stem bends back and fins retract; launch; strongest forward fluid headbutt with cap/fins/motes trailing; base reforms. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## kochi-aburikatsuo

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round dark-navy bonito fish monster, white belly, two white horizontal stripes, white eyes, pink cheeks, tiny fins/feet, orange-yellow flame crest. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: crouch and flame flares; lean back; strongest forward seared-fish body charge with flame swept behind; landing. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## kochi-kamiwashi

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: hovering white handmade-paper bird spirit with tan rectangular beak, black-white eyes, pink cheeks, wide folded paper wings and pointed paper tail; two tiny detached cyan paper motes. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: fold wings inward; twist; strongest forward paper-beak glide with wings swept back and motes trailing; unfold recovery. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## kochi-yuzupika

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round bright-yellow yuzu fruit, dimples, two leaves, black-white eyes, smiling mouth, pink cheeks, four stubby feet, black-and-yellow horizontal rotor/halo on a short top stalk. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: rotor spins/tilts and body crouches; roll back; strongest forward rolling yuzu charge with leaves/rotor trailing; bounce. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## kumamoto-dai-karudera

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: broad green volcanic caldera monster with four feet, smiling black-white face and pink cheeks, dark gray crater rim on top containing orange-yellow peaks and one white steam puff. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: crater tilts and legs brace; magma peaks flare; strongest forward caldera stomp/body ram with steam trailing; heavy recovery. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## kumamoto-lastboss-kato-kiyomasa

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: compact historical samurai boss in charcoal armor with gold trim and red chest accents, gray conical helmet with gold crest, stern pale face and dark moustache, armored arms and legs. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: wide brace; armored fist/torso pull back; strongest forward armored punch with helmet and skirt plates moving; guarded recovery. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## kumamoto-suikabuto

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round green watermelon beetle monster, dark green rind stripes, four green feet, side shell bulges, black-white eyes, pink cheeks, open mouth, red watermelon-slice horn/visor with black seeds and white rind below brown stem. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: crouch with visor lowered; shell rolls back; strongest horn-first watermelon charge; bounce recovery. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## kyoto-chatsumin

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round green tea-leaf picker spirit with three top leaves, light-green belly, white-black eyes, pink cheeks, tiny feet, red diagonal shoulder strap and brown square basket at screen-right. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: strap/basket pull back; crouch; strongest forward shoulder-and-basket charge with leaves trailing; recovery. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## kyoto-funayadokari

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: orange hermit crab with smiling face, two huge orange claws, many striped legs ending on small blue boards, carrying a brown wooden boathouse shell with navy conical roof and two gold windows. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: claws/legs brace and shell dips; one claw draws back; strongest sideways claw strike/board scuttle with shell tilted; settle. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## kyoto-midboss-kayabuki-monban

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: broad thatched-roof gatekeeper, cream face with stern eyes and dark mouth, vertical wood bands, brown side blocks, two gray feet, layered tan conical roof with green brow strip and gold crown. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: feet brace and roof compresses; body rocks back; strongest forward gate ram with roof/crown tilted; heavy recovery. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## mie-gutsugutsu-don

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round dark-brown clay hotpot monster, cream domed lid with tan rim and orange-yellow knob, black-white eyes and smile, pink cheeks, brown side handles, ring of orange-yellow flames at base. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: handles brace and lid rattles; flames flare; strongest hopping hotpot body slam with lid tilted; bubbling settle. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## mie-midboss-oosansho-ou

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: massive squat brown giant salamander king with dark cross markings, huge white-black eyes, long dark mouth, gold crown, four tan-tipped feet, two tall blue waterfall panels rising behind both sides. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: body/feet brace and water panels rise; crouch; strongest forward salamander belly slam with panels flexing and crown tilted; heavy recovery. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## miyagi-kokeshina

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: wooden kokeshi girl, cream cylindrical floral body with red flower and green leaves, red collar and brown base, pale face, black-white eyes, pink cheeks, tiny red mouth, huge dark-purple bob hair with two red flower clips. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: body rocks and hair/flowers bob; tilt back; strongest spinning kokeshi body-check with floral body angled and determined eyes; upright settle. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## miyagi-sasakama-bushi

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: cream triangular sasa-kamaboko fishcake samurai, blue hakama, blue arms and feet, white headband, green bamboo-leaf sword held on screen-right. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: crouch, pull the leaf sword back, slash it in a broad diagonal arc, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## miyagi-zundamaru

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round white mochi creature with a bright green dripping zunda-bean coating, a green edamame pod with three beans on top, tiny arms and feet. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: compress like soft mochi, lift both arms, spring upward with the bean pod bouncing, then land. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## miyazaki-lastboss-komura-jutaro

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: dignified historical statesman with black beard and moustache, dark suit and bowler hat, striped trousers, holding a rolled document or book on screen-right. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: draw the document inward, step forward, thrust it outward in a commanding proclamation, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## miyazaki-nanban-ondori

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: orange chicken creature with red comb and wattle, green leaf-like wings behind, and a white sauce collar dotted green and yellow. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: ruffle feathers, lower its body, leap into a strong wing-assisted peck, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## nagano-midboss-karasu-jo

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: tall charcoal-gray Japanese castle monster with yellow angular eyes, small gold crown and horn-like roof corners, standing on a gray stone gate base. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: shake its roof tiers, lean back, slam the stone gate base forward, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## nagano-yukemuri-oyabun

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: gray and pink hot-spring boss sitting in a dotted blue bath tub, white-and-blue towel on its head, thick black brows and moustache. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: steam and towel rise, grip the tub, surge forward with a powerful hot-spring splash motion but no detached effects, then settle. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## nagasaki-fuwatera

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: square golden castella cake creature with caramel-brown top and bottom crusts, white sugar dots, square black-and-white eyes, pink cheeks, four tan feet, black-and-yellow handle on top. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: squash softly, lift its four feet, bounce forward in a heavy cake-body slam, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## nagasaki-mogi-tawawa

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round orange fruit creature with green top ring, a dark overhead branch bar suspending four miniature orange fruits, square eyes, pink cheeks and small feet. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: sway the hanging fruits, crouch, swing the fruit cluster strongly forward overhead, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## nara-chasenmaru

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round green tea-whisk creature with a small tan mushroom-like chasen cap, one square eye and pink cheek, four long green whisk-tentacle legs. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: splay the whisk legs, coil them inward, spring into a spinning multi-leg whisk strike, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## nara-midboss-hitome-senbon

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: brown cherry-tree monster with a huge pink blossom canopy covered in tiny white flowers, small gold crown, square eyes and four root legs with pink heart-shaped buds. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: rustle the blossom canopy, brace roots, sweep the wide flowering crown forward in a powerful canopy bash, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## niigata-akebono-toki

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round white crested ibis bird with vivid red mask, long dark curved beak tipped red, raised pink and orange wings, tiny red feet. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: flutter wings, crouch, lunge forward with a decisive long-beak strike, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## niigata-kitakaze-zake

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round orange salmon-like fighter with a dark navy cap, long horizontal brown cheek stripe, white belly, red-orange arms and legs. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: lean into a cold wind, draw one fin-arm back, deliver a strong forward body punch, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## niigata-shiobikin

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round orange salmon-like fighter with dark navy cap topped by a tan rectangular ornament, white belly, red-orange arms and legs, square eyes and pink cheeks. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: brace, tuck both arms, launch a compact headfirst body charge led by the cap ornament, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## oita-lastboss-fukuzawa-yukichi

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: dignified historical scholar with large squared dark hair, dark robe, gray striped lower garment, gold-red medallion, blue globe on screen-left and red-and-cream book on screen-right. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: raise globe and book, draw them inward, step forward and present both in a commanding scholarly strike, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## oita-yubune-don

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: orange hot-spring creature sitting in a rectangular brown wooden bath tub, white-and-blue headband, three white steam curls, square eyes and open mouth. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: steam curls rise, tub rocks back, surge the entire wooden bath forward in a heavy body slam, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## okayama-boss-kibi-no-onio

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: muscular blue oni king with cream horns, dark navy mane, tiny gold crown, yellow eye frames, two white fangs, blue armor body, red belt, striped brown skirt, holding a tall gray iron club on screen-left. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: raise the iron club, twist backward, smash the club downward with the strongest pose, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## okayama-lastboss-ikeda-mitsumasa

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: samurai lord in dark navy and purple armor with gold trim and red details, domed helmet with two large golden antler-like crests, pale square face. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: place hands near waist, widen stance, draw both arms back, deliver a formal commanding forward strike, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## okinawa-goya-musha

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round dark-green bitter melon warrior with lime bumps, two leaf ears and brown stem, tan vine looping behind on screen-right, tan horizontal mouth guard, tiny green arms and feet. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: vine tightens, body crouches, swing the looped vine forward like a whip while leaning, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## okinawa-ougon-pine

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round golden pineapple creature with checker-textured yellow body, dark and bright green spiky crown leaves, square eyes, pink cheeks and tiny feet. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: crown leaves fan outward, crouch, spring into a rolling pineapple body-check, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## osaka-budomaru

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: plump purple grape-cluster creature made of rounded lobes, brown stem and two small green leaves, square eyes and pink cheeks. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: grape lobes compress, stem tilts, bounce forward in a heavy clustered body slam, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## osaka-lastboss-toyotomi-hideyoshi

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: samurai lord in brilliant gold armor with dark navy helmet, two very long upward gold horns, red crest, black moustache, red belt and dark skirt. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: brace, draw both arms back, step forward into a powerful armored command strike, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## saga-boss-akajishi-oh

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: large red lion-dance king shaped like a wheeled cart, dark navy curly mane with gold spirals, gold horns and crown, huge toothy grin, four brown wooden wheels. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: mane and crown bounce, wheels pull back, charge forward hard on spinning wheels, then brake and recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## saga-lastboss-nabeshima-naomasa

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: samurai lord in dark blue armor with gold trim and red details, helmet with huge gold crescent, holding a tall purple staff with gold-red head on screen-right. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: raise staff, turn shoulders, sweep the long staff strongly across the front, then recover with staff on screen-right. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## saga-yumonbou

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: squat red-orange shrine-gate creature with wide open arch between two legs, dark charcoal rounded roof, white rectangular face panel, two small dark-and-white roof ornaments. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: roof ornaments bounce, legs brace, hop and slam the shrine-gate body forward, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## saitama-lastboss-shibusawa-eiichi

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: elderly dignified man with bald peach head and gray side hair, round dark navy formal coat, white triangular collar, blue-gray patterned waist band, red badge on screen-left and brown plaque on screen-right. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: draw both arms inward, lean forward, present the badge-and-plaque side in a decisive formal shoulder strike, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## shiga-asanunon

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round ivory woven-cloth creature with pale-gray plaid grid over body, yellow-and-dark ear pads on both sides, square eyes, pink cheeks and gray base foot. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: cloth grid flexes, ear pads pull back, spin into a padded side bash, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## shiga-jofu-hime

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round ivory striped princess creature with gray horizontal bands, yellow cap and four small yellow cross-shaped ornaments around the sides, rectangular dark eyes. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: side ornaments lift, body compresses, rotate and strike forward with the yellow ornaments leading, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## shiga-tsuburin

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: plump brown bird creature with darker brown cap, red-orange cheeks, white-black eyes, small dark beak with yellow corners, tan belly and braided tan base, white-cyan wings and feet. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: wings rise, body crouches, flap into a forward beak-and-belly charge, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## shimane-midboss-shirogane-mogura

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: large round silver-gray mole king with small gold crown, black eye mask, square eyes, broad silver toothy grin, pale gray ear-paws and white claw patches. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: ear-paws lift, crouch, lunge forward with both silver paws in a digging strike, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## shimane-warigo-tower

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: stacked red round lunchbox tower creature with orange bands, brown textured topping, orange egg dome, green garnish, two striped chopsticks rising behind, white-black eyes and pink cheeks. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: chopsticks sway, stacked boxes compress, leap into a tall tower body slam, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## shizuoka-chatsumin

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round bright-green tea creature with three tea leaves on top, pale-green belly, small buck teeth, holding a tan square tea biscuit on screen-right. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: top leaves bob, draw biscuit back, swing the biscuit forward like a paddle, then recover on screen-right. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## shizuoka-tsuun-wasabi

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round layered-green wasabi bowl creature with alternating dark and lime flame-like leaves on top, dark green rim, square eyes and mint cross-shaped side puffs. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: wasabi leaves flare, puffs pull inward, lunge forward in a sharp head-and-leaf thrust, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## tochigi-boss-kegon-ryuo

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: large blue waterfall dragon king with gold antlers and crown, pale aqua drooping whisker-ears, cream snout and belly, blue arms, lower body flowing into a pale-blue checkered waterfall and wave base. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: antlers and whiskers lift, waterfall base gathers, surge forward with a powerful dragon claw and attached wave-body motion, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## tochigi-ichigoro

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round heart-shaped red strawberry creature with yellow seeds, big green leafy crown, square eyes, pink cheeks and small green feet. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: leaves flutter, crouch, spring into a fast strawberry headbutt, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## tochigi-boss-kegon-ryuo cleanup

```text
Keep the exact eight blue waterfall dragon king poses and identity, but remove every detached water droplet, splash particle, cyan blob, white spray, and stray pixel cluster outside the dragon and its continuous attached waterfall-wave base. Express attack motion only with the body, claws, whiskers, and connected wave base. Each cell must contain exactly one complete character and no detached effects, text, shadows, or debris. Preserve transparent background, exact 4-column by 2-row arrangement, hard pixel art, consistent scale and padding.
```

## miyazaki-nanban-ondori cleanup

```text
Keep the eight chicken poses and their identity exactly, but remove every detached red, white, yellow, or gray artifact and stray pixel cluster between or outside the eight characters. Each cell must contain only one complete chicken character, with no effects, dust, sparks, text, shadows, or debris. Preserve transparent background, exact 4-column by 2-row arrangement, hard pixel art, consistent scale and padding.
```

## nagano-yukemuri-oyabun cleanup

```text
Keep the eight hot-spring boss poses and their identity exactly, but remove every detached water droplet, steam puff, splash particle, white blob, cyan spray, and stray pixel cluster outside the main character and tub. Express the attack only by body and tub movement and attached water shapes. Each cell must contain only one complete character, no detached effects, text, shadows, or debris. Preserve transparent background, exact 4-column by 2-row arrangement, hard pixel art, consistent scale and padding.
```

## tokushima-hamagamen

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: squat bright-blue sea creature with several rounded lower lobes and side fins, pale striped small flippers near the feet, huge tan perforated rock-like cap, square eyes and pink cheeks. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: cap bobs, side fins spread, flatten then spring into a cap-first body slam, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## tokushima-oo-kintoki

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round deep-red sweet-potato warrior with pointed side silhouette, two green leaves on top, stern square eyes, tan bamboo pole held horizontally across the face. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: brace pole, draw it back while turning, thrust the bamboo pole strongly forward, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## tokyo-boss-mihara-no-nushi

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: massive charcoal-black volcanic stone king with gold crown, yellow rectangular eyes, orange mouth marks, huge long arms, red camellia flowers with green leaves on shoulders and chest, orange bead necklace. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: flowers and necklace lift, draw huge arms back, strike forward with both volcanic fists, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## tokyo-midboss-denpa-oh

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: red-orange Tokyo Tower robot with white bands, dark navy rectangular chest screen with yellow angular eyes, red lattice limbs, white gloves and shoes, central red-white antenna, two large turquoise-and-navy broadcast coils beside its head. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: broadcast coils tilt inward, fists rise, step forward into a double robot punch, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## tottori-beniyoroigani

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: bright red armored crab with cream belly, eight segmented legs, two giant raised red claws, two red eyestalks with white-black eyes, small cream spikes and gold-red shell trim. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: legs brace, claws open high, bring both giant claws inward in a crushing pincer strike, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## tottori-nijisseikishi

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round pale yellow-green pear knight with brown stem, green leaf and small white flower, green boots, leaf shield with white flower on screen-left and tall brown spear with green bud on screen-right. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: raise shield and spear, crouch behind shield, thrust spear strongly forward from screen-right while shield guards screen-left, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## toyama-boss-tateyama-ou

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: gray three-peaked mountain king with white snowcaps, gold crown on tall central peak, square eyes and two small fangs, green shrub patches, attached pale-blue waterfall descending on screen-right. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: snowcaps and crown shake, waterfall tightens, lean forward into a massive mountain shoulder slam while waterfall stays attached, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## toyama-masuzushin

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round cream trout-sushi creature with pink top band and square red marks, flat brown lid on top, brown lower band and feet, green leaf fins on both sides, square eyes and pink cheeks. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: leaf fins spread, body compresses, spin into a compact sushi body-check, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## toyama-tulipon

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: red tulip creature with three-pointed flower head, green curved leaves and stem, brown bulb base with small root-feet, square eyes and pink cheeks. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: petals open slightly, leaves pull back, spring forward in a petal-and-bulb headbutt, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## wakayama-lastboss-tokugawa-yoshimune

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: samurai lord in dark green armor with gold trim and red details, dark navy helmet with very long upward gold horns and gold front crest, pale square face. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: brace, draw arms back, step into a strong formal armored punch, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## wakayama-shibukin

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round pale-cyan rabbit-like water creature with two very long dark-outlined white-blue ears, blue side flippers, square eyes, pink cheeks and dark nose-mouth. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: ears sway upward, flippers pull back, leap into a fast ear-led body charge, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## yamagata-jumbo-imoni

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: huge round charcoal iron stew pot monster filled with white taro, brown meat and green vegetables, tilted dark lid with small flame on top, long dark ladle held on screen-right, orange fire below. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: stew and lid bounce, draw ladle back, swing the ladle downward in a heavy pot-warrior strike, then recover on screen-right. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## yamagata-shogi-commander

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: upright tan wooden shogi-piece commander with pointed top, square eyes and pink cheeks, red emblem on chest, red paddle held on screen-left and tall brown spear with silver tip on screen-right. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: raise both paddle and spear, widen wooden feet, thrust spear forward while paddle guards, then recover with original item sides. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## yamaguchi-kanmon-fuku

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round blue-and-white pufferfish creature with dark blue spots, tiny top fin, white belly, blue-white side fins, square eyes, pink cheeks and two buck teeth, sitting on attached blue wave base. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: inflate slightly, side fins spread, lunge forward in a puffed body slam, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## yamaguchi-natsumikan-bushi

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: round orange citrus warrior with two green top leaves, small brown freckles, square eyes and pink cheeks, dark navy crossed arm-and-leg armor wrapping the lower sides with green foot trim. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: crossed navy arms brace, leaves tilt, uncross and drive both armored arms forward in a punch, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## yamanashi-boss-suisho-ryu

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: large purple crystal dragon king with gold crown, icy blue-white crystal horns and huge crystal wings, lavender snout with two white fangs, yellow plated belly and claws, standing on gray base with blue crystals. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: crystal wings flare, crouch on base, lunge forward with both claws and wings angled, then recover; keep crystals attached. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```

## yamanashi-midboss-sakasa-fujin

```text
Create an exact transparent 4-column by 2-row production pixel-art RPG sprite sheet of the same character from the two references; Image 1 is authoritative for identity/palette and Image 2 only supports shape. Subject: blue upside-down Mount Fuji spinning-top king with white snowy summit and gold crown, two upward blue arms capped with white snow fists, square eyes, pink cheeks, tiny fangs and pale-blue striped pointed lower cone. Crisp limited-palette Japanese RPG pixel art, hard pixels, no antialiasing. Exactly one complete centered front-facing character per equal cell, consistent scale/baseline, clear padding, no visible grid. Top idle frames: neutral; breathing with secondary parts lifting; natural blink and secondary motion; settle. Bottom attack frames: raise snow fists, cone twists, spin into a sharp forward top-body strike, then recover. Show real per-frame changes in eyes, silhouette, appendages/accessories and contact points while preserving identity, colors, item sides and anatomy. Transparent; no extra characters/limbs/items, detached projectiles, text, labels, effects, shadows, crop, blur or watermark.
```
