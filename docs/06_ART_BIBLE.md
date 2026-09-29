# 06 — アートバイブル（ドットの規格・パレット・画像生成プロンプト）

> **ドット絵素材の「規格とスタイルの正」はこのファイル** です。画像生成 AI（Gemini / ChatGPT）で作っても、人の手で描いても、全素材の **ドットの大きさ・色数（ビット数）・輪郭・陰影・頭身・視点** がそろうようにするための決まりと、コピペで使えるプロンプトをまとめています。
>
> - 作業の流れ（AI で大きく生成 → 縮小・減色 → Aseprite で手直し）、ChatGPT での差分編集、後処理スクリプトの依頼文は **`03_IMAGE_PROMPTS.md`** に残しています。
> - **`03` とこのファイルの数値がちがうときは、このファイルが正** です（`03` §1 の「キャラ 32×32」「モンスター 64×64」「アイテム 24×24」「顔グラ 96×96」「名所 320×180」「パレットは k-means で作る」は旧規格）。
> - 数値はコードと一致しています：パレット `src/scenes/art/palette.ts`、人物の仮素材 `src/scenes/art/characters.ts`。規格を変えるときは **コード・このファイル・`assets/palette/nq48.*` を同時に** 直してください。

---

## 0. まずこの 5 つだけ守る

1. **実寸で作る。表示は整数倍だけ。** フィールドは ×3（1 ドット＝3px）、バトルは ×4（1 ドット＝4px）。同じ画面に出る素材のドットの大きさは必ずそろえる。
2. **色は NQ-48 の 48 色だけ。** 1 枚の素材は「4bpp（15 色＋透明）」以内が目安（§2.3）。
3. **外周に 1px のインク `#1a1428`。** 純黒 `#000000` は使わない。
4. **光は左上から、2 トーン（ベース＋かげ）。** アンチエイリアス・グラデーション・ぼかしは禁止。
5. **AI には「実寸 × 描画倍率」と hex を必ず書く**（§5）。生成後は縮小・減色してから使う（§7）。

---

## 1. このファイルの位置づけ

| ファイル | 中身 | 誰が読む |
|---|---|---|
| **`06_ART_BIBLE.md`（ここ）** | 規格表・パレット・描き方のルール・素材別プロンプト・チェックリスト | 絵素材担当・AI |
| `03_IMAGE_PROMPTS.md` | 制作フロー、ChatGPT での編集指示、後処理スクリプト（§7）、権利の注意（§9） | 絵素材担当 |
| `assets/palette/nq48.gpl` / `nq48.hex` | NQ-48 パレット（Aseprite・GIMP・Lospec 形式） | 絵素材担当・スクリプト |

素材を置く場所・キーの付け方は `03` §1 と同じ考え方（`content` の `spriteKey` / `iconKey` / `imageKey` と一致させる）で、寸法だけこのファイルに合わせます。

---

## 2. ドットの規格

### 2.1 画面とドットの倍率

- 基準画面は **960×540**。
- **フィールド（町・ダンジョン・離島）**：カメラ ×3。1 ドット＝3px。タイル 16×16 は画面で 48×48（画面に 横 27×縦 15 マスくらい。ドラクエのように 1 つ 1 つを 大きく）。
- **バトル**：背景 240×135 を ×4 で全画面。敵・味方・エフェクトもすべて ×4。1 ドット＝4px。
- **文字**：PixelMplus12（12px グリッドのドットフォント）。文字サイズは **12 / 24 / 36 / 48px だけ**（1 ドット＝1〜4px）。
- 拡大は **整数倍・ニアレストネイバー** だけ。0.5 倍・1.5 倍・なめらか拡大は禁止（ドットの大きさがバラバラになり「ただ解像度が低い絵」に見える）。

### 2.2 素材ごとの規格表

| 素材 | 実寸（1 コマ） | コマ・並べ方 | 表示 | キー | 置き場所 |
|---|---|---|---|---|---|
| タイル | 16×16 | タイルセット 64×128（4 列×8 行＝32 枚、§6.11） | ×3 | `overworld-tiles` | `assets/tilesets/overworld-tiles.png` |
| 人物・歩行（主人公・NPC） | **16×24** | シート 48×96。列＝右足・立ち・左足、行＝下・左・右・上 | ×3 | `char.<id>` | `assets/sprites/characters/<id>.png` |
| 人物・バトル | **16×24** | シート 96×24（左向き）：立ち・右足・左足・こうげき・ダメージ・ばんざい（正面） | ×4 | `char.<id>.battle` | `assets/sprites/characters/<id>.battle.png` |
| 通常モンスター | **32×32** | 正面・待機 2 コマを横に（64×32） | ×4（128px） | `mon.<id>` | `assets/sprites/monsters/<id>.png` |
| 中ボス | **40×40** | 待機 2 コマ（80×40） | ×4（160px） | `mon.<id>` | 同上 |
| 県ボス | **48×48** | 待機 2 コマ（96×48）＋フェーズ差分 | ×4（192px） | `mon.<id>` | 同上 |
| 地方ボス | **56×56** | 待機 2 コマ（112×56）＋フェーズ差分 | ×4（224px） | `mon.<id>` | 同上 |
| フィールドの中ボスの「？」マーク | **16×16** | 1 枚（violet の丸に白い「？」。姿はバトルまで見せない） | ×3（48px＝1 タイル） | `fld.boss.q` | （仮素材 `src/scenes/overworld/fieldArt.ts`） |
| アイテム・装備アイコン | **16×16** | 1 枚 1 アイコン | メニュー ×3（48px）／フィールド ×3 | `item.<id>` | `assets/items/<id>.png` |
| 顔グラ（会話） | **48×48** | 表情ごとに別ファイル | ×2（96px） | `face.<id>` | `assets/portraits/<id>.png` |
| 名所イラスト | **240×135** | 1 枚絵 | カットイン ×2（480×270）／バトル背景 ×4 | `motif.<area>.<motifId>` | `assets/motifs/<area>/<motifId>.png` |
| バトル背景 | **240×135** | 1 枚絵（サイドビュー。地平線は上から 64 ドット、みんなが立つ道の帯は 82〜97 ドット） | ×4 | `bt.bg.<kind>`（現行コードのキー。`field` / `dungeon` / `boss`） | `assets/backdrops/<kind>.png`（予定） |
| UI アイコン（属性・教科・コマンド・看板） | **8×8** | 1 枚 1 アイコン（仮素材は `src/scenes/art/icons.ts`） | 窓の中 ×2〜×3、フィールドの看板 ×1（カメラで ×3） | `ui.<name>` | `assets/ui/<name>.png` |

補足：

- **ボスのフェーズ差分**：同じ寸法・同じ立ち位置で、変わるところだけ描き直す。キーは `bossPhases[].spriteKey` に書いたもの。省略時、現行コードは `mon.<id>.p0`, `mon.<id>.p1`…（最初の変化が `p0`）を探す。
- **足元をそろえる**：人物は 16×24 のいちばん下の行が足の裏の輪郭。モンスターは左右中央、足の裏（いちばん下の不透明ドット）がキャンバス下端から 0〜2 ドット。コードは足元を基準（原点 下中央）に置く。
- **余白**：アイテムは 16×16 の中の 14×14（輪郭こみ）に収め、外周 1 ドットは透明。モンスターは上と左右に 1〜2 ドットの余白。
- 仲間モンスターがフィールドで後ろをついて歩く絵（連れ歩き）は **未定**。作る前にこのファイルに規格を足すこと。
- 待機 2 コマを横に並べたシート（64×32 など）は、読み込むときに `this.load.spritesheet(key, path, { frameWidth: <1 コマの幅>, frameHeight: <高さ> })` にする。今のコードの仮素材は 1 コマなので、本番 PNG を入れるときに Boot の読み込みを足すこと。

### 2.3 「ビット数」＝ 1 枚あたりの色数

スーパーファミコンのスプライトは 4bpp（1 パレット 16 色、うち 1 色が透明）でした。ニホンクエストもこれを目安にし、**1 素材の色数に上限** を決めます（透明はふくまない。輪郭の ink はふくむ）。

| 素材 | 色数の上限 | 目安 |
|---|---|---|
| 人物（1 シート） | **12 色** | 主人公のベースはちょうど 12 色（§3.4） |
| 通常モンスター | **12 色** | 属性の 4 色ランプ＋ink＋目の白＋ほっぺ＋差し色 |
| 中ボス・県ボス・地方ボス | **15 色**（4bpp の上限） | フェーズ差分も 1 フェーズ 15 色まで |
| フィールドの中ボス | **12 色** | バトル絵から色を減らす |
| アイテム・装備アイコン | **8 色**（透明ふくむ＝3bpp） | 小さいので色を増やすとつぶれる |
| UI アイコン | **6 色** | |
| 顔グラ | **15 色** | |
| 名所イラスト・バトル背景 | **24 色** | 空の 2px 市松ディザだけ可 |
| タイルセット（1 枚） | **32 色** | |

**どの素材も、使ってよいのは NQ-48 の中の色だけ** です。上限は「その中から何色えらぶか」。

---

## 3. パレット NQ-48

### 3.1 48 色の表（`src/scenes/art/palette.ts` と同じ順番）

| # | 名前 | hex | 主な用途 |
|---|---|---|---|
| 0 | ink | `#1a1428` | **すべての輪郭線**・目・黒いかみのかげ |
| 1 | night | `#2e2a45` | 夜・洞くつ・鉄の暗部 |
| 2 | slate | `#4a5063` | 石・鉄・むぞくせいのかげ |
| 3 | gray | `#6b6f80` | 石・金属 |
| 4 | silver | `#a3aabb` | 金属・白かみ・むぞくせい |
| 5 | cloud | `#d2d7e2` | 白い服のかげ・雲のかげ |
| 6 | paper | `#f4f1e8` | 白い服・和紙・ちょうちん |
| 7 | white | `#ffffff` | 目の白・光・雪 |
| 8 | brick | `#a8341f` | 赤のかげ・ヒノの暗部 |
| 9 | red | `#e5484d` | 主人公のぼうし（赤）・王冠の宝石 |
| 10 | vermilion | `#f0603c` | ヒノのベース・朱色 |
| 11 | apricot | `#ff9e5e` | ヒノのハイライト・夕焼け |
| 12 | gold | `#ffd23f` | 王冠・ヒノの差し色・金色・ヤミの目 |
| 13 | ochre | `#c79a1a` | 金のかげ・ヒカリの暗部 |
| 14 | yellow | `#ffd447` | ヒカリのベース |
| 15 | cream | `#fff3a3` | ヒカリのハイライト・ちょうちんの光 |
| 16 | forest | `#1f5a2e` | 深い森・木のかげ |
| 17 | green | `#2a7a36` | モリの暗部・葉のかげ |
| 18 | leaf | `#4cbf4c` | モリのベース・主人公のぼうし（緑） |
| 19 | lime | `#8fe36f` | モリのハイライト・草原 |
| 20 | sprout | `#e8f7a0` | モリの差し色・若葉 |
| 21 | teal | `#2c8b80` | カゼの暗部 |
| 22 | aqua | `#58d0bd` | カゼのベース |
| 23 | mint | `#a4f0e2` | カゼのハイライト |
| 24 | navy | `#1a2b5e` | 夜空・深い海・船長の服 |
| 25 | blue | `#1f4fa3` | ミズの暗部・青のかげ |
| 26 | azure | `#3d8ef0` | ミズのベース・主人公のぼうし（青） |
| 27 | sky | `#80c6ff` | ミズのハイライト・空 |
| 28 | ice | `#c8f4ff` | ミズの差し色・氷・水しぶき |
| 29 | denim | `#34406b` | ズボン・デニム |
| 30 | indigo | `#3a2672` | ヤミの暗部 |
| 31 | violet | `#6e4fc4` | ヤミのベース・ワープホール |
| 32 | lavender | `#a28be6` | ヤミのハイライト |
| 33 | bark | `#3a2a22` | くつ・木の幹・茶色いかみのかげ |
| 34 | brown | `#7a5230` | ツチの暗部・木 |
| 35 | tan | `#c08a55` | ツチのベース・土 |
| 36 | sand | `#e2b27a` | ツチのハイライト・砂・道 |
| 37 | beige | `#f4dfb3` | ツチの差し色・土器 |
| 38 | skinLight | `#f6d2b0` | はだ（1） |
| 39 | skinMid | `#e0ac7e` | はだ（2） |
| 40 | skinDark | `#a86e4a` | はだ（3） |
| 41 | hairBrown | `#5a3a22` | かみ（茶） |
| 42 | hairBlack | `#2b2440` | かみ（黒） |
| 43 | hairBlond | `#d9a441` | かみ（金） |
| 44 | blush | `#ff8fb1` | ほっぺ |
| 45 | berry | `#c2405a` | 口の中・木の実 |
| 46 | orange | `#f2a93b` | 主人公のリュック |
| 47 | amber | `#b8741f` | リュックのかげ・金かみのかげ |

