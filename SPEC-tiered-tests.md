# Spec: tiered-tests

## Objective

機能実装中は関連テストまたは高速テストを使い、全データ走査は統合時にまとめて実行する。テスト数や検査内容は減らさず、実行タイミングだけを分ける。

## Commands

- Related: `pnpm test:related <source files>`
- Fast: `pnpm test:fast`
- Data audits: `pnpm test:data`
- Full: `pnpm test`

## Project Structure

- `vitest.config.ts`: 完全テストの正
- `vitest.fast.config.ts`: 大容量データ監査を除く日常テスト
- `vitest.data.config.ts`: 大容量データ・描画資産監査
- `package.json`: 安定した入口

## Code Style

テストファイルを移動・改名せず、設定の include だけで用途別入口を作る。分類リストには理由をコメントする。

## Testing Strategy

fast は主要ゲーム基盤、data は全件データ監査を短時間で確認し、最後に完全テスト 1,392 件以上を実行する。個別機能は `test:related` で補い、既存の失敗・skipを追加しない。

## Boundaries

- Always: 完全テストは統合時に必ず実行する。
- Ask first: なし（本計画は一括承認済み）。
- Never: 遅いテストを削除、skip、緩和しない。

## Success Criteria

- 関連・高速・データ・完全の4入口が動く。
- `maps.test.ts` を含むデータ監査が完全ゲートから消えない。
- 日常の fast テストが完全テストより短時間で終わる。

## Open Questions

なし。
