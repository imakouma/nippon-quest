# Implementation Plan: child-roadmap-experience

## Status

- Module id: `child-roadmap-experience`
- Phase: 2 / Plan
- Branch: `codex/lr-v2-ui`
- Plan base commit: `0ac46c8be7c2d4c553096fa4741620b045fcca49`
- Approved spec: `SPEC-child-roadmap-experience.md`
- Capability map: `CAPABILITY_MAP-learning-roadmap-curriculum-v2.md`
- Task-list policy: Phase 2では本ファイルだけを作成する。既存の`tasks/plan.md`、`tasks/todo.md`、
  他モジュールのplan/todoは変更しない。Phase 3のtask listは次回の人間承認後に作成する。

## Outcome

既存「がくしゅう」の全教科概要へ、上流の表示モデルをそのまま描画する全幅の「きょうの3つ」を追加する。
0〜3件、推薦理由、完了・空・全完了状態を表示し、未完了項目は`questionId`で開始する。回答後は同じ
`questionId`へfocusを戻し、完了をpoliteに一度だけ通知する。既存のロードマップ選択、Escape/back、
zoom/pan/pinch、報酬、v13セーブ互換性を維持する。

## Evidence from the current implementation

- `RoadmapView.tsx`は全教科概要と教科別`RoadmapGraph`の切替を所有し、今日プランは未実装である。
- `MenuOverlay.tsx`はScene非依存のprops/callback境界とEscape/X/backを所有する。ロードマップ表示中は
  通常リストのfocus同期を明示的にskipしている。
- `useModalFocus`はメニュー初期表示で`.nq-menu-card`をfocusし、Tabをdialog内へ閉じ込める。
  回答後にロードマップ固有のfocusを戻す契約はまだない。
- `Overworld.openMenu()`は`runRoadmapPractice(this, unitId)`完了後に
  `draw('roadmap', undefined, null, false)`を呼ぶが、開始元IDを再表示へ渡していない。
- 現行`runRoadmapPractice()`はUnit内から乱数で問題を選ぶ。今日プランの`questionId`開始へ置換する責務は
  `adaptive-roadmap-practice`と統合担当にあり、このモジュールでは編集しない。
- `RoadmapGraph.tsx`は20〜160% zoom、wheel pan、pointer drag、pinch、drag後click抑止、最小限の
  ensure-visibleを既に実装し、`roadmapMenu.test.ts`と`tests/e2e/progress.spec.ts`が回帰を保護している。
- `menu.css`の`.nq-roadmap-overview`は内部縦スクロール可能な2列gridであり、今日セクションは
  `grid-column: 1 / -1`で追加できる。既存reduced-motionはgesture hintを止めるが、現在ノードの点滅は
  明示的に止めていない。
- Graphify code-onlyでは`RoadmapView()`の直接影響先は`MenuOverlay`、`Overworld.openMenu()`、
  `roadmapMenu.test.ts`である。SceneやQuestion実装をUIへimportする必要はない。

## Scope

### Implementation targets

- `RoadmapView.tsx`: 今日セクション、理由・完了・空状態、開始callback、focus/live-region処理。
- `MenuOverlay.tsx`: 上流today plan、one-shot return `questionId`、開始callbackをUIへ渡すprops境界。
- `menu.css`: 既存見た目、48px target、3 viewport、visible focus、reduced-motion。
- `content/i18n/ja.json`: 見出し、4未完了理由、2完了理由、開始、空、全完了、通知のRubyText。
- `roadmapMenu.test.ts`: 各sliceのREDテストと既存graph/back回帰。

`RoadmapGraph.tsx`は担当所有範囲だが、計画上は実装変更しない。既存graph契約をfocused testsで保護し、
CSSだけでreduced-motionを満たす。既存graphテストが失敗した場合は原因を診断し、対象外の挙動変更で
通そうとしない。

### Explicit non-targets

