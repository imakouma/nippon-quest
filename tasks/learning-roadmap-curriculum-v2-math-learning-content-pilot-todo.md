# Phase 3 Todo: math-learning-content-pilot

## Status

Phase 1 の承認済み仕様 `SPEC-math-learning-content-pilot.md` と、Phase 2 の承認済み計画
`tasks/learning-roadmap-curriculum-v2-math-learning-content-pilot-plan.md` を、1セッションで完了できる実装タスクへ分割した。
実装は未開始であり、この文書の作成時点ではコード、テスト、教材、UI、仕様、Phase 2 計画を変更しない。

未解決事項はない。

## Scope and ownership

実装担当が変更できるファイルは次の7件だけとする。

1. `tests/unit/mathLearningContentPilot.test.ts`
2. `content/questions/sansu/g1/ringo-number-build.json`
3. `content/questions/sansu/g1/kazu-kiso.json`
4. `content/questions/sansu/g1/tashizan.json`
5. `content/questions/sansu/g1/kuriagari-kurisagari.json`
6. `content/curriculum/sansu-g1-foundations.json`
7. `content/curriculum/sansu-g1-term2.json`

依存順は `Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7` とする。すべて同じ専用worktreeで順番に実行し、意図的にREDの状態はcommitしない。

## Wave 3 start conditions

### Required other-agent commits

- [ ] 統合担当が `unit-progress-normalization` の実装commitを統合し、そのcommit IDを実行記録へ記載している。
- [ ] 統合担当が、上記に依存する `learning-recommendation-policy` の実装commitを統合し、そのcommit IDを実行記録へ記載している。stageタグ語彙は承認済みの `stage:concrete | visual | symbolic | application` と矛盾しない。
- [ ] `codex/lr-v2-unit-progress` の `6c2218ea` と `codex/lr-v2-recommendation-policy` の `42a9d78b` は2026-10-28時点では計画commitにすぎないため、これらを実装依存の充足とは扱わない。

### Start checklist

- [ ] 統合担当がWave 1・Wave 2のfocused gateをGREENにし、Wave 3開始を宣言している。
- [ ] 統合済み基点commit、作業branch `codex/lr-v2-content-pilot`、`git status --short` を記録し、専用worktreeがcleanである。
- [ ] `pnpm vitest run tests/unit/learningRecommendationPolicy.test.ts tests/unit/learningPlan.test.ts` がGREENで、Graph、QuestionBank、概念状態、履歴、recent、習熟入力、GameStateの入力不変性がdeep-freeze回帰で固定されている。
- [ ] `graphify update . --no-cluster` を統合済み基点で実行し、code-onlyの依存方向を確認している。semantic labelingや外部LLMは使わず、`graphify-out/` はcommitしない。
- [ ] 7件の所有ファイルを他チャットが同時編集しておらず、依存関係・lockfileを変更しない既存ツールチェーンでfocused commandを実行できる。
- [ ] 承認済み仕様commit `c69583553d1ebdba58581e4a8cc9dc07296ef32f` と承認済みPhase 2計画commit `1418786758ee7edd2f90fcb291c05c4809a13474` の内容が統合済み基点に存在する。

開始条件を満たさない場合は実装を開始せず、欠けているmodule名、symbol、test、基点commitを統合担当へ返す。

## Task 1: Add the complete RED contract test

**Description:** 専用Vitestを1ファイルだけ追加し、後続すべての教材変更を先にREDで固定する。テストは `学習段階タグ` 配下を `kazu-100`、`tashizan`、`kuriagari-kurisagari` に、`draft誤概念シグナル` 配下を `foundations`、`term2` に分け、後続タスクを正確に絞り込めるようにする。

**Acceptance criteria:**

- Exact target matrixの12 Question ID、指定stageタグ、既存非stageタグ、Unit、type、payload内の正答を固定し、対象外へのstageタグ波及を拒否する。
- primary数 `4 / 3 / 6` を基準として各3以上を要求し、既存3件と新規3件の正確なシグナルtuple、confidence上限0.70、重複禁止、draft状態を固定する。
- REDはstageタグ未追加と現行3シグナル不足だけに由来し、fixture誤り、ID不存在、syntax error、上流回帰をREDとして受け入れない。

