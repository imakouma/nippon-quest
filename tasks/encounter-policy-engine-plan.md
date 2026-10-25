# Implementation Plan: Encounter Policy Engine

## Overview

既存 content 契約を変えず、出現表 adapter、決定論的 policy、`Overworld` の薄い統合の順に実装する。

## Architecture Decisions

- policy state は Scene が一時的に保持し、セーブ形式へ追加しない。
- 遷移 inhibit は全歩数、check interval と cooldown は遭遇可能タイル上の歩数だけを数える。
- pity は「3 回連続不発の次の check を強制成功」とし、通常確率や table weight は変更しない。
- 出現表の選択・解放候補の絞り込みは content adapter、確率と重み抽選は policy が担当する。
- 既存 `battle/setup.ts` の公開 helper は互換 export を保ち、責務だけを encounter module へ移す。

## Dependency Graph

`contentAdapter contract` → `policy contract/state machine` → `Overworld decision consumer` → `full verification`

## Task List

### Phase 1: Contract-first tests

- [x] Task 1: policy / adapter の契約テストを追加し、未実装で失敗することを確認する。

### Checkpoint: RED

- [x] focused test が期待理由で失敗する。

### Phase 2: Pure engine

- [x] Task 2: content adapter と pure policy を最小実装し、focused test を通す。

### Checkpoint: GREEN

- [x] 固定 seed、適格性、inhibit、cooldown、確率境界、pity、weight のテストが通る。

### Phase 3: Integration

- [x] Task 3: `Overworld` を decision consumer に変更し、旧 inline 判定を除去する。
- [x] Task 4: 回帰テスト、Graphify 更新、五軸レビュー、全検査、preview を完了する。

### Checkpoint: Complete

- [x] acceptance criteria と Definition of Done を満たす。
- [x] コミット済みで作業ツリーが clean。

## Risks and Mitigations

| Risk                       | Impact | Mitigation                                                               |
| -------------------------- | ------ | ------------------------------------------------------------------------ |
| 遭遇頻度が既存より変わる   | 中     | content の interval/rate/weight は維持し、安全歩数と有限 pity だけを追加 |
| 地域・地面 fallback の回帰 | 高     | 既存選択順を adapter テストで固定                                        |
| 既存 helper import の破壊  | 中     | `battle/setup.ts` から互換再 export                                      |
| Scene の状態同期漏れ       | 中     | map reset と battle decision 時だけ明示的に state を更新                 |

## Open Questions

なし。
