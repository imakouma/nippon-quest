# kanji-question-coverage Tasks

## Task 1: 問題生成契約の失敗テスト

**Description:** 正規漢字データから生成する書き・音読み・訓読み問題の純粋な出力契約を、実装前の失敗テストで固定する。ファイル書込はまだ行わない。

**Acceptance criteria:**

- [ ] 書き問題の漢字・学年・単元・タグと、読み問題の正解・4選択肢・タグを具体的に検査する。
- [ ] 同じ入力は同じID・順序・選択肢を返し、対象漢字の別の正しい読みを誤答に含めない。
- [ ] `王`の訓読み、`貝`と`畑`の音読みを生成せず、読み不足は正しい読みの復習問題だけで補う。

**Verification:**

- [ ] 追加テストが実装前に意図した理由で失敗する。
- [ ] `pnpm exec vitest run tests/unit/kanjiQuestionGeneration.test.ts`

**Dependencies:** None

**Files likely touched:**

- `tests/unit/kanjiQuestionGeneration.test.ts`
- `scripts/generate-kanji-questions.ts`

**Estimated scope:** Medium

## Task 2: 正規漢字単元と既存書き問題のタグ

**Description:** 3〜6年に正規漢字単元を追加し、既存の1・2年書き問題3問をID・内容を変えず正規問題として明示する。

**Acceptance criteria:**

- [ ] `kokugo.g3.kanji` から `kokugo.g6.kanji` が正しい学年・出典・レビュー状態で存在する。
- [ ] 既存3問のID、漢字、問題形式が変わらず、`kanji:writing` と `kanji:canonical` が付く。
- [ ] legacy単元、問題レンダラー、共有問題契約を変更しない。

**Verification:**

- [ ] `pnpm test:related content/units.json content/questions/kokugo/g1/kanji-trace.json content/questions/kokugo/g2/kanji-trace.json`
- [ ] `pnpm validate:content`

**Dependencies:** Task 1

**Files likely touched:**

- `content/units.json`
- `content/questions/kokugo/g1/kanji-trace.json`
- `content/questions/kokugo/g2/kanji-trace.json`
- `tests/unit/kanjiQuestionGeneration.test.ts`

**Estimated scope:** Medium

## Checkpoint: Foundation

- [ ] 既存書き問題3問の互換性を維持する。
- [ ] 3〜6年の正規漢字単元がコンテンツ検証を通る。
- [ ] 生成契約の単体テストが通る。

## Task 3: 全1026字の書き問題生成

**Description:** 既存3問を除く1023字の `kanji-trace` 問題を、配当表順の安定IDと30問セットで生成する。生成先以外を変更しない安全な書込境界を含める。

**Acceptance criteria:**

- [ ] 既存3問と生成問題を合わせ、全1026字に書き問題がちょうど1問ある。
- [ ] 全問題が `trace` モードで `kanji:writing` と `kanji:canonical` を持つ。
- [ ] 生成ファイルは30問以下で、IDと順序が再生成しても変わらない。

**Verification:**

- [ ] `pnpm gen:kanji-questions -- --category writing`
- [ ] `pnpm exec vitest run tests/unit/kanjiQuestionGeneration.test.ts`
- [ ] `pnpm validate:content`

**Dependencies:** Task 2

**Files likely touched:**

- `scripts/generate-kanji-questions.ts`
- `content/questions/kokugo/g1..g6/kanji-writing/set-NNN.json`（機械生成）
- `tests/unit/kanjiQuestionGeneration.test.ts`
- `package.json`

**Estimated scope:** Medium plus generated data

## Task 4: 全学年の音読み問題生成

**Description:** 各学年の配当字数以上の音読み選択問題を生成する。複数音読みと音読みを持たない漢字を正しく扱う。

**Acceptance criteria:**

- [ ] 各学年の音読み問題が配当字数以上あり、全正解が正規データの音読みに存在する。
- [ ] 選択肢は平仮名4件で一意、対象漢字の別の正しい音読みを誤答にしない。
- [ ] `貝`と`畑`の音読み問題を生成しない。

**Verification:**

- [ ] `pnpm gen:kanji-questions -- --category onyomi`
- [ ] `pnpm exec vitest run tests/unit/kanjiQuestionGeneration.test.ts`
- [ ] `pnpm validate:content`

**Dependencies:** Task 3

**Files likely touched:**

