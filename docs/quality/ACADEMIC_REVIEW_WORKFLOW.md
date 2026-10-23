# 教材の学術レビュー手順

## 目的

この手順は、問題 JSON の構造検査とは別に、設問・正解・解説・図版の学術的正確性を人間が確認し、その根拠を `content/quality/academic-reviews.json` に残すためのものです。コマンドや AI は承認を代行しません。

2026-10-22 時点では、本番問題 81 ファイル・4,829 問に有効な承認記録はありません。まず 10 問以下の 39 ファイル・226 問を小規模パイロットとして確認し、その後に通常ファイル、最後に大容量の legacy ファイルへ進みます。

## 1. キューを最新化する

```bash
pnpm audit:academic-review
```

`imports/academic-review-queue.json` に次を出力します。

- `nextBatch`: 変化する事実、視覚問題、ファイルサイズを加味したリスク優先の5件
- `pilotBatch`: 10問以下から始める運用確認用の5件
- `questionIds`: そのファイルで確認すべき全問題ID
- `changingFactQuestionIds`: 統計・制度・順位など、最新の一次資料が必要な可能性がある問題ID
- `visualQuestionIds`: 地図・画像・絵と語の対応も確認する問題ID
- `invalidReviewReasons`: 内容変更、期限切れ、出典不備などで未承認へ戻った理由

`changingFactQuestionIds` は機械的な候補です。候補に入ったこと自体は誤りを意味せず、候補外の正確性も保証しません。

## 2. 人間が内容を確認する

1. `pnpm dev:hmr` で Question Playground を起動する。
2. キューの `questionIds` を1件ずつ開き、設問、正解、解説、学年、単元、選択肢、画像・地図の対応を確認する。
3. 学習指導要領との対応だけでなく、個々の事実を支える一次資料を確認する。
4. 人口、生産量、順位、制度、現在の地名など変化し得る事実は、確認日現在の行政機関・公的統計・公式資料を使う。
5. ファイル単位で全問を確認する。東北タグなど一部だけ確認して、ファイル全体を承認してはいけない。

`content/quality/academic-reviews.json` の `sources` に根拠がなければ、先に出典を追加してレビューを受けます。検索結果、まとめサイト、AIの回答は一次資料として登録しません。

## 3. 記録をプレビューする

```bash
pnpm academic-review:record -- \
  --file questions/rika/g6/combustion-quality.json \
  --reviewer "確認者名" \
  --date 2026-10-22 \
  --source mext-elementary-curriculum-2017 \
  --note "全5問の設問・正解・解説を確認"
```

この段階では台帳を書き換えません。表示されたファイル、SHA-256、担当者、日付、出典を確認します。

## 4. 明示的に記録する

同じコマンドへ `--apply` を追加します。

```bash
pnpm academic-review:record -- \
  --file questions/rika/g6/combustion-quality.json \
  --reviewer "確認者名" \
  --date 2026-10-22 \
  --source mext-elementary-curriculum-2017 \
  --note "全5問の設問・正解・解説を確認" \
  --apply
```

記録コマンドは次を検証します。

- 対象が現行 `content/manifest.json` にある問題ファイルか
- `_samples` ではない本番問題ファイルか
- 出典IDが台帳に登録済みか
- レビュー日と出典確認日が未来日・期限切れではないか
- 選択した出典が対象ファイルの全教科を扱っているか
- 日付と台帳項目が schema に合うか
- 同じファイルの承認が重複していないか
- 対象問題が現行の問題契約に合うか

SHA-256 は現行ファイルから自動計算します。レビュー前に計算した値を手入力しません。

期限切れや内容変更後の再レビューでは、同じ手順で全問を確認し直し、まず `--replace` を付けたプレビューを確認します。問題がなければ `--replace --apply` で既存記録を1件の新しい記録へ置き換えます。`--replace` なしで既存記録を上書きすることはできません。

## 5. 再監査する

```bash
pnpm audit:academic-review
pnpm validate:content
pnpm audit:academic-review:strict
```

- 通常監査はキューを更新する。
- content 検証は、存在しないファイル、重複承認、内容変更、不明な出典をエラーにする。
- strict 監査は未承認が1件でもあれば失敗する。81ファイルの人間レビューが終わるまでは失敗が正しい。
- 承認後にファイル内容が変わった場合、SHA-256 が一致しないため自動的に未承認へ戻る。
- レビューまたは出典の確認期限が切れた場合も、有効な承認数から外れて再レビュー対象になる。

承認台帳の変更は教材変更と同じ PR でレビューし、担当者、確認日、出典、対象ファイルの4点を差分で確認します。
