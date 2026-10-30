# Implementation Plan: adaptive-roadmap-practice

## Status

Phase 2 technical plan for the approved `SPEC-adaptive-roadmap-practice.md`.

この文書は将来のPhase 3実装を順序付ける。今回はplanだけを作成し、ソース、テスト、教材JSON、UI、
`tasks/plan.md`、`tasks/todo.md`、別のtodoファイルは変更しない。Phase 3は人間承認後に開始する。

## Overview

`src/scenes/overworld/roadmapPractice.ts` の単元内ランダム選定を、Wave 2で統合済みの
`learning-recommendation-policy` へ置き換える。Scene側は上流の公開関数・型・AttemptEvent reason mappingを
direct importし、選択Unitと実際のUnitを区別して、
`{ questionId, actualUnitId, reason, conceptIds }` を返す薄いアダプターにする。

問題実行、学習履歴、習熟度、報酬は既存の `askById` → `buildAskEnv` → `applyLearningRewards` 経路だけを使う。
GameState v13、既存報酬条件、バトルの7割弱点／3割復習、地域・ゲーム進行は変更しない。

## Planning evidence

- 承認済み仕様: `SPEC-adaptive-roadmap-practice.md`
- 能力境界: `CAPABILITY_MAP-learning-roadmap-curriculum-v2.md`
- 現行実装: `roadmapPractice.ts` は `pickRoadmapQuestionId` で `hostScene.rng.next()` を使い、
  `QuestionFrame.title` へ選択Unit名を渡し、AttemptEvent reasonを常に `review` にしている。
- Graphify code-only:
  - `roadmapPractice.ts` の直接consumerは `Overworld.ts`、`roadmap.test.ts`、`sansuG1Term3.test.ts`。
  - `runRoadmapPractice` の実行依存は `QuestionFrame`、`askById`、`buildAskEnv`、`MasteryStore`。
  - 報酬への最短経路は `runRoadmapPractice → buildAskEnv → applyLearningRewards`。
- 現在のGraphifyグラフは外部LLM・semantic labelingなしで生成済み。`graphify-out/` は生成物として
  コミットしない。

## Scope

### Implementation targets

- `src/scenes/overworld/roadmapPractice.ts`
  - 上流推薦ポリシーへの入力組み立て。
  - 公開4フィールドの返却。
  - 実Unit名・実subjectでの `QuestionFrame` 構築。
  - 上流公開mappingによる `review` / `diagnosis` 記録。
  - 候補なし、Bank不整合、UI cleanupの既存安全経路。
- `tests/unit/roadmapPractice.test.ts`
  - 純粋選定接続とランタイム境界の専用Vitest。

### Non-targets

- `src/core/learning/` の推薦、Unit正規化、関係投影、barrel exportの実装・変更。
- `src/scenes/Overworld.ts`、`src/ui/`、`content/`、`schemas/`、Question契約、GameState schema/migration。
- `src/questions/engine/pick.ts` とバトルの7割弱点／3割復習。
- `src/core/progression/learningRewards.ts` と、3回答・習熟度0.80・まちがい直し報酬条件。
- `tests/unit/roadmap.test.ts` と `tests/unit/sansuG1Term3.test.ts` の旧selector import更新。
- 今日プラン、子ども向け推薦理由表示、E2E、4174プレビュー。
- 新規依存、feature flag、教材JSON、i18n文言。

## Phase 3 entry gates

Phase 3ブランチは、次を満たすWave 3統合基点から作る。満たさない基点では実装を始めない。

1. `unit-progress-normalization` が統合済みで、legacy/current/mixed Unitと報酬マーカーの正規化が公開されている。
2. `learning-recommendation-policy` が統合済みで、承認済みSPEC名の選定関数、結果型、
   `LearningRecommendationReason`、AttemptEvent reason mappingをdirect importできる。
3. `roadmap-relation-projection` が統合済みで、Unit関係契約が推薦ポリシーと整合している。
4. 統合担当が所有する `tests/unit/roadmap.test.ts` と `tests/unit/sansuG1Term3.test.ts` から
   `pickRoadmapQuestionId` のimportと旧ランダムselector assertionが除かれている。
