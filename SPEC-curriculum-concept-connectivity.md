# Spec: curriculum-concept-connectivity

## Objective

`content/curriculum/` の統合概念グラフに残る30個の孤立概念を、一次資料と既存の教材進行に基づく関係へ接続する。

現在の基準値は、ファイル記載358件・統合後357概念、395関係（`prerequisite` 369、`related` 21、`transfer` 5）、孤立30概念である。今回の変更では、各孤立概念に少なくとも1本の新しい関係を与え、統合後の概念孤立を0にする。単元グラフの280単元・336辺・孤立0は維持する。

対象は次の内訳とする。

- 国語: 12概念
- 算数: 7概念（うち `misconception` 3概念）
- 生活: 10概念
- 社会: 1概念
- 理科・英語: 対象なし（現在すでに孤立0）

概念を接続すること自体を目的化せず、学習上の必須順序だけを `prerequisite` とする。同時期に扱う内容、誤概念と正しい概念、季節・場面間のつながりは、意味に応じて `related`、`contrast`、`chronological`、`transfer` を使い分ける。

## Tech Stack

- 教材データ: JSON (`content/curriculum/**/*.json`)
- 契約: Zod (`src/core/learning/model.ts`、変更しない)
- グラフ統合・循環検査: `src/core/learning/graph.ts`
- 品質監査: `src/core/learning/graphQuality.ts` と `scripts/audit-roadmap-graph.ts`
- テスト: Vitest
- 新規依存なし

## Commands

作業前の基準値:

```bash
pnpm validate:curriculum-graph
pnpm audit:roadmap-graph
```

作業中の集中検査:

```bash
pnpm vitest run tests/unit/curriculumGraphQuality.test.ts
pnpm test:related src/core/learning/graphQuality.ts tests/unit/curriculumGraphQuality.test.ts scripts/audit-roadmap-graph.ts
pnpm audit:roadmap-graph --strict
pnpm check:fast
```

完了時の検査:

```bash
pnpm lint
pnpm check:architecture
pnpm test
pnpm validate:content
pnpm build
```

`pnpm check:full` は統合担当だけが統合後に実行する。

## Project Structure

- `content/curriculum/`: 概念関係の唯一の編集対象。各関係は関係先に最も近い既存ファイルへ置く。
- `src/core/learning/graphQuality.ts`: 統合グラフの概念数、関係数、関係種別、孤立概念を純粋に集計する。
- `scripts/audit-roadmap-graph.ts`: 単元監査に加えて概念監査結果を表示し、`--strict` では概念孤立も失敗条件にする。
- `tests/unit/curriculumGraphQuality.test.ts`: 概念集計と孤立判定の回帰テスト。
- `tasks/`: 承認後の実装計画、チェックリスト、Walkthroughを置く。

想定する教材JSONは以下の11ファイルである。

- `content/curriculum/kokugo-g1-legacy-foundations.json`
- `content/curriculum/kokugo-g1-term1.json`
- `content/curriculum/kokugo-g2-foundations.json`
- `content/curriculum/kokugo-g3-term1.json`
- `content/curriculum/kokugo-g3-term2.json`
- `content/curriculum/sansu-g1-foundations.json`
- `content/curriculum/sansu-g1-term2.json`
- `content/curriculum/sansu-g2-term1.json`
- `content/curriculum/seikatsu-g1-term1.json`
- `content/curriculum/seikatsu-g2-foundations.json`
- `content/curriculum/shakai-g4-term1.json`

## Data Style

既存の `ConceptRelation` 契約をそのまま使う。

```json
{
  "from": "kokugo.g1.legacy.kana-basics",
  "to": "kokugo.g1.legacy.word-play",
  "kind": "prerequisite",
  "strength": 0.9,
  "rationale": "仮名[かな]を読[よ]み書[か]きする力[ちから]を、語[ご]のまとまりや音[おと]を使[つか]った言葉遊[ことばあそ]びへ広[ひろ]げる。",
  "sourceIds": ["mext-82v12-kokugo-g1-legacy-review"],
  "reviewStatus": "source-checked"
}
```

- 方向は基礎から発展へ向ける。
- `rationale` は一般論ではなく、両端の学習内容がどう接続するかをRubyTextで具体的に記す。
- `sourceIds` は関係の両端と進行根拠を扱う既存資料だけを使う。
- 根拠を直接確認できない関係を `source-checked` にしない。
- `misconception` は前提単元として扱わず、正しい概念との `contrast` または診断上妥当な非ロック関係へ接続する。

