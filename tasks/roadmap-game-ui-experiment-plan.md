# Implementation Plan: 分岐・合流型の学習スキルツリー

## Overview

既存の学習ロードマップを、横並びの単元一覧から、下の基礎単元が上の発展単元へ分岐・合流するゲーム型スキルツリーへ変更する。複数前提は実際のAND解放条件として扱い、ロック中でも達成数と未達条件を確認できるようにする。

最初の確認版は、既存の実前提データと小学1年の補強データを使ってUIを完成させる。全学年・全教科の前提データ整備は、見た目と操作が承認された後の教材作業として段階展開する。見た目だけの接続線は作らない。

## Baseline Evidence

- `RoadmapNode.prerequisiteIds` と `buildRoadmapNodes` は、複数前提をすべて満たすAND解放に対応済み。
- 現在の監査結果は、算数90単元中12線、国語87単元中2線、生活・理科・社会・英語は0線。
- 孤立単元は算数77、国語84、生活12、理科51、社会28、英語12で、合計264単元。
- 現在のUIは136px幅のノードと常時ラベルが主役で、密度のある分岐・合流を表示しにくい。
- Graphifyでは、`buildRoadmapNodes` → `RoadmapNode` → `RoadmapView` → `RoadmapGraph` が主要な変更経路。保存形式や問題エンジンへの変更は不要。

## Architecture Decisions

- `prerequisiteIds` を解放条件の唯一の正とし、schemaと保存形式は変更しない。
- レイアウト計算を純粋関数へ分離し、階層DAGを下から上へ配置する。外部レイアウト依存は追加しない。
- 同じ階層内は、親ノードの重心を使った安定ソートで交差を減らす。完全な交差ゼロを保証するための複雑な最適化は入れない。
- 通常ノードは48px以上の操作領域を持つ円形オーブにし、長い名称は現在地・選択中・フォーカス中と詳細パネルへ限定する。
- `frontier` ノードは選択可能にするが開始不可とし、達成済み前提数、総数、未達前提を詳細パネルに表示する。隠れた遠方単元名は公開しない。
- 線は実前提関係だけを描画する。達成済み、選択経路、未達を色・明度・記号で区別し、点線や曲線に依存しない。
- 学年・学期フィルタ時も、対象単元へ直接つながる前提コンテキストを残し、線だけが消えないようにする。
- 教材関係は一次資料と既存source metadataに基づき、`draft` / `source-checked` / `expert-reviewed` の意味を変えない。

## Dependency Graph

`content/curriculum/*.json` の前提関係
→ `curriculumGraph`
→ `buildRoadmapNodes` のAND解放・可視性
→ 純粋レイアウト
→ `RoadmapView` の表示対象
→ `RoadmapGraph` のオーブ・線・条件パネル
→ CSS / i18n
→ Unit / E2E / 実画面QA

## Task List

### Phase 1: Regression contract and layout foundation

- [ ] Task 1: 下→上の分岐・合流と3前提AND条件の失敗テストを追加する。
- [ ] Task 2: 決定論的な階層レイアウトを純粋関数へ分離し、下→上配置と重心ソートを実装する。

### Checkpoint: Graph foundation

- [ ] 2本の枝が1つの単元へ合流し、3前提のうち1つでも未達ならロックされる。
- [ ] 同じ入力は同じ座標を返し、親は子より下に配置される。
- [ ] `pnpm vitest run tests/unit/roadmap.test.ts` が通る。

### Phase 2: Complete vertical UI slice

- [ ] Task 3: ロックされた前線ノードを選択可能にし、条件達成数と未達前提を詳細表示する。
- [ ] Task 4: ノードを円形オーブ中心へ変更し、縦の主幹・分岐・合流を視覚化する。
- [ ] Task 5: 学年・学期フィルタで直接前提コンテキストを残し、選択・ズーム・パンを維持する。

### Checkpoint: Skill-tree interaction

- [ ] 現在地、開放済み、選択中、前線、遠方を色以外でも区別できる。
- [ ] ロック単元に `1 / 3 クリア` と未達条件が表示され、開始ボタンは出ない。
- [ ] 100%と20%で現在地から次の候補まで経路を追える。
- [ ] 960×540、640×540、タッチ操作で重なりや操作不能がない。

### Phase 3: First playable curriculum slice

- [ ] Task 6: 小学1年の国語・算数に、一次資料に基づく分岐と合流を追加する。
- [ ] Task 7: 小学1〜2年の生活・補助英語に、適用可能な前提関係を追加する。
- [ ] Task 8: 学年を限定できるロードマップ監査を追加し、最初の確認範囲に孤立・循環・逆向き線がないことを固定する。

