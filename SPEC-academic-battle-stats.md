# Spec: academic-battle-stats — 文理ステータス・成長曲線・素早さ順バトル

## Status

Approved by the user on 2026-10-10.

Approved capability map modules:

1. `dual-academic-stats`
2. `academic-damage`
3. `speed-initiative`

Implementation planning and code changes must not begin until this specification is approved.

## Objective

主人公・仲間・敵の相対的な強さと現在の攻略難度を大きく変えずに、序盤の表示値を小さくし、レベルアップ時の成長を実感しやすい戦闘能力体系へ移行する。

戦闘はポケモン本編（第5世代以降）の次の考え方へ可能な限り近づける。

- 技の分類により参照する攻撃・防御能力を切り替える。
- 攻撃者のレベル、技威力、攻撃能力、防御能力を基礎ダメージへ直接使う。
- 計算途中で整数へ切り捨てる。
- 行動優先度が同じなら素早さの高い順に行動する。
- 同速判定やダメージ乱数はシード付き乱数で決定し、リプレイ可能性を維持する。

ニホンクエスト固有の学習要素として、問題スコア、コンボ、教科ゲージ、学習による賢さ成長は維持する。

## Research Basis

本仕様は、ゲーム内で公開されていない詳細を含むため、任天堂・株式会社ポケモンの公式仕様書ではなく、長年の検証結果を集約した Bulbapedia と、対戦挙動を再現するオープンソース実装 Pokémon Showdown を参照する。完全な複製ではなく、確認可能な計算構造をニホンクエストへ適合させる。

### Ability calculation

第3世代以降のポケモンは、HP とその他能力を別式で計算し、種族値・個体値・努力値・レベル・性格補正を用いる。除算と最終値は整数へ切り捨てられる。

- https://bulbapedia.bulbagarden.net/wiki/Statistic#Generation_III_onward

ニホンクエストでは個体値・努力値・性格を導入しない。児童に見えない恒久差を増やさず、コンテンツ基礎値、レベル、節目ボーナス、装備、学習ボーナスだけを使う。

### Damage calculation

第5世代以降の代表的な基礎構造は次のとおり。

```text
floor(
  floor(
    floor((2 × Level) / 5 + 2)
    × Power × Attack / Defense
  ) / 50
) + 2
```

その後に対象数、天候、急所、乱数、タイプ一致、タイプ相性などの補正が掛かる。乱数は通常 85〜100% で、最低ダメージは原則1。

- https://bulbapedia.bulbagarden.net/wiki/Damage
- https://github.com/smogon/pokemon-showdown/blob/master/sim/battle-actions.ts

### Physical/special pairing

ポケモンでは技カテゴリに応じて Attack 対 Defense または Special Attack 対 Special Defense を使う。ニホンクエストではこれを、理系攻撃 対 理系防御、文系攻撃 対 文系防御へ対応させる。

### Speed and priority

ポケモンでは、先に技の優先度を比較し、同じ優先度帯では素早さが高い側から行動する。同速は乱数で決定する。

- https://bulbapedia.bulbagarden.net/wiki/Priority
- https://github.com/smogon/pokemon-showdown/blob/master/sim/battle.ts

### Critical and type modifiers

第6世代以降の急所倍率は1.5倍、通常のタイプ一致補正も1.5倍。タイプ相性は代表的に0.5倍・1倍・2倍である。

- https://bulbapedia.bulbagarden.net/wiki/Critical_hit
- https://bulbapedia.bulbagarden.net/wiki/Same-type_attack_bonus

ニホンクエストの会心1.5倍と属性相性0.5・1・2倍は既に近いため維持する。主人公自身に固定教科タイプを設けないため、タイプ一致に相当する追加倍率は導入しない。

## Required Capabilities

### 1. `dual-academic-stats`

#### Visible stats

戦闘能力を次の8種類とする。すべて画面上は整数表示する。

```ts
type Stats = {
  hp: number;
  mp: number;
  scienceAtk: number;
  humanitiesAtk: number;
  scienceDef: number;
  humanitiesDef: number;
  spd: number;
  wis: number;
};
```

表示名：

- `scienceAtk`: 理系攻撃
- `humanitiesAtk`: 文系攻撃
- `scienceDef`: 理系防御
- `humanitiesDef`: 文系防御
- `spd`: 素早さ
- `wis`: 賢さ

内部契約でも旧 `atk` / `def` を残さず、移行完了後は新しい4能力を正とする。

#### Initial numerical scale

初期主人公の目標表示値は次を基準とする。

```text
HP 24 / MP 6
理系攻撃 5 / 文系攻撃 5
理系防御 4 / 文系防御 4
素早さ 5 / 賢さ 3
```

