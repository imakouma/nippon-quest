# Animation batch-04 制作記録

## 範囲と状態

- 正: `tasks/animation-batch-assignments.json` の `batch-04.ids`（110体）。
- 完了: 20体。
- 未着手: 90体（割当110体から下記完了20体を除いたもの）。
- 失敗: 0体。
- 共通ファイルや他batchは編集しない。ゲーム内で制作・検証できたものだけmanifestへ登録する。

## 完了

| ID                            | 待機差分                   | 攻撃差分                       | 原本                                                                                     | ランタイム                                                              | 状態               |
| ----------------------------- | -------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------ |
| `aichi-denkikun`              | 呼吸、葉の開閉、瞬き、火花 | 充電、前傾、放電、着地         | `docs/verification/animation-batch-04/generated-sources/aichi-denkikun.png`              | `assets/sprites/animations/batch-04/aichi-denkikun-v1.png`              | 制作・規格検査済み |
| `aichi-lastboss-oda-nobunaga` | 肩呼吸、拳、瞬き、鎧の復帰 | 構え、踏み込み、前腕打撃、着地 | `docs/verification/animation-batch-04/generated-sources/aichi-lastboss-oda-nobunaga.png` | `assets/sprites/animations/batch-04/aichi-lastboss-oda-nobunaga-v1.png` | 制作・規格検査済み |
| `aichi-tebasakky`             | 翼の開閉、瞬き、片足、復帰 | しゃがみ、跳躍、翼打撃、着地   | `docs/verification/animation-batch-04/generated-sources/aichi-tebasakky.png`             | `assets/sprites/animations/batch-04/aichi-tebasakky-v1.png`             | 制作・規格検査済み |
| `akita-hanabii`               | 導火線、瞬き、呼吸         | ため、前傾、発光、着地         | `docs/verification/animation-batch-04/generated-sources/akita-hanabii.png`               | `assets/sprites/animations/batch-04/akita-hanabii-v1.png`               | 制作・規格検査済み |
| `akita-magewappan`            | 蓋とご飯、瞬き             | 踏ん張り、蓋、体当たり、着地   | `docs/verification/animation-batch-04/generated-sources/akita-magewappan.png`            | `assets/sprites/animations/batch-04/akita-magewappan-v1.png`            | 制作・規格検査済み |
| `chiba-boss-shoyu-ryu`        | 尾、ひげ、瞬き             | とぐろ、球、爪の突進、復帰     | `docs/verification/animation-batch-04/generated-sources/chiba-boss-shoyu-ryu.png`        | `assets/sprites/animations/batch-04/chiba-boss-shoyu-ryu-v1.png`        | 制作・規格検査済み |
| `chiba-lastboss-ino-tadataka` | 地図、杖、瞬き             | 構え、歩み、測量杖、復帰       | `docs/verification/animation-batch-04/generated-sources/chiba-lastboss-ino-tadataka.png` | `assets/sprites/animations/batch-04/chiba-lastboss-ino-tadataka-v1.png` | 制作・規格検査済み |
| `chiba-sharirin`              | 葉、瞬き、呼吸             | しゃがみ、転がり、体当たり     | `docs/verification/animation-batch-04/generated-sources/chiba-sharirin.png`              | `assets/sprites/animations/batch-04/chiba-sharirin-v1.png`              | 制作・規格検査済み |
| `ehime-jakotendai`            | ヒレ、帽子、瞬き           | 圧縮、ヒレ、魚体突進、復帰     | `docs/verification/animation-batch-04/generated-sources/ehime-jakotendai.png`            | `assets/sprites/animations/batch-04/ehime-jakotendai-v1.png`            | 制作・規格検査済み |
| `ehime-midboss-yuamisagi`     | 翼、湯気、瞬き             | しゃがみ、翼、風攻撃、着地     | `docs/verification/animation-batch-04/generated-sources/ehime-midboss-yuamisagi.png`     | `assets/sprites/animations/batch-04/ehime-midboss-yuamisagi-v1.png`     | 制作・規格検査済み |

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

### 追加7体

