# Spec: math-learning-content-pilot — 小1算数の学習段階・誤概念パイロット

## Status

Approved on 2026-10-28. Capability map module: `math-learning-content-pilot`.

この文書は Phase 1 の承認済み仕様を定義する。別途、実装継続の指示を受けるまで実装計画、教材JSON、テスト、生成物を変更しない。

## Objective

既存の問題契約とレンダラーを変えず、小学1年算数の限定された既存問題へ学習段階を表すタグを付け、誤答から得られる誤概念候補を少数の draft シグナルとして整備する。

- 児童向け推薦では、具体物・視覚表現・記号・応用場面のどの段階を扱う問題かを既存 `QuestionBase.tags` から判別できる。
- 教材担当者は、対象3 Conceptに十分な primary 問題が残っていることと、誤概念シグナルが仮説であって専門監修済みではないことを確認できる。
- 開発者は、Question/Unit ID、報酬、セーブ、renderer、schemaを変えずにパイロットを検証できる。

## Authoritative Baseline

- 能力マップ: `CAPABILITY_MAP-learning-roadmap-curriculum-v2.md`
- ゲーム仕様: `docs/00_GAME_DESIGN.md` §5、§6.3、§8
- アーキテクチャ: `docs/01_ARCHITECTURE.md` §3、§5
- 問題契約: `src/questions/contracts.ts` の既存 `QuestionBase.tags?: string[]`
- カリキュラム契約: `src/core/learning/model.ts` の既存 Concept、QuestionLink、MisconceptionSignal
- 報酬条件: `src/core/progression/learningRewards.ts`
- セーブ契約: `src/core/state/schema.ts`、`src/core/state/roadmapSnapshot.ts`

現在の基点では、対象Conceptの primary 問題数は次のとおりである。

| Concept                                 | Unit                            | primary問題数 |
| --------------------------------------- | ------------------------------- | ------------: |
| `sansu.g1.number.two-digit-place-value` | `sansu.g1.kazu-100`             |             4 |
| `sansu.g1.addition.meaning`             | `sansu.g1.tashizan`             |             3 |
| `sansu.g1.operation.make-ten-strategy`  | `sansu.g1.kuriagari-kurisagari` |             6 |

既存の誤概念シグナルは3件で、すべて `sansu.g1.misconception.add-instead-difference` を参照する draft QuestionLink にあり、confidence は0.60〜0.70である。

## Scope

### In scope

1. 対象3 Unitに属する既存問題オブジェクト12件へ、既存 `tags` 配列を使って学習段階タグを1件ずつ付ける。
2. 対象Conceptごとに primary 問題3件以上を維持する。
3. 既存3件の誤概念シグナルを変更・重複させず、新規3件を追加して対象3 Unit内の合計を6件にする。
4. 新規の誤概念Conceptと、新規シグナルを持つQuestionLinkを `draft` とし、confidenceを0.70以下にする。
5. このパイロット専用のVitestを追加し、対象ID、タグ語彙、primaryカバレッジ、シグナル上限、レビュー状態を固定する。

### Out of scope

- TypeScript契約、問題renderer、問題type、Zod schema、生成済み `schemas/` の変更。
- 問題文、選択肢、正答、解説、Question ID、Unit ID、Conceptのprimary対応の変更。
- 新しい永続フィールド、GameState schema version、save migrationの追加。
- 報酬条件、習熟度計算、推薦順位、UI、Scene、バトル、地域進行の変更。
- 小1算数の他Unit、小2以上、他教科、legacy問題の一括移行。
- 自動検査だけによる `source-checked` / `expert-reviewed` への昇格。

## Stage Tag Contract

既存 `QuestionBase.tags` に、次の4語だけを学習段階タグとして使用する。

| Tag                 | このパイロットでの意味                                   |
| ------------------- | -------------------------------------------------------- |
| `stage:concrete`    | 仮想ブロックなど、数を具体物として直接操作・構成する問題 |
| `stage:visual`      | 数直線など、位置やまとまりを視覚表現から読む問題         |
| `stage:symbolic`    | 数字、式、位、分解手順などの記号表現を扱う問題           |
| `stage:application` | 生活場面から演算や答えを選ぶ問題                         |

各対象問題は上記のタグをちょうど1件持つ。既存の `prefecture:*`、`theme:*`、`source:*`、`legacy-node:*`、`reviewed:*` タグは削除・並べ替えず、stageタグを末尾へ追加する。

### Exact target matrix