5. Wave 1/2のfocused testsが統合基点で成功し、`git status` がcleanである。

Gate 4の回帰範囲は本モジュールの `tests/unit/roadmapPractice.test.ts` へ移す。
旧helperは互換目的で残さない。

## Dependency graph

```text
unit-progress-normalization
  └─ canonical Unit / reward marker normalization ─────────────┐
learning-recommendation-policy                                 │
  ├─ selection function + result type                          │
  └─ recommendation reason → AttemptEvent reason mapping ─────┤
roadmap-relation-projection                                    │
  └─ normalized Unit relation contract ────────────────────────┤
integration-owner pre-gate                                     │
  └─ remove owned tests' old selector imports ─────────────────┤
                                                               ▼
Slice 1: pure roadmap practice selection adapter + RED/GREEN tests
                                                               │
                                                               ▼
Slice 2: question execution/title/reason/cleanup + RED/GREEN tests
                                                               │
                                                               ▼
Slice 3: focused regressions + Graphify impact check + atomic handoff
                                                               │
                                                               ▼
integration owner: cherry-pick → cross-module tests → full gate → UI/E2E
```

Slice 1とSlice 2は同じ所有ファイルを編集するため逐次実行する。Core、UI、他担当テストとの並行編集はしない。

## Implementation slices

### Slice 1: Connect the pure recommendation contract

**Description:** 専用テストをREDにしてから、Scene固有入力を上流推薦ポリシーへ渡し、公開4フィールドまたは
`null` を返す最小の純粋アダプターを実装する。旧 `pickRoadmapQuestionId` と
`LEGACY_QUESTION_UNIT_ALIASES` 依存を削除し、順位付け・正規化・reason型をSceneへ複製しない。

**Acceptance criteria:**

- [ ] 固定fixtureで4理由の `{ questionId, actualUnitId, reason, conceptIds }` が完全一致する。
- [ ] fresh優先・recent枯渇時再利用、学年範囲、legacy/current/mixed正規化、無候補 `null` が上流契約どおりになる。
- [ ] Graph、GameState、QuestionBank入力を変更せず、選定中にScene rngを呼ばない。

**RED first:**

1. 実在する上流ポリシーを使う表形式fixtureを追加し、現行ランダムselectorではcompileまたは期待値が失敗することを確認する。
2. `Object.freeze` / 前後snapshotで入力非変更を固定し、rng spyが0 callであることを確認する。
3. 旧問題IDでも正規 `actualUnitId` を返す回帰を、所有外テストから専用テストへ引き継ぐ。

**Verification:**

- [ ] RED: `pnpm vitest run tests/unit/roadmapPractice.test.ts` が期待理由で失敗する。
- [ ] GREEN: 同じコマンドが成功する。
- [ ] `git diff -- src/scenes/overworld/roadmapPractice.ts tests/unit/roadmapPractice.test.ts` が選定契約だけを含む。

**Dependencies:** Phase 3 entry gates 1–5.

**Candidate files:**

- `src/scenes/overworld/roadmapPractice.ts`
- `tests/unit/roadmapPractice.test.ts`

**Estimated scope:** Small, 2 files.

### Checkpoint 1: Selection boundary

- [ ] Sceneに順位付け、Unit alias表、reason union、AttemptEvent mappingの複製がない。
- [ ] `questionId` がBankに存在し、正規化した問題Unitと `actualUnitId` が一致する。
- [ ] 旧helperが削除され、所有外ファイルは変更されていない。

### Slice 2: Execute the selected question without lying about context

**Description:** ランタイムのREDテストを追加してから、Slice 1の結果を1回だけ取得し、実際の問題を
`askById` で実行する。題名は `actualUnitId`、subjectは実問題を使い、上流公開mappingで
`due-review → review`、他3理由 → `diagnosis` を記録する。正常完了時は同じ4フィールドを返す。

**Acceptance criteria:**

- [ ] 選定した `questionId` を1回だけ実行し、実Unit名・実subjectを表示して4フィールドを返す。
- [ ] 4推薦理由が上流mappingどおりのAttemptEvent reasonとなり、既存 `buildAskEnv` 経路だけが状態を更新する。
- [ ] 候補なし・欠落dependency・Bank不整合では回答前状態を変更せず、成功・失敗の両方でUIをunmountする。