**Verification:**

```bash
pnpm vitest run tests/unit/mathLearningContentPilot.test.ts
git diff --check -- tests/unit/mathLearningContentPilot.test.ts
git status --short
```

最初のcommandは期待どおりRED、残り2つは成功を必須とする。失敗assertion名と原因を実行記録へ残す。

**Dependencies:** Wave 3 start checklistの全項目。

**Files likely touched:**

- `tests/unit/mathLearningContentPilot.test.ts`

**Estimated scope:** Small — 1 focused session、1 file。

## Task 2: Make the `kazu-100` stage slice GREEN

**Description:** `kazu-100` の承認済み5問だけへstageタグを末尾追加し、具体物・数直線・位取りの分類をGREENにする。

**Acceptance criteria:**

- `ringo-blocks-0001` は `stage:concrete`、`ringo-numberline-0001` は `stage:visual`、`place-value-0001/0002/0003` は `stage:symbolic` を各1件だけ持つ。
- 既存タグの値と順序、Question ID、Unit、type、payload、正答、説明を変更せず、stageタグだけを既存tags末尾へ追加する。
- `stage:visual` が別primary Conceptの数直線問題へ付くという承認済み判断を維持する。

**Verification:**

```bash
pnpm vitest run tests/unit/mathLearningContentPilot.test.ts -t "kazu-100"
pnpm validate:content
git diff --check -- content/questions/sansu/g1/ringo-number-build.json content/questions/sansu/g1/kazu-kiso.json
```

**Dependencies:** Task 1の期待REDを記録済み。

**Files likely touched:**

- `content/questions/sansu/g1/ringo-number-build.json`
- `content/questions/sansu/g1/kazu-kiso.json`

**Estimated scope:** Small — 1 focused session、2 files。

## Task 3: Make the `tashizan` stage slice GREEN

**Description:** `tashizan` の承認済み3問だけへ応用stageタグを末尾追加し、問題挙動とprimaryリンクを保持する。

**Acceptance criteria:**

- `sansu.g1.tashizan.0001`、`.0006`、`.0007` が `stage:application` を各1件だけ持つ。
- 既存タグ、Question ID、Unit、type、payload、正答、説明、primary Conceptリンクは不変である。
- 対象外の `tashizan` 問題へstageタグを追加しない。

**Verification:**

```bash
pnpm vitest run tests/unit/mathLearningContentPilot.test.ts -t "tashizan"
pnpm validate:content
git diff --check -- content/questions/sansu/g1/tashizan.json
```

**Dependencies:** Task 2がGREEN。

**Files likely touched:**

- `content/questions/sansu/g1/tashizan.json`

**Estimated scope:** Small — 1 focused session、1 file。

## Checkpoint A: RED contract and first two stage slices

- [ ] Task 1のRED理由が記録され、assertionをskip・緩和していない。
- [ ] `kazu-100` と `tashizan` のfocused testおよび `validate:content` がGREENである。
- [ ] full専用testは、未実装の `kuriagari-kurisagari` stageと新規misconception dataだけを理由にREDである。
- [ ] ここまでのdiffはtest 1件とquestion JSON 3件以内で、生成物や所有外ファイルを含まない。

## Task 4: Make the `kuriagari-kurisagari` stage slice GREEN

**Description:** 繰り上がり・繰り下がりUnitの承認済み4問へstageタグを付け、12問のstage matrix全体をGREENにする。

**Acceptance criteria:**

- `.0001`、`.0002`、`.0004` は `stage:symbolic`、`.0006` は `stage:application` を各1件だけ持つ。
- 12対象問だけが4語彙のstageタグを各1件持ち、4語彙すべてが少なくとも1回使われる。
- 既存タグ、Question ID、Unit、type、payload、正答、説明を変更しない。

**Verification:**