- `akita-hanabii`: 球形花火、青帯、導火線2本、足2本を固定。導火線の交互点火・瞬き・発光する体当たり。出力 `exec-43f583e8-a7fc-4fde-b759-5c20afbe5d69.png`。
- `akita-magewappan`: 曲げわっぱ、米、梅干し、縦留め具、腕足を固定。蓋/米の上下・瞬き・箱の体当たり。出力 `exec-220dbc15-42ef-48d4-870a-5eadee51aedc.png`。
- `chiba-boss-shoyu-ryu`: 冠、角、ひげ、爪、金鱗の尾、球、樽を固定。尾とひげの待機・球と爪の前進。出力 `exec-8a1be106-badf-467f-8b02-f02942b0e27f.png`。
- `chiba-lastboss-ino-tadataka`: 笠、白髪、紺服、袴、測量杖、地図を固定。地図の待機・測量杖を前へ出す動作。出力 `exec-87392f89-10f3-41fe-a61d-a1db4fff3468.png`。
- `chiba-sharirin`: 梨の斑点、茎、葉1枚、小さい足を固定。葉の揺れ・梨の体当たり。出力 `exec-8c0656e6-8ef3-4332-804d-2b3346bce25f.png`。
- `ehime-jakotendai`: 茶色の魚体、青い帽子/台/ヒレ2枚を固定し、手足を追加しない。ヒレ待機・魚体突進。出力 `exec-79df2a67-49a6-4a7c-bc7e-e6b152e12ff2.png`。
- `ehime-midboss-yuamisagi`: 白鳥の体、冠、翼2枚、鳥足2本、湯気、青い台を固定。翼/湯気待機・翼の風攻撃。出力 `exec-8d4b07e6-7b1c-41ad-a90f-63fda6e33b7e.png`。
- 並列生成時に出力側安全判定の一時拒否が1回発生。外部APIへ切り替えず、対象を個別再実行して7体すべて生成できた。

### 追加10体

- `fukui-fukui-raptor`: 恐竜の腕2・脚2・尾を固定。尾待機、しゃがみ、尾を使った前進。出力 `exec-68594465-2337-45bd-b073-d2a6e9601b88.png`。
- `fukui-megane-hakase`: 黄の眼鏡形ボディ、大レンズ、取っ手、足2本を固定。レンズ瞬き、圧縮、レンズ体当たり。出力 `exec-b5d60661-6963-4c49-b36c-384b575f6134.png`。
- `fukui-suisenko`: 白い花、黄の顔、葉2枚、茎足を固定。葉待機、茎の屈伸、両葉攻撃。出力 `exec-96275f5c-b21a-445d-9c0f-5ad981401a3f.png`。
- `fukuoka-donkomaru`: 青い舟の体、笠、船、波、竹竿を固定。波の上下、竿振り、船の突進。出力 `exec-db440f8e-4344-49db-b683-18097f700aa6.png`。
- `fukuoka-rokuro-kanna`: 茶色いろくろ体、渦頬、上下台を固定。回転待機、ひねり、回転攻撃。出力 `exec-00336121-0519-4d7e-89fc-39e226cddc92.png`。
- `fukuoka-tobikanna`: 斑点の茶色い器、上下の輪を固定。揺れ、圧縮、回転攻撃。出力 `exec-9d98648f-cace-4a5b-b7df-a2d9a327c865.png`。
- `fukushima-boss-tsurugajo-no-nushi`: 鶴の翼2枚・脚2本・城型の兜と胸当てを固定。羽呼吸、翼を引く、両翼攻撃。出力 `exec-b6e56798-7755-44fe-9eb4-b0612be85cd4.png`。
- `fukushima-lastboss-gamo-ujisato`: 双角兜と茶鎧を固定。肩呼吸、踏み込み、前腕打撃。出力 `exec-030bdf7e-95e0-4c64-837f-95a30b304ecb.png`。
- `gifu-boss-gassho-daiou`: 合掌造りの家、冠煙突、窓目、基礎足を固定。屋根呼吸、傾き、家の体当たり。出力 `exec-e90b0b89-4eed-4316-8f1e-c00cfadb186f.png`。
- `gifu-lastboss-saito-dosan`: 青金兜、灰ひげ、緑黒鎧を固定。肩呼吸、踏み込み、前腕打撃。出力 `exec-3ad92378-cae0-477e-b684-b1b7393f6bca.png`。

## 検証記録

- RED: manifestが空の状態で `tests/unit/animation-batch-04.test.ts` の3体登録テストが意図どおり失敗。
- PNG: 20体とも512×256、RGBA、4列2行の契約。
- 実ゲーム: 4180で3体の待機、横向きスマホの通常攻撃・攻撃わざ・復帰・KOが成功。PCは初期ロードが60秒を超える不安定さがあり再検証中。

## 統合担当への提案

- 現時点で共通コード変更は不要。既存のmanifest自動集約で接続できる。
- 110体すべてが終わるまで本記録を完了扱いにしない。