**RED first:**

1. jsdom上の実 `QuestionFrame` と最小host fixtureを使い、`askById` 実行中に実Unit名・subjectを観測する。
2. 問題実行境界だけをfakeにし、既存 `buildAskEnv` の結果hookを通して永続AttemptEvent reasonを表形式で確認する。
3. `askById` reject、候補なし、stale `questionId` の各経路でroot cleanupとGameState snapshotを確認する。

**Verification:**

- [ ] RED: 追加したruntime testが、現行の選択Unit題名または固定 `review` に対して失敗する。
- [ ] GREEN: `pnpm vitest run tests/unit/roadmapPractice.test.ts` が成功する。
- [ ] 戻り値追加後も既存 `Overworld.ts` の `void runRoadmapPractice(...).finally(...)` 呼び出し契約が型上互換である。

**Dependencies:** Slice 1 and Checkpoint 1.

**Candidate files:**

- `src/scenes/overworld/roadmapPractice.ts`
- `tests/unit/roadmapPractice.test.ts`

**Estimated scope:** Small, 2 files.

### Checkpoint 2: Runtime and persistence boundary

- [ ] 回答前はGameState不変で、回答確定後だけ既存hookが更新する。
- [ ] `applyLearningRewards` の条件・実装を変更せず、実問題Unitの既存経路へ委ねている。
- [ ] GameState schemaVersion 13、migration、roadmapSnapshot、地域・inventoryへ差分がない。
- [ ] バトルの `pickQuestion(..., { weakUnitRatio: 0.7 })` へ差分がない。

### Slice 3: Focused verification and atomic handoff

**Description:** 所有差分をレビューし、関連テスト、報酬・v13・バトル選定のfocused regression、
architecture/type/format検査、Graphify更新と影響確認を順に行う。生成物はコミットせず、所有2ファイルを
1つの論理実装コミットとして統合担当へ渡す。

**Acceptance criteria:**

- [ ] 専用・related・報酬・v13・バトル選定のfocused checksが成功する。
- [ ] 変更は所有2ファイルだけで、Core/UI/Overworld/他担当テスト/生成物を含まない。
- [ ] branch、commit ID、検査、Graphify影響、統合手順をhandoffに記録し、作業ツリーがcleanである。

**Verification order:**

```bash
pnpm vitest run tests/unit/roadmapPractice.test.ts
pnpm test:related src/scenes/overworld/roadmapPractice.ts tests/unit/roadmapPractice.test.ts
pnpm vitest run tests/unit/questions.test.ts tests/unit/learningRewards.test.ts tests/unit/state.test.ts
pnpm check:fast
graphify update .
graphify affected "src/scenes/overworld/roadmapPractice.ts" --depth 2 --graph graphify-out/graph.json
graphify path "runRoadmapPractice" "applyLearningRewards" --graph graphify-out/graph.json
git diff --check
git status --short --branch
```

同じコマンドをコード変更なしに繰り返さない。`graphify-out/` はコミットしない。
`pnpm check:full`、`pnpm test`、`pnpm build`、E2E、4174プレビューは統合担当が統合後に一度だけ行う。

**Dependencies:** Slice 2 and Checkpoint 2.

**Candidate files:**

- `src/scenes/overworld/roadmapPractice.ts`
- `tests/unit/roadmapPractice.test.ts`

**Estimated scope:** Small, 2 files; verification adds no tracked files.

### Checkpoint 3: Ready for integration

- [ ] 仕様の全成功条件に、テスト名またはhandoff検査が対応している。
- [ ] Critical/Requiredの自己レビュー指摘が残っていない。
- [ ] 1論理コミットでrevert可能で、未コミット変更がない。
- [ ] Phase 4 UIへ渡す4フィールドとreason semanticsが変更されていない。

## Focused verification rationale

