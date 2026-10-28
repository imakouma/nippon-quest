# Spec: 学習ロードマップ表示モデル

## Status and approval gate

本書は Capability Map `roadmap-view-model` の Phase 1 仕様である。人間が本書を承認するまで、実装計画、RED テスト、実装、UI 接続へ進まない。

## Objective

既存の全ロードマップと、`learning-recommendation-policy` が返す最大3件の今日プランを、同じ正規 Unit と同じ単元進捗定義で扱う Scene 非依存の表示モデルへまとめる。

表示モデルは UI に次を渡す。

- 全ロードマップの単元、進捗、状態、前提線、非ロック関係線
- 今日プランの推薦理由、実際に出題する正規 Unit、対象 Concept、当日完了状態
- 今日プランが参照する Unit の名前・教科・進捗（全ロードマップと同じ導出結果）

ロードマップを開く、再描画する、フィルタするだけでは `GameState`、教材グラフ、推薦結果、QuestionBank を変更しない。不正解、前提不足、非ロック関係によってゲーム進行や単元練習へ新しいハードロックを加えない。

## Capability-map traceability

| Capability Map requirement                         | This module's responsibility                                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Core の結果を Scene 非依存の表示モデルへまとめる   | 正規化済み進捗、今日プラン、投影済み関係を純粋関数で UI DTO へ合成する                                  |
| 全ロードマップと今日プランを同じ進捗定義で表示する | 今日プランの Unit 進捗を、同じ呼び出しで作ったロードマップノードから投影する                            |
| 理由・実 Unit・完了状態を渡す                      | `reason`、`actualUnitId`、`conceptIds`、`completed` を欠落させず渡す                                    |
| 非ロック関係線を渡す                               | `component`、`transfer`、`related`、`chronological` だけを `supportingLinks` へ渡し、解放判定へ使わない |
| 開くだけで GameState を変更しない                  | 入力を読み取る純粋関数とし、保存・報酬・snapshot 作成を呼ばない                                         |
| v13 互換                                           | schema、migration、永続フィールドを変更せず、代表 v13 state の前後同値をテストする                      |

### Dependencies

実装開始時には、先に統合済みである次の Capability Map モジュールを再利用する。

1. `unit-progress-normalization`
   - legacy/current/mixed の Unit キーを一つの正規 Unit へ集約する。
   - 本モジュールで alias 集約や報酬 ID 正規化を再実装しない。
2. `learning-recommendation-policy`
   - 今日プランの順序、推薦理由、実 Unit、Concept、当日完了を決める。
   - 本モジュールで候補選定、Asia/Tokyo の日境界、AttemptEvent の完了判定を再実装しない。
3. `roadmap-relation-projection`
   - Concept 関係を Unit 関係へ投影し、表示可能な4種類だけを返す。
   - 本モジュールで Concept 関係の方向や教育的意味を推測しない。

依存モジュールの公開型名が承認済み仕様と異なる場合は、その型を直接 import して使う。構造が似たローカル型を複製しない。

## Investigated project structure and ownership

指定された概略パスを基点コミット `8dfff95c` で調査した結果、実在する責務は次の3ファイルにある。

