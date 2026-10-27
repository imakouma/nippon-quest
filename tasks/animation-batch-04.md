# Animation batch-04 制作記録

## 範囲と状態

- 正: `tasks/animation-batch-assignments.json` の `batch-04.ids`（110体）。
- 完了: 50体。
- 未着手: 60体（割当110体から下記完了50体を除いたもの）。
- 失敗: 0体。
- 共通ファイルや他batchは編集しない。ゲーム内で制作・検証できたものだけmanifestへ登録する。

## 完了

| ID                                      | 待機差分                   | 攻撃差分                       | 原本                                                                                               | ランタイム                                                                        | 状態               |
| --------------------------------------- | -------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------ |
| `aichi-denkikun`                        | 呼吸、葉の開閉、瞬き、火花 | 充電、前傾、放電、着地         | `docs/verification/animation-batch-04/generated-sources/aichi-denkikun.png`                        | `assets/sprites/animations/batch-04/aichi-denkikun-v1.png`                        | 制作・規格検査済み |
| `aichi-lastboss-oda-nobunaga`           | 肩呼吸、拳、瞬き、鎧の復帰 | 構え、踏み込み、前腕打撃、着地 | `docs/verification/animation-batch-04/generated-sources/aichi-lastboss-oda-nobunaga.png`           | `assets/sprites/animations/batch-04/aichi-lastboss-oda-nobunaga-v1.png`           | 制作・規格検査済み |
| `aichi-tebasakky`                       | 翼の開閉、瞬き、片足、復帰 | しゃがみ、跳躍、翼打撃、着地   | `docs/verification/animation-batch-04/generated-sources/aichi-tebasakky.png`                       | `assets/sprites/animations/batch-04/aichi-tebasakky-v1.png`                       | 制作・規格検査済み |
| `akita-hanabii`                         | 導火線、瞬き、呼吸         | ため、前傾、発光、着地         | `docs/verification/animation-batch-04/generated-sources/akita-hanabii.png`                         | `assets/sprites/animations/batch-04/akita-hanabii-v1.png`                         | 制作・規格検査済み |
| `akita-magewappan`                      | 蓋とご飯、瞬き             | 踏ん張り、蓋、体当たり、着地   | `docs/verification/animation-batch-04/generated-sources/akita-magewappan.png`                      | `assets/sprites/animations/batch-04/akita-magewappan-v1.png`                      | 制作・規格検査済み |
| `chiba-boss-shoyu-ryu`                  | 尾、ひげ、瞬き             | とぐろ、球、爪の突進、復帰     | `docs/verification/animation-batch-04/generated-sources/chiba-boss-shoyu-ryu.png`                  | `assets/sprites/animations/batch-04/chiba-boss-shoyu-ryu-v1.png`                  | 制作・規格検査済み |
| `chiba-lastboss-ino-tadataka`           | 地図、杖、瞬き             | 構え、歩み、測量杖、復帰       | `docs/verification/animation-batch-04/generated-sources/chiba-lastboss-ino-tadataka.png`           | `assets/sprites/animations/batch-04/chiba-lastboss-ino-tadataka-v1.png`           | 制作・規格検査済み |
| `chiba-sharirin`                        | 葉、瞬き、呼吸             | しゃがみ、転がり、体当たり     | `docs/verification/animation-batch-04/generated-sources/chiba-sharirin.png`                        | `assets/sprites/animations/batch-04/chiba-sharirin-v1.png`                        | 制作・規格検査済み |
| `ehime-jakotendai`                      | ヒレ、帽子、瞬き           | 圧縮、ヒレ、魚体突進、復帰     | `docs/verification/animation-batch-04/generated-sources/ehime-jakotendai.png`                      | `assets/sprites/animations/batch-04/ehime-jakotendai-v1.png`                      | 制作・規格検査済み |
| `ehime-midboss-yuamisagi`               | 翼、湯気、瞬き             | しゃがみ、翼、風攻撃、着地     | `docs/verification/animation-batch-04/generated-sources/ehime-midboss-yuamisagi.png`               | `assets/sprites/animations/batch-04/ehime-midboss-yuamisagi-v1.png`               | 制作・規格検査済み |
| `gifu-ukaidori`                         | 呼吸、瞬き、魚の傾き       | しゃがみ、魚槍の突き、復帰     | `docs/verification/animation-batch-04/generated-sources/gifu-ukaidori.png`                         | `assets/sprites/animations/batch-04/gifu-ukaidori-v1.png`                         | 制作・規格検査済み |
| `gunma-dosshirikon`                     | 弾性変形、瞬き             | 圧縮、横膨張、体当たり、復帰   | `docs/verification/animation-batch-04/generated-sources/gunma-dosshirikon.png`                     | `assets/sprites/animations/batch-04/gunma-dosshirikon-v1.png`                     | 制作・規格検査済み |
| `gunma-lastboss-nitta-yoshisada`        | 鎧の呼吸、旗の揺れ         | 構え、旗槍の突き、復帰         | `docs/verification/animation-batch-04/generated-sources/gunma-lastboss-nitta-yoshisada.png`        | `assets/sprites/animations/batch-04/gunma-lastboss-nitta-yoshisada-v1.png`        | 制作・規格検査済み |
| `hiroshima-boss-momiji-ryu`             | 呼吸、瞬き、両腕と紅葉角   | 両腕の引き、紅葉角の薙ぎ、復帰 | `docs/verification/animation-batch-04/generated-sources/hiroshima-boss-momiji-ryu.png`             | `assets/sprites/animations/batch-04/hiroshima-boss-momiji-ryu-v1.png`             | 制作・規格検査済み |
| `hiroshima-kasaneyakin`                 | 呼吸、瞬き、炎とヘラ       | ヘラの振りかぶり、斬撃、復帰   | `docs/verification/animation-batch-04/generated-sources/hiroshima-kasaneyakin.png`                 | `assets/sprites/animations/batch-04/hiroshima-kasaneyakin-v1.png`                 | 制作・規格検査済み |
| `hiroshima-setolemon`                   | 弾性変形、瞬き、葉         | 圧縮、回転突進、復帰           | `docs/verification/animation-batch-04/generated-sources/hiroshima-setolemon.png`                   | `assets/sprites/animations/batch-04/hiroshima-setolemon-v1.png`                   | 制作・規格検査済み |
| `hokkaido-boss-higuma-daio`             | 呼吸、瞬き、鮭の尾         | しゃがみ、両爪打撃、復帰       | `docs/verification/animation-batch-04/generated-sources/hokkaido-boss-higuma-daio.png`             | `assets/sprites/animations/batch-04/hokkaido-boss-higuma-daio-v1.png`             | 制作・規格検査済み |
| `hokkaido-islandboss-shirogane-oowashi` | 翼の開閉、瞬き、羽毛       | 翼を畳む、突風の両翼打撃、復帰 | `docs/verification/animation-batch-04/generated-sources/hokkaido-islandboss-shirogane-oowashi.png` | `assets/sprites/animations/batch-04/hokkaido-islandboss-shirogane-oowashi-v1.png` | 制作・規格検査済み |
| `hokkaido-kitakon`                      | 瞬き、耳、尾               | しゃがみ、跳躍、尾撃、着地     | `docs/verification/animation-batch-04/generated-sources/hokkaido-kitakon.png`                      | `assets/sprites/animations/batch-04/hokkaido-kitakon-v1.png`                      | 制作・規格検査済み |
| `hokkaido-midboss-setsuzo-golem`        | 体の上下、瞬き、拳         | 両拳を引く、叩き付け、復帰     | `docs/verification/animation-batch-04/generated-sources/hokkaido-midboss-setsuzo-golem.png`        | `assets/sprites/animations/batch-04/hokkaido-midboss-setsuzo-golem-v1.png`        | 制作・規格検査済み |

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