> UI（窓・カーソル・ボタン）の色は CSS で指定しているので、この表の外の色（窓の地 `#0a0b1a` など）も使っています。**画像素材を作るときは、UI 部品でも NQ-48 の色だけ** を使ってください（窓の地は ink / night）。

### 3.2 属性ランプ（モンスターの基本の 4 色）

| 属性 | かげ | ベース | ハイライト | 差し色 | かたちの言葉 |
|---|---|---|---|---|---|
| ヒノ | brick `#a8341f` | vermilion `#f0603c` | apricot `#ff9e5e` | gold `#ffd23f` | たて長。頭に炎 |
| ミズ | blue `#1f4fa3` | azure `#3d8ef0` | sky `#80c6ff` | ice `#c8f4ff` | まるい。ひれ |
| モリ | green `#2a7a36` | leaf `#4cbf4c` | lime `#8fe36f` | sprout `#e8f7a0` | まるい。葉っぱ・ヘタ |
| ツチ | brown `#7a5230` | tan `#c08a55` | sand `#e2b27a` | beige `#f4dfb3` | 四角い。ひび |
| カゼ | teal `#2c8b80` | aqua `#58d0bd` | mint `#a4f0e2` | white `#ffffff` | 鳥のよう。つばさ |
| ヒカリ | ochre `#c79a1a` | yellow `#ffd447` | cream `#fff3a3` | white `#ffffff` | まるい。頭にわっか |
| ヤミ | indigo `#3a2672` | violet `#6e4fc4` | lavender `#a28be6` | gold `#ffd23f`（目） | たて長。とがった耳 |
| むぞくせい | slate `#4a5063` | silver `#a3aabb` | cloud `#d2d7e2` | white `#ffffff` | まるい |

### 3.3 かげ色の組み合わせ（SHADE）

2 トーンで塗るときのかげは、**計算で暗くせず、この組み合わせを使う**（パレットの外の色を作らないため）。

```
red → brick        vermilion → brick   azure → blue       leaf → green
violet → indigo    navy → ink          brown → bark       tan → brown
paper → cloud      white → cloud       orange → amber     silver → gray
gold → ochre       teal → night        denim → navy
hairBrown → bark   hairBlack → ink     hairBlond → amber
（表にない色のかげは ink）
```

### 3.4 主人公の色（見た目 3×3×3 ＝ 27 通り）

本番の PNG は **見た目 0-0-0（茶かみ・はだ 1・赤）だけを描き**、残りはパレットスワップで作る（`03` §3.2）。

| 部位 | 0 | 1 | 2 |
|---|---|---|---|
| かみ（ベース / かげ） | 茶 `#5a3a22` / `#3a2a22` | 黒 `#2b2440` / `#1a1428` | 金 `#d9a441` / `#b8741f` |
| はだ | `#f6d2b0` | `#e0ac7e` | `#a86e4a` |
| 服の色＝ぼうし・スカーフ（ベース / かげ） | 赤 `#e5484d` / `#a8341f` | 青 `#3d8ef0` / `#1f4fa3` | 緑 `#4cbf4c` / `#2a7a36` |

固定の色：白い T シャツ paper `#f4f1e8`（かげ cloud `#d2d7e2`）、リュック orange `#f2a93b`（かげ amber `#b8741f`）、短パン denim `#34406b`、くつ bark `#3a2a22`、ほっぺ blush `#ff8fb1`、輪郭と目 ink `#1a1428`。→ **ベースはちょうど 12 色**。

> **スワップの注意**：ベースでは「茶かみのかげ」と「くつ」が同じ bark `#3a2a22` です。色で置き換えるとくつまで変わるので、Aseprite では **インデックスカラーで別のスロット** に塗り分けて保存する。スロット順：`0 透明 / 1 ink / 2 ぼうし・スカーフ / 3 ぼうしのかげ / 4 かみ / 5 かみのかげ / 6 はだ / 7 ほっぺ / 8 服 / 9 服のかげ / 10 リュック / 11 リュックのかげ / 12 短パン / 13 くつ`。

コードの仮素材の地図文字（`characters.ts`）とも対応しています：C/c ぼうし、H/h かみ、S はだ、e 目、p ほっぺ、T/t 服、R スカーフ、Y/y リュック、B ズボン、K くつ。

### 3.5 町の人（NPC）の色

体型は主人公と同じ 16×24。リュックは無し。役割ごとに服の色で見分ける（コードの `NPC_LOOKS` と同じ）。

| 役割 | かみ | はだ | ぼうし | 服 | スカーフ | ズボン | くつ |
|---|---|---|---|---|---|---|---|
| ショップ | hairBlack | skinLight | なし | leaf | paper | bark | bark |
| かじ屋 | hairBrown | skinMid | paper（はちまき風） | brown | red | bark | ink |
| 宿屋 | hairBlond | skinLight | なし | azure | paper | denim | bark |
| 掲示板 | hairBlack | skinMid | violet | violet | gold | denim | bark |
| 図鑑係 | silver | skinLight | なし | white | azure | slate | bark |
| 対戦場 | hairBrown | skinDark | navy | navy | gold | paper | ink |
| 町の人 | hairBrown | skinLight | なし | red | paper | denim | bark |

本番で一人ひとりを描き分けるとき（「りんご屋の おばあちゃん」など）も、この体型・この色数（12 色）を守る。

### 3.6 パレットファイルの使い方

- **Aseprite**：パレット欄のメニュー → *Load Palette* → `assets/palette/nq48.gpl`。減色は *Sprite > Color Mode > Indexed*、**Dithering: None**。
- **GIMP**：*Palettes* に `nq48.gpl` を取り込み → *Image > Mode > Indexed* → *Use custom palette*、ディザなし。
- **Lospec・スクリプト**：`assets/palette/nq48.hex`（1 行 1 色）。
- パレットは **固定**。`03` §7 の `img:palette`（k-means で色を作る）は使わない。

---

## 4. 描き方のルール

### 4.1 共通

- **輪郭**：シルエットの外周に 1px の ink `#1a1428`。内側の線（腕と胴のさかい、目など）も必要なところだけ ink。**純黒 `#000000` は使わない**。輪郭は途切れさせない。
- **光**：左上から。**ベース＋かげの 2 トーン**、ハイライトは 1 色・小さく。かげは右下に落とす。
- **ドット**：すべて同じ大きさの 1 ドット。2×2 の「太いドット」を混ぜない（＝解像度を混ぜない）。
- **禁止**：アンチエイリアス、グラデーション、ぼかし、半透明、発光（グロー）。ディザは **背景の空などに 2px 市松だけ** 可。
- **ゴミドット**：1 ドットだけ浮いた点を残さない（目のハイライトなど意図したものは可）。
- **影**：地面の影は **絵に描かない**（コードが描く）。スプライトは地面・背景なし。

### 4.2 視点

| 素材 | 視点 |
|---|---|
| フィールドのタイル・人物 | 真上より少し手前から見た 3/4 見下ろし。人物は 4 方向（下・左・右・上） |
| バトルの敵 | **正面**（ほんの少し見下ろし）。左右ほぼ対称。サイドビューで画面の左に立つが、絵は正面のまま |
| バトルの人物 | **左向きの横顔**（敵が左にいる）。ばんざいだけ正面 |
| 仲間モンスター（バトル） | 敵と同じ正面の絵を使う（`mon.<id>` を流用） |
| アイテム | 斜め 45°。武器は左下 → 右上に向ける。よろい・かぶとは正面 |
| 名所イラスト | 横長の風景。地平線は画面の高さの 1/3〜1/2。下 1/4 は平らな地面（バトル背景に流用するため） |

### 4.3 頭身・顔

- **人物**：頭 10 ドット（ぼうし込み）＋体 12 ドット（胴 7・足 5）＝ **約 2 頭身**。横幅は輪郭こみ 16 ドット（中身 14）。
- **人物の目**：ink の縦 2×横 1 ドットを左右に 1 つずつ。ほっぺ blush 1 ドット。口はふだん描かない（ばんざいのときだけ 2 ドット）。
- **モンスター**：1.5〜2 頭身（頭と体が一体でもよい）。**目は大きめ**：通常 2×3 ドット、40×40 以上は 3×4 ドット（白目 white＋黒目 ink、黒目は内側・下寄せ）。ほっぺ blush。
- **シルエットで区別できること**：真っ黒にぬりつぶしても、何のモンスターかわかる形に。
- **こわすぎない**：きばは 1〜2 ドット、目つきはまるく。血・骨・どくろは描かない。

### 4.4 属性の「かたちの言葉」

§3.2 の表のとおり。コードの仮モンスター（`src/scenes/battle/pixelArt.ts`）も同じ決まりで自動生成しているので、本番の絵もこれに合わせると **仮素材からの差し替えで印象が変わりにくい**。

- ヒノ：たて長。頭のてっぺんに 3 本の炎（先が cream/gold）。
- ミズ：まるい。頭にひれ、体の横に小さなひれ。
- モリ：まるい。頭にヘタと葉っぱ（りんごのように）。
- ツチ：角の欠けた四角。体にひび（ベースのかげ色で 1 ドット線）。
- カゼ：鳥のよう。左右につばさ（mint と white の段々）。
- ヒカリ：まるい。頭の上にわっか（gold の横線）。
- ヤミ：たて長。とがった耳。目は gold（白目の代わり）。

### 4.5 ボスのしるし

- **中ボス・県ボス**：頭に **王冠**（gold・かげ ochre、真ん中に red の宝石 2 ドット）。
- **中ボス（40×40）**：県のモチーフを 1 つだけ大きく。フィールドに立つ 32×32 版（王冠つき）も作る。
- **県ボス（48×48）**：モチーフ 2 つまで。フェーズ差分は同じポーズ・同じ大きさで、色や部品だけ変える。
- **地方ボス（56×56）**：その地方の県のモチーフを 1 つずつ身につける。フェーズ 3 つまで。

### 4.6 やってはいけない

- 非整数倍の拡大・縮小、なめらか拡大、ぼかし、アンチエイリアス、グラデーション、半透明
- NQ-48 の外の色、純黒 `#000000`、2px 以上の太い輪郭
- 絵の中の文字・数字・ロゴ・サイン
- 地面の影・背景の焼き込み（スプライト）
- **ご当地キャラ（自治体マスコット）・企業キャラ・アニメキャラ** を題材にする／参照画像に使う
- **宗教的なシンボル（仏像・地蔵・鳥居そのもの）を敵にする**（名所イラストで建物として描くのは可。`03` §9）。歴史上の人物は 2026-09-15 から そのまま描いてよい（裏ステージの ラスボス。かぶと・よろい・扇など その人らしい もので。こわすぎない は守る）
- こわすぎる表現（血・骨・どくろ・リアルな怪物）

---

## 5. 共通スタイル文（すべてのプロンプトの先頭に付ける）

### 5.1 STYLE ANCHOR

```
STYLE ANCHOR — NIHON QUEST v1
16-bit SNES / Super Famicom era Japanese RPG pixel art.
Exact pixel grid: 1 pixel = 1 dot. Every dot is a perfectly square, solid block of the same size, aligned to the grid.
Hard edges only: no anti-aliasing, no blur, no gradients, no glow, no semi-transparent pixels.
No dithering on characters, monsters or items.
1-pixel dark outline in #1a1428 around the whole silhouette; inner lines only where needed, also #1a1428 (never pure black).
Light comes from the top-left. Flat cel shading with 2 tones per material (base + shadow), at most 1 small highlight.
Cute, friendly and approachable for Japanese children aged 6 to 12. Nothing scary, gory or realistic.
Solid flat #FF00FF (magenta) background everywhere outside the subject. No ground, no cast shadow, no text, no watermark.
```

