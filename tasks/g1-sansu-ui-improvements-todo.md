# 小学1年生の算数 UI 改善 Todo

## Task 1: 低学年算数の画面内テンキー

**Acceptance criteria:**

- [x] 小1〜小3算数の通常10進数回答だけにテンキーが出る
- [x] 0〜9、1文字戻す、全部消す、回答送信を画面だけで操作できる
- [x] 文字回答・高学年・物理キーボード・貼り付け・Enterが変わらない

**Verification:**

- [x] 関連Vitest
- [x] `questions.spec.ts` の代表フロー

**Dependencies:** None

## Task 2: 10のまとまりと1のばら

**Acceptance criteria:**

- [x] blocksの現在値を10のまとまりと1のばらで表示する
- [x] 23でまとまり2つ・ばら3つが視覚と代替説明で分かる
- [x] +10/+1/−と採点を維持する

**Verification:**

- [x] 関連Vitest
- [x] blocks代表E2E

**Dependencies:** None

## Task 3: 数直線の目盛り

**Acceptance criteria:**

- [x] 0〜10、step 1で11目盛りを表示する
- [x] 現在値の目盛りが文字と見た目で選択状態になる
- [x] 20step超では主要目盛りだけに間引く

**Verification:**

- [x] 関連Vitest
- [x] numberline代表E2E

**Dependencies:** None

## Checkpoint: Complete

- [x] `pnpm check:fast`
- [x] 開発用build
- [x] 960×540と狭幅の実ブラウザ確認
- [x] セルフレビュー
- [x] コミット
