# Spec: curriculum-model — 小学校カリキュラム正規体系

## Status

Draft for human approval. Capability map module: `curriculum-model`.

## Objective

小学校の問題4,117問を、学年・推奨学期・教科・単元・学習目標・前提関係・根拠資料・レビュー状態で一貫して整理できる正規体系を作る。

このモジュールは問題内容そのものを修正しない。後続の `content-audit`、`question-renewal`、`learning-experience` が共通して参照する分類・根拠・検証契約を提供する。

### Users

- 児童：今学ぶ内容と、できるようになった内容が分かる。
- 教材担当者：問題がどの学習目標に対応するか判定できる。
- 開発者：学年・学期・単元で安全に抽出し、学習UIへ表示できる。
- 学術レビュー担当者：根拠資料と確認状態を追跡できる。

### Terminology

- **正式課程**：学習指導要領上、その学年・教科等で扱う内容。
- **推奨学期**：年間指導計画を基にした配置。全国一律の法的指定ではない。
- **外国語活動**：3・4年の活動領域。
- **外国語科**：5・6年の教科。
- **補助教材**：正式課程の到達度へ算入しない任意コンテンツ。既存の1・2年英語はこの候補。

## Authoritative Sources

1. 文部科学省「小学校学習指導要領（平成29年告示）」
   - https://www.mext.go.jp/content/20230120-mxt_kyoiku02-100002604_01.pdf
2. 文部科学省「小学校学習指導要領解説」各教科編
   - https://www.mext.go.jp/a_menu/shotou/new-cs/1387014.htm
3. 文部科学省「小学校学習指導要領コード 82V12」
   - https://www.mext.go.jp/a_menu/other/data_00002.htm
4. 推奨学期については、文部科学省検定済教科書の発行者が公開する年間指導計画を二社以上照合する。

学習指導要領の内容と年間指導計画を混同しない。発行者間で学期配置が一致しない単元は `variable` とし、特定学期を正式内容として断定しない。

## Required Capabilities

### 1. Unit classification

各単元は次を持つ。

- 一意な単元ID、RubyText名、教科、学年、学年内順序
- 課程区分：`required-subject` / `required-activity` / `supplementary`
- 推奨学期：1 / 2 / 3 / `variable`（複数学期も許容）
- 配当根拠の状態：`official` / `reference` / `unverified`
- 根拠資料IDと確認状態
- 対応する学習指導要領コード

### 2. Learning-goal graph

既存の概念グラフを保持・拡張し、各学習目標について次を表す。

- 概念、技能、知識、手続、読み、典型的誤概念
- 前提・構成要素・関連・因果・時系列・空間・分類・対比・転移
- 記憶特性と学習目標間の強さ
- 学習指導要領コード、出典、レビュー状態
- 問題との対応、主目標／補助目標／読解負荷

### 3. Official-course boundaries

- 1・2年：国語、算数、生活を正式課程として扱う。
- 3・4年：国語、算数、理科、社会、外国語活動を正式課程として扱う。
- 5・6年：国語、算数、理科、社会、外国語科を正式課程として扱う。
- 1・2年英語は正式課程の習熟度・不足判定・必修進捗に含めない。
- 生活科を3年以上、理科・社会を1・2年へ正式課程として登録できない。

### 4. Derivation instead of duplication

問題の学期・課程区分は `question.unit` から単元メタデータを引いて導出する。`content/questions/**/*.json` の全問題へ学期を重複記録しない。

このため `src/questions/contracts.ts` の `QuestionBase` は本モジュールでは変更しない。変更が必要になった場合は、この仕様を改訂し、影響と移行方法を示して再承認を受ける。

### 5. Validation and coverage

検証は少なくとも次を失敗として検出する。

- 問題が存在しない単元を参照する。
- 単元と問題の教科・学年が一致しない。
- 正式課程の学年配置に反する。
- 推奨学期があるのに根拠資料・状態がない。
- 学習指導要領コードが82V12形式でない。
- 概念・関係・問題リンクの参照切れまたはID競合。
- 1年1学期の対象単元に学習目標がない。

## Proposed Data Contract

既存 `unitSchema` を後方互換に拡張し、段階的に全単元を移行する。

```ts
type CurriculumPlacement = {
  terms: Array<1 | 2 | 3> | ['variable'];
  status: 'official' | 'reference' | 'unverified';
  sourceIds: string[];
  note: RubyText;
};

type Unit = {
  id: `${Subject}.g${Grade}.${string}`;
  name: RubyText;
  subject: Subject;
  grade: Grade;
  order?: number;
  courseKind?: 'required-subject' | 'required-activity' | 'supplementary';
  placement?: CurriculumPlacement;
  curriculumCodes?: string[];
  sourceIds?: string[];
  review?: {
    status: 'draft' | 'source-checked' | 'expert-reviewed';
    reviewedAt?: string;
    reviewer?: string;
  };
};
```

移行期間中は新フィールドを省略可能にし、監査対象スライスでは必須として別のカバレッジ検査を行う。これにより既存コンテンツを一度に壊さず、1年1学期から順に厳格化できる。