### 5.2 SIZE（寸法の書き方。**必ず「実寸 × 描画倍率」**）

```
SIZE: the sprite is exactly {W}x{H} pixels, drawn at {N}x scale,
so the final image is {W*N}x{H*N} and every pixel is a solid {N}x{N} square block.
Keep the subject inside the {W}x{H} grid, centered horizontally, feet touching the bottom edge.
```

よく使う組み合わせ（出力が 1000px 前後になるように倍率を決めている）：

| 素材 | SIZE の書き方 |
|---|---|
| 人物 1 コマ | 16x24 drawn at 20x = 320x480 |
| 人物 4 方向を横に 1 列 | 64x24 drawn at 20x = 1280x480（4 cells of 16x24） |
| 歩行 3 コマを横に 1 列 | 48x24 drawn at 20x = 960x480（3 cells of 16x24） |
| バトルポーズ 6 コマ | 96x24 drawn at 10x = 960x240（6 cells of 16x24） |
| 通常モンスター | 32x32 drawn at 16x = 512x512 |
| 中ボス | 40x40 drawn at 16x = 640x640 |
| 県ボス | 48x48 drawn at 16x = 768x768 |
| 地方ボス | 56x56 drawn at 16x = 896x896 |
| フィールドの中ボス | 32x32 drawn at 16x = 512x512 |
| アイコン 3×3 | 48x48 drawn at 20x = 960x960（9 cells of 16x16） |
| 顔グラ | 48x48 drawn at 16x = 768x768 |
| 名所イラスト・背景 | 240x135 drawn at 4x = 960x540 |
| タイルセット | 64x128 drawn at 8x = 512x1024（4x8 cells of 16x16） |

### 5.3 PALETTE（色の指定）

完全版（NQ-48。背景・名所・タイルに）：

```
PALETTE: use ONLY these 48 hex colors, nothing else:
#1a1428 #2e2a45 #4a5063 #6b6f80 #a3aabb #d2d7e2 #f4f1e8 #ffffff
#a8341f #e5484d #f0603c #ff9e5e #ffd23f #c79a1a #ffd447 #fff3a3
#1f5a2e #2a7a36 #4cbf4c #8fe36f #e8f7a0 #2c8b80 #58d0bd #a4f0e2
#1a2b5e #1f4fa3 #3d8ef0 #80c6ff #c8f4ff #34406b #3a2672 #6e4fc4
#a28be6 #3a2a22 #7a5230 #c08a55 #e2b27a #f4dfb3 #f6d2b0 #e0ac7e
#a86e4a #5a3a22 #2b2440 #d9a441 #ff8fb1 #c2405a #f2a93b #b8741f
Maximum {C} colors in this image.
```

短縮版（主要 16 色。色の指示がきかないモデル用のたたき台）：

```
PALETTE: only these 16 colors: #1a1428 #ffffff #d2d7e2 #4a5063 #e5484d #a8341f #ffd23f #4cbf4c
#2a7a36 #3d8ef0 #1f4fa3 #80c6ff #c08a55 #7a5230 #6e4fc4 #f6d2b0. Maximum {C} colors in this image.
```

素材別のプロンプト（§6）では、**その素材で使う色だけ** を `Use only:` で並べています。AI は長いリストより短いリストのほうが守りやすいので、基本はそちらを使う。

### 5.4 NEGATIVE（除外。ネガティブ欄があればそこへ、なければ文末に "Avoid: …" として）

```
anti-aliasing, blur, soft shading, gradient, glow, bloom, lens flare, noise, texture, painterly,
3D render, photorealistic, vector art, smooth upscaling, mixed pixel sizes, outline thicker than 1 pixel,
pure black #000000 lines, semi-transparent pixels, drop shadow, ground shadow, background scenery,
text, letters, numbers, logo, watermark, signature, frame, UI, cropped, cut off, extra characters,
scary, horror, gore, blood, skull, realistic animal anatomy
```

### 5.5 コツ

- **1 回に 1 体（1 素材）**。2 体目以降は、合格した 1 枚を **参照画像として添付** し「同じ規格・同じ塗り方で」と書く。
- 差分（2 コマ目・別の向き・フェーズ）は新規生成せず、`03` §6 の ChatGPT 編集で「変えないもの」を先に列挙して作る。
- 「drawn at Nx」がきかないモデルには `chunky pixel art where each pixel is clearly visible as a big square` を足す。
- 名前（カタカナ）はプロンプトに入れない（文字を描かれる）。英語の説明だけにする。

---

## 6. 素材別プロンプト

各プロンプトは **[STYLE ANCHOR] ＋ 本文 ＋ [NEGATIVE]** の順に貼る。`[STYLE]` と書いてあるところに §5.1 を入れる。

### 6.1 主人公

**(a) キャラクターシート（最初の 1 枚。以後すべての参照元）**

```
[STYLE]
SIZE: 4 cells side by side, each cell exactly 16x24 pixels, drawn at 20x (whole image 1280x480, every pixel a solid 20x20 block).
Character design sheet of the hero of a children's RPG set in Japan: a cheerful, gender-neutral 10-year-old adventurer.
Chibi proportions: head 10 px tall including the cap, body 12 px (torso 7, legs 5). Width 14 px plus the 1 px outline.
Outfit: red baseball cap, short brown hair showing at the sides, white T-shirt, a red scarf around the neck,
an orange backpack with straps over both shoulders, denim shorts, dark brown shoes.
Face: two 1x2 px dark eyes, one pink blush pixel on each cheek, no mouth.
Show the SAME character in 4 views, left to right: front (facing down), left side, right side, back (showing the backpack).
Standing pose, arms down. Feet touch the bottom of each cell.
Use only: #1a1428 #e5484d #a8341f #5a3a22 #3a2a22 #f6d2b0 #ff8fb1 #f4f1e8 #d2d7e2 #f2a93b #b8741f #34406b (12 colors).
[NEGATIVE]
```

**(b) 歩行（向きごとに 1 回。シートを添付して）**

```
[STYLE]
SIZE: 3 cells side by side, each exactly 16x24 pixels, drawn at 20x (whole image 960x480).
Using the attached character sheet as the exact reference (same colors, same proportions, same outline),
draw a 3-frame walk cycle facing {FRONT / LEFT / RIGHT / BACK}:
cell 1 right foot forward (the other foot raised 1 px), cell 2 standing still, cell 3 left foot forward.
Only the legs and shoes change between cells; the head and body stay in exactly the same place.
Use only the 12 colors of the reference.
[NEGATIVE]
```

→ 4 回作って `03` §7 の `img:sheet` で 48×96（行＝下・左・右・上）に並べる。右向きは左向きの左右反転でもよい。

**(c) バトルポーズ（左向き 6 コマ）**

```
[STYLE]
SIZE: 6 cells side by side, each exactly 16x24 pixels, drawn at 10x (whole image 960x240).
Using the attached character sheet as the exact reference, draw 6 battle poses of this hero, facing LEFT (side view):
1 standing ready, 2 walking with right foot forward, 3 walking with left foot forward,
4 attacking: leaning forward with the front arm stretched straight to the left (a punch),
5 hurt: eyes shut, body leaning back a little, 6 victory: facing the viewer, both hands raised above the shoulders, small open mouth.
Same size and same foot line in every cell. Use only the 12 colors of the reference.
[NEGATIVE]
```

→ `char.hero.battle`（96×24）。

### 6.2 NPC（町の人）

テンプレート：

```
[STYLE]
SIZE: exactly 16x24 pixels, drawn at 20x (320x480).
Front-facing standing sprite of a friendly townsperson in a Japanese RPG town in {PREFECTURE}:
{AGE / ROLE}, wearing {CLOTHES}, {ONE SMALL PROP OR HAIRSTYLE DETAIL}, smiling.
Same chibi body as the hero reference (head 10 px, body 12 px, 14 px wide + outline), no backpack.
Use only: #1a1428 {HAIR} {HAIR SHADOW} {SKIN} #ff8fb1 {TOP} {TOP SHADOW} {SCARF} {PANTS} {SHOES} (max 12 colors).
[NEGATIVE]
```

記入例（青森の「りんご屋の おばあちゃん」＝ショップ）：

```
[STYLE]
SIZE: exactly 16x24 pixels, drawn at 20x (320x480).
Front-facing standing sprite of a friendly elderly apple-shop grandmother in a Japanese RPG town in Aomori:
silver hair tied in a small bun, a green apron over a white blouse, holding one tiny red apple (2x2 px) in both hands, smiling.
Same chibi body as the hero reference (head 10 px, body 12 px, 14 px wide + outline), no backpack.
Use only: #1a1428 #a3aabb #6b6f80 #f6d2b0 #ff8fb1 #4cbf4c #2a7a36 #f4f1e8 #d2d7e2 #e5484d #3a2a22 (11 colors).
[NEGATIVE]
```

→ 立ち絵ができたら、主人公と同じ手順（6.1 b）で歩行 3 コマ × 4 方向を作る。

### 6.3 通常モンスター（32×32）

**設計してから書く**：「県のモチーフ × 生き物の型 × 属性」を `content/monsters/<id>.json`（`motifId`・`element`）で決めてから。

テンプレート：

```
[STYLE]
SIZE: exactly 32x32 pixels, drawn at 16x (512x512, every pixel a 16x16 block).
Battle sprite of a cute RPG monster for children, front view, idle pose, centered, feet touching the bottom edge.
Concept: a {CREATURE TYPE} monster based on {MOTIF} of {PREFECTURE}, Japan. {2-3 FEATURES}.
Element {ELEMENT}: {SHAPE LANGUAGE}. Big friendly eyes (2x3 px, white with a dark pupil), pink blush pixels.
Personality: {PERSONALITY}, mischievous but not scary.
Use only: #1a1428 #ffffff #ff8fb1 {ELEMENT RAMP: shadow, base, highlight, accent} {UP TO 5 EXTRA COLORS} (max 12 colors).
[NEGATIVE]
```

記入例：

```
[STYLE]
SIZE: exactly 32x32 pixels, drawn at 16x (512x512).
Battle sprite of a cute RPG monster for children, front view, idle pose, centered, feet touching the bottom edge.
Concept: a round slime monster made of a shiny red Aomori apple, with a brown stem and one green leaf on top like a hat,
two tiny stubby feet. Element GRASS: round body, leaf on the head. Big friendly eyes (2x3 px), pink blush.
Personality: cheerful and bouncy.
Use only: #1a1428 #ffffff #ff8fb1 #e5484d #a8341f #ff9e5e #3a2a22 #2a7a36 #4cbf4c #8fe36f (10 colors).
[NEGATIVE]
```
（リンゴロン。`mon.aomori-ringoron`）

ほかのモンスターは Concept と色だけ差し替える（東北の通常モンスター 23 体。手描きの仮素材 `src/scenes/art/monsters/<県>.ts` と同じ設計なので、仮素材を参照画像に添付すると早い）：

