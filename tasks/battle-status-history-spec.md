# Spec: battle-status-history

## Status

- Module id: `battle-status-history`
- Phase: Specify（承認待ち）
- Owner scope: 状態異常・強化の残りターン表示、プレイヤー向け戦闘履歴、開発者向けイベントタイムライン
- Source of truth: `docs/00_GAME_DESIGN.md` §4・§8、`docs/01_ARCHITECTURE.md` §5、`AGENTS.md`

## Assumptions

1. 「開発モード」はビルド種別ではなく、既存の `BattleLaunchData.devMode === true` を指す。
2. プレイヤー向け履歴は、現在の一時メッセージと演出テンポを変えず、コマンド選択中に上部右側の空き領域へ直近4件を古い順に表示する。
3. 開発者向けタイムラインは通常UIへ常設せず、開発モード時だけ履歴見出しの48px以上のボタンから開閉できる診断パネルにする。初期状態は閉じる。
4. 現在の状態効果は `Combatant.buffs.atk`、`Combatant.buffs.def`、`EnemyUnit.skipTurns` を正とする。新しい戦闘効果や新しいダメージ計算は追加しない。
5. `BattleState.log` は戦闘の完全なイベント履歴として保持し、表示上の件数制限のために破棄・切り詰め・書き換えない。

承認時に上記を仕様として確定する。変更希望があれば計画作成前にこの文書を更新する。

## Objective

小学生のプレイヤーが、敵・主人公・前衛オトモに今かかっている強化・弱体・行動停止と残りターンを見失わず、コマンドを選ぶときに直前の戦闘経過を読み返せるようにする。同時に開発者モードでは、同じ戦闘の `action`、全 `BattleEvent`、HP増減を順番どおり検査できるようにする。

成功時には次が成り立つ。

- 敵・主人公・前衛オトモの状態効果が、種類と残りターンを含むチップで常時確認できる。
- 通常UIで、演出済みの直近4件の読みやすい戦闘履歴を確認できる。
- 開発モードで、イベント番号・ターン・イベント種別・行動主体/対象・HP変化を時系列に確認できる。
- 読み上げは既存の一時メッセージだけが担い、履歴再描画による重複通知を起こさない。
- 履歴追加によってカーソル移動、ポップアップ、タイプライター表示など無関係な `HudStore` 更新時の再描画を増やさない。

## User-visible behavior

### 状態チップ

- 敵ウィンドウと各表示中味方行に、HP表示を隠さない状態チップ領域を常設する。
- 有効な効果だけを表示し、残り0ターンの効果は表示しない。
- 表示対象とラベルは次のとおりとする。
  - `atk.mult > 1`: `こうげき↑ {n}`
  - `atk.mult < 1`: `こうげき↓ {n}`
  - `def.mult > 1`: `ぼうぎょ↑ {n}`
  - `def.mult < 1`: `ぼうぎょ↓ {n}`
  - 敵の `skipTurns > 0`: `ストップ {n}`
- `{n}` はイベント発生時の値ではなく、現在の `BattleState` に残るターン数を表示する。
- 種類は文字と矢印でも区別し、色だけに依存しない。
- 同一対象に複数効果があればすべて表示し、960×540と640×360でHP・名前・Lvを押し出したり横スクロールを発生させたりしない。
- 現行の敵防御マークは同じ状態チップ表現へ統合し、二重表示しない。

### プレイヤー向け戦闘履歴

- `BattleState.log` を既存の `normalizeEvents` と `narrate` に通し、ユーザー向け文言は既存と同じ `content/i18n/ja.json` の RubyText を再利用する。
- `turnStart`、`gaugeUse`、空の語りなど、プレイヤー向け文にならないイベントは履歴行を作らない。
- 1イベントから複数行が生じる場合は1件としてまとめ、最新4件を古い順に表示する。
- 履歴に載るのは演出が完了したイベントまでとし、これから再生される結果を先に見せない。
- コマンド選択中は履歴を表示する。演出中・確認待ち・問題中・結果画面では既存のメッセージ、問題枠、結果画面を優先し、重ねない。
- 履歴が空のときは空パネルを出さない。
- 戦闘履歴はラベル付きのリストとして読めるが、`role="status"` や `aria-live` を付けず、過去ログの再通知を防ぐ。

