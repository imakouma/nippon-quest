# Implementation Plan: 小学1〜6年 学習スキルツリー完成化

## Overview

既に実装済みの分岐表示、AND解放、霧、ズーム・パンを土台に、小学1〜6年の実教材へ根拠付き前提関係を入れ、一本道と大量の孤立単元を解消する。構造的完成と学術監修を混同せず、自動監査と監修状態を残す。

## Dependency Graph

複数ファイル統合検証と品質監査
→ 教科別の根拠付き prerequisite データ（並列）
→ 統合監査と関係の調整
→ 実グラフ向けレイアウト・つまずき表示
→ ブラウザ検証・全体検査・Walkthrough

## Architecture Decisions

- 表示単位と解放判定は既存の `Unit` のまま、概念関係を単元関係へ集約する。
- JSON schemaは変更せず、個別ファイルを構文検査した後、統合グラフで参照・循環を検査する。
- 教科内の前提だけをハードロックに使う。生活科から理科・社会などの教科横断関係は今回ハードロックしない。
- 正式課程を対象に、開始学年の根単元以外の孤立をなくす。補助教材は品質集計から分離する。
- 関係は文部科学省の平成29年告示の学習指導要領・解説を一次資料にし、根拠と確認状態をJSONへ残す。
- `source-checked` と教員による `expert-reviewed` を区別し、後者を自動生成しない。
- 外部レイアウト依存は追加せず、既存の決定論的配置を実グラフに合わせて改善する。
- Refero reference lockは、ユーザー添付の暗いゲームスキルツリー、既存のドット絵配色、48px以上の操作対象、段階的な霧を維持する。

## Task List

### Phase 0: Baseline and contract

- [x] Task 0.1: 分岐表示、AND解放、霧、ズーム・パンの既存実装を確認する。
- [x] Task 0.2: 304単元中281単元が孤立、合流0件である基準値を記録する。
- [x] Task 0.3: 完成条件と学術レビュー境界を仕様へ追加する。

### Phase 1: Global graph validation

- [x] Task 1.1: 複数ファイルを統合後に検証する失敗テストを追加する。
- [x] Task 1.2: fragment parse → merge → global validate の純粋関数を実装する。
- [x] Task 1.3: カタログと `validate-curriculum-graph` を共通統合関数へ接続する。
- [x] Task 1.4: 正式課程の孤立、重複線、逆学年線、分岐、合流、未監修数を出す監査を追加する。

### Checkpoint: Foundation

- [x] focused tests、`pnpm validate:curriculum-graph`、`pnpm check:architecture` が成功する。
- [x] 学年・ファイルをまたぐ関係の参照切れと循環を検出できる。

### Phase 2: Subject graphs in parallel

- [ ] Task 2A: 算数1〜6年の数と計算、図形、測定、データを分岐・合流させる。
- [ ] Task 2B: 国語1〜6年の文字・語彙、文法、読む、書く、話す・聞くを分岐・合流させる。
- [ ] Task 2C: 生活・理科・社会・英語の教科内グラフを作る。
- [ ] Task 2D: 各関係へ一次資料、根拠、`source-checked` または `draft` を記録する。

### Checkpoint: Curriculum

- [ ] 正式課程の孤立単元が開始根以外0件である。
- [ ] 各教科に分岐とAND合流が存在し、循環・重複・逆学年線が0件である。
- [ ] `pnpm validate:content` と教科別監査が成功する。

### Phase 3: Diagnosis and layout

- [ ] Task 3.1: ロック中単元に不足している前提単元を表示するテストとUIを追加する。
- [ ] Task 3.2: 実データで同一点・線重なりを測るレイアウトテストを追加する。
- [ ] Task 3.3: 層、枝レーン、合流位置を調整し、PCとスマホで追える配置にする。

### Checkpoint: UI

- [ ] 算数の代表ルートで「足し算＋引き算→応用」の合流が見える。
- [ ] ロック理由から復習すべき前提単元が分かる。
- [ ] 320/640/768/960px相当で操作列の横スクロール、文字切れ、ノード重なりがない。

### Phase 4: Integration and handoff

- [ ] Task 4.1: 教科別変更を統合し、競合とグラフ品質を再監査する。
- [ ] Task 4.2: lint、architecture、test、content、buildを通す。
- [ ] Task 4.3: 実ブラウザでPC、狭幅、ピンチ・トラックパッド相当、キーボード操作を確認する。
- [ ] Task 4.4: Graphifyを更新し、別エージェントの5軸コードレビューを通す。
- [ ] Task 4.5: スクリーンショット付きWalkthroughと学術監修待ち一覧を更新する。

## Risks and Mitigations

| Risk                                         | Impact | Mitigation                                                            |
| -------------------------------------------- | ------ | --------------------------------------------------------------------- |
| 公的資料が単元間の厳密な順序まで規定しない   | 高     | 明記された系統性を優先し、判断が残る線は `draft` として監修待ちにする |
| 関係を増やすために不自然なハードロックを作る | 高     | 教科内・弱い関係を避け、必須技能だけを prerequisite にする            |
| 大規模グラフで線が密集する                   | 中     | 教科・学年フィルタ、霧、枝レーン、合流位置の自動テストで抑える        |
| 既存セーブで概念状態が空                     | 高     | masteryをフォールバックにし、schema変更をしない                       |
| 並列変更が同じJSONへ衝突する                 | 高     | 教科別ブランチ・worktreeを分け、共通基盤確定後に編集対象を分離する    |
| 「構造検査済み」を「学術監修済み」と誤認する | 高     | source-checked と expert-reviewed をUI・文書で区別する                |

## Verification Commands

```bash
pnpm vitest run tests/unit/roadmap.test.ts
pnpm vitest run tests/unit/learning.test.ts tests/unit/curriculumGraphQuality.test.ts
pnpm lint
pnpm check:architecture
pnpm test
pnpm validate:content
pnpm build
```

## Open Questions

なし。ユーザーは計画策定後の並列実行を承認済み。schema・contracts・新規依存は変更しない。
