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
