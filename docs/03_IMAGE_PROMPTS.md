# 03 — 画像生成・編集プロンプト集

> **2026-09 更新：素材の規格（ドットの大きさ・コマ数）・パレット NQ-48・共通スタイル文・素材別プロンプトは `06_ART_BIBLE.md` にまとめました。数値が食い違うときは docs/06 が正です。**
> このファイルは「AI で大きく生成 → スクリプトで縮小・減色 → 手直し」の流れ、ChatGPT での編集、後処理スクリプト（§6〜§8）の説明として使ってください。

> 画像生成AI（Gemini の画像生成／ChatGPT の画像生成・編集）でドット絵素材を作るための **スタイルの固定方法、プロンプトの型、後処理の手順** です。
>
> **最初に知っておくこと：** 画像生成AIは「ドット絵っぽい絵」は得意ですが、**本物のピクセルグリッド（1ドット＝1ピクセル、透過背景、スプライトシートの正確な並び）は苦手** です。なので流れは必ず
> **①AIで大きめに生成 → ②スクリプトで縮小・減色・グリッド整列（§7） → ③Aseprite/Piskel で手直し** にします。①だけで完成品を作ろうとしないでください。

---

## 1. 命名規則と規格（コードと一致させる。変更したら `01_ARCHITECTURE.md` も直す）

| 種別 | 規格 | パス／キー |
|---|---|---|
| 主人公・NPC 歩行 | **16×24px** の全身、4方向×3コマ（列＝右足・立ち・左足、行＝下・左・右・上）＝ 48×96 シート、透過PNG。バトル用は 96×24（左向き 6 ポーズ） | `assets/sprites/characters/<id>.png` / キー `char.<id>`（バトル `char.<id>.battle`） |
| モンスター（戦闘） | **32×32px**（中ボス 40×40 / 県ボス 48×48 / 地方ボス 56×56）、正面、透過PNG、待機2コマ。バトルでは ×4 表示 | `assets/sprites/monsters/<id>.png` / `mon.<id>` |
| モンスター（フィールド） | 32×32px（フィールドに立つ中ボスのシンボル。王冠つき） | `assets/sprites/monsters/<id>-field.png` / `mon.<id>.field` |
| 顔グラ（会話用） | **48×48px**、透過（×2 表示） | `assets/portraits/<id>.png` / `face.<id>` |
| アイテム・装備アイコン | **16×16px**、透過（メニューで ×3） | `assets/items/<id>.png` / `item.<id>` |
| 名所（図鑑・イベントカットイン） | **240×135px**（カットインで ×2、バトル背景に流用するときは ×4） | `assets/motifs/<area>/<motifId>.png` / `motif.<area>.<motifId>` |
| タイルセット | 16×16px タイル、1枚 256×256（16×16 タイル）、透過 | `assets/tilesets/<name>.png` / `tiles.<name>` |
| 島マップ背景（島全体の俯瞰） | 960×540px | `assets/maps/<island>-overview.png` |
| UI 部品（枠・ボタン・バー） | 9-slice 用 48×48px 等 | `assets/ui/<name>.png` / `ui.<name>` |
| 問題用の絵（picture-word など） | 128×128px、透過（ドット絵、背景なし） | `assets/questions/<subject>/<word>.png` / 問題 JSON から相対参照 |

- パレットは **プロジェクト共通の 48 色 NQ-48**（`src/rendering/palette.ts` と `assets/palette/nq48.gpl` / `nq48.hex`。一覧は docs/06 §3）。全素材をこのパレットに減色して統一感を出す。
- `<id>` は content の `spriteKey` / `iconKey` / `imageKey` と一致。小文字・ハイフン。

---

## 2. スタイルアンカー（全プロンプトの先頭に付ける共通文）

英語の方が画像モデルの安定性が高いので、共通部は英語で固定し、モチーフ部分だけ差し替えます。

```
STYLE (always include):
16-bit era Japanese RPG pixel art, SNES/Super Famicom style, clean pixel grid, 
crisp hard edges, NO anti-aliasing, NO blur, NO gradients, limited palette (max 32 colors), 
1px dark outline, flat cel shading with 2 tones per color, cheerful and friendly for children aged 6-12, 
solid flat background color #FF00FF (magenta) for easy removal, centered subject, no text, no watermark.
```

