# Learning Roadmap Curriculum v2 — Learning Recommendation Policy 実装計画

## 0. 計画ステータス

- Capability module: `learning-recommendation-policy`
- Phase: 2 — implementation planning only
- Approved specification: `SPEC-learning-recommendation-policy.md`
- Capability map: `CAPABILITY_MAP-learning-roadmap-curriculum-v2.md`
- Baseline branch: `codex/lr-v2-recommendation-policy`
- Required upstream module: `unit-progress-normalization`
- Phase 3 todo: 本計画の承認後に別途作成する。このPhaseでは作成しない。
- Open questions: なし

本計画は、承認済み仕様の公開型、4段階の推薦順位、JST日境界、最大3件の今日プラン、
非破壊入力、既存報酬・v13セーブ互換を実装可能な薄いスライスへ分解する。実装担当は
この計画で指定した所有範囲だけを変更し、Scene、UI、保存schema、報酬処理、barrel export、
教材データには触れない。

## 1. 成果物と成功条件

最終成果物は次の4ファイルに限定する。

- `src/core/learning/recommendationPolicy.ts`
- `src/core/learning/learningPlan.ts`
- `tests/unit/learningRecommendationPolicy.test.ts`
- `tests/unit/learningPlan.test.ts`

実装完了時には、同じ読み取り専用入力と同じJST日に対して次を満たす。

1. 適格問題を `due-review`、`weak-prerequisite`、`unseen-primary`、
   `unseen-question` の固定順で決定論的に順位付けする。
2. 今日の `review | diagnosis` 完了を保持し、問題ID重複なし・正規Unit多様性優先で
   0〜3件の `LearningPlanItem` を返す。
3. 推薦理由をAttemptEventへ渡す境界では、公開純粋関数
   `recommendationReasonToAttemptReason` の固定表だけを使う。
4. Graph、QuestionBank、概念状態、履歴、recent、習熟入力、GameStateを変更しない。
5. 報酬条件、地域進行、バトル出題、v13保存形式に変化を加えない。

## 2. 実装範囲

### 2.1 In scope

- 承認済み公開型:
  - `LearningRecommendationReason`
  - `CompletedLearningPlanReason`
  - `LearningRecommendation`
  - `LearningPlanItem`
  - `LearningGradeScope`
- 推薦の公開入口 `rankLearningRecommendations(input)`
- 今日プランの公開入口 `buildLearningPlan(input)`
- 公開純粋変換 `recommendationReasonToAttemptReason(reason)`
- JST固定日始の内部計算
- QuestionBank実在性、概念リンク、学年範囲による候補適格性
- 正規Unit習熟と直接前提を使う4カテゴリ分類
- 固定比較キー、recent除外後の決定論的再利用
- 当日完了の復元、最大3件、問題ID一意性、Unit多様性優先
- 専用VitestによるRED → GREEN → REFACTOR

### 2.2 Out of scope

- `src/core/learning/index.ts` へのexport追加
- `src/scenes/**`、`src/ui/**`、Preact、Phaser、CSSの変更
- `Overworld.ts`、`roadmapPractice.ts`、バトル、イベント、Playgroundへの接続
- `src/questions/contracts.ts`、renderer、問題JSON、manifest、schemaの変更
- `GameState` schema version、migration、永続フィールドの追加
- `applyLearningRewards`、inventory、dex、報酬markerの変更
- Unit、Question、Concept IDの改名やalias表の追加
- 前提不足によるゲーム進行・出題のハードロック
- 推薦文言、カード、開始ボタン、空状態UI
- Phase 3 todo、`tasks/plan.md`、`tasks/todo.md` の編集

## 3. 現状調査と設計上の固定判断

### 3.1 Graphifyで確認した影響範囲

- `dueReviewQuestions` は既に `reviewQueue.ts`、`Overworld.ts`、複数テストから参照される。
  本モジュールの閾値 `estimatedRetention < 0.65` を追加するために既存関数を変更すると
  影響範囲が広がるため、`review.ts` は変更しない。
- `canonicalUnitId` はロードマップ、coverage、graph quality、scripts、テストなど広く参照される。
  推薦側は公開関数を利用するだけとし、alias表や正規化関数を変更しない。
- 新しい2つのCoreモジュールへ閉じたdirect importを使い、統合前に既存consumerを変更しない。

