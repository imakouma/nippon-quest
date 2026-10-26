# Walkthrough: 学習ロードマップの通常表示と教科解放

## 何を作ったか

- 通常モードから学年・おすすめ時期フィルタと説明ボタンを取り除いた。
- 通常モードは国語・算数・生活科から始まり、各教科ボタンの現在学年だけを表示する。
- 生活科1・2年の必修単元をすべてクリアすると、理科・社会の3年入口を開く。
- 国語・算数1・2年の必修単元をすべてクリアすると、英語を表示する。
- 開発者モードでは従来どおり全教科と学年・時期フィルタを表示する。
- 解放状態は既存セーブの単元進捗から導出し、保存形式は変更していない。

## どう確認したか

- 純粋ロジック・ロードマップ生成・UIのfocused tests: 42件通過。
- 1・2年判定を1年だけに変えるmutationで3テストが失敗し、境界条件が守られていることを確認。
- `pnpm check:full`: lint、architecture、教材監査、全162ファイル/1690テスト、content、curriculum graph、全typecheck、本番build、performance budgetが通過。
- `tests/e2e/progress.spec.ts`: 通常モードと開発者モードの切替を実ブラウザで通過。
- スクリーンショット:
  - `test-results/.../learning-roadmap-normal-mode.png`
  - `test-results/.../learning-roadmap-developer-mode.png`
- `http://127.0.0.1:4193/?preview=roadmap-tree` を通常モードの完成画面で開き、目視確認した。

## 残課題

なし。共有ブランチ・本番への統合は統合担当の範囲。
