# Field Interaction Router Tasks

## Task 1: Pure resolver contract

- [x] RED: 優先順位、同一frame、counter、方向、対象なし、lockのテストが失敗する。
- [x] GREEN: resolverが一件だけ返す。
- [x] Verify: focused router test。

## Task 2: Runtime boundary adapter

- [x] RED: map/event/dispatchの委譲テストが失敗する。
- [x] GREEN: field flow内でmap transitionとevent commandsを実行する。
- [x] Verify: focused runtime test。

## Checkpoint: Foundation

- [x] focused testsがgreen。
- [x] resolverにPhaser import/副作用がない。

## Task 3: Overworld integration

- [x] interact/arrive/menuのcandidate収集を接続する。
- [x] 既存Scene handlerと効果音・lock挙動を維持する。
- [x] Verify: focused unit + overworld E2E。

## Task 4: Review and release gate

- [x] mutationで重要条件を反転し、テストが落ちることを確認する。
- [x] correctness/readability/architecture/security/performance reviewを完了する。
- [x] Graphify code-only graphを更新する。
- [x] lint / architecture / test / content / buildを通す。
- [x] 最新previewをアプリ内ブラウザで確認する。
- [x] コミットし、統合担当向け情報を記録する。
