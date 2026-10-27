# Spec: Battle Command Evaluation

## Objective

戦闘コマンドの可否判定を、Phaser・DOM・GameState に依存しない純粋な
`evaluateBattleCommand`（最終名称は既存規約に合わせる）へ一本化する。
HUD の有効／無効表示と `act` の実行前検証は同じ評価契約を使い、無効な必殺技・どうぐ・
いれかえ・にげる・さそうを、例外や意味の分からない空イベントだけで処理しない。

有効なコマンドの行動順、乱数、BattleEvent、消費、ターン進行、問題スコアによる効果は維持する。
このモジュールはダメージ理由の説明パネルを作らない。

## Tech Stack

- TypeScript strict
- Vitest
- 既存の `src/core/battle` 型、`src/core/rng.ts`、content index（追加依存なし）

## Commands

- Focused test:
  `pnpm exec vitest run tests/unit/battleCommandEvaluation.test.ts tests/unit/battle.test.ts tests/unit/battleUi.test.ts`
- Fast gate: `pnpm check:fast`
- Related tests:
  `pnpm test:related src/core/battle/commandEvaluation.ts src/core/battle/engine.ts src/scenes/battle/hudViews.ts src/scenes/battle/sceneModel.ts tests/unit/battleCommandEvaluation.test.ts tests/unit/battle.test.ts tests/unit/battleUi.test.ts`
- Required final gates: `pnpm lint`, `pnpm check:architecture`, `pnpm test`,
  `pnpm validate:content`, `pnpm build`
- Battle E2E when HUD behavior changes: `pnpm test:e2e:battle`
- Preview: `pnpm exec vite preview --host 127.0.0.1 --port 4175 --strictPort`

## Project Structure

- `src/core/battle/commandEvaluation.ts`: コマンド参照、理由コード、解決済み対象、消費、
  ターン消費を返す純粋 evaluator
- `src/core/battle/engine.ts`: evaluator の結果だけを入口の検証に使い、許可済みコマンドを実行
- `src/core/battle/types.ts`: 必要な公開契約と、実行結果に含める評価結果の型
- `src/scenes/battle/hudViews.ts`: leaf option を evaluator から作り、親コマンドの可否もその集約から決定
- `src/scenes/battle/sceneModel.ts`: Scene intent と core の command reference の薄い変換
- `src/scenes/Battle.ts`: 問題在庫・物語解放など Scene 側の入力を型付き評価 context に変換して渡す
- `tests/unit/battleCommandEvaluation.test.ts`: evaluator の網羅的な契約テスト
- `tests/unit/battle.test.ts` / `tests/unit/battleUi.test.ts`: engine と HUD が同じ評価に従う統合回帰

## Evaluation Contract

評価入力は、問題の回答結果を除いたコマンド参照とする。回答スコアはコマンド成立後の効果計算に
だけ使い、選択可否を変えない。問題在庫や「むすび」の物語解放など core state 外の条件は、
Scene が値だけの typed context に正規化する。evaluator は callback を呼ばず、入力を変更せず、
乱数を消費しない。

```ts
type BattleCommandRef =
  | { kind: 'attack' | 'flee' | 'wait' }
  | { kind: 'skill'; skillId: string; actorId?: string }
  | { kind: 'item'; itemId: string }
  | { kind: 'swap'; monsterIndex: number }
  | { kind: 'recruit'; itemId?: string };

interface BattleCommandEvaluation {
  allowed: boolean;
  reason: BattleCommandBlockReason | null;
  resolvedTargets: readonly BattleCommandTarget[];
  costs: readonly BattleCommandCost[];
  consumesTurn: boolean;
}

const evaluation = evaluateBattleCommand(state, commandRef, deps, context);
```

- `reason` はユーザー向け文言ではなく、網羅可能な discriminated reason code とする。
  文言が必要な箇所だけ既存 i18n を使って Scene/HUD 側で表示する。
- `resolvedTargets` は実行時に再選択しない対象 ID／index を返す。回復どうぐは HP 割合が最も低い
  味方、自己／party 技は実際の味方、攻撃・仲間化どうぐは敵、交代は選択した生存仲間を解決する。
- `costs` は教科ゲージ、所持どうぐ、仲間化用の贈り物を型付きで表し、拒否時には消費しない。
- `consumesTurn` は成立時の契約を示す。拒否は常に `false`。通常の逃走失敗は成立した試行なので
  `true`、ボス逃走禁止は拒否なので `false` とする。
