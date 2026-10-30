# pair-match 問題 renderer TODO

## Task 1: Contract-first TDD

- [x] schema、採点、左右列、裏向き、同列選び直しのテストを追加する
- [x] rendererAbort の共通ケースへ pair-match を追加する
- [x] focused tests が期待理由で失敗することを確認する

## Checkpoint: RED

- [x] 失敗原因が renderer 未実装である

## Task 2: Minimal renderer slice

- [x] payload schema と採点関数を実装する
- [x] Preact renderer を現行 abort 契約へ適合させる
- [x] registry、i18n、共有 CSS を最小更新する
- [x] focused tests と `pnpm check:fast` を成功させる

## Checkpoint: GREEN

- [x] 境界、アクセシビリティ、timer cleanup を確認する

## Task 3: Content authoring contract

- [x] 3問のサンプルを追加する
- [x] `pnpm gen:schemas` で pair-match schema を生成する
- [x] `pnpm validate:content` を成功させる

## Task 4: Browser path

- [x] Playground の pair-match E2E を追加する
- [x] Playwright focused test を成功させる
- [x] 960×540 のアプリ内ブラウザで最大ペア数、キーボード、console を確認する
- [x] プレビュー URL とスクリーンショットを Walkthrough に記録する

## Task 5: Full verification and handoff

- [x] related、fast、full gates を成功させる
- [x] five-axis review とテスト mutation を実施する
- [x] Graphify をコードのみで更新する
- [x] task docs を完了状態へ更新する
- [x] diff と secrets を確認して原子的コミットを作成する
- [x] branch、commit、検査、preview URL を報告する