| Future implementation ownership   | Responsibility                                                                                                    |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/scenes/overworld/roadmap.ts` | 現行の Phaser/DOM 非依存ロードマップビルダー。今日プランと関係線を含む表示モデル合成を追加する                    |
| `src/shared/menuModel.ts`         | Scene と UI の中立契約。既存 `RoadmapNode` と `supportingLinks` を維持し、今日プランと表示モデルの DTO を追加する |
| `tests/unit/roadmap.test.ts`      | 単元進捗、今日プラン合成、非ロック線、純粋性、v13 互換の focused unit tests                                       |

`src/core/learning/roadmap.ts` と `src/scenes/overworld/menuModel.ts` は現時点では存在しない。現行 `src/scenes/overworld/roadmap.ts` は Phaser、DOM、保存 API を import せず、すでに純粋な表示モデル境界として使われている。Graphify の code-only 影響調査では `Overworld.ts` と複数のロードマップ教材テストがこのファイルを直接利用している。

したがって、Ponytail full の最小変更方針として、新しい中継ファイルや一括移動は作らない。上記3ファイルだけを実装所有範囲とする。`src/scenes/Overworld.ts`、`src/core/learning/index.ts`、UI ファイルへの接続は統合担当の所有範囲である。

読み取り専用の既存依存は次のとおり。

- `src/scenes/overworld/roadmapLayout.ts`: 既存の決定論的レイアウト
- `src/core/state/roadmapSnapshot.ts`: v13 以前からの既得進捗 ID の読み取り
- `src/core/progression/learningRewards.ts`: 変更してはならない既存報酬条件
- Wave 1/2 の `unitProgress.ts`、`learningPlan.ts`、`recommendationPolicy.ts`、`roadmapRelations.ts`（最終名は各承認済み仕様を正とする）

## Architecture and data flow

```text
content / v13 GameState (read-only)
        │
        ▼
unit-progress-normalization
        │
        ├──────────────▶ learning-recommendation-policy ──▶ today plan
        │
        └──────────────▶ roadmap-relation-projection ─────▶ supporting relations
                                  │
                                  ▼
              src/scenes/overworld/roadmap.ts
                  pure RoadmapViewModel builder
                                  │
                                  ▼
                 src/shared/menuModel.ts contract
                                  │
                                  ▼
                       UI (integration scope)
```

- データフローは `content → core/learning → scenes/overworld → shared contract → UI` とし、UI から Scene や永続化実装へ逆依存させない。
- `roadmap.ts` は配置場所にかかわらず Phaser、Preact、DOM、保存 API、`src/scenes/Overworld.ts` を import しない。
- 呼び出し時刻は明示的な `now` として渡し、既定値を使う既存 API もテストでは必ず固定する。
- レイアウトは既存 `layoutRoadmapNodes` を再利用し、新しいレイアウト方式や依存を追加しない。

## Display contract

以下は意図する契約形である。依存モジュールが同等の公開型を持つ場合は、その型を再定義せず import する。

```ts
export type RoadmapRecommendationReason =
  'due-review' | 'weak-prerequisite' | 'unverified-primary' | 'unseen-question';

export interface RoadmapUnitProgressView {
  mastery: number;
  attempts: number;
  retention: number;
  state: RoadmapNode['state'];
}

export interface RoadmapTodayItem {
  questionId: string;
  actualUnitId: string;
  unitName: string;
  subject: string;
  subjectLabel: string;
  grade: number;
  reason: RoadmapRecommendationReason;
  conceptIds: readonly string[];
  /** 同じ Asia/Tokyo 日内の review / diagnosis 回答が存在する。score には依存しない。 */
  completed: boolean;
  /** 同じ呼び出しで作った全ロードマップノードから投影する。別計算しない。 */
  progress: RoadmapUnitProgressView;
}

export interface RoadmapViewModel {
  nodes: RoadmapNode[];
  todayPlan: RoadmapTodayItem[];
}
```

`RoadmapNode` の既存フィールドは後方互換に保つ。非ロック線には既存契約を使う。

```ts
export type RoadmapSupportingKind = 'component' | 'transfer' | 'related' | 'chronological';

