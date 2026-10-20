# 個体別レベル上限と学習連動の上限解放

## Task 1: 上限ドメインと設定契約

**Description:** 失敗テストを先に追加し、主人公・仲間の絶対上限、解放幅、素材コスト、初期上限検証を純粋ロジックへ集約する。

**Acceptance criteria:**

- [x] Lv100以下は+10、主人公Lv100以降は+5、仲間Lv100・主人公Lv200で停止する。
- [x] 素材不足、上限未到達、絶対上限を判別可能な結果で返す（対象不明はTask 10の状態更新時に追加）。
- [x] 数値は`settings.json`の検証済み設定から渡し、Sceneへ重複させない。

**Verification:**

- [x] 失敗する境界テストを先に確認する。
- [x] `pnpm vitest run tests/unit/levelCap.test.ts`
- [x] `pnpm validate:content`

**Dependencies:** None

**Files likely touched:**

- `src/core/progression/levelCap.ts`
- `src/core/content/schemas.ts`
- `content/balance/settings.json`
- `tests/unit/levelCap.test.ts`

**Estimated scope:** Medium

## Task 2: XP表生成とLv200曲線

**Description:** 現行XP表の生成則をスクリプト化し、仲間Lv100・主人公Lv200まで決定論的に生成する。主人公Lv101以降へ帯域倍率を適用する。

**Acceptance criteria:**

- [x] 現行Lv1〜51の値が1件も変わらない。
- [x] 主人公200件、仲間100件の累積XPが単調増加し、安全整数内に収まる。
- [x] Lv101/121/151/181の境界から8/12/18/25倍が適用される。

**Verification:**

- [x] 生成前後の再実行で差分が出ない。
- [x] `pnpm vitest run tests/unit/xpTable.test.ts`
- [x] `pnpm validate:content`

**Dependencies:** Task 1

**Files likely touched:**

- `scripts/gen-xp-table.ts`
- `content/balance/xp.json`
- `tests/unit/xpTable.test.ts`
- `package.json`

**Estimated scope:** Medium

## Task 3: 全モンスターへ初期上限を付与

**Description:** 技の最小学年、技なしの場合は地方推奨学年から`initialLevelCap`を決める機械移行を作り、全モンスターJSONへ明示値を保存する。

**Acceptance criteria:**

- [x] 全モンスターが10〜60の10刻みの`initialLevelCap`を持つ。
- [x] 同じ入力から同じ値を生成し、二回目の実行では差分が出ない。
- [x] ランタイムは明示値を読み、学年から再推論しない。

**Verification:**

- [x] 値の件数・分布・範囲を監査出力で確認する。
- [x] `pnpm gen:schemas`
- [x] `pnpm vitest run tests/unit/content.test.ts`
- [x] `pnpm validate:content`

**Dependencies:** Task 1

**Files likely touched:**

- `scripts/set-monster-level-caps.ts`
- `content/monsters/*.json`（決定論的な生成差分）
- `src/core/content/schemas.ts`
- `schemas/monster.schema.json`（生成物）
- `tests/unit/content.test.ts`

**Estimated scope:** Medium（ファイル数は多いが機械変換）

## Checkpoint A: 成長基盤

- [x] `pnpm gen:schemas`
- [ ] `pnpm lint`（今回の変更分は成功。基点から存在する未整形6ファイルで全体検査のみ失敗）
- [x] `pnpm check:architecture`
- [x] `pnpm test`
- [x] `pnpm validate:content`
- [x] `pnpm build`
- [x] Task 1〜3を独立したコミットとして保存する。

## Task 4: v11セーブ移行と上限正規化

**Description:** 主人公・所有個体の上限と学習報酬履歴をGameStateへ追加する。v10では現在レベルから仮上限を付け、コンテンツ読込後に種族初期上限へ正規化する。

**Acceptance criteria:**

- [x] v10のレベル、XP、uid、しんか状態、装備、学習履歴、図鑑、在庫を保持する。
- [x] 正規化後の上限は現在レベルと種族初期上限の両方を下回らない。
- [x] 二重移行・二重正規化で値が変わらない。

