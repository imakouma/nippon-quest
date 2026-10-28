# Spec: adaptive-roadmap-practice — 適応型ロードマップ練習

## Status

Draft for human approval. Capability map module: `adaptive-roadmap-practice`.

この文書は Phase 1 の仕様であり、承認前に実装・テスト変更・統合は行わない。

## Objective

学習ロードマップで単元を選んだとき、現在の「対象単元内からシード付き乱数で1問選ぶ」処理を、
`learning-recommendation-policy` が提供する唯一の共通推薦ポリシーへ置き換える。

ロードマップ練習は、選択された単元を学習目標として、復習期限、弱い直接前提、未確認の primary
目標、未出題問題を共通順位で評価する。直接前提の問題を出す場合は、選択された単元を装わず、
実際の問題・単元・理由・概念を呼び出し元へ返す。

公開結果は、候補がある場合に次の4フィールドを持つ。

```ts
interface RoadmapPracticeSelection {
  questionId: string;
  actualUnitId: string;
  reason: LearningRecommendationReason;
  conceptIds: string[];
}
```

- `questionId`: `QuestionBank` に実在し、実際に `askById` へ渡す問題ID。
- `actualUnitId`: 選択対象ではなく、実際に出題する問題の正規Unit ID。旧問題を使う場合も正規IDを返す。
- `reason`: 共通ポリシーが定義する推薦理由。Scene側で別の理由へ読み替えない。
- `conceptIds`: 共通ポリシーが選定根拠として返す重複のない概念ID。Scene側で再推論しない。

非null結果では `QuestionBank.get(questionId)` が存在し、その問題のUnitを共通正規化した値が
`actualUnitId` と一致する。`conceptIds` はその問題リンクと推薦理由に対応し、別問題の概念を混ぜない。

候補がない場合は `null` を返す。部分的な結果やランダムな代替問題は返さない。

## Assumptions and resolved decisions

1. `learning-recommendation-policy` が、固定された優先順位・学年範囲・直近問題除外・正規Unit化を所有する。
2. ロードマップ練習の対象範囲は、選択Unitとその直接前提である。無関係なUnitへ横断しない。
3. `roadmap-relation-projection` への依存はWave順序とUnit関係の整合確認であり、このSceneアダプターは
   表示線や関係投影を再実装しない。実行時importは承認済みprovider契約が要求する場合だけ行う。
4. 推薦の `reason` と永続化する `AttemptEvent.reason` は別の契約である。ロードマップから解いた回答は
   現状どおりすべて `review` として記録し、新しい永続理由を追加しない。
5. `evaluationNow` の日境界・タイムゾーン計算は共通ポリシー側の責務であり、Scene側で複製しない。
   同じGameStateとAsia/Tokyoの同じ日なら、時刻経過や再読み込みだけで選定結果を変えない。
6. このモジュールは推薦結果を返すが、推薦理由を子ども向け文言として表示するUIは
   `child-roadmap-experience` の担当である。

## Required behavior

### 1. Pure selection adapter

`src/scenes/overworld/roadmapPractice.ts` に、ランタイム描画と分離した純粋な選定入口を置く。
正確なprovider関数名と型名は、承認済み `learning-recommendation-policy` 仕様の公開exportを使う。

選定入口は少なくとも次をproviderへ渡す。

- ユーザーが選んだ正規Unit ID。
- 正規カリキュラムGraphと、providerが要求するUnit関係。
- `QuestionBank` に実在する問題一覧と問題・概念リンク。
- `GameState.learning.mastery`、`conceptStates`、`attempts`、`recent`。
- `grade`、`includeLower`、`challengeHigher`。
- providerが定めるAsia/Tokyoの日初へ固定した `evaluationNow`。

アダプターは入力したGraph、GameState、QuestionBank、配列、問題オブジェクトを変更しない。
候補の順位付け、legacy/current Unitの正規化、理由・概念の導出をScene側へ複製しない。

### 2. Recommendation order

選定結果は能力マップの共通順位に完全に従う。

1. 期限到来：`dueAt <= evaluationNow` かつ推定定着率 `< 0.65`。
2. 弱い直接前提：未修得の直接前提を `1 - understanding * confidence` の降順。
3. 未確認primary目標：primaryリンクを持ち `attempts === 0` の概念。
4. 未出題問題。

