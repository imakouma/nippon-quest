# animation batch-02 production log

- Branch: `codex/animation-batch-02`
- Base: `f31628f32a008dfc92ecb2ed4a7934e6d9d9516b`
- Assignment source: `tasks/animation-batch-assignments.json` → `batch-02.ids`
- Scope: 110 assigned monsters
- Current counts: completed 23, failed 0, unstarted 87
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
- [ ] `gunma-midboss-yumomi-daisho` — 未着手
- [ ] `hiroshima-kakigara-don` — 未着手
- [ ] `hiroshima-midboss-fude-daisho` — 未着手
- [ ] `hiroshima-teppan-double` — 未着手
- [ ] `hokkaido-homura-gitsune` — 未着手
- [ ] `hokkaido-jaga-goron` — 未着手
- [ ] `hokkaido-lastboss-clark` — 未着手
- [ ] `hokkaido-ryuhyo-tenshi` — 未着手
- [ ] `hyogo-kuromamen` — 未着手
- [ ] `hyogo-soroban-shogun` — 未着手
- [ ] `hyogo-tamanegin` — 未着手
- [ ] `ibaraki-hobiki-maru` — 未着手
- [ ] `ibaraki-natton` — 未着手
- [ ] `ishikawa-boss-yukitsuri-oomatsu` — 未着手
- [ ] `ishikawa-kaga-nurimaru` — 未着手
- [ ] `ishikawa-midboss-kiriko-taisho` — 未着手
- [ ] `kagawa-boss-oudon-ryu` — 未着手
- [ ] `kagawa-minoribu` — 未着手
- [ ] `kagawa-tsumuji-uchiwa` — 未着手
- [ ] `kagoshima-daikon-shogun` — 未着手
- [ ] `kagoshima-midboss-tsubo-musha` — 未着手
- [ ] `kagoshima-watari-zuru` — 未着手
- [ ] `kanagawa-karakuri-jo` — 未着手
- [ ] `kanagawa-pichirasu` — 未着手
- [ ] `kochi-aburikatsuo` — 未着手
- [ ] `kochi-kamiwashi` — 未着手
- [ ] `kochi-yuzupika` — 未着手
- [ ] `kumamoto-dai-karudera` — 未着手
- [ ] `kumamoto-lastboss-kato-kiyomasa` — 未着手
- [ ] `kumamoto-suikabuto` — 未着手
- [ ] `kyoto-chatsumin` — 未着手
- [ ] `kyoto-funayadokari` — 未着手
- [ ] `kyoto-midboss-kayabuki-monban` — 未着手
- [ ] `mie-gutsugutsu-don` — 未着手
- [ ] `mie-midboss-oosansho-ou` — 未着手
- [ ] `miyagi-kokeshina` — 未着手
- [ ] `miyagi-sasakama-bushi` — 未着手
- [ ] `miyagi-zundamaru` — 未着手
- [ ] `miyazaki-lastboss-komura-jutaro` — 未着手
- [ ] `miyazaki-nanban-ondori` — 未着手
- [ ] `nagano-midboss-karasu-jo` — 未着手
- [ ] `nagano-yukemuri-oyabun` — 未着手
- [ ] `nagasaki-fuwatera` — 未着手
- [ ] `nagasaki-mogi-tawawa` — 未着手
- [ ] `nara-chasenmaru` — 未着手
- [ ] `nara-midboss-hitome-senbon` — 未着手
- [ ] `niigata-akebono-toki` — 未着手
- [ ] `niigata-kitakaze-zake` — 未着手
- [ ] `niigata-shiobikin` — 未着手
- [ ] `oita-lastboss-fukuzawa-yukichi` — 未着手
- [ ] `oita-yubune-don` — 未着手
- [ ] `okayama-boss-kibi-no-onio` — 未着手
- [ ] `okayama-lastboss-ikeda-mitsumasa` — 未着手
- [ ] `okinawa-goya-musha` — 未着手
- [ ] `okinawa-ougon-pine` — 未着手
- [ ] `osaka-budomaru` — 未着手
- [ ] `osaka-lastboss-toyotomi-hideyoshi` — 未着手
- [ ] `saga-boss-akajishi-oh` — 未着手
- [ ] `saga-lastboss-nabeshima-naomasa` — 未着手
- [ ] `saga-yumonbou` — 未着手
- [ ] `saitama-lastboss-shibusawa-eiichi` — 未着手
- [ ] `shiga-asanunon` — 未着手
- [ ] `shiga-jofu-hime` — 未着手
- [ ] `shiga-tsuburin` — 未着手
- [ ] `shimane-midboss-shirogane-mogura` — 未着手
- [ ] `shimane-warigo-tower` — 未着手
- [ ] `shizuoka-chatsumin` — 未着手
- [ ] `shizuoka-tsuun-wasabi` — 未着手
- [ ] `tochigi-boss-kegon-ryuo` — 未着手
- [ ] `tochigi-ichigoro` — 未着手
- [ ] `tokushima-hamagamen` — 未着手
- [ ] `tokushima-oo-kintoki` — 未着手
- [ ] `tokyo-boss-mihara-no-nushi` — 未着手
- [ ] `tokyo-midboss-denpa-oh` — 未着手
- [ ] `tottori-beniyoroigani` — 未着手
- [ ] `tottori-nijisseikishi` — 未着手
- [ ] `toyama-boss-tateyama-ou` — 未着手
- [ ] `toyama-masuzushin` — 未着手
- [ ] `toyama-tulipon` — 未着手
- [ ] `wakayama-lastboss-tokugawa-yoshimune` — 未着手
- [ ] `wakayama-shibukin` — 未着手
- [ ] `yamagata-jumbo-imoni` — 未着手
- [ ] `yamagata-shogi-commander` — 未着手
- [ ] `yamaguchi-kanmon-fuku` — 未着手
- [ ] `yamaguchi-natsumikan-bushi` — 未着手
- [ ] `yamanashi-boss-suisho-ryu` — 未着手
- [ ] `yamanashi-midboss-sakasa-fujin` — 未着手

## Verification log

- Unit RED: dedicated manifest test failed against the initial empty manifest as expected.
- Unit GREEN: dedicated and shared manifest tests passed (3 tests).
- Browser: in progress; run on local port 4178 only.
- Full gates: pending after the assigned batch is complete or generation is blocked.
