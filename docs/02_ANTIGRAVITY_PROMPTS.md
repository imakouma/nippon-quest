# 02 — Antigravity 用プロンプト集

> このファイルは「コピペして使う」ためのものです。**上から順に、1ステップずつ** 投げてください。1回のプロンプトで全部作らせようとすると、AIは三分割（問題/UI/本体）を崩し、テストを省き、途中で力尽きます。
>
> 表記ルール：`▼ PROMPT` のブロックをそのまま Antigravity のチャットに貼る。`{{ }}` は自分で埋める。

---

## 0. 使い方の前提（先に読む）

### 0.1 Antigravity での運用ルール

- **Planning モードで始める。** 各ステップのプロンプトを投げたら、Antigravity が出す Implementation Plan（アーティファクト）を必ず読んでから承認する。チェック観点は3つだけ：
  1. `content/` にコード（.ts/.js）を置こうとしていないか
  2. `src/core` / `src/scenes` に問題タイプ名（`choice` など）で分岐するコードがないか
  3. テスト（Vitest）を書く予定が含まれているか
- **Walkthrough（完了報告アーティファクト）を読んでから次に進む。** 「動きました」と書いてあっても、自分でも `pnpm dev` でブラウザを開いて確認する。Antigravity のブラウザサブエージェントにスクリーンショットを撮らせるのも有効（各プロンプト末尾に指示済み）。
- **仕様変更は `docs/00_GAME_DESIGN.md` を直してから伝える。** チャットで口頭修正を重ねると、AIは docs と矛盾したコードを書き始める。
- **1ステップ＝1会話（スレッド）。** 長い会話はコンテキストが濁る。ステップが終わったら新しい会話を開き、ルールファイル＋docs が読み込まれた状態から始める。
- 詰まったら「ロールバック → プロンプトを具体化して再投入」が、会話で修正を重ねるより速い。

### 0.2 モデルの使い分け（目安）

| 用途 | 推奨 | 理由 |
|---|---|---|
| Implementation Plan の作成、大きなリファクタ、コンテンツ大量生成（東北6県の敵・アイテムJSONなど） | **Gemini（Pro系）** | 長いコンテキストに強く、`docs/` 全体＋既存コードを読んで計画するのが得意。画像生成（Nano Banana系）も Antigravity 内から直接使える |
| TypeScript の実装、型設計、バトルエンジンのような厳密なロジック、テスト作成、バグ修正 | **Claude（最新の Sonnet/Opus系）** | 型と契約を守った堅い実装、既存コードを壊さない差分編集が得意 |
| 画像の編集（背景透過、色合わせ、切り抜き、既存キャラの差分ポーズ） | **ChatGPT（画像編集）** | `03_IMAGE_PROMPTS.md` §6 |

同じステップの中でもモデルを切り替えて良い（Plan は Gemini、実装は Claude、が定番）。

### 0.3 ステップ一覧と目安

| Step | 内容 | 目安 |
|---|---|---|
| 0 | プロジェクト初期化・ルールファイル | 半日 |
| 1 | コンテンツ基盤（スキーマ・ローダ・バリデータ） | 1日 |
| 2 | 問題システム（契約・レジストリ・Playground・`choice`） | 1〜2日 |
| 3 | 残りの問題レンダラー（UI担当と並行可） | 3〜5日 |
| 4 | オーバーワールド（島マップ・エリア・町・ダンジョン・NPC） | 2〜3日 |
| 5 | バトルエンジン（純粋ロジック＋テスト） | 2日 |
| 6 | バトル画面（Scene・演出・わざ→問題→威力） | 2日 |
| 7 | 成長・装備・合成・ショップ・ミッション・図鑑 | 2〜3日 |
| 8 | 仲間化・パーティ・対戦場（1対1） | 2日 |
| 9 | セーブ・保護者メニュー・ふりがな・アクセシビリティ仕上げ | 2日 |
| 10 | 東北6県コンテンツ投入・バランス調整・E2E | 3〜5日 |

