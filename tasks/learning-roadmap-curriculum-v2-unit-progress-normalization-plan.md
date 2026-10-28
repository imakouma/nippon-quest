# Implementation Plan: Unit Progress Normalization

## Status

- Module: `unit-progress-normalization`
- Approved spec: `SPEC-unit-progress-normalization.md`
- Capability map: `CAPABILITY_MAP-learning-roadmap-curriculum-v2.md`
- Baseline: `8dfff95c3e0bb65502648bcec38c0c3862552da1`
- Working branch: `codex/lr-v2-unit-progress`
- Phase: 2 — implementation planning only
- Task list target: this module plan. The unrelated shared `tasks/plan.md` and `tasks/todo.md` remain unchanged.

## Overview

旧ロードマップnode、旧問題unit、現行unitを同じ正規IDとして扱う最小のCore契約を、3つの薄いsliceで実装する。最初にID正規化を固定し、次に既存ロードマップと同じ重み付き習熟集約を純粋関数へ抽出し、最後に既存報酬条件を変えず正規進捗と正規markerを使う報酬実装を追加する。

Agent 1は所有ファイルと専用テストだけを変更する。既存の回答経路、ロードマップScene、barrel exportは統合担当が接続するため、この計画内では変更しない。

## Graphify evidence

Phase 2開始時に次を実行した。

```text
graphify extract . --code-only --no-cluster
```

- `graphify-out/graph.json`: 42,321 nodes / 52,670 edgesで生成。semantic labelingと外部LLMは未使用。
- `canonicalUnitId()` はdegree 11。直接利用は `coverage.ts`、`graphQuality.ts`、`roadmap.ts` と教材・ロードマップ系テスト。
- `applyLearningRewards()` は `buildAskEnv()` から呼ばれ、バトル、名所イベント、ロードマップ練習、まちがい直しへ間接的に広がる。
- `src/core/progression/learningRewards.ts` のaffected範囲には `askEnv.ts`、`levelCapUnlock.ts`、`bagItems.ts`、`learningRewardNotice.tsx` と関連テストが含まれる。
- 現状は `canonicalUnitId()` と `applyLearningRewards()` の間に依存経路がなく、報酬がaliasを認識しないことを確認した。
- `graphify-out/` は生成物であり、この計画または実装コミットへ含めない。

## Scope

### Implementation target

- `src/core/learning/unitAliases.ts`
- `src/core/learning/unitProgress.ts`
- `src/core/learning/learningRewards.ts`
- `tests/unit/unitProgress.test.ts`
- `tests/unit/learningRewards.test.ts`

### Explicit non-target

- `src/scenes/overworld/roadmap.ts`
- `src/shared/menuModel.ts`
- `src/core/learning/index.ts`
- `src/core/progression/learningRewards.ts`
- `src/scenes/shared/askEnv.ts`
- `src/core/state/schema.ts`、migration、`roadmapSnapshot.ts`
- UI、Scene、教材JSON、Question契約、推薦・関係投影ポリシー
- 既存報酬閾値、報酬量、報酬アイテム、まちがい直し条件

## Architecture decisions

1. `unitAliases.ts` をID同一性の唯一の正とする。`canonicalUnitId()` はcurrent、legacy question、raw legacy nodeを1つの現行IDへ写し、unknownは保持する。
2. `unitProgress.ts` はmastery辞書だけを受け取る純粋関数とする。GameState、Scene、Question engineの具体型へ依存させず、構造的なread-only record型を使う。
3. 集約式は既存 `roadmap.ts` の `max(1, n)` 重み付き平均、`n`合計、`lastAt`最大をそのままcharacterization testで固定する。
4. mixed masteryの複数recordは加算可能な証拠として扱い、AttemptEventなしで推測重複排除しない。
5. `src/core/learning/learningRewards.ts` は既存公開名と戻り値契約を維持する。mastery lookupとmarker比較だけを正規IDへ寄せ、correction reward、inventory、dexの挙動はそのまま移す。
6. markerは回答で触れた同値クラスだけを遅延正規化する。save全体の一括migrationはしない。
7. Agent 1はproduction callerを接続しない。統合担当は既存 `src/core/progression/learningRewards.ts` を新実装のcompatibility re-exportにする方法を第一候補とし、多数の既存importを維持する。

