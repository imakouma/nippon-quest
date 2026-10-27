# animation batch-02 production log

- Branch: `codex/animation-batch-02`
- Base: `f31628f32a008dfc92ecb2ed4a7934e6d9d9516b`
- Assignment source: `tasks/animation-batch-assignments.json` → `batch-02.ids`
- Scope: 110 assigned monsters
- Current counts: completed 110, failed 0, unstarted 0
- Generator: built-in imagegen only; no paid fallback, provider credential, or OmniRoute use

## First quality slice

The first three sheets were produced from the approved pixel and 3D references, saved with
their generated originals, resized with nearest-neighbor sampling, and registered only after
visual review. They contain real frame changes rather than whole-image translation/scaling:

- `aichi-arimatsu-zome`: blink, side-pad motion, squash, and body-check poses.
- `aichi-hatchon`: blink, barrel tilt, foot changes, and top-weight bounce.
- `aichi-miso-yagura`: blink, paddle arc, barrel lean, foot changes, and top-weight motion.

Exact prompts and generated originals are in
`docs/verification/animation-batch-02/`. No shared scene, catalog, rights ledger, or generated
manifest file is part of this batch.

## Integration notes

- No common-code change is currently required. The shared manifest aggregator loads these
  entries as-is.
- The dedicated E2E chooses the last configured skill because defensive first skills such as
  `sk-suna-kabe` and `sk-tsuchi-kabe` correctly do not trigger attack animation.

## Per-target status