---

## Step 0 — プロジェクト初期化とルールファイル

### 0-A. 先に手で置くもの

1. 空のフォルダ `nihonquest/` を作り、Antigravity で開く。
2. `docs/` を作り、この一式（`00_GAME_DESIGN.md` 〜 `05_TOHOKU_SEED.md`、`README.md`）を入れる。
3. ルールファイルを置く。Antigravity はワークスペース直下の **`.agent/rules/`** 配下の Markdown を常時ルールとして読み込みます（バージョンによって場所や有効化方法が変わる場合は、Antigravity の設定 → Rules で確認してください）。以下を `.agent/rules/nihonquest.md` として保存：

```markdown
# NIHON QUEST — プロジェクトルール（常時適用）

## 必ず先に読むもの
- docs/00_GAME_DESIGN.md（仕様の正）
- docs/01_ARCHITECTURE.md（構成と契約の正）
仕様とチャット指示が矛盾したら、docs を優先し、矛盾を指摘してから作業する。

## 絶対に守る境界
1. content/ 配下にはJSON（と画像パス文字列）以外を置かない。コード・ロジック禁止。
2. src/questions/renderers/ 配下は Phaser を import しない。GameState に触らない。
   外部との接点は src/questions/contracts.ts の型だけ。
3. src/core/ と src/scenes/ は問題タイプ名（"choice" など）で分岐しない。
   QuestionResult.score 以外を参照しない。
4. contracts.ts と schemas/ を変更するときは、変更理由を Plan に明記し、承認を待つ。
5. Math.random 禁止。src/core/rng.ts のシード付き乱数を使う。
6. 文言（会話・アイテム名・UIラベル）をコードにハードコードしない。content/ か content/i18n/ja.json へ。
7. 全ユーザー向けテキストは RubyText 形式（"漢字[かんじ]"）で書く。

## 品質
- TypeScript strict。any を使うなら理由をコメント。
- 純粋ロジック（battle, progression, questions/engine, content loader）には Vitest のテストを必ず書く。
- 各ステップ完了時に pnpm lint && pnpm test && pnpm validate:content && pnpm build を通す。
- 依存を追加するときは Plan に理由を書く。軽量な選択を優先。

## 進め方
- 大きなタスクは Implementation Plan を先に出し、承認後に実装する。
- 完了時は Walkthrough に「何を作ったか／どう確認したか（スクリーンショット）／残課題」を書く。
- 分からない仕様は勝手に決めず、docs の該当箇所を引用して質問する。
  ただし些細な UI 上の判断は自分で決めて Walkthrough に記載する。

## 対象ユーザー
- 小学生。UIは大きく、文字より絵。失敗を責めない文言（「おしい！」）。個人情報を取らない。
```

### 0-B. 初期化プロンプト

▼ PROMPT（Gemini 推奨・Planning モード）
```
docs/00_GAME_DESIGN.md と docs/01_ARCHITECTURE.md を読んで、その構成どおりに TypeScript + Phaser 3 + Vite + Preact のプロジェクトを初期化してください。

やること:
1. pnpm でプロジェクト作成。依存: phaser, preact, zod, zod-to-json-schema, localforage, seedrandom（型含む）。dev: typescript, vite, vitest, @playwright/test, eslint, prettier, tsx。
2. docs/01_ARCHITECTURE.md §2 のディレクトリを空フォルダ＋ .gitkeep で全部作る。
3. Phaser の最小構成: 960x540、pixelArt: true、roundPixels: true、整数 zoom で親要素にフィット。Boot → Title の2シーンだけ。Title には仮タイトル「ニホンクエスト」とスタートボタン。
4. Canvas の上に DOM オーバーレイ用の <div id="ui-layer"> を重ねる仕組み（CSS で同じ矩形にスケール追従）。Preact をそこにマウントできる最小の例（"Hello" を出すだけ）。
5. ESLint に no-restricted-globals で Math.random を禁止するルール。src/core/rng.ts に seedrandom ラッパー（createRng(seed) → { next(), int(min,max), pick(arr), chance(p) }）とテスト。
6. package.json scripts: dev / build / preview / lint / test / test:e2e / gen:schemas（後で実装、今は placeholder）/ validate:content（同）。
7. README.md にセットアップ手順（3行で）。
8. Git 初期化、.gitignore、最初のコミット。

制約: docs/01_ARCHITECTURE.md §1 の選定を変えないこと。UIフレームワークを React に変えたり、状態管理ライブラリを足したりしない。
完了したら pnpm dev で起動し、ブラウザでタイトル画面のスクリーンショットを撮って Walkthrough に貼ってください。
```

