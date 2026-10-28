# Spec: learning-recommendation-policy

## Status

- Initiative: 学習ロードマップ Curriculum v2
- Module id: `learning-recommendation-policy`
- Phase: 1 — specification only
- Depends on: `unit-progress-normalization`
- Human gate: this specification must be approved before planning or implementation starts
- Capability map: `CAPABILITY_MAP-learning-roadmap-curriculum-v2.md`

## Objective

期限を迎えた復習、未修得の直接前提、未確認の primary 目標、まだ出していない問題を、
一つの純粋で決定論的なポリシーによって順位付けする。その順位を使い、子どもがその日に
取り組む問題を最大3件返す。

このモジュールは推薦だけを行う。不正解や前提不足をプレイのハードロックにせず、既存の
報酬、セーブ、地域進行、バトルの7割弱点／3割復習選択を変更しない。

成功とは、同じ読み取り専用入力と同じ JST 日付に対して、推薦ID、実際の正規Unit、理由、
概念IDが完全一致し、問題不足時には0〜2件を正しく返せることである。

## User-visible intent

- 復習期限が来た知識を最初に思い出す。
- 新しい目標でつまずく前に、弱い直接前提を学び直す。
- まだ学習証拠のない primary 目標を確認する。
- それらがなければ、未出題問題で新しい学習証拠を集める。
- 推薦がなくてもゲームや学習画面を自由に続けられる。

## Capability boundary

### Owns

- `src/core/learning/recommendationPolicy.ts`
  - 推薦候補の適格性判定
  - 4段階の順位付け
  - 直近問題の除外と決定論的な再利用
  - 推薦結果の `questionId`、`actualUnitId`、`reason`、`conceptIds` の作成
- `src/core/learning/learningPlan.ts`
  - JST の日始 `evaluationNow` の計算
  - 同日完了項目の復元
  - 完了項目を保持した最大3件の今日プラン
  - 問題ID重複排除と正規Unitの多様性優先
- 上記2ファイルだけを対象とする専用 Vitest

### Consumes but does not own

- `CurriculumGraph`、`QuestionConceptLink`、`ConceptStateData`
- `QuestionBank` の読み取りAPI (`get` / `all`)
- 既存 `AttemptEvent[]`、`learning.recent`、学年設定
- `unit-progress-normalization` が提供する正式シンボル `canonicalUnitId` と
  `aggregateUnitMastery`
- 既存の `estimatedRetention` と復習緊急度の意味

### Explicitly out of scope

- Scene、Preact UI、CSS、`src/core/learning/index.ts`
- `src/questions/contracts.ts`、Question renderer、Question JSON、生成schema
- `GameState` schema version、migration、新しい永続フィールド
- `Overworld.ts`、`roadmapPractice.ts`、バトル出題への接続
- 推薦文言、RubyText、推薦カードの見た目
- Unit、Question、Concept IDの改名
- 報酬付与、問題回答の記録、概念状態の更新
- 前提関係を使ったゲーム進行または学習画面のハードロック

## Tech stack and project structure

- TypeScript strict。Phaser、Preact、DOM、保存APIに依存しない純粋ロジックとする。
- テストは Vitest の small unit test とし、I/O、時計、乱数、ブラウザを使わない。
- 新しい依存パッケージを追加しない。
- 実装予定ファイル:
  - `src/core/learning/recommendationPolicy.ts`
  - `src/core/learning/learningPlan.ts`
  - `tests/unit/learningRecommendationPolicy.test.ts`
  - `tests/unit/learningPlan.test.ts`

## Public contract

次の公開型名、関数名、意味上の契約を固定し、実装計画で別名へ変更しない。

