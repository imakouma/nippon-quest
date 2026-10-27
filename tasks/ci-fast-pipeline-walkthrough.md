# Walkthrough: 高速CIパイプライン

## Result

通常の品質検査と全件ブラウザE2Eを分離した。`check`はlint、構造検査、全unit、
content検証、production buildに加えて3本の主要導線スモークを実行し、同じ`dist/`を
4つの後続E2E shardへ渡す。既存の通常E2E対象は削除・skipしていない。

## Timing

| 対象             |             Before |           Local after | GitHub after |
| ---------------- | -----------------: | --------------------: | -----------: |
| 通常E2E          | 約32〜36分（直列） |          対象収集のみ | push後に記録 |
| 主要導線スモーク |               なし | 最終18.2秒（3/3成功） | push後に記録 |
| production build |             約19秒 |                  成功 | push後に記録 |

GitHub-hosted runner上の高速ゲート5分以内、最長E2E shard 12分以内という目標は、
ブランチをpushして実際のActions結果が得られた時点で判定する。

## Coverage split

通常E2Eの収集結果は128件／39ファイルだった。Playwrightの標準shardで収集した内訳は
35件、29件、34件、30件で、合計128件となり単一実行と一致した。新規3件のスモークも
通常E2Eへ含まれるため、従来125件からテスト対象を増やしている。

## Failure handling

- 同じブランチへ新しいpushが来ると、古いCI runを自動cancelする。
- 各shardの失敗時に`playwright-report`と`test-results`を別artifactとして7日保存する。
- Pagesは`check`と4つのE2E shardすべてが成功した後だけデプロイする。
- main由来で既知のE2E失敗7件はskipせず、該当shardの失敗として引き続き表示する。

## Local verification

- CI契約テスト: 4/4成功。
- Mutation確認: `cancel-in-progress`を一時的に無効化すると契約テスト1件が期待どおり失敗し、復元後に成功。
- スモークE2E: 3回とも3/3成功（最終18.2秒）。
- shard収集: 35 + 29 + 34 + 30 = 128件。
- lint: 成功。
- architecture: 成功。
- unit: 180ファイル、1795件成功。
- content: 47地域、542モンスター、462アイテム、37スキル、86問題ファイルを検証して成功。
- production build: 491 modulesを変換して成功。

コミットIDはコミット後の完了報告に記載する。