| モンスター | Concept（英語で差し替える部分） | Use only |
|---|---|---|
| ネブタン（青森・ねぶた・ヒノ） | a small vermilion warrior in a blue round helmet with a gold brim and three flames on top, carrying a glowing fan-shaped paper lantern (Hirosaki fan-neputa) with a red rim on its back | #1a1428 #fff3a3 #ffd23f #ff9e5e #f0603c #a8341f #1f4fa3 #f4f1e8 #d2d7e2 #3d8ef0 #ffffff #ff8fb1 |
| マグロード（青森・大間のマグロ・ミズ） | an upright bluefin tuna with a navy back, azure flanks and a pale ice belly, a dorsal-fin crest, fins as arms, yellow finlets, a crescent tail fanning behind two short legs, raising a tiny katana | #1a1428 #1a2b5e #1f4fa3 #3d8ef0 #80c6ff #c8f4ff #a3aabb #ffffff #ff8fb1 #ffd23f |
| ドグウくん（青森・三内丸山遺跡・ツチ） | a blocky clay golem based on the Jomon goggle-eyed dogu: big coffee-bean goggle eyes, a crown ridge, a zigzag cord-pattern band on the chest, stubby arms, crack lines | #1a1428 #c08a55 #e2b27a #7a5230 #f4dfb3 #ffffff #ff8fb1 |
| イタコドリ（青森・恐山・ヤミ） | a round violet owl-like bird with pointed ear tufts, a lavender face and chest with V-shaped feather marks, gold eyes, holding a red-and-white paper pinwheel on a stick | #1a1428 #3a2672 #6e4fc4 #a28be6 #ffd23f #c79a1a #ff8fb1 #e5484d #f4f1e8 #7a5230 |
| ワンコソバット（岩手・わんこそば・カゼ） | a cute bat whose body is a tower of stacked red lacquer wanko-soba bowls with black rims, a black lacquer lid worn as a hat, soba noodles peeking out, small fangs, aqua bat wings with teal finger bones | #1a1428 #e5484d #a8341f #2e2a45 #4a5063 #e2b27a #58d0bd #2c8b80 #ffffff #ff8fb1 |
| リュウセンウオ（岩手・龍泉洞・ミズ） | a crystal-clear cobalt-blue fish from Ryusendo cave's underground lake, standing on a wide crescent tail fin, two small gold dragon horns, a pale fin crest, ice-blue side fins, a little whisker mustache, glowing mint dots (no bones) | #1a1428 #3d8ef0 #1f4fa3 #80c6ff #c8f4ff #ffffff #ffd23f #c79a1a #a4f0e2 #ff8fb1 |
| トオノカッパ（岩手・遠野の昔話・ミズ） | a cheerful green kappa from Tono folklore with a water dish on its head, a bowl-cut green fringe, a yellow duck-like beak, a pale belly and a brown shell peeking from behind, one hand raising a cucumber | #1a1428 #4cbf4c #2a7a36 #8fe36f #e8f7a0 #ffd447 #80c6ff #ffffff #ff8fb1 #7a5230 #3a2a22 #c08a55 |
| ササカマウオ（宮城・笹かまぼこ・ミズ） | a cheerful fish shaped like a bamboo-leaf fish cake: pale cream leaf-shaped body standing on its tail, three diagonal toasted-brown grill marks, blue fins on the head and sides, a blue tail fin as feet | #1a1428 #f4dfb3 #e2b27a #c08a55 #7a5230 #3d8ef0 #1f4fa3 #80c6ff #ffffff #ff8fb1 #c2405a |
| ズンダマル（宮城・ずんだもち・モリ） | a round white rice-cake blob covered with bright green mashed-edamame paste dripping down its sides, little bean bumps, a green edamame pod lying tilted on top | #1a1428 #4cbf4c #2a7a36 #8fe36f #e8f7a0 #f4f1e8 #d2d7e2 #ffffff #ff8fb1 |
| コケシーナ（宮城・鳴子こけし・ツチ） | a Naruko kokeshi doll soldier: big round head with a glossy black bob and red flower hair ornaments, a tiny red mouth, a cylindrical pale-wood body with a red neck band, a big red chrysanthemum, green leaves and a green base band | #1a1428 #2b2440 #4a5063 #f6d2b0 #f4dfb3 #e2b27a #e5484d #a8341f #4cbf4c #2a7a36 #ffffff #ff8fb1 |
| キリタンポン（秋田・きりたんぽ・ヒノ） | a toasted kiritanpo rice stick with golden-brown grill bands and a happy face, standing on its cedar skewer, one tall flame in the middle and two small side flames on top (not crown-shaped) | #1a1428 #f4dfb3 #e2b27a #c08a55 #7a5230 #ffffff #ff8fb1 #fff3a3 #ffd23f #ff9e5e #f0603c |
| マゲワッパン（秋田・曲げわっぱ・モリ） | a round bentwood lunch-box soldier of pale Akita cedar with wood grain and a dark cherry-bark stitch seam, its lid worn like a hat with a cedar sprig on it, little twig arms | #1a1428 #e2b27a #c08a55 #f4dfb3 #3a2a22 #7a5230 #4cbf4c #2a7a36 #8fe36f #ffffff #ff8fb1 |
| アキタイヌ（秋田・秋田犬・ヒカリ） | a fluffy sitting Akita dog with an orange coat, white cheeks, muzzle and chest, pointed ears and a curled tail, a loyal smile, a small gold halo floating above its head | #1a1428 #f2a93b #b8741f #f4f1e8 #d2d7e2 #ffffff #ff8fb1 #ffd23f #c79a1a #fff3a3 |
| サクランボーイ（山形・さくらんぼ・モリ） | twin glossy red cherries joined by one forked green stem with a leaf — one monster with two faces (the left one smiles, the right one laughs with an open mouth), tiny feet, white glints | #1a1428 #e5484d #a8341f #ffffff #ff8fb1 #c2405a #2a7a36 #4cbf4c #8fe36f |
| ショウギコマンダー（山形・天童の将棋駒・ツチ） | a pale boxwood pentagon shogi piece with a cute face and a red seal emblem instead of letters, faint wood grain, tiny arms raising a red war fan (gunbai) and a spear with a red tassel | #1a1428 #f4dfb3 #e2b27a #f4f1e8 #c08a55 #7a5230 #ffffff #ff8fb1 #e5484d #a8341f #a3aabb #ffd23f |
| イモニナベ（山形・芋煮・ヒノ） | a round dark iron pot with a happy face and side ring handles, full of white taro, beef and green onion, the lid worn like a hat with a small flame knob, steam puffs, little flames under its stubby legs | #1a1428 #4a5063 #2e2a45 #6b6f80 #ffffff #d2d7e2 #ff8fb1 #7a5230 #4cbf4c #f0603c #ffd23f #c2405a |
| アカベコン（福島・赤べこ・ツチ） | a cute red akabeko cow toy seen from the front: a big red head with small beige horns and sideways ears, black painted eyebrow arches, a beige muzzle with a smile, a small red body with a gold ring medallion and gold-and-black spots, stubby legs | #1a1428 #e5484d #a8341f #ff9e5e #f4dfb3 #e2b27a #ffffff #ff8fb1 #ffd23f #2e2a45 |
| モモリン（福島・もも・ヒカリ） | a round pink peach fairy with a pointed top and a crease, two green leaves, a small gold halo floating above, a cute face with red cheeks, a cream glint and a sparkle | #1a1428 #ff8fb1 #c2405a #e5484d #ffffff #ffd23f #c79a1a #4cbf4c #2a7a36 #8fe36f #fff3a3 |
| コボシ（福島・起き上がり小法師・カゼ） | an egg-shaped okiagari-koboshi roly-poly doll: black bob hair, a white face with shiny black eyes and pink cheeks, a red kimono with a white V collar, a gold obi and a white plum-blossom mark, little mint wind swirls around it | #1a1428 #2b2440 #f4f1e8 #d2d7e2 #e5484d #a8341f #ffffff #ff8fb1 #ffd23f #c79a1a #a4f0e2 #58d0bd |
| ウミニャン（青森・蕪島と 津軽海峡の ウミネコ・カゼ。すなはま） | a chubby white black-tailed gull (umineko, the "sea cat") with pink-lined cat ears, cheek whiskers, gray folded wings with black white-spotted tips, and a tapered yellow bill with a black band and a red tip | #1a1428 #ffffff #d2d7e2 #a3aabb #6b6f80 #2e2a45 #ffd447 #e5484d #f2a93b #ff8fb1 |
| ブナッコ（青森・白神山地の ブナ・モリ。もり） | a small Shirakami beech spirit with a round crown of leaf clusters, a pale-gray trunk with white lichen patches, a smiling blushing face on the trunk, sprout arms, root feet and two hanging triangular beech nuts | #1a1428 #4cbf4c #8fe36f #2a7a36 #a3aabb #6b6f80 #ffffff #7a5230 #c08a55 #ff8fb1 |
| イワカモシカ（岩手・岩手山の ニホンカモシカ・ツチ。やま） | a front-view Japanese serow with fluffy gray fur, a pale cheek mane and throat, sideways ears with tan insides, short ringed horns curving back, big friendly eyes, pink blush and cloven hooves | #1a1428 #2e2a45 #4a5063 #6b6f80 #a3aabb #d2d7e2 #ffffff #c08a55 #3a2a22 #ff8fb1 |
| シラトリン（宮城・伊豆沼の ハクチョウ・ミズ。みずべ） | a small side-view white swan facing left with an S-curved neck, a tiny tuft on its head, a yellow bill with a black tip, pink blush, fluffy feather lines and blue water ripples at its base | #1a1428 #ffffff #d2d7e2 #ffd447 #2e2a45 #ff8fb1 #80c6ff #3d8ef0 |

**しんか後の 姿**（32×32。仲間は ふつうの 大きさで 出るので 通常モンスターと 同じ 規格。進化前の 色・顔・モチーフを 残して ひと回り 強く・かっこよく。ボスの しるしの 王冠は つけない。手描きの仮素材と 同じ 設計。進化前の 絵を 参照画像に 添付して「同じ キャラクターが 育った すがた」と 書く）：

