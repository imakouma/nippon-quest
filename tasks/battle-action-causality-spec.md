# Spec: Battle Action Causality

## Objective

`src/core/battle` が 1 回の成立した行動から生成する `BattleEvent` 群を、配列上の隣接関係ではなく、
安定した型付き `actionId` で関連付ける。`act` と、その結果である damage / heal / buff /
status / weakness / KO / boss phase / battle outcome などは同じ行動束に属することを明示する。

これにより `eventAnimator` が `next` event を見て攻撃対象を推測する実装をなくし、将来の multi-hit、
counter、同一行動内の複数効果、表示上の parallel 化でも因果関係を失わないようにする。今回は既存の
技、戦闘ルール、イベント再生順、文言、演出結果を変えない。

## Assumptions

1. このモジュールは「行動単位のイベント因果関係」という 1 能力であり、別 capability map は不要。
2. `BattleState.log` は戦闘中の runtime データで、GameState の保存 schema ではない。保存 migration は不要。
3. 既存 `BattleEvent.t` と各 payload は維持し、因果 metadata と明示的対象だけを追加する。
4. counter は今回実装しないが、将来の counter action が独自 `actionId` と任意の親行動参照を持てる契約にする。
5. ダメージ理由の説明パネル、新しい技、数値バランス変更は対象外。

## Tech Stack

- TypeScript strict
- Phaser 3（表示 adapter のみ）
- Vitest
- 既存 `src/core/rng.ts`（戦闘結果の決定論性を維持）
- 新規依存なし

## Commands

- Focused tests:
  `pnpm exec vitest run tests/unit/battleActionCausality.test.ts tests/unit/battle.test.ts tests/unit/battlePresentationRuntime.test.ts tests/unit/battleUi.test.ts`
- Fast gate: `pnpm check:fast`
- Related tests:
  `pnpm test:related src/core/battle/types.ts src/core/battle/dependencies.ts src/core/battle/engine.ts src/core/battle/actionResolver.ts src/core/battle/musubiDama.ts src/scenes/Battle.ts src/scenes/battle/presentationRuntime.ts src/scenes/battle/eventAnimator.ts`
- Integration owner gate after merge: `pnpm check:full`
- Preview is unnecessary unless implementation changes visible behavior. If a regression requires visual confirmation:
  `pnpm exec vite preview --host 127.0.0.1 --port 4175 --strictPort`

## Project Structure

- `src/core/battle/types.ts`: typed action identity and action-scoped event contract
- `src/core/battle/dependencies.ts`: shared injected dependency type without an engine/resolver cycle
- `src/core/battle/engine.ts`: deterministic action-id allocation and command-level propagation
- `src/core/battle/actionResolver.ts`: damage, AI action, KO, phase, and outcome action propagation
- `src/core/battle/musubiDama.ts`: item/recruit action events receive the caller's action context
- `src/scenes/battle/presentationRuntime.ts`: visual command no longer transports a guessed `next` event
- `src/scenes/battle/eventAnimator.ts`: uses explicit action target metadata; no adjacency inference
- `tests/unit/battleActionCausality.test.ts`: causality, replay, reordering, multi-effect contract
- Existing battle unit/E2E tests: unchanged behavior regression coverage

## Code Style

Use a typed action identifier and pass a small action context through existing helpers. Do not derive relationships by
searching neighboring array elements.

```ts
export type BattleActionId = `turn:${number}:action:${number}`;

export interface BattleActionRef {
  actionId: BattleActionId;
}

const action = beginAction(state.turn, actionOrdinal++, {
  actorId,
  targetIds,
});

events.push({ t: 'act', ...action, side, actorId, targetIds, command: 'skill', skillId });
events.push({ t: 'damage', actionId: action.actionId, side: 'enemy', targetId, amount, ...result });
```

- ID 生成は wall clock、UUID、`Math.random`、RNG 消費、最終的な event array index に依存させない。
- `actionId` は turn 番号と、その turn 解決中の成立行動 ordinal から作る。
- helper は既存 event payload を包み隠さず、型で action context の渡し忘れを検出できる最小構成にする。
- 将来の派生 action 用に、`act` は任意の `causedByActionId` を持てる。今回は値を生成しない。

## Causality Contract

1. 成立して initiative slot を消費する各行動は、同一 turn 内で一意な `BattleActionId` を 1 つ持つ。
2. 攻撃・必殺技・防御の `act` は `actionId` と明示的な `targetIds` を持つ。
3. 同じ行動から発生した damage、heal、buff、status、weakness result、gauge change、combo、KO、
   auto swap、boss phase、victory / defeat は同じ `actionId` を持つ。