## First Vertical Slice: 1年1学期

正式対象は国語・算数・生活とする。教科内の単元順は年間指導計画の照合後に確定する。

### Required output

- 1年1学期に推奨される全単元のメタデータ
- 各単元の学習指導要領コードと根拠資料
- 単元ごとの学習目標グラフ
- 既存問題から学習目標への対応表
- 問題不足・過剰・逸脱を後続監査へ渡す機械可読レポート
- 既存1年英語を `supplementary` として正式進捗から隔離できる分類

### Acceptance criteria

- 国語・算数・生活の対象単元を学年・推奨学期・単元・学習目標で抽出できる。
- 対象単元はすべて出典ID、学習指導要領コード、レビュー状態を持つ。
- 既存問題は単元から推奨学期を導出でき、問題JSONへ学期の重複記録がない。
- 1年英語は正式課程の抽出結果へ混入しない。
- 配当が出版社間で異なる内容は `variable` または複数学期として表現される。
- 既存セーブ、バトル、問題レンダラーの動作契約を変更しない。

## Tech Stack

- TypeScript strict
- Zodによるランタイム検証とJSON Schema生成
- JSONコンテンツ
- Vitestによる純粋ロジック・検証テスト
- 既存のVite `import.meta.glob` によるカリキュラム読込

新規依存は追加しない。

## Commands

```bash
pnpm gen:schemas
pnpm check:curriculum
pnpm lint
pnpm check:architecture
pnpm test
pnpm validate:content
pnpm build
```

`check:curriculum` は既存コマンドを維持し、カリキュラム分類と問題対応の検証範囲を拡張する。

## Project Structure

- `content/units.json`：単元、課程区分、推奨学期、出典・レビュー情報
- `content/curriculum/*.json`：学習目標、関係、問題との対応
- `content/quality/academic-reviews.json`：人間による学術承認記録
- `src/core/content/schemas.ts`：単元メタデータの正規スキーマ
- `src/core/learning/model.ts`：学習目標グラフの正規スキーマ
- `src/core/learning/catalog.ts`：複数グラフの統合索引
- `scripts/validate-curriculum-graph.ts`：参照・配置・カバレッジ検査
- `tests/unit/`：モデル、検証、抽出の回帰テスト

## Code Style

分類ロジックは純粋関数にし、UIやSceneから独立させる。

```ts
export function isRequiredForGrade(unit: Unit, grade: Grade): boolean {
  return (
    unit.grade === grade &&
    (unit.courseKind === 'required-subject' || unit.courseKind === 'required-activity')
  );
}
```

- RubyTextが必要な表示文は `漢字[かんじ]` 形式にする。
- IDは既存の小文字英数字・ドット・ハイフン規則に従う。
- `any`、`Math.random`、教科名や問題タイプによるScene分岐を追加しない。

## Testing Strategy

1. **Schema tests**：有効な単元分類を受理し、不正な学年・課程・学期を拒否する。
2. **Curriculum-boundary tests**：学年ごとの正式教科等を表形式テストで固定する。
3. **Derivation tests**：問題IDから単元、推奨学期、学習目標を取得できる。
4. **Reference-integrity tests**：単元、概念、問題、出典の参照切れ・競合を検出する。
5. **Coverage tests**：1年1学期の対象単元が根拠・目標・分類を欠かない。
6. **Regression tests**：既存問題のロード、選択、採点契約が変わらない。

テストは失敗する契約を先に追加してから実装する。

## Boundaries

### Always

- 文科省の現行一次資料と82V12コードへ対応付ける。
- 学年の正式内容と推奨学期を区別する。
- AI照合と人間の専門レビューを別状態として残す。
- 既存の未コミット変更を保持する。
- 変更後にリポジトリ標準の全検査を実行する。

### Ask first

- `src/questions/contracts.ts` の変更。
- `schemas/` の手編集（生成物なので原則禁止）。
- 新規依存の追加。
- 既存の未完了 `tasks/plan.md` / `tasks/todo.md` の置換。
- 1・2年英語の物理削除（分類上は補助教材へ隔離できる）。

### Never

- 学期配当を学習指導要領の公式指定と偽って表示する。
- AI照合済みを `expert-reviewed` と記録する。
- 問題JSONと単元メタデータへ同じ分類を重複保持する。
- 正式課程にない教科を必修進捗へ含める。
- `content/` にロジックを置く。

## Success Criteria

- 全単元について正式課程／活動／補助教材を判定できるデータ契約がある。
- 学期分類には根拠状態と出典が伴い、曖昧さを表現できる。
- 既存概念グラフと問題リンクを再利用できる。
- 問題共通契約を変更せず、単元から学期・課程を導出できる。
- 1年1学期の国語・算数・生活を後続監査へ渡せる。
- 無効な配置と参照切れをCI相当のコマンドで検出できる。
- 既存機能の検査がすべて成功する。

## Open Questions

1. 既存の1・2年英語は、当面 `supplementary` として残す前提でよいか。物理削除は `content-audit` 後に改めて判断する。
2. 人間による最終的な `expert-reviewed` 承認者は、誰またはどの役割名で記録するか。