### 追加5体

- `gifu-ukaidori`: 黒灰の鵜、白い頬、魚、短い足を固定。魚を傾ける待機、魚槍の突進。出力 `exec-824dd9e2-2aa3-4a5b-ae2d-e94d718dee81.png`。
- `gunma-dosshirikon`: 灰色のこんにゃく体、白い結び、斑点を固定。弾性待機、圧縮からの体当たり。出力 `exec-ee7e306b-81c8-4ffb-9bf6-0e09cb218055.png`。
- `gunma-lastboss-nitta-yoshisada`: 紺金の鎧、角兜、白紺の旗を固定。旗の揺れ、旗槍の突進。出力 `exec-c052d40c-fac7-4c76-9f76-33f551f5f050.png`。
- `hiroshima-boss-momiji-ryu`: 青い龍、冠、腕2本、紅葉角、巻いた下半身を固定。腕と紅葉角の待機、両腕の薙ぎ。出力 `exec-5f2a26af-39c3-48f3-9a31-4595ec0cca8b.png`。
- `hiroshima-kasaneyakin`: 黄・茶・緑の層、炎3つ、ヘラ1本を固定。炎とヘラの待機、ヘラの振り下ろし。出力 `exec-c22544d5-b213-437f-ab31-ec8d6be67aa7.png`。