| しんか後 | Concept | Use only |
|---|---|---|
| リンゴナイト（リンゴロンの しんか・モリ） | an apple knight evolved from a round apple slime: red apple body with a brick helmet brim and a small gold rivet, a stem with a leaf and a white apple blossom on top, determined eyes, a leaf shield with a red apple emblem in one hand and a green leaf sword with a gold guard raised in the other, brick greaves and dark boots | #1a1428 #e5484d #a8341f #ff9e5e #ffffff #ff8fb1 #3a2a22 #4cbf4c #2a7a36 #8fe36f #ffd23f |
| クロマグロード（マグロードの しんか・ミズ） | a bluefin samurai tuna: navy back and head with a sky dorsal crest, a white hachimaki with knot tails, an azure face with brows, a gold collar over silver breastplate lames, a long katana raised in its right fin, a red-and-white fishing float at the hip, a big crescent tail behind a wide stance | #1a1428 #1a2b5e #1f4fa3 #3d8ef0 #80c6ff #c8f4ff #a3aabb #ffffff #ff8fb1 #ffd23f #e5484d |
| ドグウジン（ドグウくんの しんか・ツチ） | a giant Jomon goggle-eyed dogu golem: a ridged crest, a rope-pattern forehead band, huge coffee-bean goggle eyes with slits, broad shoulders, arms with zigzag cord bands, a green jade magatama on a brown cord necklace, thick blocky legs | #1a1428 #c08a55 #e2b27a #7a5230 #f4dfb3 #ffffff #ff8fb1 #4cbf4c #8fe36f #2a7a36 |
| カザミミズク（イタコドリの しんか・ヤミ） | a violet horned owl with tall ear tufts and a small red-and-white pinwheel on its head, a lavender face disk with gold eyes and brows, a lavender chest with V feather marks, spread wings with red, white and gold pinwheel medallions and indigo feather tips, ochre talons | #1a1428 #3a2672 #6e4fc4 #a28be6 #ffd23f #c79a1a #ff8fb1 #e5484d #f4f1e8 #7a5230 |
| オカワリバット（ワンコソバットの しんか・カゼ） | a cute bat whose body is a tall four-tier tower of red lacquer wanko-soba bowls with black rims, a black lacquer lid worn like a helmet with a small gold knob, soba noodles peeking from the top bowl, a big happy open mouth with two small fangs, large aqua bat wings with teal finger bones and mint edges | #1a1428 #58d0bd #2c8b80 #a4f0e2 #2e2a45 #4a5063 #e5484d #a8341f #e2b27a #ffffff #ff8fb1 #ffd23f |
| ドラゴンブルー（リュウセンウオの しんか・ミズ） | a small crystal-blue water dragon standing on a wide crescent tail fin: branching gold antlers, an ice-blue fin crest and cheek mane spikes, long mint whiskers, a pale snout, friendly eyes with small brows, ice fin-arms with white claws, sky belly plates, glowing mint dots (no bones) | #1a1428 #3d8ef0 #1f4fa3 #80c6ff #c8f4ff #ffffff #ffd23f #c79a1a #a4f0e2 #ff8fb1 |
| オオカッパ（トオノカッパの しんか・ミズ） | a big strong kappa: a shining water dish ringed with spiky green hair, a wide yellow grinning beak, broad shoulders and a sprout-colored belly, a large brown shell at both sides, one arm flexing a raised fist, the other hand holding a thick bumpy cucumber club with a yellow flower on its tip | #1a1428 #4cbf4c #2a7a36 #8fe36f #e8f7a0 #ffd447 #80c6ff #ffffff #ff8fb1 #7a5230 #3a2a22 #c08a55 |
| ササカマブシ（ササカマウオの しんか・ミズ） | a leaf-shaped fish-cake samurai standing upright: pale cream leaf body with three diagonal toasted-brown grill marks, a blue fin topknot, a white headband with flying knot tails, determined brows and a wide smile, blue fins as arms, a tan waist sash, dark blue pleated hakama, blue fin feet, a long bamboo-leaf blade held up | #1a1428 #f4dfb3 #e2b27a #c08a55 #7a5230 #3d8ef0 #1f4fa3 #80c6ff #ffffff #ff8fb1 #4cbf4c #2a7a36 |
| ズンダゴン（ズンダマルの しんか・モリ） | a big white rice-cake monster almost covered by a thick bright green zunda mane dripping down its sides, two green edamame pods as horns, lime bean bumps, determined brows, big friendly eyes, a grin, stubby white arms and short feet | #1a1428 #f4f1e8 #d2d7e2 #4cbf4c #2a7a36 #8fe36f #e8f7a0 #ffffff #ff8fb1 #c2405a |
| コケシヒメ（コケシーナの しんか・ツチ） | a taller kokeshi-doll princess with a glossy black bob, a big red-and-white chrysanthemum hairpin with gold dangles, a pale face with a tiny red mouth, a red long-sleeved furisode kimono with a white V collar, white flower dots, a gold obi and a green hem band, little black geta, an open white folding fan with a gold rim | #1a1428 #2b2440 #4a5063 #f6d2b0 #e2b27a #e5484d #a8341f #ffffff #ffd23f #c79a1a #4cbf4c #ff8fb1 |
| キリタンポナベ（キリタンポンの しんか・ヒノ） | a round tan earthenware hot pot with a cheerful determined face, a beige lip and a brown band with beige dots, a brown dome lid with a knob worn as a helmet, two kiritanpo sticks poking up diagonally like spears, steam puffs, stubby brown legs with a small campfire between them | #1a1428 #f4dfb3 #e2b27a #c08a55 #7a5230 #3a2a22 #ffffff #ff8fb1 #fff3a3 #ffd23f #ff9e5e #f0603c |
| ワッパトリデ（マゲワッパンの しんか・モリ） | a fortress of three stacked pale Akita-cedar bentwood boxes with beige lid rims, tan bands and dark cherry-bark stitch seams, battlements on the top box, cedar sprigs on the shoulders, the face on the middle box, a round cedar-ring shield and a raised leafy twig arm, four stubby feet | #1a1428 #e2b27a #c08a55 #f4dfb3 #3a2a22 #7a5230 #4cbf4c #2a7a36 #8fe36f #ffffff #ff8fb1 |
| チュウケンマル（アキタイヌの しんか・ヒカリ） | a heroic Akita dog sitting tall: orange coat, white cheeks, muzzle and fluffy chest, determined brows and a smile, a red scarf with a small gold bell and streaming tails, a bigger floating gold halo, a curled tail, white paws | #1a1428 #f2a93b #b8741f #f4f1e8 #d2d7e2 #ffffff #ff8fb1 #ffd23f #c79a1a #fff3a3 #e5484d #a8341f |
| ダブルチェリー（サクランボーイの しんか・モリ） | twin glossy red cherries grown bigger, holding hands between them, a V-shaped crest of two green leaves on the forked stem like a hat, an orange-red safflower (benibana) with a gold center at the fork, one smiling and one laughing | #1a1428 #e5484d #a8341f #ffffff #ff8fb1 #c2405a #2a7a36 #4cbf4c #8fe36f #f0603c #ff9e5e #ffd23f |
| リュウオウコマ（ショウギコマンダーの しんか・ツチ） | a promoted shogi piece of pale boxwood with a red lacquer emblem on its belly (a red shield with a gold wave, no letters), a red dragon helmet with forked gold antler-horns, a gold brim and gold whiskers, determined brows and a grin, raising a red war fan with a gold rim and holding a spear with a red tassel | #1a1428 #f4dfb3 #e2b27a #f4f1e8 #c08a55 #7a5230 #ffffff #ff8fb1 #e5484d #a8341f #ffd23f #a3aabb |
| ジャンボイモニ（イモニナベの しんか・ヒノ） | a jumbo round iron pot with a determined happy face, heaped and bursting with imoni (white taro, beef, green onion) pushing up its flame-knob lid, billowing steam, a huge ladle held upright like a weapon, a fire under its stubby feet | #1a1428 #4a5063 #2e2a45 #6b6f80 #ffffff #d2d7e2 #ff8fb1 #7a5230 #4cbf4c #f0603c #ffd23f #c2405a |
| アカベコドン（アカベコンの しんか・ツチ） | a big front-facing akabeko bull toy: a bulky red papier-mache body on four sturdy legs with dark hooves, long beige horns curving up and out, sideways ears, black painted eyebrow arches, a smiling beige muzzle, a gold diamond on the forehead, a gold collar, a gold ring medallion on the chest, gold and black spots | #1a1428 #e5484d #a8341f #ff9e5e #f4dfb3 #e2b27a #ffffff #ff8fb1 #ffd23f #c79a1a #2e2a45 |
| アカツキモモ（モモリンの しんか・ヒカリ） | a larger floating peach spirit in dawn colours: a pink peach with a crease, the bottom glowing apricot like a sunrise, green leaves at the tip and small leaf wings at the sides, a wide gold halo, a cheerful grin, red cheeks, a cream glint and two sparkles | #1a1428 #ff8fb1 #c2405a #e5484d #ff9e5e #ffffff #ffd23f #c79a1a #4cbf4c #2a7a36 #8fe36f #fff3a3 |
| ヤオキコボシ（コボシの しんか・カゼ） | a bigger, wider egg-shaped okiagari-koboshi roly-poly: black bob, a white face with determined brows, a red kimono with a white V collar, a gold obi and white plum-blossom marks, a small plain red-and-white banner on a pole rising behind its head (no text), mint wind swirls | #1a1428 #2b2440 #f4f1e8 #d2d7e2 #e5484d #a8341f #ffffff #ff8fb1 #ffd23f #c79a1a #a4f0e2 #58d0bd |
| ウミネコタイチョウ（ウミニャンの しんか・カゼ） | the same cat-eared gull grown bigger, with a navy captain's cap and a gold badge (not a crown), smug confident eyes, a red scarf blowing sideways and half-spread black-tipped wings | #1a1428 #ffffff #d2d7e2 #a3aabb #6b6f80 #2e2a45 #ffd447 #e5484d #f2a93b #ff8fb1 #1a2b5e #ffd23f |
| ブナタイジュ（ブナッコの しんか・モリ） | an ancient beech guardian filling the canvas: a broad two-tier canopy, a thick lichen-flecked gray trunk, bushy white brows over determined eyes and a smile, spreading roots, beech nuts and a tiny blue bird on top | #1a1428 #4cbf4c #8fe36f #2a7a36 #1f5a2e #a3aabb #6b6f80 #ffffff #7a5230 #3a2a22 #c08a55 #3d8ef0 |
| ハヤテカモシカ（イワカモシカの しんか・ツチ） | a front-view heroic serow with a long white mane flowing to both sides in pointed flicks, longer sharp horns, keen brows, a twisted straw-rope (shimenawa) scarf trailing to the right and wind lines by its legs | #1a1428 #2e2a45 #4a5063 #6b6f80 #a3aabb #d2d7e2 #ffffff #c08a55 #e2b27a #3a2a22 #80c6ff |
| オオハクチョウ（シラトリンの しんか・ミズ） | a side-view whooper swan with a long S-curved neck, the near wing raised wide, ice-tinted tips of the far wing, the same yellow-and-black bill, a small ice-crystal circlet (no gold, no red) and three snow sparkles, water ripples at its base | #1a1428 #ffffff #d2d7e2 #c8f4ff #80c6ff #3d8ef0 #ffd447 #2e2a45 |

**待機 2 コマ目**（参照画像を添付）：

```
Using the attached sprite as the exact reference (same size 32x32, same colors, same outline),
draw the second idle frame: the body squashed 1 pixel shorter and 1 pixel wider (breathing in).
Everything else identical, same foot line. Magenta background.
```

### 6.4 中ボス（40×40）

テンプレート：

```
[STYLE]
SIZE: exactly 40x40 pixels, drawn at 16x (640x640).
Mini-boss battle sprite for a children's RPG, front view, imposing but friendly, centered, feet touching the bottom edge.
It wears a small golden crown (gold #ffd23f with #c79a1a shadow and a 2-pixel red #e5484d jewel).
Concept: {CONCEPT}. Element {ELEMENT}: {SHAPE LANGUAGE}. Big eyes (3x4 px).
Use only: {COLORS} (max 15 colors).
[NEGATIVE]
```

東北の中ボス 6 体（Concept と色。手描きの仮素材と同じ設計。「強くかっこいい」ボスにする：キャンバスいっぱいの大きなシルエット、強いコントラスト、角・かぶと・武器・オーラ）：

| 中ボス | Concept | Use only |
|---|---|---|
| ネブタイショウ（青森・ねぶた・ヒノ） | a Nebuta-float warrior come alive in front of a spiky flame aura: gold kuwagata horns and crest, a blue helmet with side flaps, a white kabuki face with angry brows (red kumadori sweeping UP from the eye corners to the temples, never down the cheeks) and a shouting mouth, blue shoulder armor with red cords, a paper-and-azure chest with a flame emblem, vermilion skirt armor, left fist thrust out, right arm raising a big blade | #1a1428 #fff3a3 #ff9e5e #f0603c #e5484d #a8341f #ffd23f #c79a1a #1f4fa3 #3d8ef0 #f4f1e8 #d2d7e2 #ffffff |
| テツビンガメ（岩手・南部鉄器・ツチ） | a mighty tortoise carrying a huge dark Nambu iron kettle as its shell (arare dot pattern, big arched handle, spout on the right), a tan turtle head with a beak and determined brows, thick scaly legs in a wide stance | #1a1428 #4a5063 #2e2a45 #6b6f80 #a3aabb #c08a55 #7a5230 #e2b27a #f4dfb3 #ffd23f #c79a1a #e5484d #ffffff #ff8fb1 |
| タナバタドリ（宮城・仙台七夕・カゼ） | a grand teal bird with raised wings made of hanging Tanabata streamers (red, yellow, blue, green, purple strips), a long streamer tail between golden legs, a gold paper ball with red dots on its chest, mint crest plumes, determined eyes | #1a1428 #58d0bd #2c8b80 #a4f0e2 #ffd23f #c79a1a #e5484d #a8341f #3d8ef0 #1f4fa3 #4cbf4c #2a7a36 #6e4fc4 #3a2672 #ffffff |
| カントウマン（秋田・竿燈まつり・ヒカリ） | a grinning, determined festival strongman in a navy happi coat with a white headband, red sash and white leggings, a wide stance with one fist on his hip, balancing on his raised palm a tall bamboo kanto pole with 3 crossbars of glowing paper lanterns | #1a1428 #34406b #1a2b5e #f4f1e8 #d2d7e2 #e0ac7e #a86e4a #ffd23f #c79a1a #e5484d #fff3a3 #ffd447 #e2b27a #ffffff #ff8fb1 |
| ジュヒョウン（山形・蔵王の樹氷・ミズ） | a hulking fluffy snow beast covered in rime like Zao's juhyo: both arms raised with icy branch claws, rime tufts along the silhouette, layered snow clumps with blue shadows, a blue face hollow with determined 3x4 eyes and two small fangs | #1a1428 #ffffff #d2d7e2 #c8f4ff #80c6ff #3d8ef0 #1f4fa3 #ff8fb1 #ffd23f #c79a1a #e5484d |
| ゴシキスライム（福島・五色沼・ミズ） | a giant dome-shaped king slime with wavy horizontal bands of Goshikinuma colors (sky, cobalt, turquoise, emerald), the crown sitting on a lily pad, two tapered water arms rising at the sides with white foam crests, stern slanted brows, a toothy grin with two small fangs, bubbles and droplets | #1a1428 #ffffff #c8f4ff #80c6ff #3d8ef0 #1f4fa3 #58d0bd #2c8b80 #4cbf4c #2a7a36 #ffd23f #c79a1a #e5484d |

