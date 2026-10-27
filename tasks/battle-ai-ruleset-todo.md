# Battle AI Ruleset — Task List

Source: `tasks/battle-ai-ruleset-spec.md`

Plan: `tasks/battle-ai-ruleset-plan.md`

## Phase 1: Pure enemy policy

### Task 1: 現行 AI と乱数消費の回帰契約

**Description:** 現行 60/30/10、HP 30% 回復優先、使用不能 fallback、Rng 呼び出し順を純粋 policy の期待値として先に固定する。

**Acceptance criteria:**

- [x] 重み境界と HP 30% 境界を fake Rng で再現できる。
- [x] 低 HP 回復でも現行どおり最初の抽選を消費する。
- [x] 標準と別戦術が同じ入力から異なる合法 intent を返す。

**Verification:** `pnpm exec vitest run tests/unit/enemyPolicy.test.ts`

**Dependencies:** None

**Files likely touched:** `tests/unit/enemyPolicy.test.ts`

**Estimated scope:** Small

### Task 2: Pure EnemyIntent policy

**Description:** Phaser、Scene、GameState に依存せず、実行可能な敵 intent を選ぶ policy module を追加する。

**Acceptance criteria:**

- [x] 標準 policy が現行条件と fallback を再現する。
- [x] intent 選択は戦闘状態を変更しない。
- [x] `Math.random` と外部依存を使わない。

**Verification:** `pnpm exec vitest run tests/unit/enemyPolicy.test.ts`

**Dependencies:** Task 1

**Files likely touched:** `src/core/battle/enemyPolicy.ts`, `tests/unit/enemyPolicy.test.ts`, `src/core/battle/index.ts`

**Estimated scope:** Small

## Checkpoint 1

- [x] Task 1〜2 の RED と GREEN を確認した。
- [x] pure policy slice をコミットした。

## Phase 2: Typed ruleset and engine

### Task 3: BattleRuleset contract and presets

**Description:** 4 戦闘種別と逃走、仲間化、報酬、問題、party source/persistence を discriminated union で表す。

**Acceptance criteria:**

- [x] normal/boss/tutorial/event preset が仕様表と一致する。
- [x] 旧 boss/dev 入力を互換 ruleset へ正規化できる。
- [x] bit flag と silent invalid fallback を使わない。

**Verification:** `pnpm exec vitest run tests/unit/battleRuleset.test.ts`

**Dependencies:** Task 2

**Files likely touched:** `src/core/battle/ruleset.ts`, `tests/unit/battleRuleset.test.ts`, `src/core/battle/index.ts`

**Estimated scope:** Small

### Task 4: Engine consumes policy and ruleset

**Description:** BattleState/createBattle/act を canonical ruleset に結線し、敵 intent、逃走、仲間化、報酬を同じ規則から処理する。

**Acceptance criteria:**

- [x] fixed-seed の標準戦闘 event log と最終状態が維持される。
- [x] blocked flee/recruitment と no rewards が engine で強制される。
- [x] boss dev flee と既存通常戦の挙動が維持される。

**Verification:** `pnpm exec vitest run tests/unit/battleRuleset.test.ts tests/unit/battle.test.ts`

**Dependencies:** Task 3

**Files likely touched:** `src/core/battle/types.ts`, `src/core/battle/engine.ts`, `src/core/battle/musubiDama.ts`, `tests/unit/battle.test.ts`, `tests/unit/battleRuleset.test.ts`

**Estimated scope:** Medium

## Checkpoint 2

- [x] Task 3〜4 の RED と GREEN を確認した。
- [ ] engine/ruleset slice をコミットした。

## Phase 3: Setup and Scene contracts

### Task 5: Typed launch and party setup

**Description:** 既存 Scene caller の省略入力を保ったまま、battle kind と supplied party を型安全に渡し、setup で party source を解決する。

**Acceptance criteria:**

- [ ] 既存 random/boss/script caller が従来 ruleset へ解決される。
- [ ] supplied party の不足は明示 error になる。
- [ ] event runtime が event kind を渡す。

**Verification:** `pnpm exec vitest run tests/unit/battleUi.test.ts tests/unit/eventRuntimePorts.test.ts tests/unit/encounterLifecycle.test.ts`

**Dependencies:** Task 4

**Files likely touched:** `src/core/battle/setup.ts`, `src/scenes/battle/contracts.ts`, `src/scenes/overworld/eventRuntimePorts.ts`, `tests/unit/battleUi.test.ts`, `tests/unit/eventRuntimePorts.test.ts`

**Estimated scope:** Medium

### Task 6: Question and persistence adapters

**Description:** Scene が skill-driven/scripted question source と standard/discard persistence を ruleset から選び、provided party の結果をセーブへ混入させない。

**Acceptance criteria:**

- [ ] skill-driven questions は現行 query を維持する。
- [ ] scripted mode は明示 query 入力を使い、core へ score だけを渡す。
- [ ] persistence discard は GameState と通常報酬を変更しない。

**Verification:** `pnpm exec vitest run tests/unit/battleUi.test.ts tests/unit/battleRuleset.test.ts tests/unit/eventRuntimePorts.test.ts`

**Dependencies:** Task 5

**Files likely touched:** `src/scenes/Battle.ts`, `src/scenes/battle/contracts.ts`, `src/scenes/battle/hudViews.ts`, `src/scenes/battle/recruitFlow.ts`, `tests/unit/battleUi.test.ts`

**Estimated scope:** Medium

## Checkpoint 3

- [ ] Task 5〜6 の RED と GREEN を確認した。
- [ ] Scene/setup slice をコミットした。

## Phase 4: Verification and review

### Task 7: Focused verification and Graphify update

**Description:** 担当範囲の指定検査を実行し、Graphify の code-only graph を更新して影響範囲と循環依存を確認する。

**Acceptance criteria:**

- [ ] focused test が成功する。
- [ ] `pnpm check:fast` が成功する。
- [ ] 全変更ソースを渡した `pnpm test:related` が成功する。

**Verification:** 計画の担当完了ゲートを実行する。`pnpm test`、`pnpm build`、`pnpm check:full` は実行しない。

**Dependencies:** Task 6

**Files likely touched:** `tasks/battle-ai-ruleset-todo.md`, ignored `graphify-out/`

**Estimated scope:** Small

### Task 8: Five-axis review and handoff

**Description:** テストを先に読み、条件変異を含む correctness/readability/architecture/security/performance レビューを行い、必須指摘を解消して担当差分をコミットする。

**Acceptance criteria:**

- [ ] 変異させた条件を focused test が検出する。
- [ ] Critical/Required finding が残っていない。
- [ ] ブランチ、全コミット、検査結果、統合時の注意点を報告できる。

**Verification:** `git diff --check`、staged diff review、`git status --short`

**Dependencies:** Task 7

**Files likely touched:** `tasks/battle-ai-ruleset-plan.md`, `tasks/battle-ai-ruleset-todo.md`

**Estimated scope:** Small

## Checkpoint: Complete

- [ ] 仕様の成功条件をすべて満たした。
- [ ] 担当変更だけが `codex/battle-ai-ruleset` にコミットされている。
- [ ] 統合担当が cherry-pick できるコミット列と注意点を記録した。