これは最終確定値ではなく、戦闘シミュレーションの基準値である。初期主人公と同レベル通常敵について、変更前後で以下を維持するよう一括変換係数を調整する。

- 通常攻撃で倒すまでの中央値
- 完璧解答の初期技で倒すまでの中央値
- 主人公が倒されるまでの中央値
- 逃走成功率

全コンテンツの主人公・仲間・敵・装備を同一方針で縮尺変換し、主人公だけを弱体化しない。

#### Growth curve

毎レベル同じ実数を直接足す方式を廃止し、整数の基礎成長と節目ボーナスを合成する。

```text
Stat(L) =
  Level1Stat
  floor(BaseGrowth × (L - 1))
  + floor((L - 1) / 5)  × MinorMilestone
  + floor((L - 1) / 10) × MajorMilestone
```

- `BaseGrowth` は固定加算ではなく累積値を最後に切り捨てる。例：0.4なら、毎回0.4を表示せず、数レベルごとに整数が上がる。
- レベル6、11、16…到達時に5レベル区切りの `MinorMilestone` を反映する。これはレベル1からの経過レベルを5で区切るためである。
- レベル11、21、31…到達時は10レベル区切りの `MajorMilestone` も同時に反映する。
- 表示上のレベル5、10、15…で祝いたい場合は、式の区切りを `floor(L / 5)` へ変更できる。実装前のバランス表で最終決定する。
- ボーナスは割合乗算ではなく整数加算とし、複利インフレを起こさない。
- HP・MPと4攻防・素早さ・賢さは異なる成長係数を持てる。
- レベルアップ結果画面では、上がった能力だけでなく「5レベルの節目」「10レベルの大きな節目」を明示する。

ポケモンの能力値式にある「基礎値×レベルを切り捨てるため、毎レベルの上昇量が一定ではない」という性質を採り入れつつ、明確な節目成長はニホンクエスト独自仕様として追加する。

#### Equipment and bonuses

- 旧 `atk` 装備は移行時に理系攻撃・文系攻撃へ同値コピーする。
- 旧 `def` 装備は移行時に理系防御・文系防御へ同値コピーする。
- 新規装備は片側だけを上げられる。
- 賢さボーナスは従来どおり学習で増え、両カテゴリの技へ共通に作用する。
- バッグ隣接、セット効果、名産品ボーナスも新しい能力キーを扱う。

#### Save migration

既存セーブは破棄しない。

- `baseStats.atk` → `scienceAtk` と `humanitiesAtk`
- `baseStats.def` → `scienceDef` と `humanitiesDef`
- 旧HP・MP・素早さ・賢さは、新縮尺へ決定論的に変換する。
- 現在HP・MPは最大値に対する割合を可能な限り維持する。
- 移行を複数回適用しても値が変わらない。
- スキーマバージョンを更新する。

### 2. `academic-damage`

#### Move category

ダメージ技は次を持つ。

```ts
type AttackClass = 'science' | 'humanities' | 'balanced';
```

既定分類：

- 算数・理科 → `science`
- 国語・社会・英語 → `humanities`
- 生活 → 技ごとに `science` / `humanities` / `balanced` を明示
- 通常攻撃 → `balanced`

回復・補助・調査技は攻防カテゴリを参照しない。コンテンツ検証で、ダメージ技の分類漏れを失敗にする。

#### Attack/defense selection

```text
science:
  A = attacker.scienceAtk
  D = defender.scienceDef

humanities:
  A = attacker.humanitiesAtk
  D = defender.humanitiesDef

balanced:
  A = floor((scienceAtk + humanitiesAtk) / 2)
  D = floor((scienceDef + humanitiesDef) / 2)
```

#### Base damage

基礎式は第5世代以降のポケモン式の演算順へ合わせる。

```text
levelFactor = floor(2 × level / 5) + 2
scaled      = floor(levelFactor × power × effectiveAttack / max(1, effectiveDefense))
baseDamage  = floor(scaled / 50) + 2
```

補正順：

```text
baseDamage
× questionScoreMultiplier
× comboMultiplier
× elementMultiplier
× revealedWeaknessMultiplier
× equipmentResistance
× criticalMultiplier
× randomMultiplier
```

各主要段階で整数へ切り捨て、最終ダメージは最低1とする。

#### NIHON QUEST adaptations

- 問題スコア倍率はゲームの核なので維持するが、現行 `2.0 / 1.2 / 0.8 / 0.5` は新式で再シミュレーションする。
- コンボ倍率は維持するが、上限を含め再シミュレーションする。
- 賢さは `1 + wis × 0.01` の無制限な実数乗算を廃止候補とする。推奨は、技使用時だけ `effectiveAttack += floor(wis / wisdomDivisor)` として整数能力へ統合する。これによりポケモン式の A/D 構造を崩さない。
- 乱数85〜100%を導入する。ただし必ず既存のシード付きRNGを使い、同じシード・コマンド列なら同じ結果にする。
- 会心倍率は1.5倍を維持する。
- 属性相性0.5・1・2倍を維持する。
- 現時点では命中率・回避率・タイプ一致・個体値・努力値・性格・天候を導入しない。