export interface RoadmapNode {
  // existing fields remain unchanged
  supportingLinks?: { sourceId: string; kind: RoadmapSupportingKind }[];
}
```

### Builder behavior

- 既存 `buildRoadmapNodes` と `buildGameRoadmapNodes` は互換 API として残す。
- 新しい合成 API は、正規化済み単元進捗、今日プラン、投影済み関係線を受け、`RoadmapViewModel` を返す。
- 互換 API は新しい合成処理の `nodes` を返す薄い入口にするか、共通の一つの内部処理を共有する。進捗ロジックを二重化しない。
- 今日プランの順序、件数（0〜3件）、完了済み項目の保持順を変更しない。
- `actualUnitId` は正規 Unit ID とし、その Unit の名前を使う。弱い前提問題を出すときに、推薦元の目標 Unit の名前へ偽装しない。
- `progress` は `actualUnitId` と一致する `nodes` の `mastery`、`attempts`、`retention`、`state` から作る。今日プラン専用の習熟計算を作らない。
- 正規化後も対応ノードが存在しない不正な今日プラン項目は、壊れた開始ボタンとして UI へ渡さない。production 出力から除外し、fixture テストでは依存契約違反として検出する。
- 入力配列、入力オブジェクト、`GameState` 内の配列・record を in-place sort、push、splice、代入しない。

### One progress definition

全ロードマップと今日プランの Unit 進捗は、次の既存定義を共通で使う。

1. legacy/current/mixed の mastery と既得進捗 ID は `unit-progress-normalization` で正規 Unit に集約する。
2. `roadmapSnapshot.ts` に記録済みの既得 Unit は `cleared` とし、概念完全性の導入によって再ロックしない。
3. Concept 証拠がある Unit は、対象の全 Concept がそろったうえで次のいずれかを満たすと修得済みにする。
   - 平均 `understanding >= 0.8` かつ合計 `attempts >= 3`
   - 全 Concept の `independentSuccesses >= 2`
4. Concept 証拠がない既存 Unit は、正規化後 mastery の `value >= 0.8 && n >= 3` を fallback とする。
5. 修得済みで、いずれかの Concept が `dueAt <= now` かつ `estimatedRetention < 0.65` なら `review` とする。`review` は修得済みとして扱い、再ロックしない。
6. `current`、`open`、`locked`、`visibility`、最初の教科入口の既存挙動は維持する。

今日プランの `completed` は Unit の修得済み状態とは別概念である。`learning-recommendation-policy` が、当日内の一意な問題に対する `review` または `diagnosis` AttemptEvent の有無から導出し、score が0でも `true` になり得る。本モジュールは値をそのまま表示契約へ渡す。

### Non-lock relation lines

- `roadmap-relation-projection` が返した `component`、`transfer`、`related`、`chronological` だけを受け付ける。
- 投影済み relation の target node に `{ sourceId, kind }` を `supportingLinks` として付与する。
- 同じ `sourceId + targetId + kind` は1件へ重複排除し、`sourceId`、次に `kind` の安定順で返す。
- source または target の表示ノードが存在しない relation は UI へ渡さない。
- `supportingLinks` を `prerequisiteIds`、`blockedByNames`、`state`、`visibility`、教科解放、練習可否へ混ぜない。
- `prerequisite` は既存のハード解放線としてのみ扱い、supporting relation へ重複表示しない。
- `causal`、`spatial`、`category`、`contrast` は今回 UI へ投影しない。

## Save and reward compatibility

### v13 saves

- `SCHEMA_VERSION = 13` を維持する。
- `src/core/state/schema.ts` と `src/core/state/migrations.ts` を変更しない。
- 新しい永続フィールド、日次 plan snapshot、表示設定、relation cache を追加しない。
- 今日プランは既存 AttemptEvent と現在の学習証拠から導出し、表示モデルは保存しない。
- 表示モデル作成中に `ensureRoadmapMasterySnapshot` を呼ばない。v13 state ではロード時に作成済みの counter を読むだけにする。
- 代表 v13 state を `structuredClone` し、表示モデル作成前後で state の深い同値を確認する。特に `updatedAt`、`progress.counters`、`learning.attempts`、`learning.mastery`、`masteredRewardUnits`、`correctedRewardQuestionIds`、`inventory`、地域進行が不変であることを確認する。

### Existing learning rewards

本モジュールは `applyLearningRewards` を呼ばず、次の既存条件を変更しない。

- Unit 報酬: 正規 Unit の mastery が3回答以上かつ0.80以上へ到達したとき、その Unit につき一度だけ `learning-fragment` を付与する。
- まちがい直し報酬: 以前まちがいだった一意な問題を score 1 で直した記録を数え、3問ごとに1個付与する。同じ問題を再計上しない。
- 同じ回答で両条件を満たす場合は既存どおり両方を付与する。
- ロードマップ表示、今日プランの `completed`、supporting relation は、報酬付与や報酬 marker 更新のトリガーにしない。

`unit-progress-normalization` が報酬 marker を正規 ID へ寄せる責務を持つ。本モジュールは marker を読み替えたり書き換えたりしない。

## Tech stack and code style

- TypeScript strict、Vitest、既存 Zod/GameState/QuestionBank 契約を使用する。
- 新しい依存パッケージは追加しない。
- 乱数は不要であり、`Math.random` も `src/core/rng.ts` も使わない。
- 既存の関数型・配列変換スタイルに合わせ、入力から新しい DTO を返す。
- RubyText は Unit と教科の既存ラベルをそのまま渡し、ユーザー向け文言をコードへ追加しない。
- 型のためだけの wrapper、将来用 option、cache、class、generic framework を追加しない。

意図する純粋な合成スタイル:

```ts
export function buildRoadmapViewModel(input: RoadmapViewModelInput): RoadmapViewModel {
  const nodes = buildRoadmapNodesFromNormalizedProgress(input);
  return {
    nodes: attachSupportingLinks(nodes, input.supportingRelations),
    todayPlan: projectTodayPlan(input.todayPlan, nodes),
  };
}
```

実装時は `nodes` の relation 付与後の値を today plan から参照できるよう処理順を調整してよいが、進捗導出は1回だけにする。

## Testing strategy

実装は `tests/unit/roadmap.test.ts` の RED から始め、状態ではなく入出力を検証する。

### Required unit cases

1. 全ロードマップと今日プランの同じ正規 Unit が、同じ mastery、attempts、retention、state を返す。
2. legacy/current/mixed mastery のどの入力でも同じ正規 Unit と進捗を返す。
3. 今日プラン0、1、2、3件を順序どおり返し、無効な placeholder を作らない。
4. 弱い前提推薦で `actualUnitId`、Unit 名、reason、conceptIds を偽らず渡す。
5. score 0 の当日 review/diagnosis 完了を `completed: true` として渡し、Unit の修得状態とは混同しない。
6. completed item と未完了 item を上流 plan の順序どおり維持する。
7. 4種類の supporting relation を重複排除して安定順で返す。
8. supporting relation を追加しても prerequisiteIds、state、visibility、教科解放結果が変わらない。
9. source/target Unit がない supporting relation を壊れた UI 線として返さない。
10. builder 呼び出し前後で、入力 GameState 相当 fixture、curriculum、plan、relations が深い同値を保つ。
11. 代表 v13 fixture でロードマップを構築しても、報酬 marker、所持品、地域進行、AttemptEvent が不変である。
12. 同じ固定 `now` と同じ入力から完全一致する DTO を返す。
13. 既存の概念完全性、既得進捗、復習、AND 前提、霧、決定論的 layout のテストを維持する。

### Verification commands

Phase 1 specification commit:

```bash
pnpm exec prettier --check SPEC-roadmap-view-model.md
git diff --check
```

人間承認後の implementation loop:

```bash
pnpm vitest run tests/unit/roadmap.test.ts
pnpm test:related src/scenes/overworld/roadmap.ts src/shared/menuModel.ts tests/unit/roadmap.test.ts
pnpm check:fast
```

統合担当が integration 後に実行する gate:

```bash
pnpm lint
pnpm check:architecture
pnpm test
pnpm validate:content
pnpm build
```

本モジュール単独では UI 変更がないため、Phase 1 と実装コミットで新しいブラウザプレビューは作らない。UI 接続後の 4174 プレビュー、狭幅、入力、focus、再読み込み確認は `child-roadmap-experience` と統合担当の責務とする。

## Boundaries

### Always

- 正規 Unit、今日 plan、relation projection は先行モジュールの公開 API を再利用する。
- 既存 `RoadmapNode` のフィールドと利用者を後方互換に保つ。
- 同じ単元進捗導出結果から roadmap node と today item を作る。
- 固定 `now` と安定 ID で決定論的に返す。
- 入力を変更しない純粋関数として実装する。
- supporting relation と prerequisite の意味を分離する。
- 新しい振る舞いは RED テストから始める。
- 変更は実在する所有3ファイルへ限定し、統合担当と UI 担当のファイルを変更しない。

### Ask first

- `src/questions/contracts.ts` の変更。
- GameState schema version、migration、永続フィールドの追加。
- 3回答・Unit mastery 0.80、独力成功2回、復習 retention 0.65 の条件変更。
- 既存学習報酬、修正報酬、地域進行、教科解放条件の変更。
- `component`、`transfer`、`related`、`chronological` 以外の非ロック線追加。
- `src/core/learning/roadmap.ts` への移動や、新しい `src/scenes/overworld/menuModel.ts` の追加を伴う層再編。
- 新しい依存、Question renderer、content/schema の追加。

### Never

- ロードマップ表示だけで `GameState`、`updatedAt`、AttemptEvent、reward marker、inventory、進行 counter を変更する。
- 今日プランを保存する、または新しい schema migration を追加する。
- 表示モデル内で推薦順位や出題問題を再選定する。
- 前提問題を目標 Unit の問題として表示する。
- supporting relation をロック、教科解放、練習可否、報酬条件へ使う。
- 既存セーブの進捗、報酬、所持品、島・地域進行を巻き戻す。
- `src/scenes/Overworld.ts`、UI、推薦ポリシー、adaptive practice、`src/core/learning/index.ts` をこの担当で変更する。
- `FieldUi.tsx`、`field.css` や他チャットの変更を取り込む、消す、整形する。

## Out of scope

- 「きょうの3つ」の UI、文言、CSS、focus、回答後復帰、狭幅表示。
- 推薦順位、Asia/Tokyo 日境界、AttemptEvent の日次完了導出。
- 実際に出題する問題の選定と `roadmapPractice.ts`。
- Overworld への配線、保存処理、報酬処理。
- カリキュラム relation の追加・監修、教材パイロット。
- roadmap layout、zoom、pan、pinch、reduced-motion の変更。
- `src/core/learning/index.ts` の export 追加と E2E。

## Success criteria

- 一つの純粋な `RoadmapViewModel` が全ロードマップと0〜3件の今日プランを返す。
- 今日プランの各項目は `questionId`、正規 `actualUnitId`、正しい Unit 名、reason、conceptIds、当日 completed、共通 Unit 進捗を持つ。
- 今日プランと全ロードマップの同じ Unit で mastery、attempts、retention、state が一致する。
- `component`、`transfer`、`related`、`chronological` が UI 契約へ渡り、どの解放・表示・報酬判定も変更しない。
- 既存の prerequisite AND 条件、概念完全性、既得進捗、復習状態、霧、layout が維持される。
- roadmap を開くだけでは GameState が変更されず、保存も報酬付与も発生しない。
- schema version は13のままで、新しい永続フィールドも migration もない。
- 代表 v13 fixture で報酬 marker、所持品、地域進行、AttemptEvent が構築前後で同一である。
- 既存報酬の3回答・0.80条件と3問ごとの完全なまちがい直し条件が変わらない。
- focused tests、related tests、`pnpm check:fast` が実装担当の状態で成功する。
- UI、推薦ポリシー、`Overworld.ts` に担当外差分がない。

## Open questions for human approval

1. 実在パスと Graphify 影響調査に基づき、純粋ビルダーを `src/scenes/overworld/roadmap.ts` に維持し、`src/shared/menuModel.ts` を UI 契約の正とする最小変更方針を承認するか。
2. `RoadmapRecommendationReason` の stable string は上記4値を採用するか。Wave 2 の承認済み推薦仕様が別名を確定した場合は、その公開型を本書より優先して直接再利用する。
