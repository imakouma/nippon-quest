# Implementation Plan: Battle AI Ruleset

## Status

承認済み仕様 `tasks/battle-ai-ruleset-spec.md` に基づき実装する。タスクは `tasks/battle-ai-ruleset-todo.md` で追跡し、既存の `tasks/plan.md` と `tasks/todo.md` は変更しない。

## Overview

敵の行動選択を純粋な戦術ポリシーとして `engine.ts` から分離し、既存の乱数消費順と標準挙動を維持する。その上で、通常、ボス、チュートリアル、イベント戦の逃走、仲間化、報酬、問題、パーティ供給・永続化を型付き `BattleRuleset` に集約する。Scene は ruleset の解決と port 接続だけを行い、戦闘ルールを重複実装しない。

## Dependency Graph

```text
敵戦術の回帰テスト
  └─ pure EnemyIntent policy
       └─ BattleRuleset contract + presets
            └─ engine の policy/ruleset consumer 化
                 └─ setup / Scene launch contract
                      └─ provided party / scripted question / persistence adapter
                           └─ focused regression + review
```

## Architecture Decisions

### Intent selection and execution stay separate

`enemyPolicy.ts` は敵状態、使用可能 skill、設定、Rng から合法な `EnemyIntent` を返すだけにする。MP 消費、HP 更新、BattleEvent、勝敗判定は `engine.ts` に残し、policy が戦闘状態を書き換えないようにする。

### Preserve the random stream, not only percentages

標準 policy は現行と同じ位置で最初の `rng.next()` を消費し、攻撃 skill 選択時だけ既存どおり `rng.pick()` を使う。低 HP 回復ターンも最初の抽選を消費する。fixed seed の engine 回帰で抽出前後のイベント列と最終状態を固定する。

### One canonical ruleset in BattleState

`createBattle` で解決済み ruleset を BattleState に保存し、`act`、replay、HUD/Scene が同じ値を参照する。`isBossBattle` は表示・boss phase の互換情報として残すが、逃走や仲間化の主判定は ruleset に移す。

### Discriminated unions instead of flags

逃走、仲間化、報酬、問題、party source/persistence は mode/source を持つ union で表す。preset は immutable な値を返し、通常と既存 event/boss は現在の挙動を既定値にする。

### Scene remains a composition root

Scene launch contract は ruleset kind と必要な supplied party / scripted question 入力だけを受け取る。保存 party の構築は setup、敵 action と報酬判定は core、encounter source 固有進行は既存 encounter lifecycle に残す。

## Implementation Phases

### Phase 1: Enemy policy vertical slice

1. fake RNG と fixed seed で現行の重み境界、低 HP 回復、MP/skill fallback、乱数消費順を失敗するテストとして追加する。
2. `enemyPolicy.ts` に型付き context、policy、intent、標準 policy と差し替え可能な別戦術を最小実装する。
3. focused test を通し、pure policy slice をコミットする。

Checkpoint: policy が engine 非依存で動き、標準と別戦術の intent が決定論的に異なる。

### Phase 2: Ruleset and engine vertical slice

4. 4 種の preset と旧 `isBossBattle` / dev 逃走の互換解決を RED で固定する。
5. `BattleRuleset` を BattleState/createBattle に結線し、enemy action、逃走、仲間化、むすび玉、勝利報酬を ruleset consumer にする。
6. 既存 battle replay、報酬、boss、仲間化テストと新しい ruleset テストを通し、engine slice をコミットする。

Checkpoint: 通常戦の固定 seed 出力が維持され、ruleset により禁止操作と報酬なしを純粋に検証できる。

### Phase 3: Setup and Scene contract vertical slice

7. `BattleSceneData` を互換維持した typed scenario 入力へ拡張し、event runtime が event kind を渡す契約テストを先に追加する。
8. 保存 party と supplied party の setup を分離し、supplied party の結果を GameState へ永続化しない経路を追加する。
9. skill-driven と scripted question source の Scene adapter を結線し、core が `ActionResult.score` だけを見る境界を維持する。
10. focused Scene/setup tests を通し、integration slice をコミットする。

Checkpoint: 既存 caller は変更なしで従来 ruleset に正規化され、tutorial/event 用入力を型安全に構築できる。

### Phase 4: Verification and review

11. focused tests、`pnpm check:fast`、全変更ソースを渡した `pnpm test:related` を実行する。
12. Graphify を code-only で更新し、循環依存と意図しない影響範囲がないことを確認する。
13. tests first の自己レビューと条件変異を行い、correctness、readability、architecture、security、performance の必須指摘を修正する。
14. task checklist と変更概要を更新し、最終コミットを作る。

Checkpoint: 指定検査が通り、担当差分だけがコミットされ、統合担当向け注意点が記録される。

## Verification Strategy

各 slice の focused tests:

```bash
pnpm exec vitest run tests/unit/enemyPolicy.test.ts
pnpm exec vitest run tests/unit/battleRuleset.test.ts tests/unit/battle.test.ts
pnpm exec vitest run tests/unit/battleUi.test.ts tests/unit/eventRuntimePorts.test.ts
```

担当完了ゲート:

```bash
pnpm exec vitest run tests/unit/enemyPolicy.test.ts tests/unit/battleRuleset.test.ts tests/unit/battle.test.ts tests/unit/battleUi.test.ts tests/unit/eventRuntimePorts.test.ts
pnpm check:fast
pnpm test:related src/core/battle/enemyPolicy.ts src/core/battle/ruleset.ts src/core/battle/types.ts src/core/battle/engine.ts src/core/battle/setup.ts src/core/battle/musubiDama.ts src/scenes/battle/contracts.ts src/scenes/battle/hudViews.ts src/scenes/battle/recruitFlow.ts src/scenes/Battle.ts src/scenes/overworld/eventRuntimePorts.ts
```

統合担当の所有である `pnpm test`、`pnpm build`、`pnpm check:full` は実行しない。

## Risks and Mitigations

| Risk                                                 | Impact | Mitigation                                                                                       |
| ---------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| 抽出で RNG 消費順が変わり、replay と戦闘結果が変わる | 高     | fake RNG の呼び出し列と fixed-seed event log を実装前に固定する                                  |
| `isBossBattle` と ruleset が二重の正になる           | 高     | ruleset を行動制約の正、boss 値を表示・phase の互換情報と明記し、resolver に正規化を集約する     |
| tutorial/event の将来機能まで作り込みすぎる          | 中     | preset、supplied party、scripted question port の最小契約だけ実装し、シナリオや文言は追加しない  |
| Scene がさらに巨大化する                             | 中     | resolver/setup/helper を新規 core/scene module に置き、Battle.ts は結線差分だけにする            |
| provided party の結果が誤ってセーブへ混入する        | 高     | persistence discard の純粋判定と Scene 終了経路をテストし、applyBattleResult を通さない          |
| 無効 ruleset 入力が silent fallback する             | 中     | 内部 typed contract を優先し、必要入力不足は明示 error。互換 fallback は旧省略入力だけに限定する |

## Open Questions

なし。仕様で承認された既定値と対象外を維持し、追加のユーザー確認なしで実装を完遂する。
