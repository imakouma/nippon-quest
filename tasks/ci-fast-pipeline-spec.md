# Spec: 高速CIパイプライン

## Objective

通常のpush／PRで最初の合否を5分以内に返しつつ、既存のブラウザE2Eを削らず並列実行する。
開発者は静的検査・ユニットテスト・ビルド・主要導線のスモーク結果を先に受け取り、
全件E2Eは後続ジョブで完走させる。

## Assumptions

1. GitHub-hosted runnerの待ち時間を除き、高速ゲートの目標は5分以内とする。
2. 現在約30分の通常E2Eは4 shardへ分け、目標クリティカルパスを12分以内とする。
3. 既存テストは削除・skip化せず、現在の通常E2E対象を4 shardの合計で維持する。
4. 全問題監査のような特に重い検査は通常E2Eと同じ頻度へ増やさない。
5. 新しい外部依存や有料サービスは追加しない。

## Tech Stack

- GitHub Actions
- pnpm 10 / Node.js 22
- Vitest
- Playwright + Chromium
- Vite production preview

## Commands

- Fast quality gate: `pnpm lint && pnpm check:architecture && pnpm test && pnpm gen:manifest && pnpm gen:schemas && pnpm validate:content && pnpm build`
- CI smoke: `pnpm test:e2e:smoke`
- Sharded E2E: `pnpm test:e2e -- --shard=<n>/4`
- Local workflow checks: `pnpm lint`, `pnpm test`, `pnpm build`

## Project Structure

- `.github/workflows/ci.yml`: 高速ゲート、E2E matrix、成果物、デプロイ依存関係
- `package.json`: CI用の安定したコマンド入口
- `playwright.config.ts` / `tests/e2e/playwright.prebuilt.config.ts`: 既存buildを再利用する設定
- `tests/e2e/ci-smoke.spec.ts`: 起動・探索・バトルの短い主要導線
- `tasks/ci-fast-pipeline-*.md`: 仕様、計画、検証結果

## Pipeline Design

1. `check` jobがlint、構造検査、全ユニットテスト、生成物検査、コンテンツ検証、buildを実行する。
2. 同じjobでbuild済み`dist/`を使い、短いスモークE2Eを実行する。ここまでを5分以内の必須高速ゲートとする。
3. `dist/`をartifactとして一度だけ保存し、後続の4つのE2E shardが再buildせず利用する。
4. 各shardはChromiumを1 workerで動かす。4 shardの合計対象が現在の`pnpm test:e2e`と一致することを検査する。
5. 失敗時はshard別のPlaywright reportと`test-results/`を保存する。
6. 同じブランチへ新しいpushが来たら古いCIをcancelし、古い結果待ちをなくす。
7. GitHub Pagesのデプロイは高速ゲートと全E2Eの成功後だけ実行する。

## Code Style

```yaml
e2e:
  needs: check
  strategy:
    fail-fast: false
    matrix:
      shard: [1, 2, 3, 4]
```

ジョブ名とstep名は目的が分かる英語にし、複雑なshellロジックはworkflowへ埋め込まず
`package.json`またはPlaywright設定へ寄せる。

## Testing Strategy

- Workflow構文とコマンド入口をローカルで検証する。
- スモークE2Eを先に失敗させ、起動・探索・バトルを短時間で検査できる契約を作る。
- 4 shardをローカルまたはGitHub Actionsで実行し、収集テスト数の合計が単一実行と一致することを確認する。
- PRで実測し、高速ゲートと全E2Eの所要時間をWalkthroughへ記録する。
- 既知のmain上のE2E失敗は本変更でskipせず、そのまま可視化する。

## Boundaries

### Always

- lint、構造検査、全ユニットテスト、コンテンツ検証、buildを高速ゲートに残す。
- E2E失敗成果物をshard別に保存する。
- 既存のテスト対象数を維持する。

### Ask First

- shard数を4より増やしてrunner消費を増やす。
- GitHub Pagesのデプロイ条件を全E2Eより緩くする。
- nightly専用の追加ワークフローを導入する。

### Never

- 高速化のために失敗テストを削除・skip・成功扱いにする。
- secretsやprovider credentialsを追加する。
- ゲーム本体、コンテンツ、セーブ契約を変更する。

## Success Criteria

1. 高速ゲートがrunner待ちを除いて5分以内に結果を返す。
2. 起動・探索・バトルのスモークE2Eが高速ゲート内で成功する。
3. 通常E2Eが4 shardで並列実行され、目標12分以内で完了する。
4. 4 shardの合計テスト対象が現在の通常E2E対象と一致する。
5. 同一ブランチの古い実行が新しいpushでcancelされる。
6. 失敗時にshard別レポートを取得できる。
7. Pagesデプロイは`check`と全E2Eの成功を要求する。

## Open Questions

なし。上記の時間目標と4 shard構成の承認後に計画へ進む。
