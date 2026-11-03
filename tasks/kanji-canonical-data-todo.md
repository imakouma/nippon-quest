# kanji-canonical-data Tasks

## Task 1: 正規漢字データの検証契約

**Description:** 正規JSONを信頼せずに検証する純粋関数と単体テストを、失敗テストから実装する。1026字の実データを追加する前に、構造、学年、音訓、用例、出典の境界を固定する。

**Acceptance criteria:**

- [x] 重複漢字、不正学年、片仮名でない音読み、平仮名でない訓読み、音訓が両方空のレコードを具体的なエラーとして返す。
- [x] 用例が対象漢字を含まない、用例の読みが空、参照した `sourceIds` が未登録の場合を検出する。
- [x] 正しい最小フィクスチャはエラー0件になり、検証時に入力を暗黙修正しない。

**Verification:**

- [x] 追加テストが実装前に意図した理由で失敗する。
- [x] `pnpm test:related scripts/validate-kanji-canonical.ts tests/unit/kanjiCanonicalData.test.ts`
- [x] `pnpm exec prettier --check scripts/validate-kanji-canonical.ts tests/unit/kanjiCanonicalData.test.ts`

**Dependencies:** None

**Files likely touched:**

- `scripts/validate-kanji-canonical.ts`
- `tests/unit/kanjiCanonicalData.test.ts`

**Estimated scope:** Small

## Task 2: 一次資料と1026字の正規JSON

**Description:** 文部科学省の学年別漢字配当表と文化庁の常用漢字表を台帳へ登録し、文化庁の公式HTML表から音訓と用例を一度だけ抽出する。小学校配当文字だけを既存の学年順で正規JSONへ保存し、抽出用の外部通信を通常処理へ残さない。

**Acceptance criteria:**

- [x] 正規JSONは1026件の一意な漢字を持ち、学年別件数が80 / 160 / 200 / 202 / 193 / 191件である。
- [x] `content/i18n/kanji-grades.json` と文字集合・学年・順序が一致し、全音訓に根拠付き用例がある。
- [x] `王`は音読みあり・訓読みなし、`貝`と`畑`は訓読みあり・音読みなしで、推測した読みが含まれない。

**Verification:**

- [x] `pnpm test:related scripts/validate-kanji-canonical.ts tests/unit/kanjiCanonicalData.test.ts`
- [x] 学年別件数、音読みのみ、訓読みのみの件数を監査出力で確認する。
- [x] 抽出元URLと確認日が `content/quality/academic-reviews.json` に記録されている。

**Dependencies:** Task 1

**Files likely touched:**

- `content/curriculum/kanji-readings.json`
- `content/quality/academic-reviews.json`
- `tests/unit/kanjiCanonicalData.test.ts`

**Estimated scope:** Medium

## Checkpoint: Canonical data

- [x] 1026字と学年別件数が一致する。
- [x] 既存の学年別文字列との不一致が0件である。
- [x] 代表的な音訓欠如と用例が一次資料どおりである。
- [x] 外部通信を切った状態で関連テストが通る。

## Task 3: 監査コマンドとコンテンツ検証の統合

**Description:** 検証関数を実データ・既存学年データ・一次資料台帳へ接続するCLIにし、個別監査と通常のコンテンツ検証の両方から実行する。破損した正規データが将来のビルドを通らない状態にする。

**Acceptance criteria:**

- [x] `pnpm audit:kanji-canonical` が学年別件数を表示し、不正データがあれば非0で終了する。
- [x] `pnpm validate:content` が同じ監査を含み、外部ネットワークへ接続しない。
- [x] 既存の `validate:content` の検証内容と出力を失わず、新しい依存を追加しない。

**Verification:**

- [x] `pnpm audit:kanji-canonical`
- [x] `pnpm validate:content`
- [x] `pnpm test:related scripts/validate-kanji-canonical.ts tests/unit/kanjiCanonicalData.test.ts`

**Dependencies:** Task 2

**Files likely touched:**

- `scripts/validate-kanji-canonical.ts`
- `package.json`
- `tests/unit/kanjiCanonicalData.test.ts`

**Estimated scope:** Medium

## Task 4: 品質ゲートと差分レビュー

**Description:** 正規データ、検証、出典登録だけに差分が限定されていることを確認し、関連検査からビルドまでを通す。次の問題生成モジュールへ渡す前に、学術承認待ちと既知の制約を記録する。

**Acceptance criteria:**

- [ ] 承認済み仕様の完了条件をすべて満たし、共有問題契約・問題JSON・UI・生成物を変更していない。
- [ ] 正しさ、可読性、構造、安全性、性能のレビューで必須修正が残っていない。
- [ ] 人間の学術レビュー待ちであることと、後続モジュールが検証済みJSONだけを使うことが完了報告に記録される。

**Verification:**

- [ ] `pnpm audit:kanji-canonical`
- [ ] `pnpm test:related scripts/validate-kanji-canonical.ts tests/unit/kanjiCanonicalData.test.ts`
- [ ] `pnpm validate:content`
- [ ] `pnpm check:fast`
- [ ] `pnpm build`
- [ ] `git diff --check`

**Dependencies:** Task 3

**Files likely touched:** None

**Estimated scope:** Small

## Checkpoint: Complete

- [ ] 全タスクの受け入れ条件を満たす。
- [ ] Definition of Done の Correctness、Quality、Integration、Documentation を満たす。
- [ ] 実装コミットIDと検証結果を記録する。
- [ ] `kanji-question-coverage` の仕様作成を開始できる。