---

## Step 1 — コンテンツ基盤（スキーマ・ローダ・バリデータ）

▼ PROMPT（Claude 推奨）
```
docs/01_ARCHITECTURE.md §4 と docs/04_CONTENT_TEMPLATES.md を読み、コンテンツ基盤を作ってください。

1. src/core/content/schemas.ts に Zod スキーマ: World, Island, Area(=都道府県), Motif, Monster, Item, Skill, Recipe, Mission, AreaEvent, ShopEntry, Npc, EncounterTable。フィールドは docs/04_CONTENT_TEMPLATES.md §2 の定義に厳密に合わせる。id は /^[a-z0-9][a-z0-9.-]*$/ に制限。
2. src/core/content/loader.ts: public/content/ 以下の JSON を fetch して読み込み、Zod で検証し、id → オブジェクトの Map と、area ごとの索引を持つ ContentIndex を返す。読み込み失敗はどのファイルの何行目相当かが分かるエラーにする。
3. scripts/gen-schemas.ts: Zod → JSON Schema を schemas/*.schema.json に書き出す（問題タイプのスキーマは Step 2 で追加するので、その拡張ポイントだけ用意）。
4. scripts/validate-content.ts: content/ 全体を読み、(a) スキーマ検証 (b) id 重複 (c) 参照切れ（monster.drops[].itemId, area.boss, recipe の材料, skill 参照など全部）(d) 画像キーに対応するファイルが assets/ に存在するか（無ければ warning）を検査し、問題があれば非0で終了。
5. docs/05_TOHOKU_SEED.md の青森データを content/ に JSON として投入し、validate:content が通ることを確認。他5県は area ファイルの雛形（名前と motifs だけ）を置く。
6. loader と validate のユニットテスト（正常系・重複id・参照切れ）。

content/ 配下には JSON 以外を置かないこと。完了後 pnpm validate:content の出力を Walkthrough に貼ってください。
```

---

## Step 2 — 問題システムの骨格（契約・レジストリ・Playground・choice）

