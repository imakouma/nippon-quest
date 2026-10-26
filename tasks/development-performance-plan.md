# Implementation Plan: 開発速度・起動性能の安定化

## Overview

計測で確認した全件走査、単一TypeScript対象、テストの一括実行、並行チャットの検査競合、タイトル前の全コンテンツ読込を、機能を削らず段階的に解消する。既存のUI・ゲーム進行・保存データ契約は変更しない。

## Assumptions

1. ユーザーの「全て承認」は、本計画と各specの承認ゲートを事前に通過したものとして扱う。
2. 既存の未コミット変更と進行中チャットの成果はユーザー所有物として保持する。
3. 大容量映像原本は無断移動せず、今回は監視・検査対象から除外する。
4. 高速化のために検証内容を削らず、fast と full の実行タイミングを分ける。

## Baseline

| Metric                     |                               Baseline |
| -------------------------- | -------------------------------------: |
| `tsc --noEmit`             |            19.11秒、約663MB、838 files |
| `eslint .`                 |                                39.24秒 |
| `prettier --check .`       |                               115.66秒 |
| scoped Prettier experiment |                                28.69秒 |
| full Vitest                |        51.43秒、130 files、1,392 tests |
| manifest generation        |                                 4.31秒 |
| production title resources |                       約7.34MB decoded |
| `content-bundle.json`      | 3,575,751 bytes、response end 約3.97秒 |

## Architecture Decisions

- fast gate は反復速度、full gate は統合品質を担当する。
- TypeScript は共通 strict 契約を継承する3対象へ分け、発行物を作らない増分型検査を採用する。
- Vitestのテスト自体は変更せず、実行設定だけで fast / data を分ける。
- Boot はタイトルに必要な最小データだけを読み、完全 ContentIndex は `main.ts` の単一Promiseで背景読込する。
- Performance API とビルド容量検査には既存標準APIだけを使い、依存は追加しない。

## Dependency Graph

`fast-quality-loop` → `scoped-typecheck` / `tiered-tests` / `workspace-io-boundary` → `boot-performance` → full verification → preview

## Task List

### Phase 1: Fast feedback foundation

- [ ] Task 1: formatter対象と fast/full コマンドを分離する
- [ ] Task 2: 並行チャットの検査所有権と大容量データ運用を文書化する

### Checkpoint 1

- [ ] `pnpm lint` が成功し、変更前より明確に短い
- [ ] `pnpm check:fast` が独立して成功する

### Phase 2: Scoped compilers and tests

- [ ] Task 3: TypeScript共通設定とアプリ型検査を分離する
- [ ] Task 4: テスト・ツール型検査と完全型検査を追加する
- [ ] Task 5: Vitest fast / data / related 階層を追加する

### Checkpoint 2

- [ ] 全型検査が成功する
- [ ] fast / data / full テストが成功し、完全対象が維持される

### Phase 3: Workspace I/O

- [ ] Task 6: Vite watcherから制作原本・生成物を除外する
- [ ] Task 7: Graphifyを更新し、巨大Sceneに新責務が増えていないことを確認する

### Checkpoint 3

- [ ] Vite設定の型検査とbuildが成功する
- [ ] `assets/cinematics` は配信物に含まれない

### Phase 4: Boot performance

- [ ] Task 8: タイトル表示が全コンテンツ読込を待たない失敗E2Eを追加する
- [ ] Task 9: Boot最小読込とContentIndex背景読込を実装する
- [ ] Task 10: 起動マーカーと容量予算検査を追加する
- [ ] Task 11: 起動失敗・再試行テストを新ライフサイクルへ合わせる

### Checkpoint 4

- [ ] タイトル表示前に `content-bundle.json` を待たない
- [ ] 開始・続行・再試行が動く
- [ ] 起動マーカーと容量予算検査が成功する

### Phase 5: Final verification

- [ ] Task 12: 必須検査を統合状態で一度ずつ実行する
- [ ] Task 13: production previewを計測し、before/afterを記録する
- [ ] Task 14: コードレビュー、Graphify更新、Walkthroughを完了する

## Risks and Mitigations

| Risk                                  | Impact | Mitigation                                                |
| ------------------------------------- | ------ | --------------------------------------------------------- |
| fast gateだけ実行して統合検査を忘れる | 高     | `check:full` とAGENTS規則を正にし、完了時は必ずfullを実行 |
| lazy loadで開始時にcontentが未準備    | 高     | 単一Promiseを開始・続行の両方でawaitし、背景読込と共有    |
| startup retryの責務が変わる           | 中     | E2Eを先に更新し、タイトルと開始時エラーを別々に検証       |
| tsconfig分割で対象が漏れる            | 高     | root設定を互換用に残し、3設定と完全設定を全て実行         |
| 他チャットの変更と競合                | 高     | 対象ファイルを限定し、既存差分を上書きしない              |
| 性能差が並行負荷のノイズ内            | 中     | 同一コマンドを複数回計測し、明確な差だけを採用            |

## Open Questions

なし。ユーザーの事前承認に基づき実装へ進む。
