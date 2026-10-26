# Capability Map: Development Performance Hardening

## Objective

新機能を追加する前に、日常の検査、並行チャット、TypeScript、テスト、ゲーム起動の待ち時間を短縮し、今後ファイル数が増えても開発速度が急激に落ちない状態を作る。

| Module id               | Responsibility                                                                   | Depends on                         |
| ----------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| `fast-quality-loop`     | 高速検査と完全検査を分離し、整形対象をコード中心に限定する                       | —                                  |
| `scoped-typecheck`      | アプリ・テスト・開発ツールの型検査を分離し、増分キャッシュを使う                 | `fast-quality-loop`                |
| `tiered-tests`          | 関連・高速・データ監査・完全テストを用途別に実行できるようにする                 | `fast-quality-loop`                |
| `workspace-io-boundary` | 大容量制作物と生成物を通常の監視・検査から外し、並行実行規則を固定する           | `fast-quality-loop`                |
| `boot-performance`      | タイトル表示を全ゲームデータ読込から切り離し、起動段階と配信容量を計測・監視する | `scoped-typecheck`, `tiered-tests` |

Build order: `fast-quality-loop` → `scoped-typecheck`, `tiered-tests`, `workspace-io-boundary` → `boot-performance`

## Approval

ユーザーは 2026-10-26 に、計画作成後の全実装と検証を一括承認した。追加の確認待ちは設けず、既存仕様・既存変更を保持したまま上記順序で完了まで進める。