▼ PROMPT（Claude 推奨・Planning モード）
```
docs/01_ARCHITECTURE.md §3 の三分割の契約を実装してください。これはこのプロジェクトで最も重要な境界です。

1. src/questions/contracts.ts を §3.2 のとおり作成（型は一字一句そのままで良い）。
2. src/questions/renderers/registry.ts: QuestionRenderer を type キーで登録・取得。未登録タイプは明示的なエラー。
3. src/questions/engine/：
   - QuestionBank: public/content/questions/**/*.json を読み込み（manifest.json 方式でも glob でも可。問題作成者がファイルを置いてリロードするだけで反映されること）、各問題の payload を registry から取った renderer.schema で検証する。
   - pick(query: QuestionQuery, mastery: MasteryStore): 直近20問除外、preferUnits 7割/復習3割、tags 一致優先。シード付き乱数を使う。
   - MasteryStore: unit ごとの習熟度（指数移動平均、α=0.3）。QuestionResult を食わせて更新。
   - ask(query, ctxFactory): pick → renderer.mount → QuestionResult を返す一本の関数。ゲーム本体はこれだけ呼ぶ。
4. 最初のレンダラー src/questions/renderers/choice/：Preact 実装。payload スキーマは docs/04_CONTENT_TEMPLATES.md §3.1。選択肢はテキスト or 画像。タップ／キー(1-4)両対応。制限時間バーを表示。ボタン最小48px。正解時「かんぺき！」、不正解時「おしい！」の演出（赤い×は使わない）。ふりがな表示のため src/ui/RubyLabel.tsx（"漢字[かんじ]" → <ruby>）も作る。
5. public/playground.html + src/tools/playground.tsx: ゲームを起動せず、(a) content/questions のツリーから問題を選ぶ (b) テキストエリアに JSON を貼る、のどちらかで任意の問題を choice レンダラーで表示し、返ってきた QuestionResult を画面に JSON 表示する。学年設定・制限時間も切替可。
6. scripts/gen-schemas.ts を拡張し、registry の全 renderer.schema から schemas/questions/<type>.schema.json を生成。content/questions/_samples/choice.json に "$schema" 付きのサンプル3問。
7. テスト: pick のロジック（除外・比率・シード再現性）、MasteryStore、registry。

守ること: renderers/ から Phaser を import しない。engine/ は DOM を知らない（mount を呼ぶだけ）。
完了後、playground で choice 問題を解いた画面のスクリーンショットを Walkthrough に貼ってください。
```

---

## Step 3 — 残りの問題レンダラー（7種）

> UI担当が別に居るなら、ここは **UI担当が Antigravity で自分の会話として** 進める。1レンダラー＝1プロンプト。以下はテンプレートと、タイプごとの差分指示。

▼ PROMPT テンプレート（Claude 推奨）
```
docs/00_GAME_DESIGN.md §5.2 と docs/04_CONTENT_TEMPLATES.md §3.{{n}} を読み、問題タイプ "{{type}}" のレンダラーを src/questions/renderers/{{type}}/ に実装してください。

条件:
- docs/01_ARCHITECTURE.md §3.3 の手順5のとおり、触るのは renderers/{{type}}/、registry.ts の1行、content/questions/_samples/{{type}}.json（サンプル3問）、schemas 再生成のみ。
- Preact。タッチ・マウス・キーボードすべてで解けること。ボタン/ドラッグ対象は最小48px。
- 採点は docs/00_GAME_DESIGN.md §5.2 の表のとおり score 0.0〜1.0。
- 制限時間バー、読み上げボタン（ctx.speak）、正解/不正解演出（「かんぺき！」「おしい！」）、RubyLabel を使ったふりがな。
- 具体的な仕様: {{下の差分指示を貼る}}
完了後 playground でサンプル3問を解いたスクリーンショットを Walkthrough に貼ってください。
```

タイプ別の差分指示（`{{下の差分指示を貼る}}` に入れる）：

- **picture-word**：「絵1枚＋単語カード3〜4枚。カードを絵の下の枠にドラッグ（タップで選択→枠タップでも可）。正解で単語音声（ctx.assets.audio）を再生。日本語訳は絶対に表示しない。逆モード（音声を聞いて絵を選ぶ）は payload.mode で切替。」
- **number-build**：「3モード: (a) blocks: 1/10/100 のブロックをドラッグして数を作る (b) keypad: 大きいテンキーで答えを入力 (c) numberline: 数直線上のつまみをスライドして値を指す。誤差採点は payload.tolerance。式は RubyText でなく大きな数字フォント。」
- **sort-order**：「カードを縦または横に並べ替え（ドラッグ／矢印ボタン）。確定で位置ごとに○を表示。score = 正しい位置にあるカード数 / 総数。」
- **map-tap**：「payload.mapImage（例: 東北の白地図）を表示し、タップ位置と payload.target(x,y,radius) の距離で採点。ヒントとして2回目以降は範囲がぼんやり光る。」
- **experiment**：「3ステップUI: ①予想（選択肢）→②操作（payload.controls に従うスライダー/トグル。例: 水の量・熱する時間）→③結果アニメ（payload.outcomeRule を評価して結果の絵と数値を表示）。予想が当たれば1.0、外れても③まで到達すれば0.5。outcomeRule は簡単な式（"temp = 20 + heatSec * 2 - water * 0.5" のような算術式）を安全に評価する小さなパーサを書く（eval 禁止）。」
- **kanji-trace**：「Canvas に薄いお手本の漢字を表示し、指/マウスでなぞる。採点はお手本のピクセル領域と描画領域の IoU（0.35以上で1.0、線形に減点）。書き順は判定しない（表示だけ）。payload.mode='reading' なら読みをひらがな選択肢で答える。」
- **pair-match**：「4〜8枚のカードを裏向きに並べ、2枚めくってペア判定（絵↔単語、県↔特産品）。全ペア完成で終了。score = max(0, 1 - ミス回数×0.15)。」