## Dependency graph

```text
LEGACY_UNIT_ALIASES + LEGACY_QUESTION_UNIT_ALIASES
                       |
                       v
                canonicalUnitId
                       |
                       v
             aggregateUnitMastery
                       |
                       v
             applyLearningRewards
                       |
                       v
        integration compatibility re-export
                       |
                       v
                    askEnv
       / battle / event / roadmap practice / review
```

Implementation order is strictly Slice 1 → Slice 2 → Slice 3. The integration handoff occurs only after Agent 1's focused verification and commit.

## Slice 1: Canonical unit ID contract

**Description:** current、legacy question、raw legacy nodeが同じ正規IDへ解決され、unknown IDは保持される契約をREDテストで固定する。既存aliasの対応先は変更しない。

**RED test first:** `tests/unit/unitProgress.test.ts` を追加し、raw legacy nodeの正規化が現行実装で失敗することを確認する。current、legacy question、unknownも同じテーブルでcharacterizationする。

**Implementation:** `canonicalUnitId()` のlookupを既存2対応表へ限定して拡張する。新しいalias表、再帰解決、入力検証、設定化は追加しない。

**Acceptance criteria:**

- [ ] `sansu.g1.tashizan` はそのまま返る。
- [ ] `sansu.g1.legacy-math-1-2` と `math_1_2` は `sansu.g1.tashizan` へ解決される。
- [ ] 対応表にないIDは変更されない。
- [ ] 既存aliasの対応先と対応表自体は変わらない。
- [ ] 入力とmodule-level mappingを変更しない。

**Verification:**

- [ ] RED: `pnpm vitest run tests/unit/unitProgress.test.ts` がraw legacy caseで期待どおり失敗する。
- [ ] GREEN: 同じfocused testが成功する。
- [ ] `pnpm test:related src/core/learning/unitAliases.ts tests/unit/unitProgress.test.ts`

**Dependencies:** None

**Candidate files:**

- `src/core/learning/unitAliases.ts`
- `tests/unit/unitProgress.test.ts`

**Estimated scope:** Small — 2 files

## Slice 2: Alias-aware mastery aggregation

**Description:** 保存済みmastery辞書を正規unit IDごとに集約する純粋関数を追加し、legacy-only、current-only、mixed splitが同じ論理進捗を返すことを固定する。

**RED test first:** Slice 1のテストへ、空、single、raw legacy、mixed split、複数canonical unit、`n === 0`、入力不変のcaseを追加する。未実装exportによる失敗を確認する。

**Implementation:** `aggregateUnitMastery()` を追加する。各input keyを `canonicalUnitId()` へ写し、既存ロードマップと同じ式で集約した新しい辞書を返す。

**Acceptance criteria:**

- [ ] output keyはすべてcanonical IDまたはunknownの元IDになる。
- [ ] `value` は `max(1, n)` 重み付き平均、`n` は合計、`lastAt` は最大になる。
- [ ] legacy-only、current-only、同じ論理進捗を分割したmixed fixtureが完全一致する。
- [ ] duplicate-looking mixed recordsは推測で除外せず、既存式どおり加算する。
- [ ] 空入力は空出力を返し、unknown unitを失わない。
- [ ] input辞書とrecordを変更せず、output recordを共有可変状態にしない。

**Verification:**

- [ ] RED: aggregate importまたは期待caseが未実装で失敗する。
- [ ] GREEN: `pnpm vitest run tests/unit/unitProgress.test.ts`
- [ ] `pnpm test:related src/core/learning/unitAliases.ts src/core/learning/unitProgress.ts tests/unit/unitProgress.test.ts`

**Dependencies:** Slice 1

**Candidate files:**

- `src/core/learning/unitProgress.ts`
- `tests/unit/unitProgress.test.ts`

**Estimated scope:** Small — 2 files

## Checkpoint A: Normalization foundation

- [ ] Slice 1と2のfocused testが成功する。
- [ ] existing roadmap formulaとの完全一致をテスト名とfixtureから確認できる。
- [ ] Graphifyのdirect consumersであるcoverage、graph quality、roadmapへ意図しない新依存を追加していない。
- [ ] `git diff --check` が成功する。
- [ ] 変更は3 owned files以内で、Scene/UI/schemaへ広がっていない。

