# Google アカウント保存の実装計画

仕様: `spec/SPEC-account-cloud-save.md`。2026-11-24 に実装承認済み。
既存の `tasks/plan.md` / `tasks/todo.md` は別作業のため保持する。

- [x] 認証設定とプロバイダー検証: Better Auth 1.7.27、pg 8.23.1 を追加。手製の OAuth を避けるため。プロフィールを保存しない動作、state/PKCE、session を検査する。
- [x] PostgreSQL 保存 API: 所有者検証、revision による競合防止、削除マーカー、入力検証、レート制限。API と SQL のテストを先に追加する。
- [x] アカウント別ローカル保存: 既存ゲスト API を維持し、アカウント保存を分離。オフライン・再送・アカウント切替のテストを追加する。
- [x] 同期 UI: タイトルのアカウント画面、引き継ぎ、競合解決、エクスポート／削除。UI は純粋モデルと callback を受け取る。
- [x] 起動構成とセットアップ: 同一 origin の Node 配信、Vite の開発 proxy、環境変数の例、DB migration。資格情報未設定時はログイン不可を正しく表示。
- [x] 検証: 関連 Vitest、認証・所有者検証の mutation check、Playwright、lint、architecture、全 unit、content validation、build。重い検査は順次実行する。
- [x] Graphify 更新、レビュー、walkthrough、コミット。共有ブランチへの merge/push はしない。

セキュリティ境界: Cookie と OAuth callback、API JSON、IndexedDB、アカウント切替、DB。
最大の事故はアカウント間の混入と古い端末による上書き。API に expected-owner と revision を要求し、ローカル namespace と送信待ちを固定する。
外部の実アカウント検証は OAuth 設定を必要とし、模擬認証の E2E と区別する。

追加セットアップ: Googleから直接ダウンロードしたWeb OAuth JSONをローカルで `.env` に取り込む補助スクリプト。秘密値をログに出さず、callback照合・既存設定保持・0600権限を検査する。外部ブラウザ経由での秘密値取得は行わない。

追加: PGlite 0.6.0 は PostgreSQL SQL のテスト用。Node 22.10以上を要求。別チャットの既存計画書は変更していない。外部プロバイダー・本番DBへの接続は登録情報未設定のため未実施。

2026-11-25: ユーザーがGoogle専用へ変更を指示。LINEのUI・認証設定・callback・環境変数例を削除し、Googleの識別子と保存形式は維持。関連テストと実ブラウザで確認する。