```ts
export type LearningRecommendationReason =
  | 'due-review'
  | 'weak-prerequisite'
  | 'unseen-primary'
  | 'unseen-question';

export type CompletedLearningPlanReason = 'review' | 'diagnosis';

export interface LearningRecommendation {
  questionId: string;
  actualUnitId: string;
  reason: LearningRecommendationReason;
  conceptIds: string[];
}

export type LearningPlanItem =
  | (LearningRecommendation & { completed: false })
  | {
      questionId: string;
      actualUnitId: string;
      reason: CompletedLearningPlanReason;
      conceptIds: string[];
      completed: true;
    };

export interface LearningGradeScope {
  grade: Grade;
  includeLower: boolean;
  challengeHigher: boolean;
}

export function recommendationReasonToAttemptReason(
  reason: LearningRecommendationReason,
): CompletedLearningPlanReason;
```

`LearningRecommendation` の返り値は必ず新しいオブジェクトと新しい `conceptIds` 配列にする。
`conceptIds` は対象 `QuestionConceptLink` の概念IDを重複排除し、ASCII IDの昇順で返す。

未完了推薦の `reason` は4段階の順位と一対一に対応する。

- `due-review`: 期限到来候補
- `weak-prerequisite`: 弱い直接前提
- `unseen-primary`: 未確認primary目標
- `unseen-question`: 未出題問題

詳細reasonはGameStateへ保存しない。問題を出して `AttemptEvent` を記録するときだけ、公開された
純粋変換 `recommendationReasonToAttemptReason` を次の固定表で適用する。

| LearningRecommendationReason | AttemptEvent.reason |
|---|---|
| `due-review` | `review` |
| `weak-prerequisite` | `diagnosis` |
| `unseen-primary` | `diagnosis` |
| `unseen-question` | `diagnosis` |

この変換は入力reasonだけで決まり、GameState、時刻、QuestionBankを参照しない。既存
`AttemptEvent.reason` enum、永続schema、migrationは変更しない。

## Time contract: JST-fixed `evaluationNow`

「今日」は Asia/Tokyo の 00:00:00.000 以上、翌日の 00:00:00.000 未満とする。
日本標準時に夏時間はないため、日始は UTC+09:00 の固定オフセットで求める。

```ts
const DAY_MS = 86_400_000;
const JST_OFFSET_MS = 9 * 60 * 60 * 1_000;
evaluationNow = Math.floor((now + JST_OFFSET_MS) / DAY_MS) * DAY_MS - JST_OFFSET_MS;
```

- `learningPlan.ts` は呼び出し元から渡された `now` から `evaluationNow` を一度だけ作る。
- 推薦ポリシー、定着率推定、期限判定はすべて同じ `evaluationNow` を使う。
- `Date.now()` を純粋関数内で呼ばず、タイムゾーンやロケールの暗黙設定に依存しない。
- 同じ日なら、単なる時間経過や再読み込みだけで未完了候補を入れ替えない。
- 回答によって `attempts` または `conceptStates` が変わった場合は、同じ
  `evaluationNow` のまま未完了候補を再計算してよい。
- 完了判定の日付には `AttemptEvent.answeredAt` を使う。

## Grade and QuestionBank eligibility

候補は次のすべてを満たす場合だけ適格とする。

1. `QuestionConceptLink.questionId` が `QuestionBank.get()` に実在する。
2. 問題に少なくとも1つの有効な概念リンクがある。
3. 問題の `grade` が現在の学年範囲を満たす。
4. 問題の `subject`、`unit`、IDはQuestionBankに読み込まれた値を正とする。
5. `actualUnitId` は問題の `unit` を `unit-progress-normalization` の正規化契約へ通した値である。

学年範囲は以下で固定する。

```text
lower = includeLower ? 1 : grade
upper = challengeHigher ? 6 : grade
eligible = lower <= question.grade <= upper
```

`challengeHigher` は既存ロードマップ挙動を維持し、trueなら小6までの上位学年を許可する。
Concept側の目標学年も同じ範囲を満たすものだけを対象にする。

QuestionBankにない古いリンク、リンクのない問題、学年範囲外の問題は候補にせず、
フォールバックとして学年制約を緩めない。該当問題がなければ空または0〜2件を返す。

## Existing mastery contract

