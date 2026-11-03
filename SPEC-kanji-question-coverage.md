# Spec: kanji-question-coverage

## 目的と範囲

検証済みの `content/kanji/readings.json` だけを根拠として、小学校配当1026字の書き問題と、学年別最低数を満たす音読み・訓読み問題を生成する。問題不足、存在しない読み、書かない問題の書き分類への混入を自動監査し、後続のフォルダ再構成が明示タグだけで分類できる状態にする。

このモジュールでは問題生成、必要な単元追加、問題カバレッジ監査までを扱う。問題レビューのフォルダ表示、`要確認` の改名、四字熟語・対義語・類義語の整理は `kanji-folder-taxonomy` で行う。

## 問題数の契約

学年ごとの配当漢字数を `N` とし、検証済み問題だけで次を満たす。

| 学年 |    N | 書き | 音読み | 訓読み | 最低合計 |
| ---: | ---: | ---: | -----: | -----: | -------: |
|  1年 |   80 |   80 |     80 |     80 |      240 |
|  2年 |  160 |  160 |    160 |    160 |      480 |
|  3年 |  200 |  200 |    200 |    200 |      600 |
|  4年 |  202 |  202 |    202 |    202 |      606 |
|  5年 |  193 |  193 |    193 |    193 |      579 |
|  6年 |  191 |  191 |    191 |    191 |      573 |
| 合計 | 1026 | 1026 |   1026 |   1026 |     3078 |

- 書きは配当漢字ごとにちょうど1問あり、実際に文字を書く `kanji-trace` の `trace` モードとする。
- 音読み・訓読みは各学年 `N` 問以上とし、正規データにある読みだけを正解にする。
- 音読みまたは訓読みを持たない個別漢字に、そのカテゴリの問題を作らない。
- 既存の漢字問題は削除しないため、レビュー画面の総数は上表を超えてよい。上表は正規問題群だけで保証する。

## 問題形式

### 書き

- `type`: `kanji-trace`
- `payload.mode`: `trace`
- `payload.kanji`: 対象漢字1字
- `payload.reading`: 最初の訓読み、訓読みがなければ最初の音読みを平仮名へ変換したもの
- `payload.hintWord`: 対象漢字1字に読みを付けた RubyText。語全体の読みを推測しない。
- `tags`: `kanji:writing`, `kanji:canonical`

既存の次の3問はIDと内容を維持し、該当漢字の正規書き問題として数える。

- `kokugo.g1.kanji-trace.0001`（山）
- `kokugo.g1.kanji-trace.0002`（石）
- `kokugo.g2.kanji-trace.0001`（風）

生成処理は上記3字を重複生成せず、既存問題へ `kanji:writing` と `kanji:canonical` を付ける。

### 音読み・訓読み

- 既存の `choice` 形式を使い、問題契約やレンダラーを変更しない。
- 設問は「この漢字の音読み（訓読み）の一つはどれ？」とし、複数の正しい読みを持つ漢字でも一つを選ぶ問題だと明示する。
- 正解と選択肢は低学年でも読める平仮名に統一し、音読みの片仮名は機械的に平仮名へ変換する。
- 選択肢は4件で重複なし。対象漢字が持つ別の正しい読みを誤答に使わない。
- 誤答は同学年・同カテゴリの別漢字の正しい読みから、再現可能な順序で選ぶ。
- `tags` は音読みが `kanji:reading:on`, `kanji:canonical`、訓読みが `kanji:reading:kun`, `kanji:canonical` とする。

## 読み問題の選定規則

1. 同学年の正規データを配当表順に走査し、該当カテゴリを持つ各漢字から最初の読みを1問ずつ採用する。
2. 同じ順序で、未採用の別読みを追加する。
3. それでも `N` 問に足りない場合は、既に採用した正しい読みを復習問題として再利用し、誤答の組合せを変える。
4. 同一の `漢字・カテゴリ・正解・選択肢集合` は重複させない。
5. 正規データの用例は出典確認と将来の教材レビューに使うが、語全体の読みが公式表にないため、今回の問題文へは推測して埋め込まない。

この規則により、訓読みの総数が配当字数より少ない5年なども、架空の読みや不正確な熟語読みを使わず最低数を満たす。

## ID・単元・ファイル規則

