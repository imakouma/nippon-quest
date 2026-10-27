# Spec: battle-enemy-size-scaling — キャラ固有寸法を反映した敵表示

## Status

Approved on 2026-10-27; implementation in progress.

2026-10-27の初稿は、進化段階によるバッグ占有サイズを体格の代理値にしていたため撤回する。本仕様は、すでに全キャラクターへ設定された身長・高さデータを直接使う。

## Objective

戦闘画面の敵スプライトへ、キャラクターごとに設定済みの身体寸法を反映する。

実寸比をそのまま画面へ持ち込むと、10cmの小型キャラが見えなくなり、580cmの大型キャラがHUDを覆う。そのため、設定上の身長・高さを入力とする非線形の縮尺関数を使い、相対的な大小を保ちながら戦闘画面向けに圧縮する。

次を両立させる。

- 設定上大きいキャラは、役割や進化段階にかかわらず画面上でも大きく見える。
- 設定上小さいキャラも、表情とシルエットを認識できる最低表示サイズを保つ。
- 画像ファイルの解像度、透明余白、通常敵・ボス分類をキャラ固有寸法の代わりにしない。
- デスクトップとモバイルの安全領域を越えない。

## Source of Truth

キャラクター寸法の正は、既存のアート資料室用データとする。

```text
/Users/imamurakouma/Documents/ChatGPT/education-2d-RPG/
  sites/nihon-quest-art-library/body-sizes.json
```

このデータには545体分があり、内訳はモンスター541体と主要人物4体である。モンスターには次の情報が設定されている。

```ts
type CharacterBodySize = {
  status: 'draft' | 'approved';
  heightKind: 'height' | 'body-height';
  heightCm: number;
  weightKg: number;
  lengthCm?: number;
  wingspanCm?: number;
  reason: string;
  note: string;
};
```

本変更では `heightCm` を戦闘表示の一次入力にする。

- `weightKg` は密度や材質を表す値であり、画面上の大きさには使わない。
- `lengthCm` と `wingspanCm` は形態の補足情報として保持するが、スプライト全体を一律拡大する係数には使わない。長い蛇や翼の広い鳥を、身体高と同じ比率で縦にも巨大化させないためである。
- 横方向の見え方は採用画像の縦横比と透明でない身体領域によって維持する。

現在のゲームコンテンツには、寸法データに存在しない互換用モンスター `koshinetsu-boss` が1体ある。このIDは描画上 `tohoku-boss-rokufuyu` と同じ採用画像を使うため、専用設定が追加されるまでは同画像の `heightCm: 480` を明示的な互換フォールバックとして使う。未知IDを一般的なボス倍率で黙って補完しない。

## Runtime Data Boundary

アート資料室の作業ディレクトリを実行時に直接読まない。実装時に、ゲームリポジトリ内へ戦闘表示に必要な寸法だけを取り込む。

推奨する配置：

```text
content/character-body-sizes.json
```

ゲーム側へ取り込む値：

```ts
type RuntimeCharacterBodySize = {
  heightKind: 'height' | 'body-height';
  heightCm: number;
  lengthCm?: number;
  wingspanCm?: number;
};
```

- Monster本体のJSON 542ファイルへ同じフィールドを重複追加しない。
- `Monster` schema、保存データ、戦闘能力値へ寸法を埋め込まない。
- 取り込み元とゲーム側データのID・数値一致を検査できるスクリプトまたはテストを置く。
- `reason`、`note`、`weightKg` は今回のランタイム表示には不要なのでコピーしない。

## Display Function

### Physical height compression

100cmのキャラを現行の通常敵相当の基準表示高とし、平方根で実寸差を圧縮する。

```ts
const rawBodyHeight = referencePixels * Math.sqrt(heightCm / 100);
const targetBodyHeight = clamp(rawBodyHeight, minBodyPixels, maxBodyPixels);
```

Phaserの論理キャンバスはビューポート幅にかかわらず960×540であり、640×360表示ではCSSで約2/3へ縮小される。したがって、レイアウトごとの論理ピクセル値は次のとおりとする。

| レイアウト           | 100cm基準 | 最小表示高 | 最大表示高 |
| -------------------- | --------: | ---------: | ---------: |
| side view            |      96px |       48px |      224px |
| canonical depth view |      96px |       60px |      188px |