| Question ID                               | Unit                            | Primary concept                         | Stage tag           | 根拠                              |
| ----------------------------------------- | ------------------------------- | --------------------------------------- | ------------------- | --------------------------------- |
| `sansu.g1.kazu-100.ringo-blocks-0001`     | `sansu.g1.kazu-100`             | `sansu.g1.number.two-digit-place-value` | `stage:concrete`    | 10と1の仮想ブロックを直接構成する |
| `sansu.g1.kazu-100.ringo-numberline-0001` | `sansu.g1.kazu-100`             | `sansu.g1.number.order`                 | `stage:visual`      | 数直線上の位置を視覚的に合わせる  |
| `sansu.g1.kazu-100.place-value-0001`      | `sansu.g1.kazu-100`             | `sansu.g1.number.two-digit-place-value` | `stage:symbolic`    | 2位数を10のまとまりとばらへ読む   |
| `sansu.g1.kazu-100.place-value-0002`      | `sansu.g1.kazu-100`             | `sansu.g1.number.two-digit-place-value` | `stage:symbolic`    | 10の個数と端数を数字へ変換する    |
| `sansu.g1.kazu-100.place-value-0003`      | `sansu.g1.kazu-100`             | `sansu.g1.number.two-digit-place-value` | `stage:symbolic`    | 位の数字が表す値を読む            |
| `sansu.g1.tashizan.0001`                  | `sansu.g1.tashizan`             | `sansu.g1.addition.meaning`             | `stage:application` | 具体的な2集合を合わせる生活場面   |
| `sansu.g1.tashizan.0006`                  | `sansu.g1.tashizan`             | `sansu.g1.addition.meaning`             | `stage:application` | 合併場面を式へ対応させる          |
| `sansu.g1.tashizan.0007`                  | `sansu.g1.tashizan`             | `sansu.g1.addition.meaning`             | `stage:application` | 増加場面を式へ対応させる          |
| `sansu.g1.kuriagari-kurisagari.0001`      | `sansu.g1.kuriagari-kurisagari` | `sansu.g1.operation.make-ten-strategy`  | `stage:symbolic`    | 10を作るための数の分解を選ぶ      |
| `sansu.g1.kuriagari-kurisagari.0002`      | `sansu.g1.kuriagari-kurisagari` | `sansu.g1.operation.make-ten-strategy`  | `stage:symbolic`    | 10のまとまりを使って式を解く      |
| `sansu.g1.kuriagari-kurisagari.0004`      | `sansu.g1.kuriagari-kurisagari` | `sansu.g1.operation.make-ten-strategy`  | `stage:symbolic`    | 減法の分解手順を選ぶ              |
| `sansu.g1.kuriagari-kurisagari.0006`      | `sansu.g1.kuriagari-kurisagari` | `sansu.g1.operation.make-ten-strategy`  | `stage:application` | 生活場面で繰り下がりの減法を使う  |

`stage:visual` の1件は対象Unit内だが、3つの対象Conceptとは別の既存 primary Conceptへ紐づく。既存問題を改変せず、実際に視覚表現を使う問題だけへタグを付けるための意図的な選択である。

## Misconception Signal Contract

### Existing signals to preserve

| Question ID              | Answer | Concept                                         | Confidence |
| ------------------------ | ------ | ----------------------------------------------- | ---------: |
| `sansu.g1.tashizan.0001` | `d`    | `sansu.g1.misconception.add-instead-difference` |       0.65 |
| `sansu.g1.tashizan.0002` | `b`    | `sansu.g1.misconception.add-instead-difference` |       0.60 |
| `sansu.g1.tashizan.0004` | `b`    | `sansu.g1.misconception.add-instead-difference` |       0.70 |

### New draft misconception concepts

次の2 Conceptを対応する既存 curriculum JSONへ追加する。どちらも `kind: "misconception"`、既存Unit、既存一次資料IDを使い、`review.status: "draft"` とする。

1. `sansu.g1.misconception.tens-ones-reversed`
   - Unit: `sansu.g1.kazu-100`
   - 意味: 10のまとまりとばらの個数を逆に対応させる仮説。
2. `sansu.g1.misconception.make-ten-arbitrary-split`
   - Unit: `sansu.g1.kuriagari-kurisagari`
   - 意味: 10を作る補数を確認せず、加える数を任意に分ける仮説。

### New signals

| Question ID                          | Answer | Misconception concept                             | Confidence | QuestionLink review |
| ------------------------------------ | ------ | ------------------------------------------------- | ---------: | ------------------- |
| `sansu.g1.kazu-100.place-value-0001` | `b`    | `sansu.g1.misconception.tens-ones-reversed`       |       0.70 | `draft`             |
| `sansu.g1.kuriagari-kurisagari.0001` | `b`    | `sansu.g1.misconception.make-ten-arbitrary-split` |       0.65 | `draft`             |
| `sansu.g1.kuriagari-kurisagari.0004` | `b`    | `sansu.g1.misconception.add-instead-difference`   |       0.65 | `draft`             |