**Verification:**

- [x] 移行前後の代表セーブをスナップショット比較する。
- [x] `pnpm vitest run tests/unit/state.test.ts tests/unit/savePersistence.test.ts`

**Dependencies:** Tasks 1, 3

**Files likely touched:**

- `src/core/state/schema.ts`
- `src/core/state/migrations.ts`
- `src/core/state/newGame.ts`
- `src/core/progression/levelCap.ts`
- `tests/unit/state.test.ts`

**Estimated scope:** Medium

## Task 5: 加入・しんかの個体上限

**Description:** 通常加入、物語相棒、しんかの全経路で個体上限を設定・保持する。

**Acceptance criteria:**

- [x] 新規加入個体は種族初期上限と加入レベル切り上げの大きい方になる。
- [x] 物語相棒にも初期上限が入る。
- [x] しんか後は現在上限と進化先初期上限の大きい方になり、解放実績を失わない。

**Verification:**

- [x] `pnpm vitest run tests/unit/battleSettlement.test.ts tests/unit/storyCompanion.test.ts tests/unit/evolution.test.ts`

**Dependencies:** Task 4

**Files likely touched:**

- `src/core/progression/battleResult.ts`
- `src/core/progression/storyCompanion.ts`
- `src/core/progression/evolution.ts`
- `tests/unit/storyCompanion.test.ts`
- `tests/unit/evolution.test.ts`

**Estimated scope:** Medium

## Task 6: 上限付きレベル同期とXP保留

**Description:** XPは常に加算しつつ、保存・表示レベルだけを個体上限で止める。解放後は蓄積XPから到達可能レベルへ一度に同期する。

**Acceptance criteria:**

- [x] 上限中も主人公・出撃仲間のXPが増える。
- [x] 戦闘後レベルは現在上限を超えない。
- [x] 解放後に蓄積XP相当まで上がり、HP・MP割合を維持する。

**Verification:**

- [x] `pnpm vitest run tests/unit/battleSettlement.test.ts tests/unit/levelCap.test.ts`

**Dependencies:** Tasks 2, 4, 5

**Files likely touched:**

- `src/core/progression/battleResult.ts`
- `src/core/progression/battleSettlement.ts`
- `src/core/progression/levelCap.ts`
- `tests/unit/battleSettlement.test.ts`

**Estimated scope:** Medium

## Task 7: 主人公Lv101以降の能力・戦闘スケール

**Description:** Lv101以降の能力増分を25%にし、主人公のダメージ式レベルと敵の追従レベルを100で止める。

**Acceptance criteria:**

- [x] Lv1〜100の能力値とダメージが変更前と一致する。
- [x] Lv101以降の成長分だけ25%になり、表示レベルは実値を保つ。
- [x] 主人公のダメージ係数と主人公追従の敵レベルは100を超えない。

**Verification:**

- [x] `pnpm vitest run tests/unit/battle.test.ts tests/unit/progression.test.ts`
- [x] `pnpm audit:battle-balance`

**Dependencies:** Tasks 2, 6

**Files likely touched:**

- `src/core/battle/factory.ts`
- `src/core/battle/damage.ts`
- `src/core/progression/levelCap.ts`
- `src/scenes/Overworld.ts`
- `tests/unit/battle.test.ts`

**Estimated scope:** Medium

## Checkpoint B: 個体状態と戦闘

- [x] v10代表セーブのv11移行を確認する。
- [x] 同種族2個体で異なる上限を保持できる。
- [x] Lv100/101/200境界がすべて通る。
- [x] バランス監査でLv100以下の回帰がない。
- [ ] 必須検査一式が通る（architecture/test/content/buildは成功。全体lintのみ既存6ファイルで失敗）

## Task 8: 学習成果からまなびのかけらを付与

**Description:** 単元習熟と異なる3問のまちがい直しを、一回限りの学習成果として素材へ変換する。

**Acceptance criteria:**