後半フェーズ（`bossPhases`）で見た目が変わる中ボスは、ChatGPT 編集で差分を作る：

```
Using the attached sprite as the exact reference (same 40x40 size, same pose, same outline),
change only: {CHANGE}. Keep the crown, the eyes and the silhouette identical. Max 15 colors from the palette.
```

- テツビンガメ（後半ヒノ）：`the kettle glows red-hot (dark red iron, orange arare dots) with gold cracks and a white steam puff from the spout`
- ゴシキスライム（後半モリ）：`the jelly turns mostly green (#8fe36f, #4cbf4c, #2a7a36, #1f5a2e) with one turquoise band left`

**フィールドに立つ版（32×32、`mon.<id>.field`）**：

```
[STYLE]
SIZE: exactly 32x32 pixels, drawn at 16x (512x512).
Using the attached 40x40 battle sprite as the exact reference, redraw the same mini-boss smaller as a 32x32 overworld sprite:
front view, seen slightly from above, simplified details, keep the golden crown and the silhouette recognizable.
2-frame idle is made later (same image, body 1 px lower). Max 12 colors from the reference.
[NEGATIVE]
```

### 6.5 県ボス（48×48）

```
[STYLE]
SIZE: exactly 48x48 pixels, drawn at 16x (768x768).
Prefecture boss battle sprite, front view, imposing but not frightening for kids, centered, feet or body touching the bottom edge.
Golden crown (#ffd23f / #c79a1a, red #e5484d jewel).
Concept: the guardian of Lake Towada and the Tsugaru Strait in Aomori — a large, calm water serpent coiled with its head raised,
wearing a crown decorated with two tiny red apples, deep blue and teal scales, a small Jomon-pottery rope pattern along its body,
glowing pale-blue eyes. Element WATER: round shapes, fins on the head.
Use only: #1a1428 #ffffff #1a2b5e #1f4fa3 #3d8ef0 #80c6ff #c8f4ff #2c8b80 #58d0bd #ffd23f #c79a1a #e5484d #a8341f #4cbf4c #ff8fb1 (15 colors).
[NEGATIVE]
```
（ツガルのぬし。後半フェーズはカゼ属性）

```
Using the attached sprite as the exact reference (same 48x48 size and pose),
change only: strong wind now swirls around the serpent — add 3 white and mint (#a4f0e2, #58d0bd) wind swirls, the scales turn slightly teal.
Keep the crown, the face and the silhouette identical.
```

岩手〜福島の県ボス 5 体（上のプロンプトの Concept と Use only を差し替える。後半は差分プロンプトの change only に入れる。手描きの仮素材と同じ設計。どれも「強くかっこいい」ボス：キャンバスいっぱいの大きなシルエット、強いコントラスト、王冠の金と赤い宝石）：

| 県ボス | Concept | Use only | 後半（change only） |
|---|---|---|---|
| コンジキノトラ（岩手・平泉の金・ヒカリ） | a mighty golden-orange tiger in a slight crouch seen from the front: a smaller head, broad shoulders, big front paws planted wide with white claws, bold ink stripes on the shoulders and legs (forehead stripes vertical only — they must not form the kanji 王), slanted glowing cream-and-yellow eyes under ink brows angled down toward the nose, white cheek fur and muzzle, a small roar showing two fangs, the crown between the ears, gold shoulder guards and a round gold chest plate with red jewels, a cream-and-white sunburst spiking out behind the head and shoulders, a striped tail curling up on the right | #1a1428 #f2a93b #b8741f #ffd447 #fff3a3 #ffffff #ffd23f #c79a1a #e5484d #c2405a | the sunburst grows bigger and brighter (white rays with cream tips), the eyes glow fully white, white sparkles around it |
| ミカヅキショウグン（宮城・仙台城跡・ヤミ → ヒカリ） | an EMPTY ancient samurai armor come alive (no human face, not a real person): a huge golden crescent-moon helmet crest with a red jewel, a dark void under the helmet brim with glowing gold slanted eyes, big shoulder plates with violet lacing, a gold V-shaped breastplate with a small crescent emblem, a tattered violet cape with red lining, a katana raised in the right hand, lavender edge highlights so the dark armor separates from a dark background | #1a1428 #34406b #1a2b5e #4a5063 #ffd23f #c79a1a #fff3a3 #e5484d #6e4fc4 #3a2672 #a28be6 #a3aabb #ffffff | the crescent crest and all gold trim blaze pale moonlight (cream/white), moonlight sparkles around the crest, a second glowing cream blade in the left hand |
| ナマハゲオウ（秋田・なまはげ・ヒノ） | King of the Namahage, a mighty straw-cloaked ogre-mask figure: a red mask face with glowing gold eyes, heavy brows angled down toward the nose, a broad nose and a wide open mouth with two small fangs (nothing running down from the eyes), two ivory horns with the crown between them, a wild white mane, broad shoulders under a huge straw kede flaring into a wide triangle with ragged straw tips, brown rope ties across the chest and waist, one red arm raising a wooden bucket with gold hoops high beside the head (never a knife), the other red hand pointing at the player, straw boots in a wide stance | #1a1428 #e5484d #a8341f #ff9e5e #ffd23f #c79a1a #f4f1e8 #d2d7e2 #e2b27a #c08a55 #7a5230 #ffffff #f4dfb3 | rage: the face burns bright vermilion, the mane spikes upward, flame tongues rise just outside the outline along the cape, shoulders, arm and horns (add #f0603c #fff3a3) |
| ジュヒョウノカミ（山形・蔵王の樹氷・ミズ） | a towering regal snow-fir knight: branching icy twig antlers around a gold crown with a red jewel, a dark navy helmet whose T-visor shows glowing ice-blue eyes, a short rime beard, a mantle of snow-laden fir boughs with icicles, a gold belt, two tiers of fir-branch tassets with snow bands, legs planted wide, a long ice lance held upright | #1a1428 #1a2b5e #1f4fa3 #3d8ef0 #80c6ff #c8f4ff #ffffff #d2d7e2 #ffd23f #c79a1a #e5484d | white blizzard wind curls and snowflakes around it, the eyes flare pure white |
| ツルガジョウノヌシ（福島・鶴ヶ城・カゼ → ヒカリ） | a majestic white red-crowned crane spreading its wings horizontally: red roof-tile pauldrons with gold trim, long white flight feathers with black tips, a chest plate of red roof-tile stripes with gold bands, a helmet shaped like a Japanese castle roof in red tiles with gold shachi ornaments and a red-jewel gold medallion, the head in profile looking right (red crown patch, gold eye, long beak), long dark legs, mint wind curls at its feet | #1a1428 #ffffff #d2d7e2 #2e2a45 #4a5063 #e5484d #a8341f #ffd23f #c79a1a #e2b27a #c08a55 #a4f0e2 #58d0bd | the wings glow golden: feather lines turn #ffd447, the white is shaded #fff3a3, cream light rays and gold sparkles around the wings |

### 6.6 地方ボス（56×56、フェーズ 3 つ）

```
[STYLE]
SIZE: exactly 56x56 pixels, drawn at 16x (896x896).
Final boss of the Tohoku region, front view, majestic and a little intimidating, still stylized and child-friendly.
Concept: "the King of the Six Winters" — a towering figure made of snow and ice, wearing one charm from each of the 6 Tohoku prefectures:
a paper-lantern mask (Aomori), a straw cape (Akita), the fist gripping the arched handle of a squat black Nambu iron kettle
(tetsubin: round body with arare dots, lid knob, short spout) and hanging it like a heavy flail (Iwate),
a crescent-moon crest on the forehead (Miyagi), cherries hanging from the belt (Yamagata), a small red cow charm (Fukushima).
Phase 1: ice armor with huge ice-crystal pauldrons, cold blue colors.
Use only: #1a1428 #ffffff #c8f4ff #80c6ff #3d8ef0 #1f4fa3 #1a2b5e #ffd23f #c79a1a #e5484d #a8341f #f4f1e8 #e2b27a #2e2a45 #4a5063 (15 colors).
[NEGATIVE]
```

- フェーズ 2：`the ice armor is half broken and warm red-orange flames (#f0603c, #ff9e5e, #ffd23f) show through the cracks, the eyes burn gold, the kettle's arare dots glow red-hot; same pose and size`（色は上の 15 色から #ffffff と #1f4fa3 を抜いて #f0603c #ff9e5e を足す）
- フェーズ 3：`the ice has melted: the figure is smaller (about 36-40 px tall inside the same 56x56 canvas), round and gently smiling, sitting down, a green sprout with a pink blossom on its head, the kettle steaming on the ground and the red cow charm beside it — it was only waiting for spring`（色は #1a2b5e と #1f4fa3 を抜いて #4cbf4c #ff8fb1 を足す）

### 6.7 アイテム・装備アイコン（16×16、3×3 で生成して分割）

ルール：輪郭こみで 14×14 に収める（外周 1 ドット透明）、**8 色まで**、斜め 45°（武器は左下→右上）、1 つずつ別のマスに。

```
[STYLE]
SIZE: a 3x3 grid of 9 equal cells, each cell exactly 16x16 pixels, drawn at 20x (whole image 960x960, every pixel a 20x20 block).
One RPG item icon per cell, centered, each icon fits inside 14x14 pixels with a 1-pixel empty margin, max 8 colors per icon.
Items are shown at a 45-degree angle; weapons point from bottom-left to top-right.
1 {ITEM 1}, 2 {ITEM 2}, … 9 {ITEM 9} (left to right, top to bottom).
Use only these colors: {COLORS}.
[NEGATIVE]
```

記入例（青森の装備・素材）：

```
[STYLE]
SIZE: a 3x3 grid of 9 equal cells, each cell exactly 16x16 pixels, drawn at 20x (whole image 960x960).
One RPG item icon per cell, centered, each icon fits inside 14x14 pixels with a 1-pixel empty margin, max 8 colors per icon.
Items are shown at a 45-degree angle; weapons point from bottom-left to top-right.
1 a samurai-style helmet made of a glowing Nebuta paper lantern (white paper, red and gold patterns),
2 a chest armor shaped like a shiny red apple,
3 a waist guard made of light wooden plates (Aomori hiba cypress),
4 a pair of glossy dark-red lacquer boots with a speckled pattern (Tsugaru-nuri),
5 a spear whose tip is a stylized bluefin tuna,
6 a simple short copper sword,
7 a red apple with one green leaf,
8 a bundle of green medicinal herbs tied with string,
9 a small grey iron ingot.
Use only: #1a1428 #ffffff #f4f1e8 #e5484d #a8341f #ffd23f #c79a1a #c08a55 #e2b27a #7a5230 #3a2a22 #4cbf4c #2a7a36 #3d8ef0 #1f4fa3 #6b6f80 #a3aabb #f0603c
[NEGATIVE]
```

→ 順に `aomori-nebuta-no-kabuto`・`aomori-ringo-no-yoroi`・`aomori-hiba-no-koshiate`・`aomori-tsugaru-nuri-boots`・`aomori-maguro-zutsuki`（マグロずつき）・`common-dou-no-ken`・`aomori-ringo`・`common-yakusou`（やくそう。2026-09 に ゲームから なくした）・`common-tetsu`。

2 枚目（素材）：`1 a broken piece of Jomon earthenware with rope pattern`（土器のかけら）、`2 a necklace of curved jade magatama beads`（じょうもんのくび飾り）、`3 a sharp white fish fang`（マグロのきば）、`4 a crystal of frozen lake water, pale blue`（みずのかけら）、`5 a small glowing paper lantern light`（ねぶたの灯り）、`6 a short log of pale yellow hiba wood`（ひばの木）。

### 6.8 顔グラ（48×48）

```
[STYLE]
SIZE: exactly 48x48 pixels, drawn at 16x (768x768).
Bust-up portrait (head and shoulders) of the attached character, facing slightly left, {normal / happy / surprised / troubled} expression.
Same colors as the reference sprite, larger face details allowed (eyes 2x4 px with a 1 px white highlight). Max 15 colors.
[NEGATIVE]
```

表情は 4 種（ふつう・えがお・おどろき・こまった）。別ファイル `face.<id>` / `face.<id>-happy` など。

### 6.9 名所イラスト（240×135）