```bash
pnpm vitest run tests/unit/mathLearningContentPilot.test.ts -t "kuriagari-kurisagari"
pnpm vitest run tests/unit/mathLearningContentPilot.test.ts -t "学習段階タグ"
pnpm validate:content
git diff --check -- content/questions/sansu/g1/kuriagari-kurisagari.json
```

**Dependencies:** Checkpoint Aが完了。

**Files likely touched:**

- `content/questions/sansu/g1/kuriagari-kurisagari.json`

**Estimated scope:** Small — 1 focused session、1 file。

## Task 5: Add the foundations draft misconception slice

**Description:** `kazu-100` の位取り逆転仮説をfoundations fragmentへ追加し、同じfragment内の既存3シグナルを一切変えずに保持する。

**Acceptance criteria:**

- `sansu.g1.misconception.tens-ones-reversed` を既存Unit・一次資料ID、`kind: "misconception"`、`review.status: "draft"` で追加する。
- `place-value-0001` の誤答 `b` をconfidence `0.70`で新Conceptへ結び、QuestionLink全体を `draft` とし、rationaleに「一度だけでは断定しない」旨を含める。
- `tashizan.0001/d/0.65`、`.0002/b/0.60`、`.0004/b/0.70` の既存3tupleとprimaryリンクを変更・重複させない。

**Verification:**

```bash
pnpm vitest run tests/unit/mathLearningContentPilot.test.ts -t "foundations"
pnpm validate:curriculum-graph
pnpm validate:content
git diff --check -- content/curriculum/sansu-g1-foundations.json
```

**Dependencies:** Task 4のstage testがGREEN。

**Files likely touched:**

- `content/curriculum/sansu-g1-foundations.json`

**Estimated scope:** Small — 1 focused session、1 file。

## Task 6: Add the term-2 draft misconception slice

**Description:** make-tenの新規draft仮説と、承認済み2シグナルをterm-2 fragmentへ追加し、専用教材契約全体をGREENにする。

**Acceptance criteria:**

- `sansu.g1.misconception.make-ten-arbitrary-split` を既存Unit・一次資料ID、`kind: "misconception"`、`review.status: "draft"` で追加する。
- `.0001/b` → 新Conceptを0.65、`.0004/b` → 既存 `add-instead-difference` を0.65で追加し、両QuestionLinkを `draft`、両rationaleを非断定表現にする。
- 対象3 Unitのsignalは重複なしで正確に6件、全confidenceが0.70以下、新規Conceptと新規signal linkは昇格なし、primary数は各3以上である。

**Verification:**

```bash
pnpm vitest run tests/unit/mathLearningContentPilot.test.ts -t "term2"
pnpm vitest run tests/unit/mathLearningContentPilot.test.ts
pnpm validate:curriculum-graph
pnpm validate:content
git diff --check -- content/curriculum/sansu-g1-term2.json
```

**Dependencies:** Task 5がGREENで、cross-fragmentの既存Concept参照をmerged graphで検証できる。

**Files likely touched:**

- `content/curriculum/sansu-g1-term2.json`

**Estimated scope:** Small — 1 focused session、1 file。

## Checkpoint B: Content behavior complete

- [ ] 専用test全体、`validate:curriculum-graph`、`validate:content` がGREENである。
- [ ] stage対象は正確に12問、語彙は4種類だけ、各対象問はstageタグを1件だけ持つ。
- [ ] primary数は各3以上、signalは既存3件を含む正確な6件、confidence最大0.70、追加review状態はすべてdraftである。
- [ ] 変更は7 owned files以内で、Question/Unit ID、正答、問題文、schema、renderer、state、reward、policy、Scene、UIを含まない。

## Task 7: Run compatibility gates and prepare the atomic implementation commit

**Description:** content-only変更が報酬、v13/legacy save、バトル7割弱点／3割復習選定、推薦入力不変性を壊していないことを証明し、7 owned filesだけを1論理commitへまとめる。検証失敗を所有外ファイルの修正で解決しない。

**Acceptance criteria:**

