# NIHON QUEST repository guide

このファイルは、リポジトリを扱う AI と開発者向けの最短の入口です。
作業前に `.agent/rules/nihonquest.md` を読み、仕様判断が必要なら
`docs/00_GAME_DESIGN.md` と `docs/01_ARCHITECTURE.md` を正としてください。

## ディレクトリの責務

| パス                     | 責務                                  | 注意                                                               |
| ------------------------ | ------------------------------------- | ------------------------------------------------------------------ |
| `src/core/`              | Phaser・Preact 非依存のゲームロジック | `scenes/`、`ui/` に依存しない                                      |
| `src/questions/`         | 出題エンジン、契約、問題レンダラー    | 接点の正は `contracts.ts`                                          |
| `src/rendering/`         | 共通描画・仮ドット絵生成              | Scene・UI実装へ依存しない                                          |
| `src/scenes/`            | Phaser Sceneとゲーム進行の調停        | 新機能を巨大 Scene に直接足さず、機能別モジュールへ分ける          |
| `src/ui/`                | Preact の DOM オーバーレイ            | Scene 実装や保存先へ直接依存しない                                 |
| `src/shared/`            | 層をまたぐ型・純粋な契約              | 実装層へ依存しない                                                 |
| `src/tools/`             | Playground、エディタなど開発専用 UI   | ゲーム本体の入口に混ぜない                                         |
| `content/`               | ゲーム・教材データ                    | JSON と画像パスだけ。ロジック禁止                                  |
| `assets/`                | 配信する画像・音声                    | 概要は生成物 `catalog.json`、命名規則は `docs/03_IMAGE_PROMPTS.md` |
| `maps/`                  | マップの唯一の編集・生成元            | devで直接配信し、build時に `dist/maps/` へコピーする               |
| `schemas/`               | エディタ補完用 JSON Schema            | `pnpm gen:schemas` の生成物。直接編集しない                        |
| `scripts/`               | 生成、検証、監査、移行ツール          | 地理などの生成元データは `scripts/data/`                           |
| `imports/`               | 旧データの移行記録・レビュー          | ランタイムから参照しない                                           |
| `raw/`                   | 未加工素材の一時置き場                | Git 管理対象外（`.gitkeep` を除く）                                |
| `dist/`, `test-results/` | ビルド・テスト生成物                  | 直接編集・レビュー対象にしない                                     |

## 依存方向

基本方向は `content -> loader/engine -> scenes -> ui`、描画は `core -> rendering -> scenes/ui` です。ただし UI は callback や
純粋なモデルだけを受け取り、Scene や永続化実装へ逆依存させません。

- `src/core/` は表示ライブラリと表示層を import しない。
- `src/questions/renderers/` は Phaser、Scene、GameState を import しない。
- `src/core/` と `src/scenes/` は問題タイプ名で分岐せず、`QuestionResult.score` だけを見る。
- 永続化 API は `src/core/state/save.ts` に集約する。
- 乱数は `src/core/rng.ts` 経由とし、`Math.random` は使わない。

`pnpm check:architecture` がこれらの境界と巨大ファイルの増加を検査します。

## 変更時の判断

- `src/scenes/Overworld.ts` と `src/scenes/Battle.ts` は既存の大きな統合点です。
  新しい責務は近接する `overworld/`、`battle/`、または用途名のモジュールへ抽出します。
- マップは `maps/` だけを編集します。`public/maps/` のコピーは廃止済みです。
- `content/manifest.json` と bundle 類は生成物です。問題追加後は `pnpm gen:manifest` を使います。
- `assets/catalog.json` も `pnpm gen:manifest` で再生成します。直接編集しません。
- `contracts.ts` や schema の変更は広範囲に影響します。プロジェクトルールに従い、先に理由と影響を確認します。
- 作業ツリーに既存変更がある場合は、それを保持し、無関係な整形や移動を混ぜません。

## 最低限の確認

変更範囲に応じて個別検査を先に実行し、完了時は原則として次を実行します。

```bash
pnpm lint
pnpm check:architecture
pnpm test
pnpm validate:content
pnpm build
```

## 修正完了時のプレビュー

- ユーザー向けの修正が完了したら、検査だけで終えず `pnpm nrd` などで最新版の確認用サーバーを起動する。
- Codex の右側にあるアプリ内ブラウザで、修正箇所をすぐ確認できる画面を開いてから完了報告する。
- 古い開発サーバーを使い回さず、必要に応じて終了してから最新版を起動する。
- 古いセーブデータとの不整合が疑われる場合は `?resetSaves=1` を付けた開発用URLで開き、初期化後の新しい状態を確認する。
- 入力欄などの状態を残す必要がある検証を除き、完了時のプレビューは再現可能な初期状態にする。
