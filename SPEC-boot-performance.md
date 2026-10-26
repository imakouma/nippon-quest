# Spec: boot-performance

## Objective

タイトル画面の表示を約 3.58MB の全ゲームコンテンツ読込・検証から切り離す。タイトル表示後にコンテンツをバックグラウンドで準備し、開始・再開時には同じ Promise を再利用する。起動段階と配信容量に回帰防止契約を置く。

## Commands

- Focused E2E: `pnpm exec playwright test tests/e2e/smoke.spec.ts tests/e2e/startup-retry.spec.ts`
- Bundle budget: `pnpm check:performance`
- Build: `pnpm build`

## Project Structure

- `src/scenes/Boot.ts`: タイトルに必要な辞書・字体・カタログだけを読む
- `src/main.ts`: ゲームコンテンツの単一遅延Promiseと起動計測
- `scripts/check-performance-budget.ts`: 配信容量の回帰検査
- `tests/e2e/`: タイトル表示とネットワーク順序の契約
- `tests/unit/`: 容量判定の境界テスト

## Code Style

起動計測には標準 Performance API を使い、新しい依存は追加しない。マーカー名は `nq:` 接頭辞で統一する。

## Testing Strategy

先に「コンテンツbundleを遅延させてもタイトルは表示される」E2Eを失敗させる。その後に遅延読込を実装し、開始時の失敗・再試行も確認する。production preview でリソース量とマーカーを再計測する。

## Boundaries

- Always: 開始・続行前には全 ContentIndex の検証を完了する。
- Ask first: なし（本計画は一括承認済み）。
- Never: Zod検証や参照整合性検査を省略して見かけの速度を上げない。

## Success Criteria

- タイトル表示前に `content-bundle.json` を待たない。
- 開始・続行時はコンテンツと学年別問題を正常に読み込む。
- `nq:boot-start`、`nq:title-ready`、`nq:content-ready` のマークが得られる。
- 容量予算超過を `pnpm check:performance` が検出する。

## Open Questions

なし。
