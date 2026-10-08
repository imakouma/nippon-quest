# 04 — コンテンツテンプレート（問題作成者・コンテンツ担当向け）

> **コードを書かない人のためのファイル** です。ここに載っている形の JSON を `content/` に置くだけでゲームに反映されます。エディタは VS Code 推奨（`"$schema"` を書くと補完とエラー表示が出ます）。
>
> 共通ルール：
> - `id` は半角小文字・数字・ドット・ハイフンのみ。プロジェクト全体で重複不可。
> - 人に見せる文字列はすべて **RubyText**：漢字の直後に `[よみ]`。例 `"三内丸山遺跡[さんないまるやまいせき]"`、`"青森[あおもり]の りんご"`。ひらがなだけならそのまま。
> - ゲームでは、プレイヤーが **まだ習っていない漢字**（漢字表示レベル＝学年より上の学年の漢字）を ふくむ ことばは、ルビではなく **ひらがな**（`[よみ]` の読み）で出る。だから `[よみ]` は ことばの まとまりごとに付ける（`世界遺産[せかいいさん]` → 小3 なら「せかいいさん」）。地名・名前は漢字＋ルビのまま出る：「〇〇市・〇〇町・〇〇村」などは そのまま、それ以外の地名は `content/i18n/proper-nouns.json` の `names` に書き足す。
> - **漢字の問題で問う漢字には ルビを付けない**（例：`"「湖」の よみかたは？"`）。ルビの無い漢字は、学年に関係なく いつも そのまま出る。
> - 学年・教科コード：`grade` 1〜6、`subject` は `kokugo / sansu / rika / shakai / seikatsu / eigo`。
> - 置いたら `pnpm validate:content`（またはコードの人に頼む）。参照切れ（存在しないアイテムIDなど）はここで見つかる。

---

## 1. フォルダの対応表

| 作るもの | 置き場所 | スキーマ |
|---|---|---|
| 問題 | `content/questions/<subject>/g<学年>/<単元>.json`（配列） | `schemas/questions/<type>.schema.json` |
| 都道府県（名所・敵配置・イベント・店・ミッション・NPC） | `content/prefectures/<code>.json` | `schemas/prefecture.schema.json` |
| モンスター | `content/monsters/<area>-<name>.json` | `schemas/monster.schema.json` |
| アイテム・装備・素材 | `content/items/<area>-<name>.json` | `schemas/item.schema.json` |
| わざ | `content/skills.json`（配列） | `schemas/skill.schema.json` |
| 合成レシピ | `content/recipes.json`（配列） | `schemas/recipe.schema.json` |
| 島と順序 | `content/world/japan.json` | `schemas/world.schema.json` |

---

## 2. ゲームデータの型

### 2.1 世界（`content/world/japan.json`）

```json
{
  "id": "japan",
  "name": "日本[にほん]",
  "islands": [
    {
      "id": "tohoku",
      "name": "東北[とうほく]の島[しま]",
      "order": 1,
      "mapKey": "tohoku-island",
      "areas": ["aomori", "iwate", "miyagi", "akita", "yamagata", "fukushima"],
      "bossId": "tohoku-boss-rokufuyu",
      "recommendedGrade": [1, 6]
    }
  ]
}
```

`mapKey` は、地方ボスの城のマップを作ったときに使う予定（いまは使っていない。歩ける地方マップは作らず、地方の全体は「にほんちず」で見る。GDD §2.2）。`order` は島の順番で、島の最後の県の中ボスのワープホールは、次の `order` の島の最初の県へつながる。

### 2.2 都道府県（`content/prefectures/aomori.json`）