### 3.2 依存準備ゲート

実装開始前に、統合済み基点に以下が存在することを確認する。

- `canonicalUnitId(unitId)` がcurrent、legacy question、raw legacy nodeを同じ正規IDへ写す。
- `aggregateUnitMastery(mastery)` が既存ロードマップと同じ重み付き集約を返す。
- provider側の専用テストが成功し、入力不変契約が固定されている。

`aggregateUnitMastery` が存在しない、raw legacy nodeを扱えない、または承認済みprovider仕様と
署名・意味が異なる場合は、推薦側にfallback、コピー、alias表を作らない。コード編集を開始せず、
統合担当へ依存不足として返す。

### 3.3 公開入口と入力契約

承認済みの公開型名に加え、実装入口を次で固定する。

```ts
export function rankLearningRecommendations(
  input: LearningRecommendationPolicyInput,
): LearningRecommendation[];

export function buildLearningPlan(input: LearningPlanInput): LearningPlanItem[];
```

`LearningRecommendationPolicyInput` は以下を読み取り専用で受け取る。

- `graph: CurriculumGraph`
- `questionBank: Pick<QuestionBank, 'get' | 'all'>`
- `conceptStates: Readonly<ConceptStateData>`
- `attempts: readonly AttemptEvent[]`
- `recentQuestionIds: readonly string[]`
- `unitMastery`: `aggregateUnitMastery` が受け取る保存済み習熟辞書
- `grandfatheredUnitIds: readonly string[]`
- `gradeScope: LearningGradeScope`
- `evaluationNow: number`

`LearningPlanInput` は同じ推薦入力から `evaluationNow` を除き、`now: number` を受け取る。
`buildLearningPlan` がJST日始を一度だけ求め、その値を推薦計算と完了日判定の両方へ渡す。
既得進捗IDはcallerが既存 `roadmapSnapshot.ts` から導出して渡し、本モジュールは保存実装を
importしない。

### 3.4 内部構造の固定判断

- QuestionBankの `all()` を複製し、Graphの `questionLinks` を問題IDで索引化する。
- QuestionBankにないリンク、リンクのない問題、学年範囲外の問題は候補にしない。
- `lower = includeLower ? 1 : grade`、
  `upper = challengeHigher ? 6 : grade` を問題と対象概念へ同じように適用する。
- `canonicalUnitId(question.unit)` を唯一の `actualUnitId` とする。
- `aggregateUnitMastery(unitMastery)` を1回だけ計算し、保存済み別名キーを直接参照しない。
- Unit修得判定は、集約値、非misconception概念の完全性、各概念の
  `independentSuccesses`、`grandfatheredUnitIds` を承認済み仕様どおり評価する。
- 直接前提は `kind === 'prerequisite'` の1辺だけを使い、推移閉包を作らない。
- due判定は既存 `estimatedRetention` を使うが、仕様固有の `< 0.65` と寄与合計は
  新モジュール内で計算する。既存 `dueReviewQuestions` は変更しない。
- 各問題は最上位カテゴリだけを採用する。比較キーを全て明示し、入力順、Map挿入順、乱数に
  依存しない。
- `conceptIds` は重複を除きASCII昇順にした新しい配列とし、結果オブジェクトも毎回新しくする。
- recentは新しいSetへコピーし、freshを全件順位付けした後、reusableを同じ比較規則で続ける。
- 完了項目は当日の最初の対象イベントだけを採用し、詳細4値reasonを推測しない。
- 全ての `sort` はコピーした配列へだけ行う。

## 4. 依存グラフと実装順序

```text
Wave 1 integrated base
  canonicalUnitId + aggregateUnitMastery
                |
                v
Slice 1: public contracts + eligibility + reason mapping (RED/GREEN)
                |
                v
Slice 2: four-category deterministic ranking + recent reuse (RED/GREEN)
                |
          Checkpoint A
                |
                v
Slice 3: JST day + completed-item reconstruction (RED/GREEN)
                |
                v
Slice 4: max-3 plan fill + unit diversity + compatibility regressions
                |
          Checkpoint B
                |
                v
Agent handoff -> integration owner wiring/export/UI/full gates
```

Slice 1と2は `recommendationPolicy.ts` の純粋な順位付けを完成させる。Slice 3はその公開入口を
使って日付・完了復元を構成し、Slice 4で今日プラン全体の選択規則と非破壊回帰を閉じる。
各スライスは先に失敗するテストを追加し、意図した理由でREDであることを確認してから最小実装を
加える。

