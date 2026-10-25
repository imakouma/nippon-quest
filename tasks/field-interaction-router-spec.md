# Spec: Field Interaction Router

## Objective

`Overworld` に散在する入力時・到着時の優先判定を、Phaser 非依存の typed pure resolver に集約する。
同じ入力では高優先度の決定を一件だけ返し、同一フレームの複数キー通知、入力ロック中、対象なしでは副作用を起こさない。

## Commands

- Focused test: `pnpm exec vitest run tests/unit/fieldInteractionRouter.test.ts tests/unit/fieldInteractionRuntime.test.ts`
- Lint: `pnpm lint`
- Architecture: `pnpm check:architecture`
- Unit suite: `pnpm test`
- Content: `pnpm validate:content`
- Build: `pnpm build`
- Field E2E: `pnpm exec playwright test tests/e2e/overworld.spec.ts`

## Project Structure

- `src/scenes/overworld/fieldInteractionRouter.ts`: pure input/candidate/decision contracts and resolver
- `src/scenes/overworld/fieldInteractionRuntime.ts`: runtime boundary adapter; no candidate discovery
- `src/core/events/`: completed event-command-runtime branchから最小統合する公開契約とpure runtime
- `src/scenes/Overworld.ts`: candidatesを収集し、decisionを既存処理へ接続する薄いScene adapter
- `tests/unit/fieldInteraction*.test.ts`: priority, reach, lock, dedupe, runtime delegation

## Code Style

```ts
const decision = resolveFieldInteraction({
  intent: 'interact',
  player: { position: { x: 4, y: 5 }, facing: 'up' },
  frontTile: { position: { x: 4, y: 4 }, isCounter: false },
  flow: { locked: false, frame: 12, lastHandledFrame: 11 },
  candidates,
});
```

- discriminated unionで候補とdecisionを表し、`any` と Phaser 型を使わない。
- resolverは入力を変更せず、callbackを呼ばず、候補の実行も行わない。
- executorはruntime公開境界への委譲だけを担当し、優先順位を再判定しない。

## Priority Contract

小さい数ほど優先する。同順位は入力候補の順序で安定決定する。

| intent   | priority | candidate                          | reach / condition                        |
| -------- | -------: | ---------------------------------- | ---------------------------------------- |
| all      |        0 | none                               | flow locked または同一 frame 処理済み    |
| menu     |       10 | menu                               | 明示的な menu 入力                       |
| interact |       10 | battle                             | 正面（中ボス・地域ボス・県ボス・裏ボス） |
| interact |       20 | npc                                | 正面                                     |
| interact |       21 | npc                                | 正面タイルがcounterで、その1マス先       |
| interact |       22 | npc                                | 周囲1マスの互換fallback                  |
| interact |       30 | chest                              | 正面                                     |
| interact |       32 | chest                              | 足元または周囲1マスの互換fallback        |
| interact |       40 | sign / field-event / event-command | 正面                                     |
| interact |       42 | sign / background                  | 足元または周囲1マスの互換fallback        |
| arrive   |       10 | locked-transition                  | 足元                                     |
| arrive   |       20 | map-transition                     | 足元                                     |
| arrive   |       30 | warp                               | 足元                                     |
| arrive   |       40 | field-event / event-command        | 足元                                     |
| arrive   |       50 | battle                             | 足元（ランダム戦闘候補）                 |

候補に `requiredFacing` がある場合は、プレイヤーの向きが一致するときだけ対象にする。

## Testing Strategy

- Vitest small testsでpriority表、同一frame抑止、カウンター越し会話、方向条件、対象なし、入力ロックを固定する。
- runtime adapterはfake portsで `field-flow-runtime`、`event-command-runtime`、`map-transition-pipeline` への委譲と単一dispatchを検証する。
- `Overworld` の既存E2Eと全体検査でScene統合の回帰を確認する。

## Boundaries

- Always: one decision per resolver call; preserve current transition/event/battle order; use existing Scene handlers.
- Ask first: content/schema契約の拡張、新依存、保存形式変更。
- Never: Phaser import in resolver、router内の副作用、別branchの大規模runtime stack複製、HeartGold固有資産やコードの転用。

## Success Criteria

- resolverがPhaser非依存で、全優先順位と指定edge caseをunit testで証明する。
- Space/Enter/Zが同一frameに重なっても一件だけ実行される。
- NPC正面会話とcounter越し会話が可能で、向き不一致は選ばれない。
- arrivalは locked transition → transition → warp → event → battle の順を保持する。
- executorが既存3runtimeの公開境界に接続し、`Overworld.ts` に巨大分岐を追加しない。
- 必須検査、対象E2E、最新版preview確認、コミットが完了する。

## Open Questions

なし。完成済みevent-command branch全体は現在基点と大きく乖離するため、公開契約/runtimeのみを同コミット由来で最小統合する。