- 背景を **透過** と書くより、**単色マゼンタ** にして後で抜く方が確実。
- 「かわいい・親しみやすい・怖すぎない」を毎回入れる（恐山系も「子どもが好きなちょっと不気味」まで）。
- 同じキャラの差分（別ポーズ・別方向）は **新規生成せず、最初の1枚を参照画像にして編集で作る**（§6）。

---

## 3. 主人公・NPC

### 3.1 主人公（基準デザインシート → 歩行スプライト）

まず「キャラクターシート」を1枚作り、以降すべての参照元にする。

```
[STYLE]
Character design sheet of the hero of a children's RPG set in Japan: a cheerful 10-year-old adventurer, 
gender-neutral, short dark hair with a red headband, blue happi-style jacket over a white shirt, 
short pants, sneakers, small backpack. 
Show the SAME character in 4 views side by side on one row: front, back, left side, right side. 
Chibi proportions (2.5 heads tall). Sprite size reference 32x32 pixels, drawn at 8x scale.
```

歩行アニメ（1方向ずつ、シートを参照画像にして）：

```
[STYLE]
Using the attached character sheet as the exact reference, draw a 3-frame walk cycle of this character 
facing FRONT (toward the viewer): frame 1 left foot forward, frame 2 standing neutral, frame 3 right foot forward. 
Arrange the 3 frames horizontally with equal spacing on a magenta background. Keep colors and outfit identical.
```
→ 「FRONT」を BACK / LEFT SIDE / RIGHT SIDE に変えて計4回。§7 のスクリプトで 32×32 × 3×4 のシートに整列。

### 3.2 見た目バリエーション（髪色・肌色・服色）

生成せず、§7 の **パレットスワップ** で作る（3×3×3＝27通りを画像で作ると破綻する）。主人公の髪・肌・服はそれぞれ専用の色番号（2トーンずつ）を使い、コードで置換。

### 3.3 NPC（町の人）

```
[STYLE]
Front-facing idle pose of a friendly NPC for a Japanese RPG town in Aomori prefecture: 
an elderly apple farmer woman wearing a straw hat and a work apron, holding a basket of red apples, 
smiling. Chibi proportions (2.5 heads), 32x32 pixel sprite reference drawn at 8x scale, magenta background.
```
テンプレ：`an [年齢・性別] [職業] wearing [服] holding [県の特産品], [表情]`。県ごとに 4 人（ショップ・かじ屋・宿屋・掲示板）＋モブ 2〜3 人。

### 3.4 顔グラ（会話ウィンドウ用）

```
[STYLE]
Bust-up portrait (head and shoulders) of the attached character, facing slightly left, [happy / surprised / thinking] expression, 
96x96 pixel reference drawn at 6x scale, magenta background, consistent with the reference sheet.
```
表情は 3〜4 種（ふつう・笑顔・おどろき・こまった）。

---

## 4. モンスター・ボス

### 4.1 設計の考え方（プロンプトを書く前に）

1 体につき **「モチーフ（県の名所/特産品）× 生き物の型 × 属性」** を決めてからプロンプト化する。`content/monsters/*.json` の `motifId` と `element` がそのまま材料。

| 例（青森） | モチーフ | 生き物の型 | 属性 | 名前案 |
|---|---|---|---|---|
| 通常 | りんご | 丸いスライム | モリ | リンゴロン |
| 通常 | ねぶた | 灯籠を背負った戦士 | ヒノ | ネブタン |
| 通常 | 大間のマグロ | 魚が二本足で立つ | ミズ | マグロード |
| 通常 | 三内丸山の土偶 | 土偶ゴーレム | ツチ | ドグウくん |
| 仲間候補 | 恐山のイタコ／カラス | 黒い鳥 | ヤミ | イタコドリ |
| 県ボス | 津軽海峡＋十和田湖 | 湖の大蛇（りんごの冠） | ミズ | ツガルのぬし |

- **自治体のご当地キャラ（マスコット）・企業キャラ・アニメキャラは題材にしない。** 「りんご」「ねぶた（祭りそのもの）」「土偶」のような一般名詞・文化財・自然物を使う。
- 名前は必ず造語。実在の商品名・商標を含めない。

### 4.2 通常モンスター

