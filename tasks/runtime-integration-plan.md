# Runtime integration plan

## Goal

本番イベント基盤 `59dab37b` と map-object movement 統合 `b98e6fd5` を土台に、フィールド操作、フィールド副作用、遭遇ポリシー、戦闘演出の各ランタイムを一つの専用ブランチへ統合する。

## Inputs

- field interaction: `43a2c7f3` → `338f5386` → `f8a854b0`
- map-object movement: `b98e6fd5`
- field effect scope: `25b73546`
- encounter policy: `e0c388da`
- battle presentation: `703a537f`
- follow-up assessment: `d5cc01f5`

## Integration rules

1. 競合は `ours` / `theirs` の一括選択をせず、現行の production event contract を正として意味で解消する。
2. `d5cc01f5` は重複部分を再導入せず、固有のリスク低減だけを移植する。
3. Scene へ新しい責務を戻さず、既存の runtime / port 境界を維持する。
4. 各統合後に関連テスト、型検査、architecture 検査を行い、最後に全検査と実ブラウザE2Eを行う。
5. push / deploy / 共有ブランチへの merge は行わない。

## Verification

- `pnpm lint`
- `pnpm check:architecture`
- `pnpm test`
- `pnpm validate:content`
- `pnpm build`
- field / transition / event / movement / encounter / battle presentation E2E
- `graphify extract . --code-only --no-cluster`
- 最新 build の `127.0.0.1:4174` プレビューとブラウザ console 確認
