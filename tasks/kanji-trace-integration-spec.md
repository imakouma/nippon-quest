# Spec: kanji-trace renderer integration

## Objective

本番基点へ `kanji-trace` renderer を復帰し、恐山イベントで「山・石・風」の問題を実際に出題できるようにする。小学生がタッチだけでなぞれて、短い画面でも操作でき、採点・時間切れ・中断が既存 `QuestionResult` 契約に従うことを成功条件とする。

## Commands

- Focused: `pnpm exec vitest run tests/unit/kanjiTrace.test.ts tests/unit/rendererAbort.test.ts tests/unit/questions.test.ts tests/unit/content.test.ts`
- Related: `pnpm test:related src/questions/renderers/kanji-trace/index.ts src/questions/renderers/kanji-trace/KanjiTraceView.tsx src/questions/renderers/kanji-trace/schema.ts`
- Fast: `pnpm check:fast`
- Full gates: `pnpm lint && pnpm check:architecture && pnpm test && pnpm validate:content && pnpm build`
- Preview: `pnpm exec vite preview --host 127.0.0.1 --port 4185 --strictPort`

## Structure and style

- Renderer は `src/questions/renderers/kanji-trace/` に閉じ、Phaser・Scene・GameState を import しない。
- 現行 renderer と同じく mount と Preact view を分け、schema を renderer が所有する。
- 文言は `content/i18n/ja.json`、問題は `content/questions/`、JSON Schema は `pnpm gen:schemas` の生成物とする。

## Testing strategy

- Vitest: 採点、schema、registry、タッチ、ルビ、読み、abort、恐山向け問題選択。
- Content/schema gates: 問題JSONと生成schemaの整合。
- 実ブラウザ: Playgroundでタッチ相当のpointer入力、960×540と短い640×360、console、操作部品、結果を確認する。

## Boundaries

- Always: `QuestionResult.score`、既存RubyText、48px以上の操作部品、失敗を責めない表示を守る。
- Ask first: `contracts.ts`、保存形式、依存追加が必要になった場合は停止する。
- Never: Scene/coreで問題タイプ分岐を増やさない。ロードマップ・アニメーションを変更しない。

## Success criteria

- `kanji-trace` が registry と生成schemaに登録される。
- trace は線の近さとお手本の被覆率の小さい方で 0〜1 採点し、塗りつぶし・一部だけを高得点にしない。
- reading はひらがな選択で採点できる。
- タッチ、ルビ、時間切れ、即時abort、短い画面で操作できる。
- 恐山イベントの query が追加問題から候補を取得できる。
- focused/related/full gates と実ブラウザ確認が通る。

## Open questions

なし。現行契約と既存恐山イベントで実装可能。