### 3. `speed-initiative`

#### Round resolution

現在の固定順「主人公 → オトモ → 敵」を廃止する。

1. プレイヤーが主人公コマンドを選ぶ。
2. 主人公・生存中の前衛オトモ・敵の行動候補を作る。
3. 優先度の高い順に並べる。
4. 同じ優先度では実効素早さの高い順に並べる。
5. 同速ならシード付き乱数で順番を決める。
6. 順番に実行し、行動前に戦闘不能ならその行動を飛ばす。

#### Initial priority brackets

ポケモンに近い拡張余地を保つが、初回実装は次だけに限定する。

| Command | Priority |
|---|---:|
| 逃げる | +1 |
| 入れ替え | +1 |
| 道具 | +1 |
| 防御・回復・攻撃・技・仲間自動行動 | 0 |

逃走・入れ替え・道具を必ず素早さ順にする案は、低学年向けの回復可能性を大きく下げるため採用しない。ポケモンの「優先度→素早さ」の二段階構造へ近づける。

#### Speed effects

- 素早さは行動順と逃走率の両方に使う。
- 既存逃走式の最低15%・最大95%は初回移行時に維持する。
- 素早さバフ・デバフを将来追加できるよう、行動順は `effectiveSpeed` を受け取る純粋関数にする。
- 同速乱数を含めリプレイが完全に再現できる。

## Balance Targets

変更前の代表戦闘を基準データとして固定し、変更後の相対バランスを次の範囲に収める。

### Level 1 normal encounters

- 通常攻撃で敵を倒すターン中央値：変更前比 ±1ターン
- 完璧解答の初期技で敵を倒すターン中央値：変更前比 ±1ターン
- 主人公が倒されるターン中央値：変更前比 ±1ターン
- 問題不正解だけで戦った場合でも進行不能にならない

### Boss encounters

- 青森中ボス・県ボス・最終ボスの想定レベルにおける勝率を変更前比 ±10ポイント以内にする
- 完璧解答と不正解中心の戦闘時間に明確な差を残す
- 素早いボスが先攻できる一方、回復・道具を選ぶ余地を残す

### Progression feel

- レベル1の表示値は現在より概ね25〜40%小さい
- 通常レベルアップでも少なくとも1能力が上がる回を十分に確保する
- 5レベル節目では通常より多くの能力上昇が見える
- 10レベル節目では5レベル節目より大きな合計上昇が見える
- レベル50時の主要能力は安全整数内かつUI表示桁数を超えない
- 同レベル帯の主人公と通常敵の攻防比は、移行前の代表値から大きく乖離しない

## Data and Interface Changes

変更対象となる正規契約：

- `Stats`
- `partialStatsSchema`
- `Monster.baseStats`
- `Monster.growth`
- `Settings.heroGrowth`
- `Item.stats`
- `EquipSet.bonus.stats`
- `Skill.attackClass`
- `Combatant.buffs`
- `GameState.player.baseStats`
- セーブスキーマバージョン

`contracts.ts` の問題レンダラー契約は変更しない。バトルは引き続き `QuestionResult.score` だけを見る。

## Project Structure

- `src/core/content/schemas.ts`: 新しい能力・技カテゴリ・成長契約
- `src/core/state/migrations.ts`: 既存セーブ移行
- `src/core/battle/factory.ts`: レベル能力・節目成長・装備合成
- `src/core/battle/damage.ts`: 文理ペア選択とポケモン型ダメージ式
- `src/core/battle/engine.ts`: 優先度・素早さ順のラウンド解決
- `content/balance/settings.json`: 成長曲線・補正設定
- `content/skills.json`: 技カテゴリ
- `content/monsters/*.json`: 縮尺変更後の能力と成長
- `content/items/*.json`: 新能力の装備補正
- `tests/unit/`: 能力、移行、ダメージ、順番、リプレイの契約テスト
- `scripts/`: 全コンテンツ変換と戦闘シミュレーション

## Tech Stack

- TypeScript 5.6 strict
- Zod 3.23
- Vitest 4
- Phaser 3.87 / Preact 10（表示層のみ）
- 既存のシード付き `src/core/rng.ts`

新規ランタイム依存は追加しない。

## Commands

```bash
pnpm gen:schemas
pnpm validate:content
pnpm lint
pnpm check:architecture
pnpm test
pnpm build
pnpm test:e2e:battle
```

