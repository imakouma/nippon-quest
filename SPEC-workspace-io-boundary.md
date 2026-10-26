# Spec: workspace-io-boundary

## Objective

約 2.2GB の制作映像素材、Graphify生成物、ビルド生成物、巨大fixtureが、Vite監視、整形、通常のエージェント検査を不要に占有しないようにする。削除や別領域への移動は行わず、既存データを保持する。

## Commands

- Dev server: `pnpm dev:hmr`
- Graph refresh: `graphify update . --no-cluster`

## Project Structure

- `vite.config.ts`: watcher除外
- `.prettierignore`: formatter除外
- `AGENTS.md`: 並列実行と大容量素材の扱い
- `docs/DEVELOPMENT_PERFORMANCE.md`: 運用の正

## Code Style

除外パターンは対象理由をコメントし、ゲーム配信対象を決める `scripts/game-asset-policy.ts` とは責務を混ぜない。

## Testing Strategy

Vite設定の型検査と本番ビルドを実行し、完成素材が従来どおり dist に含まれ、`assets/cinematics` が含まれないことを確認する。

## Boundaries

- Always: 既存素材を保持する。
- Ask first: 制作原本をリポジトリ外へ実際に移動する操作。
- Never: 大容量素材や生成物を無断削除しない。

## Success Criteria

- Vite watcher が制作原本と主要生成物を監視しない。
- 並行チャットでは完全ゲートを統合担当だけが所有する。
- 大容量素材を今後増やす場所が文書化される。

## Open Questions

なし。実ファイル移動は本変更の対象外とする。
