# Remaining character animations checklist

Specification: [`SPEC-remaining-runtime-monsters.md`](../SPEC-remaining-runtime-monsters.md)

Plan: [`remaining-character-animations-plan.md`](remaining-character-animations-plan.md)

## Phase 1: Test-first contract

- [x] Add the failing exact-53 target and batch-06 membership contract.
- [x] Add the failing final 542-of-542 unique runtime coverage contract.
- [x] Preserve existing assignment, PNG signature, and Ringoron assertions.
- [x] Record the intended RED failure.

## Phase 2: Minimal production support

- [x] Export transparent `MONSTER_DESIGNS` references for exactly the frozen 53 IDs.
- [x] Make existing production commands batch/path-selectable only where required.
- [x] Add focused option/path regression tests before implementation.
- [x] Initialize the hash-linked batch-06 production ledger and empty manifest.
- [x] Confirm batch-01 regression tests and `pnpm check:fast` pass.

## Wave 1: Koshinetsu, Miyagi, Miyazaki, Nagano (9)

- [x] `koshinetsu-boss`
- [x] `miyagi-lastboss-date-masamune`
- [x] `miyagi-sasakama-uo`
- [x] `miyazaki-boss-takachiho-no-nushi`
- [x] `miyazaki-mangocchi`
- [x] `miyazaki-tarutaru-kokko`
- [x] `nagano-oomori-soba`
- [x] `nagano-yukemuri-zaru`
- [x] `nagasaki-kurawan-nushi`

## Wave 2: Nagasaki through Oita (9)

- [x] `nagasaki-mogikko`
- [x] `nara-happazushi`
- [x] `nara-somen-tsururi`
- [x] `niigata-boss-shinanogawa-no-nushi`
- [x] `niigata-kotoki`
- [x] `oita-boss-yukemuryu`
- [x] `oita-midboss-yabakeiwa`
- [x] `oita-yukemurin`
- [x] `okayama-denim-bushi`

## Wave 3: Okayama through Saitama (9)

- [x] `okayama-midboss-mouretsu-jersey`
- [x] `okinawa-goyamaru`
- [x] `okinawa-painapon`
- [x] `osaka-fusanari-don`
- [x] `osaka-midboss-abare-danjiri`
- [x] `saga-chabashira`
- [x] `saga-midboss-toumeika`
- [x] `saitama-boss-yomatsuri-daio`
- [x] `saitama-midboss-gon-yagura`

## Wave 4: Shiga through Shizuoka (9)

- [x] `shiga-boss-dainamazu`
- [x] `shiga-lastboss-ii-naosuke`
- [x] `shikoku-islandboss-yotsu-no-tenbin`
- [x] `shimane-oohi-rosoku`
- [x] `shimane-warigon`
- [x] `shizuoka-kazekiri-dako`
- [x] `shizuoka-unagi-nobori`
- [x] `tochigi-go-bellmoo`
- [x] `tochigi-lastboss-nasu-no-yoichi`

## Wave 5: Tokushima through Toyama (9)

- [x] `tokushima-kazura-musasabi`
- [x] `tokushima-oogamedon`
- [x] `tokyo-daikon-zamurai`
- [x] `tokyo-musasabyun`
- [x] `tottori-boss-sakyu-majin`
- [x] `tottori-perawashi`
- [x] `toyama-fubuki-okojo`
- [x] `toyama-midboss-gabujishi`
- [x] `wakayama-bincho-homura`

## Wave 6: Wakayama through Yamanashi (8)

- [x] `wakayama-mamori-toudai`
- [x] `wakayama-toudain`
- [x] `yamagata-lastboss-matsuo-basho`
- [x] `yamagata-yukemurin`
- [x] `yamaguchi-lastboss-yoshida-shoin`
- [x] `yamaguchi-noborigaman`
- [x] `yamanashi-budoon`
- [x] `yamanashi-momorin`

## Per-wave checkpoint

- [x] References and prompt records match the wave IDs.
- [x] Accepted sources pass full-size and isolated-cell visual review.
- [x] Runtime PNGs pass size, RGBA, alpha, occupancy, margin, and meaningful-motion checks.
- [x] Ledger and manifest contain only accepted IDs with matching hashes.
- [x] Focused unit/related tests pass.
- [x] Desktop and landscape-mobile battle playback pass.
- [x] `pnpm check:animation-production`, `pnpm check:fast`, and `git diff --check` pass.
- [x] The final staged diff is reviewed for an atomic implementation commit.

Repeat the checkpoint for every wave and record its evidence in the ledger.

## Final reconciliation

- [x] `batch-06` contains exactly the frozen 53 unique IDs.
- [x] All 542 runtime monsters resolve to exactly one animation spec.
- [x] The unanimated runtime-monster set is empty.
- [x] All-53 contact sheet and representative browser screenshots exist and are reviewed.
- [x] Every new ID passes bounded E2E loading, idle, attack, recovery, KO, and visible-bound checks at both viewports.
- [x] `pnpm gen:manifest` completes and generated diffs are reviewed.
- [x] `pnpm lint` passes.
- [x] `pnpm check:architecture` passes.
- [x] `pnpm test` passes.
- [x] `pnpm validate:content` passes.
- [x] `pnpm build` passes.
- [x] Five-axis code review has no unresolved required findings.
- [x] Graphify is updated only if source/test dependency edges changed.
- [x] A newly animated battle opens in a fresh worktree preview.
- [x] The implementation commit and final handoff metadata are ready for the integration owner.