戦闘シミュレーション用コマンドは実装計画で追加する。候補は `pnpm audit:battle-balance`。

## Code Style

計算は純粋関数に分け、演算順と丸め位置をコードで明示する。

```ts
export function pokemonLikeBaseDamage(level: number, power: number, attack: number, defense: number): number {
  const levelFactor = Math.floor((2 * level) / 5) + 2;
  const scaled = Math.floor((levelFactor * power * attack) / Math.max(1, defense));
  return Math.floor(scaled / 50) + 2;
}
```

`Math.random` は使わない。Scene・DOM・Phaserを純粋ロジックへ持ち込まない。

## Testing Strategy

### Contract tests

- 新Statsの全キーが非負整数として検証される。
- 全ダメージ技に有効な `attackClass` がある。
- 旧能力キーを移行後コンテンツに残さない。

### Formula tests

- 既知入力に対する各切り捨て段階を固定する。
- 理系技が理系攻防だけを参照する。
- 文系技が文系攻防だけを参照する。
- balanced技が整数平均を使う。
- 最低ダメージ1、乱数85〜100%、会心1.5倍、属性0.5・1・2倍を固定する。

### Progression tests

- レベル1、4、5、6、9、10、11、49、50を境界テストする。
- 同じ入力から常に同じ整数能力を得る。
- 節目ボーナスが複利にならない。
- レベルを上げても能力が下がらない。

### Initiative tests

- 高速な敵が低速な主人公より先に動く。
- 高速な主人公が敵より先に動く。
- 優先度が素早さより先に比較される。
- 同速がシードで再現される。
- 先行攻撃で倒された行動者は行動しない。
- リプレイ結果が元戦闘と一致する。

### Migration tests

- schemaVersion 9以前の代表セーブを新形式へ変換できる。
- HP・MP割合が維持される。
- 二重移行されない。
- 所有モンスター、装備、学習進捗を失わない。

### Balance simulation

- 全通常モンスターを想定レベルの主人公と自動戦闘させる。
- 中ボス・県ボス・最終ボスを完璧／平均／不正解中心の3条件で比較する。
- 変更前後の撃破ターン、被撃破ターン、ダメージ分布、先攻率をJSONで出力する。
- 許容範囲を超えた対象を失敗として列挙し、人手で個別調整する。

## Boundaries

### Always

- 主人公だけでなく敵・仲間・装備も同じ縮尺方針で移行する。
- 既存セーブを自動移行する。
- 同一シード・同一コマンド列の決定論性を維持する。
- 問題タイプではなく `QuestionResult.score` だけを見る。
- GDD、アーキテクチャ文書、スキーマ、生成物を同じ変更内で同期する。
- 実装前後のバランスシミュレーション結果を保存して比較する。

### Ask first

- 初期主人公の基準値を本仕様の24/6/5/5/4/4/5/3から大きく変える。
- 問題スコア倍率を現在値から変更する。
- 最大レベルまたはXPテーブルを変更する。
- 命中率、回避率、タイプ一致、個体値、努力値、性格を追加する。

### Never

- `Math.random` を使う。
- 旧セーブを黙って初期化する。
- 主人公だけを縮小して敵との相対バランスを変える。
- 毎レベルの成長へ割合を複利適用する。
- Scene側に攻防カテゴリやダメージ式の分岐を置く。

## Success Criteria

- 戦闘能力がHP、MP、理系攻撃、文系攻撃、理系防御、文系防御、素早さ、賢さの8整数で統一される。
- 理系・文系・balanced技が正しい攻防ペアを使う。
- ダメージ基礎式と丸め順がポケモン第5世代以降の構造に一致する。
- 初期表示値が現在より小さく、変更前と同程度の相対戦闘難度を維持する。
- 5・10レベル区切りで、通常より大きな整数成長を確認できる。
- 素早さが行動順と逃走率の両方へ影響する。
- 同速、ダメージ乱数、会心を含む戦闘がシードから再現できる。
- 既存セーブと全コンテンツを失敗なく移行できる。
- 必須検査とバトルE2Eがすべて通る。
- 実ブラウザで能力表示、レベルアップ、先攻・後攻、既存セーブ読込を確認できる。

## Open Questions for Approval

1. 節目ボーナスを「レベル5・10到達時」に出すか、「レベル1から5回成長したレベル6・11」で出すか。推奨は児童に分かりやすい前者。
2. 同速時をポケモン同様のシード付き50%抽選にするか、遊びやすさ優先で主人公側先行にするか。ポケモン準拠を優先するなら前者。
3. 逃走・入れ替え・道具を優先度+1にする案を採用するか。推奨は採用。
4. 初期基準値 `24 / 6 / 5 / 5 / 4 / 4 / 5 / 3` をシミュレーション開始点として承認するか。