- `src/core/**`、`src/scenes/**`、`src/questions/**`、`src/core/state/**`。
- `src/shared/menuModel.ts`を含む上流provider契約。UI用の重複型やadapterをローカルで作らない。
- `FieldUi.tsx`、`field.css`、schema、migration、manifest、教材JSON。
- 推薦順位、Asia/Tokyo日境界、完了導出、候補補充、重複排除、Unit正規化、問題選定。
- 学習報酬、経験値、ゴールド、地域解放、バトル7割/3割選択。
- 新しい依存、renderer、常設zoom control、汎用design system。
- E2EとScene配線の編集。これらは統合担当へのhandoff対象とする。

## Fixed architecture decisions

1. UIはWave 3統合済みのprovider型を`shared`からimportし、GameState、AttemptEvent、QuestionBankを読まない。
2. today itemのidentity、開始callback値、return focus targetはすべて`questionId`とする。
3. カードは教科と`actualUnitId`の実Unit名を表示し、問題名は必須表示にしない。
4. 未完了reasonは`due-review | weak-prerequisite | unseen-primary | unseen-question`のexhaustive mappingとする。
5. 完了reasonは`review | diagnosis`を一般的な完了文へmappingし、元の未完了reasonを推測しない。
6. items 0件と全完了はproviderの`allComplete`で区別する。UIは補完候補を作らない。
7. 完了項目はbuttonにせず静的要素とし、return focus時だけ`tabIndex={-1}`でprogrammatic focusを許可する。
8. `RoadmapView`内に専用のpolite/atomic statusを1つ置き、one-shot return `questionId`に対してのみ通知する。
9. 初回表示は先頭の有効な今日CTA、回答後は同一`questionId`、対象消失時は今日セクション見出しへfocusする。
10. today sectionは既存`.nq-roadmap-overview`内の全幅rowにし、ページ全体ではなく概要内部をscrollさせる。
11. `RoadmapGraph`ロジックは変更せず、既存gestureとselectionテストをそのまま回帰ゲートにする。
12. v13 schemaと既存報酬条件は不変とし、UI操作でGameStateを書き換えない。

## Dependency graph and execution order

```text
Wave 3 integration gate
  ├─ roadmap-view-model: today plan + allComplete + display-ready actual Unit name
  ├─ adaptive-roadmap-practice: start exact questionId
  └─ math-learning-content-pilot: approved content signals
                │
                ▼
Slice 1: today plan render + exact questionId callback
                │
                ▼
Slice 2: answer-return focus + one-shot polite announcement
                │
                ▼
Slice 3: 3-viewport layout + 48px/focus/reduced-motion + graph regression
                │
                ▼
Module review and atomic implementation commit
                │
                ▼
Integration-owner handoff
  ├─ Overworld/menu callback wiring
  ├─ adaptive practice execution by questionId
  ├─ E2E: progress + accessibility + answer/reload
  ├─ representative v13 import/save/reload
  └─ pnpm check:full + canonical 4174 preview
```

Slices 1〜3は同じUI/testファイルを順に育てるため逐次実行する。別チャットとの並行編集は行わない。
統合担当のScene/E2E作業は、本モジュールの実装コミットがhandoffされた後に開始する。

## Pre-implementation gate

Phase 3開始時に、コード編集より前に次を確認する。

- Wave 3の`roadmap-view-model`、`adaptive-roadmap-practice`、`math-learning-content-pilot`が統合済みである。
- provider contractが`questionId`、`actualUnitId`、実Unit名、reason、completion reason、completed、
  `allComplete`を表現する。名称は統合済み型を使い、UI側にduplicate typeを作らない。
- adaptive practiceがtoday planの`questionId`を直接開始でき、Unit内ランダム選択へ戻さない。
- 基点commit、専用branch、clean statusを再確認し、他チャットの未統合差分を取り込まない。
- `tasks/plan.md`、`tasks/todo.md`、`FieldUi.tsx`、`field.css`を変更対象へ含めない。

ゲート不成立時は実装を開始せず、統合済みWave 3 commitを取り込むよう統合担当へ返す。

## Slice 1: Today plan rendering and exact-start callback

**Goal:** 「がくしゅう」全教科概要の先頭に、provider順を保つ0〜3件の今日プランを表示し、未完了項目だけを
`questionId`で開始できる最小の縦sliceを完成させる。

**Dependencies:** Pre-implementation gateのみ。

**Candidate files (5):**