- [x] 3回以上かつ習熟度0.80到達時に単元ごと1個だけ付与する。
- [x] 異なる3問を完全に直すごとに1個付与し、同一問題を再計上しない。
- [x] 問題タイプで分岐せず、同一回答で複数条件達成時も正しい合計になる。

**Verification:**

- [x] `pnpm vitest run tests/unit/askEnv.test.ts tests/unit/learningRewards.test.ts`

**Dependencies:** Task 4

**Files likely touched:**

- `src/core/progression/learningRewards.ts`
- `src/scenes/shared/askEnv.ts`
- `src/core/state/schema.ts`
- `tests/unit/learningRewards.test.ts`
- `tests/unit/askEnv.test.ts`

**Estimated scope:** Medium

## Task 9: 強敵初回撃破からしれんの核を付与

**Description:** 既存ボス完了フラグと在庫更新を一つの純粋関数へまとめ、種類別個数を初回だけ付与する。

**Acceptance criteria:**

- [x] 地域ぬし・中ボス1、県ボス2、裏ボス3、地方ボス4個を付与する。
- [x] 同じ完了フラグがある再戦では付与しない。
- [x] ボス撃破の進行フラグ、県のしるし、物語進行を壊さない。

**Verification:**

- [x] `pnpm vitest run tests/unit/eventReward.test.ts tests/unit/areaBoss.test.ts`

**Dependencies:** Task 4

**Files likely touched:**

- `src/core/progression/eventReward.ts`
- `src/scenes/Overworld.ts`
- `tests/unit/eventReward.test.ts`
- `tests/unit/areaBoss.test.ts`

**Estimated scope:** Medium

## Task 10: 勾玉作成と個体別解放トランザクション

**Description:** 3個のかけらと1個の核を原子的に消費し、選択した主人公または所有個体だけの上限を解放する。

**Acceptance criteria:**

- [x] 成功時だけ素材を消費し、対象個体だけの上限を更新する。
- [x] 素材不足・上限未到達・絶対上限・不明uidでは状態が変わらない。
- [x] 解放後の蓄積XP反映とHP・MP割合維持が同じ結果へ含まれる。

**Verification:**

- [x] `pnpm vitest run tests/unit/levelCap.test.ts tests/unit/inventory.test.ts`

**Dependencies:** Tasks 6, 8, 9

**Files likely touched:**

- `src/core/progression/levelCap.ts`
- `content/items/learning-fragment.json`
- `content/items/trial-core.json`
- `content/items/growth-magatama.json`
- `tests/unit/levelCap.test.ts`

**Estimated scope:** Medium

## Checkpoint C: 教育報酬と解放

- [x] 回答・再ロード・再戦による素材重複がない。
- [x] 失敗する解放操作では素材・上限・レベルが変わらない。
- [x] 同種族2個体の片方だけを解放できる。
- [ ] 必須検査一式が通る（architecture/test/content/buildは成功。全体lintのみ既存6ファイルで失敗）

## Task 11: バッグの個体上限表示と育成操作

**Description:** 主人公・仲間詳細へ現在上限、絶対上限、次回解放量、所持素材、保留XPを表示し、単一の「そだてる」操作を追加する。

**Acceptance criteria:**

- [x] 主人公と各個体で`Lv現在 / 上限`と解放可否が正しく表示される。
- [x] 48px以上のボタンをキーボード・タッチで操作でき、成功・失敗理由が読める。
- [x] 上限解放後も対象を選択したまま、旧上限→新上限とレベル変化を確認できる。

**Verification:**

- [x] `pnpm vitest run tests/unit/bag.test.ts tests/unit/battleUi.test.ts`
- [x] Playwrightで主人公の解放操作、選択維持、キーボードフォーカス、タッチを確認する（仲間の個体限定更新はTask 10の単体テストで確認）。

**Dependencies:** Task 10

**Files likely touched:**

- `src/scenes/overworld/bagItems.ts`
- `src/ui/field/BagOverlay.tsx`
- `src/scenes/Overworld.ts`
- `content/i18n/ja.json`
- `src/ui/field/bag.css`

