# にっぽん探検たい

小学3〜6年生向け社会科学習クイズアプリ（MVP）。

## 技術スタック

- **フロントエンド**: Next.js (App Router) + TypeScript + Tailwind CSS
- **バックエンド**: Convex（問題データ・進捗同期）
- **状態管理**: Zustand（LocalStorage persist）

## セットアップ

```bash
cd nippon-quest
npm install
npx convex dev --once   # 初回のみ（.env.local 生成）
npm run dev             # 別ターミナルで npx convex dev も推奨
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

## 開発

| コマンド | 説明 |
|---------|------|
| `npm run dev` | Next.js 開発サーバー |
| `npm run convex` | Convex バックエンド |
| `npm run build` | 本番ビルド |

## ルート

- `/` — ホーム（タイトル画面）
- `/quiz/g3_u2` — 3年生 単元2 クイズ
- `/result` — クリア結果

## データ

- 問題データ: `convex/questionData.ts` → Convex DB に seed
- フォールバック: `public/data/questions/g3_unit2.json`
- 進捗: LocalStorage + Convex `userProgress` テーブル
