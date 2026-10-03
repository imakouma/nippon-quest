# 東北版 QA 台帳

更新日: 2026-10-03 JST  
対象: `codex/tohoku-qa-release-safe` (`3135388` 基点、型修正 `b3bbf89` を適用)

## 判定証拠

| 項目 | 結果 | 証拠・注記 |
|---|---|---|
| 教材レビュー監査 | BLOCK | `pnpm audit:academic-review`: 44ファイル・4,117問が未承認 |
| 素材監査 | BLOCK | `pnpm audit:assets`: 全体601件、東北86件が静的素材への差し替え待ち |
| 東北地方ボス通しE2E | PASS | prebuilt用configでビルドとテストを分離。ボス撃破、バッグ拡張、保存、再読込、北海道結界を実ブラウザで確認（59.9秒） |
| 6県しるしの解放条件 | PASS | 福島のしるしを欠いた5県状態で「5/6」と表示され、挑戦ボタンがないことを実ブラウザで確認（6.1秒） |
| 2分サーバー終了の切り分け | 設定上は解消済み | `playwright.config.ts` のwebServer待機は240秒。以前の約2分終了はアプリの保存失敗ではなく、外部実行ホストの寿命・接続終了として扱う。今回もアプリ例外の証拠はない |
| 再現可能な公開判定 | 追加 | `node scripts/qa-tohoku-release.mjs`。未承認教材、東北未完成素材、承認記録0件を検出し、NO-GO時は終了コード2 |

## 実行履歴

- `pnpm audit:academic-review`: 成功。44 files / 4117 questions pending。
- `pnpm audit:assets`: 成功。601 static replacements pending (`motif: 498`, `character: 102`, `portrait: 1`)。
- `pnpm exec playwright test tests/e2e/island-progression.spec.ts`: sandboxではtsx IPCソケット作成がEPERM。権限昇格後はproduction buildを開始できたが、呼び出し側の約60秒上限で結果取得前に終了。アプリ障害とは判定しない。
- `node scripts/qa-tohoku-release.mjs`: NO-GOを終了コード2で検出する想定。出力をコミット前検証で再記録する。
- `pnpm test`: 42ファイル・584テスト成功。
- `pnpm validate:content`: 成功（警告602。うち教材レビュー待ち1件の集約警告と不足画像601件）。
- `pnpm exec tsc --noEmit`: 成功。
- `pnpm exec vite build`: 成功（大きいchunkの警告あり）。
- `node scripts/qa-tohoku-release.mjs`: 意図どおりNO-GO、終了コード2。未承認教材44ファイル/4,117問、東北未完成素材86件、教材承認記録0件を検出。
- `pnpm exec playwright test --config tests/e2e/playwright.prebuilt.config.ts island-progression.spec.ts --grep '1つでも欠ける'`: 1件成功（6.1秒）。
- `pnpm exec playwright test --config tests/e2e/playwright.prebuilt.config.ts island-progression.spec.ts --grep 'タップだけ'`: 1件成功（59.9秒）。

## 未完了・ブロッカー

1. 学術責任者による4,117問の承認記録がない。QAは代理承認しない。
2. 東北の静的素材86件が未完成。権利台帳で公開可を確認できるまで公開対象に含めない。
3. 全E2Eは統合コミット上で未実施。今回の担当範囲では東北進行2件を完走済み。
4. 素材担当の権利台帳が統合された後、権利不明が0件であることを再判定する必要がある。

## 再開手順

1. 各担当PRを統合したブランチで `pnpm audit:academic-review` と `pnpm audit:assets` を再生成する。
2. `node scripts/qa-tohoku-release.mjs` を実行し、入力ダイジェストとブロッカー数を保存する。
3. `pnpm check` を実行する。
4. `pnpm exec playwright test tests/e2e/island-progression.spec.ts`、続いて全E2Eを実行する。
5. 実ブラウザで新規開始→東北6県→地方ボス→再読込→北海道結界を確認する。
6. 未承認教材または権利不明素材が1件でも残る場合、判定はNO-GOのまま維持する。
