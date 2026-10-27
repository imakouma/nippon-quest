# Spec: Battle AI Ruleset

## Status

仕様レビュー待ち。モジュール ID は `battle-ai-ruleset`。この仕様が別ターンで承認されるまで、計画、タスクリスト、実装には進まない。

## Assumptions

1. この変更は既存バトルの挙動を変える機能追加ではなく、敵の戦術判断と戦闘種別ごとの制約を明示的な純粋契約へ分離するリファクタリングを主目的とする。
2. 既存の通常戦、ボス戦、script 戦は、省略時に現在と同じパーティ、問題、報酬、逃走、仲間化の挙動を選ぶ。
3. チュートリアル用 ruleset はこのモジュールで型と純粋な設定を用意するが、既存の会話式バトル説明を新しい実戦へ置き換えることはしない。
4. `isBoss` は敵の見た目、BGM、フェーズを表す情報として残せるが、逃走・仲間化・報酬可否を決める唯一の代用品にはしない。
5. ダメージ理由の説明パネル、ダメージ式、行動順、問題レンダラー、content schema、セーブ schema は対象外とする。

## Objective

`src/core/battle/engine.ts` に固定されている敵の行動確率と低 HP 回復条件を、Phaser、DOM、GameState に依存しない純粋な敵戦術ポリシーへ抽出する。同時に、通常戦、ボス戦、チュートリアル戦、イベント戦の逃走、仲間化、報酬、問題、パーティ供給・永続化を `BattleRuleset` へ集約する。

成功時には、同じ seed、初期状態、コマンド列、ruleset から同じイベント列が再現される。既存呼び出しが ruleset を明示しない場合も現在の挙動を維持しながら、テストでは少なくとも標準戦術と別の戦術を差し替えて違いを証明できる。

## Current Baseline

- 敵は現在、各ターンで乱数を 1 回引いたあと、使用可能な回復技があり HP が 30% 以下なら回復を優先する。
- 回復を選ばない場合は、わざ 30%、通常攻撃 60%、防御 10% を基準にする。わざを選んだ帯で使用可能な攻撃技がなければ通常攻撃へフォールバックする。
- 攻撃技の選択は既存 `Rng.pick`、ダメージ、ドロップ、仲間化、逃走、同速抽選は既存 `src/core/rng.ts` の状態を共有する。
- 通常戦は素早さ比で逃走でき、ボス戦は開発者モードを除いて逃走できない。ボスは仲間化できない。
- 勝利時は XP、gold、drop、撃破カウンター、勝利後の仲間化候補を通常どおり処理する。script 戦も現時点では Battle 側の通常報酬を受け取り、イベント独自報酬は event runtime が別に処理する。
- 問題はわざから `QuestionQuery` を作り、パーティは `partyFromGameState` で現在のセーブから組み立て、終了時に HP、MP、道具、報酬、仲間化を GameState へ反映する。

## Tech Stack

- TypeScript `strict`
- Vitest
- 既存の `src/core/rng.ts`
- Phaser 3 は Scene adapter に限定し、新しい core モジュールから import しない
- 新規依存なし

## Commands

- Focused tests: `pnpm exec vitest run tests/unit/enemyPolicy.test.ts tests/unit/battleRuleset.test.ts tests/unit/battle.test.ts tests/unit/battleUi.test.ts tests/unit/eventRuntimePorts.test.ts`
- Fast gate: `pnpm check:fast`
- Related tests: `pnpm test:related src/core/battle/enemyPolicy.ts src/core/battle/ruleset.ts src/core/battle/engine.ts src/core/battle/setup.ts src/scenes/battle/contracts.ts src/scenes/Battle.ts`
- Architecture: `pnpm check:architecture`
- Full test: `pnpm test`
- Content validation: `pnpm validate:content`
- Build: `pnpm build`
- Preview after implementation: `pnpm nrd -- --port 4175 --strictPort`

## Project Structure

- `src/core/battle/enemyPolicy.ts`: 敵の観測可能な状態と戦術設定から `EnemyIntent` を 1 つ選ぶ純粋関数。
- `src/core/battle/ruleset.ts`: `BattleRuleset`、戦闘種別、標準 preset、旧 Scene 入力からの互換解決。
- `src/core/battle/types.ts`: BattleState が再生に必要な ruleset 情報と、必要なら敵 intent の共有型。
- `src/core/battle/engine.ts`: policy が返した intent を実行し、ruleset に従って逃走、仲間化、勝利報酬を処理する consumer。
- `src/core/battle/setup.ts`: ruleset の party source に従い、保存パーティまたは明示されたパーティを組み立てる純粋な境界。
- `src/scenes/battle/contracts.ts`: 呼び出し元が battle kind と必要な party/question 入力を型で渡す契約。
- `src/scenes/Battle.ts`: ruleset を解決して core、質問 port、結果永続化へ渡す composition root。ルール計算は置かない。
- `src/scenes/overworld/eventRuntimePorts.ts`: script 戦を event ruleset として起動する薄い adapter。
- `tests/unit/enemyPolicy.test.ts`: 戦術選択、フォールバック、乱数消費順、別戦術のテスト。
- `tests/unit/battleRuleset.test.ts`: preset、互換解決、禁止操作、報酬、party persistence の契約テスト。

