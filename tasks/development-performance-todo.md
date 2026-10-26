# 開発速度・起動性能の安定化

## Task 1: formatter対象とfast/fullコマンド

- [ ] `.prettierignore` に巨大fixture、maps、assetsを追加する。
- [ ] `lint`、`check:fast`、`check:full` の互換性ある入口を追加する。
- [ ] 変更前後のlint時間を記録する。

Verify: `pnpm lint`, `pnpm check:fast`

## Task 2: 運用契約

- [ ] 統合担当だけがfull gateを実行する規則を `AGENTS.md` に追加する。
- [ ] 大容量制作物と生成物の扱いを文書化する。

Verify: 文書レビュー、`pnpm exec prettier --check AGENTS.md docs/DEVELOPMENT_PERFORMANCE.md`

## Task 3: アプリ型検査

- [ ] 共通tsconfigを作る。
- [ ] app設定と増分キャッシュを追加する。

Verify: `pnpm typecheck:app`

## Task 4: テスト・ツール型検査

- [ ] tests設定を追加する。
- [ ] tools設定を追加する。
- [ ] 完全型検査コマンドを追加する。

Verify: `pnpm typecheck`

## Task 5: テスト階層

- [ ] data監査対象を明示する。
- [ ] fast / data / related scriptsを追加する。
- [ ] 完全テストが従来対象を維持する。

Verify: `pnpm test:fast`, `pnpm test:data`, `pnpm test`

## Task 6: Workspace I/O

- [ ] Vite watcher ignoreを追加する。
- [ ] 配信アセット方針は変更しない。

Verify: `pnpm typecheck:tools`, `pnpm build`

## Task 7: Graphify checkpoint

- [ ] コードonly graphを更新する。
- [ ] God nodeと変更影響を確認する。

Verify: `graphify god-nodes --top 20`

## Task 8: Boot RED contract

- [ ] content bundleを遅延させてもタイトルが表示されるE2Eを追加する。
- [ ] 実装前に失敗することを確認する。

Verify: smoke E2Eの対象ケース

## Task 9: Boot GREEN implementation

- [ ] Bootを最小データ読込へ変更する。
- [ ] ContentIndexを単一Promiseで背景読込する。
- [ ] start / continueが同じPromiseをawaitする。

Verify: smoke / startup retry E2E

## Task 10: 性能ガード

- [ ] 起動performance marksを追加する。
- [ ] 容量予算の純粋判定とCLIを追加する。
- [ ] 境界テストを追加する。

Verify: unit test、`pnpm check:performance`

## Task 11: Retry lifecycle

- [ ] タイトル起動とゲームデータ起動のエラーを別々に回帰検証する。
- [ ] 画面に内部エラー詳細を露出しない。

Verify: startup retry E2E

## Task 12: Full gate

- [ ] `pnpm lint`
- [ ] `pnpm check:architecture`
- [ ] `pnpm test`
- [ ] `pnpm validate:content`
- [ ] `pnpm build`
- [ ] `pnpm check:performance`

## Task 13: Runtime measurement

- [ ] 最新production previewを起動する。
- [ ] title ready、content ready、読込量を取得する。
- [ ] before/afterを記録する。

## Task 14: Review and handoff

- [ ] 5軸コードレビューを行う。
- [ ] Graphifyを更新する。
- [ ] Walkthroughへ変更・検証・残課題を記録する。