新規シグナルの rationale は、観察した誤答と推測を区別し、「一度だけでは断定しない」ことを明記する。シグナルを追加する既存QuestionLinkが `source-checked` の場合は、誤概念対応を含むリンク全体を `draft` へ戻す。Concept、QuestionLink、signalを `source-checked` または `expert-reviewed` へ昇格しない。

重複は `(questionId, answerId, conceptId)` の組で判定する。対象3 Unitの非空シグナルは実装後ちょうど6件、各confidenceは0.70以下とする。

## Reward and Save Compatibility

### Existing rewards remain unchanged

- 「まなびの かけら」の単元習熟報酬は、既存どおり `mastery.n >= 3 && mastery.value >= 0.8` を満たしたUnitごとに一度だけ付与する。
- まちがい直し報酬は、既存どおり異なる3 Question IDを完全正答した単位で付与し、同じQuestion IDを再計上しない。
- stageタグやmisconception signalを報酬条件へ使わない。
- RPGの経験値、ゴールド、ダメージ、地域解放、バトルの7割弱点／3割復習選択を変更しない。

### Save compatibility

- `schemaVersion`、GameStateのフィールド、migrationを変更しない。
- 既存Question ID、Unit ID、Concept ID、正答を改名・削除しない。
- 既存の `learning.mastery`、`masteredRewardUnits`、`correctedRewardQuestionIds`、`attempts`、`conceptStates` を書き換えない。
- stageタグは静的な問題メタデータであり、セーブへ新しく永続化しない。
- 新しい誤概念Concept IDは静的な診断参照キーとして追加し、この実装では旧セーブへのbackfillや新しい永続値の書込みを行わない。既存の `conceptStates: Record<string, ConceptState>` のschema shapeも変更しない。
- `roadmapSnapshot.ts` の既得進捗保護を変更せず、旧セーブの進捗・報酬・地域進行を巻き戻さない。

## Tech Stack

- JSON content (`content/questions/`, `content/curriculum/`)
- 既存 TypeScript strict / Zod 契約（変更しない）
- Vitestによる専用教材テスト
- 既存 content / curriculum graph validators
- 新規依存なし

## Commands

実装時はREDテストから開始し、作業中は対象を絞る。

```bash
# RED/GREEN: 専用教材契約
pnpm vitest run tests/unit/mathLearningContentPilot.test.ts

# 変更ファイルに関連する日常検査
pnpm test:related tests/unit/mathLearningContentPilot.test.ts
pnpm validate:curriculum-graph
pnpm validate:content
pnpm check:fast

# 報酬・セーブ互換の回帰
pnpm vitest run tests/unit/learningRewards.test.ts tests/unit/state.test.ts tests/unit/legacyImport.test.ts
```

`pnpm check:full`、`pnpm test`、`pnpm build` は能力マップの運用どおり、統合担当が統合後に一度実行する。この作業ブランチでは同時実行しない。

## Project Structure and Ownership

### Future implementation may edit

- `content/questions/sansu/g1/ringo-number-build.json`
- `content/questions/sansu/g1/kazu-kiso.json`
- `content/questions/sansu/g1/tashizan.json`
- `content/questions/sansu/g1/kuriagari-kurisagari.json`
- `content/curriculum/sansu-g1-foundations.json`
- `content/curriculum/sansu-g1-term2.json`
- `tests/unit/mathLearningContentPilot.test.ts`

### Must not edit

- `src/questions/contracts.ts`
- `src/questions/renderers/**`
- `src/core/state/**`
- `src/core/progression/learningRewards.ts`
- `schemas/**`
- `content/manifest.json`、`assets/catalog.json` を含む生成物
- Scene、UI、推薦ポリシー、別チャット所有ファイル

## Content Style

既存配列を保ち、stageタグだけを末尾へ追加する。

```json
{
  "id": "sansu.g1.kazu-100.ringo-blocks-0001",
  "tags": ["prefecture:aomori", "theme:ringo", "stage:concrete"]
}
```

新しい誤概念は断定せず、QuestionLink全体をdraftにする。

```json
{
  "questionId": "sansu.g1.kazu-100.place-value-0001",
  "reviewStatus": "draft",
  "misconceptionSignals": [
    {
      "answerId": "b",
      "conceptId": "sansu.g1.misconception.tens-ones-reversed",
      "confidence": 0.7,
      "rationale": "10のまとまりとばらを逆に対応させている可能性がある。ただし一度だけでは断定しない。"
    }
  ]
}
```

- JSONの既存インデントとキー順を維持し、無関係な整形を混ぜない。
- IDは小文字英数字・ドット・ハイフンだけを使う。
- 表示文を追加する場合はRubyText形式を守る。ただし今回、問題文やUI文言は追加しない。

## Testing Strategy

### RED first

専用テストを先に追加し、少なくとも次の理由で現行基点に対して失敗することを確認する。

