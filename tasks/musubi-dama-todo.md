# 仲間化アイテム「むすび玉」Tasks

## Task 1: 商品契約と全町在庫

**Description:** `Item.use` に仲間化効果を表す契約を追加し、30Gのむすび玉を全町の通常ショップへ重複なく並べる。

**Acceptance criteria:**

- [x] `common-musubi-dama` がコンテンツ検証を通る消費アイテムとして存在する。
- [x] 明示在庫・自動在庫の全町で1枠だけ表示される。
- [x] 30Gで購入・15Gで売却できる。

**Verification:** `pnpm vitest run tests/unit/content.test.ts tests/unit/town.test.ts`

**Dependencies:** None

**Files likely touched:**

- `src/core/content/schemas.ts`
- `content/items/common-musubi-dama.json`
- `src/core/progression/town.ts`
- `tests/unit/content.test.ts`
- `tests/unit/town.test.ts`

**Estimated scope:** Medium

## Task 2: 捕獲確率と消費

**Description:** HP、敵固有率、正解度、回答時間、時間倍率から成功率を決め、成功・失敗・使用不可の状態遷移を純粋関数で実装する。

**Acceptance criteria:**

- [x] HP低下、score上昇、回答時間短縮で成功率が単調増加する。
- [x] 不正解・ボス・加入不可敵では成功せず、使用不可時は消費しない。
- [x] 解答済みの成功・失敗では1個だけ消費し、成功時は `recruited` になる。

**Verification:** `pnpm vitest run tests/unit/battle.test.ts tests/unit/musubiDama.test.ts`

**Dependencies:** Task 1

**Files likely touched:**

- `src/core/battle/musubiDama.ts`
- `src/core/battle/types.ts`
- `src/core/battle/engine.ts`
- `tests/unit/musubiDama.test.ts`
- `tests/unit/battle.test.ts`

**Estimated scope:** Medium

## Checkpoint: Foundation

- [x] Tasks 1–2のテストが通る。
- [x] 既存の好物・問題回答型仲間化テストが通る。

## Task 3: バトル問題とどうぐUI

**Description:** むすび玉選択時に県・学年に合う問題を既存問題枠で出し、解答結果を捕獲コマンドへ渡す。

**Acceptance criteria:**

- [x] どうぐ一覧に個数・説明・使用可否が表示される。
- [x] 選択後に問題が1問出て、score・timeMs・時間倍率が捕獲判定へ渡る。
- [x] 問題なし・中断・使用不可ではアイテムを消費しない。

**Verification:** `pnpm vitest run tests/unit/battleQuestionQueries.test.ts tests/unit/battleUi.test.ts tests/unit/battle.test.ts`

**Dependencies:** Task 2

**Files likely touched:**

- `src/scenes/battle/musubiDamaFlow.ts`
- `src/scenes/battle/questionQueries.ts`
- `src/scenes/battle/hudViews.ts`
- `src/scenes/Battle.ts`
- `tests/unit/battleQuestionQueries.test.ts`

**Estimated scope:** Medium

## Task 4: 青森の購入導入

**Description:** 青森の町へ初到着したとき店へ案内し、初購入後に使い方を説明して完了を保存する。

**Acceptance criteria:**

- [x] 新規セーブでは町到着会話の後に購入目的が示される。
- [x] 初購入後に弱らせる・問題・速度の説明が一度だけ出る。
- [x] 既存セーブは未購入時だけ青森再訪で補完され、完了後は再表示されない。

**Verification:** `pnpm vitest run tests/unit/storyFlow.test.ts tests/unit/town.test.ts tests/unit/musubiDamaOnboarding.test.ts`

**Dependencies:** Task 1

**Files likely touched:**

- `src/core/progression/musubiDamaOnboarding.ts`
- `src/scenes/overworld/storyFlow.ts`
- `src/scenes/overworld/storyScenes.ts`
- `content/i18n/ja.json`
- `tests/unit/musubiDamaOnboarding.test.ts`

**Estimated scope:** Medium

## Checkpoint: Playable Flow

- [x] Tasks 3–4のテストが通る。
- [x] 青森の町から通常敵の仲間化まで通して操作できる。

## Task 5: 岩手物語との整合

**Description:** 岩手の三つのむすび玉を特別な古い品として説明し、市販品を知った後でも矛盾しない物語へ調整する。

**Acceptance criteria:**

- [x] むすび玉の由来と三つの特別さが伝わる。
- [x] 限定相棒の選択・保存・通常出現禁止は変わらない。
- [x] 新旧セーブの物語進行条件が変わらない。

**Verification:** `pnpm vitest run tests/unit/storyFlow.test.ts tests/unit/storyCompanion.test.ts`

**Dependencies:** Task 4

**Files likely touched:**

- `src/scenes/overworld/storyScenes.ts`
- `content/i18n/ja.json`
- `docs/09_STORY.md`
- `docs/10_TOHOKU_SCENARIO.md`
- `tests/unit/storyFlow.test.ts`

**Estimated scope:** Medium

## Task 6: E2Eと全体検査

**Description:** 購入、問題、捕獲、失敗、使用不可、再表示防止、スマホ表示を実ブラウザで検証する。

**Acceptance criteria:**

- [x] 青森の購入からバトル使用までの統合テストが通る。
- [x] 1280×720と900×450でUIが見切れない。
- [x] 必須検査が成功した。

**Verification:** `pnpm lint && pnpm check:architecture && pnpm test && pnpm validate:content && pnpm build`

**Dependencies:** Tasks 3–5

**Files likely touched:**

- `tests/e2e/battle.spec.ts`
- `tests/e2e/opening-cutscene.spec.ts`
- `tests/e2e/helpers/onboarding.ts`

**Estimated scope:** Medium

## Checkpoint: Complete

- [x] 全仕様条件が満たされる。
- [x] コードレビューの必須指摘が残らない。
- [x] 最新版が `127.0.0.1:4174` で確認できる。