名所に着いたときのカットイン（×2）と図鑑、そしてバトル背景（×4）に使う。**下 1/4 は平らな地面** にし、人物・モンスター・文字は描かない。

テンプレート：

```
[STYLE-BACKGROUND]
16-bit SNES era Japanese RPG pixel art landscape, exact pixel grid, 1 pixel = 1 dot, hard edges, no anti-aliasing.
Light from the top-left. 2-pixel checkerboard dithering is allowed only in the sky.
SIZE: exactly 240x135 pixels, drawn at 4x (960x540, every pixel a 4x4 block).
{PLACE DESCRIPTION}. Peaceful, sunny, educational-illustration mood for children.
Horizon between 1/3 and 1/2 of the height; the bottom quarter is flat, simple ground with no objects.
No people, no animals, no text. Max 24 colors.
PALETTE: use ONLY these colors: {NQ-48 から 24 色まで}
[NEGATIVE]
```

記入例（PLACE DESCRIPTION の部分）：

- 十和田湖（青森・秋田）：`Lake Towada in Aomori: a wide, calm deep-blue crater lake surrounded by forested mountains with autumn leaves, a small wooden pier`
- 三内丸山遺跡（青森）：`Sannai-Maruyama Jomon site in Aomori: a tall reconstructed six-pillar wooden tower, thatched pit dwellings, green field, blue sky with pixel clouds`
- 中尊寺金色堂（岩手）：`the Konjikido golden hall of Chusonji in Hiraizumi, Iwate: a small temple hall shining with gold, tall cedar trees around, stone steps`（建物として描く）
- 松島（宮城）：`Matsushima Bay in Miyagi: many small rocky islands covered with pine trees in a calm blue sea, a tiny sightseeing boat`
- 田沢湖（秋田）：`Lake Tazawa in Akita: a round, very deep cobalt-blue lake, green hills, a small golden maiden statue standing in the water near the shore`
- 蔵王の樹氷（山形）：`the snow monsters (juhyo) of Mount Zao in Yamagata: rows of trees completely covered with thick white rime ice on a snowy slope under a clear blue sky`
- 鶴ヶ城（福島）：`Tsuruga Castle in Aizu-Wakamatsu, Fukushima: a white Japanese castle keep with red-brown roof tiles on a stone wall, cherry trees in bloom`

→ `motif.<area>.<motifId>`（例 `motif.aomori.towada-ko` → `assets/motifs/aomori/towada-ko.png`）。宗教施設は **風景・建物として描くだけ**（キャラ化・敵化しない）。

### 6.10 バトル背景（240×135）

```
[STYLE-BACKGROUND]
SIZE: exactly 240x135 pixels, drawn at 4x (960x540).
Side-view battle background for a Japanese RPG: {field — green hills, distant blue mountains, clouds / cave — dark rocky walls, glowing crystals, stalactites / boss — dusk sky in red and purple, a large setting sun, dark silhouettes of hills / forest — a row of round tree crowns with trunks, dark green ground, a few red mushrooms / mountain — tall gray rocky peaks with snow caps, tan ground with rocks and small pink alpine flowers / beach — the sea to the horizon with a small island, white foam at the shoreline, sand with shells and starfish / shore — a lake with far green hills, reeds and cattails on grass / farm — rows of rice seedlings, distant blue mountains, a small scarecrow}.
The ground is a flat band from 55% of the height down to the bottom, with a few horizontal lines for depth; characters will stand on it
(enemy on the left, heroes on the right), so keep the ground empty and not too busy. No platforms, no circles on the ground.
Max 24 colors. PALETTE: {NQ-48 から}
[NEGATIVE]
```

### 6.11 タイルセット（128×320＝16×16 を 8 列×20 行）

番号は Tiled のタイル番号（`maps/*.json` の gid）で、コードもこの番号で「通れる・通れない」を決めています。**並び順を変えないこと。**

| 番号 | タイル | 通行 | 推奨の色 |
|---|---|---|---|
| 1 | 草原 | ○ | lime / leaf（草のドットは green） |
| 2 | 道 | ○ | sand / tan |
| 3 | 水（海・湖） | ×（とおれない） | azure / sky（波 ice） |
| 4 | 木・森（室内マップの外周） | × | leaf / green / forest |
| 5 | 町の石だたみ | ○ | cloud / silver |
| 6 | 家の屋根 | ― | red / brick |
| 7 | ダンジョンの床 | ○ | night / slate |
| 8 | ダンジョンの壁 | ― | indigo / night |
| 9 | ゲート | ○ | violet / lavender |
| 10 | 橋 | ○ | tan / brown |
| 11 | 丘・山（地面の 性質 ができる 前の 丘。いまの フィールドは 149〜152） | ○ | leaf / green の山型 |
| 12 | 高い山 | ○ | tan / brown の山型＋頂上に white の雪 |
| 13 | 花の咲いた草原 | ○ | lime＋blush / cream / white の小花 |
| 14 | 草原（ちがう草のもよう） | ○ | lime / leaf / sprout |
| 15 | 石だたみ（ずらした目地） | ○ | beige / sand |
| 16〜18 | 屋根（青・緑・茶。6 の赤と合わせて 4 色） | ― | azure・leaf・tan（段は blue・green・brown） |
| 19 | 家のかべ | ― | beige（はしら brown、上下 tan） |
| 20 | まどのあるかべ | ― | beige＋sky のまど |
| 21 | とびら | ― | amber / brown＋gold の取っ手 |
| 22〜37 | 町の小物（**すけ**。decor レイヤーで地面に重ねる）：22 さく、23 花だん、24〜27 ふんすい（2×2 マス）、28 がいとう、29 ベンチ、30 たる、31 くだものの木、32 木、33 いけがき、34 けいじばん、35 やたい、36 いど、37 木ばこ | ×（マップの collision） | 木は green / leaf、木の物は tan / brown、ふんすいは azure / sky |
| 38〜41 | ダンジョン「どうくつ」：床・床2・かべ（上から見た岩）・かべの前の面 | ○ ○ × × | slate / gray / night |
| 42〜45 | 「こおりの どうくつ」（同じ並び） | ○ ○ × × | ice / sky / blue / azure |
| 46〜49 | 「水の どうくつ」（同じ並び。地底湖） | ○ ○ × × | denim / teal / navy / aqua |
| 50〜53 | 「お寺・神社の中」：木の床・たたみ・かべ・しょうじ | ○ ○ × × | tan / sand / ink / paper（かべに すじを入れない。床と まぎらわしいため） |
| 54〜59 | ダンジョンの小物（**すけ**）：54 たいまつ（かべの前の面に重ねる）、55 クリスタル、56 いわ、57 せきじゅん、58 みずたまり、59 さいだん（いちばん奥の部屋） | ×（マップの collision） | orange / gold、violet / lavender、gray / silver、navy / blue |
| 60 | あかいじゅうたん | ○ | red / gold / brick |
| 61〜64 | 県ごとの町の地面：61・62 雪、63・64 すな | ○ | white / cloud / ice、sand / tan |
| 65〜68 | 屋根：65 かわら、66 沖縄の赤がわら（しっくいの白いすじ）、67 雪の積もった屋根、68 かやぶき | ― | slate / night、vermilion / paper、white / brown、ochre / amber |
| 69〜77 | 町の木（**すけ**）：69 松、70 雪の松、71 ヤシ、72 さくら、73 竹、74 みかん、75 もも、76 なし、77 ぶどう棚 | × | green / forest、blush、leaf / lime、orange・blush・cream の実、violet |
| 78〜87 | 畑（**すけ**。南の畑にしきつめる）：78 田んぼ、79 茶畑、80 ラベンダー、81 チューリップ、82 キャベツ、83 パイナップル、84 ネモフィラ、85 いちご、86 小麦、87 スイカ | × | sky＋leaf、green、violet、red / yellow、lime、gold、sky、red、yellow、green / forest |
| 88〜96 | 町の小物（**すけ**）：88 石どうろう、89 ちょうちん、90 雪だるま、91 シーサー、92 シカ、93 船（海に重ねる）、94 桟橋（○ 歩ける板）、95 温泉のお湯（× 地面）、96 湯けむり | × | gray / silver、red、white、orange、tan、brown、aqua / mint |
| 97〜101 | 広場の名所の部品（**すけ**）：97 神社のかべ（朱の柱）、98 お城の屋根、99 お城の白かべ、100 石がき、101 首里城の赤いかべ | × | vermilion / paper、slate / white、silver / gray、vermilion / gold |
| 102〜104 | 空き | | |
| 105〜108 | 鳥居（2×2、**すけ**） | × | ink / vermilion / gold |
| 109〜112 | 109〜111 灯台（上・まん中・下、**すけ**）、112 海の鳥居（水の上。地面） | × | white / red / sky、azure / vermilion |
| 113〜122 | 東京タワー（2×5、**すけ**） | × | vermilion / white |
| 123〜128 | 時計台（2×3、**すけ**） | × | red / white |
| 129〜132 | まつりの山車（2×2、**すけ**） | × | cream / red / blue / brown |
| 133〜136 | 恐竜の像（2×2、**すけ**） | × | leaf / green / gray |
| 137〜146 | 五重塔（2×5、**すけ**） | × | slate / vermilion / gold |
| 147〜148 | すなはま（地面の 性質。147 貝がら、148 風の もようと ヒトデ） | ○ | sand / tan / beige / paper、apricot |
| 149〜150 | もり（149 まるい 木 2 本、150 とがった 木 2 本） | ○ | green の 地に leaf / lime / forest、みき bark |
| 151〜152 | やま（151 灰色の 岩山、152 ごろごろ岩と 高山の 花） | ○ | tan の 地に silver / gray / slate、blush |
| 153〜154 | みずべ（153 水たまりと ガマ、154 しめった 草地と あし） | ○ | lime の 地に azure / sky / aqua / mint、green＋brown の 穂 |
| 155〜156 | たんぼ（155 みどりの なえ、156 こがね色の いね。北と 西の はしが あぜ道） | ○ | lime / green / mint、yellow / ochre / cream、あぜ tan |
| 157〜158 | 果樹園（157 りんご・さくらんぼ、158 もも） | ○ | lime の 地に leaf の 木、red / blush の 実 |
| 159〜160 | 空き（あとで追加）。県の外の陸地は 3 の海で描く（県はそれぞれ海にかこまれた島） | | |

町とダンジョンは `scripts/scaffold-maps.ts` がシード付き乱数で組み立てます（町は 52×40、ダンジョンは部屋と通路の迷路）。ダンジョンの見た目は県ごとに `DUNGEON_THEMES` で決めます（書いていない県は どうくつ）。町の見た目（地面・木・屋根・広場の名所・畑・街灯・海ぞい・小物）は県ごとに `scripts/data/towns.ts` の `TOWN_THEMES` で決めます（その土地の名所・特産品・気候から。`note` に理由）。61〜146 の絵は `src/scenes/overworld/townTiles.ts`。147〜158 の 地面の 絵は `fieldArt.ts`、フィールドの どこに どの 地面を 置くかは `scaffold-maps.ts` の `groundTiles`（海・湖・丘からの きょり。docs/00 §2.2、`src/core/world/ground.ts`）。フィールドと 離島では、その上に 見た目だけの 別の タイル `overworld-view` を かさねる（`src/scenes/overworld/viewTiles.ts` が 描く 8 列の テクスチャ。どの マスに どれを 使うかは `overworldView.ts`：海の 白い 波・森と すなはまの まるい ふち（となり 4 方向の しるし）・山・田んぼの なえの 列・果樹園の 木）。地面の 判定・エンカウントは 下の background の まま。入口の しるし（家・どうくつ・お城・船）は `entranceIcons.ts`。

> コードの仮タイル（`src/scenes/overworld/fieldArt.ts`）も上の NQ-48 の色で描いてあります。本番のタイルは同じ色の割り当てで。