---

## Step 4 — オーバーワールド

▼ PROMPT（Gemini で Plan → Claude で実装）
```
docs/00_GAME_DESIGN.md §2 と §7 を読み、オーバーワールドを実装してください。

1. maps/ に Tiled 形式のマップ: (a) tohoku-island.tmj（島全体。6県のエリア入口と地方ボスの城） (b) aomori-field.tmj (c) aomori-town.tmj (d) aomori-dungeon.tmj。仮タイルセットは 16x16 の単色＋記号でよい（後で差し替える。タイルセット画像のキーは docs/03_IMAGE_PROMPTS.md §1 の命名規則に従う）。
2. src/scenes/Overworld.ts: Tiled ローダ、当たり判定レイヤ、主人公の4方向移動（矢印/WASD/タッチのバーチャルパッド）、マップ間遷移（Tiled の object レイヤに transition オブジェクト）、カメラ追従、整数スケール。
3. NPC・宝箱・イベント地点は Tiled の object レイヤに id を置き、中身は content/prefectures/aomori.json の npcs/events から引く（マップに文言を書かない）。
4. 会話ウィンドウは DOM オーバーレイ（RubyLabel、読み上げボタン、タップで送り）。
5. エンカウント: content の encounters テーブルに従い、フィールド/ダンジョンの歩数ベース。遭遇時は Battle シーンを起動する予定のフックだけ用意（Battle は Step 6）。今は console と画面上の「バトル！（仮）」表示。
6. 地方ボスの城の入口は「県のしるし」6個が GameState に無いと「結界」で入れない。
7. 未実装の島（北海道など）はシルエットで配置し、上陸すると「まだ結界に守られている」の会話。

完了後、島 → 青森フィールド → 町 → ダンジョンと歩いて遷移する様子を Antigravity のブラウザで確認し、スクリーンショット4枚を Walkthrough に貼ってください。
```

---

## Step 5 — バトルエンジン（純粋ロジック）

▼ PROMPT（Claude 推奨）
```
docs/00_GAME_DESIGN.md §4 を読み、Phaser 非依存のバトルエンジンを src/core/battle/ に実装してください。

1. 型: Combatant（主人公 or モンスター。stats, hp, mp, element, skills, equipment, statusEffects）、BattleState（味方: 主人公＋出撃モンスター1体、敵1体、ターン、rng状態、streak）、Command（attack | skill(skillId, questionScore) | item(itemId) | swap(monsterId) | flee | scan(questionScore)）、BattleEvent（damage, heal, miss, critical, elementBonus, weaknessRevealed, recruitOffer, ko, victory, defeat, fled, dropped(items), xpGained, ...）。
2. step(state, command, rng): BattleState → { state, events }。純粋関数。敵の行動選択もここ（シンプルAI: 通常攻撃60%/わざ30%/防御10%、HP30%以下で回復わざ優先）。
3. ダメージ式: 基本 = (atk*2 - def) * skill.power/100 * 属性倍率 * scoreMultiplier(score) * じゃくてん倍率 * rng(0.9〜1.1)。scoreMultiplier は GDD §4.3 の表どおり。最低ダメージ1。
4. 属性表は content/balance/elements.json から読む（7属性、GDD §4.2）。
5. 仲間化: 勝利時抽選（recruitRate）、HP20%以下で "recruit" コマンド（score 1.0 で成功率×2）、recruitItem を使った即時成功。結果は recruitOffer イベントで返し、実際に加えるかは呼び出し側。
6. 敗北: ゴールド10%減、装備・仲間は失わない、というルールはここでは扱わず、defeat イベントだけ返す（適用は progression 側）。
7. 対戦モード用: createArenaBattle(partyA, partyB, seed) と、同じ seed・同じコマンド列なら同じ events になることのテスト。
8. Vitest で: ダメージ式の境界、score 0 でも行動が成立、属性倍率、streak3でMP0、逃走不可（ボス）、決定論性、仲間化確率（1万回試行の統計）。

src/core/battle/ から Phaser・DOM を import しないこと。
```

