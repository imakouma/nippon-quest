# Implementation Plan: Context Action UI

## Overview

既存のフィールド操作順を変えずに一度だけ解決する純粋 resolver と、解決済みの1件だけを表示する Preact ボタンを追加する。`Overworld.ts` への最終配線は統合チャットへ残し、このブランチでは Scene から独立して検査できる契約・UI・統合用テストを用意する。

## Architecture Decisions

- resolver は Phaser / Preact を import せず、現在のロック状態と優先順済み候補を入力にする。
- action は `kind` と同一の `activate` callback を持ち、キーボードとボタンが同じ解決結果を共有できる契約にする。
- UI は native `button` と既存のフィールド用色・枠・PixelIcon / RubyLabel を使い、任意の `ContextActionView` 以外のゲーム状態を知らない。
- `FieldUi.tsx` と `field.css` のミニマップ DOM・挙動・セレクターは変更しない。
- `player-locomotion-runtime` 統合前でも使えるよう、`moving / turning / bumping / busy / inBattle / overlayOwnsInput` を明示的な可視性ロックとして受ける。

## Dependency Graph

`ContextActionState / Candidate` → `resolveContextAction` → `ContextActionView` → `ContextActionButton` → `FieldHud.action`

## Task List

### Phase 1: Resolver contract (RED → GREEN)

- [x] NPC・ボス・宝箱・看板の優先順位、開封済み宝箱、対象なし、全ロック状態の失敗テストを追加する。
- [x] 最初の有効候補だけを返す純粋 resolver を追加する。
- [x] focused unit test を通す。

### Phase 2: Accessible field action (RED → GREEN)

- [x] native button の名前・48px領域・同一 callback・action なし時の非表示を jsdom テストで固定する。
- [x] `ContextActionButton` と optional `FieldHud.action` を追加する。
- [x] 既存ミニマップ DOM とセレクターが不変であることをレビューする。

### Checkpoint: Component contract

- [x] `pnpm exec vitest run tests/unit/contextAction.test.ts tests/unit/fieldUi.test.tsx`
- [x] `pnpm check:architecture`

### Phase 3: Browser contract and verification

- [x] 統合後に keyboard / button parity、ロック中の非表示、320×540 / 960×540 の非重なりを検査する Playwright spec を追加する。
- [x] 可能な範囲で focused browser test と全品質ゲートを実行する。
- [ ] 差分を5軸レビューし、担当変更だけをコミットする。

## Risks and Mitigations

| Risk                                           | Impact | Mitigation                                                                    |
| ---------------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| 並行中の locomotion / Overworld 変更と競合する | 高     | Scene を編集せず、明示的な入力契約と統合メモだけを渡す                        |
| 既存の interaction 順序が変わる                | 高     | 現行 `interact()` の順序を unit test の期待値として固定する                   |
| ミニマップ変更を巻き込む                       | 高     | 既存DOMを移動せず、独立した sibling button と action 専用 CSS だけを追加する  |
| E2E が Scene 統合前には実行不能                | 中     | spec は統合契約として追加し、当ブランチでは unit / build と実行可否を明記する |

## Open Questions

なし。仕様と実装開始は承認済み。
