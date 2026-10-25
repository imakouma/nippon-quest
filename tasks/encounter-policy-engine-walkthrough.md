# Walkthrough: Encounter Policy Engine

## 何を作ったか

- `src/core/encounter/policy.ts` に Phaser 非依存の遭遇 state machine を追加した。
- 対象タイル、遷移後 3 歩、戦闘後 4 対象歩、table の check interval / rate、3 回連続不発後の pity、weighted selection を独立した decision として扱う。
- `src/core/encounter/contentAdapter.ts` に map / ground / region / unlock 状態から policy input を作る契約を追加した。
- `src/scenes/overworld/encounterLifecycle.ts` は policy decision だけを Battle 起動データへ変換する。
- `Overworld` から歩数 modulo、確率判定、weight 抽選を除去した。

## どう確認したか

- TDD RED: module 未実装で `tests/unit/encounterPolicy.test.ts` が失敗することを確認。
- Focused GREEN: encounter policy / adapter / lifecycle 13 tests と battle setup 回帰 29 tests が成功。
- Mutation check: `rate > 0` を `rate >= 0` に反転すると rate 0 境界テストが失敗することを確認し、復元。
- 全検査: lint、architecture、1,469 unit tests、content validation、production build が成功。
- Field E2E: boss distance と area map navigation の 3 tests が成功。
- Preview: `http://127.0.0.1:4175/?resetSaves=1` をアプリ内ブラウザで開き、タイトル画面を確認。console error / warning は 0 件。

## 残課題

- なし。遭遇 pacing の数値は既存 content の `stepsPerCheck` / `rate` を維持し、新規 schema やセーブ migration は追加していない。
- production build の既存 chunk size warning は今回の変更範囲外。
