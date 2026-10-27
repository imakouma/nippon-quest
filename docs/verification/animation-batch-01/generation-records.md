# animation-batch-01 生成記録

## 共通

- 生成: built-in imagegen（透過背景）。fal、外部課金API、OmniRouteは不使用。
- 各生成前に採用ドット、資料室の立体版、完成済みリンゴロンシートを目視した。
- 原本は同ディレクトリの `<id>-generated-source.png`。
- ランタイム版は原本の2:1比率と4列2行を保ち、`ffmpeg` の nearest-neighbor で512×256 RGBAへ機械整形した。
- 目視基準: 輪郭・顔・付属物・パレット・基準点、実際のポーズ差分、欠け、透過縁、種別に反する手足の有無。

## iwate-kagurabi

- 出力: `assets/sprites/animations/batch-01/iwate-kagurabi-v1.png`
- 参照: `pixels/iwate-kagurabi.png`, `sheets/iwate-kagurabi.jpg`, `assets/sprites/animations/aomori-ringoron-v1.png`

```text
Use case: stylized-concept
Asset type: production 2D RPG pixel-art sprite sheet
Primary request: Create one exact 4-column by 2-row animation sheet for IWATE KAGURABI. Image 1 is the adopted pixel sprite and face/palette anchor. Image 2 is the adopted anatomy/model-sheet anchor: a small red fire dog with four canine legs, floppy red ears, cream curled cloud tufts around the face and body, black paws, tiny fangs, and one curled tail tipped by a bright flame. Image 3 is the approved Ringoron animation sheet and is the style, pixel density, spacing, outline, and motion-quality anchor.
Composition: exactly eight complete, uncropped, equally spaced cells, left-to-right. Each cell must fit a square 128x128 logical area with generous transparent padding and the same foot baseline. Top row frames: 1 neutral idle, 2 subtle breathing with cream curls and flame tail lifting, 3 brief blink while ears dip slightly, 4 return to neutral. Bottom row frames: 5 crouched canine wind-up, 6 body leaning forward with hind legs pushing, 7 actual short leaping fire tackle pose with all four legs clearly canine and flame swept backward, 8 landed recovery returning toward neutral.
Style: crisp medium-coarse hand-pixelled game art matching Image 3, limited palette, hard pixel edges, one-pixel dark outline, no anti-aliased painterly rendering.
Constraints: preserve identical face, proportions, palette, curl placement, ears, four legs, paws, and single flame tail in every frame; real pose differences, not whole-image translation or scaling; transparent background; no shadows; no labels; no grid lines; no text; no extra limbs; no humanoid hands; no weapons; no effects extending outside a cell.
```

## iwate-izumiko

- 出力: `assets/sprites/animations/batch-01/iwate-izumiko-v1.png`
- 参照: `pixels/iwate-izumiko.png`, `sheets/iwate-izumiko.jpg`, `assets/sprites/animations/aomori-ringoron-v1.png`

```text
Use case: stylized-concept
Asset type: production 2D RPG pixel-art sprite sheet
Primary request: Create one exact 4-column by 2-row animation sheet for IWATE IZUMIKO. Image 1 is the adopted pixel sprite and face/palette anchor. Image 2 is the adopted anatomy/model-sheet anchor: a small friendly floating baby ray with a diamond manta body, blue upper surface, cream underside and cheeks, teal eyes, luminous cyan upturned fin tips and crescent, and one short curled water tail. Image 3 is the approved Ringoron animation sheet and is the style, pixel density, spacing, outline, and motion-quality anchor.
Composition: exactly eight complete, uncropped, equally spaced cells, left-to-right. Each cell must fit a square 128x128 logical area with generous transparent padding and the same floating center/baseline. Top row frames: 1 neutral hovering idle, 2 gentle fin-wing downbeat and tail uncurl, 3 blink with fin tips raised, 4 return to neutral. Bottom row frames: 5 fins drawn back in a focused wind-up, 6 body pitching forward, 7 actual fast water-dash attack pose with fins swept back and tail streaming, 8 braking/landing hover returning toward neutral.
Style: crisp medium-coarse hand-pixelled game art matching Image 3, limited blue/cyan/cream palette, hard pixel edges, one-pixel dark outline, no anti-aliased painterly rendering.
Constraints: preserve identical face, ray silhouette, two broad fins, cream underside, cyan tips/crescent, and exactly one curled tail in every frame; real fin/tail/pose differences, not whole-image translation or scaling; transparent background; no shadows; no labels; no grid lines; no text; absolutely no legs, feet, arms, humanoid hands, jellyfish tentacles, weapons, or effects extending outside a cell.
```

