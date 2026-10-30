# Spec: question-content-layout — 問題コンテンツの階層化

## Status

Approved by the user on 2026-10-29. Capability map module: `question-content-layout`.

## Objective

本番問題を `教科 / 学年 / 単元 / セット` の物理階層へ再配置し、人間とAIが必要な範囲だけを見つけて読める状態にする。

ゲーム実行時は、既存どおり全問題を `QuestionBank` へ平坦化して扱う。問題のID・JSON値・採点・習熟度・保存データの意味は変えない。後続の `question-browser-tree` が同じ階層をQuestion Playgroundへ表示できるよう、`content/manifest.json` に機械可読カタログを生成する。

## Current Baseline

2026-10-29時点の生成済み `content/manifest.json` を基準とする。

- 本番問題ファイル: 81
- 本番問題: 4,829問（ID重複なし）
- 単元: 309
- `subject` / `grade` / `unit` の不整合: 0問
- 単元コード形式違反: 0問
- 1ファイル100問超: 19ファイル
- 有効な学術承認記録: 0件（台帳の `reviews` 自体が0件）
- 30問上限へ正規化した場合の見込み: 323セット
- 30問を超える単元: 12単元（現在の最大は4セット）

この数値は移行時に再計測し、差があれば実データを正として移行レポートへ記録する。

## Users

- 問題作成者: 対象の教科・学年・単元だけを開いて編集できる。
- AIエージェント: 全4,829問を読み込まず、カタログから対象セットを選べる。
- 学術レビュー担当者: 30問以下のまとまりを単位に確認・承認できる。
- 開発者: 物理配置を意識せず、既存の `QuestionBank` と問い合わせ契約を使い続けられる。

## Target Layout

本番問題は次の規則へ統一する。

```text
content/questions/<subject>/g<grade>/<unit-slug>/set-<NNN>.json
```

例:

```text
content/questions/sansu/g1/tashizan/set-001.json
content/questions/kokugo/g5/legacy-jpn-5-kanji-2/set-004.json
```

### Path rules

1. `<subject>` は問題の `subject` と一致する。
2. `g<grade>` は問題の `grade` と一致する。
3. `<unit-slug>` は `unit` の `<subject>.g<grade>.` より後ろの部分と完全一致する。
4. セット番号は同一単元内で `set-001.json` から欠番なく付ける。
5. 各本番セットは1〜30問を含む。
6. 1ファイル内の全問題は同じ `subject`、`grade`、`unit` を持つ。
7. `content/questions/_samples/*.json` はレンダラー開発用として現状の配置と内容を維持し、本番レイアウト規則の対象外とする。

ファイル名へ旧ファイル名を引き継がない。単元フォルダが意味を持ち、セット名は単元内の分割順だけを表す。これにより同一単元の出自が複数ファイルに分かれていても、衝突のない一貫した構造にする。

## Migration Contract

### Authoritative grouping

移行元のパスではなく、各問題の検証済み `subject`、`grade`、`unit` を配置の正とする。不整合または不正な単元コードが1件でもあれば、書き込み前に移行を中止する。

各単元内の順序は、移行前の `manifest.questions` の順と各配列内の順を連結した順序を維持する。その順序で30問ずつ分割する。

### Value parity

移行前後で次を機械検証する。

- 問題総数が一致する。
- ID集合が一致し、重複がない。
- 各IDに対応する完全なJSON値が深い比較で一致する。
- 各単元内の問題順が一致する。
- 教科・学年・単元・タイプごとの件数が一致する。

許容する差は、ファイルパス、JSON整形、およびパス／ファイルハッシュに依存する生成物だけとする。質問本文、選択肢、正解、解説、タグ、画像・音声参照、時間制限などの問題値は変更しない。

### Repeatability and safety

移行ツールは次を満たす。

- 既定動作は読み取り専用の検査・差分プレビューとする。
- 明示的な書き込みオプションでのみ、ステージング先を検証後に本番ファイルを置換する。
- 途中失敗時に移行前ファイルを削除しない。
- 移行済み状態に再実行しても内容とパスが変わらない。
- 旧パスから新パスへの問題ID単位の対応、件数、ハッシュ、検証結果を機械可読レポートへ出す。
- 生成物やレポートへ問題の正解以外の秘密情報を追加しない。

