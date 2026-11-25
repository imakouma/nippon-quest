# 主人公の技編成 確認記録

- メニューの「わざ」から、通常4枠とチャージ2枠を変更できる。覚えた技は別に保持する。
- 保存データv14からv15へ移行し、既存の技と中断戦闘を保持する。装備を外した場合は使えなくなる技を枠から外す。
- 戦闘で通常4技とバースト2技が表示されることを作業版で確認した。
- 技の入れ替え、画面を開き直した直後、再読み込み後の保持をブラウザテストで確認した。[編成画面](../docs/verification/hero-skill-loadout.png)
- `pnpm check:fast`、`pnpm typecheck:tests`、`pnpm test --maxWorkers=2 --testTimeout=60000`（299ファイル・2826件）、`pnpm build`、`pnpm validate:content`（build内）成功。
- 統合版への取り込みは未実施。