同順位は `diagnosticValue` 降順、最後は `questionId` 昇順とする。選定には
`Math.random`、`hostScene.rng.next()`、配列順依存の抽選を使わない。

新しい候補がある間は `GameState.learning.recent` の問題を除外し、候補がなくなった場合だけ同じ順位規則で
再利用する。候補はQuestionBankに実在し、学年設定と `challengeHigher` のprovider契約を満たすものに限る。

### 3. Actual question execution

`runRoadmapPractice` は純粋な選定結果を1回取得し、その `questionId` をそのまま `askById` へ渡す。
`askById` の内部で別問題を再選定せず、選定後に乱数で差し替えない。

- `QuestionFrame.title` は `actualUnitId` のUnit名を使う。
- Unit名が見つからない場合も、選択対象Unit名へ戻さず `actualUnitId` 自体を表示する。
- `QuestionFrame.subject` は実際の問題の `subject` を使う。
- hintと既存の問題UIは変更しない。
- `runRoadmapPractice` は正常完了時に、選定に使った4フィールドを返す。
- 候補なし、または実行前にcontent/bank/gameがない場合は `null` を返す。

共通ポリシーが返した `questionId` が同じQuestionBankに存在しない矛盾は、ランダムフォールバックをせず
「問題がない」経路で安全に終了する。回答UIは `finally` で必ずunmountする。

### 4. No-question behavior

候補がない場合は既存の `field.roadmapNoQuestion` を表示し、次を行わない。

- `askById` の呼び出し。
- 学習履歴、習熟度、報酬、recent、mistakesの変更。
- 新しい無効ボタンやUI文言の追加。
- 選択Unit内ランダム問題へのフォールバック。

## Existing game contracts that must not change

### Game progression

- 前提不足は推薦理由にだけ使い、ロードマップ、バトル、探索、島・地域進行の新しいハードロックにしない。
- 不正解でも回答は完了し、ロードマップへ戻って続けられる。
- `src/scenes/Overworld.ts`、ロードマップノードの解放条件、地域解放条件は変更しない。

### Battle 70/30 selection

バトルのGDD §5.4契約は対象外であり、変更しない。

- 弱い単元を7割、習熟済みの復習を3割で選ぶ既存 `pickQuestion(..., { weakUnitRatio: 0.7 })` を維持する。
- `src/scenes/Battle.ts`、`src/scenes/battle/`、`src/questions/engine/pick.ts` を変更しない。
- ロードマップ用の決定論的推薦をバトルの乱数選定へ流用しない。

### Learning rewards

既存報酬条件を変更しない。

- 単元報酬は3回答以上かつ習熟度0.80以上で、正規Unitごとに一度だけ付与する。
- まちがい直し報酬は既存条件と既存の冪等マーカーを維持する。
- 選定アダプターは報酬を直接付与せず、回答後の既存 `askById` → `buildAskEnv` →
  `applyLearningRewards` 経路だけを使う。
- 前提問題を出した場合、習熟・報酬は実際の問題Unitに記録し、選択対象Unitへ付け替えない。
- legacy/current Unitの報酬マーカー正規化は `unit-progress-normalization` が所有し、このファイルで
  二重のalias表や報酬ロジックを作らない。

## Save compatibility

- `GameState` schema version 13を維持し、新しい永続フィールド、migration、schema変更を追加しない。
- 既存の `learning.mastery`、`masteredRewardUnits`、`correctedRewardQuestionIds`、`recent`、`mistakes`、
  `attempts`、`conceptStates` だけを既存経路で利用する。
- 選定処理とロードマップを開く操作はGameStateを変更しない。回答確定後だけ既存の問題実行経路が更新する。
- v13代表セーブと、既存migrationを通ったlegacy/current/mixed Unitキーのセーブで、学習報酬、地域進行、
  inventory、ロードマップ既得進捗を巻き戻さない。
- `roadmapSnapshot.ts` の既得進捗保護を読み替えたり書き換えたりしない。
- 再読み込みのみでは推薦も保存状態も変更しない。同じ日・同じ入力では同じ4フィールドを返す。

