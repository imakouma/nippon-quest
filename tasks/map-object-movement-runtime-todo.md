# Map Object Movement Runtime

## Task 1: Event runtime prerequisite

- [ ] 完成済みcore契約・実行器コミットを取り込む。
- [ ] 既存event runtime focused testを通す。

## Task 2: RED contract tests

- [ ] 6 commandと6状態の順序を固定する。
- [ ] reservation、abort、timeout、limits、errors、cleanupを固定する。
- [ ] 未実装状態でfocused testが失敗することを確認する。

## Task 3: Runtime implementation

- [ ] 最小実装でhappy pathを通す。
- [ ] 全失敗経路とPromise settlementを実装する。
- [ ] event runtime dispatchを追加する。

## Checkpoint: Focused verification

- [ ] `pnpm exec vitest run tests/unit/mapObjectMovementRuntime.test.ts tests/unit/eventCommandRuntime.test.ts`
- [ ] `pnpm check:architecture`

## Task 4: Review and full verification

- [ ] five-axis reviewとmutation checkを完了する。
- [ ] `pnpm lint`
- [ ] `pnpm check:architecture`
- [ ] `pnpm test`
- [ ] `pnpm validate:content`
- [ ] `pnpm build`
- [ ] Graphify code-only graphを更新する。
- [ ] 4175 previewを確認して停止する。
- [ ] walkthroughとコミット情報を記録する。