- 報酬の `n >= 3 && mastery >= 0.8` と異なる3問の完全訂正、v13 pass-through・export/import・roadmap既得保護・legacy migrationが既存testでGREENである。
- バトル出題の弱点比率0.7回帰と、推薦ポリシー／今日プランのGraph・QuestionBank・GameState等の入力不変回帰がGREENである。
- final diffは7 owned filesだけで、focused gateがすべてGREEN、intentional REDを含まない1 implementation commitとなる。

**Verification:**

```bash
pnpm vitest run tests/unit/mathLearningContentPilot.test.ts
pnpm vitest run tests/unit/learningRewards.test.ts tests/unit/state.test.ts tests/unit/legacyImport.test.ts
pnpm vitest run tests/unit/questions.test.ts
pnpm vitest run tests/unit/learningRecommendationPolicy.test.ts tests/unit/learningPlan.test.ts
pnpm validate:curriculum-graph
pnpm validate:content
pnpm check:fast
pnpm test:related tests/unit/mathLearningContentPilot.test.ts
git diff --check
git status --short
```

**Dependencies:** Checkpoint Bが完了し、Required other-agent commitsを含む同じ統合済み基点上で作業している。

**Files likely touched:** None — verification and commit preparation only。

**Estimated scope:** Small — 1 focused session、0 files。

## Checkpoint C: Integration-ready implementation commit

- [ ] Task 7の全commandと結果をhandoff用に記録した。
- [ ] `git diff --name-only` と `git diff --cached --name-only` は7 owned filesだけを示す。
- [ ] staged diffでsecret、依存、lockfile、生成物、無関係な整形、`tasks/plan.md`、`tasks/todo.md` の混入がない。
- [ ] intentional REDをcommitせず、content pilot全体を1論理implementation commitにした。
- [ ] branch名、基点commit、implementation commit ID、RED理由、GREEN検査を統合担当へ渡した。

## Out-of-scope handoff to the integration owner

次のいずれかが必要になった時点で作業を止め、所有ファイルへ迂回実装を入れず統合担当へhandoffする。

- [ ] `src/questions/contracts.ts`、renderer、learning model/schema、`schemas/**`、manifest/catalog、依存・lockfileの変更が必要。
- [ ] `src/core/state/**`、migration、roadmap snapshot、reward、recommendation policy、battle selection、Scene、UI、i18nの変更が必要。
- [ ] 承認済み12 Question ID、4 stage語彙、6 signal tuple、confidence上限、draft状態、primary対応を変更する必要がある。
- [ ] 他agentの実装commit不足、署名不一致、テスト不存在、所有ファイル競合があり、7 owned files内だけではGREENにできない。

handoffには、失敗command、最小再現、期待値と実値、基点commit、必要なowner/module/fileを含める。実装担当は共有branchへmerge/pushしない。

## Final clean and commit conditions

### Module agent

- [ ] 変更は7 owned filesだけで、`tasks/todo.md` を含む既存task文書は変更していない。
- [ ] stageは正確に12問・4語彙、primaryは各3以上、signalは正確に6件・最大0.70・draftである。
- [ ] reward、v13/legacy save、battle 7:3、recommendation input immutabilityのfocused regressionがGREENである。
- [ ] `git diff --check`、staged diff review、secret scanが成功している。
- [ ] implementationを1 logical commitにし、commit後の `git status --porcelain` が空である。
- [ ] 完了報告にbranch、full commit ID、変更概要、実行commandと結果、clean statusを記載し、merge/pushしていない。

### Integration owner

- [ ] module commitを統合後、他の並行worktreeがfull gateを実行していない状態で `pnpm check:full`、`pnpm test`、`pnpm build` を一度だけ実行する。
- [ ] 代表v13 saveをlegacy/current/mixedで読み、推薦計算 → 回答 → 保存 → 再読込後も進捗、報酬marker、inventory、dexが減らず、二重報酬がないことを確認する。
- [ ] integrated branchでGraphify code-only graphを更新し、runtime契約や依存方向への逆流がないことを確認する。
- [ ] Wave 4 UI接続後、最新buildから正規preview `127.0.0.1:4174` を起動し、再現可能な初期状態と必要な旧save状態をE2E確認する。