実装計画で必要性を確認した場合だけ既存の `musubiDama.ts`、`recruitFlow.ts`、`hudViews.ts`、`resultView.ts` と関連テストを最小限追従させる。`questions/contracts.ts` と schemas は変更しない。

## Typed Contracts

ビットフラグや相互依存する boolean 群は使わない。許可される状態だけを discriminated union で表す。

```ts
export type EnemyIntent =
  | { kind: 'attack' }
  | { kind: 'skill'; skillId: string }
  | { kind: 'heal'; skillId: string }
  | { kind: 'defend' };

export interface EnemyTacticsPolicy {
  id: string;
  lowHp: { threshold: number; action: 'prefer-heal' | 'weighted' };
  weights: { attack: number; skill: number; defend: number };
}

export interface BattleRuleset {
  id: 'normal' | 'boss' | 'tutorial' | 'event';
  enemyTactics: EnemyTacticsPolicy;
  flee: { mode: 'speed-check' } | { mode: 'blocked' } | { mode: 'guaranteed' };
  recruitment: { mode: 'standard' } | { mode: 'disabled' };
  rewards: { mode: 'standard' } | { mode: 'none' };
  questions: { mode: 'skill-driven' } | { mode: 'scripted' };
  party:
    | { source: 'saved'; persistence: 'standard' }
    | { source: 'provided'; persistence: 'discard' };
}
```

型名やファイル内の細部は計画時に既存命名へ合わせて調整できるが、各軸を独立した型付き規則として持つこと、無効な組合せを bit mask で表さないこと、engine と Scene の双方が同じ canonical ruleset を参照することは必須とする。

## Default Rulesets

| Kind | Enemy tactics | Flee | Recruitment | Rewards | Questions | Party |
|---|---|---|---|---|---|---|
| `normal` | 現行 60/30/10・HP 30% 回復優先 | 素早さ比 | 標準 | 標準 | わざ起点 | 保存パーティ・標準反映 |
| `boss` | 現行と同じ。boss phase は従来どおり別処理 | 原則禁止。既存 dev mode のみ互換許可 | 禁止 | 標準 | わざ起点 | 保存パーティ・標準反映 |
| `tutorial` | 現行標準を初期値とし、明示 policy へ差し替え可能 | 禁止 | 禁止 | なし | scripted | 明示パーティ・結果破棄 |
| `event` | 現行標準を初期値とし、明示 policy へ差し替え可能 | 非 boss は素早さ比、boss は禁止 | 非 boss は標準、boss は禁止 | 標準 | わざ起点 | 保存パーティ・標準反映 |

既存 `BattleSceneData` の `isBoss` と `devMode` は互換入力として正規化する。通常、既存 boss、既存 script battle の省略時挙動は変えない。新しい tutorial/provided party や scripted question の具体的なシナリオ制作は、この ruleset を利用する別タスクで行う。

## Enemy Policy Behavior

`selectEnemyIntent(context, policy, rng)` 相当の関数は状態を変更せず、実行可能な intent だけを返す。

- context は敵の HP/最大 HP、MP、解決済み skill 定義など、戦術判断に必要な最小値だけを受け取る。
- 標準 policy は現在の条件とフォールバックをそのまま再現する。
- 乱数の値だけでなく消費順も互換条件とする。特に低 HP 回復ターンでも、現行と同じ位置で最初の抽選を消費する。
- 使用不能な skill、MP 不足、回復技なしでは、policy が定める実行可能なフォールバックへ移る。
- intent の実行、MP 消費、damage/heal/buff event 生成、勝敗判定は engine に残す。
- 標準とは異なる戦術として、攻撃技を優先し防御しない aggressive policy、またはテスト専用の重み 100% policy を注入でき、同じ敵状態でも異なる intent 列になることを固定 seed で証明する。
- `Math.random` は使わない。

## Ruleset Integration

