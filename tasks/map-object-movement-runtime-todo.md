# Map Object Movement Runtime

## Task 1: Event runtime prerequisite

- [x] 完成済みcore契約・実行器コミットを取り込む。
- [x] 既存event runtime focused testを通す。

## Task 2: RED contract tests

- [x] 6 commandと6状態の順序を固定する。
- [x] reservation、abort、timeout、limits、errors、cleanupを固定する。
- [x] 未実装状態でfocused testが失敗することを確認する。

## Task 3: Runtime implementation

- [x] 最小実装でhappy pathを通す。
- [x] 全失敗経路とPromise settlementを実装する。
- [x] event runtime dispatchを追加する。

## Checkpoint: Focused verification

- [x] `pnpm exec vitest run tests/unit/mapObjectMovementRuntime.test.ts tests/unit/eventCommandRuntime.test.ts`
- [x] `pnpm check:architecture`

## Task 4: Review and full verification

- [x] five-axis reviewとmutation checkを完了する。
- [x] `pnpm lint`
- [x] `pnpm check:architecture`
- [x] `pnpm test`
- [x] `pnpm validate:content`
- [x] `pnpm build`
- [x] Graphify code-only graphを更新する。
- [x] 4175 previewを確認して停止する。
- [x] walkthroughとコミット情報を記録する。