- `tests/unit/roadmapMenu.test.ts`
- `src/ui/field/RoadmapView.tsx`
- `src/ui/field/MenuOverlay.tsx`
- `src/ui/field/menu.css`
- `content/i18n/ja.json`

**RED first:**

1. `showRoadmap` fixtureをprovider型のtoday planを受け取れるようにし、0/1/2/3件の失敗テストを書く。
2. 4未完了reasonのRubyText、教科、実Unit名、provider順、問題名を必須表示しないことをテストする。
3. 未完了CTAが正しい`questionId`を1回だけcallbackし、`actualUnitId`をcallbackしない失敗テストを書く。
4. 完了項目が静的表示でCTA/disabled buttonを持たず、`review | diagnosis`を一般完了文へmappingするテストを書く。
5. items 0件で`allComplete=false`の空状態と、`allComplete=true`の全完了状態を区別するテストを書く。

**Implementation steps:**

- `MenuOverlayProps`にprovider today planと`onRoadmapTodaySelect(questionId)`を追加し、`RoadmapView`へ渡す。
- `RoadmapView`内に小さなtoday section表示を置き、reasonはexhaustive switch/helperでi18n keyへmappingする。
- i18nには次の意味をRubyTextで追加する。
  - `due-review`: 「復習[ふくしゅう]の 時期[じき]」
  - `weak-prerequisite`: 「さきに ここから」
  - `unseen-primary`: 「あたらしい 学[まな]び」
  - `unseen-question`: 「まだ といていない 問題[もんだい]」
  - `review`: 「復習[ふくしゅう]できた」
  - `diagnosis`: 「取[と]り組[く]めた」
- 既存濃紺panel、教科色、黄色CTAを使う最小CSSを追加し、today sectionを全幅rowにする。
- 1〜2件にplaceholderを作らず、0件にdisabled CTAを出さない。

**Acceptance criteria:**

- [ ] 0〜3件がprovider順かつ正しい数で表示される。
- [ ] 4未完了reasonと2完了reasonが承認済み文言へ完全対応する。
- [ ] カードは教科＋実Unit名を表示し、問題名を必須表示にしない。
- [ ] 未完了CTAだけが`questionId`をcallbackし、完了/空状態はcallbackしない。
- [ ] `allComplete`で候補0件と全完了を区別し、UIが候補を補完しない。

**Focused verification:**

```bash
pnpm test:unit tests/unit/roadmapMenu.test.ts -t "きょうの3つ"
pnpm test:related src/ui/field/RoadmapView.tsx src/ui/field/MenuOverlay.tsx tests/unit/roadmapMenu.test.ts
pnpm validate:content
```

## Checkpoint A: Render contract

- Slice 1の新規テストがRED→GREENになった記録を残す。
- `git diff --check`を通す。
- `RoadmapView`/`MenuOverlay`がScene、GameState、保存APIをimportしていないことを確認する。
- 変更が候補5ファイル以内で、shared/provider契約を複製していないことを確認する。

## Slice 2: Return focus and one-shot polite completion

**Goal:** 回答から戻ったときだけ開始元`questionId`へfocusし、完了内容をpoliteに一度通知する。

**Dependencies:** Slice 1 / Checkpoint A。

**Candidate files (4):**

- `tests/unit/roadmapMenu.test.ts`
- `src/ui/field/RoadmapView.tsx`
- `src/ui/field/MenuOverlay.tsx`
- `content/i18n/ja.json`

**RED first:**

1. 初回ロードマップ表示で先頭の有効なtoday CTAへfocusする失敗テストを書く。
2. one-shot return `questionId`が未完了buttonへfocusするテストを書く。
3. 回答後に項目が完了要素へ変わっても、`tabIndex=-1`の同一`questionId`へfocusするテストを書く。
4. 対象がplanから消えた場合、today section見出しへfocusするテストを書く。
5. 完了通知が`role=status`/`aria-live=polite`/`aria-atomic=true`で、項目名と進捗を一度だけ伝えるテストを書く。
6. 同じpropsのrerender、subject切替、単なる再表示で通知が重複しないテストを書く。
7. Escape/X/backと閉じる/Iが既存のメニュー階層を維持する回帰テストを書く。

**Implementation steps:**

