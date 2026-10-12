# 探索効果音 Walkthrough

## 成果

草・砂・石・水辺の足音4種と、扉・宝箱の単発SEを追加。Stable Audio 3 Small SFXによる無料ローカル生成で、既存曲や録音は入力していない。足音は140ms、扉650ms、宝箱700ms。6音源合計37,040 bytes。

既存SEモジュールへ先読み・AudioBufferキャッシュ・終了時の接続解放を追加。歩行完了時だけ一回再生し、停止・壁・戦闘中には新しい足音を起動しない。読込待ちの足音を後から再生しない。既存のSE音量・ミュートに従い、入口/出口と初回宝箱開封へ接続。生成証跡とSHA-256を権利台帳へ登録し、素材一覧は `pnpm gen:manifest` で同期した。

## 検証

- RED → GREEN: 新しい選音・先読み処理のテストが最初に失敗することを確認して実装。
- 一時的に砂を草へ誤選音させると3テストが失敗。復元後は集中テストが成功。
- `pnpm test`: 97ファイル / 1,144テスト成功。
- `pnpm check:architecture`: 成功。巨大Sceneには接続点だけ追加。
- `pnpm validate:content`（build前処理）・`pnpm build`・TypeScript: 成功。
- 変更したソース・テスト・証跡のESLint/Prettierと `git diff --check`: 成功。
- `pnpm lint`: 今回未変更の既存8ファイルのPrettier違反で失敗。`scripts/audit-battle-balance.ts`、`scripts/gen-manifest.ts`、`SPEC-academic-battle-stats.md`、`src/core/battle/factory.ts`、`tasks/academic-battle-stats-plan.md`、`tests/e2e/startup-retry.spec.ts`、`tests/unit/battle.test.ts`、`tests/unit/meisan.test.ts`。これらの差分は0で、無関係な整形は混ぜていない。
- Chromium E2E: 実MP3の取得/デコードとWeb Audioの再生を監視し、4地面の足音、停止、壁、音量0、入口、初回/開封済み宝箱を確認。6回の取得だけで再利用されることも検査。BGMの全場面・勝敗・探索復帰の回帰検査も成功。
- アプリ内ブラウザ: 4175の新ビルドで戦闘から逃走し、探索へ戻って歩行操作を確認。
- Graphify: コードのみのローカル解析を実施。外部LLM不使用。

E2E画面: `test-results/field-sounds-実音源をデコードし、歩行・停止・壁・消音・入口・宝箱へ効果音を同期する/exploration-sounds.png`（検証生成物、Git対象外）。

## ブランチ・未反映状態

BGMは `codex/game-music` / `9432086` を `imakouma` へpush済み。探索SEはそのコミットを基点にした `codex/exploration-sfx` / `78e33fa` の専用worktreeで実装し、共有ブランチの大量の既存変更を含めずにpush済み。

ユーザーの追加指示により、探索SEの差分を共有作業ツリーへ反映した。既存変更のあるファイルは事前にバックアップし、今回の対象以外の781ファイルが変わっていないことをハッシュで確認した。共有側で `pnpm lint`、`pnpm check:architecture`、`pnpm test`（111ファイル / 1,216テスト）、`pnpm validate:content`、`pnpm build` がすべて成功。

古い正規4174サーバーを終了し、共有側の最新ビルドから起動し直した。4174上で探索SE・BGMのChromium E2E 2件が成功し、アプリ内ブラウザでも戦闘から探索へ戻り、歩行操作と画面・コンソールエラーなしを確認した。作業用4175サーバーとそのタブは終了済み。共有側の既存未コミット変更は保持しており、共有ブランチ/mainのpushは行っていない。

次の範囲は、既存の合成バトルSE（攻撃・被ダメージ・回復等）の音源品質調整。今回の探索音の聴感評価と統合後、必要な場面を順に置換できる。モデル利用の年間売上条件はBGMと同じ。