```
[STYLE]
Battle sprite of a cute RPG monster for children, front view, idle pose, 64x64 pixel reference drawn at 6x scale.
Concept: a round slime monster made of a shiny red Aomori apple, with a leaf on top acting like a hat, 
small stubby arms, big friendly eyes, tiny fangs. Element: GRASS (green accents). 
Slightly mischievous but not scary. Magenta background.
```
テンプレ：`Concept: a [生き物の型] monster based on [モチーフ, 県名], [特徴 2〜3 個]. Element: [属性] ([色アクセント]). [性格].`

待機アニメ 2 コマ目：参照画像を添付して
```
Using the attached sprite as exact reference, draw the same monster in a second idle frame: 
slightly squashed (breathing in), everything else identical. Magenta background.
```

### 4.3 県ボス（96×96）

```
[STYLE]
Boss battle sprite, front view, imposing but not frightening for kids, 96x96 pixel reference drawn at 6x scale.
Concept: the guardian spirit of Lake Towada and the Tsugaru Strait, Aomori — a large serene water serpent 
with a crown made of red apples, scales in deep blue and teal, glowing pale-blue eyes, 
a small Jomon-pottery pattern along its body. Element: WATER. 
Pose: coiled, head raised, looking at the player. Magenta background.
```

### 4.4 地方ボス（128×128、3 フェーズ）

```
[STYLE]
Final boss of the Tohoku region, 128x128 pixel reference drawn at 5x scale, front view.
Concept: "the Lord of the Six Winters" — a towering figure whose body is made of snow and ice, 
wearing a Nebuta-lantern mask (Aomori), a Namahage-style straw cape (Akita), holding a Nambu ironware kettle (Iwate) 
as a weapon, with cherries (Yamagata) and a red Akabeko cow charm (Fukushima) hanging from its belt, 
Date Masamune-style crescent-moon crest (Miyagi) on the forehead. 
Majestic, a little intimidating, still stylized and child-friendly. Magenta background.
```
フェーズ 2・3 は参照画像を添付して「同じボスの、氷が割れて中の炎が見えている状態」「氷が溶けて小さくなり、笑顔で降参している状態」など差分編集。

### 4.5 フィールド用（仲間として連れ歩く 32×32）

```
Using the attached battle sprite as exact reference, redraw this monster as a tiny 32x32 pixel overworld sprite 
(drawn at 8x scale), simplified, facing FRONT, 2-frame walk (bobbing). Keep the silhouette recognizable. Magenta background.
```

---

## 5. タイルセット・マップ・UI・アイテム

### 5.1 タイルセット（県のフィールド）

```
[STYLE]
Top-down RPG tileset sheet for an overworld field in Aomori prefecture, Japan. 16x16 pixel tiles drawn at 8x scale, 
arranged on a strict 16x16-tile grid (256x256 pixels total before scaling), seamless/tileable edges.
Include: grass (3 variants), dirt path (straight, corners, T-junctions), apple orchard trees (trunk + canopy, 2x2 tiles),
fallen apples, wooden fence (horizontal, vertical, posts), lake water (animated 2-frame, edges with shore transitions in all 8 directions),
rocky shore, pine trees, a small Jomon-style pit dwelling (3x3 tiles), Nebuta lantern decorations, wooden signpost, stone lantern.
Autumn color palette, sunny. Magenta background for empty cells.
```
- 生成物のグリッドはズレるので **§7 の `align-grid` で必ず整列** し、Tiled で読み込んでから足りないタイルを Aseprite で描き足す。ダンジョン（洞窟・遺跡・霊場）と町（木造家屋・のれん・石畳）は別プロンプト。

### 5.2 島の俯瞰マップ（960×540）

```
[STYLE]
Top-down overworld map illustration of the Tohoku region of Japan as ONE floating island surrounded by sea, 
960x540 pixels drawn at 2x scale. The island shape loosely follows real Tohoku geography 
(Aomori at the top, Akita north-west, Iwate north-east, Yamagata south-west, Miyagi south-east, Fukushima at the bottom).
Each prefecture area has a landmark icon: apple orchard + lake (Aomori), gold temple + iron kettle (Iwate), 
pine islands + crescent helmet (Miyagi), Namahage mask + Akita dog (Akita), cherries + snow monsters (Yamagata), 
red castle + red cow (Fukushima). A dark castle in the center-north (regional boss). 
Small roads connecting areas, tiny ferry docks on the coast. Soft blue sea with pixel waves. No text.
```

