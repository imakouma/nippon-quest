# Spec: Unit Progress Normalization

## Status and capability trace

- Capability module: `unit-progress-normalization`
- Capability map: `CAPABILITY_MAP-learning-roadmap-curriculum-v2.md`
- Phase: 1 — specification only. Implementation and planning require a later human approval.
- Baseline: `8dfff95c3e0bb65502648bcec38c0c3862552da1`
- Implementation branch: `codex/lr-v2-unit-progress`
- Depends on: none
- Downstream consumers: `learning-recommendation-policy`, `roadmap-relation-projection`, and the later roadmap/reward integration.

## Objective

旧単元ID、旧問題の単元ID、現行単元IDのどれで保存された学習状態でも、同じ正規単元として習熟度を参照できる純粋なCore契約を作る。既存の `canonicalUnitId()` とロードマップ内の習熟集約を抽出して再利用し、学習報酬の既付与マーカーだけを正規単元IDへ遅延正規化する。

これにより、legacy/current/mixed セーブでロードマップと後続の推薦ポリシーが同じ単元進捗を読み、同一単元の「まなびの かけら」を二重付与しない。保存済みの習熟キーそのものは書き換えず、既存プレイヤーの進捗、報酬、地域進行を巻き戻さない。

## Existing behavior to preserve

- 現行の正規化元は `src/core/learning/unitAliases.ts` の `LEGACY_UNIT_ALIASES`、`LEGACY_QUESTION_UNIT_ALIASES`、`canonicalUnitId()` とする。
- 現在 `src/scenes/overworld/roadmap.ts` が複数キーの習熟記録を次の式で集約している。この数式を挙動の正とし、別の平均方式へ変更しない。
  - `weight = max(1, record.n)`
  - `value = sum(record.value * weight) / sum(weight)`
  - `n = sum(record.n)`
  - `lastAt = max(record.lastAt)`
- 単元習熟報酬の条件は `mastery.value >= 0.8 && mastery.n >= 3` のままとする。
- まちがい直し報酬は「完全正答、回答前にまちがい一覧に存在、異なる3問ごとに1個」のままとし、問題IDは単元別名で正規化しない。
- 報酬アイテムID `learning-fragment`、inventory加算、dex登録、同じ回答で習熟到達と3問目の直しを同時達成した場合の2個付与を維持する。
- `roadmapSnapshot.ts` の既得進捗保護、島・地域進行、バトルの7割弱点／3割復習選択を変更しない。

## ID contract

### Accepted unit ID forms

同じ単元に対して次の3形式を受け入れる。

| Form                    | Example                    | Canonical result    |
| ----------------------- | -------------------------- | ------------------- |
| Current unit ID         | `sansu.g1.tashizan`        | `sansu.g1.tashizan` |
| Legacy question unit ID | `sansu.g1.legacy-math-1-2` | `sansu.g1.tashizan` |
| Raw legacy roadmap node | `math_1_2`                 | `sansu.g1.tashizan` |

- `canonicalUnitId()` は上記3形式を同じ現行IDへ写す。対応表にないIDは変更せず返す。
- 正規化は一意で決定論的とし、入力文字列や対応表を変更しない。
- 既存の対応先を別の現行IDへ付け替える変更、新しい教材上の同一性判断、既存Unit IDの改名は本仕様に含めない。
- raw legacy node は習熟集約の読み取り互換に必要だが、`masteredRewardUnits` へ新規保存する値には使わない。

## Unit progress contract

`src/core/learning/unitProgress.ts` は表示、Scene、保存処理に依存しない純粋モジュールとする。公開契約は、保存済みの習熟辞書を正規単元IDごとに集約できることを必須とする。関数名は実装計画で最終確定してよいが、次の形と意味を維持する。

```ts
interface UnitMasteryRecord {
  value: number;
  n: number;
  lastAt: number;
}

function aggregateUnitMastery(
  mastery: Readonly<Record<string, Readonly<UnitMasteryRecord>>>,
): Readonly<Record<string, UnitMasteryRecord>>;
```