- `MenuOverlayProps`にone-shot return `questionId`を追加し、`RoadmapView`へ渡す。
- today項目へ`data-roadmap-question-id`を付け、未完了buttonと完了static要素を同じselectorで解決する。
- `RoadmapView`のDOM commit後に、return対象→先頭CTA→today headingの順でfocus targetを選ぶ。
- 完了static要素とheadingは`tabIndex={-1}`とし、通常Tab順に余分な停止点を追加しない。
- dedicated live regionは視覚表示と分離し、return対象が実際にcompletedのときだけ文言を設定する。
- `useRef`で同一one-shot return IDの再通知を抑止する。Scene側はhandoff時にreturn IDを一度だけ渡す。
- native buttonのEnter/Spaceは既存global key handlerのinteractive-target guardに任せ、二重発火させない。

**Acceptance criteria:**

- [ ] 初回表示、回答後、対象消失の各focus fallbackがdialog内で決定論的に動く。
- [ ] 完了への変化後も同一`questionId`へfocusできる。
- [ ] polite/atomic通知が回答復帰時に一度だけ発生し、通常rerenderでは繰り返さない。
- [ ] Escape/X/back、閉じる/I、Tab trap、native Enter/Spaceが回帰しない。
- [ ] focus/通知処理はGameStateやAttemptEventを読まず、provider状態だけを使う。

**Focused verification:**

```bash
pnpm test:unit tests/unit/roadmapMenu.test.ts -t "フォーカス|通知|戻る"
pnpm test:related src/ui/field/RoadmapView.tsx src/ui/field/MenuOverlay.tsx tests/unit/roadmapMenu.test.ts
```

## Checkpoint B: Interaction contract

- Slice 1〜2のfocused testsをまとめて実行する。
- `document.activeElement`、callback call count、live-region textをbehaviorとして検査し、実装詳細だけをassertしない。
- 既存の「問題回答後はロードマップへ直接戻せる」テストとMenuOverlayのEscapeテストを維持する。
- `pnpm check:architecture`を通し、UI→Scene/保存の逆依存がないことを確認する。

## Slice 3: Responsive finish, target size, reduced motion, graph regression

**Goal:** 今日セクションを既存デザインへ仕上げ、3 viewport、48px、visible focus、reduced-motionを満たしながら
既存graph操作を壊さない。

**Dependencies:** Slice 2 / Checkpoint B。

**Candidate files (3):**

- `src/ui/field/menu.css`
- `src/ui/field/RoadmapView.tsx`
- `tests/unit/roadmapMenu.test.ts`

**RED first:**

1. today section/card/CTA/focus/live-regionのsemantic class契約と、placeholder/disabled CTAがないことをテストする。
2. 既存graph suiteを変更前に実行し、zoom/pan/pinch、20%下限、gesture hint、最小pan、zoom controlsなしをbaseline化する。
3. reduced-motion selectorがtoday animationと`.nq-roadmap-current .nq-roadmap-step`を停止することをCSS検査でREDにする。

**Implementation steps:**

- 960×540ではtoday cardsを横に最大3件並べ、見出しと先頭項目を初期表示内へ置く。
- 640×540では1列へ落とし、`.nq-roadmap-overview`内部を縦scrollさせ、ページ全体の横overflowを出さない。
- 844×390ではheader/gapを圧縮するが、CTA、back、close、subject buttonsの48px targetを縮めない。
- 項目名と理由は視覚上wrapし、accessible nameをtruncateしない。
- focus outlineは既存白/黄色を使い、完了を色だけで表さない。
- `prefers-reduced-motion: reduce`でtodayの導入/進捗animationと現在ノードの点滅を`animation: none`にする。
- `RoadmapGraph.tsx`は変更せず、既存gesture behaviorをテストで保護する。

**Acceptance criteria:**

- [ ] 960×540、640×540、844×390でtoday section、back/close、subject controlsが重ならない。
- [ ] 全interactive targetが48×48 CSS px以上でvisible focusを持つ。
- [ ] 200% text zoom相当でもUnit名・理由・CTAへ到達できる。
- [ ] reduced-motionで点滅/導入animationがなくても状態を理解できる。
- [ ] 既存zoom/pan/pinch、node selection、Escape/back testsが無変更で通る。