---

## Step 6 — バトル画面

▼ PROMPT（Claude 推奨）
```
Step 5 のバトルエンジンを使って src/scenes/Battle.ts を実装してください。docs/00_GAME_DESIGN.md §4 と §8 を守ること。

1. レイアウト: 上に敵（スプライト＋HPバー＋名前ルビ）、下に味方2枠（主人公・出撃モンスター）、右下にコマンド（たたかう／わざ／どうぐ／なかまチェンジ／にげる）。加えて「しらべる」（理科スキャン）はわざの中に置く。コマンドUIは DOM オーバーレイ（大きいボタン、ふりがな）。
2. わざを選ぶ → skills.json の subject/gradeRange/questionTags で QuestionQuery を組み、src/questions/engine の ask() を呼ぶ → 返ってきた QuestionResult.score を Command.skill に渡す。**score 以外を見ない。** 問題UIはバトル画面の上に全画面オーバーレイで出し、終わったら閉じる。
3. BattleEvent[] を順に再生する演出キュー（ダメージ数字ポップ、点滅、揺れ、「かんぺき！」カットイン、属性エフェクトは色違いの簡易パーティクル）。演出はスキップ可（タップ連打で早送り）。
4. 勝利画面: 経験値バー、レベルアップ、ドロップ、仲間化オファー（「なかまにする？」はい/いいえ、名前付け）。敗北: 宿屋へ戻す処理を progression に依頼。
5. 図鑑登録: 初遭遇・初仲間化で GameState.dex を更新。
6. Overworld からのエンカウントフックをここにつなぐ。BGM/SE は assets/audio にプレースホルダの無音 or 短い仮音を置き、キー名だけ本番どおり。
7. E2E（Playwright）: 起動 → 名前入力 → フィールドで強制エンカウント（デバッグ用URLパラメータ ?debug=encounter）→ たたかう連打で勝利、まで。

完了後、バトル中に問題が出て威力に反映される流れの動画 or 連続スクリーンショットを Walkthrough に貼ってください。
```

---

## Step 7 — 成長・装備・合成・ショップ・ミッション・図鑑

▼ PROMPT（Claude 推奨）
```
docs/00_GAME_DESIGN.md §6 と §4.6 を読み、以下を実装してください。

1. src/core/progression/: 経験値テーブル（content/balance/xp.json）、レベルアップでの stats 成長（monster.growth / hero growth）、かしこさは正答で微増、装備込みの実効ステータス計算、セット装備ボーナス、敗北ペナルティ（ゴールド10%・宿屋へ）。
2. メニューシーン（DOM オーバーレイ、タブ式）: そうび（5スロット、ドラッグ or タップで付け替え、ステータス差分を↑↓で表示）／どうぐ／なかま（パーティ編成、出撃1体を選ぶ）／ずかん（モンスター・アイテム・名所。県ごとにページ、未発見はシルエット、解説は dexBlurb）／ミッション／まちがいノート。
3. 町の施設（NPC 会話から起動）: ショップ（area.shop、買う/売る）、かじ屋（content/recipes.json で合成。材料不足は何が足りないか絵で表示）、宿屋（HP/MP全快、「ふくしゅう」で まちがいノートから3問 → 翌朝ボーナス）、掲示板（area.missions の受注・報告。条件は "defeat:<monsterId>:<n>" "perfect:<subject>:<n>" "collect:<itemId>:<n>" "event:<eventId>" の4種で始める）、たいせんじょう（Step 8 で中身）。
4. 宝箱・イベント報酬の付与を共通の grantReward(reward) に集約。
5. テスト: 実効ステータス、セットボーナス、レシピ判定、ミッション条件判定。

文言はすべて content/i18n/ja.json か content 側へ。
```

