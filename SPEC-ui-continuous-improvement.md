# Spec: UI 継続改善ループ

## Objective

小学生が説明書なし・タッチ操作だけで遊べることを中心に、実際のゲーム画面から UI の問題を見つけ、1 回につき 1 つの小さな改善を「観察 → 修正 → 自動検査 → 実機確認」の順で反復する。

優先順位は次のとおり。

1. 操作不能、進行不能、誤操作
2. 小学生にとって分かりにくい導線やフィードバック
3. 読みづらさ、タップ領域、キーボード操作、コントラスト
4. 情報量、余白、視線誘導、画面サイズへの適応
5. 装飾と演出の一貫性

「無限」は継続タスクの反復方針を示す。各作業単位は安全に完了・検証できる小さな改善とし、未検証の変更を積み上げない。

## Tech Stack

- Phaser 3 のゲーム Canvas
- Preact の DOM オーバーレイ
- TypeScript strict、CSS
- Vitest と Playwright
- 既存の生成ドット絵・アイコン・RubyText

新しい UI ライブラリや依存は追加しない。既存コンポーネント、CSS、ブラウザ標準機能を優先する。

## Commands

```bash
pnpm lint
pnpm check:architecture
pnpm test
pnpm validate:content
pnpm build
pnpm nrd
```

変更箇所に対応する Vitest / Playwright テストを先に実行し、作業単位の完了時に上記の全体検査を行う。

## Project Structure

- `src/ui/`: 共通 UI とフィールド上の DOM オーバーレイ
- `src/questions/renderers/`: 問題タイプごとの独立 UI
- `src/scenes/`: Phaser Scene と UI の調停
- `src/rendering/`: 共通描画と生成アート
- `content/i18n/ja.json`: ユーザー向け UI 文言
- `tests/unit/`: UI モデルや純粋ロジックの振る舞い
- `tests/e2e/`: 実ブラウザ上の主要操作

## Code Style

既存の小さな Preact コンポーネントと CSS クラスを再利用し、表示モデルは純粋な値として渡す。

```tsx
<button class="menu-entry" type="button" onClick={onSelect}>
  <span aria-hidden="true">{icon}</span>
  <RubyLabel text={label} />
</button>
```

- ボタンはネイティブ要素を使い、タッチとキーボードの両方で操作可能にする。
- ユーザー向け文言はコードに直書きせず `content/i18n/ja.json` に置き、RubyText 形式にする。
- Scene に新しい表示責務を積まず、近接する UI / 機能モジュールへ置く。

## Testing Strategy

各ループで次を満たす。

1. 変更前の画面を実ブラウザで観察し、問題と再現条件を記録する。
2. 振る舞い変更には、失敗を再現する最小の Vitest または Playwright テストを先に追加する。
3. 見た目だけの変更では、既存テストに加えて対象画面をデスクトップ幅と狭い幅で確認する。
4. タッチ対象、フォーカス表示、キーボード操作、文字の切れ、重なり、主要導線を確認する。
5. 最新サーバーを `pnpm nrd` で起動し、再現可能な初期状態でスクリーンショットを残す。

## Boundaries

### Always do

- GDD の「ゲーム主体」「不正解で止めない」「文字より絵」「小学生が直感的に触れる」を判断基準にする。
- 1 ループをおおむね 1〜5 ファイル、1 つの問題に限定する。
- 既存の未コミット変更を保持し、重なる箇所は差分を読んでから触る。
- 問題 UI とゲーム本体の三分割、依存方向、RubyText、保存互換性を守る。
- 変更前後を実ブラウザで比較する。

### Ask first

- `src/questions/contracts.ts`、schema、保存形式を変更する。
- 新しい依存を追加する。
- GDD の仕様やゲーム進行を変える。
- 既存の未コミット変更と安全に分離できない修正を行う。

### Never do

- `content/` にロジックを置く、`schemas/` や生成 manifest を直接編集する。
- `Math.random` を使う。
- 見た目のために操作性、アクセシビリティ、フレームレートを悪化させる。
- 未検証の UI 改善をまとめて大量投入する。

## Success Criteria

1. 各改善に、観察した問題、影響するユーザー、変更内容、確認結果がある。
2. 主要操作はタッチだけで完了し、対応するネイティブ操作ではキーボードでも到達できる。
3. 小学 1 年生を想定して、主要操作のタップ領域、可読性、次に何をするかの視線誘導が改善前より明確である。
4. 既存のゲーム進行、問題採点、セーブデータに回帰がない。
5. `pnpm lint`、`pnpm check:architecture`、`pnpm test`、`pnpm validate:content`、`pnpm build` が通る。
6. 各作業単位の最後に最新画面を実ブラウザで確認し、次の UI 問題をバックログの先頭に置く。

## Open Questions

なし。改善対象は実画面の観察結果から優先順位に従って選ぶ。
