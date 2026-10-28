# Spec: child-roadmap-experience

## Status

- Module id: `child-roadmap-experience`
- Phase: 1 / Specify
- Base commit: `8dfff95c3e0bb65502648bcec38c0c3862552da1`
- Capability map: `CAPABILITY_MAP-learning-roadmap-curriculum-v2.md`
- Approval gate: this specification must be approved before planning or implementation begins.

## Objective

既存メニューの「がくしゅう」を、子どもが今日取り組む内容とその理由を迷わず理解できる画面へ更新する。
全教科概要の先頭に全幅の「きょうの3つ」を置き、最大3件の推薦、子ども向けの推薦理由、完了状態、
候補不足・全件完了の状態を表示する。回答後は同じ項目へ戻り、視覚上の位置だけでなくキーボード
フォーカスも復帰させる。

成功とは、子どもが次の学習を1回の主要操作で開始でき、不正解でも完了として前へ進め、ロードマップの
既存の探索・操作・見た目を失わないことである。推薦順位、問題選定、報酬判定、永続化はこのモジュールで
行わない。

## User stories

- 子どもとして、「がくしゅう」を開いたら、今日やることを最大3件まで上から順に確認したい。
- 子どもとして、「ふくしゅうの じき」「さきに ここから」など短い理由を見て、なぜ出ているか知りたい。
- 子どもとして、正解できなくても挑戦した項目が「できた」に変わり、責められずに次へ進みたい。
- キーボード利用者として、回答後に開始した項目へフォーカスが戻り、そのまま次の操作を続けたい。
- タッチ利用者として、横持ちの狭い画面でも48px以上の操作面を押し、既存マップをドラッグ・ピンチしたい。
- 動きを減らす設定の利用者として、点滅や導入アニメーションなしで同じ情報と操作を得たい。

## Dependencies and boundary contract

このモジュールは能力マップで承認された次の3モジュールの出力だけを消費する。

| Provider | Consumer requirement | This module must not do |
|---|---|---|
| `roadmap-view-model` | 今日プラン、ロードマップノード、表示用の状態をScene非依存の純粋モデルとして受け取れる | GameState、AttemptEvent、概念状態から表示状態を再計算する |
| `adaptive-roadmap-practice` | 未完了項目の`questionId`と、実際のUnit/問題へつなぐ呼び出し境界がある | 問題候補の選定、`actualUnitId`の決定、再推薦を行う |
| `math-learning-content-pilot` | 表示モデル経由で既存教材名・概念名を受け取れる | 教材JSON、タグ、誤概念シグナルを解釈・変更する |

プロバイダーが所有する正確な型名と列挙値は、それぞれの承認済み仕様を正とする。UI側が必要とする意味上の
最小契約は次のとおり。

- 今日プラン全体: 0〜3件、Asia/Tokyoの同じ日の表示単位、完了数、候補0件と区別できる`allComplete`。
- 各項目: 安定IDである`questionId`、`actualUnitId`、実Unit名、教科、推薦理由、完了状態、開始可能状態。
- 表示名: 教科と`actualUnitId`に対応する実Unit名を表示し、問題名はカードの必須情報にしない。
- 未完了理由: `due-review | weak-prerequisite | unseen-primary | unseen-question`の4値を区別できる。
- 完了復元理由: `review | diagnosis`を区別できるが、UIは元の未完了理由を推測しない。
- 完了状態: 同日の `review` または `diagnosis` のAttemptEventに基づき、scoreに関係なく完了となる。
- 開始境界: UIは`questionId`をcallbackへ渡すだけで、候補や出題を選ばない。
- 復帰境界: 呼び出し側は、回答後の再表示時に開始元の`questionId`をfocus targetとして返す。

`shared`のプロバイダー契約が上記を満たさない場合、UI側でGameStateへ逆依存せず、統合担当へ契約調整を依頼する。

## Scope

### In scope