## 5. 薄い検証可能スライス

### Slice 0 — 依存準備と所有権チェック

**目的:** 誤った基点で重複実装を始めない。

**変更候補ファイル:** なし（読み取り専用チェック）

**手順:**

1. branch、基点commit、`git status --short` を記録する。
2. `unitProgress.ts` とproviderテストから正式署名・集約式・raw legacy対応を確認する。
3. Graphify code-only graphで `canonicalUnitId`、`aggregateUnitMastery`、`estimatedRetention`、
   `QuestionBank`、`AttemptEvent` のcaller/affectedを確認する。
4. 所有ファイル外の実装変更が不要であることを確認する。

**受入条件:**

- Wave 1契約が統合済みで、direct importできる。
- 作業ツリーが既存ユーザー変更を含む場合、その変更と競合しない。
- 不足時はコードを書かず、統合担当へ具体的な不足symbolと基点commitを返す。

**検証:** Graphify query/affectedとread-only inspection。外部LLM、semantic labelingは使わない。

### Slice 1 — 公開契約、適格性、理由変換

**目的:** 候補母集団と保存境界の理由変換を最小の垂直スライスで固定する。

**変更候補ファイル（2件）:**

- `src/core/learning/recommendationPolicy.ts`
- `tests/unit/learningRecommendationPolicy.test.ts`

**RED:**

1. 公開型を使う最小fixtureと `recommendationReasonToAttemptReason` の4行固定表を追加する。
2. QuestionBankに存在するリンク付き問題だけが返ること、学年下限・上限、
   `includeLower`、`challengeHigher` を境界値で記述する。
3. removed question、linkなし、対象概念が学年外の問題がfallbackで復活しないことを記述する。
4. 実装前に対象testが未定義exportまたは期待結果不一致で失敗することを確認する。

**GREEN:**

- 承認済み公開型、入力型、理由変換、適格問題索引を実装する。
- 最初は `unseen-question` までを返せる最小分類で、正規 `actualUnitId` と新しい
  `conceptIds` 配列を生成する。
- providerの `canonicalUnitId` と `aggregateUnitMastery` をdirect importする。

**受入条件:**

- 学年範囲とQuestionBank実在性を緩めない。
- `due-review` だけが `review`、残り3値が `diagnosis` へ変換される。
- 既存契約・schema・教材ファイルを変更しない。

**Focused verification:**

```bash
pnpm vitest run tests/unit/learningRecommendationPolicy.test.ts
pnpm test:related src/core/learning/recommendationPolicy.ts tests/unit/learningRecommendationPolicy.test.ts
```

### Slice 2 — 4カテゴリ順位、tie-break、recent再利用

**目的:** 推薦ポリシーを完全にし、入力順に依存しない決定論を固定する。

**依存:** Slice 1

**変更候補ファイル（2件）:**

- `src/core/learning/recommendationPolicy.ts`
- `tests/unit/learningRecommendationPolicy.test.ts`

**RED:**

1. `dueAt === evaluationNow` かつ定着率 `< 0.65`、期限前、ちょうど`0.65`、
   複数概念の重み付き `duePriority` を表形式fixtureで記述する。
2. 未修得primary目標の1辺前提、修得済み前提の除外、孫前提の非対象、
   stateなしの `weakness === 1` を記述する。
3. unseen primary、unseen question、カテゴリ優先、固有優先値、diagnosticValue、
   ASCII questionIdの全tie-breakを記述する。
4. 入力配列を逆順にした同値fixture、recent fresh-first/reuse、重複排除、deep freeze入力で
   現行最小実装が失敗することを確認する。

**GREEN:**

- 問題ごとに最上位カテゴリと内部priorityを1件だけ作る。
- due寄与、直接前提weakness、primary未確認、AttemptEvent全履歴の未出題判定を実装する。
- 明示的comparatorで全候補を並べ、freshとreusableを安定した2パスで連結する。
- 集約習熟、概念完全性、independent successes、grandfathered IDを共通の内部修得判定へ集約する。

**受入条件:**

- 同じ入力と `evaluationNow` は完全に同じ配列を返す。
- 1問題は最上位カテゴリ1件だけで、同一questionIdを重複しない。
- Graph、states、attempts、recent、QuestionBank、習熟入力を変更しない。

