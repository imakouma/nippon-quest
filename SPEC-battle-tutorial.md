# Spec: 初回バトルチュートリアル

## Objective

新規ゲームのプロローグ終了直後に、ミチルとの短い会話としてバトルの基本を説明する。
小学生が最初の戦闘で「何を選ぶか」「問題に答える意味」「ゲージの使い方」「逃げられること」を理解できる状態を目標とする。

## User flow

1. 主人公の名前決定後、プロローグ本編が終了する。
2. 物語画面が閉じた直後、通常の会話枠でミチルがバトルの説明を始める。
3. 次の4項目を1画面ずつ説明する。
   - 敵に近づくとバトルが始まる。
   - 「わざ」を選ぶと問題が出て、正しく答えるほど攻撃が強くなる。
   - 問題に答えると教科ゲージがたまり、たまると強い技を使える。
   - 危ないときは「にげる」を選べる。すばやさが高いほど逃げやすい。
4. 最後まで進めるとフィールド操作へ戻る。

ストーリー側の「スキップ」は物語だけを省略し、初回バトルチュートリアルは省略しない。

## Persistence

- プロローグ完了時に専用の pending counter を保存し、説明完了時に `progress.eventsDone` へ専用イベントIDを保存する。
- pending のままアプリを閉じても、青森フィールドへ戻った次回起動時に再表示する。
- 既存セーブでは突然割り込ませず、プロローグを今回完了した新規ゲームだけを通常導線の対象にする。

## Project structure

- `src/core/progression/`: 表示済み判定と完了状態を扱う純粋関数。
- `src/scenes/overworld/`: プロローグ終了後の表示順を調停する。
- `src/scenes/overworld/storyScenes.ts`: チュートリアル会話モデル。
- `content/i18n/ja.json`: RubyText形式の表示文言。
- `tests/unit/`, `tests/e2e/`: 一度だけ表示される契約と実際の新規ゲーム導線を検証する。

## Commands

- Focused unit test: `pnpm vitest run tests/unit/battleTutorial.test.ts`
- Focused E2E: `pnpm exec playwright test tests/e2e/battle-tutorial.spec.ts`
- Lint: `pnpm lint`
- Architecture: `pnpm check:architecture`
- Full tests: `pnpm test`
- Content: `pnpm validate:content`
- Build: `pnpm build`

## Code style

```ts
export const BATTLE_TUTORIAL_EVENT = 'tutorial.battle-basics';

export function hasSeenBattleTutorial(game: Pick<GameState, 'progress'>): boolean {
  return game.progress.eventsDone.includes(BATTLE_TUTORIAL_EVENT);
}
```

- 表示文言をコードへ直書きせず `content/i18n/ja.json` に置く。
- 進行判定は Phaser・Preact 非依存の純粋関数にする。
- 既存の会話UIを再利用し、新しい依存ライブラリは追加しない。

## Testing strategy

- Unit: 未表示・表示済み判定、完了時の一度だけの保存、元状態を破壊しないこと。
- E2E: 新規ゲームでプロローグをスキップしてもチュートリアルが表示され、完了後にフィールドへ戻り、再読込しても再表示されないこと。
- Visual: PC幅とスマホ相当幅で、文字・ボタン・ルビが見切れないこと。

## Boundaries

- Always: 小学生向けの短い文、RubyText、既存セーブ互換、キーボードとタップの両対応。
- Ask first: チュートリアル専用バトルを強制する、報酬を変更する、保存スキーマを変更する。
- Never: 通常バトルごとに繰り返す、最初の敵を強制出現させる、問題の正解を要求して進行を止める。

## Success criteria

- プロローグ終了直後に自然なミチルの会話として始まる。
- ストーリースキップ後も初回だけ表示される。
- 完了後は同じセーブで二度と自動表示されない。
- 既存のバトル計算・問題エンジン・通常会話に影響しない。
- ユニットテスト、E2E、ビルドが成功する。

## Open question

- 説明は上記4項目で確定するか。初回に説明し過ぎないよう、「どうぐ」「いれかえ」は仲間や道具を得た時点の説明へ残す。
