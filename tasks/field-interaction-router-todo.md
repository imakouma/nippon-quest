# Field Interaction Router Tasks

## Task 1: Pure resolver contract

- [ ] RED: 優先順位、同一frame、counter、方向、対象なし、lockのテストが失敗する。
- [ ] GREEN: resolverが一件だけ返す。
- [ ] Verify: focused router test。

## Task 2: Runtime boundary adapter

- [ ] RED: map/event/dispatchの委譲テストが失敗する。
- [ ] GREEN: field flow内でmap transitionとevent commandsを実行する。
- [ ] Verify: focused runtime test。

## Checkpoint: Foundation

- [ ] focused testsがgreen。
- [ ] resolverにPhaser import/副作用がない。

## Task 3: Overworld integration

- [ ] interact/arrive/menuのcandidate収集を接続する。
- [ ] 既存Scene handlerと効果音・lock挙動を維持する。
- [ ] Verify: focused unit + overworld E2E。

## Task 4: Review and release gate

- [ ] mutationで重要条件を反転し、テストが落ちることを確認する。
- [ ] correctness/readability/architecture/security/performance reviewを完了する。
- [ ] Graphify code-only graphを更新する。
- [ ] lint / architecture / test / content / buildを通す。
- [ ] 最新previewをアプリ内ブラウザで確認する。
- [ ] コミットし、統合担当向け情報を記録する。