---

## Step 8 — 仲間・パーティ・対戦場

▼ PROMPT（Claude 推奨）
```
docs/00_GAME_DESIGN.md §4.6〜4.7 を読み、対戦場（1対1）を実装してください。

1. パーティ定義を PartyDefinition（主人公＋仲間最大3体＋装備）として GameState から切り出し、JSON で export/import できるようにする。
2. src/scenes/Arena.ts: 相手を選ぶ（a. プリセットのライバルNPC 3種（content/arena/rivals.json）、b. 自分の過去パーティ（対戦場で「ゴーストをのこす」と保存）、c. JSON 貼り付け（友達のパーティを受け取る用））。
3. 対戦は createArenaBattle(myParty, theirParty, seed) を使い、相手側は AI 操作。問題の学年帯は両者の設定の低い方。
4. 対戦結果は勝敗記録のみ（経験値なし、ランク表示は「たいせんバッジ」の数）。
5. 将来の非同期オンライン対戦のために、対戦ログ（seed＋コマンド列）を保存し、「リプレイ」で同じ対戦を再生できるようにする。
6. テスト: 同じログから同じ結果が再現されること。
```

---

## Step 9 — セーブ・保護者メニュー・ふりがな・アクセシビリティ

▼ PROMPT（Claude 推奨）
```
docs/00_GAME_DESIGN.md §8 と docs/01_ARCHITECTURE.md §5 を読み、仕上げを実装してください。

1. GameState の Zod スキーマに schemaVersion を持たせ、IndexedDB（localforage）に 3スロット保存。オートセーブ（マップ遷移・バトル後）＋手動セーブ（宿屋）。マイグレーション関数の枠組みと、v1→v2 のダミーテスト。
2. 保護者メニュー（設定の奥、「7+5=?」で開く）: 学年設定（出題帯・漢字表示レベル・下の学年も混ぜる/上に挑戦のトグル）、プレイ時間（日別）、単元ごとの習熟度（MasteryStore を棒グラフ表示）、セーブの JSON エクスポート/インポート、音量、制限時間の調整。
3. ふりがな: 漢字配当学年（content/i18n/kanji-grades.json — 学年別漢字配当表を JSON 化。1006字の一覧は公開されている文部科学省の配当表を基に作る）を使い、設定学年より上の漢字はかなに開く処理を RubyLabel に実装。
4. アクセシビリティ: 全操作がタッチのみ・キーボードのみで完結すること（E2E で両方確認）。フォーカスリング表示。色だけに頼らない（属性はアイコン＋色）。
5. 起動時の Boot でアセットの読み込みプログレスバー。
6. GitHub Pages / Cloudflare Pages 用のビルド設定（base path）。
```

---

## Step 10 — 東北6県のコンテンツ投入とバランス