## Tech stack and dependencies

- TypeScript strict、Vitest、既存のPreact `QuestionFrame` と問題エンジンを使う。
- 新規npm依存、設定、feature flagは追加しない。
- 乱数選定の代わりに、承認済み `src/core/learning/` の共通推薦exportを再利用する。
- `src/questions/contracts.ts`、schema、content、i18nは変更しない。

## Project structure and ownership

### Owned in Phase 2

- `src/scenes/overworld/roadmapPractice.ts`
- `tests/unit/roadmapPractice.test.ts`（新設する専用テスト。実在するVitest配置規約に従う）

### Read-only dependencies

- `src/core/learning/recommendationPolicy.ts` と公開export（最終名はprovider仕様に従う）
- `src/core/learning/roadmapRelations.ts` と公開export（provider契約が要求する場合のみ）
- `src/core/learning/unitProgress.ts` / `unitAliases.ts`
- `src/core/learning/catalog.ts` / `model.ts` / `state.ts`
- `src/questions/engine/bank.ts` / `ask.ts`
- `src/scenes/shared/askEnv.ts`
- `src/core/progression/learningRewards.ts`

### Explicitly out of scope

- Core推薦ポリシー、Unit正規化、関係投影の実装・修正。
- `src/scenes/Overworld.ts`。
- `src/ui/`、`content/i18n/ja.json`、子ども向け推薦理由表示。
- バトル選定、問題レンダラー、Question契約、GameState schema、migration。
- ロードマップ表示モデル、今日プラン、教材JSON、E2E。

統合担当だけがCoreのbarrel exportと `Overworld.ts` を接続する。担当外ファイルに必要な変更が見つかった場合は、
この作業で編集せず統合担当へ渡す。

## Code style

公開契約はproviderの型を再利用し、Scene固有の入力だけを薄いアダプターで組み立てる。

```ts
export type RoadmapPracticeSelection = Pick<
  LearningRecommendation,
  'questionId' | 'actualUnitId' | 'reason' | 'conceptIds'
>;

export function selectRoadmapPracticeQuestion(
  input: Readonly<RoadmapPracticeSelectionInput>,
): RoadmapPracticeSelection | null;
```

- `any`、非null assertionによるBank参照、問題タイプ名による分岐を追加しない。
- provider結果をScene側で再採点・再順位付けしない。
- 1回だけ使うwrapper、将来用option、Scene固有のalias表を追加しない。
- `rng` は問題レンダラーの既存環境へ渡せるが、選定関数からは呼ばない。

## Testing strategy

Phase 2は、専用テストでREDを確認してから最小実装を行う。

### Pure selection contract

固定fixtureに対し、次を4フィールドの完全一致で検証する。

1. 期限到来が他候補より優先される。
2. 弱い直接前提を選ぶと `actualUnitId` が選択Unitと異なり、前提の概念IDと理由を返す。
3. 未確認primary目標が未出題問題より優先される。
4. 同順位は `diagnosticValue`、次に `questionId` で決まり、同じ入力で同じ結果になる。
5. fresh候補があればrecentを除外し、全候補がrecentなら決定論的に再利用する。
6. 学年設定外、QuestionBankにない問題、無関係なUnitは選ばない。
7. legacy/current/mixed Unitキーでも正規 `actualUnitId` と同じ問題を返す。
8. 入力Graph、GameState、QuestionBank相当データを変更せず、選定中にrngを呼ばない。
9. 候補なしは `null`。

### Runtime adapter contract

- 選定した `questionId` を1回だけ `askById` へ渡す。
- 前提問題では `actualUnitId` のUnit名と実問題のsubjectを `QuestionFrame` へ渡す。
- 永続 `AttemptEvent.reason` は `review` のまま。
- 候補なし、欠落dependency、provider/Bank不整合では回答経路を開始せず、安全に終了する。
- 成功・失敗のどちらでも問題UIをunmountする。
- 正常完了時は選定の4フィールド、候補なしは `null` を返す。

### Regression gates

担当実装時のfocused gate:

```bash
pnpm vitest run tests/unit/roadmapPractice.test.ts
pnpm test:related src/scenes/overworld/roadmapPractice.ts tests/unit/roadmapPractice.test.ts
pnpm check:fast
```

