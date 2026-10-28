# Runtime monsters checklist

Specification: [`SPEC-runtime-monsters.md`](../SPEC-runtime-monsters.md)

Plan: [`runtime-monsters-plan.md`](runtime-monsters-plan.md)

## Phase 1: Test-first production contract

- [ ] Add the failing exact-89 production coverage test.
- [ ] Add failing production-ledger provenance checks.
- [ ] Add failing PNG/per-cell/motion checks.
- [ ] Record the expected RED result.

## Phase 2: Production tooling

- [ ] Implement and test the production-ledger contract.
- [ ] Implement and test deterministic sheet normalization.
- [ ] Implement and test image-contract auditing.
- [ ] Implement and test contact-sheet generation.
- [ ] Confirm existing 12 runtime sheets satisfy the reusable image rules.
- [ ] Run `pnpm check:fast`.

## Wave 1: Aomori foundations (10)

- [ ] `aomori-boss-tsugaru-no-nushi`
- [ ] `aomori-buna-taiju`
- [ ] `aomori-dogu-jin`
- [ ] `aomori-hachiro-ryu`
- [ ] `aomori-hanaikada`
- [ ] `aomori-himemasu-lord`
- [ ] `aomori-itakodori`
- [ ] `aomori-kaza-mimizuku`
- [ ] `aomori-kuro-magurodo`
- [ ] `aomori-lastboss-tsugaru-tamenobu`

## Wave 2: Aomori completion (10)

- [ ] `aomori-midboss-nebuta-taisho`
- [ ] `aomori-nabe-shogun`
- [ ] `aomori-nebuta-musha`
- [ ] `aomori-nebuta-taisho`
- [ ] `aomori-nuri-kagayaki`
- [ ] `aomori-oirase-kokejin`
- [ ] `aomori-oka-musha`
- [ ] `aomori-ringo-knight`
- [ ] `aomori-umi-nyan`
- [ ] `aomori-umineko-taicho`

## Wave 3: Iwate part 1 (10)

- [ ] `iwate-boss-konjiki-no-tora`
- [ ] `iwate-dragon-blue`
- [ ] `iwate-hayate-kamoshika`
- [ ] `iwate-iwa-kamoshika`
- [ ] `iwate-lastboss-minamoto-yoshitsune`
- [ ] `iwate-midboss-tetsubin-game`
- [ ] `iwate-okawari-bat`
- [ ] `iwate-oo-kappa`
- [ ] `iwate-ryusen-uo`
- [ ] `iwate-tono-kappa`

## Wave 4: Iwate and nationwide part 1 (10)

- [ ] `iwate-wakame-ryu`
- [ ] `iwate-wakamekko`
- [ ] `iwate-wankosobat`
- [ ] `tohoku-boss-rokufuyu`
- [ ] `mie-donabee`
- [ ] `mie-lastboss-todo-takatora`
- [ ] `miyagi-kokeshi-hime`
- [ ] `miyagi-oohakucho`
- [ ] `miyagi-zundagon`
- [ ] `miyazaki-kanjuku-mango`

## Wave 5: Nationwide part 2 (10)

- [ ] `miyazaki-misaki-tenba`
- [ ] `nagano-lastboss-sanada-yukimura`
- [ ] `nagano-wakasagin`
- [ ] `nagasaki-castel-knight`
- [ ] `nagasaki-midboss-megane-golem`
- [ ] `nara-boss-shika-daio`
- [ ] `nara-matcha-arashi`
- [ ] `nara-uzumaki-somen`
- [ ] `niigata-inahon`
- [ ] `niigata-minori-maru`

## Wave 6: Nationwide part 3 (10)

- [ ] `oita-kabosuppa`
- [ ] `oita-shiitaken`
- [ ] `okayama-bizentsubon`
- [ ] `okayama-hakuto-hime`
- [ ] `okinawa-garasu-kurage`
- [ ] `okinawa-niji-kurage`
- [ ] `osaka-boss-takoishi-daio`
- [ ] `osaka-juwanasu-zamurai`
- [ ] `osaka-takoyaki-sencho`
- [ ] `saga-kinran-tsubo`

## Wave 7: Nationwide part 4 (10)

- [ ] `saga-yumon-douji`
- [ ] `saitama-haniwaltz`
- [ ] `saitama-parissen`
- [ ] `shiga-ibukikko`
- [ ] `shiga-nigoron`
- [ ] `shimane-lastboss-koizumi-yakumo`
- [ ] `shimane-tenshu-chidori`
- [ ] `shizuoka-chabashira`
- [ ] `shizuoka-soradako`
- [ ] `tochigi-bellmoo`

## Wave 8: Nationwide part 5 (10)

- [ ] `tochigi-ichigo-ouji`
- [ ] `tokushima-boss-awaodori-ou`
- [ ] `tokushima-midboss-uzushion`
- [ ] `tokushima-sudachibi`
- [ ] `tokyo-lastboss-katsushika-hokusai`
- [ ] `tottori-beniganin`
- [ ] `tottori-nashikoron`
- [ ] `tottori-sumiewashi`
- [ ] `toyama-mankai-churi`
- [ ] `toyama-pikka-ika`

## Wave 9: Nationwide completion (9)

- [ ] `wakayama-koromikan`
- [ ] `wakayama-ootakimaru`
- [ ] `yamagata-imoni-nabe`
- [ ] `yamagata-sakuranboy`
- [ ] `yamaguchi-hashiwatari`
- [ ] `yamaguchi-nanabaken`
- [ ] `yamanashi-atsuatsu-houtou`
- [ ] `yamanashi-lastboss-takeda-shingen`
- [ ] `yamanashi-tawawa-budou`

## Per-wave checkpoint

- [ ] Source hashes still match.
- [ ] Accepted sources pass full-size and isolated-cell visual review.
- [ ] Runtime PNG/image-contract audit passes.
- [ ] Production ledger and manifest contain only accepted IDs.
- [ ] Unit and related tests pass.
- [ ] Desktop and landscape-mobile battle playback pass.
- [ ] `pnpm check:fast` and `git diff --check` pass.
- [ ] Staged diff is reviewed and committed atomically.

Repeat this checkpoint for every wave and record evidence in the production ledger.

## Final reconciliation

- [ ] Runtime manifest has exactly 101 unique batch entries.
- [ ] Coverage report has zero `reference-ready` runtime monsters.
- [ ] Ringoron, people, and visual-only evolutions retain approved classifications.
- [ ] Production ledger covers all 89 IDs with input/output hashes and review state.
- [ ] All-89 contact sheet and representative browser screenshots exist.
- [ ] `pnpm gen:manifest` completes and generated diffs are reviewed.
- [ ] Module E2E passes at both viewports.
- [ ] `pnpm lint` passes.
- [ ] `pnpm check:architecture` passes.
- [ ] `pnpm test` passes.
- [ ] `pnpm validate:content` passes.
- [ ] `pnpm build` passes.
- [ ] Graphify is updated in code-only mode.
- [ ] Five-axis code review has no unresolved required findings.
- [ ] User-facing preview opens a newly completed monster battle.
- [ ] Module is committed and ready for integration.