```json
{
  "id": "aomori",
  "name": "青森県[あおもりけん]",
  "island": "tohoku",
  "capital": "青森市[あおもりし]",
  "mapKeys": { "field": "aomori-field", "town": "aomori-town", "dungeon": "aomori-dungeon" },
  "motifs": [
    { "id": "ringo", "name": "りんご", "kind": "food", "imageKey": "motif.aomori.ringo",
      "blurb": "青森県[あおもりけん]は りんごの 生産量[せいさんりょう]が 日本一[にほんいち]。" }
  ],
  "encounters": [
    { "zone": "field", "table": [ { "monsterId": "aomori-ringoron", "weight": 50 }, { "monsterId": "aomori-nebutan", "weight": 30 } ], "stepsPerCheck": 12, "rate": 0.25 },
    { "zone": "dungeon", "table": [ { "monsterId": "aomori-doguukun", "weight": 60 }, { "monsterId": "aomori-itakodori", "weight": 15 } ], "stepsPerCheck": 8, "rate": 0.35 }
  ],
  "boss": "aomori-boss-tsugaru-no-nushi",
  "midBoss": "aomori-midboss-nebuta-taisho",
  "events": [ "→ §2.6" ],
  "shop": [ { "itemId": "aomori-ringo", "price": 15 } ],
  "missions": [ "→ §2.7" ],
  "town": { "name": "りんごの 町[まち]", "npcs": [ "→ §2.8" ] }
}
```

`kind` は `landmark`（名所）/ `food`（特産品・料理）/ `craft`（工芸）/ `nature`（自然）/ `festival`（祭り）/ `history`（歴史・遺跡）。会社の商品名・ご当地キャラ・戦争や災害に かかわる場所・お酒は モチーフにしない（モチーフからモンスターも作るため）。歴史上の人物は そのまま使ってよい（裏ステージの ラスボス：県の `secret`＝`{ "name": "仙台城[せんだいじょう] 本丸[ほんまる]", "boss": "miyagi-lastboss-date-masamune" }`。入口の場所は `scripts/data/secrets.ts`）。

`midBoss`（任意）：フィールドに立つ **中ボス** のモンスター id（`"isBoss": true` にすること）。倒すと、そのマスに次の県（島の最後の県なら、次の島の最初の県）へのワープホールが開く。立つ場所はマップ生成（`pnpm scaffold:maps --force`）が町とダンジョンの間に決める。中ボスのモンスターに `"fieldLine": "ラッセラー！ ここを とおりたければ、わしと しょうぶだ！"` のように書くと、フィールドで道をふさいだときの **ボス本人のセリフ** になる（話し手の名前は「？？？」。名前はバトルまで出さない。書かなければ共通のセリフ）。

**名所スタンプと特産品の宝箱**：イベントの無い名所には ★ の看板、特産品（`kind` が `food`・`craft`）には宝箱が立つ（目安は あわせて 1 県 8〜12 か所、北海道は 18。特産品は産地に置く）。宝箱を あけると、説明（`blurb`）が出てから アイテム `<県 id>-<motif の id>`（`content/items/`。食べものは `consumable` で HP かいふく、工芸品は `material`）が もらえるので、特産品を足したら アイテムも 1 つ作る。`scripts/data/geo.ts` の `LANDMARK_SPOTS` に `県 id → motif の id → [経度, 緯度]` を足して `pnpm scaffold:maps --force`。フィールドの範囲に入る場所はフィールドに、離島マップ（佐渡・淡路島 など）の範囲に入る場所は離島に立つ（どちらにも入らない場所は置かれず、生成のときに警告が出る）。看板・入口どうしは 3 マス以上はなして置かれるので、ほぼ同じ場所に 2 つ書くと、あとの方が少しずれる。近づくと `motifs[].blurb` が名所の説明として出る（ここも RubyText・分かち書きで）。看板は **見つけるまで ★ が灰色**で、見つけると金色になる（イベントのある看板は、チャレンジが終わるまで白＋「！」）。名前の札は出さない。県ごとの名所の数は にほんちずにも出る（見つけていない名所は「？？？」）。

### 2.3 モンスター（`content/monsters/aomori-ringoron.json`）

