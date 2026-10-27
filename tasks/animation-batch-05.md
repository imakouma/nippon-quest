# Animation batch-05

## Scope and status

- Branch: `codex/animation-batch-05`
- Assignment source: `tasks/animation-batch-assignments.json` (`batch-05.ids`)
- Total: 110
- Generated and normalized: 3
- Manifest registered: 3
- Browser verified: 0
- Failed: 0
- Not started: 107

## Completed production assets

- [x] `aichi-denkou-giku` — source inspected; generated; 512×256 RGBA nearest-neighbor runtime sheet; visually inspected; manifest registered
- [x] `aichi-midboss-tokoname-neko` — source inspected; generated; 512×256 RGBA nearest-neighbor runtime sheet; visually inspected; manifest registered
- [x] `akita-akitainu` — source inspected; generated; 512×256 RGBA nearest-neighbor runtime sheet; visually inspected; manifest registered

## Remaining assignment

The following assigned ids are not complete and must not be reported as complete:

`akita-kiritanpo-nabe`, `akita-midboss-kanto-man`, `chiba-horipii`,
`chiba-midboss-inubouken`, `chugoku-islandboss-itsutsu-no-kataribe`,
`ehime-jakotengyo`, `ehime-mofutaoru`, `fukui-kami-fubuki`, `fukui-meganen`,
`fukui-yuki-no-suisen`, `fukuoka-kaedama-oh`, `fukuoka-strobaby`,
`fukushima-akabeko-don`, `fukushima-chijiremen`,
`fukushima-midboss-goshiki-slime`, `gifu-fuyugakid`,
`gifu-midboss-karankoron`, `gifu-ushou-dori`, `gunma-kinuhane-hime`,
`gunma-mayumaru`, `hiroshima-iwabashigame`,
`hiroshima-lastboss-mouri-motonari`, `hiroshima-taiyo-lemon`,
`hokkaido-dodeka-melon`, `hokkaido-jaga-dodon`, `hokkaido-kurioneru`,
`hokkaido-murasaki-kazedori`, `hyogo-kuromame-musha`, `hyogo-ootamanegi`,
`hyogo-takotsubon`, `ibaraki-hasu-kabuto`,
`ibaraki-midboss-harutsuge-dori`, `ibaraki-warazuto-musha`,
`ishikawa-hamashion`, `ishikawa-lastboss-maeda-toshiie`, `kagawa-aogin`,
`kagawa-midboss-ritsurin-no-nushi`, `kagawa-sorautsushi`,
`kagoshima-chappa`, `kagoshima-maru-daikon`, `kagoshima-shincha-dou`,
`kanagawa-iwashigun`, `kanagawa-midboss-kurotamagon`,
`kinki-islandboss-rokkagi-no-ori`, `kochi-kagayaki-yuzu`,
`kochi-oowashigami`, `kumamoto-boss-mushagaeshi`, `kumamoto-karuderan`,
`kumamoto-shimadama`, `kyoto-chasenshi`, `kyoto-funaya-don`,
`kyoto-lastboss-murasaki-shikibu`, `mie-boss-iseebi-taisho`,
`mie-kuwanaguri`, `miyagi-boss-mikazuki-shogun`, `miyagi-oo-sumibitan`,
`miyagi-tanyakki`, `miyazaki-hyuganattsu`, `miyazaki-misaki-pony`,
`nagano-koori-wakasagi`, `nagano-retasuke`, `nagasaki-boss-unzen-ryu`,
`nagasaki-lastboss-siebold`, `nagasaki-yadoshima`,
`nara-lastboss-shotoku-taishi`, `nara-sumiryu`, `niigata-hisui-koro`,
`niigata-midboss-sanjaku-don`, `oita-kabosu-daisho`, `oita-sekiajiro`,
`okayama-bizen-ootsubo`, `okayama-fukuromomo`, `okinawa-boss-dairyuchu`,
`okinawa-midboss-eisa-daiko`, `okinawa-yanbaru-totto`, `osaka-juwanasu`,
`osaka-sakusaku-momiji`, `saga-higata-taisho`, `saga-sometsubon`,
`saitama-haniwa-musha`, `saitama-negi-lancer`, `shiga-ibuki-no-oyama`,
`shiga-naminori-tsuburi`, `shimane-chidorin`, `shimane-shijimin`,
`shizuoka-boss-fujimine-ou`, `shizuoka-midboss-yogan-gani`,
`shizuoka-wasabikko`, `tochigi-gyozan`, `tokai-islandboss-nagaretae`,
`tokushima-lastboss-hachisuka-iemasa`, `tokushima-sudachi-musha`,
`tokyo-kirariko`, `tokyo-tsukiyo-musasabi`,
`tottori-midboss-dosshiri-dozo`, `tottori-rakkyon`,
`toyama-lastboss-sassa-narimasa`, `toyama-oo-masuzushi`,
`wakayama-kankantan`, `wakayama-morimori-mikan`, `yamagata-double-cherry`,
`yamagata-ryuo-koma`, `yamaguchi-boss-akiyoshi-daiou`,
`yamaguchi-mikan-daimyo`, `yamaguchi-pukufuku`, `yamanashi-houtoun`,
`yamanashi-suzurin`.

## Process and verification log

- 2026-10-27: worktree was clean at detached `db5de586`; created this branch from approved base `f31628f`.
- 2026-10-27: cherry-picked parent regression update `889e5bbb` as `f3b271aa`.
- 2026-10-27: inspected pixel and 3D reference images for the first three assigned ids.
- 2026-10-27: used built-in imagegen only; no fal, paid external API, provider credentials, or OmniRoute.
- 2026-10-27: preserved generated originals under `docs/verification/animation-batch-05/generated-sources/` and normalized runtime sheets with ffmpeg nearest-neighbor scaling.
- 2026-10-27: RED confirmed: the dedicated unit failed while the manifest was empty.
- 2026-10-27: GREEN confirmed: dedicated and shared manifest unit tests passed (4/4).

## Integration notes

- Common battle, loader, catalogs, and rights ledger were not edited.
- The common runtime automatically aggregates this manifest.
- Only assets that pass visual and game-runtime verification are eligible for this manifest.