- [x] `aichi-arimatsu-zome` — 完了
- [x] `aichi-hatchon` — 完了
- [x] `aichi-miso-yagura` — 完了
- [x] `akita-boss-namahage-ou` — 完了
- [x] `akita-kiritanpon` — 完了
- [x] `akita-oodama-hanabi` — 完了
- [x] `chiba-kousui-hime` — 完了
- [x] `chiba-naminori-gai` — 完了
- [x] `ehime-boss-ishizuchi-ou` — 完了
- [x] `ehime-komikan` — 完了
- [x] `ehime-soratobi-taoru` — 完了
- [x] `fukui-kamisukin` — 完了
- [x] `fukui-midboss-kasumi-maru` — 完了
- [x] `fukuoka-barikatan` — 完了
- [x] `fukuoka-lastboss-kuroda-kanbei` — 完了
- [x] `fukuoka-stroberion` — 完了
- [x] `fukushima-akabekon` — 完了
- [x] `fukushima-koboshi` — 完了
- [x] `fukushima-momorin` — 完了
- [x] `gifu-kakinoki-don` — 完了
- [x] `gifu-oribe-musha` — 完了
- [x] `gifu-washigamin` — 完了
- [x] `gunma-kyabe-yoroi` — 完了
- [x] `gunma-midboss-yumomi-daisho` — 完了
- [x] `hiroshima-kakigara-don` — 完了
- [x] `hiroshima-midboss-fude-daisho` — 完了
- [x] `hiroshima-teppan-double` — 完了
- [x] `hokkaido-homura-gitsune` — 完了
- [x] `hokkaido-jaga-goron` — 完了
- [x] `hokkaido-lastboss-clark` — 完了
- [x] `hokkaido-ryuhyo-tenshi` — 完了
- [x] `hyogo-kuromamen` — 完了
- [x] `hyogo-soroban-shogun` — 完了
- [x] `hyogo-tamanegin` — 完了
- [x] `ibaraki-hobiki-maru` — 完了
- [x] `ibaraki-natton` — 完了
- [x] `ishikawa-boss-yukitsuri-oomatsu` — 完了
- [x] `ishikawa-kaga-nurimaru` — 完了
- [x] `ishikawa-midboss-kiriko-taisho` — 完了
- [x] `kagawa-boss-oudon-ryu` — 完了
- [x] `kagawa-minoribu` — 完了
- [x] `kagawa-tsumuji-uchiwa` — 完了
- [x] `kagoshima-daikon-shogun` — 完了
- [x] `kagoshima-midboss-tsubo-musha` — 完了
- [x] `kagoshima-watari-zuru` — 完了
- [x] `kanagawa-karakuri-jo` — 完了
- [x] `kanagawa-pichirasu` — 完了
- [x] `kochi-aburikatsuo` — 完了
- [x] `kochi-kamiwashi` — 完了
- [x] `kochi-yuzupika` — 完了
- [x] `kumamoto-dai-karudera` — 完了
- [x] `kumamoto-lastboss-kato-kiyomasa` — 完了
- [x] `kumamoto-suikabuto` — 完了
- [x] `kyoto-chatsumin` — 完了
- [x] `kyoto-funayadokari` — 完了
- [x] `kyoto-midboss-kayabuki-monban` — 完了
- [x] `mie-gutsugutsu-don` — 完了
- [x] `mie-midboss-oosansho-ou` — 完了
- [x] `miyagi-kokeshina` — 完了
- [x] `miyagi-sasakama-bushi` — 生成・変換・目視確認済み
- [x] `miyagi-zundamaru` — 生成・変換・目視確認済み
- [x] `miyazaki-lastboss-komura-jutaro` — 生成・変換・目視確認済み
- [x] `miyazaki-nanban-ondori` — 生成・変換・目視確認済み
- [x] `nagano-midboss-karasu-jo` — 生成・変換・目視確認済み
- [x] `nagano-yukemuri-oyabun` — 生成・変換・目視確認済み
- [x] `nagasaki-fuwatera` — 生成・変換・目視確認済み
- [x] `nagasaki-mogi-tawawa` — 生成・変換・目視確認済み
- [x] `nara-chasenmaru` — 生成・変換・目視確認済み
- [x] `nara-midboss-hitome-senbon` — 生成・変換・目視確認済み
- [x] `niigata-akebono-toki` — 生成・変換・目視確認済み
- [x] `niigata-kitakaze-zake` — 生成・変換・目視確認済み
- [x] `niigata-shiobikin` — 生成・変換・目視確認済み
- [x] `oita-lastboss-fukuzawa-yukichi` — 生成・変換・目視確認済み
- [x] `oita-yubune-don` — 生成・変換・目視確認済み
- [x] `okayama-boss-kibi-no-onio` — 生成・変換・目視確認済み
- [x] `okayama-lastboss-ikeda-mitsumasa` — 生成・変換・目視確認済み
- [x] `okinawa-goya-musha` — 生成・変換・目視確認済み
- [x] `okinawa-ougon-pine` — 生成・変換・目視確認済み
- [x] `osaka-budomaru` — 生成・変換・目視確認済み
- [x] `osaka-lastboss-toyotomi-hideyoshi` — 生成・変換・目視確認済み
- [x] `saga-boss-akajishi-oh` — 生成・変換・目視確認済み
- [x] `saga-lastboss-nabeshima-naomasa` — 生成・変換・目視確認済み
- [x] `saga-yumonbou` — 生成・変換・目視確認済み
- [x] `saitama-lastboss-shibusawa-eiichi` — 生成・変換・目視確認済み
- [x] `shiga-asanunon` — 生成・変換・目視確認済み
- [x] `shiga-jofu-hime` — 生成・変換・目視確認済み
- [x] `shiga-tsuburin` — 生成・変換・目視確認済み
- [x] `shimane-midboss-shirogane-mogura` — 生成・変換・目視確認済み
- [x] `shimane-warigo-tower` — 生成・変換・目視確認済み
- [x] `shizuoka-chatsumin` — 生成・変換・目視確認済み
- [x] `shizuoka-tsuun-wasabi` — 生成・変換・目視確認済み
- [x] `tochigi-boss-kegon-ryuo` — 生成・変換・目視確認済み
- [x] `tochigi-ichigoro` — 生成・変換・目視確認済み
- [x] `tokushima-hamagamen` — 生成・変換・目視確認済み
- [x] `tokushima-oo-kintoki` — 生成・変換・目視確認済み
- [x] `tokyo-boss-mihara-no-nushi` — 生成・変換・目視確認済み
- [x] `tokyo-midboss-denpa-oh` — 生成・変換・目視確認済み
- [x] `tottori-beniyoroigani` — 生成・変換・目視確認済み
- [x] `tottori-nijisseikishi` — 生成・変換・目視確認済み
- [x] `toyama-boss-tateyama-ou` — 生成・変換・目視確認済み
- [x] `toyama-masuzushin` — 生成・変換・目視確認済み
- [x] `toyama-tulipon` — 生成・変換・目視確認済み
- [x] `wakayama-lastboss-tokugawa-yoshimune` — 生成・変換・目視確認済み
- [x] `wakayama-shibukin` — 生成・変換・目視確認済み
- [x] `yamagata-jumbo-imoni` — 生成・変換・目視確認済み
- [x] `yamagata-shogi-commander` — 生成・変換・目視確認済み
- [x] `yamaguchi-kanmon-fuku` — 生成・変換・目視確認済み
- [x] `yamaguchi-natsumikan-bushi` — 生成・変換・目視確認済み
- [x] `yamanashi-boss-suisho-ryu` — 生成・変換・目視確認済み
- [x] `yamanashi-midboss-sakasa-fujin` — 生成・変換・目視確認済み

## Verification log

- Unit RED: dedicated manifest test failed against the initial empty manifest as expected.
- Unit GREEN: dedicated and shared manifest tests passed (3 tests).
- Browser: dedicated battle flow passed for the first three assigned monsters at desktop and
  mobile viewports, covering idle, normal attack, skill attack, idle return, and KO; final
  preview is served on local port 4178 only.
- Full gates: `pnpm lint`, `pnpm check:architecture`, `pnpm test` (167 files / 1703
  tests), `pnpm validate:content`, and `pnpm build` passed after all 110 sheets were
  registered.
