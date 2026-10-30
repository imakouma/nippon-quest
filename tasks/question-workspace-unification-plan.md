# Implementation Plan: 問題レビュー・編集ワークスペース統合

## Overview

`playground.html` を問題管理の唯一の画面にし、左の問題ライブラリで選んだ実問題の編集フォームとプレビューを右側へ常時表示する。既存の `EditorQuestionForm` だけを再利用し、JSONコード編集と旧 `editor.html`、それら専用の共同編集・共有コードを削除する。

## Architecture Decisions

- 問題の正は引き続き Playground の `json` 下書き状態とし、フォーム変更も同じ状態へ反映する。新しいストアは作らない。
- レビューと編集は同じ Preact `App` に常時表示し、選択問題と下書きを共有する。
- `?q=<id>` を唯一の直接入口に使い、編集専用のURL状態を持たない。
- JSONは内部表現のまま維持するが、編集用textarea・インポート・エクスポートは表示しない。
- `editor.html` はVite入力から外して物理ファイルも削除する。互換リダイレクトは作らない。
- 現在の白＋緑のPlaygroundデザインを唯一の見た目とし、フォームに必要な最小スタイルだけを移す。

## Dependency Graph

E2E契約 → Playgroundのフォームとプレビュー統合 → 旧エディタ入口削除 → 開発者メニューと文書更新 → 全体検査・実画面確認

## Task List

### Phase 1: Regression contract

- [x] Task 1: 選択問題を同一画面で編集できる失敗E2Eを追加する。

### Phase 2: Unified workspace

- [x] Task 2: Playground右側へフォーム編集とプレビューを同時表示する。
- [x] Task 3: JSONコード編集UIをPlaygroundから削除する。

### Checkpoint: Core flow

- [x] 実問題を選択すると編集フォームとプレビューが同時に表示され、IDと下書きを共有する。
- [x] 960pxと320pxで横スクロールや操作不能がない。

### Phase 3: Remove the split editor

- [x] Task 4: `editor.html` と専用アプリ／スタイルを削除し、Vite入力とE2Eを更新する。
- [x] Task 5: 未使用になった共同編集・URL共有・サンプル用コードとテストを削除する。
- [x] Task 6: ゲーム内の「問題一覧」「問題編集」を同じPlaygroundへ向ける。

### Checkpoint: Entry points

- [x] 開発者ビルドに `playground.html` だけがあり、`editor.html` はない。
- [x] ゲーム内の両導線が同じ白＋緑のワークスペースを開く。

### Phase 4: Documentation and verification

- [x] Task 7: architecture/spec/walkthroughと確認画像を統合後の仕様へ更新する。
- [x] Task 8: focused E2E、全品質ゲート、実ブラウザ確認、コードレビューを完了する。

## Risks and Mitigations

| Risk                                   | Impact | Mitigation                                                       |
| -------------------------------------- | ------ | ---------------------------------------------------------------- |
| フォーム変更が選択変更時に別問題へ残る | 高     | `q`変更時に実ファイルから下書きを初期化するE2Eを追加する         |
| 編集中に`q`が消える                    | 高     | URLは選択問題の`q`だけを更新し、E2Eで固定する                    |
| editor専用CSS削除でフォームが崩れる    | 中     | フォームが使うクラスだけPlaygroundへ移してから旧CSSを削除する    |
| 旧editor共有リンクが使えなくなる       | 中     | ユーザーの明示指示どおり削除し、文書とメニューから参照を全廃する |
| ブラウザ編集が永続保存と誤認される     | 中     | 編集欄に「確認用の下書き」であることを短く表示する               |

## Open Questions

None.

## Task List Target

Detailed acceptance criteria are tracked in `tasks/question-workspace-unification-todo.md`. The repository already has unrelated unchecked work in `tasks/plan.md` / `tasks/todo.md`, so this feature follows the repository's established feature-specific plan convention without overwriting them.