- 出力キーは必ず `canonicalUnitId(inputKey)` とする。
- 同じ正規IDへ写る全記録を、Existing behavior の重み付き式で1記録へまとめる。
- current、legacy question、raw legacy のどのIDを検索起点にしても、正規化後は同じ集約記録を参照できる。
- 対応表にない単元も失わず、そのIDのまま出力する。
- 空入力は空出力を返す。
- 入力辞書と各記録は変更しない。返却値も呼び出し元の状態を共有して更新しない。
- mixed セーブの複数記録は既存ロードマップと同じく加算可能な証拠として扱う。AttemptEventがないため、内容が偶然同じ記録を推測で重複排除しない。
- 互換fixtureでは、同じ論理進捗を legacy-only、current-only、legacy/currentへ分割した mixed の3形態で表し、`value`、`n`、`lastAt` の完全一致を確認する。

## Learning reward contract

`src/core/learning/learningRewards.ts` は既存の `applyLearningRewards`、`LEARNING_FRAGMENT_ID`、関連型と同等の呼び出し契約を提供し、単元習熟の参照と既付与判定に正規化済み進捗を使う。新しい報酬種類や設定値は追加しない。

### Mastery lookup

1. `outcome.unit` を正規IDへ変換する。
2. `state.learning.mastery` 全体を `unitProgress.ts` の契約で集約する。
3. 正規IDの集約記録に対して、既存の `n >= 3 && value >= 0.8` を評価する。
4. legacy側で回答しcurrent側に習熟がある場合、その逆、両方に分かれている場合を同じ規則で扱う。

### Reward marker normalization

- `learning.masteredRewardUnits` の比較は各要素を `canonicalUnitId()` へ通して行う。
- 同じ正規IDのlegacy markerまたはcurrent markerが1件でもあれば、習熟報酬は付与済みとする。
- 新しく報酬を付与するときは、`outcome.unit` の形式にかかわらず正規IDを1件だけ保存する。
- 回答で触れた正規単元について既存markerがlegacy/current/mixedなら、最初の同値marker位置を正規IDへ置き換え、同値markerの重複を除く。無関係な単元markerの値と相対順序は維持する。
- この遅延正規化は、その回答の単元に対応するmarkerだけを対象とする。セーブ全体の一括移行、全習熟キーの書き換え、schema migrationは行わない。
- marker正規化だけが発生した場合は `earned: 0`、`reasons: []` としつつ正規化後のstateを返す。何も変わらない場合は既存どおり元stateを返してよい。
- 単元報酬とまちがい直し報酬が同時成立する既存挙動を維持する。

### Idempotency scenarios

次のすべてで、同一正規単元の習熟報酬は最大1回だけ付与される。

1. legacy習熟 + markerなし → legacy回答で1回付与 → current回答では0回。
2. current習熟 + legacy marker → legacy/currentどちらの回答でも0回、markerは正規IDへ収束。
3. mixed習熟 + legacy/current両marker → 0回、同値markerは正規ID1件へ収束。
4. legacy習熟 + current marker、またはcurrent習熟 + legacy marker → 0回。
5. stateの保存・再読込相当として関数へ結果stateを再入力 → inventory、dex、marker数が増えない。

## Project structure and ownership

### Owned by this module in implementation phase

- `src/core/learning/unitAliases.ts`
  - 既存対応表を唯一の正として維持し、raw legacy nodeも解決する正規化契約を提供する。
- `src/core/learning/unitProgress.ts`
  - alias-awareな習熟集約だけを所有する。
- `src/core/learning/learningRewards.ts`
  - 既存報酬条件を維持し、正規進捗と正規markerで冪等に判定する。
- `tests/unit/unitProgress.test.ts`
  - ID形式、集約式、不変性、legacy/current/mixed fixtureを検証する。