このモジュールは修得判定を再実装せず、`unit-progress-normalization` の正式シンボル
`aggregateUnitMastery` が正規Unit単位で返す共通判定を使う。問題の実Unit正規化には同じ
依存先の `canonicalUnitId` を使う。修得済みとは、既存ロードマップと同じく次のいずれかを
満たす状態である。

- Unitに属する非misconception概念の状態がすべて揃い、集約習熟度 `>= 0.8` かつ
  合計回答数 `>= 3`
- Unitに属する非misconception概念の状態がすべて揃い、すべての概念で
  `independentSuccesses >= 2`
- 旧セーブ由来の既得進捗が `roadmapSnapshot.ts` によりgrandfatheredされている

概念状態が一部しかない場合は、完全性を満たしたと見なさない。既存セーブのUnit習熟値、
legacy/current/mixedキーの集約、grandfathered判定の責務は依存モジュール側に置く。

## Deterministic ranking policy

各適格問題を最大1つの候補へまとめ、該当する最上位カテゴリを採用する。共通順位は固定で、
`期限到来 → 弱い直接前提 → 未確認primary目標 → 未出題問題` とする。

### 1. 期限到来

問題リンクが参照する概念のうち、次を満たすものが1つ以上あれば該当する。

- `ConceptState` が存在する
- `attempts > 0`
- `dueAt <= evaluationNow`
- `estimatedRetention(state, evaluationNow) < 0.65`

カテゴリ内の優先値は、既存 `dueReviewQuestions` の意味を維持する。

```text
overdueDays = max(0, evaluationNow - dueAt) / DAY_MS
need = 1 - estimatedRetention(state, evaluationNow)
contribution = linkWeight * need * (1 + min(7, overdueDays) / 7)
duePriority = 該当概念 contribution の合計
```

`duePriority` の降順で並べ、`reason` は `due-review` とする。

### 2. 弱い直接前提

- `prerequisite` relation は `from` が前提、`to` が目標である。
- 対象は、学年制約内でQuestionBankにprimary問題が存在する未修得目標概念の、
  **1辺だけ離れた直接前提**に限る。推移閉包や孫前提はこのカテゴリでたどらない。
- 前提Unitが既存修得条件を満たす場合、その前提概念は候補にしない。
- 前提問題は、その前提概念を `role: primary` で持つリンクから選ぶ。
- 概念状態がない場合は `understanding = 0`、`confidence = 0` として扱う。

```text
weakness = 1 - understanding * confidence
```

`weakness` の降順で並べ、`reason` は `weak-prerequisite` とする。返す `actualUnitId` は
目標Unitではなく、実際に出題する前提問題の正規Unitである。前提不足は推薦理由にだけ使い、
目標をロックしない。

### 3. 未確認primary目標

問題リンクに `role: primary` の概念があり、その `ConceptState` が存在しない、または
`attempts === 0` なら該当する。primary以外だけのリンクはこのカテゴリに入れない。
`reason` は `unseen-primary` とする。

### 4. 未出題問題

既存の全 `AttemptEvent` に同じ `questionId` が一度もない適格問題を対象とする。
イベント種別やscoreには依存しない。`reason` は `unseen-question` とする。

### Tie-breaking

比較キーは次の順で、途中に乱数を入れない。

1. カテゴリ番号の昇順
2. カテゴリ固有優先値の降順（期限到来の `duePriority`、弱い前提の `weakness`）
3. `QuestionConceptLink.diagnosticValue` の降順
4. `questionId` のASCII辞書順昇順

カテゴリ固有優先値を持たないカテゴリは同値として3へ進む。`Math.random`、seeded RNG、
配列の入力順、Mapの偶然の挿入順を順位に使わない。

## Recent-question exclusion and reuse

- `recentQuestionIds` は読み取り専用入力とし、Setへコピーして使う。
- まず直近問題を除いた候補を上記の同じ順位規則で選ぶ。
- 新しい候補を使い切った後だけ、直近問題を同じ順位規則で再利用して空きを埋める。
- 再利用時も問題ID重複、学年、QuestionBank、概念リンク、最大件数の条件を緩めない。
- 直近除外のために無効な問題や学年範囲外問題を採用してはならない。