**Estimated scope:** Medium

## Task 12: 図鑑の種族上限表示

**Description:** 既知モンスターへ種族の初期上限と最終上限を表示し、未発見モンスターでは値を隠す。

**Acceptance criteria:**

- [x] 既知種族に`はじめの上限`と`さいごの上限 Lv100`が表示される。
- [x] 未発見種族は上限値を公開しない。
- [x] 図鑑は個体上限ではなく種族定義を表示する。

**Verification:**

- [x] `pnpm vitest run tests/unit/menuView.test.ts`
- [x] 実ブラウザで既知・未発見の両方を確認する。

**Dependencies:** Tasks 3, 11

**Files likely touched:**

- `src/scenes/overworld/menuEntries.ts`
- `content/i18n/ja.json`
- `tests/unit/menuView.test.ts`

**Estimated scope:** Small

## Task 13: GDD・生成物・E2E・実ブラウザ確認

**Description:** 承認済み仕様をGDDへ反映し、生成物を同期し、代表的な全経路をブラウザで確認する。

**Acceptance criteria:**

- [x] GDD §6.3に個体上限、素材、主人公Lv200帯が記載される。
- [x] 生成JSON Schema、manifest、catalogに必要な変更だけが反映される。
- [x] 新規・v10移行、学習報酬、ボス報酬、個体解放、図鑑表示の代表経路が動く。

**Verification:**

- [x] `pnpm gen:schemas`
- [x] `pnpm gen:manifest`
- [x] 対象E2Eと`pnpm test:e2e:battle`
- [x] 4175以降の専用プレビューを起動し、アプリ内ブラウザで確認する。

**Dependencies:** Tasks 11, 12

**Files likely touched:**

- `docs/00_GAME_DESIGN.md`
- `schemas/*.json`（生成物）
- `content/manifest.json`（生成物）
- `assets/catalog.json`（必要な場合のみ生成物）
- `tests/e2e/*.spec.ts`

**Estimated scope:** Medium

## Task 14: レビュー・簡素化・最終検査

**Description:** 五軸コードレビューと簡素化を行い、全検査を統合後の状態で再実行してコミットを整理する。

**Acceptance criteria:**

- [x] 正しさ、設計、保守性、テスト、セキュリティの必須修正が残らない。
- [x] 重複した上限判断やScene内のドメイン分岐が残らない。
- [x] 仕様の成功条件をすべて満たし、作業ツリーに意図しない差分がない。

**Verification:**

- [ ] `pnpm lint`（今回の変更分は成功。基点から存在する未整形6ファイルで全体検査のみ失敗）
- [x] `pnpm check:architecture`
- [x] `pnpm test`
- [x] `pnpm validate:content`
- [x] `pnpm build`
- [x] `pnpm test:e2e:battle`
- [x] `git diff --check`

**Dependencies:** Task 13

**Files likely touched:** 実装レビューで必要になった対象のみ

**Estimated scope:** Medium

## Checkpoint D: Complete

- [x] `SPEC-level-cap-progression.md`の成功条件をすべて満たす。
- [x] 専用プレビューをユーザーが確認できる状態で開く。
- [x] ブランチ名、コミットID、変更概要、検査結果、残課題をWalkthroughへ記録する。

## Walkthrough

- ブランチ: `codex/level-cap-progression`
- 実装最終コミット: `baada22`（レベル上限機能本体は先行する機能別コミットを含む）
- 変更概要: 個体別上限、主人公Lv200、Lv101以降の成長抑制、XP保留、学習・ボス報酬、原子的な上限解放、バッグ・図鑑表示、v11セーブ移行を実装。
- 検査: architecture、1148単体テスト、content、build、バッグE2E 2件、バトルE2E 8件、実ブラウザとコンソール確認が成功。
- 残課題: 全体lintは今回触れていない基点由来の未整形6ファイルだけで失敗。今回の変更ファイルは個別のESLint・Prettierを通過。