**Focused verification:**

```bash
pnpm vitest run tests/unit/learningRecommendationPolicy.test.ts
pnpm test:related src/core/learning/recommendationPolicy.ts tests/unit/learningRecommendationPolicy.test.ts
```

### Checkpoint A — 推薦ポリシー単体レビュー

- 仕様の4カテゴリ表とテストケースを1対1で照合する。
- comparatorに全キーがあり、入力順や暗黙stable sortを最終tie-breakにしていないことを確認する。
- direct import先がWave 1 providerだけで、Scene/UI/save/reward依存がないことを確認する。
- `git diff --check` と対象testを通し、ここまでを1論理commit候補にする。

### Slice 3 — JST日境界と完了項目の復元

**目的:** 保存済みAttemptEventから、その日すでに取り組んだ有効問題だけを純粋に復元する。

**依存:** Slice 2

**変更候補ファイル（3件）:**

- `src/core/learning/learningPlan.ts`
- `tests/unit/learningPlan.test.ts`
- `src/core/learning/recommendationPolicy.ts`（共有入力型のexport調整が必要な場合だけ）

**RED:**

1. JST 00:00直前/直後、同じJST日の異なる `now`、翌日境界を固定timestampで記述する。
2. 当日の `review | diagnosis` だけがscore、timedOut、attemptsに関係なく完了し、
   battle/event/playground/unknownは完了しないことを記述する。
3. 同一問題の最初のイベントを `(answeredAt, id, questionId)` で確定し、最大3件になることを
   記述する。
4. QuestionBankから消えた問題、リンクなし問題をダミー完了項目にしないことを記述する。

**GREEN:**

- `now` から固定式で `evaluationNow` を一度だけ作る。
- 対象イベントをコピー、filter、sortし、questionIdごとの最初だけを残す。
- QuestionBankとGraphから `actualUnitId` と新しい `conceptIds` を復元する。
- 完了reasonは保存された `review | diagnosis` を保持し、4値詳細reasonへ逆変換しない。

**受入条件:**

- 同じJST日と同じ学習状態では未完了候補が時刻だけで入れ替わらない。
- 完了項目は `completed: true` のunion branchとなり、一般reasonだけを持つ。
- 削除済み・不正問題のplaceholderを作らない。

**Focused verification:**

```bash
pnpm vitest run tests/unit/learningPlan.test.ts
pnpm test:related src/core/learning/learningPlan.ts tests/unit/learningPlan.test.ts
```

### Slice 4 — 最大3件、Unit多様性、互換回帰

**目的:** 完了を保持した今日プランを現在の推薦で埋め、0〜3件の最終契約を閉じる。

**依存:** Slice 3

**変更候補ファイル（4件）:**

- `src/core/learning/recommendationPolicy.ts`
- `src/core/learning/learningPlan.ts`
- `tests/unit/learningRecommendationPolicy.test.ts`
- `tests/unit/learningPlan.test.ts`

**RED:**

1. 完了questionIdを未完了候補から除き、プラン全体を一意にするケースを追加する。
2. 既存Unitと異なる候補を第1パス、同Unit候補を第2パスで採る多様性ケースを追加する。
3. 適格問題不足時の0件・1件・2件、recentしかない場合の再利用を追加する。
4. legacy/current/mixed習熟、grandfathered ID、deep freeze入力、再計算を含む回帰で、
   報酬・保存・入力が変わらないことを確認する。

**GREEN:**

- 完了最大3件を先頭に固定し、残り枠だけ `rankLearningRecommendations` から補う。
- 既存 `actualUnitId` のSetを使う異Unit優先パスと、同Unit許容パスを実装する。
- 3件に満たない場合はそのまま返し、placeholderや学年制約緩和を行わない。
- 結果と各 `conceptIds` を新規値として返し、入力参照を外へ漏らさない。

**受入条件:**

- 全項目でquestionIdが一意、完了が先頭、全長が0〜3件である。
- 未完了は詳細4値、完了は保存済み一般2値のdiscriminated unionを維持する。
- reward state、schema v13、attempt history、recent、masteryを一切書き換えない。

**Focused verification:**