## iwate-kodamaru

- 出力: `assets/sprites/animations/batch-01/iwate-kodamaru-v1.png`
- 参照: `pixels/iwate-kodamaru.png`, `sheets/iwate-kodamaru.jpg`, `assets/sprites/animations/aomori-ringoron-v1.png`

```text
Use case: stylized-concept
Asset type: production 2D RPG pixel-art sprite sheet
Primary request: Create one exact 4-column by 2-row animation sheet for IWATE KODAMARU. Image 1 is the adopted pixel sprite and face/palette anchor. Image 2 is the adopted anatomy/model-sheet anchor: a squat sleepy baby acorn owl with a brown layered acorn cap, one short stem and one green leaf sprout, cream heart-shaped face disk and belly, half-lidded amber eyes, small beak, two short olive leaf wings, tiny bird feet, and a short leaf tail. Image 3 is the approved Ringoron animation sheet and is the style, pixel density, spacing, outline, and motion-quality anchor.
Composition: exactly eight complete, uncropped, equally spaced cells, left-to-right. Each cell must fit a square 128x128 logical area with generous transparent padding and the same foot baseline. Top row frames: 1 sleepy neutral idle, 2 subtle breath with leaf sprout and wing feathers lifting, 3 slow full blink, 4 return to neutral. Bottom row frames: 5 lowered focused wind-up with wings opening, 6 forward hop with wings pushing back, 7 actual short owl peck/wing-bash attack pose with beak forward and both bird feet tucked, 8 landed recovery returning toward neutral.
Style: crisp medium-coarse hand-pixelled game art matching Image 3, limited brown/cream/olive palette, hard pixel edges, one-pixel dark outline, no anti-aliased painterly rendering.
Constraints: preserve identical owl face, acorn cap layers, single stem and leaf, two leaf wings, tiny bird feet and palette in every frame; correct bird anatomy, never humanoid; real wing/leaf/body pose differences, not whole-image translation or scaling; transparent background; no shadows; no labels; no grid lines; no text; no arms, hands, extra limbs, weapons, or effects extending outside a cell.
```

## protagonist

- 出力: `assets/sprites/animations/batch-01/protagonist-v1.png`
- 参照: `pixels/protagonist.png`, `sheets/protagonist.jpg`, `assets/sprites/animations/aomori-ringoron-v1.png`
- `characters.json` では `customizable-reference`。固定画像で既存の外見カスタマイズや4方向歩行を置換しない。

```text
Use case: stylized-concept
Asset type: production 2D RPG pixel-art character animation reference sheet
Primary request: Create one exact 4-column by 2-row animation sheet for the NIHON QUEST default PROTAGONIST. Image 1 anchors the simple current pixel proportions. Image 2 anchors the adopted default model-sheet identity: elementary-school-age child, warm tan skin, large brown eyes, short layered charcoal hair with one curved cowlick, teal-blue short coat with broad cream hood/cuffs, cream shirt and shorts, dark brown cross-body satchel, round blue-and-gold compass clasp, and dark ankle boots. Image 3 anchors approved pixel density, spacing, outline, and motion quality.
Composition: exactly eight complete uncropped equally spaced full-body cells, left-to-right, each in a 128x128 logical square with transparent padding and one shared foot baseline. Top row: 1 neutral ready idle facing left three-quarter, 2 subtle breathing with coat and satchel movement, 3 blink with slight head dip, 4 return. Bottom row: 5 unarmed braced wind-up, 6 forward step with one arm guarding, 7 actual quick shoulder/hand strike pose without weapon, 8 balanced recovery.
Style: crisp medium-coarse hand-pixelled game art matching Image 3; limited teal/cream/brown palette; hard pixel edges and dark pixel outline.
Constraints: same child identity, hair, face, coat, hood, compass, satchel, shorts and boots every frame; real limb/cloth differences, not whole-image translation/scaling; transparent background; no shadow, labels, grid lines, text, weapon, magic effect, extra limbs, cropped body, or mature adult proportions. This fixed look is a reference/battle candidate only and must not imply replacing player customization.
```

## michiru

- 出力: `assets/sprites/animations/batch-01/michiru-v1.png`
- 参照: `pixels/michiru-current-v1.png`, `sheets/michiru.jpg`, `assets/sprites/animations/aomori-ringoron-v1.png`
- 初回出力は待機行に青い残像が広がったため不採用。`michiru-generated-source-rejected-v1.png` として保存し、下記の修正指示で再生成した。