### 開発者向けイベントタイムライン

- `BattleLaunchData.devMode === true` の戦闘だけに、履歴見出しから開ける「イベント」ボタンを表示する。
- ボタンは `aria-expanded` と `aria-controls` を持ち、Enter/Spaceで開閉できる。Escapeで閉じ、フォーカスをボタンへ戻す。
- パネルはイベントを古い順に並べ、各行に次を表示する。
  - `BattleState.log` 上の0始まりイベント番号
  - `turnStart` から決まるターン番号
  - `BattleEvent.t`
  - 存在する場合は actor、target、command、skill、side
  - `damage` / `heal` の場合は対象HPの `before → after` と増減量
- HP変化はイベントの `amount` と現在状態から決定論的に復元し、推測値やダメージ式の内訳を表示しない。
- DOMへ描画するのは最新120イベントまでとし、以前のイベントがある場合は省略件数を表示する。完全な履歴は `BattleState.log` に残す。
- タイムライン自身は `aria-live="off"` とし、開いた時点の静的な診断情報として読む。
- 通常モードではボタン、パネル、開発者向け文言をDOMへ出さない。

## Architecture and data flow

```text
BattleState
  ├─ combatant.buffs / enemy.skipTurns ──> hudViews ──> EffectChipView[] ──> BattleStatus
  └─ log: BattleEvent[]
       ├─ normalizeEvents + narrate ─────> recent player history
       └─ typed event projection ────────> developer event timeline
                                             └─ damage/heal: HP before → after
```

- `src/core/battle/` は変更しない。戦闘ロジック、イベント順、`BattleState.log` の蓄積、決定論性をそのまま使う。
- 表示用の純粋変換は `src/scenes/battle/hudViews.ts` か、同階層の用途名モジュールへ置く。UIは `BattleState` やSceneを直接参照せず、型付き表示モデルだけを受け取る。
- `src/scenes/Battle.ts` は現在状態と演出済みイベント位置を表示アダプターへ渡すだけに留める。イベントの意味分岐やHP計算をSceneへ増やさない。
- `src/ui/battle/` は状態チップ、履歴、タイムラインの描画と開閉操作だけを担当する。
- 新しい履歴/タイムライン用配列は、イベント履歴の進行時だけ新しい参照へ更新する。カーソル、バナー、ポップアップ、タイプライターの更新では同じ参照を保つ。
- 履歴/タイムラインは `useHudSelector` 相当の局所購読とメモ化した境界を使い、既存の `BattleHud` 全体購読に大きな配列処理を追加しない。
- 新規依存は追加しない。

## Tech stack

- TypeScript strict
- Preact DOM overlay
- Phaser 3 Scene adapter
- Vitest unit tests
- Playwright E2E
- 既存の `HudStore`、`BattleState.log`、`narrate`、RubyText/i18n

## Project structure

- `src/scenes/battle/hudViews.ts` または近接する用途名モジュール: 戦闘状態・ログから表示モデルへの純粋変換
- `src/ui/battle/store.ts`: 状態チップ/履歴/タイムラインの表示契約、局所購読
- `src/ui/battle/BattleStatus.tsx`: 敵・味方の状態チップ
- `src/ui/battle/BattleHistory.tsx`（必要な場合）: プレイヤー履歴と開発者タイムライン
- `src/ui/battle/BattleHud.tsx`: 既存レイアウトへの最小限の配置
- `src/ui/battle/battle.css`: 960×540基準と縮小横画面の配置
- `src/scenes/Battle.ts`: 必要最小限のSceneアダプター
- `content/i18n/ja.json`: 新しいユーザー向けラベルのRubyText
- `tests/unit/battleStatusHistory.test.ts`: 表示モデルと局所購読
- `tests/e2e/battle-status-history.spec.ts`: 実ブラウザの表示・操作・アクセシビリティ

