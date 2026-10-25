# Encounter Policy Engine Tasks

## Task 1: Contract-first tests

**Acceptance criteria:**

- [x] 固定 seed、非対象タイル、遷移直後、cooldown、確率 0/1、pity、weight、地域 table を記述する。
- [x] 実装前に focused test が失敗する。

**Verification:** `pnpm test -- tests/unit/encounterPolicy.test.ts`

**Dependencies:** None

**Files:** `tests/unit/encounterPolicy.test.ts`

## Task 2: Pure policy and adapter

**Acceptance criteria:**

- [x] Phaser 非依存の state machine を追加する。
- [x] content table 選択・適格性・候補化を分離する。
- [x] `src/core/rng.ts` の `Rng` だけを使用する。

**Verification:** `pnpm test -- tests/unit/encounterPolicy.test.ts`

**Dependencies:** Task 1

**Files:** `src/core/encounter/policy.ts`, `src/core/encounter/contentAdapter.ts`, `src/core/battle/setup.ts`

## Task 3: Overworld integration

**Acceptance criteria:**

- [x] inline modulo / chance / table weight 判定を除去する。
- [x] map reset で transition inhibit、encounter decision で cooldown が開始する。
- [x] Scene は decision だけを見て Battle を起動する。

**Verification:** focused test、`pnpm check:architecture`、`pnpm build`

**Dependencies:** Task 2

**Files:** `src/scenes/Overworld.ts`

## Task 4: Review and handoff

**Acceptance criteria:**

- [x] Graphify code-only graph を更新する。
- [x] 五軸レビューと mutation check を完了する。
- [x] 全必須検査、必要 E2E、4175 preview を確認する。
- [x] 専用ブランチへコミットする。

**Verification:** `pnpm lint`, `pnpm check:architecture`, `pnpm test`, `pnpm validate:content`, `pnpm build`

**Dependencies:** Task 3

**Files:** task docs and implementation diff
