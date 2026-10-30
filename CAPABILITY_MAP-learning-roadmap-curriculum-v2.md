# Capability Map: 学習ロードマップ Curriculum v2

## 目的

最新の `imakouma/main` にある前提グラフ、概念別学習状態、復習期限、既存セーブ保護を再利用し、
子どもが「今日やること」と「次に学ぶ理由」を迷わず理解できるロードマップへ更新する。
不正解や前提不足によってゲーム進行を止めず、既存の報酬条件とセーブ互換性を維持する。

## 現在の基点

- 基点: `imakouma/main` の `27c3ce90ecb8aa23759ac7f5095d4710b9623136`
- 作業ブランチ: `codex/learning-roadmap-curriculum-v2`
- 既存実装として再利用するもの:
  - 369本の `prerequisite` と全必修単元を接続するロードマップグラフ
  - `conceptStates`、定着率、復習期限、診断候補
  - 概念完全性を使うロードマップ状態
  - `roadmapSnapshot.ts` による旧セーブの既得進捗保護
- 主な未実装:
  - ロードマップ上の「きょうの3つ」
  - 単元練習の概念・期限・前提を使った適応選択
  - 旧単元・現行単元をまたぐ進捗と報酬IDの一貫した正規化
  - 学習段階と具体的な誤概念データの教材パイロット
  - 推薦理由を子どもに伝える表示

## 能力モジュール

| Module id                        | Responsibility                                                                                                                                    | Depends on                                                                       | Agent |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----- |
| `unit-progress-normalization`    | 既存の `canonicalUnitId()` とロードマップ内の習熟集約を再利用・抽出し、報酬マーカーだけ正規IDへ寄せて二重付与を防ぐ。保存データの一括移行はしない | —                                                                                | 1     |
| `learning-recommendation-policy` | 期限、弱い前提、未確認目標、未出題問題を順位付けする唯一の純粋ポリシーと、それを使う最大3件の今日プランを提供する                                 | `unit-progress-normalization`                                                    | 2     |
| `roadmap-relation-projection`    | 過去実装と現存DTOを再利用し、`component`、`transfer`、`related`、`chronological` だけを非ロック案内線へ投影する                                   | `unit-progress-normalization`                                                    | 3     |
| `adaptive-roadmap-practice`      | 単元内ランダム出題を共通推薦ポリシーに置き換え、実際に出すUnitと推薦理由を返す                                                                    | `learning-recommendation-policy`, `roadmap-relation-projection`                  | 4     |
| `roadmap-view-model`             | Coreの結果をScene非依存の表示モデルへまとめ、全ロードマップと今日プランを同じ進捗定義で表示する                                                   | `learning-recommendation-policy`, `roadmap-relation-projection`                  | 5     |
| `math-learning-content-pilot`    | 承認済みの既存 `QuestionBase.tags` 規約だけを使い、小1算数の限定12問以内へ学習段階タグと追加のdraft誤概念シグナルを付ける                         | `learning-recommendation-policy` のタグ規約                                      | 6     |
| `child-roadmap-experience`       | 既存「がくしゅう」画面へ全幅の「きょうの3つ」、推薦理由、目標状態を追加し、回答後の復帰・フォーカス・狭幅表示を完成させる                         | `roadmap-view-model`, `adaptive-roadmap-practice`, `math-learning-content-pilot` | 7     |

## 依存順序

```text
unit-progress-normalization
  ├─ learning-recommendation-policy ┐
  └─ roadmap-relation-projection ───┼─ roadmap-view-model ───────────┐
                                    └─ adaptive-roadmap-practice ────┤
                                                                      ├─ child-roadmap-experience
learning-recommendation-policy ── math-learning-content-pilot ────────┘
```

実装は同時実行枠に合わせて4波に分ける。

1. Wave 1: `unit-progress-normalization`
2. Wave 2: `learning-recommendation-policy` と `roadmap-relation-projection`
3. Wave 3: `adaptive-roadmap-practice`、`roadmap-view-model`、`math-learning-content-pilot`
4. Wave 4: `child-roadmap-experience` と統合レビュー

各Waveは統合担当がfocused testを通してから次へ進む。`pnpm check:full`、`pnpm test`、`pnpm build`は
各作業エージェントで同時実行せず、最終統合後に一度だけ実行する。

## エージェント所有権とGit運用

各エージェントはWave開始時の統合ブランチを基点に、専用worktreeと専用ブランチを作る。
完了時はfocused testを通した1論理コミットを作り、統合担当へブランチ名・コミットID・検査結果を渡す。