```json
{
  "id": "aomori-ringoron",
  "name": "リンゴロン",
  "area": "aomori",
  "motifId": "ringo",
  "element": "mori",
  "baseStats": { "hp": 28, "mp": 6, "atk": 7, "def": 5, "spd": 6, "wis": 3 },
  "growth":    { "hp": 4,  "mp": 1, "atk": 1.2, "def": 1.0, "spd": 0.8, "wis": 0.6 },
  "skills": ["sk-tashizan-giri", "sk-happa-cutter"],
  "drops": [ { "itemId": "aomori-ringo", "rate": 0.4 }, { "itemId": "aomori-ringo-no-yoroi", "rate": 0.03 } ],
  "recruitRate": 0.12,
  "recruitItem": "aomori-ringo",
  "xp": 12, "gold": 8,
  "spriteKey": "mon.aomori-ringoron",
  "dexBlurb": "りんごの 妖精[ようせい]。青森[あおもり]の りんごは 100年[ねん]いじょうも 前[まえ]から 作[つく]られているよ。"
}
```

`recruitItem` がある敵は、そのアイテムを戦闘バッグに入れて「さそう」と 1 こ消費して確実に仲間になる。

属性 `element`：`hino / mizu / mori / tsuchi / kaze / hikari / yami`。ボスは `"isBoss": true` と `"bossPhases": [{ "hpBelow": 0.5, "skills": [...], "spriteKey": "..." }]` を追加。

### 2.4 アイテム（`content/items/aomori-ringo-no-yoroi.json`）

```json
{
  "id": "aomori-ringo-no-yoroi",
  "name": "りんごのよろい",
  "kind": "chest",
  "stats": { "def": 6, "wis": 1 },
  "element": "mori",
  "setId": "set-aomori",
  "price": 320,
  "iconKey": "item.aomori-ringo-no-yoroi",
  "areaOrigin": "aomori",
  "blurb": "みがいた りんごみたいに ピカピカの よろい。"
}
```

`kind`：`weapon / head / chest / legs / feet / consumable / material / key`。消耗品は `"use": { "heal": 30 }` など。セット装備は同じ `setId` を 5 点に付け、`content/sets.json` にセット効果を書く。

### 2.5 わざ（`content/skills.json` の 1 要素）

```json
{
  "id": "sk-tashizan-giri",
  "name": "たしざんぎり",
  "subject": "sansu",
  "gradeRange": [1, 1],
  "unitHint": ["sansu.g1.tashizan"],
  "power": 120,
  "element": "none",
  "mp": 3,
  "gauge": 1,
  "costGauge": 0,
  "effect": "damage",
  "questionTags": [],
  "flavor": "たしざんを といて きりつける！"
}
```

`effect`：`damage / heal / buff / debuff / scan / status`（`scan` は「しらべる」＝じゃくてん判明、理科用。`status` は あいての こうげきを おくらせる）。`gradeRange` が出題の学年帯。**上の学年のわざほど `power` を高くする**（GDD §4.3 の導線）。`gauge` は つよさ（★1〜★3。演出の はでさ）、`costGauge` は 打つのに 使う 教科ゲージ（0 ＝ 基本わざ＝こたえると たまる。★2 は 50、★3 は 100 が めやす。上限は `settings.subjectGauge.max`）。`targetType`（`singleEnemy / allEnemies / self / party`）は 省略すると effect から きまる（かいふく・まもりは `self`。まもりを 前に 立つ オトモにも かけるなら `party`）。教科ごとの 固有スキル（`sk-burst-<教科>`）は `settings.subjectGauge.uniqueSkills` で えらぶ。

### 2.6 イベント（都道府県ファイルの `events[]`）

