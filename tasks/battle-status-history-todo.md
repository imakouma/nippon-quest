# battle-status-history task list

## Task 1: Pure status and history projections

**Description:** `BattleState` と演出済み `BattleEvent` から、状態チップ、直近プレイヤー履歴、開発タイムラインを作る純粋関数をTDDで追加する。

**Acceptance criteria:**

- [x] atk/defの上昇・低下と敵の停止を、0より大きい現在ターン数だけ表示モデルへ変換する。
- [x] `normalizeEvents` / `narrate` と同じ文を最新4件・古い順で返す。
- [x] 全イベントに番号とターンを付け、damage/healはHP `before → after` を返し、DOM用timelineは最新120件に制限する。

**Verification:**

- [x] REDを確認: `pnpm exec vitest run tests/unit/battleStatusHistory.test.ts`
- [x] GREENを確認: 同じコマンドが成功する。
- [x] 元の `BattleState.log` が変更されないことを確認する。

**Dependencies:** None

**Files likely touched:**

- `src/scenes/battle/statusHistoryViews.ts`
- `src/ui/battle/store.ts`
- `tests/unit/battleStatusHistory.test.ts`

**Estimated scope:** Medium

## Checkpoint: Pure model

- [x] Task 1のfocused unit testが通る。
- [x] `src/core/battle/**` に差分がない。

## Task 2: Isolated battle history UI

**Description:** 局所購読を追加し、通常履歴とdev限定timelineを既存HUDへ配置する。

**Acceptance criteria:**

- [x] 履歴selectorはcursor/message/banner/popupsだけの更新ではlistenerを呼ばない。
- [x] 通常履歴は4件、dev timelineはボタンで開閉でき、live regionを追加しない。

**Verification:**

- [x] selectorのRED/GREEN unit testが通る。
- [x] TypeScriptと既存battle HUD testsが通る。
- [x] キーボード開閉、Escape、フォーカス復帰をfocused E2Eで確認する。

**Dependencies:** Task 1

**Files likely touched:**

- `src/ui/battle/store.ts`
- `src/ui/battle/BattleHistory.tsx`
- `src/ui/battle/BattleHud.tsx`
- `content/i18n/ja.json`

**Estimated scope:** Medium（実装時はモデル・表示・文言を小さいコミットへ分ける）

## Task 3: Status chips and responsive styling

**Description:** 敵・味方の現在状態を文字・矢印・残りターンのチップで示し、履歴を横画面HUDへ収める。

**Acceptance criteria:**

- [x] atk/defの上昇・低下と停止を色だけに依存せず判別できる。
- [x] 既存の味方防御マークと新しい状態チップを二重表示しない。
- [x] 960×540と640×360で履歴・HP・状態チップが重ならない。

**Verification:**

- [x] TypeScriptと既存battle HUD testsが通る。
- [x] computed layoutをfocused E2Eで計測する。

**Dependencies:** Task 2

**Files likely touched:**

- `src/scenes/battle/hudViews.ts`
- `src/ui/battle/BattleStatus.tsx`
- `src/ui/battle/battle.css`
- `content/i18n/ja.json`

**Estimated scope:** Small

## Checkpoint: HUD contract

- [x] 通常モードのDOMにdev UIがない。
- [x] 履歴・timelineは `aria-live="off"` またはlive属性なしである。
- [x] 960×540と640×360で横スクロール・重なりがない。

## Task 4: Scene integration and end-to-end proof

**Description:** 演出済みログ位置をSceneから同期し、実際のターン進行で状態ターン・履歴・timelineが更新されることをPlaywrightと実ブラウザで証明する。

**Acceptance criteria:**

- [x] 履歴は演出完了後にだけ増え、これから再生するイベントを先に出さない。
- [x] 通常とdevの表示が既存 `BattleLaunchData.devMode` で分離される。
- [x] 戦闘メニュー、問題、結果、演出順、決定論性が維持される。

**Verification:**

- [x] focused battle unit tests
- [x] `E2E_PORT=4175 pnpm exec playwright test tests/e2e/battle-status-history.spec.ts`
- [x] `pnpm check:fast`
- [x] `pnpm test:related <changed source files...>`
- [x] 4175以降の一時プレビューで960×540・640×360、console、accessibility、スクリーンショットを確認し、サーバーを停止する。

**Dependencies:** Task 3

**Files likely touched:**

- `src/scenes/Battle.ts`
- `tests/e2e/battle-status-history.spec.ts`
- 必要な既存battle focused tests

**Estimated scope:** Medium

## Final review

- [x] Correctness: 仕様の全success criteriaを満たす。
- [x] Readability: Scene/UI/純粋変換の責務が明確で、不要な抽象化がない。
- [x] Architecture: `core -> scenes -> ui` の境界と `BattleState.log` の正を維持する。
- [x] Security/accessibility: 通常モードへdev情報を漏らさず、ARIA過剰通知とキーボードtrapがない。
- [x] Performance: 無関係なHudStore更新で履歴描画が走らず、DOM timelineは120件以内。
- [x] 担当変更だけを原子的にコミットし、commit IDと検査結果を報告する。