| Agent | Branch                              | Owned files                                                                                            | Shared files it must not edit            |
| ----- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| 1     | `codex/lr-v2-unit-progress`         | `src/core/learning/unitProgress.ts`, `unitAliases.ts`, `learningRewards.ts`,専用テスト                 | `roadmap.ts`, `menuModel.ts`, `index.ts` |
| 2     | `codex/lr-v2-recommendation-policy` | `src/core/learning/recommendationPolicy.ts`, `learningPlan.ts`,専用テスト                              | Scene、UI、`index.ts`                    |
| 3     | `codex/lr-v2-relations`             | `src/core/learning/roadmapRelations.ts`,専用テスト                                                     | `roadmap.ts`, `menuModel.ts`,UI          |
| 4     | `codex/lr-v2-adaptive-practice`     | `roadmapPractice.ts`,専用テスト                                                                        | Coreポリシー、UI、`Overworld.ts`         |
| 5     | `codex/lr-v2-view-model`            | `roadmap.ts`, `menuModel.ts`, `roadmap.test.ts`                                                        | UI、Coreポリシー、`Overworld.ts`         |
| 6     | `codex/lr-v2-content-pilot`         | 下記パイロット教材JSONと専用教材テスト                                                                 | TypeScript実装、生成schema               |
| 7     | `codex/lr-v2-ui`                    | `RoadmapView.tsx`, `RoadmapGraph.tsx`, `MenuOverlay.tsx`, `menu.css`, `ja.json`, `roadmapMenu.test.ts` | Core、Scene選定ロジック                  |

統合担当だけが `src/core/learning/index.ts`、`src/scenes/Overworld.ts`、仕様・計画・E2Eを編集する。
Wave内のエージェントは互いのworktreeを編集せず、統合済みコミットを次Waveの新しい基点にする。

Wave 1の前にローカルのcode-only Graphifyグラフを用意する。現行の `graphify-out/graph.json` がなければ
`graphify extract . --code-only --no-cluster`、あれば `graphify update .` を実行する。semantic labelingや
外部LLM backendは使わない。各Waveのmaterialな統合後（少なくとも最終統合後）に `graphify update .` で更新し、
`graphify query` / `graphify affected` で境界と影響範囲を確認する。`graphify-out/` はコミットしない。

## 推薦・今日プランの固定契約

- 共通順位は `期限到来 → 弱い直接前提 → 未確認primary目標 → 未出題問題`。
- 期限到来は既存と同じ `dueAt <= now` かつ推定定着率 `< 0.65`。
- 前提の修得条件は既存ロードマップと同じ、概念完全性を満たし、
  `mastery >= 0.8 && attempts >= 3` または全概念 `independentSuccesses >= 2`。
- 弱い前提は未修得の直接前提だけを対象とし、`1 - understanding * confidence` の降順。
- 未確認目標はprimaryリンクを持ち `attempts === 0` の概念を優先する。
- 候補はQuestionBankに実在し、学年設定と `challengeHigher` を満たすものだけにする。
- 同順位は `diagnosticValue` 降順、最後は `questionId` 昇順。`Math.random`は使わない。
- 返り値は `{ questionId, actualUnitId, reason, conceptIds }` とし、前提問題を出す場合も題名を偽らない。
- 新しい候補がある間は直近問題を除外し、なければ同じ順位規則で再利用する。
- 候補が不足する場合、今日プランは0〜2件でもよく、空状態に無効なボタンを出さない。
- 入力したGraph、GameState、QuestionBankを変更しない。

「今日」はAsia/Tokyoの0:00から翌0:00までとし、推薦順位の `evaluationNow` はその日の0:00に固定する。
これにより、同日中の単なる時間経過や再読み込みだけでは候補を入れ替えない。完了は同日中の `review` または `diagnosis` の
AttemptEventがある一意な問題とし、scoreに関係なく数える。battle/event回答は今日プランの完了に数えない。
問題IDで重複を除き、異なる正規Unitを優先する。完了済み項目を先に保持し、残りを現在の推薦で最大3件まで補う。
回答で学習証拠が変われば未完了候補は再計算してよいが、再読み込みだけでは入れ替わらない。
新しい永続フィールドやschema migrationは追加しない。

## 小1算数教材パイロット

- 対象Unit:
  - `sansu.g1.kazu-100`
  - `sansu.g1.tashizan`
  - `sansu.g1.kuriagari-kurisagari`
- 対象Concept:
  - `sansu.g1.number.two-digit-place-value`
  - `sansu.g1.addition.meaning`
  - `sansu.g1.operation.make-ten-strategy`
- 既存の `QuestionBase.tags` に次のcontrolled vocabularyだけを追加する:
  - `stage:concrete`
  - `stage:visual`
  - `stage:symbolic`
  - `stage:application`
