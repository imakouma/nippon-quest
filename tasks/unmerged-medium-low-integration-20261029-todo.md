# 未採用の中・低優先度機能の統合

## Task 1: 学年別問題bundle

**Acceptance criteria:**

- [x] 選択学年のbundleに、その学年以下の復習問題を含む。
- [x] 英語問題は小1・小2に含めず、小3以降に含む。

**Verification:** `pnpm test:related scripts/gen-manifest.ts tests/unit/questions.test.ts`

## Task 2: 入力と長文レイアウトの回帰修正

**Acceptance criteria:**

- [x] 仮想スティック内のtouchstartがwindowの移動入力へ伝播しない。
- [x] 長い問題は問題枠全体を縦スクロールして操作できる。

**Verification:** 関連unit、Playwrightの仮想スティック・問題監査、`pnpm check:fast`

## Checkpoint: 基本回帰

- [x] Task 1〜2の関連テストが通る。
- [x] 各変更を独立コミットにする。

## Task 3: 小学1年国語の初期技

**Acceptance criteria:**

- [x] 新規ゲームが算数1技と国語4技を持つ。
- [x] v13以前のセーブへ不足技だけを一度追加する。
- [x] 4つの国語技が対応単元だけを参照する。
- [x] 小1教材の未習漢字がRubyTextで学年に応じて表示される。

**Verification:** state・content・ruby関連テスト、`pnpm validate:content`

## Task 4: 装備セット進捗UI

**Acceptance criteria:**

- [x] 未完成セットは装備数を表示する。
- [x] 完成セットは完成表示と効果説明を表示する。
- [x] 戦闘の既存セット効果と同じセット定義を参照する。

**Verification:** 装備セット単体テスト、バッグ関連E2E、実ブラウザ確認

## Checkpoint: ゲーム内機能

- [x] Task 3〜4の関連テストが通る。
- [x] 各変更を独立コミットにする。

## Task 5: 国語問題レビュー手順

**Acceptance criteria:**

- [x] 現行国語問題をUTF-8 CSVへ書き出せる。
- [x] `反映可` 行だけをdry-runし、`--write`時だけ書き込む。
- [x] 書き出し後に元問題が変わった場合は適用を拒否する。
- [x] 管理ID・正解・選択肢IDを壊さない。

**Verification:** レビュー単体テスト、export/apply dry-run、`pnpm validate:content`

## Final Checkpoint

- [ ] `pnpm lint`
- [ ] `pnpm check:architecture`
- [ ] `pnpm test`
- [ ] `pnpm validate:content`
- [ ] `pnpm build`
- [ ] 最新previewを4175以降で起動してUIを確認する。
- [ ] 差分を5軸レビューし、作業ツリーをcleanにする。