canonical depth viewの最小60論理pxは、640×360表示で約40画面pxになる。最大188論理pxは既存HUDの安全領域内に収める値である。

この関数の性質：

- 10cmと580cmの実寸比58倍を、そのまま画面へ出さない。
- 平方根により約7.6倍へ圧縮し、さらに画面上限・下限で安全に収める。
- 100cmは現行の通常敵と同程度なので、中型キャラの見え方を大きく変えない。
- 体格差は連続値で表現し、通常敵・中ボス・県ボス・地方ボスの固定段階へ丸めない。

### Example

設定済みの山梨キャラでは、標準レイアウトで次の目標表示高になる。

| キャラ                      | 設定高 | 圧縮前の計算 | 目標表示高 |
| --------------------------- | -----: | -----------: | ---------: |
| `yamanashi-suzurin`         |   32cm |       約54px |     約54px |
| `yamanashi-houtoun`         |   38cm |       約59px |     約59px |
| `yamanashi-suzuri-tatsujin` |  120cm |      約105px |    約105px |
| `yamanashi-boss-suisho-ryu` |  350cm |      約180px |    約180px |

スズリンと硯達人の実寸比は3.75倍だが、画面上は約1.9倍へ圧縮される。小型キャラを読める大きさに保ちながら、設定上の明確な差を残す。

### Visible body bounds

目標値は画像キャンバス全体ではなく、透明でない身体領域の高さへ適用する。

```ts
const imageScale = targetBodyHeight / visibleBodyBounds.height;
```

- 128x128のアニメーションフレームに大きな透明余白があっても、余白を身体サイズとして数えない。
- 32px静止画と128pxアニメーションで、同じキャラの身体が同じ高さに見えるようにする。
- 待機・攻撃中に倍率が変わらないよう、採用するアニメーション全フレームの身体領域を包む安定した基準境界、または登録時に固定したニュートラル境界を使う。
- 足元の接地点を維持し、拡大縮小で上下へ浮かないようにする。
- 炎、光、墨飛沫などの一時VFXは身体領域へ含めない。

身体境界を実行中に毎フレーム走査しない。アセット登録時またはビルド時に一度求め、キャッシュされたメタデータを使う。

### Existing role sizes

`monsterDisplaySize()` の通常・中ボス・県ボス・地方ボス別固定サイズは、寸法データがある敵の最終倍率には使わない。

理由は、設定済みの `heightCm` にキャラ固有の大きさがすでに含まれており、ボス分類を重ねると同じ大きさを二重加算するためである。ボスを一律に巨大化しないという既存のサイズ設定方針も維持する。

`monsterDisplaySize()` は、図鑑など今回対象外の既存表示と、明示した互換フォールバックに限り維持する。

## Scope

### In scope

- 全敵のキャラ固有 `heightCm` を使った戦闘スプライト倍率
- 戦闘用の圧縮関数とレイアウト別最小・最大表示高
- 静止画・アニメーション双方の透明でない身体領域の扱い
- 既存サイズ設定からゲーム用データへの取り込みと網羅性検査
- デスクトップ・モバイルの単体テストと実ブラウザ検証

### Out of scope

- 主人公や仲間スプライトへの適用
- 体重による表示倍率
- バッグ占有サイズや進化段階による代用
- キャラクターの身長・体重設定値そのものの再設計
- 保存データ、戦闘能力、当たり判定、カメラズームの変更
- 個別IDごとの見た目倍率調整
- 元画像・アニメーションの再生成

## Tech Stack

- TypeScript
- Phaser 3
- JSONコンテンツデータ
- Vitest
- Playwright
- pnpmの既存スクリプト

新しい依存パッケージは追加しない。

## Project Structure

想定する変更範囲：

```text
content/character-body-sizes.json
  設定済み寸法から戦闘に必要な値だけを保持する。

src/core/content/
  独立した寸法データを検証・ロードする。Monster schemaと保存形式は変えない。

src/scenes/battle/monsterStage.ts
  heightCmをレイアウト別の目標身体高へ変換する純粋関数を置く。

src/rendering/monsterImageScale.ts
  透明でない身体領域と目標身体高から画像倍率を求める。

src/scenes/Battle.ts
  敵ID、寸法、レイアウト、登録済み身体境界を表示計算へ渡す。

tests/unit/
  データ網羅、圧縮関数、上下限、画像余白、足元基準を検証する。

tests/e2e/
  実際の戦闘画面で小型・中型・大型・ボスを比較する。
```