初回不採用プロンプト:

```text
Use case: stylized-concept
Asset type: production 2D RPG pixel-art character animation sheet
Primary request: Create one exact 4-column by 2-row animation sheet for MICHIRU. Image 1 anchors her tiny in-game fairy silhouette. Image 2 anchors identity: childlike violet-haired fairy guide with one curled cowlick, violet eyes, pointed ears, four translucent pale blue wings, white-and-lavender petal tunic, oversized white scarf, small purple side pouch, compass pendant, bare hands, and purple-white boots. Image 3 anchors approved pixel density, spacing, outline, and motion quality.
Composition: exactly eight complete uncropped equally spaced full-body cells, left-to-right, each in a 128x128 logical square with transparent padding and one shared floating center. Top row: 1 neutral hovering idle, 2 gentle wing downbeat and scarf lift, 3 blink with wings raised, 4 return. Bottom row: 5 focused hover with hands gathering soft pale-blue light, 6 wings swept back and body leaning forward, 7 actual short compass-magic pulse pose projected from open hands, 8 braking hover/recovery.
Style: crisp medium-coarse hand-pixelled game art matching Image 3; limited violet/white/pale-blue palette; hard pixel edges and dark pixel outline.
Constraints: same face, pointed ears, hair, exactly four wings, scarf, compass, pouch, tunic and boots in every frame; real wing/hand/scarf differences, not whole-image translation/scaling; transparent background; no shadow, labels, grid lines, text, wand, sword, extra limbs, oversized effect, cropped wings, or adult proportions.
```

採用版修正プロンプト:

```text
Use case: precise-object-edit
Asset type: production 2D RPG pixel-art character animation sheet
Primary request: Clean up Image 1 while preserving the same exact MICHIRU character, eight poses, 4-column by 2-row layout, pixel style, proportions, colors and transparent background.
Change only: remove every loose blue/cyan aura, trailing smoke, stray particle, scribble and glow outside the character in frames 1, 2, 3, 4, 5, 6 and 8. Those seven frames must show only Michiru's body, clothing and exactly four clean translucent wings on fully transparent empty space. In frame 7 only, retain one small contained compass-shaped pale-blue magic pulse between her open hands, fully inside that frame.
Preserve: childlike violet-haired fairy, one curled cowlick, violet eyes, pointed ears, exactly four pale-blue wings, white-and-lavender petal tunic, oversized white scarf, purple pouch, compass pendant, boots, all existing poses and expression sequence.
Constraints: crisp hard pixel edges; no background; no shadow; no external glow halo; no loose particles; no cross-cell trails; no text; no grid lines; no extra wings or limbs; do not crop any wing or body.
```

## shiori

- 出力: `assets/sprites/animations/batch-01/shiori-v1.png`
- 参照: `pixels/shiori-current-v1.png`, `sheets/shiori.jpg`, `assets/sprites/animations/aomori-ringoron-v1.png`

```text
Use case: stylized-concept
Asset type: production 2D RPG pixel-art character animation sheet
Primary request: Create one exact 4-column by 2-row animation sheet for SHIORI. Image 1 anchors her small in-game silhouette. Image 2 anchors identity: elementary-school-age girl with short warm-brown bob, large brown eyes, red beret with one soft top nub, cream long-sleeve collared shirt, olive-green wide-leg short overalls with brass buttons and side pockets, red shoes, and one small dark-red book. Image 3 anchors approved pixel density, spacing, outline, and motion quality.
Composition: exactly eight complete uncropped equally spaced full-body cells, left-to-right, each in a 128x128 logical square with transparent padding and one shared foot baseline. Top row: 1 neutral idle holding closed book, 2 subtle breath with beret and book movement, 3 blink with slight thoughtful head dip, 4 return. Bottom row: 5 opens the book in a focused wind-up, 6 turns a page while stepping forward, 7 actual knowledge-action pose presenting the open book with a small contained golden page glint, 8 closes book and recovers.
Style: crisp medium-coarse hand-pixelled game art matching Image 3; limited red/olive/cream/brown palette; hard pixel edges and dark pixel outline.
Constraints: same child identity, bob hair, red beret, cream shirt, olive overalls, red shoes and exactly one book in every frame; real arm/book/cloth differences, not whole-image translation/scaling; transparent background; no shadow, labels, grid lines, text, weapon, extra book, extra limbs, oversized magic effect, cropped body, or adult proportions.
```