- `roadmapPractice.test.ts`: 本モジュールの選定・実行・表示文脈・reason mapping・cleanupを直接証明する。
- `test:related`: import消失や近接consumerの型破損を検出する。Phase 3 entry gate 4の後に実行する。
- `questions.test.ts`: GDD §5.4の7割弱点／3割復習を変更していないことを固定する。
- `learningRewards.test.ts`: 3回答・習熟度0.80・まちがい直し・冪等性を固定する。
- `state.test.ts`: v13 migrationと既存保存契約を固定する。
- `check:fast`: lint、format、architecture、app typecheckを担当ブランチで確認する。
- Graphify: `Overworld.ts` と所有外テスト以外へ新しいScene逆依存が増えていないこと、報酬経路が既存の
  `buildAskEnv` 経由のままであることを確認する。

## Risks and mitigations

| Risk                                                | Impact | Mitigation                                                                                                      |
| --------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| Wave 2の公開名・型とplan時点の想定がずれる          | High   | Phase 3 entry gateで承認済みSPECと統合済みsourceを読み直し、公開exportをdirect importする。ローカル型を作らない |
| 旧selectorを消すと所有外テストがcompile errorになる | High   | 統合担当がentry gate 4を先に満たす。Agent 4は2テストを編集せず、専用テストへ回帰範囲を持つ                      |
| 前提問題を選択Unit名で表示する                      | High   | `actualUnitId` と実問題subjectをruntime testで観測し、選択Unitへのfallbackを禁止する                            |
| reason mappingをSceneに複製して上流と乖離する       | High   | 上流公開mappingだけを使い、4理由の表形式AttemptEvent testを置く                                                 |
| 推薦だけでGameStateや報酬を変更する                 | High   | 選定前後snapshotを比較し、回答結果hook以外から状態を更新しない                                                  |
| legacy/current/mixedキーで報酬が二重付与される      | High   | 正規化はWave 1へ委譲し、専用legacy fixtureと既存報酬回帰テストを通す                                            |
| `runRoadmapPractice` の返り値変更でcallerが壊れる   | Medium | 関数名を維持し、既存 `void ...finally(...)` が型互換であることをapp typecheckで確認する                         |
| DOM testが実装詳細依存・flakyになる                 | Medium | 実DOMの表示状態とGameState結果をassertし、外部副作用境界だけをfakeにする。timerや乱数を使わない                 |
| Graphifyグラフが実装後のimportを反映しない          | Low    | Slice 3でcode-only `graphify update .` 後にaffected/pathを再確認する                                            |

## Integration-owner handoff

### Before Agent 4 implementation

- Wave 1/2を統合し、Phase 3 entry gatesを満たす統合コミットIDをAgent 4へ渡す。
- `roadmap.test.ts` と `sansuG1Term3.test.ts` の旧selector import/assertionを所有者として更新する。
- `src/core/learning/index.ts` やprovider export調整が必要なら統合担当が行う。Agent 4へ共有ファイル編集を依頼しない。

### When Agent 4 finishes

Agent 4は次を渡す。

- branch名と1論理commit ID。
- 変更概要と、所有2ファイルだけであること。
- RED→GREENの確認内容、focused commandと結果。
- Graphify affected/path結果。
- 既知の未解決事項なし、clean status。

### After cherry-pick

統合担当は内容に基づいて競合を解消し、次を統合済みブランチで確認する。

1. `roadmap.test.ts` / `sansuG1Term3.test.ts` に旧helper importが残らない。
2. `Overworld.ts` は既存callerで動く。UI連携に追加変更が必要な場合だけ統合担当が編集する。
3. Core barrel、UI、今日プラン、E2Eとのcross-module contractが一致する。
4. Wave 3 focused testsを実行し、最終統合後に `pnpm check:full`、対象E2E、4174プレビュー、
   v13代表セーブのimport→回答→保存→reloadを一度だけ行う。

## Task tracking

このmoduleのPhase 3順序とcheckpointsは、この専用planだけを正とする。ユーザー指示により
`tasks/plan.md`、`tasks/todo.md`、専用todoファイル、外部trackerは作成・更新しない。

## Open questions

None. 依存契約、reason mapping、旧selector移行所有者、検証分担は承認済み仕様と横断レビューで確定済み。

## Phase 3 approval gate

人間がこのplanを承認し、統合担当がPhase 3 entry gatesを満たした後にだけSlice 1へ進む。
承認前にソース、テスト、教材、UI、todoを変更しない。
