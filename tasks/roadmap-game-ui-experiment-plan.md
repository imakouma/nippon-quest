# Implementation Plan: ゲームらしい学習マップ試作

## Overview

既存のロードマップ操作契約を保ちながら、選択→詳細→開始のゲームループ、状態階層、意味的ズームを薄いUI層として追加する。

## Architecture Decisions

- 選択状態は `RoadmapGraph` のローカルstateとし、保存形式は変えない。
- 開始callbackは詳細パネルの主要ボタンからだけ呼ぶ。
- 意味的ズームは倍率から導出した `data-zoom-detail` とCSSで表現し、データモデルを増やさない。
- 現在地・選択・ロックは既存state/visibilityから導出し、教材データへ視覚属性を追加しない。

## Dependency Graph

文言 → 選択UI契約 → 状態階層CSS → E2E・実画面検証

## Task List

### Phase 1: Interaction contract

- [x] Task 1: 選択と開始を分離する失敗テストを追加する。
- [x] Task 2: 選択パネルと主要開始ボタンを実装する。

### Checkpoint: Selection loop

- [x] 単元クリックでは開始せず、主要ボタンでのみ開始する。
- [x] ロック単元は選択も開始もできない。

### Phase 2: Game-map hierarchy

- [x] Task 3: 現在地・選択中・経路・操作UIの視覚階層を整える。
- [x] Task 4: 50%未満の意味的ズームを追加する。

### Checkpoint: Visual behavior

- [x] 100%で現在地と選択中が明確に区別できる。
- [x] 20%で文字の密集がなく、経路と重要地点が読める。

### Phase 3: Verification and handoff

- [x] Task 5: focused test、E2E、標準検査、960×540 / 640×540の実画面確認を行う。
- [x] Task 6: 独立コミットとWalkthroughを残し、4174を試作版へ切り替える。

## Risks and Mitigations

| Risk                                   | Impact | Mitigation                                                                 |
| -------------------------------------- | ------ | -------------------------------------------------------------------------- |
| パネルが地図を隠す                     | 中     | 画面下部の小型オーバーレイにし、640×540でも主要操作を残す                  |
| node click契約変更で既存フローが壊れる | 中     | callbackの発火位置をテストし、E2Eで開始導線を確認する                      |
| 低倍率で操作対象まで小さくなる         | 中     | 俯瞰時は情報を隠す一方、現在・選択マーカーの視認性をCSSで補強する          |
| 好みに合わない                         | 低     | 安定版とは別branch/worktree/commitにし、4174の起動元だけで戻せるようにする |

## Open Questions

なし。