```bash
pnpm vitest run tests/unit/learningRecommendationPolicy.test.ts tests/unit/learningPlan.test.ts
pnpm test:related src/core/learning/recommendationPolicy.ts src/core/learning/learningPlan.ts tests/unit/learningRecommendationPolicy.test.ts tests/unit/learningPlan.test.ts
pnpm check:fast
pnpm validate:curriculum-graph
```

### Checkpoint B — Agent実装完了レビュー

- 承認済みspecのTesting strategyと専用testを項目単位で照合する。
- `git diff --check`、secret scan、所有ファイル一覧、生成物混入を確認する。
- Graphify code-only graphをmaterial change後に更新し、依存逆流がないことを確認する。
- 変更を意味のまとまったcommitにし、共有ブランチへmerge/pushしない。
- 並行作業中は `pnpm test`、`pnpm build`、`pnpm check:full` を実行しない。

## 6. REDテスト戦略

各スライスは次の順を守る。

1. 仕様の1行動だけを表すfixtureと期待値を追加する。
2. 対象testだけを実行し、失敗が未実装の契約に由来することを確認する。
3. syntax error、壊れたfixture、環境不足が原因ならREDとして数えず修正する。
4. そのテストを通す最小実装を加える。
5. 同じ対象testをGREENにし、関連回帰を実行する。
6. 重複helperや比較処理を整理し、同じtestがGREENのままか確認する。

テストfixtureは時計、乱数、I/O、ブラウザに依存させず、timestamp、Graph、QuestionBank、
ConceptState、AttemptEvent、masteryを明示する。QuestionBankは公開 `add/get/all` の意味を壊す
独自mockを避け、最小の実インスタンスまたは同じ読み取りinterfaceを満たす固定fixtureを使う。

## 7. 集中検証マトリクス

| 契約                     | 主テスト                               | 追加確認                               |
| ------------------------ | -------------------------------------- | -------------------------------------- |
| 学年・QuestionBank適格性 | `learningRecommendationPolicy.test.ts` | 境界1/6、lower/higher組合せ            |
| due順位                  | `learningRecommendationPolicy.test.ts` | `dueAt`、0.65、overdue cap、weight合計 |
| 直接前提                 | `learningRecommendationPolicy.test.ts` | 1辺のみ、修得済み除外、stateなし       |
| unseenカテゴリ           | `learningRecommendationPolicy.test.ts` | primary限定、全AttemptEvent履歴        |
| 決定論                   | `learningRecommendationPolicy.test.ts` | 逆順入力、全tie-break、recent再利用    |
| JST日境界                | `learningPlan.test.ts`                 | 00:00直前/直後、同日、翌日             |
| 完了復元                 | `learningPlan.test.ts`                 | reason、重複、deleted question         |
| 最大3件・多様性          | `learningPlan.test.ts`                 | 異Unit優先、同Unit fallback、0〜2件    |
| 非破壊                   | 両専用test                             | deep freeze、新規結果配列/オブジェクト |
| v13・報酬維持            | 両専用test + 統合確認                  | schema/reward moduleにdiffなし         |

Agent側の最終focused gateは次とする。

```bash
pnpm vitest run tests/unit/learningRecommendationPolicy.test.ts tests/unit/learningPlan.test.ts
pnpm test:related src/core/learning/recommendationPolicy.ts src/core/learning/learningPlan.ts tests/unit/learningRecommendationPolicy.test.ts tests/unit/learningPlan.test.ts
pnpm check:fast
pnpm validate:curriculum-graph
git diff --check
```

## 8. リスクと緩和策

| リスク                    | 影響                              | 緩和策                                                    |
| ------------------------- | --------------------------------- | --------------------------------------------------------- |
| Wave 1未統合              | alias別に異なる推薦、重複ロジック | Slice 0を停止ゲートにし、fallbackを作らない               |
| 既存review関数の変更      | Overworld等へ広い回帰             | `estimatedRetention` だけを再利用し、新モジュールへ閉じる |
| mastery完全性の簡略化     | 部分状態を修得済みに誤判定        | 非misconception概念の完全性と2つの修得条件をfixture化     |
| 暗黙の配列順              | 同じ入力で推薦が変動              | 全比較キーとASCII questionIdを明示し、逆順fixtureを使う   |
| recent処理で順位を崩す    | 古い問題が新規候補より先になる    | 同じcomparator後のfresh/reusable 2パスを固定する          |
| JST境界ずれ               | 日中再読込やUTC境界でプラン交換   | 固定+09:00式を1回だけ計算し境界testを置く                 |
| 完了reasonの逆推測        | 保存済み意味と表示が不一致        | AttemptEventの2値を保持し4値への逆変換を禁止する          |
| 削除済み問題の復元        | 架空カード、undefined参照         | QuestionBankとlinkから復元不能なら項目を作らない          |
| 入力mutation              | GameStateやGraphの静かな破損      | readonly型、コピー後sort、deep freeze回帰                 |
| 保存・報酬へのscope creep | v13非互換、二重報酬               | schema/reward/callerを所有外とし、diff監査する            |
| 全体gateの並列実行        | CI/ローカル資源競合               | Agentはfocused gateだけ、統合担当が一度だけfull gate      |

