# Implementation Plan: 学習ロードマップの通常表示と教科解放

## Overview

ロードマップ表示モデルから教科別の解放状態を純粋に導出し、通常モードだけに適用する。開発者モードは既存の教材確認機能を維持する。

## Architecture decisions

- 解放判定は `RoadmapNode[]` だけを入力にする純粋関数とし、保存データを増やさない。
- UI は判定済みの利用可能教科だけを描画する。非表示教科の単元も表示対象から除く。
- `Overworld` で既に保持している `devAll()` を `MenuOverlay` 経由で `RoadmapView` に渡す。

## Dependency graph

`RoadmapNode completion state` → `subject availability policy` → `RoadmapView subject/node filtering` → `Overworld developer-mode prop` → `browser verification`

## Task list

1. 解放ポリシーの失敗テストと純粋関数を追加する。
2. 通常/開発者モードの表示契約をコンポーネントテストで固定して実装する。
3. 実ブラウザで両モードを検証し、全品質ゲートを通す。

## Risks and mitigations

- 既存セーブで解放が反映されない: 保存フラグではなく現在のノード状態から導出する。
- 補助単元が永続的なロックになる: 必修単元だけを対象にする。
- 開発時の教材確認が難しくなる: 開発者モードでは全教科とフィルタを維持する。

## Open questions

None.