- `scripts/generate-kanji-questions.ts`
- `content/questions/kokugo/g1..g6/kanji-onyomi/set-NNN.json`（機械生成）
- `tests/unit/kanjiQuestionGeneration.test.ts`

**Estimated scope:** Medium plus generated data

## Task 5: 全学年の訓読み問題と復習補充

**Description:** 各学年の配当字数以上の訓読み問題を生成し、5年など読み数が不足する学年は正しい既存読みを異なる誤答集合で復習する問題として補う。

**Acceptance criteria:**

- [ ] 各学年の訓読み問題が配当字数以上あり、全正解が正規データの訓読みに存在する。
- [ ] `王`の訓読み問題を生成せず、架空の読みや推測した熟語読みを含まない。
- [ ] 同一の漢字・正解・選択肢集合が重複せず、再生成しても同じ内容になる。

**Verification:**

- [ ] `pnpm gen:kanji-questions -- --category kunyomi`
- [ ] `pnpm exec vitest run tests/unit/kanjiQuestionGeneration.test.ts`
- [ ] `pnpm validate:content`
- [ ] 生成を再実行し、2回目に生成物の差分がない。

**Dependencies:** Task 4

**Files likely touched:**

- `scripts/generate-kanji-questions.ts`
- `content/questions/kokugo/g1..g6/kanji-kunyomi/set-NNN.json`（機械生成）
- `tests/unit/kanjiQuestionGeneration.test.ts`

**Estimated scope:** Medium plus generated data

## Checkpoint: Coverage

- [ ] 書き1026問、音読み1026問以上、訓読み1026問以上が正規問題として存在する。
- [ ] 全セットが30問以下で、ID・単元・タグ・正解が有効である。
- [ ] 2回目の生成で差分が出ない。

## Task 6: カバレッジ監査とコンテンツ検証の統合

**Description:** 生成処理とは独立した監査で、全件数、漢字網羅、音訓正解、選択肢、タグ、ID、単元、セット上限を検証し、通常のコンテンツ検証へ組み込む。

**Acceptance criteria:**

- [ ] `pnpm audit:kanji-questions` が学年別カテゴリ件数を表示し、不足・誤答・重複・誤タグで非0終了する。
- [ ] `pnpm validate:content` が漢字問題監査を含み、新しい外部依存やネットワーク通信を追加しない。
- [ ] 監査は生成関数の結果を信用せず、保存済み問題JSONを読み直して検証する。

**Verification:**

- [ ] `pnpm audit:kanji-questions`
- [ ] `pnpm test:related scripts/generate-kanji-questions.ts scripts/audit-kanji-question-coverage.ts tests/unit/kanjiQuestionGeneration.test.ts`
- [ ] `pnpm validate:content`

**Dependencies:** Task 5

**Files likely touched:**

- `scripts/audit-kanji-question-coverage.ts`
- `tests/unit/kanjiQuestionGeneration.test.ts`
- `package.json`

**Estimated scope:** Medium

## Task 7: 全体検査と新しいPlayground確認

**Description:** 全品質ゲートを実行し、最新版サーバーを再起動する。旧確認ビューではなく新しいPlaygroundページで各学年の書き・音読み・訓読みを表示・回答する。

**Acceptance criteria:**

- [ ] 承認済み仕様の全条件を満たし、レビューで必須修正が残っていない。
- [ ] 1〜6年の各カテゴリから代表問題を開き、表示・回答・採点が正常に動く。
- [ ] 最新の作業用プレビューを4175番ポートで開き、人間の教材レビュー待ちを完了報告に残す。

**Verification:**

- [ ] `pnpm audit:kanji-canonical`
- [ ] `pnpm audit:kanji-questions`
- [ ] `pnpm validate:content`
- [ ] `pnpm check:fast`
- [ ] `pnpm test:fast`
- [ ] `pnpm build`
- [ ] 新しい `playground.html?q=<代表問題ID>` で実ブラウザ確認
- [ ] `git diff --check`

**Dependencies:** Task 6

**Files likely touched:** None

**Estimated scope:** Medium

## Checkpoint: Complete

- [ ] 全タスクの受け入れ条件を満たす。
- [ ] Definition of Done の Correctness、Quality、Integration、Documentation を満たす。
- [ ] 実装コミットID、問題件数、検証結果、プレビューURLを記録する。
- [ ] `kanji-folder-taxonomy` の仕様作成を開始できる。
