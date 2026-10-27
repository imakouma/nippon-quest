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

## Additional per-character generation records

For every row below, image 1 was the corresponding `dist/pixels/<id>.png` identity reference
and image 2 was `dist/sheets/<id>.jpg` for form only. The shared prompt required an exact 4×2
sheet, 128×128 logical cells, idle frames `neutral / breath / blink-accent / settle`, attack
frames `charge / anticipation / peak / recovery`, hard-edged medium-coarse pixels, stable
baseline and scale, genuine part motion, and transparent RGBA with no floor, shadow, labels,
grid, matte, extra objects, or invented anatomy. Each row's motion clause was added to that
shared prompt.

| ID | Identity-specific motion clause | Preserved source | Runtime output |
| --- | --- | --- | --- |
+| `akita-kiritanpo-nabe` | rice-cylinder stew pot; broth simmer and ingredient bob; pot crouch, lid/contents surge, ladle-like strike, recovery. | `generated-sources/akita-kiritanpo-nabe.png` | `assets/sprites/animations/batch-05/akita-kiritanpo-nabe-v1.png` |
| `akita-midboss-kanto-man` | masked regional hero; cape/chest/eyes settle; guarded crouch, arm draw, forward punch, recovery. | `generated-sources/akita-midboss-kanto-man.png` | `assets/sprites/animations/batch-05/akita-midboss-kanto-man-v1.png` |
| `chiba-horipii` | peanut-shell mascot; shell breathe and blink; shell compression, lean, pointed body ram, recovery. | `generated-sources/chiba-horipii.png` | `assets/sprites/animations/batch-05/chiba-horipii-v1.png` |
| `chiba-midboss-inubouken` | dog adventurer; ears/tail/accessories settle; four-legged crouch, lunge, paw/body strike, recovery. | `generated-sources/chiba-midboss-inubouken.png` | `assets/sprites/animations/batch-05/chiba-midboss-inubouken-v1.png` |
| `chugoku-islandboss-itsutsu-no-kataribe` | five-part storyteller boss; five faces/details animate independently; collective charge, converging lean, ensemble strike, recovery. | `generated-sources/chugoku-islandboss-itsutsu-no-kataribe.png` | `assets/sprites/animations/batch-05/chugoku-islandboss-itsutsu-no-kataribe-v1.png` |
| `ehime-jakotengyo` | fried fish creature; fins and tail swim; body curl, fin sweep, fish-body dash, recovery; never add legs. | `generated-sources/ehime-jakotengyo.png` | `assets/sprites/animations/batch-05/ehime-jakotengyo-v1.png` |
| `ehime-mofutaoru` | folded towel mascot; cloth folds flex and blink; gather, twist, towel snap, recovery. | `generated-sources/ehime-mofutaoru.png` | `assets/sprites/animations/batch-05/ehime-mofutaoru-v1.png` |
| `fukui-kami-fubuki` | paper-blizzard spirit; paper edges flutter; sheets gather, spiral, paper burst, settle. | `generated-sources/fukui-kami-fubuki.png` | `assets/sprites/animations/batch-05/fukui-kami-fubuki-v1.png` |
| `fukui-meganen` | glasses creature; lenses glint and temples flex; focus, lean, lens-powered thrust, recovery. | `generated-sources/fukui-meganen.png` | `assets/sprites/animations/batch-05/fukui-meganen-v1.png` |
| `fukui-yuki-no-suisen` | snow daffodil; petals/stem sway and blink; stem bends, petals gather, flower thrust/bloom, recovery. | `generated-sources/fukui-yuki-no-suisen.png` | `assets/sprites/animations/batch-05/fukui-yuki-no-suisen-v1.png` |
| `fukuoka-kaedama-oh` | noodle-refill king; noodles/crown breathe; bowl/body crouch, noodle wind-up, noodle strike, recovery. | `generated-sources/fukuoka-kaedama-oh.png` | `assets/sprites/animations/batch-05/fukuoka-kaedama-oh-v1.png` |
| `fukuoka-strobaby` | strawberry baby; leaf cap and body breathe; berry squash, lean, seed-speckled body ram, recovery. | `generated-sources/fukuoka-strobaby.png` | `assets/sprites/animations/batch-05/fukuoka-strobaby-v1.png` |
| `fukushima-akabeko-don` | red lucky cow; ears/tail/head bob; four-legged crouch, horn/head draw, forward charge, recovery. | `generated-sources/fukushima-akabeko-don.png` | `assets/sprites/animations/batch-05/fukushima-akabeko-don-v1.png` |
| `fukushima-chijiremen` | curly noodle creature; noodle curls wriggle; coil, lean, noodle lash, recovery. | `generated-sources/fukushima-chijiremen.png` | `assets/sprites/animations/batch-05/fukushima-chijiremen-v1.png` |
| `fukushima-midboss-goshiki-slime` | five-color slime boss; gelatinous color lobes wobble; arms draw, body compresses, arm/slime slam, recovery. | `generated-sources/fukushima-midboss-goshiki-slime.png` | `assets/sprites/animations/batch-05/fukushima-midboss-goshiki-slime-v1.png` |
| `gifu-fuyugakid` | winter persimmon child; leaf cap and fruit body breathe; squash, lean, fruit-body strike, recovery. | `generated-sources/gifu-fuyugakid.png` | `assets/sprites/animations/batch-05/gifu-fuyugakid-v1.png` |
| `gifu-midboss-karankoron` | wooden clog midboss; straps/wood body settle; heel brace, toe draw, clog kick/stomp, recovery. | `generated-sources/gifu-midboss-karankoron.png` | `assets/sprites/animations/batch-05/gifu-midboss-karankoron-v1.png` |
| `gifu-ushou-dori` | charcoal cormorant with torch; feathers and flame flicker; crouch, wing draw, beak/wing thrust with flame flare, recovery. | `generated-sources/gifu-ushou-dori.png` | `assets/sprites/animations/batch-05/gifu-ushou-dori-v1.png` |
| `gunma-kinuhane-hime` | silk cocoon angel; wings/antennae/halo move; wing fold, lean, silk-gust wing sweep, recovery. | `generated-sources/gunma-kinuhane-hime.png` | `assets/sprites/animations/batch-05/gunma-kinuhane-hime-v1.png` |
| `gunma-mayumaru` | two-lobed cocoon on green base; cocoon compresses and cap bobs; coil, lean, elastic spring, recovery. | `generated-sources/gunma-mayumaru.png` | `assets/sprites/animations/batch-05/gunma-mayumaru-v1.png` |
| `hiroshima-iwabashigame` | brown rock turtle with stone shell; body breathes under shell; legs brace, shell draw, rock-shell ram, recovery. | `generated-sources/hiroshima-iwabashigame.png` | `assets/sprites/animations/batch-05/hiroshima-iwabashigame-v1.png` |
| `hiroshima-lastboss-mouri-motonari` | green-armored samurai lord; armor/helmet/baton settle; crouch, baton draw, diagonal command strike, recovery. | `generated-sources/hiroshima-lastboss-mouri-motonari.png` | `assets/sprites/animations/batch-05/hiroshima-lastboss-mouri-motonari-v1.png` |
| `hiroshima-taiyo-lemon` | round lemon sun mascot; leaves/body breathe; citrus squash, lean, shoulder/headbutt, recovery. | `generated-sources/hiroshima-taiyo-lemon.png` | `assets/sprites/animations/batch-05/hiroshima-taiyo-lemon-v1.png` |
| `hokkaido-dodeka-melon` | netted melon warrior; lid/stem and leaf fists move; fists draw, lean, leaf punch, recovery. | `generated-sources/hokkaido-dodeka-melon.png` | `assets/sprites/animations/batch-05/hokkaido-dodeka-melon-v1.png` |
| `hokkaido-jaga-dodon` | potato boxer; sprouts/body breathe; fists tuck, lean, forward potato punch, recovery. | `generated-sources/hokkaido-jaga-dodon.png` | `assets/sprites/animations/batch-05/hokkaido-jaga-dodon-v1.png` |
| `hokkaido-kurioneru` | floating ice-blue spirit; halo/fins/core pulse; core charge, fins sweep, glowing spirit surge, recovery. | `generated-sources/hokkaido-kurioneru.png` | `assets/sprites/animations/batch-05/hokkaido-kurioneru-v1.png` |
| `hokkaido-murasaki-kazedori` | purple wind bird; wings/antennae ruffle; foot crouch, wings draw, beak-first gust charge, recovery. | `generated-sources/hokkaido-murasaki-kazedori.png` | `assets/sprites/animations/batch-05/hokkaido-murasaki-kazedori-v1.png` |
| `hyogo-kuromame-musha` | black bean samurai; crest/shield settle; brace, lean, shield bash/body charge, recovery. | `generated-sources/hyogo-kuromame-musha.png` | `assets/sprites/animations/batch-05/hyogo-kuromame-musha-v1.png` |
| `hyogo-ootamanegi` | two joined onion twins; alternating breath/sprout sway; paired compression, double bump, recovery. | `generated-sources/hyogo-ootamanegi.png` | `assets/sprites/animations/batch-05/hyogo-ootamanegi-v1.png` |
| `hyogo-takotsubon` | headband octopus in clay pot; tentacles curl; retract, draw back, two-tentacle lash, recovery. | `generated-sources/hyogo-takotsubon.png` | `assets/sprites/animations/batch-05/hyogo-takotsubon-v1.png` |
| `ibaraki-hasu-kabuto` | two lotus-root twins; caps/feet alternate; brace, lean, synchronized cap/body charge, recovery. | `generated-sources/ibaraki-hasu-kabuto.png` | `assets/sprites/animations/batch-05/ibaraki-hasu-kabuto-v1.png` |
| `ibaraki-midboss-harutsuge-dori` | flowered ceremonial bird; feathers/hat ruffle; fold, lean, two-wing gust slash, recovery. | `generated-sources/ibaraki-midboss-harutsuge-dori.png` | `assets/sprites/animations/batch-05/ibaraki-midboss-harutsuge-dori-v1.png` |
| `ibaraki-warazuto-musha` | straw-wrapped warrior; fibers/braid/cord move; brace, twist, woven shoulder ram, recovery. | `generated-sources/ibaraki-warazuto-musha.png` | `assets/sprites/animations/batch-05/ibaraki-warazuto-musha-v1.png` |
| `ishikawa-hamashion` | salt mound with medical pouch; crystals/pouch move; compress, lean, pointed salt thrust, recovery. | `generated-sources/ishikawa-hamashion.png` | `assets/sprites/animations/batch-05/ishikawa-hamashion-v1.png` |
| `ishikawa-lastboss-maeda-toshiie` | white-armored spear lord; armor/helmet/spear settle; crouch, draw, spear thrust, recovery. | `generated-sources/ishikawa-lastboss-maeda-toshiie.png` | `assets/sprites/animations/batch-05/ishikawa-lastboss-maeda-toshiie-v1.png` |
| `kagawa-aogin` | cotton-candy spirit on one stick; puffs pulse; stick flex, compress, spinning puff strike, recovery. | `generated-sources/kagawa-aogin.png` | `assets/sprites/animations/batch-05/kagawa-aogin-v1.png` |
| `kagawa-midboss-ritsurin-no-nushi` | crowned amphibious sea boss; fins/crown settle; compress, drive, belly/flipper slam, recovery. | `generated-sources/kagawa-midboss-ritsurin-no-nushi.png` | `assets/sprites/animations/batch-05/kagawa-midboss-ritsurin-no-nushi-v1.png` |
| `kagawa-sorautsushi` | two water-droplet twins; alternating bob/ripple; crouch, lean, synchronized water dash, recovery. | `generated-sources/kagawa-sorautsushi.png` | `assets/sprites/animations/batch-05/kagawa-sorautsushi-v1.png` |
| `kagoshima-chappa` | two green tea twins; caps/body alternate; brace, twist, double body bump, recovery. | `generated-sources/kagoshima-chappa.png` | `assets/sprites/animations/batch-05/kagoshima-chappa-v1.png` |
| `kagoshima-maru-daikon` | round daikon; three leaves sway; compress, sweep leaves, pointed-root headbutt, recovery. | `generated-sources/kagoshima-maru-daikon.png` | `assets/sprites/animations/batch-05/kagoshima-maru-daikon-v1.png` |
| `kagoshima-shincha-dou` | two tea mascots with marked helmets; alternate bob; brace, tilt helmets, paired ram, recovery. | `generated-sources/kagoshima-shincha-dou.png` | `assets/sprites/animations/batch-05/kagoshima-shincha-dou-v1.png` |
| `kanagawa-iwashigun` | sardine leader plus four fish; fins/orbit move; satellites gather, lean, school stream attack, recovery. | `generated-sources/kanagawa-iwashigun.png` | `assets/sprites/animations/batch-05/kanagawa-iwashigun-v1.png` |
| `kanagawa-midboss-kurotamagon` | black egg king; arms/crown flex; plant fists, crouch, massive punch/slam, recovery. | `generated-sources/kanagawa-midboss-kurotamagon.png` | `assets/sprites/animations/batch-05/kanagawa-midboss-kurotamagon-v1.png` |
| `kinki-islandboss-rokkagi-no-ori` | ornamental cage boss; eyes/latch/handle shift; brace, compress, doors/grid slam open, recovery. | `generated-sources/kinki-islandboss-rokkagi-no-ori.png` | `assets/sprites/animations/batch-05/kinki-islandboss-rokkagi-no-ori-v1.png` |
| `kochi-kagayaki-yuzu` | yuzu with striped halo; leaf/halo bob; arms draw, fruit compress, citrus punch/ram, recovery. | `generated-sources/kochi-kagayaki-yuzu.png` | `assets/sprites/animations/batch-05/kochi-kagayaki-yuzu-v1.png` |
| `kochi-oowashigami` | paper eagle spirit; wing/tail ripple; wings fold, lean, beak dive/wing slash, recovery. | `generated-sources/kochi-oowashigami.png` | `assets/sprites/animations/batch-05/kochi-oowashigami-v1.png` |
| `kumamoto-boss-mushagaeshi` | castle-rampart boss; stone/crown settle; ramparts brace, lean, fortress slam, recovery. | `generated-sources/kumamoto-boss-mushagaeshi.png` | `assets/sprites/animations/batch-05/kumamoto-boss-mushagaeshi-v1.png` |

The built-in outputs were RGBA 2:1 images. Each was reduced to the required 512×256 runtime
sheet with ffmpeg's nearest-neighbor scaler (`scale=512:256:flags=neighbor`). The generated source
was preserved unchanged before normalization.