```json
{
  "id": "aomori-ev-sannai",
  "motifId": "sannai-maruyama",
  "trigger": { "map": "aomori-field", "objectName": "ev_sannai" },
  "once": true,
  "cutinImageKey": "motif.aomori.sannai-maruyama",
  "dialogue": [
    { "speaker": "はっくつ隊長[たいちょう]", "face": "face.npc-archaeologist", "text": "ここは 三内丸山遺跡[さんないまるやまいせき]。5000年[ねん]も 前[まえ]の 村[むら]だよ！" },
    { "speaker": "はっくつ隊長[たいちょう]", "text": "土[つち]の 中[なか]から 出[で]てきたものを 古[ふる]い じゅんに ならべて くれるかい？" }
  ],
  "question": { "subject": "shakai", "gradeRange": [3, 6], "tags": ["prefecture:aomori", "event:sannai"], "type": "sort-order" },
  "rewardByScore": [
    { "min": 1.0, "reward": { "items": [ { "itemId": "aomori-jomon-kubikazari", "n": 1 } ], "xp": 40 } },
    { "min": 0.5, "reward": { "items": [ { "itemId": "aomori-doki-kakera", "n": 2 } ], "xp": 20 } },
    { "min": 0.0, "reward": { "items": [ { "itemId": "aomori-doki-kakera", "n": 1 } ], "xp": 10 } }
  ],
  "afterDialogue": [ { "speaker": "はっくつ隊長[たいちょう]", "text": "ありがとう！ これは おれいだよ。" } ]
}
```

`question.type` は省略可（省略時はエンジンが教科・学年・タグに合う問題から選ぶ）。まだ作っていないタイプを書いても、合う問題が無ければ自動でタイプ → タグ → 学年の順に条件をゆるめて出題する。**score 0 でも報酬がある** ようにするのがルール（ランクは落ちる）。

イベントは、`trigger.objectName` の ★ 看板（場所は `scripts/data/geo.ts` の `EVENT_SPOTS`）の **まわり 1 マスに入ると自動で始まる**。`once: true` なら 1 回だけ。はじめて着いたときに名所スタンプがもらえる（問題に ちょうせんしなくても、看板の ★ は黄色になる）。

### 2.7 ミッション

```json
{
  "id": "aomori-ms-01",
  "title": "リンゴロンを 3びき たおそう",
  "giverNpc": "npc-aomori-board",
  "condition": "defeat:aomori-ringoron:3",
  "reward": { "gold": 50, "items": [ { "itemId": "aomori-ringo", "n": 3 } ] },
  "hint": "りんご園[えん]の あたりに いるよ。"
}
```

`condition` の書き方：`defeat:<monsterId>:<n>` / `perfect:<subject>:<n>`（score 1.0 を n 回）/ `collect:<itemId>:<n>` / `event:<eventId>` / `recruit:<monsterId>`。

### 2.8 NPC

```json
{
  "id": "npc-aomori-shop",
  "name": "りんご屋[や]の おばあちゃん",
  "spriteKey": "char.npc-aomori-shop",
  "face": "face.npc-aomori-shop",
  "role": "shop",
  "dialogue": [ { "text": "いらっしゃい。あまい りんごは いかが？" } ]
}
```

`role`：`shop / smith（かじ屋）/ inn（宿屋）/ board（掲示板）/ arena（たいせんじょう）/ dex（図鑑係）/ talk（会話のみ）`。

---

## 3. 問題タイプ別の JSON（問題作成者はここだけ見ればよい）

すべての問題に共通の外側：

```json
{
  "$schema": "../../../schemas/questions/choice.schema.json",
  "id": "sansu.g1.tashizan.0001",
  "type": "choice",
  "subject": "sansu",
  "grade": 1,
  "unit": "sansu.g1.tashizan",
  "tags": ["prefecture:aomori", "theme:ringo"],
  "timeLimitSec": 20,
  "payload": { "…タイプごと…" },
  "explanation": "3こと 4こを あわせると 7こ。"
}
```

1 ファイル＝同じ `unit` の問題の **配列**。`id` は `<unit>.<4桁連番>`。