- `tests/unit/learningRewards.test.ts`
  - 既存報酬条件に加え、別名markerと再読込相当の冪等性を検証する。

### Explicitly outside this module

- `src/scenes/overworld/roadmap.ts`
- `src/shared/menuModel.ts`
- `src/core/learning/index.ts`
- 保存データschema、migration、`roadmapSnapshot.ts`
- UI、Scene、Question契約、教材JSON、推薦・関係投影ポリシー

Agent 1の実装コミットは上記owned filesだけを変更する。`index.ts` へbarrel exportを追加せず、専用テストと後続モジュールは当面direct importを使う。

現在の実行経路は `src/core/progression/learningRewards.ts` と `src/scenes/shared/askEnv.ts` を参照している。Agent 1は所有範囲を越えてこれらを編集せず、統合担当がAgent 1コミットの後で、既存公開名を保ったre-exportまたはimport切替により新しい正規化済み実装へ接続する。接続前は全体機能の成功条件を満たしたとは扱わない。

## Tech stack and code style

- TypeScript strict、Vitest、既存のZod GameState契約を使う。
- Phaser、Preact、DOM、乱数、新規依存を使わない。
- 型だけの依存は `import type` とし、CoreにScene/UI依存を持ち込まない。
- 入力を変更しない純粋関数を優先し、別名判定を報酬処理へ重複実装せず `unitAliases.ts` と `unitProgress.ts` を再利用する。
- 1回だけ使う抽象化、将来用オプション、設定化は追加しない。

```ts
const canonicalUnit = canonicalUnitId(outcome.unit);
const mastery = aggregateUnitMastery(state.learning.mastery)[canonicalUnit];
const rewarded = state.learning.masteredRewardUnits.some(
  (unitId) => canonicalUnitId(unitId) === canonicalUnit,
);
```

## Graphify gate for implementation

実装開始時、コード編集より先にローカルcode-only Graphifyグラフを確認する責務をAgent 1が持つ。Phase 1確認時点では `graphify-out/graph.json` は存在しないため、次の順序を必須とする。

1. `graphify extract . --code-only --no-cluster` を実行する。
2. semantic labelingと外部LLM backendは使わない。
3. `canonicalUnitId`、既存ロードマップ習熟集約、`applyLearningRewards` のcallerとaffected範囲を `graphify query` / `graphify affected` で確認する。
4. owned files外の変更が必要だと判明した場合は実装せずAsk firstへ戻す。
5. `graphify-out/` は生成物としてコミットしない。materialな統合後の更新は統合担当が行う。

## Testing strategy

実装はRED → GREEN → REFACTORを小さい順で行う。最初に現行実装では失敗する別名集約と二重付与のテストを追加し、失敗理由を確認してから最小実装を行う。

### Required unit cases

- `canonicalUnitId`: current、legacy question、raw legacy、unknown。
- Unit progress: empty、single current、single legacy、raw legacy、mixed split、複数canonical unit、`n === 0`を含む既存重み式、入力不変。
- Mastery reward: threshold直前、ちょうど`0.8/3`、legacy/currentの交差参照、mixed集約。
- Marker idempotency: legacy-only、current-only、mixed duplicate、反復呼び出し、再読込相当。
- Correction reward regression: 3問ごと、同じ問題の再計上なし、`score !== 1`は対象外、習熟と同時成立で2個。
- State regression: unrelated mastery keys、marker、inventory、dex、mistakes、recent、attempts、progressを変更しない。

### Commands

- Phase 1 document check: `pnpm exec prettier --check SPEC-unit-progress-normalization.md`
- Phase 1 whitespace check: `git diff --check`
- RED/GREEN focused tests: `pnpm vitest run tests/unit/unitProgress.test.ts tests/unit/learningRewards.test.ts`
- Related verification: `pnpm test:related src/core/learning/unitAliases.ts src/core/learning/unitProgress.ts src/core/learning/learningRewards.ts tests/unit/unitProgress.test.ts tests/unit/learningRewards.test.ts`
- Fast gate after implementation: `pnpm check:fast`
- Integration owner after wiring: `pnpm check:full`