- `createBattle` は解決済み ruleset を受け取り、replay に必要な情報を BattleState に保持する。同じ state と command を `act` へ渡せば外部 mutable 設定に依存しない。
- 逃走可否、仲間化コマンド、むすび玉、勝利後の仲間化 offer は ruleset の recruitment/flee を canonical 判定とする。敵定義の `isBoss` は追加の安全条件として残せるが、Scene ごとの条件分岐を増やさない。
- rewards が `none` のとき、勝利イベントは XP、gold、drops、recruit offer を付与せず、永続化層も通常報酬を加えない。
- questions が `skill-driven` のときは現在の `QuestionQuery` を維持する。`scripted` は Scene が提供する question port を使い、core は `ActionResult.score` だけを見る原則を維持する。
- party source が `saved` のときは現在の `partyFromGameState` と結果反映を維持する。`provided` は Scene 入力に明示された Party を使い、終了時に GameState の HP、MP、道具、XP、gold、drop、仲間へ反映しない。
- `Battle.ts` は kind や bit flag を見て個別計算せず、ruleset の解決、port の選択、結果の受け渡しだけを行う。
- encounter source 固有の進行完了や敗北時 respawn は既存 `encounterResultPolicy` の責務に残し、BattleRuleset へ移さない。

## Testing Strategy

テスト駆動で RED → GREEN → REFACTOR を各 slice で確認する。

1. `enemyPolicy.test.ts` で現在の 60/30/10 境界、HP 30% 境界、回復技・攻撃技・MP のフォールバック、固定 seed の intent 列、別戦術の差を先に失敗させる。
2. `battleRuleset.test.ts` で 4 preset、旧入力の互換解決、逃走、仲間化、報酬なし、provided party の非永続化を先に固定する。
3. `battle.test.ts` の既存 replay と代表 seed のイベント列を回帰契約にし、抽出前後で RNG state とイベント順が一致することを確認する。
4. `battleUi.test.ts` と `eventRuntimePorts.test.ts` で Scene/setup 契約、script battle の既存通常報酬、boss 制約を確認する。
5. 変更中は focused tests、`pnpm check:fast`、変更ソースを列挙した `pnpm test:related` を実行する。完了時はプロジェクト指定の全検査を統合担当と重複しないタイミングで実行する。

統計的な比率だけに依存せず、境界値または制御可能な fake RNG と固定 seed で決定論的に検証する。

## Boundaries

### Always

- `src/core/rng.ts` の Rng だけを使い、標準 ruleset の RNG 消費順を維持する。
- pure policy は Phaser、DOM、Scene、GameState を import しない。
- 既存挙動を fixed-seed regression で保護してから engine を切り替える。
- 敵 action、ruleset、Scene launch の型は discriminated union を使う。
- 変更は battle policy/ruleset と必要な setup/Scene adapter、関連テストに限定する。
- 各実装 slice を検査して原子的にコミットする。

### Ask First

- `questions/contracts.ts`、content schema、保存 schema、BattleEvent 契約の変更。
- 新しい依存、AI provider、外部サービスの追加。
- 既存の敵行動確率、HP 閾値、報酬量、逃走率、仲間化率の変更。
- tutorial/event の新しいユーザー向け進行や文言の追加。

### Never

- `Math.random`、bit flag、型なしの ruleset 名文字列を使わない。
- core policy から Phaser、DOM、GameState、問題タイプ名へ依存しない。
- ダメージ理由の説明パネルを実装しない。
- 参照作品のコード断片、名称、文言、キャラクター、画像、音楽、マップ、数値バランスをコピーしない。
- `tasks/plan.md`、`tasks/todo.md`、他モジュールの task ファイル、無関係な既存変更を上書きしない。

## Success Criteria

1. 現在の敵 AI の 60/30/10、HP 30% 以下の回復優先、使用不能時フォールバックが標準 policy として engine 外へ抽出される。
2. 同じ seed、初期 BattleState、コマンド列、標準 ruleset で、既存と同じ RNG 消費順、BattleEvent 順、最終状態を再現する。
3. 標準と異なる戦術を注入し、同じ入力で異なる合法な EnemyIntent 列を fixed-seed test で証明できる。
4. 通常、boss、tutorial、event の各 preset が逃走、仲間化、報酬、問題、party source/persistence を型付きで持ち、bit flag を使わない。
5. 既存の通常戦、boss 戦、script 戦は caller を一括変更しなくても現在の挙動を維持する。boss の dev mode 逃走も維持する。
6. engine、setup、Scene が同じ canonical ruleset を使い、Scene に敵 AI の確率や HP 条件を複製しない。
7. questions core boundary を守り、バトルロジックは引き続き `ActionResult.score` だけを使う。
8. focused tests、`pnpm check:fast`、変更ソースを渡した `pnpm test:related` が成功する。
9. 実装差分を scope、correctness、determinism、architecture、readability の観点でレビューし、重大・必須指摘を解消する。
10. 担当変更だけを `codex/battle-ai-ruleset` にコミットし、コミット ID と実行した検査を報告する。共有ブランチへの merge/push は行わない。

## Open Questions

なし。上記の互換既定値と対象外を前提に、具体的な実装順は仕様承認後の `tasks/battle-ai-ruleset-plan.md` と `tasks/battle-ai-ruleset-todo.md` で確定する。