### 3.1 `choice`（2〜4 択）

```json
"payload": {
  "prompt": "りんごが 3こ、みかんが 4こ。ぜんぶで なんこ？",
  "promptImage": "questions/sansu/apples3-oranges4.png",
  "choices": [
    { "id": "a", "text": "7こ" },
    { "id": "b", "text": "6こ" },
    { "id": "c", "text": "8こ" },
    { "id": "d", "text": "1こ" }
  ],
  "answer": "a",
  "shuffle": true
}
```
選択肢は `text` の代わりに `image` でもよい（絵の 4 択）。`promptAudio` で読み上げ音声ファイルも指定可。

### 3.2 `picture-word`（絵と単語を結ぶ・英語/語彙）

```json
"payload": {
  "picture": "apple",
  "image": "questions/eigo/apple.png",
  "words": [
    { "id": "apple",  "text": "apple",  "audio": "audio/words/apple.mp3" },
    { "id": "grapes", "text": "grapes" },
    { "id": "peach",  "text": "peach" }
  ],
  "answer": "apple",
  "shuffle": true
}
```
- 画面：上に 絵、その下に 答えの わく、いちばん下に 英単語の カード（2〜4 まい）。カードを タップ（または 1〜4 キー）すると わくに 入る。
- 点数：1 回目で 正解 1.0、2 回目 0.5。2 回 まちがえたら 0 で、正解を 見せて おわる。正解すると 単語を 読み上げる（`audio` が あれば その音声、無ければ 英語の 声で 読み上げ）。
- `picture`：コードが 描く 仮の絵（16×16 の ドット絵。`src/questions/renderers/shared/pictures.ts`）。いまある絵：apple banana grapes orange peach strawberry lemon cherry melon / dog cat rabbit bird pig bear elephant frog / fish crab octopus whale turtle starfish。絵を 足すときは この ファイルに 1 つ 足す（テストが 16×16・NQ-48 の色か 確かめる）。
- `image`：本番の絵（あれば こちらを 出し、読めなければ `picture` を 出す）。`picture` か `image` の どちらかは 必須。
- `prompt`：省略すると「この えに あう えいごは どれ？」（`content/i18n/ja.json` の `question.pictureWordPrompt`）。
- `mode`：いまは `image-to-word`（絵 → 単語カード）だけ（省略可）。`audio-to-image`（音声 → 絵を選ぶ）は これから。
- **日本語訳は書かない**（カードも 問題文も）。解説（`explanation`）は `apple（アップル）` のように 読み方だけ。

### 3.3 `number-build`（数を作る・算数）

```json
"payload": {
  "mode": "blocks",
  "prompt": "りんごを 23こ ならべよう",
  "answer": 23,
  "blocks": [10, 1],
  "max": 99
}
```
- `mode: "keypad"`：`"answer": 56, "prompt": "7 × 8 = ?"`
- `mode: "numberline"`：`"answer": 0.75, "min": 0, "max": 1, "step": 0.05, "tolerance": 0.05, "labels": ["0", "1"]`

### 3.4 `sort-order`（並べ替え）

```json
"payload": {
  "prompt": "古[ふる]い じゅんに ならべよう",
  "direction": "horizontal",
  "cards": [
    { "id": "jomon",  "text": "縄文[じょうもん]土器[どき]", "image": "questions/shakai/jomon-doki.png" },
    { "id": "kofun",  "text": "はにわ", "image": "questions/shakai/haniwa.png" },
    { "id": "nara",   "text": "大仏[だいぶつ]", "image": "questions/shakai/daibutsu.png" }
  ],
  "answer": ["jomon", "kofun", "nara"]
}
```

### 3.5 `map-tap`（地図をタップ・社会/生活）