## Code style

表示層へ渡す状態は曖昧な文字列や `any` ではなく、判別可能な小さい型にする。

```ts
export interface EffectChipView {
  kind: 'atk-up' | 'atk-down' | 'def-up' | 'def-down' | 'stopped';
  turns: number;
}

export interface BattleHistoryView {
  recent: readonly { eventIndex: number; lines: readonly string[] }[];
  timeline: readonly BattleTimelineEntry[];
  totalEvents: number;
}
```

- 既存の命名・Prettier・ESLintに従う。
- ユーザー向け文言をTSXへハードコードしない。
- 型キャストや `any` で `BattleEvent` の網羅性を逃がさず、追加イベント時に変換漏れを検出できる分岐にする。
- 新しい汎用イベントバス、ログ基盤、状態管理依存は作らない。

## Testing strategy

### TDD order

1. 状態効果からチップを作る失敗テストを書く。
2. `BattleState.log` から直近履歴とタイムラインを作る失敗テストを書く。
3. HP増減の `before → after`、ターン境界、120件制限の失敗テストを書く。
4. 履歴選択値が変わらない `HudStore` 更新で履歴購読側が再描画対象にならない失敗テストを書く。
5. 最小実装でユニットテストを通す。
6. Playwrightで通常モード、開発モード、キーボード、横画面レイアウト、ARIAを固定する。

### Unit coverage

- 敵・主人公・前衛オトモの上昇/低下/停止と残りターン
- 0ターン効果の非表示、複数効果の同時表示
- `normalizeEvents` / `narrate` と同じ語り、空イベント除外、直近4件、順序
- 全 `BattleEvent` unionを受けるタイムライン変換
- ダメージ・回復のHP `before → after`（瀕死、最大HP上限、複数連続変化を含む）
- ターン番号とイベント番号、最新120件、完全な `BattleState.log` の不変性
- `cursor`、`message`、`banner`、`popups` だけの更新で履歴選択値を購読するコンポーネントが更新されないこと
- 既存 `tests/unit/battle.test.ts` のバフ減衰、状態停止、ログ決定論性が維持されること

### E2E coverage

- 通常モード: コマンド選択時に直近履歴が見え、開発者ボタンは存在しない。
- 状態効果: 敵・主人公・前衛オトモに種類と残りターンが見え、次ターンで数値が減り、終了時に消える。
- 開発モード: イベントボタンをキーボードで開閉でき、action/event/HP変化が順番どおり見える。
- アクセシビリティ: 履歴とタイムラインはlive regionではなく、既存の動的通知を増やさない。開閉ボタンの名前・状態・フォーカス復帰が正しい。
- レイアウト: 960×540と640×360で名前、Lv、HP、状態チップ、履歴に横スクロールや重なりがない。
- 実行中のconsole error/warningがない。

## Commands

Focused unit tests:

```bash
pnpm exec vitest run tests/unit/battleStatusHistory.test.ts tests/unit/battleHudFlow.test.ts tests/unit/battle.test.ts
```

Focused E2E:

```bash
E2E_PORT=4175 pnpm exec playwright test tests/e2e/battle-status-history.spec.ts
```

Fast project gate:

```bash
pnpm check:fast
```

Related tests（実際に変更したソースだけを列挙する）:

```bash
pnpm test:related src/ui/battle/store.ts src/ui/battle/BattleStatus.tsx src/ui/battle/BattleHistory.tsx src/scenes/battle/hudViews.ts src/scenes/Battle.ts
```

Worker completion checks:

```bash
pnpm lint
pnpm check:architecture
pnpm validate:content
```

`pnpm test`、`pnpm build`、`pnpm check:full` は、並行チャットとの重複を避け、統合担当の指示または統合後ゲートで実行する。