統合担当がWave 3以降に、既存契約を次で再確認する。

```bash
pnpm vitest run tests/unit/questions.test.ts tests/unit/learningRewards.test.ts tests/unit/state.test.ts
pnpm check:full
```

`pnpm test`、`pnpm build`、対象E2E、4174プレビューは最終統合後に一度だけ実行する。
このPhase 1の文書変更では、ブラウザ挙動やランタイムは変わらないためプレビューを起動しない。

## Boundaries

### Always

- 選定は共通推薦ポリシーへ委譲し、返された4フィールドを保持する。
- 選択Unitと実Unitを区別し、実Unitの題名で問題を表示する。
- 固定時刻・安定IDで決定論的にテストする。
- 実問題の既存 `askById` 経路でのみ回答・習熟・報酬を更新する。
- 前提不足を推薦理由にだけ使い、ゲーム進行を止めない。
- providerの公開型と正規Unit化を再利用し、入力を変更しない。

### Ask first

- `src/questions/contracts.ts`、GameState schema version、migration、新しい永続フィールドの変更。
- 3回答・習熟度0.80の報酬条件、まちがい直し条件、報酬IDの変更。
- バトルの7割弱点／3割復習、recent window、学年範囲の変更。
- 共通推薦理由の追加・改名、推薦順位や定着率0.65の変更。
- `Overworld.ts`、UI、content、i18n、Coreポリシー、barrel exportの編集。
- 新規依存、Question renderer、Question契約の追加。
- 所有外の既存テストから旧selector importを削除する変更。

### Never

- `Math.random` またはScene rngで推薦を抽選する。
- 共通ポリシーと同じ順位付け・概念判定・Unit正規化をSceneに複製する。
- 前提問題を選択対象Unitの問題として表示・記録する。
- 候補なしをランダム問題や別教科で埋める。
- ロードマップを開く・選択するだけでGameStateを変更する。
- 既存セーブの進捗、報酬、inventory、島・地域進行を巻き戻す。
- バトル、報酬条件、UI、`Overworld.ts` をこの担当変更へ混ぜる。

## Success criteria

- ロードマップ練習の実行経路が `pickRoadmapQuestionId` の乱数選定ではなく、承認済み共通推薦ポリシーを使う。
- 固定fixtureで `{ questionId, actualUnitId, reason, conceptIds }` が完全一致する。
- 前提問題では、実際のUnit名・subjectで出題され、選択Unit名を偽装しない。
- 同じGameState、QuestionBank、Graph、Asia/Tokyoの日付なら同じ結果を返す。
- fresh候補をrecentより優先し、枯渇時だけ同じ順位で再利用する。
- 候補なしは既存案内で安全に終了し、回答前のGameStateを変更しない。
- 回答後は既存 `review` AttemptEvent、習熟更新、報酬経路だけが動く。
- 3回答・0.80報酬、まちがい直し、正規Unitごとの冪等性が維持される。
- バトルの7割弱点／3割復習とゲーム・地域進行に差分がない。
- v13およびmigration済みlegacy/current/mixedセーブで新フィールドなしに動作し、既得進捗を保つ。
- 実装差分は `roadmapPractice.ts` と専用テストに限定され、focused gateが成功する。

## Open questions before Phase 2

1. `learning-recommendation-policy` の承認済み仕様で、公開関数名、入力型、
   `LearningRecommendationReason` のliteral値を確定する必要がある。本仕様は意味と4フィールドを固定し、
   providerの名前を重複定義しない。
2. 現在 `tests/unit/roadmap.test.ts` と `tests/unit/sansuG1Term3.test.ts` が
   `pickRoadmapQuestionId` を直接importしているが、両方とも本担当の所有外である。Phase 2では、統合担当が
   それらのassertionを専用 `roadmapPractice.test.ts` へ移すか、旧helperを一時維持するかを承認する必要がある。
   本担当だけで所有外テストを削除・変更しない。

## Approval gate

人間がこの仕様とOpen Questionsの扱いを承認した後、同じチャットでPhase 2の計画を作る。
承認前に `planning-and-task-breakdown` の成果物、実装、REDテスト、コードレビューへ進まない。