### Checkpoint: First playable slice

- [ ] 初期プレイヤーが選べる教科で、現在地周辺に分岐または合流が見える。
- [ ] 複数前提の表示と実際の解放判定が一致する。
- [ ] 教材出典とレビュー状態が検証を通る。
- [ ] UIの方向性を実画面でレビューし、全学年展開へ進むか判断できる。

### Phase 4: Verification and reversible handoff

- [ ] Task 9: focused test、E2E、必須検査、実画面の視覚QAを実行する。
- [ ] Task 10: Walkthrough、Graphify更新、独立コミット、4174の最新版プレビューを残す。

### Checkpoint: Complete

- [ ] `pnpm lint`
- [ ] `pnpm check:architecture`
- [ ] `pnpm test`
- [ ] `pnpm validate:content`
- [ ] `pnpm validate:curriculum-graph`
- [ ] `pnpm build`
- [ ] `pnpm exec playwright test tests/e2e/progress.spec.ts`
- [ ] 添付画像の構造的特徴とReference lockを使った視覚QAでP0〜P2が残っていない。

## Likely File Ownership by Task

| Task | Files likely touched                                                                                               | Scope         |
| ---- | ------------------------------------------------------------------------------------------------------------------ | ------------- |
| 1    | `tests/unit/roadmap.test.ts`, `tests/unit/roadmapMenu.test.ts`                                                     | Small         |
| 2    | `src/scenes/overworld/roadmapLayout.ts`, `src/scenes/overworld/roadmap.ts`, `tests/unit/roadmap.test.ts`           | Medium        |
| 3    | `src/ui/field/RoadmapGraph.tsx`, `content/i18n/ja.json`, `tests/unit/roadmapMenu.test.ts`                          | Medium        |
| 4    | `src/ui/field/RoadmapGraph.tsx`, `src/ui/field/menu.css`, `tests/e2e/progress.spec.ts`                             | Medium        |
| 5    | `src/ui/field/RoadmapView.tsx`, `src/ui/field/RoadmapGraph.tsx`, `tests/unit/roadmapMenu.test.ts`                  | Medium        |
| 6    | 国語・算数の小学1年curriculum断片と対応テスト（最大5ファイルずつに分割）                                           | Medium slices |
| 7    | 生活・英語の低学年curriculum断片と対応テスト（最大5ファイルずつに分割）                                            | Medium slices |
| 8    | `src/core/learning/graphQuality.ts`, `scripts/audit-roadmap-graph.ts`, `tests/unit/curriculumGraphQuality.test.ts` | Medium        |
| 9    | テスト結果とスクリーンショットのみ                                                                                 | Small         |
| 10   | `docs/release/roadmap-game-ui-experiment-walkthrough.md`, `graphify-out/`                                          | Small         |

## Risks and Mitigations

| Risk                             | Impact | Mitigation                                                                       |
| -------------------------------- | ------ | -------------------------------------------------------------------------------- |
| 小さいオーブでタップしづらい     | High   | 見た目は小さくしても透明な操作領域は48px以上を維持し、キーボードフォーカスを残す |
| 複数線が交差して読めない         | High   | 階層配置＋重心ソート＋選択経路の強調で追いやすくし、実データで矩形・交差をQAする |
| フィルタで前提ノードが消える     | High   | 直接前提をコンテキスト表示し、フィルタ境界のテストを追加する                     |
| 未解放単元名を漏らす             | Medium | `hidden` は匿名、`frontier` は条件数を主に表示し、可視前提だけ名前を出す         |
| 教材関係を見た目のために捏造する | High   | 一次資料とrationaleを必須にし、UI用の偽線を禁止する                              |
| 全学年データ整備でUI確認が遅れる | High   | 小学1年の確認範囲を先に完成させ、承認後に学年単位で段階展開する                  |
| 既存セーブが変わる               | Low    | 保存形式とmasteryキーを変更せず、表示モデルだけを拡張する                        |

## Follow-up: Full curriculum rollout

最初の確認版が承認された後、国語・算数・理科・社会・生活・英語を学年単位の5ファイル以下のバッチに分ける。各バッチで出典確認、循環検査、孤立単元、分岐、合流を検証し、最終的に `pnpm audit:roadmap-graph --strict` を通す。教員確認前は `expert-reviewed` にしない。

## Open Questions

- この計画では、まず小学1年を含む確認範囲を完成させて画面をレビューし、その後に全学年の教材関係を展開する。全学年データの完成を待ってから初回表示する方式にはしない。