## Learning plan contract

今日プランは次の順で構築する。

1. `evaluationNow <= answeredAt < evaluationNow + DAY_MS` かつ `reason` が `review` または
   `diagnosis` のAttemptEventを集める。
2. `questionId` ごとに最初の完了だけを残す。score、timedOut、attemptsの値に関係なく完了とする。
3. `(answeredAt, event.id, questionId)` の昇順で並べ、最大3件まで `completed: true` として先頭に保持する。
4. 完了問題を除いた現在の推薦を再計算し、最大3件になるまで `completed: false` で補う。

`LearningPlanItem` は `completed` を判別子とするdiscriminated unionである。未完了項目は
4値の詳細reasonを保持する。完了項目の `reason` は、その問題について当日最初に採用した
AttemptEventの `review` または `diagnosis` をそのまま使う。永続化で失われた4値の詳細reasonを、
現在の状態や順位から推測して復元してはならない。

battle、event、playground、unknown のAttemptEventは今日プランの完了に数えない。
完了項目もQuestionBankと概念リンクから必須出力を再構築できることを条件とし、削除済みまたは
不正な問題をダミー項目として作らない。

問題IDはプラン全体で一意にする。未完了候補を補うときは次の2パスで正規Unitの多様性を優先する。

1. すでにプランにある `actualUnitId` と異なる候補を順位順に採用する。
2. まだ空きがあれば、同じUnitの残候補を順位順に採用する。

Unit多様性は優先であり、同Unitを絶対禁止する条件ではない。適格な一意問題が足りなければ、
0件、1件、2件をそのまま返す。存在しない3件目や無効なプレースホルダーを作らない。
0件は正常な空状態であり、消費側は無効な開始ボタンや架空の推薦カードを表示しない。

## Non-destructive input contract

ポリシーとプラン生成は、次の入力を一切変更しない。

- CurriculumGraphの `concepts`、`relations`、`questionLinks`
- ConceptStateDataと各ConceptState
- AttemptEvent配列と各イベント
- `recentQuestionIds`
- QuestionBank内部の配列、Map、QuestionBase
- Unit進捗の集約入力と出力
- GameState全体

入力配列へ直接 `sort`、`splice`、`push` を行わず、必要な配列、Map、Setは関数内で新しく作る。
ロードマップを開く、推薦を計算する、空状態を表示するだけではGameStateを変更しない。

## Existing rewards and save compatibility

既存の「まなびの かけら」条件を変えない。

- Unitを3回答以上かつ習熟度0.80以上にしたときの初回報酬
- 異なる3問のまちがい直しを完全正答したときの報酬
- 同じUnit、同じ問題、再読み込み、再戦による二重付与防止

このモジュールは `applyLearningRewards` を呼ばず、inventory、dex、
`masteredRewardUnits`、`correctedRewardQuestionIds` を変更しない。報酬IDの正規化は
`unit-progress-normalization` の `canonicalUnitId` と `aggregateUnitMastery` の責務とし、
ここで別のalias表を作らない。

セーブ互換性は次を満たす。

- 新しい永続フィールド、schema version、migrationを追加しない。
- 既存の `learning.attempts`、`conceptStates`、`recent`、`grade`、`includeLower`、
  `challengeHigher` と既得進捗を読み取り専用で使う。
- legacy/current/mixed Unitキーでも、依存モジュールの正規化後は同じ推薦結果になる。
- 旧セーブの学習報酬、地域進行、所持品、ロードマップ既得進捗を巻き戻さない。
- v13代表セーブのimport、回答、保存、reloadで既存データを保持できることを統合段階で確認する。

## Code style