- 変更する問題オブジェクトは12件以内とし、各Conceptに3件以上のprimary問題を維持する。
- 既存3件の誤概念シグナルを重複追加せず、合計6件を上限目標とする。
- 新しい誤概念・誤答対応を追加したQuestionLinkは `draft` とし、信頼度は0.7以下にする。
- `source-checked`や`expert-reviewed`へ昇格せず、新しいrenderer、Question契約、生成schemaは追加しない。

## 共通境界

### Always

- import境界は `shared` を中立契約とし、`core + shared → scenes`、`shared → ui` を守る。
  データフローは `content → core/learning → scenes/overworld → UI` とする。
- 新しい選定ロジックは純粋関数にし、固定 `now` と安定IDで決定論的にテストする。
- 既存Unit、Question、Concept IDを改名しない。
- 前提不足は推薦理由に使い、プレイやゲーム進行の新しいハードロックにしない。
- 文言は `content/i18n/ja.json` に置き、RubyText形式にする。
- 新しい教材判断は人間確認前に `expert-reviewed` にしない。
- 各行動変更はREDテストから始める。

### Ask first

- `src/questions/contracts.ts` の変更。
- `GameState` のschema version更新や新しい永続フィールド。
- 安定した名前付きStrandを新しいcontent契約として永続化する変更。
- 上記4種類以外の学習段階タグ、または構造化された学習段階schemaの追加。
- 3回答・単元習熟度0.80という既存報酬条件の変更。
- 新しい問題レンダラーや依存パッケージの追加。

### Never

- 既存セーブの進捗・報酬・地域進行を巻き戻す。
- AI判断だけで教材を専門監修済みにする。
- 小1〜小3全問題や全legacy単元を今回一括移行する。
- `FieldUi.tsx` と `field.css` にある別作業の変更を取り込む、消す、または整形する。

## 成功条件

- 「がくしゅう」を開くと、復習・つまずき直し・新しい学びを優先した最大3件が見える。
- 同じ状態と日時では同じ候補になり、問題IDが重複しない。
- 固定fixtureに対して、推薦ID、実Unit、reason、conceptIdsの完全一致をテストできる。
- ロードマップ練習が単元内ランダムではなく、期限・前提・未確認概念を考慮する。
- 誤答しても今日プランは完了として進み、ゲームや学習画面を自由に続けられる。
- 旧Unitと現行Unitの進捗が一つに集約され、報酬が二重付与されない。
- legacy/current/mixedキーのどのセーブでも集約結果が同じで、報酬処理が冪等になる。
- 小1算数パイロットで4種類の学習段階タグと、既存を含め最大6件のdraft誤概念シグナルを確認できる。
- ロードマップを開くだけではGameStateを変更しない。
- 既存の学習報酬、セーブ、島・地域進行、バトルの7割弱点／3割復習選択を変更しない。
- 空・1件・2件・3件、誤答完了、回答後復帰、再読込後の完了保持を検証する。
- 960×540、640×540、844×390で表示が収まり、マウス、キーボード、タッチで操作できる。
- 主操作は48px以上、visible focus、回答後のfocus復帰、Escape/back、politeな完了通知を満たす。
- 既存のロードマップzoom/pan/pinchとreduced-motionを壊さない。
- v13の代表セーブをimport→回答→保存→reloadし、学習報酬・地域進行・所持品が保持される。
- focused tests、`pnpm check:full`、対象E2E、最新版4174プレビューの目視確認が完了する。
- 最終確認では古い4174サーバーを停止し、統合済み最新buildを `127.0.0.1:4174` で起動する。
  通常経路は `?resetSaves=1` で再現可能な初期状態にし、代表v13セーブでは互換経路を別に確認する。
  回答→学習画面へのfocus復帰→再読み込みまで操作し、検証済み画面をCodexのアプリ内ブラウザで開いて残す。

## 今回しないこと

- 既に実装済みの前提グラフを再構築する。
- 全教科へ名前付きStrand taxonomyを導入する。
- 小4〜小6へ教材パイロットを展開する。
- 新しいQuestion typeを追加する。
- RPGの経験値、ゴールド、ダメージ、地域解放条件を再調整する。
- 教育的妥当性を自動テストだけで保証する。

## 人間確認が必要な点

- 7モジュールの境界と実装順。
- 小1算数の教材パイロットを今回の代表範囲とすること。
- 学習段階を新schemaにせず、既存tagsの4種類のcontrolled vocabularyで表すこと。
- 今日プランを新しい永続フィールドなしでAttemptEventから導出すること。
- 報酬条件を維持し、概念状態を表示・推薦に使う方針。
- 安定した名前付きStrand taxonomyは今回含めず、将来の別契約とする方針。
