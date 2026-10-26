# Spec: scoped-typecheck

## Objective

通常のアプリ変更で tests と scripts を含む全 TypeScript を毎回検査しない。アプリ、テスト、ツールを独立して検査でき、同じ入力に対する再検査では増分情報を再利用する。

## Commands

- App: `pnpm typecheck:app`
- Tests: `pnpm typecheck:tests`
- Tools: `pnpm typecheck:tools`
- Full: `pnpm typecheck`

## Project Structure

- `tsconfig.base.json`: 共通コンパイラ契約
- `tsconfig.app.json`: 配信アプリ
- `tsconfig.tests.json`: Vitest / Playwright
- `tsconfig.tools.json`: scripts と設定ファイル
- `tsconfig.json`: エディタ互換の全体設定

## Code Style

全構成で strict と既存 alias を共有する。生成物は `.cache/typescript` だけに置き、配信物へ混ぜない。

## Testing Strategy

4つの型検査コマンドをそれぞれ実行し、完全検査が既存対象を包含することを確認する。変更前の全体型検査 19.1 秒・約 663MB を基準値として記録する。

## Boundaries

- Always: strict 設定と既存の import 解決を維持する。
- Ask first: なし（本計画は一括承認済み）。
- Never: 型エラーを除外設定で隠さない。

## Success Criteria

- アプリだけの型検査が独立して成功する。
- テストとツールも個別に成功する。
- 再実行時に `.tsbuildinfo` を利用する。

## Open Questions

なし。
