# 技メニューと戦闘ドロップの確認

- メニューに「わざ」を5番目の項目として追加し、技の編成を独立した画面に移動した。持ち物画面には編成操作を表示しない。
- 戦闘で得た使用可能な消耗品を戦闘用バッグに自動登録し、重複する取得や戦闘結果の再適用でも重複しない。
- 東北クリア前に入手した装備を持ち物一覧に表示し、装備制限の理由を示す。装備可能になる時期は変更しない。
- ブラウザで5項目と技の入れ替え、再読込後の保持、持ち物・装備操作を確認した。[5項目の画面](../docs/verification/five-menu-categories.png) / [技の画面](../docs/verification/hero-skill-loadout.png)
- `pnpm check:fast`、`pnpm typecheck:tests`、`pnpm test --maxWorkers=2 --testTimeout=60000`（299ファイル・2829件）、`pnpm build` が成功。ブラウザの技・持ち物テスト2件も成功。