### 5.3 UI

```
[STYLE]
UI kit for a children's pixel-art RPG, drawn at 4x scale on magenta: 
(1) a dialogue window frame 9-slice 48x48 with rounded wooden edges and cream inner fill, 
(2) a button 9-slice in 3 states (normal / pressed / disabled) in warm orange, 
(3) HP bar (green→yellow→red segments) and MP bar (blue) 8px tall, 
(4) 7 element icons 16x16: fire (ヒノ), water (ミズ), grass (モリ), earth (ツチ), wind (カゼ), light (ヒカリ), dark (ヤミ), 
(5) 6 subject icons 16x16: Japanese (a brush), math (abacus), science (flask), social studies (map of Japan), life (sprout), English (speech bubble with ABC), 
(6) cursor hand, (7) star rating icons (empty / full).
```

### 5.4 アイテム・装備アイコン（24×24）

```
[STYLE]
Set of 8 RPG item icons, 24x24 pixels each drawn at 8x scale, arranged in one row on magenta, evenly spaced:
1 "Nebuta helmet" (paper-lantern style samurai helmet, red/gold), 2 "Apple armor" (chest plate shaped like a red apple),
3 "Hiba wood waist guard" (light wooden plates), 4 "Tsugaru lacquer boots" (glossy dark red with speckle pattern),
5 "Tuna lance" (a spear whose tip is a stylized bluefin tuna), 6 red apple (material), 7 iron ingot (material), 8 lake water drop in a vial (material).
```

### 5.5 名所イラスト（図鑑・カットイン 320×180）

```
[STYLE]
Landscape illustration in 16-bit pixel art, 320x180 pixels drawn at 3x scale: 
Sannai-Maruyama Jomon site in Aomori — large reconstructed wooden pillar tower, thatched pit dwellings, 
green field, blue sky with pixel clouds, a few tiny visitors for scale. Peaceful, educational-illustration mood. No text.
```
→ 図鑑の `motifs[].imageKey` に対応。1県 6〜8 枚。

### 5.6 問題用の絵（picture-word など 128×128）

```
[STYLE]
Single object icon for a children's vocabulary quiz, 128x128 pixels drawn at 4x scale, centered on magenta, 
no background scenery, instantly recognizable: a red apple with one green leaf.
```
→ 英語・生活・理科の語彙分は数が多いので、**1 プロンプトで 3×3＝9 個を格子に並べて生成 → §7 で分割** が効率的（「arrange 9 objects in a 3x3 grid, equal cells: apple, banana, grapes, cat, dog, bird, car, bus, bicycle」）。

→ 本番の絵が できるまでは、英語の 23 語（くだもの 9・どうぶつ 8・うみの いきもの 6）を コードが 16×16 の 仮のドット絵で 描いている（`src/questions/renderers/shared/pictures.ts`）。本番の絵を 置いたら、問題の payload に `"image": "questions/eigo/<word>.png"` を 足すだけで 差しかわる（読めないときは 仮の絵に もどる）。

---

## 6. ChatGPT（画像編集）に頼む作業

Gemini で作った素材の **編集・整形** は ChatGPT の画像編集が向いている（元画像を添付して指示）。

| やりたいこと | プロンプト例 |
|---|---|
| 背景をマゼンタに統一 | 「添付画像の背景だけを完全な単色 #FF00FF に置き換えてください。キャラクター本体の色・輪郭は一切変えないでください。」 |
| 別ポーズの差分 | 「添付のキャラクターと **同一のデザイン・色・頭身** のまま、右を向いて歩いている姿にしてください。背景はマゼンタ。」 |
| 表情差分 | 「同じキャラの顔グラで、表情だけ『おどろき』に変えてください。それ以外は完全に同じ。」 |
| 色の統一（パレット寄せ） | 「添付のパレット画像（palette.png）の色だけを使って、添付キャラを塗り直してください。線画と形は維持。」※精度は低めなので最終的には §7 のスクリプトで減色 |
| 装飾の追加/削除 | 「このモンスターから背中のランタンを取り除いたバージョンを作ってください。」 |
| ボスのフェーズ差分 | 「このボスの体の氷が半分割れて、中から赤い炎が見えている状態に。ポーズと大きさは同じ。」 |
| 9-slice 化 | 「この窓枠を、四隅・四辺・中央が等幅（16px 単位）で繰り返せる 9-slice 用に整えてください。」 |

