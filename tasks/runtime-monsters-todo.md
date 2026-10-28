# Runtime monsters checklist

Specification: [`SPEC-runtime-monsters.md`](../SPEC-runtime-monsters.md)

Plan: [`runtime-monsters-plan.md`](runtime-monsters-plan.md)

## Phase 1: Test-first production contract

- [x] Add the failing exact-89 production coverage test.
- [x] Add failing production-ledger provenance checks.
- [x] Add failing PNG/per-cell/motion checks.
- [x] Record the expected RED result.

## Phase 2: Production tooling

- [x] Implement and test the production-ledger contract.
- [x] Implement and test deterministic sheet normalization.
- [x] Implement and test image-contract auditing.
- [x] Implement and test contact-sheet generation.
- [x] Confirm existing 12 runtime sheets satisfy the reusable image rules (with documented legacy boundary warnings for Magurodo and Tsugaru Nurin).
- [x] Run `pnpm check:fast`.

## Wave 1: Aomori foundations (10)

- [x] `aomori-boss-tsugaru-no-nushi`
- [x] `aomori-buna-taiju`
- [x] `aomori-dogu-jin`
- [x] `aomori-hachiro-ryu`
- [x] `aomori-hanaikada`
- [x] `aomori-himemasu-lord`
- [x] `aomori-itakodori`
- [x] `aomori-kaza-mimizuku`
- [x] `aomori-kuro-magurodo`
- [x] `aomori-lastboss-tsugaru-tamenobu`

## Wave 2: Aomori completion (10)

- [x] `aomori-midboss-nebuta-taisho`
- [x] `aomori-nabe-shogun`
- [x] `aomori-nebuta-musha`
- [x] `aomori-nebuta-taisho`
- [x] `aomori-nuri-kagayaki`
- [x] `aomori-oirase-kokejin`
- [x] `aomori-oka-musha`
- [x] `aomori-ringo-knight`
- [x] `aomori-umi-nyan`
- [x] `aomori-umineko-taicho`

## Wave 3: Iwate part 1 (10)

- [x] `iwate-boss-konjiki-no-tora`
- [x] `iwate-dragon-blue`
- [x] `iwate-hayate-kamoshika`
- [x] `iwate-iwa-kamoshika`
- [x] `iwate-lastboss-minamoto-yoshitsune`
- [x] `iwate-midboss-tetsubin-game`
- [x] `iwate-okawari-bat`
- [x] `iwate-oo-kappa`
- [x] `iwate-ryusen-uo`
- [x] `iwate-tono-kappa`

## Wave 4: Iwate and nationwide part 1 (10)

- [x] `iwate-wakame-ryu`
- [x] `iwate-wakamekko`
- [x] `iwate-wankosobat`
- [x] `tohoku-boss-rokufuyu`
- [x] `mie-donabee`
- [x] `mie-lastboss-todo-takatora`
- [x] `miyagi-kokeshi-hime`
- [x] `miyagi-oohakucho`
- [x] `miyagi-zundagon`
- [x] `miyazaki-kanjuku-mango`

## Wave 5: Nationwide part 2 (10)

- [x] `miyazaki-misaki-tenba`
- [x] `nagano-lastboss-sanada-yukimura`
- [x] `nagano-wakasagin`
- [x] `nagasaki-castel-knight`
- [x] `nagasaki-midboss-megane-golem`
- [x] `nara-boss-shika-daio`
- [x] `nara-matcha-arashi`
- [x] `nara-uzumaki-somen`
- [x] `niigata-inahon`
- [x] `niigata-minori-maru`

## Wave 6: Nationwide part 3 (10)

- [x] `oita-kabosuppa`
- [x] `oita-shiitaken`
- [x] `okayama-bizentsubon`
- [x] `okayama-hakuto-hime`
- [x] `okinawa-garasu-kurage`
- [x] `okinawa-niji-kurage`
- [x] `osaka-boss-takoishi-daio`
- [x] `osaka-juwanasu-zamurai`
- [x] `osaka-takoyaki-sencho`
- [x] `saga-kinran-tsubo`

## Wave 7: Nationwide part 4 (10)

- [x] `saga-yumon-douji`
- [x] `saitama-haniwaltz`
- [x] `saitama-parissen`
- [x] `shiga-ibukikko`
- [x] `shiga-nigoron`
- [x] `shimane-lastboss-koizumi-yakumo`
- [x] `shimane-tenshu-chidori`
- [x] `shizuoka-chabashira`
- [x] `shizuoka-soradako`
- [x] `tochigi-bellmoo`

## Wave 8: Nationwide part 5 (10)

- [x] `tochigi-ichigo-ouji`
- [x] `tokushima-boss-awaodori-ou`
- [x] `tokushima-midboss-uzushion`
- [x] `tokushima-sudachibi`
- [x] `tokyo-lastboss-katsushika-hokusai`
- [x] `tottori-beniganin`
- [x] `tottori-nashikoron`
- [x] `tottori-sumiewashi`
- [x] `toyama-mankai-churi`
- [x] `toyama-pikka-ika`

## Wave 9: Nationwide completion (9)

- [x] `wakayama-koromikan`
- [x] `wakayama-ootakimaru`
- [x] `yamagata-imoni-nabe`
- [x] `yamagata-sakuranboy`
- [x] `yamaguchi-hashiwatari`
- [x] `yamaguchi-nanabaken`
- [x] `yamanashi-atsuatsu-houtou`
- [x] `yamanashi-lastboss-takeda-shingen`
- [x] `yamanashi-tawawa-budou`

## Per-wave checkpoint

- [x] Source hashes still match (Waves 1-9).
- [x] Accepted sources pass full-size and isolated-cell visual review (Waves 1-9).
- [x] Runtime PNG/image-contract audit passes (Waves 1-9).
- [x] Production ledger and manifest contain only accepted IDs (Waves 1-9).
- [x] Unit and related tests pass (Waves 1-9).
- [x] Desktop and landscape-mobile battle playback pass (Waves 1-9).
- [x] `pnpm check:fast` and `git diff --check` pass (Waves 1-9).
- [x] Staged diff is reviewed and committed atomically (Waves 1-9).

Repeat this checkpoint for every wave and record evidence in the production ledger.

## Final reconciliation

- [x] Runtime manifest has exactly 101 unique batch entries.
- [x] Coverage report has zero `reference-ready` runtime monsters.
- [x] Ringoron, people, and visual-only evolutions retain approved classifications.
- [x] Production ledger covers all 89 IDs with input/output hashes and review state.
- [x] All-89 contact sheet and representative browser screenshots exist.
- [x] `pnpm gen:manifest` completes and generated diffs are reviewed.
- [x] Module E2E passes at both viewports.
- [x] `pnpm lint` passes.
- [x] `pnpm check:architecture` passes.
- [x] `pnpm test` passes.
- [x] `pnpm validate:content` passes.
- [x] `pnpm build` passes.
- [x] Graphify is updated in code-only mode.
- [x] Five-axis code review has no unresolved required findings.
- [ ] User-facing preview opens a newly completed monster battle.
- [ ] Module is committed and ready for integration.