- 既存「がくしゅう」の全教科概要上部へ、全幅の「きょうの3つ」セクションを追加する。
- 0、1、2、3件、部分完了、全件完了の各表示状態を作る。
- 各項目に教科/学習名、短い推薦理由、完了状態、未完了時の開始操作を表示する。
- 回答後のロードマップ再表示、開始元へのフォーカス復帰、politeな完了通知を定義する。
- Escape/X、画面内の「もどる」、閉じる操作の既存階層を維持する。
- 既存ロードマップのzoom、pan、pinch、wheel、ノード選択、前提表示を維持する。
- 960×540、640×540、844×390で収まり、マウス、キーボード、タッチで操作可能にする。
- `prefers-reduced-motion: reduce`で新規アニメーションと既存のロードマップ点滅を実質停止する。
- UI文言を`content/i18n/ja.json`へRubyText形式で追加する。
- `tests/unit/roadmapMenu.test.ts`へ表示・操作・フォーカス・通知の回帰テストを追加する。

### Out of scope

- 推薦順位、日境界、完了判定、候補補充、重複排除のCore実装。
- 問題の選定、`actualUnitId`の決定、QuestionBankの絞り込み。
- Sceneの進行・報酬・保存ロジック。統合担当が必要なcallback配線だけを別担当範囲で行う。
- GameState、AttemptEvent、Question、schema、migrationの変更。
- ロードマップグラフ、教材、概念、誤概念データの再構築。
- 新しい問題renderer、依存パッケージ、汎用デザインシステムの追加。
- `FieldUi.tsx`、`field.css`、Core、Scene選定ロジックの編集。

## Existing behavior that must remain true

### Learning rewards

今日プランの「完了」と学習報酬は別契約である。UIの完了表示は報酬を付与せず、報酬条件を緩和しない。

- `learning-fragment`の単元習熟報酬は、同一単元で`mastery.n >= 3`かつ`mastery.value >= 0.8`へ到達したとき
  1回だけ付与される。
- まちがい直し報酬は、以前まちがえた異なる問題をscore 1で直した記録を使い、3件ごとの境界で付与される。
- 既存の`masteredRewardUnits`と`correctedRewardQuestionIds`による冪等性を維持する。
- 今日プランはscore 0でも完了になり得るが、それを習熟報酬の正答・習熟条件へ読み替えない。
- RPGの経験値、ゴールド、ダメージ、地域解放、バトルの7割弱点/3割復習選択を変更しない。

### Save compatibility

- 現行`SCHEMA_VERSION = 13`を維持し、新しい永続フィールド、schema更新、migrationを追加しない。
- 今日プランと完了状態は既存のAttemptEventから導出された表示モデルを描画するだけとする。
- ロードマップを開く、項目を選ぶ、マップを移動/拡大するだけではGameStateを変更しない。
- `roadmapSnapshot.ts`が保護する旧単元の既得進捗を表示側で再ロックしない。
- v13の代表セーブをimportし、回答、保存、reloadしても、学習報酬、地域進行、所持品、既得ロードマップ進捗を保持する。
- legacy/current/mixed Unit IDの正規化は上流の責務とし、UIは受け取った`questionId`と`actualUnitId`を改変しない。

## UX and visual design contract

### Reference lock

外部製品を参照せず、基点コミットの既存「がくしゅう」画面を唯一の視覚基準とする。

- 濃紺のパネル、教科色、黄色の主要CTA、白いvisible focusを再利用する。
- `RubyLabel`、既存の12/24/36/48px文字階層、既存spacing、角・影・枠線を使う。
- 既存の「全教科 → 教科 → 単元を選択 → ここを学ぶ」という階層を維持する。
- 紫の汎用グラデーション、過剰な角丸、均一なカードグリッド、装飾目的の影を追加しない。

### Information hierarchy

1. メニュー見出しと戻る/閉じる。
2. 教科切替と進捗。
3. 全幅の「きょうの3つ」。全教科概要の最初に置き、画面を開いた時点で見える。
4. 既存の教科別進捗概要。
5. 教科選択後のロードマップグラフと単元詳細。

「きょうの3つ」はセクション全体で横幅を使う。1〜3件は上流順を保ち、狭幅では縦積みとする。
3件を埋めるための空カードや「準備中」の無効ボタンは置かない。

### Today item states

#### Incomplete

- 教科、`actualUnitId`の実Unit名、推薦理由、開始を示す主要操作を表示する。問題名はカードへ必須表示しない。
- 項目全体を曖昧なclick targetにせず、ネイティブ`button`で開始操作を表す。
- callbackにはその項目の`questionId`だけを渡す。