### 追加5体（北海道まで）

- `hiroshima-setolemon`: 黄色いレモン体、葉1枚、黒帯の蓋を固定。弾性待機、回転突進。出力 `exec-00b26a11-05fd-4c4b-bc21-624e1381db50.png`。
- `hokkaido-boss-higuma-daio`: 冠、熊の腕脚、雪、口の鮭を固定。鮭の尾待機、両爪の叩き付け。出力 `exec-04a93414-819e-4523-b31c-07835000f2ec.png`。
- `hokkaido-islandboss-shirogane-oowashi`: 白い大鷲、翼2枚、冠、胸羽、鳥足を固定。翼待機、突風の両翼打撃。出力 `exec-915a9a2d-0ae1-49cc-8939-c397225797e6.png`。
- `hokkaido-kitakon`: 橙の狐、耳2、四肢、尾1本、頭の飾りを固定。耳尾待機、跳躍と尾撃。出力 `exec-a786cc0f-dd75-4e99-b609-bb4262a6d174.png`。
- `hokkaido-midboss-setsuzo-golem`: 氷雪ブロック、冠、腕2、脚2、台座を固定。拳待機、両拳の叩き付け。出力 `exec-28cee4e1-20ff-460e-8fcb-2c9b77d9afc2.png`。

### 追加10体（兵庫〜香川）

- `hyogo-boss-shirasagi-tenshu`: 白い三層城、黒屋根、金飾りを固定。構造の待機、城全体の体当たり。出力 `exec-e01a9602-6a46-472f-aadc-1bdba8a93bdc.png`。
- `hyogo-midboss-tajima-mogyu`: 黒牛、角2本、四肢、鼻輪を固定。角の待機、頭を下げた突進。出力 `exec-f11c6483-d9b0-43ce-8150-193c6105f95d.png`。
- `hyogo-takotsubo-daisho`: 橙のタコ、壺兜、触手8本を固定。触手待機、前方への触手打撃。出力 `exec-f41e96ea-5ddb-4696-8999-9254eb3f2683.png`。
- `ibaraki-boss-tsukuba-gama-o`: 冠の大ガマ、四肢、腹を固定。喉腹の待機、跳躍体当たり。出力 `exec-6d33a575-0eba-4f64-ac60-9ab231c0785b.png`。
- `ibaraki-lastboss-tokugawa-nariaki`: 紫鎧、花兜、軍配1本を固定。軍配待機、前方薙ぎ。出力 `exec-f21529b8-7849-4967-98c3-21ecb99ee283.png`。
- `ibaraki-renkonta`: 接続した蓮根2体と各根足を固定。交互待機、双体回転突進。出力 `exec-7c6933e4-3f72-45af-8247-d3ed2143bbe8.png`。
- `ishikawa-gosai-musha`: 彩色木偶、鉢巻、花模様、木台を固定。傾き待機、胴体打撃。出力 `exec-a181eae2-6143-44df-b5dc-bd8f2baeb8a4.png`。
- `ishikawa-kinran-ageha`: 金の蝶、翼2枚、黒胴、天蓋を固定。羽ばたき待機、両翼の突風打撃。出力 `exec-b712a5fa-06cb-4bda-ae62-1dd9b87ff7e8.png`。
- `ishikawa-wajimanurin`: 赤漆椀、金縁、台座を固定。椀の傾き待機、回転打撃。出力 `exec-2177c438-e20a-4615-ace9-3adcd003614b.png`。
- `kagawa-lastboss-hiraga-gennai`: 紺の羽織、灰袴、髷を固定。袖の待機、火花を伴う掌打。出力 `exec-702b964a-14f7-4131-ae3f-92b920ff04b8.png`。