```
[STYLE]
SIZE: a grid of 8 columns x 8 rows of tiles, each tile exactly 16x16 pixels, drawn at 8x (whole image 1024x1024, every pixel an 8x8 block).
Top-down 3/4 RPG overworld tileset for Japan, seamless/tileable edges on every tile, same light direction on every tile.
Row 1: grass, dirt path, water with small waves, dense forest, town cobblestone, red house roof, dark dungeon floor, dungeon wall.
Row 2: glowing violet gate, wooden bridge, green hill with a small mountain shape, high brown mountain with a white snow cap, grass with small flowers, grass variant, cobblestone variant, blue roof.
Row 3: green roof, brown roof, plaster house wall, wall with a window, wooden door, wooden fence (transparent), flower bed (transparent), fountain top-left quarter.
Row 4: fountain top-right, bottom-left, bottom-right quarters, street lamp, bench, barrel, fruit tree, round tree (all transparent).
Row 5: hedge, notice board, market stall with a striped awning, well, wooden crate, cave floor, cave floor variant, cave rock mass seen from above.
Row 6: cave wall front face, ice floor, ice floor variant, ice rock mass, ice wall face, underground lake floor, its variant, dark blue rock mass.
Row 7: lake cave wall face, wooden shrine floor, tatami, dark shrine wall mass (no stripes), shoji wall face, torch, violet crystal, boulder.
Row 8: stalagmite, water puddle, stone altar with a gold relic, red carpet with gold edges, snow, snow variant, sand, sand variant.
Rows 9-19: the town theme tiles in the table above, in the same order (Japanese roofs, trees, crop fields, props, and the castle / torii / lighthouse / tower / clock tower / festival float / dinosaur statue / five-story pagoda blocks).
Tiles 147-158 (end of row 19 and row 20): field ground tiles — sand beach with shells, sand with ripples and a starfish, two round trees on dark grass, two conifers on dark grass, a gray rocky peak on tan ground, boulders with alpine flowers, a puddle with cattails, wet grass with reeds, a green rice paddy, a golden rice paddy (both with dirt ridges on the top and left edges), an apple orchard, a peach orchard. Tiles 159-160: empty magenta cells.
Use only the NQ-48 palette. Max 32 colors.
[NEGATIVE]
```

生成物のグリッドはずれやすいので、`03` §7 の `img:align-grid --tile 16` で必ず整列させ、Tiled で読み込んでから Aseprite で直す。

### 6.12 フィールドの小物（ワープホール・名所の看板・宝箱）

コードが仮素材を描いている小物です。キーはコード側の実装に合わせて決め、決めたらこの表に書き足してください。

| 小物 | 実寸 | コマ | 色 |
|---|---|---|---|
| ワープホール（中ボスを倒すと出る、次の県への入口） | 32×32（2×2 タイル） | うずまき 4 コマを横に（128×32） | violet / lavender / sky / white / indigo |
| 名所の看板（★） | 16×16 | 3 コマ（見つける前は ★ が silver の灰色、見つけてチャレンジがまだなら white＋上に orange の「！」、チャレンジまで終わったら gold の金色。名前の札は出さない） | brown / tan / silver / white / gold / orange |
| 宝箱 | 16×16 | 閉・開の 2 コマ | tan / brown / gold / ochre / bark |

```
[STYLE]
SIZE: 4 cells side by side, each exactly 32x32 pixels, drawn at 8x (whole image 1024x256).
A magical warp hole lying on the ground of a top-down RPG map, seen from slightly above: a glowing violet spiral portal.
4 animation frames: the spiral rotates 90 degrees clockwise per frame; small white sparkles move inward.
Use only: #1a1428 #3a2672 #6e4fc4 #a28be6 #80c6ff #ffffff (6 colors).
[NEGATIVE]
```

```
[STYLE]
SIZE: 2 cells side by side, each exactly 16x16 pixels, drawn at 32x (whole image 1024x512).
A small wooden signpost for a famous sightseeing spot on a top-down RPG map, with a big star painted on the board.
Left cell: the star is plain grey (a spot not found yet). Right cell: the same signpost, the star is bright golden yellow (found).
Use only: #1a1428 #3a2a22 #7a5230 #c08a55 #e2b27a #a3aabb #ffd23f #c79a1a (8 colors).
[NEGATIVE]
```

### 6.13 UI 部品

UI の大部分（黒い窓・白 4px の枠・赤い ♥ カーソル・文頭の「＊」）は CSS とフォント（PixelMplus12）で描いています。画像で作るのはアイコンだけ。

```
[STYLE]
SIZE: a 3x3 grid of 9 equal cells, each cell exactly 12x12 pixels, drawn at 24x (whole image 864x864).
Tiny flat RPG UI icons, one per cell, readable at 24 px on screen, max 6 colors each:
1 fire flame, 2 water drop, 3 green leaf, 4 brown rock, 5 teal wind swirl, 6 yellow shining star,
7 purple crescent moon, 8 grey circle (no element), 9 empty.
Colors per icon = the element ramp of NIHON QUEST: fire #a8341f #f0603c #ff9e5e #ffd23f, water #1f4fa3 #3d8ef0 #80c6ff #c8f4ff,
grass #2a7a36 #4cbf4c #8fe36f #e8f7a0, earth #7a5230 #c08a55 #e2b27a #f4dfb3, wind #2c8b80 #58d0bd #a4f0e2 #ffffff,
light #c79a1a #ffd447 #fff3a3 #ffffff, dark #3a2672 #6e4fc4 #a28be6 #ffd23f, none #4a5063 #a3aabb #d2d7e2 #ffffff, outline #1a1428.
[NEGATIVE]
```

教科アイコン（2 枚目）：`1 a calligraphy brush (Japanese), 2 an abacus (math), 3 a round-bottom flask (science), 4 a tiny map of Japan (social studies), 5 a sprout (life studies), 6 a speech bubble with three dots (English)`。

---

## 7. 生成後のチェックリスト

AI の出力は「ドット絵っぽい大きな画像」です。**必ず縮小・減色してから** 使います（流れは `03` §8）。

- [ ] 背景のマゼンタ `#FF00FF` が完全に消えて透明になっている（ふちにピンクが残っていない）
- [ ] 実寸（§2.2）ぴったり。16×24 / 32×32 / 40×40 / 48×48 / 56×56 / 16×16 / 48×48 / 240×135
- [ ] 縮小は **ニアレストネイバー**（バイリニア・バイキュービックは不可）
- [ ] 使っている色がすべて NQ-48（**パレット外の色 0**）。色数が §2.3 の上限以内
- [ ] 外周の 1px 輪郭が ink `#1a1428` で、途切れていない。純黒 `#000000` がない
- [ ] 半透明のドット・グラデーション・ディザ（背景以外）がない
- [ ] 1 ドットだけ浮いたゴミがない
- [ ] 足元の位置がそろっている（人物は最下行、モンスターは下端から 0〜2 ドット、左右中央）
- [ ] シートのコマの並び（列＝右足・立ち・左足／行＝下・左・右・上、バトルは 6 コマ）が合っている
- [ ] 主人公はインデックスのスロット順（§3.4）で保存した
- [ ] 文字・ロゴ・透かしが入っていない
- [ ] 真っ黒にぬりつぶしても何かわかるシルエット

`03` §7 の後処理コマンド（まだ実装前。`03` §7 のプロンプトで作る予定）との対応：

| やること | コマンド | 注意 |
|---|---|---|
| マゼンタを抜く・縮小・減色 | `pnpm img:pixelize <in> <out> --size <W>x<H> --palette assets/palette/nq48.hex` | `--size` は 16x24 のような長方形も指定できるようにする |
| コマをシートに並べる | `pnpm img:sheet <frames…> --cols 3 --rows 4 --size 16x24 --out <out>` | 足元（下端中央）でそろえる |
| 3×3 アイコンを分割 | `pnpm img:split-grid <in> --cols 3 --rows 3 --out-dir assets/items --names …` | 分割後に 16×16 へ pixelize |
| タイルのずれを直す | `pnpm img:align-grid <in> --tile 16 --out <out>` | |
| 主人公の 27 通り | `pnpm img:swap <in> --map …` | 色ではなくインデックスで置き換える |
| 規格の検査 | `pnpm img:check` → `pnpm validate:content` | 寸法・透過・NQ-48 準拠 |
| 共通パレットを作る | ~~`pnpm img:palette`~~ | **使わない**（NQ-48 固定） |

スクリプトができるまでは Aseprite で：*Sprite Size*（Nearest-neighbor で 1/N）→ マゼンタを *Select > Color Range* で消す → *Load Palette*（nq48.gpl）→ *Color Mode > Indexed / Dithering: None* → 輪郭と足元を手で直す → PNG で書き出し。

---

## 8. コードの仮素材との関係

本番の絵が揃うまで、コードが **同じ規格の仮のドット絵** を自動で描いています。**同じキーで PNG を先に読み込めば、そちらが優先** されます（仮素材は「そのキーがまだ無いとき」だけ作られる：`src/scenes/art/sheet.ts` の `addSheet` / `addImage`、バトルの `monsterTexture`）。

| キー | 仮素材を描いているところ | 本番の PNG |
|---|---|---|
| `char.hero.<かみ><はだ><服>` / `….battle` | `src/scenes/art/characters.ts`（見た目ごとに 1 枚） | `char.hero` / `char.hero.battle`（見た目 0-0-0）＋スワップ |
| `char.<npcId>` | `characters.ts` の `NPC_LOOKS`（役割の色） | NPC ごとに `assets/sprites/characters/<id>.png` |
| `mon.<id>`（と `.p<番号>`・`.field`） | **手描き** `src/scenes/art/monsters/<県>.ts`（東北の モンスター ぜんぶ。しんか後・地面の モンスターも。中ボスは `.field` の 32×32 も）→ そこに無いモンスターは `src/scenes/battle/pixelArt.ts` の `monsterArt`（id をシードに属性の形で自動生成） | `assets/sprites/monsters/<id>.png`（`.field` は `<id>-field.png`） |
| `bt.fx.<種類>`（火の玉・しずく・葉っぱ・岩・やみの玉・土けむり・風の刃・光の柱・光の わ・星／こうげきの 形：ひっかき・かみつき・つき・ななめ切り・×・回転切り・地ひびき／属性の かけら：火の粉・あわ・葉・小石・風・きらめき・やみの ほのお。1 まい 6 色まで） | `src/scenes/battle/fxArt.ts`（×4 表示。動きは `battle/motions.ts`。色と 形は `tests/unit/fxArt.test.ts`） | `assets/fx/<種類>.png`（予定） |
| `bt.bg.field` / `dungeon` / `boss`、地面ごとの `forest` / `mountain` / `beach` / `shore` / `farm` | `pixelArt.ts` の `backdropArt` | `assets/backdrops/<kind>.png`（予定） |
| `overworld-tiles` | Overworld シーンのプレースホルダ生成 | `assets/tilesets/overworld-tiles.png` |

- 仮素材も NQ-48・同じ寸法・同じ「かたちの言葉」で描いているので、差し替えても画面の倍率や足元の位置は変わりません。
- **手描きの仮モンスター**（`src/scenes/art/monsters/`）は、1 文字＝1 ドットの地図で描く（`design.ts`）。外周の ink は自動、`mirror: true` のレイヤーは左半分だけ書いて左右反転、`rim` は右と下のふちを かげ色にする（光は左上）。ボスのフェーズ差分（`.p<番号>`）が無ければ、ふだんの絵のまま。規格（大きさ・NQ-48・色数・王冠の金と赤・足もと・外周の輪郭）は `tests/unit/monsterArt.test.ts` が見張る。本番の PNG を AI で作るときは、この仮素材を参照画像に添付してよい（形と色の割り当てが規格どおりなので、差し替えても印象が変わりにくい）。
- `pnpm validate:content` は、`content` に書かれたキー（`char` / `mon` / `face` / `item` / `motif`）の PNG が無いと warning を出します。どれがまだ無いかの一覧として使ってください。
- 本番 PNG の読み込み（Boot シーンの preload）は、素材が揃った段階で追加します。キー名さえこの表と `03` §1 に合わせておけば、コード側の変更は読み込みの数行で済みます。

---

## 付録：1 体ぶんの記入シート（コピーして使う）

```
id:                （例 aomori-midboss-nebuta-taisho）
種別:              通常 32 / 中ボス 40 / 県ボス 48 / 地方ボス 56
県・モチーフ:        （content の area / motifId）
生き物の型:          （スライム・鳥・ゴーレム・武者 …）
属性とかたちの言葉:   （§3.2）
使う色（hex）:       （上限 §2.3）
特徴 2〜3 個:
性格:
フェーズ差分:        （あれば、変えるところだけ）
参照画像:           （合格済みの近い素材）
```
