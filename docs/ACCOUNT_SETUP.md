# LINE・Google ログインとクラウド保存の設定

ゲームのゲスト利用はそのまま使えます。実際のログインには、PostgreSQL、Node.js 22.10 以上のサーバー、各プロバイダーの登録が必要です。ブラウザへ配信する JavaScript に秘密鍵は含めません。

## ローカル起動

1. PostgreSQL に NIHON QUEST 専用 DB とユーザーを作成します。
2. `.env.example` を `.env` にコピーし、DB 接続先と秘密鍵を設定します。`.env` は Git 対象外です。秘密鍵をチャットへ貼り付けないでください。
3. `BETTER_AUTH_SECRET` は十分なランダム値にします。例: `openssl rand -hex 32`。サーバー再起動ごとに変更しないでください。
4. `NQ_ORIGIN` は実際にブラウザで開く origin と一致させます。作業用の例は `http://127.0.0.1:4177`、API の `PORT` は `8789` です。既存の4174は変更しません。
5. `pnpm db:migrate` を実行します。Better Auth のテーブルと、保存・レート制限テーブルを追加します。migration はサーバー起動時に自動実行しません。
6. `pnpm start` で API を起動します。
7. 別ターミナルで `NQ_API_ORIGIN=http://127.0.0.1:8789 pnpm exec vite --host 127.0.0.1 --port 4177 --strictPort` を実行します。

`.env` は Node サーバーが読み込みます。Vite proxy の `NQ_API_ORIGIN` は起動コマンドに渡してください。
資格情報を設定していない環境では、ログインボタンを無効化し、端末内のゲスト利用を案内します。

## プロバイダー登録

### Google

Google Cloud Console で OAuth 同意画面と Web アプリの OAuth クライアントを作成します。
`GOOGLE_CLIENT_ID` と `GOOGLE_CLIENT_SECRET` をサーバーに設定します。
許可するリダイレクト URI は `<NQ_ORIGIN>/api/auth/callback/google` です。
公開前は登録したテストユーザーで検証します。公開条件は Console の表示に従って設定します。

### LINE

LINE Developers Console で LINE Login チャネル（Web）を作成します。
Channel ID を `LINE_CLIENT_ID`、Channel secret を `LINE_CLIENT_SECRET` に設定します。
Callback URL は `<NQ_ORIGIN>/api/auth/callback/line` です。
開発中はチャネルの権限を持つテストアカウントで検証し、公開時はチャネルの公開状態を確認します。
メールアドレス取得権限は要求しません。

双方とも要求 scope は `openid` のみです。Better Auth が必要とする email 形の内部キーは provider と subject の SHA-256 を使い、配送不能な予約ドメイン `accounts.invalid` で作成します。これは実メールではなく、メール送信・パスワード再設定には使いません。表示名は provider 名、プロフィール画像は未保存、OAuth token は保存前フックで除去します。プロバイダーごとのアカウントを自動結合しません。

## 本番配信

- `pnpm build` 後、同じプロジェクトルートで `pnpm start` を起動します。`dist/` と `/api/` を同じ origin で提供します。
- TLS 終端 proxy の背後に配置し、`NQ_ORIGIN=https://実際のホスト` を設定します。サーバーをコンテナ外へ公開する場合だけ適切な `HOST` を設定します。
- `NQ_TRUSTED_PROXY_IP` には Node に接続する proxy の IP を一つだけ指定できます。その proxy は `X-Forwarded-For` を実クライアントの単一 IP で**上書き**してください。チェーンの追記・ユーザー入力の転送はしません。未指定のときは socket IP を使います。
- proxy が無いクライアントからの IP ヘッダーは信用しません。proxy 設定が無いまま本番運用するとログイン回数制限が proxy 全体にかかるため、公開前に異なるクライアントから確認します。
- PostgreSQL は認証用の private 接続または TLS を使い、認証・保存 DB を公開閲覧可能にしません。
- 本番の接続文字列・OAuth secret はホスティング側の secret 管理へ登録します。`VITE_` 接頭辞は付けません。
- 静的ホスティングだけでは API は提供できません。既存の公開先へこのブランチを反映するだけでは、実ログインは有効になりません。
- 運用バックアップは保持期間を設定し、アカウント削除後も復元で削除済みアカウントを再公開しない手順を定めてください。公開前にプライバシー案内へ保存先・保持期間を記載します。
- Better Auth の期限切れ session／verification／rateLimit 行は、利用する DB の定期保守で削除します。保存データは本人によるアカウント削除で user の外部キーから cascade 削除します。

## 同期と復元

- 既存3スロットをアカウントごとに維持します。ゲストのデータは確認後に選択したスロットをコピーし、元のゲストデータは残します。
- 通信断時は端末に未送信データを保持します。プレイ中の保存、オンライン復帰、30秒ごとの再試行で送信します。
- オフラインでページを閉じた場合、次にアカウントの本人確認ができるまでアカウントの冒険を開きません。ゲストの冒険は使えます。
- 別端末の更新と競合すると同期を止めます。アカウント画面で両方の更新日時・進行を確認して選びます。
- 同じブラウザでは Web Locks によって一つのタブだけがアカウントの冒険を開きます。同一アカウントを開いている他タブを閉じて再読み込みすると解除されます。Web Locks 非対応環境はアカウントのプレイを開始しません。
- アカウント削除には5分以内の新しいログインが必要です。削除後は端末のそのアカウント用キャッシュも削除します。ゲストデータは削除しません。
- 機能を無効化する際は先にデータをエクスポートします。DB を消すことをロールバック手段にしません。ゲスト保存の形式は変えていません。

## 検証

```bash
pnpm exec vitest run tests/unit/accountApi.test.ts tests/unit/accountAuth.test.ts tests/unit/accountCloudSave.test.ts tests/unit/accountRepository.test.ts tests/unit/accountClientIp.test.ts
pnpm check:fast
```

SQL はテスト専用の PGlite で実際に実行します。PGlite は本番依存には含めません。
ブラウザ検査 `tests/e2e/account-cloud-save.spec.ts` は API を模擬して、引き継ぎ・別ブラウザ復元・複数タブ制限・ログアウトを検査します。実際の LINE／Google の本人認証を通過したことの代わりにはなりません。

公開前に、実プロバイダーでログイン・拒否・再ログイン・別端末復元・ログアウトを両方確認します。

公式資料: [Better Auth LINE](https://better-auth.com/docs/authentication/line)、[Google](https://better-auth.com/docs/authentication/google)、[PostgreSQL](https://better-auth.com/docs/adapters/postgresql)、[LINE Login Web統合](https://developers.line.biz/en/docs/line-login/integrate-line-login/)。