## Academic Review Preservation

`content/quality/academic-reviews.json` の承認はファイルパスとSHA-256へ結び付くため、ファイル分割後へ自動転記してはならない。

- 移行前に有効・無効を含む全レビュー記録を検査する。
- 移動対象を参照するレビュー記録が1件でもあれば、移行は書き込み前に停止し、影響する旧ファイル、新セット、問題IDをレポートする。
- 人間の明示承認なしにレビュー記録を削除、複製、または `approved` として再作成しない。
- 現在はレビュー記録が0件なので、この停止条件には該当しない。
- 移行後に `imports/academic-review-queue.json` を再生成し、新しい30問以下のセット単位で未承認キューを作る。
- `docs/release/tohoku-academic-ledger.md` と監査は、18問の対象IDと「人間承認待ち」を保持したまま、新パス・新ハッシュ・新ファイル数へ更新する。

## Generated Question Catalog

`scripts/gen-manifest.ts` は既存の `questions`、`questionIndex`、`questionFilesByGrade` を維持し、次の省略可能な `questionCatalog` を `content/manifest.json` へ追加する。

```ts
interface QuestionCatalog {
  version: 1;
  maxQuestionsPerSet: 30;
  totalQuestions: number;
  subjects: Array<{
    subject: Subject;
    count: number;
    grades: Array<{
      grade: Grade;
      count: number;
      units: Array<{
        unit: string;
        slug: string;
        count: number;
        sets: Array<{
          file: string;
          count: number;
          types: string[];
        }>;
      }>;
    }>;
  }>;
}
```

カタログは本番問題だけを対象とし、教科は `Subject` の定義順、学年は昇順、単元とセットはパス順で決定論的に並べる。個別IDからファイルを探す用途は既存の `questionIndex` を使い、カタログへ全IDを重複格納しない。

`ContentManifest` のカタログ項目は移行期間の後方互換性のため省略可能にする。`QuestionBase`、レンダラーschema、保存形式は変更しない。

## Runtime Compatibility

- `QuestionBank` は生成済み問題ファイルを読み、既存どおりID・教科で平坦化する。
- `QuestionQuery`、フィルタ条件、弱単元比率、除外ID、タグfallback、採点は変更しない。
- `questionIndex` による `?q=<問題ID>` の直接表示を維持する。
- 学年別bundle、全問題bundle、開発時fetchの全経路で同じ問題集合を読む。
- セーブデータは問題IDと単元IDを参照し続けるため、移行を必要としない。

物理ファイル順が変わるため、移行前と同じseedが「同じ問題ID」を選ぶことまでは互換条件にしない。同一コンテンツ版を読むクライアント間の決定性、候補集合、選択比率は維持する。移行後の順序は生成manifestの決定論的パス順で安定させる。

## Required Capabilities

### 1. Layout validation

本番問題について、パスとメタデータの一致、1〜30問、単元単位、連番、重複ID、参照切れを一括検査できる。

### 2. Dry-run migration

書き込み前に、新規・変更・削除予定ファイル、問題数、単元数、レビュー影響、値の不一致を表示できる。

### 3. Atomic migration

全出力と完全性検査が成功した場合だけ、旧本番ファイル群から新階層へ切り替えられる。

### 4. Catalog generation

manifest生成だけで階層カタログと既存索引を再現でき、手編集された二重の目録を持たない。

### 5. Regression evidence

移行前の基準スナップショットと移行後を比較し、4,829問の値・ID・分類が保持されたことを検査結果として残せる。

## Project Structure

- `content/questions/<subject>/g<grade>/<unit-slug>/set-<NNN>.json`: 本番問題の正規配置
- `content/questions/_samples/*.json`: 対象外のレンダラーサンプル
- `content/manifest.json`: 生成済み索引と階層カタログ
- `scripts/gen-manifest.ts`: カタログ・bundle生成
- `scripts/`: 移行とレイアウト検証のCLI
- `src/core/content/loader.ts`: 後方互換なmanifest契約
- `content/quality/academic-reviews.json`: 人間によるファイル単位承認
- `imports/academic-review-queue.json`: 新セット単位の生成済みレビューキュー
- `docs/release/tohoku-academic-ledger.md`: 東北18問の根拠・承認待ち記録
- `tests/unit/`: 分割、命名、値保存、カタログ、レビュー停止条件のテスト