#### Completed

- ✓等の記号と「できた」を併記し、色だけで完了を表さない。
- 完了済み項目は同日のリスト内に残し、上流が保持した順序を変えない。
- 再挑戦を要求しない。開始できない項目をdisabled CTAとして残さず、静的な完了表示にする。

#### Partial list (1 or 2 items)

- 実在する項目だけを表示する。
- 見た目上の3枠を埋めるplaceholder、空button、disabled buttonを出さない。

#### Empty list (0 items)

- セクション見出しは残し、責めない短い空状態を表示する。
- 無効な開始ボタンを表示しない。
- データ欠損を「全部できた」と誤表示しない。上流の`allComplete`と候補0件を区別する。

#### All complete

- 今日の項目がすべて完了したことを肯定的に表示する。
- 完了済み項目は確認できるが、次の候補をUI側で生成しない。
- 最後の回答から戻ったときだけ完了通知をpoliteに1回読み上げる。

### Recommendation reasons

- 理由文は短く、子どもを責めず、行動につながる表現にする。
- `due-review`は「復習[ふくしゅう]の 時期[じき]」、`weak-prerequisite`は「さきに ここから」、
  `unseen-primary`は「あたらしい 学[まな]び」、`unseen-question`は
  「まだ といていない 問題[もんだい]」として伝える。
- 完了復元の`review`は一般的な「復習[ふくしゅう]できた」、`diagnosis`は一般的な
  「取[と]り組[く]めた」に対応し、元の詳細な推薦理由を推測・復元しない。
- 内部スコア、retention値、confidence、ranking weight、診断名などを表示しない。
- 列挙値から文言への対応は`content/i18n/ja.json`に置き、TypeScriptへ日本語をハードコードしない。
- 上流が未知の理由を返す可能性を黙って一般化しない。型の不一致として実装時に検出する。

## Interaction and accessibility contract

### Focus lifecycle

1. 「がくしゅう」を初めて開いたとき、既存のモーダルfocus trap内で最初の有効な主要操作へ入れる。
2. 今日項目を開始するとき、開始元の`questionId`を呼び出し側が保持できるcallback契約を使う。
3. 回答後にロードマップが再表示されたら、その項目が存在する限り対応する要素へfocusする。
4. 完了によりbuttonが静的表示へ変わった場合、その項目の完了要素を`tabindex=-1`で一時focus可能にし、
   完了状態と進捗を読み上げる。通常のTab順へ不要な停止点を増やさない。
5. 項目が消えた場合は「きょうの3つ」見出しへfallbackし、`body`やメニュー外へfocusを落とさない。
6. focus復帰でスクロール位置を必要最小限だけ調整し、ロードマップのpan/zoom状態を勝手に初期化しない。

### Keyboard and back behavior

- Tab/Shift+Tabで全操作へ到達でき、DOM順と視覚順を一致させる。`tabindex > 0`は使わない。
- Enter/Spaceはfocus中のネイティブbuttonだけを作動させる。
- Escape/Xは既存どおり「がくしゅう」からメニューホームへ1段戻る。
- 画面内の「もどる」はEscape/Xと同じ結果にし、閉じる/Iはメニュー全体を閉じる。
- グラフ操作をしなくても「きょうの3つ」から学習を開始できる。グラフのノードは引き続きTabとEnter/Spaceで操作できる。

### Live announcements

- 回答後の完了変化は専用の`role="status"`または`aria-live="polite"`、`aria-atomic="true"`で通知する。
- 通知は項目名と進捗（例: 1/3）を含み、再renderやfocus移動だけで繰り返さない。
- エラーでない完了通知に`assertive`や`role="alert"`を使わない。
- 既存の進捗表示のpolite領域と二重に同じ文を読ませない。

### Targets, semantics, contrast

- 主要操作と全てのタッチ操作面は48×48 CSS px以上とする。
- グラフノードは視覚円が48px未満でも、button全体のhit areaを48px以上に保つ。
- visible focusは背景に対して3:1以上、通常文字は4.5:1以上、大きな文字は3:1以上を目標にする。
- 教科色や完了色だけに意味を持たせず、文言・記号・`aria-label`を併用する。
- アイコンのみの操作には表示名または`aria-label`を付ける。