## Slice 3: Idempotent canonical learning rewards

**Description:** 既存報酬実装をCore learning側へ移し、alias-aware mastery lookupとcanonical marker比較・遅延収束を追加する。既存報酬条件とcorrection rewardをcharacterization testで守る。

**RED test first:** `tests/unit/learningRewards.test.ts` のimportを新しいCore learning moduleへ向け、次を先に追加する。

- legacy mastery + no marker → 1回だけ付与。
- current mastery + legacy marker → 0付与、canonical markerへ収束。
- mixed mastery + legacy/current duplicate markers → 0付与、1 markerへ収束。
- legacy mastery + current marker、および逆方向 → 0付与。
- 結果stateの再入力 → inventory、dex、marker数が増えない。
- unrelated mastery、marker、progress、attemptsを変更しない。

**Implementation:** 既存の型、`LEARNING_FRAGMENT_ID`、correction計数、inventory/dex更新を維持して新moduleへ置く。masteryはSlice 2の集約結果から読む。触れたunitのmarkerだけをcanonical ID 1件へ収束させる。

**Acceptance criteria:**

- [ ] mastery条件は厳密に `n >= 3 && value >= 0.8` のまま。
- [ ] legacy/current/mixedのmasteryとmarkerの全組合せで同じ正規unitへ最大1回だけ付与する。
- [ ] 新規markerは常にcanonical IDで保存する。
- [ ] marker-only normalizationは `earned: 0`, `reasons: []` で新stateを返す。
- [ ] correction rewardの完全正答、異なる3問、重複防止、同時2個付与を維持する。
- [ ] inventory加算、dex登録、元stateを直接変更しない契約を維持する。
- [ ] GameState schema、schemaVersion、migrationを変更しない。

**Verification:**

- [ ] RED: alias交差参照またはmarker重複caseが現行挙動では失敗する。
- [ ] GREEN: `pnpm vitest run tests/unit/unitProgress.test.ts tests/unit/learningRewards.test.ts`
- [ ] `pnpm test:related src/core/learning/unitAliases.ts src/core/learning/unitProgress.ts src/core/learning/learningRewards.ts tests/unit/unitProgress.test.ts tests/unit/learningRewards.test.ts`
- [ ] `pnpm check:fast`

**Dependencies:** Slice 2

**Candidate files:**

- `src/core/learning/learningRewards.ts`
- `tests/unit/learningRewards.test.ts`

**Estimated scope:** Small — 2 files

## Checkpoint B: Agent 1 implementation complete

- [ ] 3 slicesのacceptance criteriaをすべて満たす。
- [ ] focused testsとrelated testsが成功する。
- [ ] `pnpm check:fast` が成功する。
- [ ] `git diff --check` とstaged diff reviewが成功する。
- [ ] 変更ファイルがapproved owned filesだけである。
- [ ] `graphify-out/`、`dist/`、`test-results/` がcommitに含まれない。
- [ ] 1論理コミットを作り、branch、commit ID、検査結果、clean statusを統合担当へ渡す。

## RED/GREEN discipline

各sliceは同じ順序を守る。

1. 1概念だけを表す最小の失敗テストを書く。
2. focused commandで、期待した理由で失敗することを確認する。
3. そのテストだけを通す最小実装を書く。
4. focused testを通す。
5. 必要な名前整理・重複除去だけを行い、再度focused testを通す。
6. slice完了時にrelated testsを通し、次sliceへ進む。

テストはstateと戻り値を検証し、内部関数呼び出しやmock call sequenceには依存しない。fixtureはlegacy/current/mixedの差だけを明確にし、DAMPに保つ。

## Focused verification matrix

| Concern                            | Command                                                                                                                                                                                        | Owner             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Alias and aggregation RED/GREEN    | `pnpm vitest run tests/unit/unitProgress.test.ts`                                                                                                                                              | Agent 1           |
| Reward regression and idempotency  | `pnpm vitest run tests/unit/learningRewards.test.ts`                                                                                                                                           | Agent 1           |
| Owned-file dependency regression   | `pnpm test:related src/core/learning/unitAliases.ts src/core/learning/unitProgress.ts src/core/learning/learningRewards.ts tests/unit/unitProgress.test.ts tests/unit/learningRewards.test.ts` | Agent 1           |
| Lint, architecture, app typecheck  | `pnpm check:fast`                                                                                                                                                                              | Agent 1           |
| All unit/data/content/build gates  | `pnpm check:full`                                                                                                                                                                              | Integration owner |
| Representative v13 save round-trip | integration test/manual import → answer → save → reload                                                                                                                                        | Integration owner |