▼ PROMPT（Gemini 推奨・コンテンツ生成）
```
docs/05_TOHOKU_SEED.md を読み、青森以外の5県（岩手・宮城・秋田・山形・福島）について、青森と同じ粒度で content/ の JSON を作成してください。

各県について:
- motifs 6〜8個（§05 の一覧を使う。実在の名所・特産品・自然・祭り・歴史。企業名やご当地キャラクター（自治体マスコット）は使わない）
- 通常モンスター 4体 + 県ボス 1体（名前は「モチーフ＋擬人化/擬獣化」の造語。属性はモチーフに合わせる。dexBlurb は小学生向けに1〜2文、ふりがな付き、事実に基づく）
- 装備セット 5点 + 素材 3種 + 消耗品 1種
- イベント 3個（名所ごとに、GDD §7 の青森の例と同じ形式。問題タイプは県ごとに偏らないように 8種を分散）
- ショップ品揃え、ミッション 4個、NPC 4人分の会話
- 地方ボス「東北」1体（6県のモチーフを合わせ持つ。3フェーズ）
加えて content/questions/ に、各県の tags:["prefecture:<code>"] 付き社会科問題を 5問ずつ（choice / map-tap / pair-match を混ぜる）。

作った後 pnpm validate:content を通し、参照切れゼロにしてください。史実・地理の内容に自信がない箇所は Walkthrough に「要確認」として列挙してください（人間が事実確認します）。
```

▼ PROMPT（バランス調整・Claude 推奨）
```
scripts/simulate-balance.ts を作り、Step 5 のバトルエンジンを使って以下をシミュレーションしてください:
- 主人公 Lv1〜20、各県の通常敵・県ボス・地方ボスとの戦闘を、score の分布が {全部1.0, 全部0.5, 全部0} の3パターン × 1000回。
- 勝率・平均ターン数・平均被ダメを表にして出力。
目標: 「score 全部0でも通常敵に勝率70%以上」「score 全部1.0なら県ボスに適正Lvで勝率80%」「score 全部0では県ボスに勝率20%以下」。
目標から外れる箇所は content/balance/ と monsters の数値を調整し、調整前後の表を Walkthrough に貼ってください。コードのダメージ式は変えないこと。
```

---

## 付録 A — 困ったときの追加プロンプト

- **境界を壊された**：「`src/core` に問題タイプ名で分岐するコードがあります。docs/01_ARCHITECTURE.md §3.3 ルール1違反です。`QuestionResult.score` だけを使う形にリファクタし、同じ違反が他にないか grep して報告してください。」
- **content にコードが混ざった**：「`content/` に .ts があります。ルール違反です。ロジックは `src/core/content/` へ、データは JSON へ分離してください。」
- **テストを省いた**：「Walkthrough にテストの記述がありません。このステップの純粋ロジックに対して Vitest を追加し、`pnpm test` の結果を貼ってください。」
- **仕様を勝手に変えた**：「GDD §{{n}} と違います。GDD が正です。GDD に合わせて直すか、GDD を変えるべき理由があれば docs への変更提案として提示してください（コードは変えない）。」
- **どこまでできたか分からなくなった**：「docs/00_GAME_DESIGN.md §10 の完成定義 1〜10 について、現状の達成状況を ✅/🔶/❌ で表にし、❌ の項目ごとに次のプロンプト案を出してください。」

## 付録 B — 問題作成者に渡すプロンプト（Antigravity または通常のチャットで）

```
あなたは小学{{n}}年生向け教育RPGの問題作成者です。docs/04_CONTENT_TEMPLATES.md §3 のスキーマに従い、
教科 {{subject}}・単元 {{unit}}・問題タイプ {{type}} の問題を 10 問、JSON 配列で作ってください。
- 学習指導要領の当該学年の範囲を超えない
- 文言はすべて RubyText 形式（"漢字[かんじ]"）。設定学年までに習う漢字のみ使用
- 選択肢の誤答は「ありがちな間違い」にする（でたらめな選択肢にしない）
- 可能なら tags に "prefecture:{{code}}" を付け、その県のモチーフ（{{motifs}}）を題材にする
- explanation は 1 文、子どもが読める言葉で
出力は content/questions/{{subject}}/g{{n}}/{{unit}}.json にそのまま保存できる形で。
```