### Zoom, pan, pinch

既存`RoadmapGraph`の次の契約を維持する。

- 1本指/マウスドラッグでpan、2本指pinchとCtrl/Meta+wheelでpointer中心zoom、通常wheelでpan。
- zoom範囲20%〜160%、panのclamp、drag後click抑止、初回gesture hint。
- ノード選択時は表示に必要な最小距離だけ移動し、表示中ノードの選択替えでは不用意に中央へ戻さない。
- 既存テストが保証する、常設zoomボタンを置かない設計を維持する。
- タッチ操作とブラウザの不要なoverscrollが競合しない。

### Reduced motion

- `prefers-reduced-motion: reduce`では、新規の登場、点滅、脈動、進捗アニメーションを停止する。
- 現在ノードの既存点滅を含め、状態は静止した色・枠・記号でも同じ意味を保つ。
- focus移動やscrollは即時、またはユーザー設定を尊重した挙動にし、強制smooth scrollを使わない。

## Responsive layout contract

| Viewport | Required result |
|---|---|
| 960×540 | 「きょうの3つ」の見出しと少なくとも先頭項目が初期表示に入り、既存全教科概要へ縦スクロールで到達できる。教科列、戻る、閉じるを欠落させない |
| 640×540 | 今日項目を縦積みにし、文言を省略して理由を失わない。横スクロールをページ全体へ発生させず、セクション内部の縦スクロールで全項目へ到達できる |
| 844×390 | 横長・低高で見出し領域を圧縮し、48px操作面を維持する。今日項目、戻る、閉じる、教科切替、グラフの操作可能領域を相互に覆わせない |

全サイズで、200% text zoom相当の長いRubyTextが主要操作を画面外へ押し出さないことを確認する。
省略が必要な補助表示でも、項目名と推薦理由のアクセス可能名は完全な内容を保持する。

## Tech stack

- Node.js 20以上、pnpm 10.28.0
- TypeScript 5.6 strict
- Preact 10.24 DOM overlay
- Phaser 3.87 canvasの上に既存UIを重ねるが、このモジュールはPhaserをimportしない
- CSS（`menu.css`）と既存design token/custom property
- Vitest 4.1 + jsdom 25（unit/component behavior）
- Playwright 1.48（統合担当のviewport、keyboard、touch、save compatibility確認）
- 新規依存なし

## Commands

Phase 2以降の実装中は、変更ファイルに対するfocused checkを先に行う。

```bash
pnpm test:related src/ui/field/RoadmapView.tsx src/ui/field/RoadmapGraph.tsx src/ui/field/MenuOverlay.tsx tests/unit/roadmapMenu.test.ts
pnpm check:fast
```

実装担当の論理コミット前に、担当範囲について次を行う。

```bash
pnpm lint
pnpm check:architecture
pnpm test:related src/ui/field/RoadmapView.tsx src/ui/field/RoadmapGraph.tsx src/ui/field/MenuOverlay.tsx tests/unit/roadmapMenu.test.ts
pnpm validate:content
```

統合担当だけが統合後に次を一度実行する。

```bash
pnpm check:full
```

正規プレビューも統合担当が最新統合buildから`127.0.0.1:4174`で起動し、通常経路は`?resetSaves=1`、
代表v13セーブは別経路で確認する。作業チャットの一時プレビューは4175以降を使い、確認後に停止する。

## Project structure and ownership

調査済みの実在パスと責務は次のとおり。

| Path | Future implementation responsibility |
|---|---|
| `src/ui/field/RoadmapView.tsx` | 今日セクション、全教科概要、理由/完了/空状態、今日項目のfocus target |
| `src/ui/field/RoadmapGraph.tsx` | 既存graph操作とreduced-motion/focus回帰の維持。今日プランの選定ロジックは置かない |
| `src/ui/field/MenuOverlay.tsx` | Scene非依存props/callback、回答後の再表示に必要なfocus targetの受け渡し、Escape/back階層 |
| `src/ui/field/menu.css` | 既存見た目に沿う今日セクション、48px操作面、3 viewport、reduced motion |
| `content/i18n/ja.json` | 今日見出し、推薦理由、完了、空状態、通知のRubyText |
| `tests/unit/roadmapMenu.test.ts` | UIのREDテスト、DOM semantics、callback、focus、live region、既存graph回帰 |

