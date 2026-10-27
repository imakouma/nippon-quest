# batch-05 image generation records

All entries used built-in imagegen with both local references and
`transparent_background: true`. Generated originals are stored beside this file under
`generated-sources/`; normalized game assets are under
`assets/sprites/animations/batch-05/`.

## aichi-denkou-giku

- Pixel reference: `dist/pixels/aichi-denkou-giku.png`
- 3D reference: `dist/sheets/aichi-denkou-giku.jpg`
- Output: `generated-sources/aichi-denkou-giku.png`
- Runtime: `assets/sprites/animations/batch-05/aichi-denkou-giku-v1.png`
- Motion: petal breathing, sparks, blink; squash/lean/electric burst/recovery.
- Prompt constraints: authoritative pixel identity; round golden chrysanthemum; cream petals;
  orange face center; tall black-white eyes; pink cheeks; U mouth; green stem/leaves; 4×2 exact
  ordering; genuine per-part differences; transparent RGBA; no limbs, text, grid, matte, or simple
  whole-image transform.

## aichi-midboss-tokoname-neko

- Pixel reference: `dist/pixels/aichi-midboss-tokoname-neko.png`
- 3D reference: `dist/sheets/aichi-midboss-tokoname-neko.jpg`
- Output: `generated-sources/aichi-midboss-tokoname-neko.png`
- Runtime: `assets/sprites/animations/batch-05/aichi-midboss-tokoname-neko-v1.png`
- Motion: beckoning paw, tail, ears, blink; crouch/lean/paw swipe/recovery.
- Prompt constraints: authoritative red-brown ceramic cat identity; dark patches and tail; pink
  ears; stern rectangular eyes; white whiskers; gold crown; red collar, bib, medallion; raised paw
  and gold coin retained in all frames; 4×2 ordering; transparent RGBA; no extra limbs, weapons,
  text, grid, matte, or simple whole-image transform.

## akita-akitainu

- Pixel reference: `dist/pixels/akita-akitainu.png`
- 3D reference: `dist/sheets/akita-akitainu.jpg`
- Output: `generated-sources/akita-akitainu.png`
- Runtime: `assets/sprites/animations/batch-05/akita-akitainu-v1.png`
- Motion: chest breathing, ear, curled tail, halo, blink; four-legged crouch/lunge/pounce/recovery.
- Prompt constraints: authoritative orange Akita identity; cream muzzle, cheeks, chest, belly, paws;
  black nose; rectangular eyes; pink cheeks; curled cream-tipped tail; gold halo retained; remain
  four-legged; 4×2 ordering; transparent RGBA; no bipedal pose, extra limbs, wings, clothing, text,
  grid, matte, or simple whole-image transform.

## Normalization

The built-in outputs were RGBA 2:1 images. Each was reduced to the required 512×256 runtime
sheet with ffmpeg's nearest-neighbor scaler (`scale=512:256:flags=neighbor`). The generated source
was preserved unchanged before normalization.