- 型境界を明示し、`any`、暗黙の現在時刻、暗黙の乱数、silent fallbackを使わない。
- 比較ロジックは1か所に置き、カテゴリごとの条件分岐をSceneやUIへ漏らさない。
- 既存の正規化、定着率、修得判定を再利用し、近似した別実装を作らない。
- 候補生成と最大3件のプラン組み立てを分け、各純粋関数を小さく保つ。

```ts
const ranked = [...candidates].sort(compareRecommendationCandidates);
const fresh = ranked.filter((candidate) => !recentIds.has(candidate.questionId));
const reusable = ranked.filter((candidate) => recentIds.has(candidate.questionId));
return selectDiverseUnits([...fresh, ...reusable], limit);
```

## Testing strategy

実装はREDテストから始め、状態ではなく入力と出力の契約を検証する。固定fixtureに対して
オブジェクト完全一致を使い、モック時計や乱数は使わない。

### `learningRecommendationPolicy.test.ts`

- 期限到来が他の3カテゴリより優先される。
- `dueAt === evaluationNow` かつ定着率 `< 0.65` は期限到来、`0.65` 以上は対象外。
- `attempts === 0` の初期状態を期限到来として扱わない。
- 期限前は対象外で、既存式の `duePriority` が降順になる。
- 未修得の直接前提だけを対象にし、修得済み前提と孫前提を除く。
- 欠落状態を弱さ1として扱い、`1 - understanding * confidence` で並ぶ。
- primaryかつ `attempts === 0` を未確認にし、supportingだけのリンクを除く。
- 全履歴にない問題だけを未出題にする。
- 同一問題が複数カテゴリに入る場合、最上位カテゴリを1件だけ返す。
- 同値を `diagnosticValue` 降順、`questionId` 昇順で決める。
- QuestionBank不在、リンク不在、学年範囲外を除外する。
- `includeLower`、`challengeHigher`、小1、小6の境界と、`challengeHigher=true` で
  小6まで許可されることを検証する。
- 前提問題の `actualUnitId` が目標Unitではなく出題問題の正規Unitになる。
- 4値の詳細reasonが各順位カテゴリと一致する。
- `recommendationReasonToAttemptReason` が `due-review` だけを `review`、他3値を
  `diagnosis` へ変換し、入力を変更しない。
- 直近問題より新しい候補を優先し、新しい候補不足時だけ同じ順位で再利用する。
- 同じ入力と `evaluationNow` を複数回渡して完全に同じ出力になる。
- deep freezeしたGraph、状態、履歴、recent、QuestionBaseを変更しない。

### `learningPlan.test.ts`

- UTC日付境界をまたいでもJST 00:00へ固定する。
- 同じJST日の異なる時刻で `evaluationNow` と未完了候補が同じになる。
- JST 00:00ちょうどを当日、翌日00:00ちょうどを次の日として扱う。
- review/diagnosisの誤答と時間切れも完了し、battle/eventは完了しない。
- `completed: false` は4値の詳細reason、`completed: true` は `review | diagnosis` の
  一般reasonを持ち、完了項目の詳細reasonを推測しない。
- 完了問題を一意化して先頭に保持し、残りだけ再計算する。
- 問題IDを重複させず、異なる正規Unitを先に選ぶ。
- 空、1件、2件、3件と、完了が3件以上ある境界を検証する。
- 回答で状態が変われば未完了候補が変わり、再読み込みだけでは変わらない。
- legacy/current/mixed Unitキーのfixtureが同じ `actualUnitId` と順位になる。

## Commands

Phase 1 specification verification:

```bash
pnpm exec prettier --check SPEC-learning-recommendation-policy.md
git diff --check
```

Approved implementation loop:

```bash
pnpm test:related src/core/learning/recommendationPolicy.ts tests/unit/learningRecommendationPolicy.test.ts
pnpm test:related src/core/learning/learningPlan.ts tests/unit/learningPlan.test.ts
pnpm check:fast
pnpm validate:curriculum-graph
```

Integration owner final gate after all modules are merged:

```bash
pnpm check:full
```

Individual worktrees must not run `pnpm test`, `pnpm build`, or `pnpm check:full` concurrently with the
integration worktree.