コツ：**「変えないもの」を先に列挙** する。差分編集で最も多い失敗は、頼んでいない箇所まで描き直されること。

---

## 7. 後処理スクリプト（Antigravity に作らせる）

▼ PROMPT（Claude 推奨）
```
scripts/img/ に画像後処理ツール（Node + sharp、または Python + Pillow のどちらか。プロジェクトが Node なので sharp 優先）を作ってください。

1. `pnpm img:palette <input dir>`: 入力画像群から k-means で 48 色の共通パレットを作り、assets/palette.png（1行48px）と assets/palette.gpl（Aseprite/GIMP 形式）を出力。
2. `pnpm img:pixelize <in> <out> --size 32 --palette assets/palette.png`: 
   (a) 単色マゼンタ（#FF00FF ±許容 24）を透過に、(b) 内容の bounding box を検出して正方形にパディング、(c) nearest-neighbor で --size に縮小、(d) パレットに減色（ディザなし）、(e) 1px 未満のゴミ除去。
3. `pnpm img:sheet <frames...> --cols 3 --rows 4 --size 32 --out <out>`: 複数フレームを等間隔グリッドのスプライトシートに整列。フレーム間の位置ズレを、足元（bounding box の下端中央）を基準に揃える。
4. `pnpm img:align-grid <in> --tile 16 --out <out>`: AI 生成タイルセットのズレたグリッドを検出（罫線/色境界の投影から周期推定）し、16px 格子に再サンプリング。
5. `pnpm img:split-grid <in> --cols 3 --rows 3 --out-dir <dir> --names apple,banana,...`: 格子で生成した複数オブジェクト画像を個別ファイルに分割し、それぞれ pixelize。
6. `pnpm img:swap <in> --map "#c0392b:#2980b9,#e74c3c:#3498db" --out <out>`: パレットスワップ（主人公の髪・肌・服のバリエーション生成用）。
7. `pnpm img:check`: assets/ 配下の全 PNG が docs/03_IMAGE_PROMPTS.md §1 の規格（サイズ・透過・パレット準拠）を満たすか検査し、違反を一覧表示。CI に組み込む。
各コマンドに --dry-run と before/after のプレビュー HTML 出力を付けてください。
```

---

## 8. 制作フロー（1 体のモンスターを例に）

1. `content/monsters/aomori-ringoron.json` を先に書く（名前・モチーフ・属性・dexBlurb）。
2. Gemini で §4.2 プロンプト → 気に入るまで 3〜5 回。**気に入った 1 枚を `raw/monsters/ringoron/base.png` に保存**（`raw/` は Git 管理外の生成元置き場）。
3. ChatGPT に base.png を渡して待機 2 コマ目・フィールド用を差分編集。
4. `pnpm img:pixelize` → `pnpm img:sheet` で `assets/sprites/monsters/aomori-ringoron.png` 生成。
5. Aseprite で開いてはみ出し・目の位置を数ドット直す（ここは人間。1 体 5〜10 分）。
6. `pnpm img:check` → `pnpm validate:content` が通ればコミット。

目安：東北 6 県分（通常 24 + ボス 6 + 地方ボス 1 + NPC 24 + アイコン 60 + 名所 40 + タイルセット 3 種）で **生成 2〜3 日、手直し 3〜5 日**。最初から全部作らず、青森 1 県分を通してパイプラインを固めてから量産する。

---

## 9. 権利・安全のメモ

- 生成した画像の利用条件は各サービスの利用規約に従う（商用配布するなら特に確認）。
- 実在の **神社仏閣・城・遺跡** をモチーフにするのは一般に問題ないが、**特定の宗教的シンボルをモンスター化しない**（恐山は「霊場の雰囲気」「風車」「カラス」までにし、地蔵や仏像そのものを敵にしない）。
- **ご当地キャラ・企業ロゴ・商品パッケージ・アニメキャラ** は参照画像にも使わない。
- 写真資料を参照画像として渡す場合は、自分で撮った写真かパブリックドメインのものに限る。