次はこのモジュールの所有外であり、実装時に編集しない。

- `src/core/**`
- `src/scenes/**`（統合担当のcallback配線を除く）
- `src/shared/menuModel.ts`（上流`roadmap-view-model`が所有するprovider契約）
- `src/questions/contracts.ts`
- `src/core/state/**`
- `schemas/**`
- `FieldUi.tsx`、`field.css`

## Code style

- 既存の関数コンポーネント、named export、Preact hooks、semantic HTMLを使う。
- 表示コンポーネントは純粋なprops/callbackとローカルUI状態だけを扱う。
- 日本語文言をTSXへ直接書かず、`t()`と`RubyLabel`を使う。
- 操作は`div onClick`でなく`button type="button"`を使う。
- reasonや状態の分岐はexhaustiveにし、未知値を黙ってfallbackしない。
- 既存helper/型で足りる限り、新しいwrapper、store、context、dependencyを作らない。

```tsx
<button
  type="button"
  class="nq-roadmap-today-start"
  onClick={() => onTodaySelect(item.questionId)}
>
  <RubyLabel text={t('field.roadmapTodayStart')} />
</button>
```

## Testing strategy

### Unit/component tests (owned by this module)

各行動変更は`tests/unit/roadmapMenu.test.ts`の失敗するテストから始める。

- 0、1、2、3件を正しい数だけ描画し、placeholder/disabled CTAを出さない。
- 上流順、教科、実Unit名、4種類の未完了理由文を表示し、問題名を必須表示にしない。
- 完了復元の`review | diagnosis`を一般的な完了文へ対応し、元の詳細理由を表示しない。
- completed項目は文言と記号を持ち、開始callbackを呼ばない。
- incomplete項目の開始操作だけが、正しい`questionId`でcallbackを1回呼ぶ。
- 候補0件と全件完了の空状態を区別する。
- 回答後の再renderで開始元へfocusが戻り、buttonが完了表示に変わった場合も同項目へfallbackする。
- 対象項目が消えた場合、今日セクション見出しへfocusが戻る。
- 完了通知は`polite`かつ`atomic`で1回だけ更新され、再renderでは重複しない。
- Escape/X、戻る、閉じる/Iの既存結果を維持する。
- 既存のzoom/pan/pinch、20%下限、選択時の最小pan、gesture hint、常設zoomボタンなしを維持する。
- 操作要素のsemantic role、accessible name、48px class契約、visible focus classを確認する。
- `prefers-reduced-motion`のclass/CSS契約でアニメーションが停止する。

### Integration/E2E tests (integration owner)

- 960×540、640×540、844×390の各viewportでoverflow、重なり、48px targetを確認する。
- マウス、Tab/Enter/Space/Escape、single-pointer drag、touch pinchを実ブラウザで確認する。
- 回答（正解・不正解）→ロードマップ復帰→focus復帰→polite通知→reload後完了保持を確認する。
- 0〜3件、部分完了、全件完了を固定fixtureで確認する。
- v13代表セーブのimport→回答→保存→reloadで、報酬、地域進行、所持品、既得進捗を比較する。
- axe/DevTools accessibility treeで重大な警告がなく、screen readerで見出し・理由・完了・操作名を判別できる。

## Boundaries

### Always

- `content → core/learning → scenes/overworld → shared display model → ui`の依存方向を守る。
- UIはScene、GameState、保存実装へ依存せず、純粋モデルとcallbackだけを受け取る。
- 文言は`content/i18n/ja.json`のRubyTextに置く。
- 不正解を責めず、score 0でも上流の完了状態をそのまま表示する。
- 48px target、visible focus、polite通知、reduced motion、3 viewportをテストする。
- 既存zoom/pan/pinchとEscape/backを回帰テストで保護する。
- コード変更はREDテストから始め、focused testを通してから範囲を広げる。
- ロードマップを開くだけでGameStateを変更しない。

### Ask first

