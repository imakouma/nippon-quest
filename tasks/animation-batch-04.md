# Animation batch-04 制作記録

## 範囲と状態

- 正: `tasks/animation-batch-assignments.json` の `batch-04.ids`（110体）。
- 完了: 3体。
- 未着手: 107体（割当110体から下記完了3体を除いたもの）。
- 失敗: 0体。
- 共通ファイルや他batchは編集しない。ゲーム内で制作・検証できたものだけmanifestへ登録する。

## 完了

| ID                            | 待機差分                   | 攻撃差分                       | 原本                                                                                     | ランタイム                                                              | 状態               |
| ----------------------------- | -------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------ |
| `aichi-denkikun`              | 呼吸、葉の開閉、瞬き、火花 | 充電、前傾、放電、着地         | `docs/verification/animation-batch-04/generated-sources/aichi-denkikun.png`              | `assets/sprites/animations/batch-04/aichi-denkikun-v1.png`              | 制作・規格検査済み |
| `aichi-lastboss-oda-nobunaga` | 肩呼吸、拳、瞬き、鎧の復帰 | 構え、踏み込み、前腕打撃、着地 | `docs/verification/animation-batch-04/generated-sources/aichi-lastboss-oda-nobunaga.png` | `assets/sprites/animations/batch-04/aichi-lastboss-oda-nobunaga-v1.png` | 制作・規格検査済み |
| `aichi-tebasakky`             | 翼の開閉、瞬き、片足、復帰 | しゃがみ、跳躍、翼打撃、着地   | `docs/verification/animation-batch-04/generated-sources/aichi-tebasakky.png`             | `assets/sprites/animations/batch-04/aichi-tebasakky-v1.png`             | 制作・規格検査済み |

## 生成記録

- 方式: built-in imagegen。外部課金API、fal、OmniRoute、追加資格情報は不使用。
- 入力: 各IDの `dist/pixels/<id>.png` を正、`dist/sheets/<id>.jpg` を補助参照として生成前に目視。
- 共通指定: 透明RGBA、4列2行、上段 idle 4コマ・下段 attack 4コマ、同じ顔・輪郭・パレット・付属物・基準点、粗いpixel art、文字・影・背景なし、単なる平行移動や全体拡縮ではない形状差分。
- 出力: built-in imagegenの2:1 RGBA原本を保存し、FFmpegのnearest-neighborで512×256へ機械整形。32px化はしていない。

### `aichi-denkikun`

- プロンプト固有部: 丸い黄色の柑橘/電球の体、薄黄色の縁、橙色の顔、縦長の目、桃色の頬、小さい笑顔、黒黄の取っ手、緑の3枚葉を固定。idleは呼吸・葉の開閉・瞬き・復帰、attackは充電・前傾・輪郭を変形した放電・着地。腕や脚を追加しない。
- built-in出力: `exec-ef97a675-eb2a-4c83-9b84-3541365a0645.png`（1774×887 RGBA）。

### `aichi-lastboss-oda-nobunaga`

- プロンプト固有部: 紺黒の兜、金帯、赤中心の金前立て、険しい目、口ひげ、灰黒の鎧、金の肩帯、赤い胸/腰線、素手と短い靴を固定。idleは肩呼吸・拳・瞬き・復帰、attackは構え・踏み込み・前腕打撃・着地。武器や外套を追加しない。
- built-in出力: `exec-4cf04d05-e096-4dc8-aae4-859ef70ddd4c.png`（1774×887 RGBA）。

### `aichi-tebasakky`

- プロンプト固有部: 黄金色の丸い体、茶色い手羽先の翼2枚、胡麻のハイライト、赤い鶏冠、縦長の目、黄の角形くちばし、桃色の頬、短い鳥足2本を固定。idleは翼の開閉・瞬き・片足、attackはしゃがみ・跳躍・翼打撃・着地。腕、手、人間脚、余分な翼を追加しない。
- built-in出力: `exec-dbd2c696-e20b-40c9-804d-4e20a5c68a2d.png`（1774×887 RGBA）。

## 検証記録

- RED: manifestが空の状態で `tests/unit/animation-batch-04.test.ts` の3体登録テストが意図どおり失敗。
- PNG: 3体とも512×256、RGBA、4列2行の契約。
- 実ゲーム: 未実施（次のチェックポイントでPC/横向きスマホの待機、通常攻撃、攻撃わざ、復帰、KOを記録する）。

## 統合担当への提案

- 現時点で共通コード変更は不要。既存のmanifest自動集約で接続できる。
- 110体すべてが終わるまで本記録を完了扱いにしない。