## Tech Stack

- TypeScript strict
- Node.js標準のファイル・path・crypto API
- Zodによる既存問題契約の検証
- Vitest
- 既存のPrettier設定

新規依存は追加しない。`src/questions/contracts.ts` と生成schemaは変更しない。

## Testing Strategy

1. **Path tests**: 教科・学年・単元から期待パスを生成し、不整合を拒否する。
2. **Chunk tests**: 0、1、30、31、119問の境界で、空セットを作らず30問以下へ分割する。
3. **Parity tests**: 分割・再読込後もID、完全JSON値、単元内順序、分類件数が一致する。
4. **Idempotency tests**: 正規化済み入力を再処理しても差分が出ない。
5. **Review guard tests**: 移動対象の承認記録があれば書き込みを拒否し、記録を変更しない。
6. **Catalog tests**: 件数、階層、パス、タイプ一覧、決定論的順序を検証する。
7. **QuestionBank regression**: 全本番問題がロードでき、教科・学年・単元別候補数が基準と一致する。
8. **Content audits**: 学術レビュー、東北教材、カリキュラム、画像・音声参照を含む既存検査を通す。

テストは失敗する契約を先に追加し、移行ロジック、実データ移行、生成物更新の順に進める。

## Commands

実装時に専用CLI名をpackage scriptへ固定し、少なくとも次を実行する。

```bash
pnpm check:fast
pnpm test:related scripts/gen-manifest.ts src/core/content/loader.ts
pnpm test:data
pnpm audit:academic-review
pnpm validate:content
pnpm lint
pnpm check:architecture
pnpm test
pnpm build
```

完全ゲートは同時作業中の他チャットと競合しないタイミングで一度だけ実行する。

## Boundaries

### Always

- 問題の完全JSON値とIDを保つ。
- 配置は問題メタデータから導出し、パスだけを信用しない。
- 書き込み前に値の完全性とレビュー影響を検証する。
- 生成manifestを唯一の機械可読カタログにする。
- 既存の未コミット変更と無関係な生成物を保持する。

### Ask first

- `src/questions/contracts.ts` または問題type schemaの変更。
- 有効・無効を問わず、人間のレビュー記録の削除・自動転記。
- 30問上限または対象パス規則の変更。
- 新規依存の追加。
- 問題本文・正解・解説・タグ・IDの変更。

### Never

- パス移動と同時に問題内容を「ついでに」修正する。
- AIや自動検査の結果を人間の学術承認として記録する。
- `content/` に移行・分類ロジックを置く。
- 1問1ファイルへ分割する。
- `_samples` を本番問題数や学術レビュー対象へ混ぜる。

## Success Criteria

- 現在の4,829問が欠落・重複・値変更なく新階層へ移る。
- 全本番ファイルが `questions/<subject>/g<grade>/<unit-slug>/set-<NNN>.json` にあり、1〜30問かつ単一単元である。
- 現在データでは309単元・323セットとなり、差があれば移行レポートで説明される。
- `manifest.json` から教科→学年→単元→セットと各件数を読める。
- 既存のID直接参照、QuestionBank、学年別bundle、選択条件、保存データが機能する。
- 学術レビュー記録を黙って失効・転記せず、東北18問は承認待ちのまま監査できる。
- 専用テスト、コンテンツ監査、リポジトリ標準ゲートが成功する。
- 後続のPlaygroundツリーがファイル内容を全件走査せず、カタログから階層を描画できる。

## Rollback

実データ移行、ロジック変更、生成物更新はレビュー可能な独立コミットに分ける。問題があれば該当コミットを `git revert` し、旧81ファイルと旧manifest生成契約へ戻せるようにする。履歴を書き換える操作は行わない。

## Explicit Exclusions

- Question PlaygroundのツリーUI実装（後続 `question-browser-tree` モジュール）
- 新しい問題type、レンダラー、採点方式
- 問題内容の品質修正、単元名の意味改善、カリキュラム再分類
- 学習概念グラフや前提関係の追加
- 本番公開、push、共有ブランチへのmerge

## Open Questions

なし。30問上限、階層、サンプル除外、生成カタログ、同一seedの移行前後ID非保証を本仕様の決定として承認対象にする。
