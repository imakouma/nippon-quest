# 東北版リリース統合計画

基点: `3135388` / 統合ブランチ: `codex/tohoku-release-integration`

## 公開ゲート

東北6県について、教材根拠、素材権利、進行完全性、操作性、CI再現性を証拠付きで確認する。
未承認教材または権利不明素材が公開対象に1件でも含まれる場合は No-Go とする。

## 所有範囲

| 担当 | ブランチ | 主な所有範囲 | 触らない範囲 |
|---|---|---|---|
| 教材・学術 | `codex/tohoku-academic-review` | 東北関連問題、curriculum、教材台帳・監査 | 県進行、map、asset、UI、戦闘 |
| コンテンツ・進行 | `codex/tohoku-content-progression` | 東北6県JSON、東北map、進行台帳・検査 | 問題、asset、UI、戦闘・バッグ仕様 |
| 素材・権利・音 | `codex/tohoku-assets-rights` | 東北素材、credits、権利台帳・監査 | 教材、県進行、UI、ゲーム仕様 |
| UI・性能 | `codex/tohoku-ui-performance` | UI/CSS、a11y、計測、UI台帳 | 教材本文、進行、戦闘・バッグ仕様 |
| QA・リリース | `codex/tohoku-qa-release` | E2E、CI、Go/No-Go、QA台帳 | 機能の大改修、教材承認、素材追加 |

共有ファイルが必要な変更は担当ブランチでは行わず、再現手順・根拠とともに統括へ渡す。

## 統合順

1. 教材・学術レビュー
2. 東北コンテンツ・進行
3. 素材・権利・音
4. UI・アクセシビリティ・性能
5. QA・E2E・リリース判定
6. `pnpm check`、全E2E、東北通しE2E、全台帳再生成

競合時は担当変更を推測で削除せず、担当台帳とコミット意図から解消する。

## 外部ブロッカー

- 2026-10-03時点で `gh auth status` はトークン無効。
- GitHub API接続も失敗。ローカル統合を先行し、push/PR/CIは認証・通信回復後に行う。