4. item、swap、recruit、flee、skip のように `act` event を持たない成立行動も、その行動が生成した event 群に
   1 つの `actionId` を共有する。
5. 成立しない command（ゲージ不足、無効 item/swap、逃走不可）は turn と action ordinal を消費しない。
   既存の再選択挙動を維持する。
6. 1 action が複数 target / 複数 hit を持つ場合、各 effect event は同じ `actionId` を共有する。
   event ごとの `targetId` と amount は従来どおり保持する。
7. 将来 counter を追加する場合、counter 自体は新しい `actionId` を持ち、`causedByActionId` で発火元を参照する。
   親子 action が同じ ID を共有することはない。
8. event array の出力順は既存どおり維持する。ただし、関連付けの正は順序ではなく `actionId` とする。
9. `eventAnimator` は `act.targetIds` から演出対象を決め、`next` event を受け取らない。
10. 同じ初期 state、seed、command 列からは、state、event 順、event payload、`actionId` のすべてが一致する。

## Backward Compatibility

- 既存イベント種別、既存 payload、戦闘計算、乱数呼び出し順、イベント順、narration、HUD 更新、効果音、
  KO / victory 表示を維持する。
- causality metadata は戦闘 runtime の内部契約として追加し、content JSON、schema、GameState、save version は変更しない。
- `BattleEvent` を手作りする既存テスト fixture は、新しい必須 metadata を明示して型安全性を維持する。
- presentation runtime の enqueue、cancel、fast-forward、cleanup 契約は変更しない。
- 過去イベント形状への silent fallback や `next` 推測互換は残さない。内部 consumer を同一変更で更新し、
  不完全な action-scoped event は compile error にする。

## Testing Strategy

- RED: 新しい causality test で、現状の `BattleEvent` に action identity がなく、animator が隣接 event に
  依存していることを先に失敗で確認する。
- GREEN: action context の生成と伝播を最小実装し、既存 event 順と戦闘結果を変えずに通す。
- REFACTOR: 重複した event 装飾だけを helper 化し、戦闘計算や action policy は変更しない。
- 同一 turn の hero / companion / enemy が別 ID を持ち、各派生 event が正しい ID を共有することを検証する。
- heal party target、buff party target、damage → KO → victory の複数 event 束を検証する。
- multi-hit 相当の fixture で複数 damage が 1 action に属せることを検証する。
- `act` と effect の間へ無関係 event を挿入しても、演出対象が変わらないことを unit test で証明する。
- 同じ seed と command 列を 2 回 replay し、`actionId` を含む event log が deep equal になることを検証する。
- 既存 focused tests と `pnpm check:fast`、変更ソースの `pnpm test:related` をコミット前に通す。

## Boundaries

- Always: core は Phaser / DOM 非依存、Scene は戦闘計算をしない、乱数は既存 RNG だけを使う。
- Always: 既存の見た目と戦闘結果を保持し、変更した範囲だけを focused / related test で検証する。
- Always: `tasks/battle-action-causality-plan.md` と `tasks/battle-action-causality-todo.md` は仕様承認後の
  次ターンでのみ作る。
- Ask first: content schema、save schema、`questions/contracts.ts`、外部依存、戦闘ルール、公開文言の変更。
- Never: `Math.random`、event adjacency を因果関係の正にする fallback、ダメージ理由パネル、新技追加、
  参照作品のコード・文言・名称・キャラクター・画像・音楽・マップ・数値データのコピー。
- Never: 既存の未完了 `tasks/plan.md` / `tasks/todo.md` や担当外ファイルを上書き・整理しない。

## Success Criteria

1. 成立した各行動に安定した型付き `actionId` があり、同じ action の act / damage / heal / buff /
   status / KO 等を配列位置に依存せず関連付けられる。
2. `eventAnimator` と presentation command から `next` event 推測が消え、明示的対象だけで同じ演出を行う。
3. 複数 target、multi-hit fixture、将来の counter 親子関係を表現でき、今回の既存イベント順は変わらない。
4. 同じ seed と command 列の replay は `actionId` を含めて決定論的に一致する。
5. 既存の戦闘結果、narration、HUD、効果音、KO、勝敗、save/content 契約が維持される。
6. focused tests が通る。
7. `pnpm check:fast` が通る。
8. 変更した source files を指定した `pnpm test:related` が通る。
9. 変更範囲外を触らず、仕様・計画・実装をそれぞれ atomic commit にする。
10. 実装コミットのブランチ名、commit ID、変更概要、実行した検査を統合担当へ報告する。

## Open Questions

なし。通常の設計判断は委譲文で事前承認済み。仕様承認後に専用 plan / todo を作り、実装前ゲートを続ける。
