# Spec: Question Browser Tree

## Module

`question-browser-tree`（`CAPABILITY-MAP-question-content-hierarchy.md` で承認済み）

## Objective

Question Playground の問題一覧に、生成済み `questionCatalog` を使った
教科 → 学年 → 単元 → セットの閲覧ツリーを追加する。

問題作成者と開発者はファイル名を総当たりせず目的のセットへ移動でき、セットを選ぶと既存の問題表がそのファイルだけに絞られる。既存の全件検証、検索、フィルター、問題実行、ID直リンクは維持する。

## Assumptions

1. 対象は開発用 `/playground.html` だけで、ゲーム本編の子ども向けUIは変更しない。
2. ツリーは `content/manifest.json` の `questionCatalog` だけから構築し、問題本文から階層を再計算しない。
3. 初期状態は「すべて」を選び、現在の全件表とエラー検出を保つ。
4. 絞り込み単位はセットファイル。教科・学年・単元は開閉用の階層であり、クリックによる中間階層絞り込みは追加しない。
5. `_samples` は本番カタログに含まれないためツリーに出さず、既存チェックボックスとファイル選択から引き続き開ける。

## Tech Stack

- Preact + TypeScript strict
- 既存 `QuestionCatalog` 型と `QuestionList`
- 既存 `playground.css`
- Vitest / Playwright
- 新規依存なし

## Commands

- Focused E2E: `E2E_PORT=4188 pnpm exec playwright test tests/e2e/playground-list.spec.ts`
- Related tests: `pnpm test:related src/tools/QuestionTree.tsx src/tools/QuestionList.tsx src/tools/playground.tsx`
- Lint: `pnpm lint`
- Architecture: `pnpm check:architecture`
- Tests: `pnpm test`
- Content: `pnpm validate:content`
- Build: `pnpm build`

## Project Structure

- `src/tools/QuestionTree.tsx`: カタログ階層の表示とセット選択だけを担当する。
- `src/tools/QuestionList.tsx`: 選択セットを既存のフィルター条件へ加える。
- `src/tools/playground.tsx`: manifestから受け取ったカタログを一覧へ渡す。
- `src/tools/playground.css`: ツリーと既存表の2カラム・狭幅配置。
- `tests/e2e/playground-list.spec.ts`: 階層表示、セット絞り込み、解除、既存選択フロー。
- `docs/01_ARCHITECTURE.md`: Playgroundの現在仕様。

## Interaction and Accessibility

- 教科・学年・単元はネイティブ `<details><summary>` で開閉する。
- セットと「すべて」は `<button type="button">` とし、キーボードで操作できる。
- 選択中セットは見た目だけでなく `aria-pressed` で伝える。
- 各階層とセットに問題数を表示する。
- 単元は `units.json` の表示名を優先し、なければ単元IDを表示する。
- 教科は既存i18n辞書の表示名を優先する。
- 狭い画面ではツリーを表の上に積み、横スクロールをページ全体へ漏らさない。

## Code Style

既存のPreact関数コンポーネントとclass命名を使い、ツリーは表示専用の小さなコンポーネントに分ける。

```tsx
<QuestionTree catalog={catalog} selectedFile={scopeFile} onSelectFile={setScopeFile} />
```

独自tree状態モデル、汎用階層ライブラリ、再帰データ変換は追加しない。

## Testing Strategy

- E2Eで、教科→学年→単元→セットが表示されることを確認する。
- セットを選ぶと表の全行がそのセット由来になり、件数表示がセット件数になることを確認する。
- 「すべて」で全件へ戻ることを確認する。
- 既存の検索、行選択、`?q=`直リンクテストを維持する。
- 実ブラウザでデスクトップ幅と狭幅を確認し、キーボードでセットを選択する。

## Boundaries

### Always

- `questionCatalog` を唯一の階層情報源にする。
- カタログが省略された旧manifestではツリーを出さず、既存表をそのまま使えるようにする。
- 問題の不正データ表示と全件エラー検出を維持する。
- 既存のファイル選択、JSON直接編集、レンダラー実行を維持する。

### Ask first

- `ContentManifest`、`QuestionCatalog`、問題契約の変更。
- 新しい依存の追加。
- 全件問題読込やエラー監査の削除。

### Never

- 問題JSON、manifest生成、QuestionBank、保存データを変更しない。
- `_samples` を本番カタログへ混ぜない。
- 問題タイプ別の分岐をツリーへ追加しない。
- merge / push / deployを行わない。

## Success Criteria

- 教科→学年→単元→セットの順で、カタログ件数と一致するツリーが表示される。
- セット選択で既存表がそのファイルだけになり、「すべて」で全件へ戻る。
- ツリー描画に問題本文の解析を使わない。
- セット操作がマウスとキーボードで行え、選択状態を支援技術へ伝えられる。
- 960px幅と320px幅でツリーと表が操作可能で、重大な切れ・重なりがない。
- 既存のフィルター、検索、エラー表示、行選択、問題実行、ID直リンクが動く。
- 標準検査と実ブラウザ確認が完了する。既存の無関係な失敗は回帰と分離して記録する。

## Explicit Exclusions

- 教科・学年・単元ボタンによる中間階層絞り込み。
- ツリー内検索、開閉状態の永続化、仮想スクロール。
- AIチャットや問題編集機能。
- ゲーム本編の学習ロードマップ変更。
- 問題データや学術レビュー状態の変更。

## Open Questions

なし。