Preview after implementation:

```bash
pnpm exec vite --host 127.0.0.1 --port 4175 --strictPort
```

作業チャットの一時プレビューは4175以降を使い、検証後に停止する。正規4174プレビューは統合担当だけが更新する。

## Boundaries

### Always do

- 既存の `BattleState.log` と現在状態を唯一の入力として使う。
- UIへは純粋な表示モデルだけを渡し、Scene依存を持ち込まない。
- 全ユーザー向け文言を `content/i18n/ja.json` のRubyTextに置く。
- 既存のメッセージ順、演出順、ターン進行、戦闘結果、セーブ挙動を維持する。
- TDDのRED → GREEN → REFACTORを各スライスで記録する。
- focused test、`pnpm check:fast`、変更ソースの `pnpm test:related` を通してからコミットする。
- 変更を検査し、`codex/battle-status-history` 上の原子的なコミットとして残す。

### Ask first

- `BattleEvent` / `BattleState` の契約変更
- `src/questions/contracts.ts`、schema、content構造の変更
- 新しい依存、保存形式、開発モードの起動契約の変更
- 状態効果やダメージ計算そのものの仕様変更
- 担当外ファイルのリファクタリング

### Never do

- ダメージ計算内訳パネル、倍率の説明パネル、予測ダメージを作らない。
- 戦闘ログを別の永続化基盤へ複製しない。
- `BattleState.log` をUI都合で切り詰めない。
- 通常モードへ生のイベント名や開発者情報を出さない。
- 履歴・タイムラインをlive regionにしてイベントごとに読み上げない。
- `Math.random`、`any`、ユーザー向け文言のTS/TSXハードコードを追加しない。
- `tasks/plan.md`、`tasks/todo.md`、他モジュールのtask文書を変更しない。
- `dist/`、`test-results/`、`graphify-out/` をコミットしない。
- 外部作品のコード、文言、名称、キャラクター、画像、音楽、マップ、数値バランスをコピーしない。

## Success criteria

- [ ] 敵・主人公・前衛オトモに、有効な状態の種類と現在の残りターンが常時表示される。
- [ ] 状態チップは色だけに依存せず、0ターンで消え、HP・名前・Lvを隠さない。
- [ ] 通常UIのコマンド選択中に、`BattleState.log` 由来の演出済み直近4件を読み返せる。
- [ ] 開発モードで、action、全event、damage/healのHP `before → after` を順番どおり確認できる。
- [ ] 通常モードのDOMに開発者タイムラインが存在しない。
- [ ] 履歴とタイムラインは過剰な `aria-live` 通知を起こさず、開発者パネルはキーボードで操作できる。
- [ ] 履歴に無関係な `HudStore` 更新で履歴購読コンポーネントが再描画されないことをテストで証明する。
- [ ] 戦闘ルール、ログ順序、ナレーション、メニュー操作、結果処理、決定論性を維持する。
- [ ] ダメージ計算内訳パネルを含まない。
- [ ] 新しい依存、schema変更、保存データ変更がない。
- [ ] focused unit/E2E testsが通る。
- [ ] `pnpm check:fast` が通る。
- [ ] 変更したソースを指定した `pnpm test:related` が通る。
- [ ] 実ブラウザで960×540と640×360を確認し、スクリーンショットとconsole/a11y結果を残す。
- [ ] 既存挙動を壊さず、変更範囲外のファイルを触らない。
- [ ] 変更をレビューし、専用ブランチへコミットする。

## Out of scope

- ダメージ式・属性倍率・コンボ倍率・正答倍率の内訳表示
- 状態効果の新設、戦闘バランス変更、AI変更
- 戦闘リプレイUI、ログの保存/共有/エクスポート
- 通常プレイヤー向けの全イベント生データ表示
- バトル以外の履歴・開発者タイムライン
- HUD全体の再設計、外部デザイン調査、外部素材追加

## Open questions

なし。Assumptionsの5項目を承認時に確定する。