- `act` の返値は評価結果を明示的に含める。拒否時は state と RNG を進めず、ターンを進めず、
  `allowed: false` と理由を返す。既存の `gaugeShort` とボス逃走失敗イベントは表示互換のため維持してよいが、
  呼び出し元はそれらの有無だけで拒否を推測しない。

### Required reason coverage

少なくとも次の拒否を別の reason code で区別する。

- 戦闘終了済み、主人公が行動不能
- 存在しない必殺技、使用者が覚えていない／倒れている、問題準備中、教科ゲージ不足
- 存在しない／未所持／戦闘使用不可のどうぐ、回復対象に効果がない、むすび玉の条件不成立
- 存在しない／倒れている／現在出撃中の交代先
- ボス戦の逃走禁止
- 「むすび」の未解放、仲間化不可の敵、HP 条件不足、不正な贈り物指定

## Code Style

可否だけを返す boolean helper を Scene と engine に重複させず、評価結果を switch で消費する。

```ts
const evaluation = evaluateBattleCommand(state, ref, deps, context);
if (!evaluation.allowed) return rejectBattleCommand(state, evaluation);

return executeAllowedBattleCommand(state, command, evaluation, deps);
```

- evaluator は `src/core/battle/` に置き、Phaser、Preact、Scene、GameState を import しない。
- `any`、`Math.random`、暗黙の文字列 reason、例外を通常の可否分岐に使わない。
- `engine.ts` は既に大きいため、新しい判定分岐を直接積み増さず専用モジュールへ分ける。

## Testing Strategy

- RED: evaluator の表形式テストを先に追加し、現状の例外・空イベント・HUD/engine 不一致を再現する。
- GREEN: 最小の評価契約を実装し、`act` と HUD leaf option を同じ evaluator に接続する。
- REFACTOR: 既存の `canAfford`、`canUseBattleItem`、`battleItemAvailability`、
  `canRecruitByCommand` の重複を、公開互換が必要な薄い wrapper を除いて evaluator に集約する。
- Valid matrix: attack、skill、item、swap、flee、recruit、wait の allowed、対象、cost、
  `consumesTurn` を検証する。
- Invalid matrix: Required reason coverage の各ケースで、state・所持数・ゲージ・turn・RNG が変わらず、
  例外を投げず、評価理由が返ることを検証する。
- Consistency: 同じ state/ref/context に対し HUD option と `act` が同じ allowed/reason を返すことを検証する。
- Regression: 有効コマンドの BattleEvent 順序、決定論的 replay、既存ターン進行を維持する。

## Boundaries

- Always: GDD §4 のターン制を正とし、不成立時はターン非消費、有効な通常逃走失敗はターン消費とする。
- Always: `QuestionResult` は従来どおり score だけを戦闘効果に使い、問題タイプで分岐しない。
- Always: focused test、`pnpm check:fast`、変更したソースを列挙した `pnpm test:related` を実行する。
- Ask first: content/schema、保存形式、`src/questions/contracts.ts`、外部依存、戦闘バランスの変更。
- Never: ダメージ理由の説明パネル、参照作品固有のコード・文言・名称・キャラクター・画像・音楽・
  マップ・数値バランスの転用、`Math.random`、既存の未完了 `tasks/plan.md` / `tasks/todo.md` の上書き。
- Scope: 上記 Project Structure と直接関連するテスト／i18n の最小差分だけを触り、無関係な整形・移動をしない。

## Success Criteria

1. 純粋な evaluator が全コマンドについて `allowed`、typed `reason`、`resolvedTargets`、`costs`、
   `consumesTurn` を一度に返す。
2. HUD の command/skill/item/swap 表示と `act` の実行前検証が同じ evaluator 契約を使い、
   可否条件を別々に再実装しない。
3. 無効な必殺技・どうぐ・交代・逃走・仲間化は例外を投げず、state・RNG・turn・cost を変更せず、
   明示的な拒否理由を返す。
4. 回復対象、技対象、交代先、敵対象と、教科ゲージ・どうぐ・贈り物の消費が評価時に解決され、
   実行時に別ロジックで再判定されない。
5. 有効な全コマンドの既存 BattleEvent、行動順、乱数再現性、ターン消費、戦闘結果を維持する。
6. focused test、`pnpm check:fast`、変更ソースの `pnpm test:related` と必要な全体検査が成功する。
7. 変更は担当範囲内に限定され、実装コミットが作成され、ブランチ名・コミット ID・検査結果を報告する。
8. ダメージ理由の説明パネルを追加しない。

## Open Questions

なし。通常の型名・reason code の粒度・互換 wrapper の要否は、既存呼び出しとテストを優先して実装時に決定する。