## Testing Strategy

### Unit tests

失敗テストを先に追加する。

1. 全ランタイム敵IDが寸法データまたは明示的な互換フォールバックを持つ。
2. `heightCm` は正の有限値で、取り込み元と一致する。
3. 同じレイアウトでは `heightCm` が大きいほど目標身体高が小さくならない。
4. 100cmが両レイアウトで96論理pxになる。
5. 10cmでもside view 48論理px・canonical depth view 60論理pxを下回らない。
6. 580cmでもside view 224論理px・canonical depth view 188論理pxを超えない。
7. 32cm、38cm、120cm、350cmが仕様の許容誤差内になる。
8. 画像解像度と透明余白が異なっても、同じ身体境界なら同じ表示高になる。
9. 待機・攻撃フレームを切り替えても固定倍率と足元位置が変わらない。
10. `weightKg`、バッグ占有サイズ、ボス分類を倍率へ混ぜない。

作業中：

```bash
pnpm test:related src/scenes/battle/monsterStage.ts src/rendering/monsterImageScale.ts
pnpm check:fast
```

### Browser verification

次を `960x540` と `640x360` で比較する。

- 10〜20cm級の最小クラス
- `yamanashi-suzurin`（32cm）
- `yamanashi-suzuri-tatsujin`（120cm）
- 100cm前後の基準クラス
- 300〜400cm級の大型敵
- 580cmの最大クラス
- 長い身体、広い翼、縦長、横長の代表

確認事項：

- 数値上の大小が画面上の大小として認識できる。
- 最小キャラのシルエットと待機動作を識別できる。
- 最大キャラが名前、HP、問題UI、主人公・仲間を覆わない。
- 透明余白の違いで同じ身長のキャラが不自然に変わらない。
- 待機・攻撃・KO復帰でサイズと足元が跳ねない。
- 横長・縦長画像の比率を崩さない。

### Final verification

```bash
pnpm lint
pnpm check:architecture
pnpm test
pnpm validate:content
pnpm build
```

統合担当として共有ブランチへ取り込む場合：

```bash
pnpm check:full
```

完了時は最新ビルドから確認用サーバーを起動し、アプリ内ブラウザで小型・硯達人・大型の代表画面を開く。

## Boundaries

### Always

- キャラ固有の `heightCm` を倍率計算の正にする。
- 画面上の身体高へ平方根圧縮と上下限を適用する。
- 透明余白ではなく見えている身体領域を測る。
- アニメーションと静止画を同じ縮尺規則へ通す。
- 取り込み元とのID・数値一致を自動検査する。

### Ask first

- 既存の身長・高さ設定値を変更する。
- 主人公・仲間へ同じ縮尺を適用する。
- 体重、全長、翼幅を追加の一律倍率として使う。
- カメラやHUD配置を再設計する。
- 新しい依存を追加する。

### Never

- バッグ占有マスや進化段階をキャラ固有寸法の代わりにする。
- 通常敵・ボス分類を `heightCm` へ重ねて二重に巨大化する。
- 画像キャンバスやフレームのピクセル数を身体の大きさとして扱う。
- モンスターIDごとの場当たり的な表示倍率を作る。
- 縦横比を崩す。

## Success Criteria

- `yamanashi-suzurin` 32cmと `yamanashi-suzuri-tatsujin` 120cmの差が、標準画面でおよそ54px対105pxとして見える。
- 10cm級の敵も最低48pxまたは40pxで識別できる。
- 580cm級の敵も標準224px・コンパクト168px以内に収まる。
- 100cm前後のキャラは現行の通常敵に近い表示高を保つ。
- 同じ身長なら、静止画とアニメーション、異なる透明余白でも同じ身体高に見える。
- ボスかどうかではなく、設定済みのキャラ寸法が相対表示を決める。
- 全542敵について、541件の設定値と1件の明示的互換フォールバックが検査される。
- 必須検査と実ブラウザ検証がすべて通る。

## Approval Point

本仕様では、設定済みの `heightCm` を戦闘へ採用し、100cmを現行通常敵相当として平方根圧縮する。体重・バッグ占有量・ボス分類は倍率へ使わない。

承認後、実装計画、失敗テスト、データ取り込み、コード実装、実ブラウザ調整へ進む。