- `src/questions/contracts.ts`、GameState schema/version、AttemptEvent、永続フィールドの変更。
- 上流`shared`表示契約の意味変更、またはUI都合のprovider契約追加。
- Core/Sceneの推薦・選定・完了ロジックの変更。
- 3回答かつ習熟度0.80、または3件の完全なまちがい直しという既存報酬条件の変更。
- 新しいrenderer、dependency、design token、常設zoom controlの追加。
- 4種類以外の学習段階タグや教材schemaの追加。
- 所有範囲外ファイルを実装担当が直接編集する必要が生じた場合。

### Never

- 既存セーブの進捗、報酬、地域進行、所持品を巻き戻す。
- UIで推薦順位、問題選定、候補補充、日判定、Unit正規化を再実装する。
- 完了表示を学習報酬の付与として扱う。
- 3枠を埋めるために無効buttonや偽の候補を表示する。
- TypeScriptへユーザー向け日本語をハードコードする。
- `Math.random`を使う。
- `FieldUi.tsx`、`field.css`、生成schema、manifest、他担当の変更を取り込む・消す・整形する。
- 外部サイトのブランド、文言、画像、固有レイアウトをコピーする。

## Success criteria

- [ ] 「がくしゅう」の全教科概要に、全幅の「きょうの3つ」が既存教科概要より前に表示される。
- [ ] 0〜3件を上流順で表示し、問題ID重複や候補補充をUIで行わない。
- [ ] `due-review | weak-prerequisite | unseen-primary | unseen-question`を子ども向けRubyTextで区別できる。
- [ ] 完了復元の`review | diagnosis`を一般的な完了文へ対応し、元の推薦理由を推測しない。
- [ ] 各カードは教科と`actualUnitId`の実Unit名を表示し、問題名を必須表示にしない。
- [ ] 未完了項目から1回の主要操作で正しい`questionId`をcallbackへ渡せる。
- [ ] 同日のreview/diagnosis回答はscoreに関係なく完了表示になり、battle/event回答は上流状態どおり完了にならない。
- [ ] 1〜2件でplaceholderを出さず、0件で無効な開始ボタンを出さず、全完了とデータなしを区別する。
- [ ] 回答後に開始元へfocusが戻り、項目が消えた場合も今日セクション内へ安全にfallbackする。
- [ ] 完了通知がpoliteに1回だけ読まれ、再renderで重複しない。
- [ ] Escape/X、戻る、閉じる/Iが既存階層どおり動く。
- [ ] 全操作面が48×48px以上で、visible focusと色以外の状態表現がある。
- [ ] zoom 20〜160%、pan、wheel、pinch、drag後click抑止、最小pan、gesture hintが回帰しない。
- [ ] reduced-motionで新規/既存ロードマップアニメーションを停止しても状態を理解できる。
- [ ] 960×540、640×540、844×390で欠落・重なり・ページ全体の不要な横overflowがない。
- [ ] ロードマップを開くだけではGameStateが変わらない。
- [ ] 現行報酬条件、v13 schema、旧セーブの既得進捗、RPG進行が変わらない。
- [ ] 所有ファイルのfocused testsと`pnpm check:fast`が通り、統合後に`pnpm check:full`と対象E2Eが通る。
- [ ] 統合済み4174プレビューで回答→focus復帰→reloadを目視確認できる。

## Resolved review decisions

横断レビューにより次を固定する。

1. 今日項目の完了済み行は再挑戦buttonを残さず、静的な完了表示にする。
2. 安定ID、focus target、開始callback値はすべて`questionId`とする。
3. カードは教科と`actualUnitId`の実Unit名を表示し、問題名は必須表示にしない。
4. 未完了reasonは`due-review | weak-prerequisite | unseen-primary | unseen-question`とする。
5. 完了復元reasonは`review | diagnosis`を一般的な完了文へ対応し、詳細理由を推測しない。
6. 候補0件と全件完了は、上流表示モデルの`allComplete`で区別する。
7. 代表v13 fixtureと対象E2Eの選定は統合担当が所有する。
8. 推薦理由の日本語はUIのi18nが所有するが、reason列挙値と意味は上流provider契約を正とする。
9. 回答後focus復帰では、統合担当が開始元の`questionId`を再表示時に渡す。
10. 常設zoom controlは追加せず、既存gestureとキーボードでのノード操作を維持する。

## Open questions

なし。
