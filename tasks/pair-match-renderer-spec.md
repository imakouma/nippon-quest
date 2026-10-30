# Spec: pair-match 問題 renderer の本番復旧

## Objective

本番基点 `27c3ce90` で未登録になっている `pair-match` を、現行の問題 renderer 契約へ適合させて利用可能にする。小学生がタッチ・マウス・キーボードで、裏向きの神経衰弱または左右列のペア合わせを解けることを成功条件とする。

参照実装は `d40be101` とするが、そのまま取り込まず、現行の即時 abort、RubyText、制限時間、バトル問題枠、schema 生成、アクセシビリティ要件へ合わせる。学習ロードマップとアニメーションは対象外とする。

## Tech Stack

- TypeScript strict
- Preact 10
- Zod v3 互換 API（renderer 所有 payload schema）
- Vitest + jsdom
- Playwright（Question Playground の実ブラウザ確認）

## Commands

- focused RED/GREEN: `pnpm vitest run tests/unit/pairMatch.test.ts tests/unit/rendererAbort.test.ts`
- related: `pnpm test:related src/questions/renderers/pair-match/index.tsx src/questions/renderers/pair-match/schema.ts src/questions/renderers/registry.ts`
- fast gate: `pnpm check:fast`
- schema generation: `pnpm gen:schemas`
- content gate: `pnpm validate:content`
- full gate: `pnpm check:full`
- browser test: `pnpm exec playwright test tests/e2e/questions.spec.ts --grep pair-match`
- preview: `pnpm exec vite preview --host 127.0.0.1 --port 4175 --strictPort`

## Project Structure

- `src/questions/renderers/pair-match/`: renderer と payload schema
- `src/questions/renderers/registry.ts`: renderer 登録
- `src/questions/renderers/shared/questions.css`: 既存問題枠内のカード配置と状態表示
- `content/questions/_samples/pair-match.json`: 3問のサンプル
- `content/i18n/ja.json`: 裏向きカードのアクセシブル名
- `schemas/questions/pair-match.schema.json`: `pnpm gen:schemas` による生成物
- `tests/unit/pairMatch.test.ts`: schema、採点、操作、時間切れの focused tests
- `tests/unit/rendererAbort.test.ts`: 現行 abort 契約の共通回帰テスト
- `tests/e2e/questions.spec.ts`: Playground 上のキーボード操作と結果確認

## Code Style

既存 renderer と同じく、payload は mount 境界で一度だけ parse し、完了処理を単一経路へ集約する。

```ts
export const pairMatchRenderer: QuestionRenderer = {
  type: 'pair-match',
  schema: pairMatchPayloadSchema,
  mount(ctx) {
    const payload = pairMatchPayloadSchema.parse(ctx.question.payload);
    // Preact view は QuestionResult だけを resolve し、外部状態へ触れない。
  },
};
```

## Testing Strategy

- RED: renderer 未実装の状態で、schema・採点・表向き/裏向き操作・abort を期待する focused tests を追加し、失敗を確認する。
- GREEN: 参照実装の最小機能を現行契約へ移植する。
- REFACTOR: 完了・時間切れ・abort の timer cleanup と一度だけ resolve する不変条件を整理する。
- Unit: ミス0、ミス減点、下限0、同じ列の選び直し、裏向き表示、画像/文字 schema、即時 abort。
- Browser: Playground でサンプルを開き、キーボードだけでペアを完成し、`score`、DOM、console、問題枠内の表示を確認する。
- Full: プロジェクトの `check:full` を単独実行する。

## Boundaries

- Always:
  - `RendererContext` と既存 shared UI だけを使用する。
  - 全表示テキストを RubyText/i18n 経由にする。
  - 48px 以上の操作対象、focus-visible、読み上げ可能な状態名を保つ。
  - abort 時は演出待ちを解除し、`score: 0`、`timedOut: true` で即時完了する。
  - schema は renderer から生成し、生成 JSON を直接編集しない。
- Ask first:
  - `src/questions/contracts.ts` の変更。
  - 既存 renderer や schema 生成方式の変更。
  - 新規依存の追加。
- Never:
  - Phaser、Scene、GameState、保存先を renderer から参照しない。
  - `Math.random` を使わない。
  - 学習ロードマップまたはアニメーション関連ファイルを変更しない。
  - `main` へ merge/push しない。

## Success Criteria

1. `pair-match` が registry と schema 生成へ登録され、Question Playground とゲームの共通問題経路から解決できる。
2. 2〜6ペアを受理し、各面は文字または画像を最低1つ持つ。`faceDown` 省略時は `true`。
3. ミス0で `score: 1`、ミスごとに減点し、`score` は0未満にならない。`attempts` と `detail.misses` を返す。
4. 裏向きモードと左右列モードの両方が、タッチ・マウス・キーボードで完了できる。
5. 時間切れと abort は `score: 0` で完了し、abort は保留 timer を残さず即時 resolve する。
6. RubyText、TimerBar、Feedback、バトル問題枠、既存ドット絵 UI に適合する。
7. 3問のサンプルと生成 schema が content validation を通る。
8. focused、related、fast、full gates と Playwright/実ブラウザ確認が成功する。
9. 変更は専用ブランチ上の原子的コミットにまとまり、`main` へ merge/push しない。

## Schema Change Reason and Impact

変更理由は、GDD で定義済みだが本番未登録の `pair-match` を content 作成者が JSON だけで利用できるようにするため。影響は新規 `schemas/questions/pair-match.schema.json` と、その schema を参照する新規サンプルに限定する。既存 schema、`QuestionBase`、`QuestionRenderer`、保存データ、ロードマップの契約は変更しない。

## Open Questions

なし。採点式と許容ペア数は参照実装 `d40be101` を維持し、現行契約への適合だけを行う。