```json
"payload": {
  "prompt": "青森県[あおもりけん]は どこ？",
  "mapImage": "questions/shakai/map-tohoku-blank.png",
  "target": { "x": 0.52, "y": 0.10, "radius": 0.06 },
  "hintAfterAttempts": 1
}
```
座標は画像に対する 0〜1 の割合。`targets[]` で複数正解（川など線状）も可。

### 3.6 `experiment`（疑似実験・理科）

```json
"payload": {
  "title": "水[みず]を あたためると？",
  "predict": {
    "prompt": "長[なが]く あたためた 水[みず]は どうなる？",
    "choices": [ { "id": "hot", "text": "あつくなる" }, { "id": "cold", "text": "つめたくなる" }, { "id": "same", "text": "かわらない" } ],
    "answer": "hot"
  },
  "controls": [
    { "id": "heatSec", "label": "あたためる 時間[じかん]", "type": "slider", "min": 0, "max": 60, "step": 10, "unit": "びょう" },
    { "id": "water",   "label": "水[みず]の りょう",   "type": "slider", "min": 100, "max": 500, "step": 100, "unit": "mL" }
  ],
  "outcome": {
    "formula": "20 + heatSec * 1.2 - (water - 100) * 0.05",
    "label": "水[みず]の 温度[おんど]",
    "unit": "℃",
    "visual": "thermometer",
    "visualRange": [0, 100]
  },
  "requiredRuns": 2
}
```
`visual`：`thermometer / beaker / pendulum / circuit / plant / scale`（UI側が持つ表示部品。増やすときは UI 担当に依頼）。`formula` は四則演算と変数名だけ。

### 3.7 `kanji-trace`（なぞり・読み）

```json
"payload": {
  "mode": "trace",
  "kanji": "山",
  "reading": "やま",
  "hintWord": "山[やま]",
  "strokeCount": 3,
  "guideImage": "questions/kokugo/kanji/yama-guide.png"
}
```
`mode: "reading"` なら `"choices": ["やま", "かわ", "いし"], "answer": "やま"` を追加。`guideImage` は省略可（省略時はフォント描画）。

### 3.8 `pair-match`（ペア合わせ）

```json
"payload": {
  "prompt": "県[けん]と 名物[めいぶつ]を あわせよう",
  "pairs": [
    { "a": { "text": "青森[あおもり]" }, "b": { "image": "questions/shakai/ringo.png", "text": "りんご" } },
    { "a": { "text": "山形[やまがた]" }, "b": { "image": "questions/shakai/sakuranbo.png", "text": "さくらんぼ" } },
    { "a": { "text": "宮城[みやぎ]" },   "b": { "image": "questions/shakai/gyutan.png", "text": "牛[ぎゅう]タン" } }
  ],
  "faceDown": true
}
```

---

## 4. 問題を作るときのチェックリスト

- [ ] その学年の学習指導要領の範囲内か（漢字は配当表、算数は既習範囲）
- [ ] 文言は設定学年までに習う漢字のみ、すべてルビ付きか
- [ ] 誤答の選択肢は「ありがちな間違い」か（でたらめでない）
- [ ] 絵で伝えられるところを文字で説明していないか
- [ ] 制限時間内に **読む＋操作** が終わるか（低学年は 20 秒目安）
- [ ] `explanation` は 1 文で、子どもが読める言葉か
- [ ] 県のモチーフに絡められるなら `tags` に `prefecture:<code>` を付けたか
- [ ] `pnpm validate:content` が通るか（画像パスの存在も含む）

## 5. 単元コード（`unit`）の付け方

`<subject>.g<学年>.<単元のローマ字>`。例：`sansu.g1.tashizan`、`sansu.g2.kuku`、`kokugo.g2.kanji`、`rika.g4.mizu-no-sugata`、`shakai.g4.todofuken`、`eigo.g3.fruits`、`seikatsu.g1.kisetsu`。一覧は `content/units.json` に集約し、新しい単元を作るときはそこに 1 行追加（名前・学年・教科）。習熟度はこの単位で記録される。