## Relation Policy

### `prerequisite`

- 後続概念の理解・技能実行に先行概念が必要な場合だけ使う。
- 同一教科内に限定し、低学年から高学年、または同学年の基礎から発展へ向ける。
- 教科横断のハードロック、逆学年線、自己参照、循環を作らない。
- 同一単元内でも、単なる併記ではなく学習手順が明確な場合だけ使う。

### 非ロック関係

- `related`: 同時期・同一活動で相互に関係するが、必須順序ではない。
- `contrast`: 誤概念と正しい概念、比較して区別する概念を結ぶ。
- `chronological`: 季節変化など、時間順はあるが理解のロック条件にはしない。
- `transfer`: 既習の見方・技能を別の場面へ適用する。

非ロック関係はロードマップの解放条件に混ぜない。

## Testing Strategy

1. 変更前に、統合後357概念・395関係・孤立30を再現する。
2. `buildCurriculumGraphQuality` の概念単位集計について、孤立、関係種別、同一概念の重複定義を含む失敗テストを先に追加する。
3. 監査スクリプトが統合後のユニーク概念数、全関係数、種別内訳、孤立概念数を表示することを確認する。
4. 教科ごとに教材関係を追加し、各段階で `pnpm validate:curriculum-graph` と対象テストを実行する。
5. 最終的に孤立0、関係425本以上、参照切れ0、概念前提循環0、単元循環0、重複線0、逆学年線0、教科横断ハードロック0を確認する。
6. `pnpm audit:roadmap-graph --strict` が概念孤立を含めて合格することを確認する。

UI・保存形式・ゲーム進行は変更しないため、新しいブラウザ操作のE2Eテストは不要とする。ただし完了時はプロジェクトルールに従って最新版プレビューを起動し、既存ロードマップが開けることを確認する。

## Boundaries

### Always

- 文部科学省の学習指導要領・解説を中心とする既存一次資料と、ファイル内の `sourceIds` / locatorを確認する。
- 30個の各基準孤立概念に、少なくとも1本の根拠ある新規関係を与える。
- 少なくとも30本の関係を追加し、関係総数を425本以上にする。
- 既存の `reviewStatus` の意味を守り、人間の監修なしに `expert-reviewed` を付けない。
- コンテンツ変更を教科単位で小さく検証する。
- 既存の単元グラフ280単元・孤立0を維持する。

### Ask First

- `src/core/learning/model.ts`、カリキュラムschema、`src/questions/contracts.ts` の変更。
- 新しい関係種別、依存パッケージ、外部AIモデル、外部プロバイダー資格情報の追加。
- 教科横断関係をロードマップのハードロックに使う変更。
- 既存概念のID、単元ID、問題リンク、学術レビュー記録の変更。

### Never

- 本数を満たすためだけの弱い関係、自己参照、重複線を追加する。
- 誤概念を学習の前提条件として使う。
- 高学年概念を低学年概念の `prerequisite` にする。
- 根拠未確認の関係を `source-checked` または `expert-reviewed` と記録する。
- UI、Scene、保存データ、報酬、問題契約、生成schemaを変更する。
- `content/` にJSON以外を置く。

## Success Criteria

- 統合後のユニーク概念357件に対して、孤立概念が0件である。
- 関係総数が425本以上で、追加前の395本から少なくとも30本増えている。
- 追加前に孤立していた国語12、算数7、生活10、社会1の全概念が、根拠ある関係に参加している。
- `prerequisite` と非ロック関係が上記方針どおり使い分けられている。
- 全関係に具体的な `rationale`、有効な `sourceIds`、正しい `reviewStatus` がある。
- 概念参照切れ、自己参照、前提循環、重複関係が0件である。
- 単元監査の教科横断ハードロック、逆学年線、単元循環、孤立単元、draft前提関係がすべて0件である。
- 概念孤立の再発を `pnpm audit:roadmap-graph --strict` が検出できる。
- 集中検査、標準検査、ビルドがすべて成功する。
- 変更対象外のUI、保存データ、問題リンク、報酬挙動に差分がない。

## Open Questions

なし。関係種別の使い分けと監査基準は既存契約の範囲で確定できる。