- 書きID: `kokugo.g{grade}.kanji-writing.{NNNN}`。番号は配当表の位置に対応させる。維持対象の既存3問は旧IDのままとする。
- 音読みID: `kokugo.g{grade}.kanji-onyomi.{NNNN}`
- 訓読みID: `kokugo.g{grade}.kanji-kunyomi.{NNNN}`
- 単元ID: 全学年で `kokugo.g{grade}.kanji`
- 1・2年は既存単元を使用する。3〜6年は同じ命名の正規漢字単元を `content/units.json` に追加し、文部科学省の出典IDと人間レビュー未実施の状態を記録する。
- 生成先:
  - `content/questions/kokugo/g{grade}/kanji-writing/set-NNN.json`
  - `content/questions/kokugo/g{grade}/kanji-onyomi/set-NNN.json`
  - `content/questions/kokugo/g{grade}/kanji-kunyomi/set-NNN.json`
- 1ファイル30問以下とし、既存の `scripts/question-layout.ts` と同じ分割規則を使う。
- 生成順、ID、選択肢は毎回同じになり、再生成で不要な差分を作らない。
- 生成処理が削除・上書きできるのは上記3種類の生成専用ディレクトリだけとする。既存の legacy 問題や他単元を変更しない。

## 技術構成と変更場所

既存の Node.js、TypeScript、JSON、Vitest、問題契約、`choice` と `kanji-trace` レンダラーを使用する。新しい依存は追加しない。

- `scripts/generate-kanji-questions.ts`: 正規データから問題と30問セットを再現可能に生成
- `scripts/audit-kanji-question-coverage.ts`: 件数、漢字網羅、音訓、タグ、選択肢、ID、単元を監査
- `tests/unit/kanjiQuestionGeneration.test.ts`: 生成ロジックと全学年カバレッジの回帰テスト
- `content/questions/kokugo/g1..g6/kanji-*`: 生成問題
- `content/questions/kokugo/g1/kanji-trace.json`, `g2/kanji-trace.json`: 既存3問への明示タグ追加
- `content/units.json`: 3〜6年の正規漢字単元
- `package.json`: `gen:kanji-questions` と `audit:kanji-questions`

`src/questions/contracts.ts`、問題レンダラー、ゲームの採点、既存問題IDは変更しない。

## 生成・検証コマンド

- 問題生成: `pnpm gen:kanji-questions`
- カバレッジ監査: `pnpm audit:kanji-questions`
- 関連テスト: `pnpm test:related scripts/generate-kanji-questions.ts scripts/audit-kanji-question-coverage.ts tests/unit/kanjiQuestionGeneration.test.ts`
- コンテンツ検証: `pnpm validate:content`
- 日常検査: `pnpm check:fast`
- 回帰検査: `pnpm test:fast`
- ビルド: `pnpm build`
- 開発プレビュー: `pnpm nrd`

`audit:kanji-questions` は通常の `validate:content` に統合し、正規問題の欠落、余分な書き問題、誤った音訓タグ、30問超過を将来の変更でも失敗させる。

## テスト方針と完了条件

- 生成ロジックは失敗テストから実装し、同じ入力で同じ問題ID・順序・選択肢を返す。
- 全1026字に書き問題がちょうど1問あり、文字を書かない問題が正規書き問題へ含まれない。
- 各学年の音読み・訓読みがそれぞれ配当字数以上あり、全正解が正規データの該当カテゴリに存在する。
- 音か訓を持たない代表例として、`王`の訓読み、`貝`と`畑`の音読み問題が生成されない。
- 選択肢は4件で一意、正解を含み、対象漢字の別の正しい読みを誤答に含めない。
- 全問題に正しい学年、単元、タグがあり、IDが一意で、各セットは30問以下である。
- `pnpm gen:kanji-questions` を2回実行しても2回目に差分が出ない。
- `pnpm audit:kanji-questions`、関連テスト、`pnpm validate:content`、`pnpm check:fast`、`pnpm test:fast`、`pnpm build` が通る。
- 実ブラウザの新しい Playground ページで、1年と、復習補充が必要な5年を含む各学年の書き・音読み・訓読みを少なくとも1問ずつ表示・回答できる。

## 境界

- 常に: 検証済み正規データだけを入力にし、生成先を許可リストで限定し、生成前後の問題数とIDを検証する。
- 事前確認: `src/questions/contracts.ts`、問題レンダラー、既存問題ID、ゲームの単元進行、正規データの音訓変更。
- 禁止: 問題数を満たすための架空の読み、語全体の読みの推測、既存 legacy 問題の削除、manifest・schema の直接編集。

## 後続モジュールへの受け渡し

`kanji-folder-taxonomy` は、正規問題の明示タグを最優先に使って音読み・訓読み・書きを分類する。既存問題は削除せず、明示タグを付けられないものだけ既存ヒューリスティックまたは「その他」へ送る。

## 未決事項

なし。四字熟語、対義語・類義語、既存読み問題の再分類は `kanji-folder-taxonomy` で定める。