1. Exact target matrixの12問にstageタグがまだない。
2. 対象Unit内の非空misconception signalが既存3件しかない。

### GREEN

最小限のJSON変更だけで専用テストを通す。テストは次を検証する。

- Exact target matrixの全12 IDが存在し、各問題が指定stageタグをちょうど1件持つ。
- stageタグ付き問題オブジェクトは対象3 Unit内で12件を超えず、使用語彙は4種類だけで、4種類すべてが少なくとも1件ある。
- 既存の非stageタグ、Question ID、Unit、type、payloadの正答は維持される。
- 3対象Conceptのprimary問題数がそれぞれ3件以上である。
- 既存3シグナルが同じquestion/answer/concept/confidenceで残る。
- 対象3 Unitのシグナルは重複なしでちょうど6件、すべてconfidence 0.70以下である。
- 新規misconception Conceptと、新規シグナルを持つQuestionLinkが `draft` で、`source-checked` / `expert-reviewed` ではない。
- `pnpm validate:curriculum-graph` と `pnpm validate:content` が成功する。

### Compatibility regression

- 既存の報酬テストで3回答・0.80の習熟条件と、異なる3問の直し条件が変わっていないことを確認する。
- 既存のstate/importテストで代表旧セーブが同じschema versionへ読み込まれることを確認する。
- content-only変更のため、Phase実装ブランチではブラウザや4174プレビューを必須としない。統合後のロードマップ全体確認は統合担当のE2E・プレビューに委ねる。

## Boundaries

### Always

- 対象問題、Concept、QuestionLinkを実ファイルからID指定し、推測による一括タグ付けをしない。
- 各対象問題にstageタグを1件だけ付け、既存タグと問題内容を保持する。
- 対象Conceptごとにprimary問題3件以上を維持する。
- 既存3シグナルを保持し、新規を含め合計6件以内、confidence 0.70以下にする。
- 新しい教材判断とシグナル対応は `draft` にする。
- REDテストから始め、focused validationを各incrementで実行する。
- 既存報酬条件とセーブ互換性を回帰テストで確認する。

### Ask first

- `src/questions/contracts.ts`、カリキュラムschema、生成済み `schemas/` の変更。
- 上記4種類以外のstageタグ、複数stageタグ、構造化された新stage schemaの追加。
- Exact target matrixのID、stage分類、12件上限の変更。
- 新しいrenderer、question type、依存パッケージの追加。
- 3回答・単元習熟度0.80、異なる3問の直しという既存報酬条件の変更。
- GameState schema version、新しい永続フィールド、save migrationの追加。
- 新規シグナルのconfidenceを0.70より大きくする変更。
- `source-checked` / `expert-reviewed` への昇格。

### Never

- 既存Question/Unit ID、正答、問題文を変更して過去のattempt・mastery・報酬マーカーを切断する。
- 既存セーブの進捗、報酬、所持品、地域進行を巻き戻す。
- AI判断だけで教材を専門監修済みにする。
- 小1〜小3の全問題、全legacy単元、他教科へ範囲を広げる。
- TypeScript実装、renderer、Scene、UI、生成schemaへ教材都合の分岐を追加する。
- `FieldUi.tsx`、`field.css`、または別チャット所有ファイルを取り込む、消す、整形する。

## Success Criteria

- 指定12問だけがExact target matrixどおりのstageタグを1件ずつ持つ。
- 対象範囲で `stage:concrete`、`stage:visual`、`stage:symbolic`、`stage:application` の4種類を確認できる。
- 3対象Conceptがそれぞれprimary問題3件以上を維持する。
- 既存3件を含め、対象3 Unitのdraft誤概念シグナルが重複なしで6件あり、confidenceはすべて0.70以下である。
- 新しいmisconception Conceptと対応を `source-checked` / `expert-reviewed` と表示しない。
- Question契約、renderer、schema生成物、報酬条件、GameState schemaを変更しない。
- 既存Question/Unit IDを維持し、旧セーブのattempt、mastery、報酬マーカーをそのまま読み込める。
- 専用教材テスト、curriculum graph validation、content validation、focused報酬・セーブ回帰が成功する。
- 実装コミットは能力マップの所有ファイルだけを含む1論理コミットである。

## Resolved Decision

`stage:visual` は、対象3 Conceptのprimary問題だけに限定せず、同じ対象Unitにある既存の数直線問題 `sansu.g1.kazu-100.ringo-numberline-0001` へ付ける。

この問題は `sansu.g1.number.order` のprimary問題だが、対象Unit `sansu.g1.kazu-100` に属し、現存問題の中で実際に視覚表現を使う。問題内容の変更や新規問題追加をせずに4種類のstageを正確に表すため、Exact target matrixの確定対象とする。

未解決事項はない。
