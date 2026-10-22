# Implementation Plan: 段階的に広がる学習スキルツリー

## Overview

承認済み `SPEC-learning-skill-tree.md` に従い、既存の単元ロードマップを、概念前提関係から導出した単元グラフへ置き換える。全ノードを配置しつつ、現在地から遠い領域は霧で隠し、学習に応じて段階開示する。

## Dependency Graph

単元グラフ純粋ロジック
→ 表示モデル契約
→ Scene接続
→ SVG接続線と霧ノードUI
→ ブラウザ検証・全体検査

## Architecture Decisions

- 表示単位は既存の `Unit` とし、概念グラフを単元へ集約する。
- 前提がない単元は従来の学年設定へフォールバックし、教材を消さない。
- 可視性と学習状態を分離し、遠方ノードの内容だけを隠す。
- 自動レイアウト依存は追加せず、決定論的な層配置を純粋関数で作る。
- 接続線は装飾SVG、ノードはネイティブbuttonとする。

## Task List

### Phase 1: Graph model

- [ ] Task 1: 単元グラフ集約・解放・霧可視性の失敗テストを追加する。
- [ ] Task 2: 表示モデルと純粋なレイアウト/状態計算を実装する。

### Checkpoint: Model

- [ ] focused test が成功する。
- [ ] 既存の前提なしロードマップ挙動が保たれる。

### Phase 2: UI slice

- [ ] Task 3: Sceneから概念状態とカリキュラムグラフを渡す。
- [ ] Task 4: 分岐線、霧ノード、状態凡例をRoadmapViewへ実装する。
- [ ] Task 5: 小画面・キーボード・タッチ向けCSSを仕上げる。

### Checkpoint: UI

- [ ] ビルドが成功する。
- [ ] 実ブラウザで段階開示と練習開始を確認する。

### Phase 3: Handoff

- [ ] Task 6: 学習エンジン仕様とWalkthroughを更新する。
- [ ] Task 7: 全標準検査、Graphify更新、コードレビュー、コミットを完了する。

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| 前提データが少なく分岐が少ない | 中 | データがない単元を消さず、学年フォールバックで配置する |
| 大規模グラフで線が密集する | 中 | 教科・学年フィルタを維持し、遠方は霧で情報密度を下げる |
| 既存セーブで概念状態が空 | 高 | masteryをフォールバックにし、schema変更をしない |
| SVGとボタン位置がずれる | 中 | 座標を同じ表示モデルから生成する |
| 別チャットの教材変更と競合 | 高 | 専用worktreeでUI/純粋ロジックだけを変更し、未コミット教材を取り込まない |

## Verification Commands

```bash
pnpm vitest run tests/unit/roadmap.test.ts
pnpm lint
pnpm check:architecture
pnpm test
pnpm validate:content
pnpm build
```

## Open Questions

なし。表示密度増加と段階開示は承認済み。
