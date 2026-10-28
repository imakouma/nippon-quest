# Implementation Plan: 未採用の中・低優先度機能の統合

## Overview

本番基点 `imakouma/main` に未採用だった中・低優先度の変更を、元コミットの意図を保ちながら現行構造へ移植する。各機能は独立コミットにし、高優先度4件の専用チャットと競合しやすい共通契約や問題レンダラー登録は変更しない。

## Accepted Sources

- 学年別問題bundle: `3231cad8`、`ea601745`
- 小学1年国語の初期技と教材表記: `7860e3e5`、`2d4e58a7`、`94210b5a`、`b0bb71d4`
- 装備セット表示: `b2dec1bf`
- 仮想スティックのタッチ伝播修正: `8ed35f1a`
- 長い問題のスクロール: `51e241b6`
- 国語問題レビュー手順: `318cc81c`

## Capability Map

| Module id | Responsibility | Depends on |
| --- | --- | --- |
| `question-bundles` | 選択学年までの復習問題を配信し、英語は小3からにする | — |
| `input-layout-fixes` | 仮想スティックの二重入力と長文問題の到達不能を防ぐ | — |
| `g1-kokugo-skills` | 小1国語を単元別の初期技へ分け、既存セーブへ追加する | `question-bundles` |
| `equipment-set-ui` | 装備画面にセット進捗と完成効果を表示する | — |
| `kokugo-review-workflow` | 国語問題をCSVで人手確認し、安全に反映する | `g1-kokugo-skills` |

Build order: `question-bundles` → `input-layout-fixes` → `g1-kokugo-skills` → `equipment-set-ui` → `kokugo-review-workflow`

## Architecture Decisions

- 元コミットは直接マージせず、本番の schema v13・現行E2E・現行UIモデルへ適応する。
- `src/questions/contracts.ts` と生成schemaは変更しない。
- 既存セーブへの初期技追加は新しい一方向マイグレーションで行い、重複追加しない。
- 教材レビューCSVは生成物として現行教材から再出力し、元データのハッシュが一致する行だけ適用する。
- 新しい依存は追加しない。

## Verification Strategy

- 各バグ修正・振る舞い変更は、先に失敗する単体またはE2E契約を確認する。
- 各スライスで `pnpm test:related <files...>` と `pnpm check:fast` を使う。
- 全スライス後に `pnpm lint`、`pnpm check:architecture`、`pnpm test`、`pnpm validate:content`、`pnpm build` を実行する。
- UI変更は最新版previewを4175以降で起動し、アプリ内ブラウザで確認する。4174の正規統合previewは更新しない。

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| schema v13の既存移行と旧コミットのv11/v12が衝突する | 高 | 旧移行を上書きせずv13→v14として追加し、全旧version移行テストを維持する |
| 高優先度レンダラー統合と共通CSSが競合する | 中 | 共通CSS変更はスクロール2行に限定し、レンダラー登録へ触れない |
| CSV反映が問題IDや正解を壊す | 高 | ハッシュ、元ファイル、問題ID、選択肢ID、schemaを反映前に検証する |
| 古い教材文言をそのまま戻す | 中 | 最終状態のRubyText対応コミットを採用し、教材検証とRubyテストを通す |

## Open Questions

なし。優先度分類とこのチャットでの統合はユーザー承認済み。
