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
| `akita-kiritanpo-nabe` | rice-cylinder stew pot; broth simmer and ingredient bob; pot crouch, lid/contents surge, ladle-like strike, recovery. | `generated-sources/akita-kiritanpo-nabe.png` | `assets/sprites/animations/batch-05/akita-kiritanpo-nabe-v1.png` |
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
| `kumamoto-karuderan` | caldera mascot; rim and inner layers breathe; basin compresses, rim rolls, volcanic body slam, recovery. | `generated-sources/kumamoto-karuderan.png` | `assets/sprites/animations/batch-05/kumamoto-karuderan-v1.png` |
| `kumamoto-shimadama` | striped island-ball mascot; body and feet bob; roll back, compress, rolling body strike, recovery. | `generated-sources/kumamoto-shimadama.png` | `assets/sprites/animations/batch-05/kumamoto-shimadama-v1.png` |
| `kyoto-chasenshi` | tea warrior; leaf crest and sleeves settle; guarded crouch, arm draw, tea-powered punch, recovery. | `generated-sources/kyoto-chasenshi.png` | `assets/sprites/animations/batch-05/kyoto-chasenshi-v1.png` |
| `kyoto-funaya-don` | wooden boathouse mascot; roof and water details breathe; hull braces, tilts, prow ram, recovery. | `generated-sources/kyoto-funaya-don.png` | `assets/sprites/animations/batch-05/kyoto-funaya-don-v1.png` |
| `kyoto-lastboss-murasaki-shikibu` | purple-robed historical author; hair, sleeves, and fan settle; step back, fan draw, sweeping fan strike, recovery. | `generated-sources/kyoto-lastboss-murasaki-shikibu.png` | `assets/sprites/animations/batch-05/kyoto-lastboss-murasaki-shikibu-v1.png` |
| `mie-boss-iseebi-taisho` | armored lobster general; antennae, claws, and tail move; claws brace, body coils, double-claw lunge, recovery. | `generated-sources/mie-boss-iseebi-taisho.png` | `assets/sprites/animations/batch-05/mie-boss-iseebi-taisho-v1.png` |
| `mie-kuwanaguri` | chestnut mascot; husk points and feet bounce; shell crouch, lean, spiny headbutt, recovery. | `generated-sources/mie-kuwanaguri.png` | `assets/sprites/animations/batch-05/mie-kuwanaguri-v1.png` |
| `miyagi-boss-mikazuki-shogun` | crescent-crested armored shogun; helmet and sleeves settle; crouch, weapon draw, command slash, recovery. | `generated-sources/miyagi-boss-mikazuki-shogun.png` | `assets/sprites/animations/batch-05/miyagi-boss-mikazuki-shogun-v1.png` |
| `miyagi-oo-sumibitan` | large charcoal-tongued mascot; body and tongue breathe; squat, tongue retract, tongue/body strike, recovery. | `generated-sources/miyagi-oo-sumibitan.png` | `assets/sprites/animations/batch-05/miyagi-oo-sumibitan-v1.png` |
| `miyagi-tanyakki` | beef-tongue yakitori mascot; skewer/body bob; crouch, skewer draws back, pointed thrust, recovery. | `generated-sources/miyagi-tanyakki.png` | `assets/sprites/animations/batch-05/miyagi-tanyakki-v1.png` |
| `miyazaki-hyuganattsu` | joined citrus twins; alternating leaf and eye motion; paired squash, spring-apart head-bump, recovery. | `generated-sources/miyazaki-hyuganattsu.png` | `assets/sprites/animations/batch-05/miyazaki-hyuganattsu-v1.png` |
| `miyazaki-misaki-pony` | brown pony with purple mane and green tail tuft; ears, mane, hoof move; hind-leg crouch, forward hoof charge, recovery. | `generated-sources/miyazaki-misaki-pony.png` | `assets/sprites/animations/batch-05/miyazaki-misaki-pony-v1.png` |
| `nagano-koori-wakasagi` | icy fish mascot; fins paddle and body shivers; fins draw, body compresses, fish dart, recovery. | `generated-sources/nagano-koori-wakasagi.png` | `assets/sprites/animations/batch-05/nagano-koori-wakasagi-v1.png` |
| `nagano-retasuke` | curly lettuce mascot; layered leaves ripple; leaf rim folds, body compresses, spinning leaf slap, recovery. | `generated-sources/nagano-retasuke.png` | `assets/sprites/animations/batch-05/nagano-retasuke-v1.png` |
| `nagasaki-boss-unzen-ryu` | crowned blue dragon; crown, gills, and tail move; head lowers, claws draw, jaw-and-claw lunge, recovery. | `generated-sources/nagasaki-boss-unzen-ryu.png` | `assets/sprites/animations/batch-05/nagasaki-boss-unzen-ryu-v1.png` |
| `nagasaki-lastboss-siebold` | historical human in dark coat with purple flower; hair, coat, flower move; step, arm draw, forward command gesture, recovery. | `generated-sources/nagasaki-lastboss-siebold.png` | `assets/sprites/animations/batch-05/nagasaki-lastboss-siebold-v1.png` |
| `nagasaki-yadoshima` | blue island mascot under mountain hat; hat and summit bob; body squashes, arms brace, hat-rim headbutt, recovery. | `generated-sources/nagasaki-yadoshima.png` | `assets/sprites/animations/batch-05/nagasaki-yadoshima-v1.png` |
| `nara-lastboss-shotoku-taishi` | purple-armored prince with baton; sleeves and baton settle; shoulders draw, baton rises, forward thrust, recovery. | `generated-sources/nara-lastboss-shotoku-taishi.png` | `assets/sprites/animations/batch-05/nara-lastboss-shotoku-taishi-v1.png` |
| `nara-sumiryu` | horned indigo dragon with ear-wings; wings and tail move; crouch, horns angle, horn-and-claw lunge, recovery. | `generated-sources/nara-sumiryu.png` | `assets/sprites/animations/batch-05/nara-sumiryu-v1.png` |
| `niigata-hisui-koro` | glossy jade stone mascot; body and discrete highlight breathe; rock back, compress, rolling shoulder strike, recovery. | `generated-sources/niigata-hisui-koro.png` | `assets/sprites/animations/batch-05/niigata-hisui-koro-v1.png` |
| `niigata-midboss-sanjaku-don` | crowned orange festival giant; crown/drums bob; squash, lean, heavy body slam, recovery. | `generated-sources/niigata-midboss-sanjaku-don.png` | `assets/sprites/animations/batch-05/niigata-midboss-sanjaku-don-v1.png` |
| `oita-kabosu-daisho` | kabosu general with citrus shield and mallet; leaves/gear move; brace, mallet strike, recovery. | `generated-sources/oita-kabosu-daisho.png` | `assets/sprites/animations/batch-05/oita-kabosu-daisho-v1.png` |
| `oita-sekiajiro` | mackerel over a wave; fins/tail/water move; coil, swim dash, recovery. | `generated-sources/oita-sekiajiro.png` | `assets/sprites/animations/batch-05/oita-sekiajiro-v1.png` |
| `okayama-bizen-ootsubo` | flaming Bizen jar; five flames flicker; rock back, fiery jar ram, recovery. | `generated-sources/okayama-bizen-ootsubo.png` | `assets/sprites/animations/batch-05/okayama-bizen-ootsubo-v1.png` |
| `okayama-fukuromomo` | peach in basket; leaves/paws bob; duck, basket tilt, spring bash, recovery. | `generated-sources/okayama-fukuromomo.png` | `assets/sprites/animations/batch-05/okayama-fukuromomo-v1.png` |
| `okinawa-boss-dairyuchu` | crowned coiled dragon; antennae/arms/coils move; twist, head-and-coil lash, recovery. | `generated-sources/okinawa-boss-dairyuchu.png` | `assets/sprites/animations/batch-05/okinawa-boss-dairyuchu-v1.png` |
| `okinawa-midboss-eisa-daiko` | crowned Eisa drum with overhead stick; arms/stick move; lower, overhead action, recovery. | `generated-sources/okinawa-midboss-eisa-daiko.png` | `assets/sprites/animations/batch-05/okinawa-midboss-eisa-daiko-v1.png` |
| `okinawa-yanbaru-totto` | two joined dark birds; alternating blink/legs; paired lean, twin kick, recovery. | `generated-sources/okinawa-yanbaru-totto.png` | `assets/sprites/animations/batch-05/okinawa-yanbaru-totto-v1.png` |
| `osaka-juwanasu` | purple eggplant with blue arms; leaf/arms move; squash, double jab/body ram, recovery. | `generated-sources/osaka-juwanasu.png` | `assets/sprites/animations/batch-05/osaka-juwanasu-v1.png` |
| `osaka-sakusaku-momiji` | maple leaf on stem; points/hands ripple; bend, spinning leaf slash, recovery. | `generated-sources/osaka-sakusaku-momiji.png` | `assets/sprites/animations/batch-05/osaka-sakusaku-momiji-v1.png` |
| `saga-higata-taisho` | mudflat general on mud base; blue crest/hands wobble; compress, belly slam, recovery. | `generated-sources/saga-higata-taisho.png` | `assets/sprites/animations/batch-05/saga-higata-taisho-v1.png` |
| `saga-sometsubon` | blue-white porcelain jar; lid/patterned body bob; rock, ceramic bash, recovery. | `generated-sources/saga-sometsubon.png` | `assets/sprites/animations/batch-05/saga-sometsubon-v1.png` |
| `saitama-haniwa-musha` | clay warrior with shield; helmet/shield settle; brace, shield bash, recovery. | `generated-sources/saitama-haniwa-musha.png` | `assets/sprites/animations/batch-05/saitama-haniwa-musha-v1.png` |
| `saitama-negi-lancer` | leek knight with lance; leaves/roots move; lower lance, thrust, recovery. | `generated-sources/saitama-negi-lancer.png` | `assets/sprites/animations/batch-05/saitama-negi-lancer-v1.png` |
| `shiga-ibuki-no-oyama` | snowy green mountain with cloud arms; clouds/summit move; crouch, cloud punch, recovery. | `generated-sources/shiga-ibuki-no-oyama.png` | `assets/sprites/animations/batch-05/shiga-ibuki-no-oyama-v1.png` |
| `shiga-naminori-tsuburi` | bird surfing on wave; wings/splash move; fold, surf dash, recovery. | `generated-sources/shiga-naminori-tsuburi.png` | `assets/sprites/animations/batch-05/shiga-naminori-tsuburi-v1.png` |
| `shimane-chidorin` | hatted plover; antennae/wings move; crouch, flutter strike, recovery. | `generated-sources/shimane-chidorin.png` | `assets/sprites/animations/batch-05/shimane-chidorin-v1.png` |
| `shimane-shijimin` | dark clam shell; shell halves open/close; clamp, rock, shell spin, recovery. | `generated-sources/shimane-shijimin.png` | `assets/sprites/animations/batch-05/shimane-shijimin-v1.png` |
| `shizuoka-boss-fujimine-ou` | crowned Mount Fuji king; crown/snow/fists move; brace, twin-fist slam, recovery. | `generated-sources/shizuoka-boss-fujimine-ou.png` | `assets/sprites/animations/batch-05/shizuoka-boss-fujimine-ou-v1.png` |
| `shizuoka-midboss-yogan-gani` | volcanic crab; claws/lava/crown pulse; draw wide, double claw crush, recovery. | `generated-sources/shizuoka-midboss-yogan-gani.png` | `assets/sprites/animations/batch-05/shizuoka-midboss-yogan-gani-v1.png` |
| `shizuoka-wasabikko` | layered wasabi with leafy shoots; leaves/layers breathe; compress, roll strike, recovery. | `generated-sources/shizuoka-wasabikko.png` | `assets/sprites/animations/batch-05/shizuoka-wasabikko-v1.png` |
| `tochigi-gyozan` | flaming gyoza; crimp/flames move; squash, hot crescent slam, recovery. | `generated-sources/tochigi-gyozan.png` | `assets/sprites/animations/batch-05/tochigi-gyozan-v1.png` |
| `tokai-islandboss-nagaretae` | striped serpentine island boss; hat/eyes/tentacles sway; coils gather, ribbon lash, recovery. | `generated-sources/tokai-islandboss-nagaretae.png` | `assets/sprites/animations/batch-05/tokai-islandboss-nagaretae-v1.png` |
| `tokushima-lastboss-hachisuka-iemasa` | navy samurai with command baton; armor/baton settle; step, downward command action, recovery. | `generated-sources/tokushima-lastboss-hachisuka-iemasa.png` | `assets/sprites/animations/batch-05/tokushima-lastboss-hachisuka-iemasa-v1.png` |
| `tokushima-sudachi-musha` | headband sudachi warrior; leaves/tie tails move; crouch, citrus headbutt, recovery. | `generated-sources/tokushima-sudachi-musha.png` | `assets/sprites/animations/batch-05/tokushima-sudachi-musha-v1.png` |
| `tokyo-kirariko` | faceted blue glass mascot; lid/glints move; tilt, crystal shoulder bash, recovery. | `generated-sources/tokyo-kirariko.png` | `assets/sprites/animations/batch-05/tokyo-kirariko-v1.png` |
| `tokyo-tsukiyo-musasabi` | moon flying squirrel with wide membrane; ears/moon/membrane flex; fold, glide strike, recovery. | `generated-sources/tokyo-tsukiyo-musasabi.png` | `assets/sprites/animations/batch-05/tokyo-tsukiyo-musasabi-v1.png` |
| `tottori-midboss-dosshiri-dozo` | crowned stone guardian with red roof; roof/crown settle; brace, fortress ram, recovery. | `generated-sources/tottori-midboss-dosshiri-dozo.png` | `assets/sprites/animations/batch-05/tottori-midboss-dosshiri-dozo-v1.png` |
| `tottori-rakkyon` | two rakkyo bulb twins; alternate bobs; root crouch, twin kick/bump, recovery. | `generated-sources/tottori-rakkyon.png` | `assets/sprites/animations/batch-05/tottori-rakkyon-v1.png` |
| `toyama-lastboss-sassa-narimasa` | gold-helmet samurai lord; mantle/armor settle; step, armored forward strike, recovery. | `generated-sources/toyama-lastboss-sassa-narimasa.png` | `assets/sprites/animations/batch-05/toyama-lastboss-sassa-narimasa-v1.png` |
| `toyama-oo-masuzushi` | layered masu-sushi box; lid/leaves bob; compress, lunchbox slam, recovery. | `generated-sources/toyama-oo-masuzushi.png` | `assets/sprites/animations/batch-05/toyama-oo-masuzushi-v1.png` |
| `wakayama-kankantan` | charcoal kiln with flame crown; flame/arms move; compress, fiery action, recovery. | `generated-sources/wakayama-kankantan.png` | `assets/sprites/animations/batch-05/wakayama-kankantan-v1.png` |
| `wakayama-morimori-mikan` | giant mikan; leaves/body breathe; squash, rolling citrus ram, recovery. | `generated-sources/wakayama-morimori-mikan.png` | `assets/sprites/animations/batch-05/wakayama-morimori-mikan-v1.png` |
| `yamagata-double-cherry` | joined cherry twins; alternate faces/leaves; lean apart, double bump, recovery. | `generated-sources/yamagata-double-cherry.png` | `assets/sprites/animations/batch-05/yamagata-double-cherry-v1.png` |
| `yamagata-ryuo-koma` | shogi dragon knight with shield and spear; gear settles; crouch, spear thrust, recovery. | `generated-sources/yamagata-ryuo-koma.png` | `assets/sprites/animations/batch-05/yamagata-ryuo-koma-v1.png` |
| `yamaguchi-boss-akiyoshi-daiou` | mossy cave-stone king; crown/moss/arms move; draw back, two-arm ground pose, recovery. | `generated-sources/yamaguchi-boss-akiyoshi-daiou.png` | `assets/sprites/animations/batch-05/yamaguchi-boss-akiyoshi-daiou-v1.png` |
| `yamaguchi-mikan-daimyo` | mikan daimyo with fan; leaf/fan bob; lower stance, broad fan action, recovery. | `generated-sources/yamaguchi-mikan-daimyo.png` | `assets/sprites/animations/batch-05/yamaguchi-mikan-daimyo-v1.png` |
| `yamaguchi-pukufuku` | blue-white pufferfish; fins/body breathe; squash/inflate, round roll pose, recovery. | `generated-sources/yamaguchi-pukufuku.png` | `assets/sprites/animations/batch-05/yamaguchi-pukufuku-v1.png` |
| `yamanashi-houtoun` | green hoto noodle mascot; noodles/vegetables/arms move; lower, broad noodle action, recovery. | `generated-sources/yamanashi-houtoun.png` | `assets/sprites/animations/batch-05/yamanashi-houtoun-v1.png` |
| `yamanashi-suzurin` | square dark bell device; nubs/arms move; brace, sturdy body action, recovery. | `generated-sources/yamanashi-suzurin.png` | `assets/sprites/animations/batch-05/yamanashi-suzurin-v1.png` |

The built-in outputs were RGBA 2:1 images. Each was reduced to the required 512×256 runtime
sheet with ffmpeg's nearest-neighbor scaler (`scale=512:256:flags=neighbor`). The generated source
was preserved unchanged before normalization.