**Focused verification:**

```bash
pnpm test:unit tests/unit/roadmapMenu.test.ts
pnpm test:related src/ui/field/RoadmapView.tsx src/ui/field/RoadmapGraph.tsx src/ui/field/MenuOverlay.tsx tests/unit/roadmapMenu.test.ts
pnpm check:fast
pnpm validate:content
```

作業チャットの手動確認は、統合担当とポートを調整した上で4175以降の一時previewを使う。960×540、640×540、
844×390、keyboard、mouse、touch emulation、reduced-motionを確認し、終了後にserverを停止する。4174は使わない。

## Checkpoint C: Module completion

- [ ] Slice 1〜3のacceptance criteriaを満たす。
- [ ] `pnpm test:related ...`、`pnpm check:fast`、`pnpm validate:content`が成功する。
- [ ] `RoadmapGraph.tsx`、Core、Scene、shared、schema、教材JSONに差分がない。
- [ ] `git diff --check`と秘密情報確認を通す。
- [ ] 差分をfive-axis review（correctness/readability/architecture/security/performance）する。
- [ ] 1論理コミットにし、branch、commit ID、検査、preview結果、未変更範囲をhandoffする。

作業チャットでは`pnpm check:full`、全`pnpm test`、`pnpm build`を実行しない。これらは他チャットとの競合を避け、
統合担当が統合後に一度だけ実行する。

## RED/GREEN verification matrix

| Behavior            | RED evidence                        | GREEN evidence                     | Owner                  |
| ------------------- | ----------------------------------- | ---------------------------------- | ---------------------- |
| 0/1/2/3 items       | DOM count/placeholder test fails    | exact count, no fake/disabled item | UI module              |
| incomplete reasons  | each enum text mapping fails        | four exact RubyText mappings       | UI module              |
| completion reasons  | review/diagnosis generic text fails | no inferred original reason        | UI module              |
| exact start         | callback mismatch fails             | only `questionId` called once      | UI module              |
| empty vs complete   | same copy/CTA fails                 | `allComplete` branches differ      | UI module              |
| return focus        | `document.activeElement` mismatch   | item/static/fallback focus         | UI module              |
| polite announcement | missing/repeated live text          | one-shot polite+atomic text        | UI module              |
| back/keyboard       | existing behavior regression        | existing tests remain green        | UI module              |
| responsive/48px     | browser bounding boxes fail         | three viewport checks pass         | Integration owner      |
| graph gestures      | existing unit/E2E regression        | zoom/pan/pinch suite unchanged     | UI + integration owner |
| v13/rewards         | import/save/reload comparison fails | state/reward invariants unchanged  | Integration owner      |

## Focused verification policy

実装中は最小のtest name patternでRED/GREENを確認し、sliceの終わりに関連ファイルへ広げる。

```bash
# Per behavior while RED/GREEN
pnpm test:unit tests/unit/roadmapMenu.test.ts -t "<behavior name>"

# Per slice
pnpm test:related src/ui/field/RoadmapView.tsx src/ui/field/MenuOverlay.tsx tests/unit/roadmapMenu.test.ts

# Module gate
pnpm test:related src/ui/field/RoadmapView.tsx src/ui/field/RoadmapGraph.tsx src/ui/field/MenuOverlay.tsx tests/unit/roadmapMenu.test.ts
pnpm check:fast
pnpm validate:content
```

テストをpassさせるために既存expectationを削除・弱化しない。REDは新規behaviorが未実装であることを確認し、
GREEN後に既存graph/back/focus testsも通す。

## Risks and mitigations