## 9. 報酬・v13セーブ・所有権の保全

実装commitは次を変更しない。

- `src/core/progression/learningRewards.ts` と将来の正規化済み報酬実装
- `masteredRewardUnits`、`correctedRewardQuestionIds`、inventory、dex
- `src/core/state/schema.ts`、`migrations.ts`、schema version 13
- `src/core/state/roadmapSnapshot.ts` の既得進捗保存形式
- `src/core/learning/unitAliases.ts`、`unitProgress.ts` のprovider契約
- `src/scenes/**`、`src/ui/**`、`src/questions/**`、`content/**`
- 地域進行、レベル上限、バトルの7割弱点／3割復習選択

本モジュールはGameState全体を受け取らず、必要な読み取り値だけを引数で受ける。推薦計算は
AttemptEventを作成せず、報酬関数を呼ばず、保存を行わない。`recommendationReasonToAttemptReason`
は後続consumerがAttemptEventを作るときの唯一の詳細reason変換契約とする。

## 10. 統合担当へのhandoff

Agent実装完了報告には以下を含める。

- 作業branch名、基点commit、各実装commit ID
- 変更した4ファイルと各スライスの要約
- REDで確認した失敗理由と、GREEN後のfocused command結果
- `pnpm check:fast`、`pnpm validate:curriculum-graph`、`git diff --check` の結果
- Graphifyで確認した依存方向と、生成物をcommitしていないこと
- working treeがcleanか、既存の無関係変更を残したか

統合担当はAgent commitを取り込んだ後にのみ、必要に応じて以下を行う。

1. `src/core/learning/index.ts` のexportと、後続roadmap/UI consumerの接続を別commitで行う。
2. AttemptEvent作成側で `recommendationReasonToAttemptReason` を使い、保存schemaを変えない。
3. 代表v13セーブをlegacy/current/mixedで読み、推薦計算 → 回答 → 保存 → 再読込して、
   既存進捗・報酬marker・inventory・dexが減らず二重付与もないことを確認する。
4. 統合済み状態でGraphify code-only graphを更新し、materialな影響範囲を再確認する。
5. 並行Agent作業が止まった統合済みbranchで `pnpm check:full` を一度だけ実行する。
6. UI接続Wave完了後に正規preview `127.0.0.1:4174` を最新buildから起動し、
   初期状態と必要な旧save状態を確認する。

Agentは統合担当の指示なしに共有branchへmergeまたはpushせず、4174の正規previewを更新しない。

## 11. 完了チェックポイント

### Dependency readiness

- [ ] Wave 1 providerが統合済み
- [ ] Graphify code-onlyで依存・影響範囲を確認
- [ ] owned files外の変更不要を確認

### Recommendation policy complete

- [ ] Slice 1と2のRED/GREEN記録あり
- [ ] 4カテゴリ、全tie-break、recent再利用が専用testで成功
- [ ] 入力不変と正規Unit契約が成功

### Learning plan complete

- [ ] Slice 3と4のRED/GREEN記録あり
- [ ] JST境界、完了復元、最大3件、Unit多様性、0〜2件が成功
- [ ] completed unionのreasonを推測していない

### Handoff ready

- [ ] 変更は所有4ファイルだけ
- [ ] focused gate、fast gate、content graph validation成功
- [ ] schema/reward/content/UI/Sceneにdiffなし
- [ ] branch、commit、検証、clean statusを報告

## 12. 未解決事項

なし。依存providerが承認済み契約を満たさない場合は設計上の未解決事項として推薦側で補完せず、
Dependency readinessの失敗として統合担当へ戻す。