Agent 1は並行作業中に `pnpm check:full`、`pnpm test`、`pnpm build` を実行しない。

## Risks and mitigations

| Risk                                                               | Impact | Mitigation                                                                                         |
| ------------------------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------- |
| `canonicalUnitId()` 拡張がcoverage/graph quality/roadmapへ波及する | Medium | 既存mappingを変えずraw legacy lookupだけを加え、Graphify direct consumersをrelated testsで確認する |
| 集約式がroadmap実装とずれて表示・推薦結果が変わる                  | High   | 現行数式をcharacterization fixtureで固定し、独自の平均・dedupeを入れない                           |
| mixed saveのduplicate-looking recordを誤って除外する               | Medium | AttemptEventなしでは推測せず、既存どおり加算するcaseを明示テストする                               |
| legacy/current markerが別報酬として数えられる                      | High   | 比較前に全markerをcanonical化し、交差組合せと再入力をREDテストする                                 |
| marker整理で無関係な順序やsave dataを変える                        | Medium | 触れた同値クラスだけをfirst-position置換・重複除去し、unrelated stateを完全一致で検証する          |
| 新moduleがproduction回答経路へ未接続のまま統合される               | High   | Checkpoint Cを統合必須条件とし、既存progression moduleのcompatibility re-exportを第一候補にする    |
| 既存報酬importを一斉変更して広い競合が起きる                       | High   | askEnv/UI/level-capのimportを維持できる1ファイルre-exportを使い、Agent 1ではcallerを編集しない     |
| schema migrationでv13 saveを壊す                                   | High   | schema/version/migrationを非対象に固定し、代表v13 round-tripを統合担当が確認する                   |

## Integration handoff

Agent 1コミット後、統合担当は次の順序で接続する。

1. `src/core/progression/learningRewards.ts` を `src/core/learning/learningRewards.ts` のcompatibility re-exportへ置き換えることを第一候補とする。これによりGraphifyで確認した多数の既存import pathを維持する。
2. `src/scenes/overworld/roadmap.ts` のlocal `mergedMastery` を `aggregateUnitMastery()` 利用へ置き換え、表示数式が抽出moduleと1つになることを確認する。
3. 後続moduleが必要な場合だけ、統合担当が `src/core/learning/index.ts` へexportを追加する。Agent 1と後続作業branchはdirect importを使える。
4. 既存 `learningRewards.test.ts`、`askEnv.test.ts`、roadmap tests、level-cap/bag/notice関連testsを実行し、公開名と型が維持されることを確認する。
5. representative v13 legacy-only、current-only、mixed saveでimport → answer → save → reloadを行い、inventory、dex、報酬marker、地域進行が維持されることを確認する。
6. `pnpm check:full` を統合後に一度実行する。

Agent 1はこのhandoff対象ファイルを編集しない。統合担当がcompatibility re-export以外の接続方式を選ぶ場合も、既存公開名と全callerの挙動を維持する。

## Checkpoint C: Integrated acceptance

- [ ] Production回答経路が新しい正規化済み報酬実装へ接続されている。
- [ ] Roadmapが同じ集約moduleを使い、重複した集約ロジックが残っていない。
- [ ] Existing caller imports、UI notice、level-cap material lookupが壊れていない。
- [ ] legacy/current/mixedの代表v13 saveで二重付与が発生しない。
- [ ] 保存済みmastery keys、地域進行、所持品を巻き戻していない。
- [ ] `pnpm check:full` が成功する。

## Commit strategy

- Agent 1 implementation: 3 slicesを1つのreview可能なfeature commitにまとめる。変更はowned filesだけに限定する。
- Integration: compatibility re-export、roadmap利用、必要なexport、統合testをAgent 1 commitとは別のintegration commitにする。
- Refactor、教材変更、UI変更、format-only変更を同じcommitへ混ぜない。

## Open questions

None. The approved spec fixes the normalization, aggregation, marker, ownership, and integration boundaries required to begin implementation after this plan is approved.