| Risk                                                  | Impact | Mitigation                                                                                      |
| ----------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| Wave 3 contractとUIのduplicate typeが分岐する         | High   | integrated provider型だけをimportし、sharedをUIブランチで編集しない                             |
| 現行`runRoadmapPractice(unitId)`へ誤って接続する      | High   | today callbackは`questionId`専用に分け、Scene配線を統合担当へhandoffする                        |
| 完了後button消失でfocusがbodyへ落ちる                 | High   | 同一data IDのstatic focus target + `tabIndex=-1` + heading fallbackをREDテストする              |
| live regionがrerenderごとに繰り返す                   | Medium | one-shot return IDとannounced refで回答復帰時だけ更新する                                       |
| `allComplete`をitems lengthだけで推測する             | High   | provider flagを必須入力にし、0件/全完了の対テストを置く                                         |
| reasonのsilent fallbackで教材意図を偽る               | Medium | exhaustive mappingと未知enumのcompile failureを維持する                                         |
| 640×540/844×390でheaderとtoday cardsが重なる          | Medium | overview内部scroll、width/height media rules、browser bounding-box checks                       |
| reduced-motionでも現在ノードが点滅する                | Medium | current nodeを明示的に`animation:none`にしCSS検査を置く                                         |
| MenuOverlayのglobal key handlerがbuttonを二重発火する | Medium | native interactive guardを維持し、Enter/Space callback countをテストする                        |
| UI操作が保存・報酬を変える                            | High   | UIはdisplay model/callbackのみ。v13/reward比較を統合gateに置く                                  |
| 大きな既存ファイルへ責務が混ざる                      | Medium | today表示をRoadmapView内の小さな局所component/helperに閉じ、MenuOverlayはpass-throughだけにする |
| 他チャットとfull test/buildが競合する                 | Medium | work chatはfocused/fastのみ、full gateと4174は統合担当だけが実行する                            |

## Integration-owner handoff

本モジュールの実装コミットにはScene/E2E変更を含めない。統合担当へ次を明示して渡す。

### Required wiring

- `Overworld.openMenu().draw()`で統合済み`roadmap-view-model`のtoday planを`MenuOverlay`へ渡す。
- today CTAの`questionId`を`adaptive-roadmap-practice`へ渡し、Unit内ランダム選択を呼ばない。
- 問題終了後、再計算したtoday planと開始元`questionId`をone-shot return propとして
  `draw('roadmap', ..., initialHome=false)`へ渡す。
- questionが完了状態ならUIがfocus/通知し、消えた場合はtoday headingへfallbackできるデータを渡す。
- 既存graphの`onRoadmapSelect(unitId)`は別callbackとして保持し、today exact-question開始と混同しない。

### Integration-owned files likely touched

- `src/scenes/Overworld.ts`
- integrated `src/scenes/overworld/roadmapPractice.ts`またはその後継adaptive practice module
- `tests/e2e/progress.spec.ts`
- `tests/e2e/ui-accessibility.spec.ts`
- 統合側が選定する代表v13 fixture/test

### Integration verification

- 0/1/2/3件、部分完了、全完了、score 0完了、`review | diagnosis`を固定fixtureで確認する。
- answer → roadmap return → same `questionId` focus → polite notice → reload保持を実ブラウザで確認する。
- 960×540、640×540、844×390でbounding box、horizontal overflow、48px targetを確認する。
- mouse、keyboard、single-pointer drag、pinch、wheel zoom/pan、Escape/back、reduced-motionを確認する。
- 代表v13 import → answer → save → reloadで学習報酬、地域進行、所持品、既得進捗を比較する。
- 統合後に`graphify update .`と`graphify affected`で境界を再確認する。
- 最後に`pnpm check:full`を一度だけ実行する。
- 古い4174を停止し、統合済み最新buildを`127.0.0.1:4174`で起動する。通常経路は`?resetSaves=1`、
  v13互換経路は別に確認し、検証済み画面をCodexアプリ内ブラウザで残す。

## Definition of Done for the future implementation

- 各sliceのacceptance criteriaとproject-wide Definition of Doneを満たす。
- 新規behaviorは、実装を外すと失敗するunit testで保護される。
- 既存graph、back、focus、reward/saveの回帰がない。
- UIにScene/GameState/保存依存、新規dependency、永続フィールドがない。
- user-facing textはRubyText/i18nにあり、unknown reasonのsilent fallbackがない。
- focused checksは作業コミット、full/E2E/v13/4174は統合コミットで成功する。
- 人間が実装planを承認した後にのみPhase 3へ進む。

## Open questions

なし。identity、reason、表示名、empty/all-complete、focus、v13/E2E所有権は承認済み仕様と横断レビューで確定済みである。