## Boundaries

### Always

- Pure functions、固定 `evaluationNow`、stable IDで決定論的にする。
- QuestionBank、学年範囲、概念リンクをすべて満たす候補だけを返す。
- 正規Unit IDと集約修得判定は `canonicalUnitId` と `aggregateUnitMastery` を使う。
- 期限到来、弱い直接前提、未確認primary、未出題の順を守る。
- 最大3件、問題ID一意、実Unit名を偽らない。
- REDテストから始め、focused test後にだけ実装コミットを作る。
- 既存変更と生成物を混ぜず、担当ファイルだけを変更する。

### Ask first

- `src/questions/contracts.ts` の変更。
- `GameState` schema version、新しい永続フィールド、migrationの追加。
- `LearningRecommendation` の必須4フィールド、詳細reason 4値、完了reason 2値、または
  `recommendationReasonToAttemptReason` の固定変換表の変更。
- 学年範囲、JST日境界、最大3件、4段階順位の変更。
- 3回答・Unit習熟度0.80・独力成功2回という既存修得／報酬条件の変更。
- 新しいQuestion renderer、content契約、依存パッケージの追加。
- Scene、UI、`src/core/learning/index.ts` への変更。

### Never

- `Math.random` または暗黙の `Date.now()` で推薦を変える。
- Graph、GameState、QuestionBank、履歴、recent、進捗入力を変更する。
- 前提不足や空プランを理由にゲーム進行を止める。
- QuestionBankにないID、学年範囲外問題、ダミー項目を返す。
- 前提問題を目標Unitの問題として表示するため `actualUnitId` を偽る。
- 既存セーブの進捗、報酬、地域進行、所持品を巻き戻す。
- 報酬をこのモジュールから付与する、または二重付与防止マーカーを新設する。
- `FieldUi.tsx`、`field.css`、Scene、UI、`index.ts` を編集する。

## Success criteria

- 同じ読み取り専用入力とJST日付で、返り値が毎回完全一致する。
- 4カテゴリの優先順、カテゴリ内優先値、`diagnosticValue`、`questionId` の比較がテストで固定される。
- 未完了の返り値は `{ questionId, actualUnitId, reason, conceptIds }` を満たし、reasonは
  4段階の詳細カテゴリと一致する。
- AttemptEvent記録境界では、`due-review → review`、他3種 `→ diagnosis` の純粋変換だけを使う。
- 前提問題の実Unitが正しく、前提不足をハードロックに使わない。
- QuestionBankと学年設定を満たさない問題が一件も返らない。
- 直近問題は新しい候補がある間は除外され、枯渇時だけ同じ順位で再利用される。
- 今日プランは問題ID重複なしで0〜3件を返し、異なる正規Unitを優先する。
- 同日のreview/diagnosis回答はscoreに関係なく完了し、battle/event回答は完了しない。
- ロードマップを開く、再計算する、再読み込みするだけではGameStateが変わらない。
- 新しい永続フィールドやmigrationなしで、旧セーブと既存報酬条件を維持する。
- 専用unit test、focused test、`pnpm check:fast` が通り、最終統合で `pnpm check:full` が通る。

## Resolved cross-review decisions and open questions

横断レビューにより次の決定を確定した。

1. `challengeHigher` は既存ロードマップと同じく小6までの上位学年を許可する。
2. 未完了推薦は4値の詳細reasonを返す。
3. AttemptEvent記録時だけ詳細reasonを既存の `review | diagnosis` へ純粋変換する。
4. 今日プランは `completed` を判別子とし、完了済みの詳細reasonを推測しない。
5. 依存先の正式シンボルは `canonicalUnitId` と `aggregateUnitMastery` とする。
6. リンクのない問題は `conceptIds` を捏造せず、推薦対象外にする。
7. 今日完了した削除済み問題はダミー化せず、QuestionBankから復元可能な項目だけ保持する。

要件、公開契約、依存シンボルに未解決事項はない。