### 追加10体（香川〜甲信越）

- `kagawa-oozenigani`: 銭形の蟹、爪2、眼柄2、歩脚を固定。爪待機、両鋏打撃。出力 `exec-b3961cf3-9efa-4f5c-add7-944b0244cfbb.png`。
- `kagoshima-boss-sakurajimaguma`: 冠岩、巨腕2、脚2、溶岩亀裂を固定。溶岩待機、両拳の地面打撃。出力 `exec-f1ba9c5f-159a-4949-a7f1-50a514ddee9a.png`。
- `kagoshima-lastboss-saigo-takamori`: 紺服の武人と黄犬1匹を固定。犬と袖の待機、前腕打撃。出力 `exec-a52fda99-c3d7-4131-a67b-ac715a1355a1.png`。
- `kagoshima-roppaku-boo`: 黒豚、四肢、芋1個を固定。耳鼻待機、芋を抱えた突進。出力 `exec-488b0f9e-587f-44cd-9339-65d9f73cb596.png`。
- `kanagawa-himitsubakon`: 寄木細工の箱、顔板、短い足を固定。板の待機、箱の回転打撃。出力 `exec-62e1bd58-b984-48bc-8d69-57fa791ce824.png`。
- `kanagawa-lastboss-minamoto-yoritomo`: 白紺鎧、金兜、旗1本を固定。旗待機、旗槍の突進。出力 `exec-d7f66d33-6bdb-4a67-80d3-bfcaadbf3393.png`。
- `kanto-islandboss-nanatsu-kage`: 暗色の影獣、光輪、七尾を固定。尾の波動待機、七尾の一斉打撃。出力 `exec-d0819fe2-78fd-4925-86fc-f560eb1fe84a.png`。
- `kochi-homura-katsuo`: 青い鰹、銀腹、炎5つを固定。炎待機、炎を引く魚体突進。出力 `exec-78638bf3-d3d4-4442-8211-75c64ddc5cd8.png`。
- `kochi-midboss-narukomai`: 冠、赤衣、腕2、鳴子2、足3を固定。鳴子待機、両鳴子打撃。出力 `exec-6fe0645b-d827-46cf-a50b-7c5356f59b73.png`。
- `koshinetsu-islandboss-senrin-utsuro`: 黒い術者、帽、扇4枚、台座を固定。扇待機、四扇の斬撃。出力 `exec-109bfdc6-8d19-4369-8951-882720a3e142.png`。

## 検証記録

- RED: manifestが空の状態で `tests/unit/animation-batch-04.test.ts` の3体登録テストが意図どおり失敗。
- PNG: 50体とも512×256、RGBA、4列2行の契約。
- 実ゲーム: 4180で3体の待機、横向きスマホの通常攻撃・攻撃わざ・復帰・KOが成功。PCは初期ロードが60秒を超える不安定さがあり再検証中。

## 統合担当への提案

- 現時点で共通コード変更は不要。既存のmanifest自動集約で接続できる。
- 110体すべてが終わるまで本記録を完了扱いにしない。