Agent 1は並行チャットで `pnpm check:full`、`pnpm test`、`pnpm build` を実行しない。完全ゲートとプレビューは統合担当が統合後に一度実行する。

## Boundaries

### Always

- 正規化と集約はCoreの純粋関数に置き、Scene/UIへ学習ロジックを漏らさない。
- 保存済み習熟キーを読み取り時に集約し、元の `learning.mastery` を変更しない。
- 新規または触れた習熟報酬markerだけを正規IDにする。
- 既存の3回答・習熟度0.80、まちがい直し3問、inventory/dex挙動を維持する。
- legacy/current/mixed fixtureと反復呼び出しで冪等性を検証する。
- 各行動変更は失敗するテストから始め、owned filesだけを1論理コミットにする。

### Ask first

- 3回答、習熟度0.80、まちがい直し3問、完全正答という報酬条件の変更。
- `GameState` schema version、新しい永続フィールド、migrationの追加。
- 既存aliasの対応先変更、Unit ID改名、教材上の新しい同一性判断。
- `src/questions/contracts.ts`、`roadmap.ts`、`menuModel.ts`、`index.ts`、既存実行経路のcaller編集。
- 新しい依存、外部サービス、Graphify semantic labeling/外部LLMの使用。

### Never

- `learning.mastery` や全セーブデータを一括で正規IDへ移行する。
- 既存報酬、進捗、地域解放、所持品を減らすまたは巻き戻す。
- legacy/current markerを別報酬として数え、同一正規単元へ複数回付与する。
- 問題IDを単元aliasで正規化し、まちがい直しの一意性を変える。
- 全legacy単元の教材移行、schema変更、依存追加、UI変更を混ぜる。
- `graphify-out/`、`dist/`、`test-results/` をコミットする。

## Success criteria

### Agent 1 implementation acceptance

- current、legacy question、raw legacyのIDが同じ正規IDへ解決される。
- legacy-only、current-only、同じ論理進捗を分割したmixed fixtureの集約結果が完全一致する。
- 集約数式が既存ロードマップの重み付き値、試行数合計、最終時刻最大と一致する。
- 入力した習熟辞書とGameStateを直接変更しない。
- legacy/current/mixed markerのどれが存在しても習熟報酬を二重付与せず、触れた単元のmarkerが正規ID1件へ収束する。
- 既存の習熟報酬とまちがい直し報酬の条件、個数、理由、inventory/dex挙動が変わらない。
- 新しい永続フィールド、schema migration、依存パッケージを追加しない。
- owned filesと専用テスト以外を変更しない。
- focused tests、related tests、`pnpm check:fast` が成功する。

### Integrated product acceptance

- 統合担当が既存回答経路を新実装へ接続し、legacy/current/mixedの代表v13セーブで回答→保存→再読込しても同一単元報酬が増えない。
- ロードマップ、推薦、関係投影が同じ正規単元進捗契約を参照する。
- `pnpm check:full` と統合後の代表セーブ互換確認が成功する。

## Not doing

- 保存済みmastery keyまたは全markerの起動時一括移行。
- 報酬条件、報酬量、報酬アイテム、レベル上限解放条件の変更。
- `roadmap.ts` 内の表示状態、概念完全性、前提、復習期限の変更。
- 推薦ポリシー、今日プラン、関係投影、UIの実装。
- `src/core/learning/index.ts` のexport追加。

## Open questions and integration handoff

実装開始を妨げる単元正規化上の未解決事項はない。人間承認時に、Agent 1の所有範囲外である既存実行経路の接続を統合担当が行うことだけを確認する。Agent 1へ接続まで担当させる場合は、`src/core/progression/learningRewards.ts` と `src/scenes/shared/askEnv.ts` を追加所有範囲として明示承認する。
