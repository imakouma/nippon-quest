# Spec: 小学1年生の算数 UI 改善

状態：実装・検証済み。2026-11-13。

## Objective

小学1年生の算数問題を、キーボード操作を知らない子どもでも迷わず答えられ、数を具体物として捉えやすい UI にする。

最新 `imakouma/main` の小1算数は186問あり、内訳は `text-input` 106問、`choice` 77問、`number-build` 3問である。時計の絵、読み上げ、低学年向け解説導線、選択肢の見切れ対策はすでに実装済みのため維持する。最初の改善は、最も利用数が多く操作上の迷いが大きい数値入力と、具体物を扱う `number-build` に限定する。

成功とは、PCの `Enter` キーを知らなくても画面だけで数値回答を完了でき、10のまとまり・1のばら・数直線の目盛りを見て数の構造を理解できる状態である。

## Current Findings

- 数値入力は暗い空欄と「Enterで…」というPC向け説明が中心で、小1向けの画面内入力手段がない。
- 186問中106問が `text-input` なので、この問題は一部ではなく主要動線である。
- `number-build` の blocks モードは `+10` / `+1` と数値しか見えず、「りんご23こ」「10のまとまり」という具体物が画面にない。
- numberline モードは両端の `0` と `10` だけで、1刻みの目盛りが見えない。小さいつまみで正確な位置を選ぶ必要がある。
- 時計問題は大きな時計図が表示され、現在の低学年UIで最も分かりやすい基準になっている。
- 不正解時の「おしい！」、解説がある問題の「かんがえかたを みる」、読み上げは既存仕様として機能している。

## Design Brief

Designing 小1算数の回答UI for 小学1年生 on web/touch端末。

- Goal: 説明を読まなくても、押す場所と数の変化が分かる。
- Tone: RPGの道具を触るような、明るく手応えのある学習操作。
- Main risk: 装飾を増やして問題文や答えより目立つこと、または高学年・文字回答を壊すこと。
- Must remember: 数を「入力する文字」ではなく「動かせるもの」として見せる。
- Constraints: PixelMplus12の12px倍数、既存NQ配色、960×540問題枠、Preact、依存追加なし、タッチとキーボード両対応。
- Research needed: 既存UI、低学年向けフォーム・タッチ操作のcraft rules。
- Path: 既存デザインシステム内の直接実装。

## Reference Lock

- Primary reference: 現行の小1時計問題。大きな具体物、短い問題文、横一列の大きな回答操作を維持する。
- Preserve: 濃紺の問題面、クリーム色の太い境界、黄・青・緑の役割、48px以上の操作対象、PixelMplus12。
- Borrow only: Refero bundled craft rulesの `inputmode`、明確な `focus-visible`、44px以上のタッチ対象、状態の `aria-live`。
- Role rules: 緑は正解、橙は主操作、青は補助操作、黄は現在値・注目箇所、❌は全部消す操作だけに使う。
- Media strategy: 新規画像を作らず、既存のりんごドット絵とCSSの10のまとまり／目盛りを使う。
- Reject: グラデーション、丸いSaaS風カード、飾りだけのアニメーション、絵文字の追加、色だけでの状態表現。
- Token commitments: 既存 `questions.css` の色・角なし・4px境界を維持し、新しい独自パレットは作らない。

## Decision Ledger

| Decision                             | Source                        | Rule / role                  | Why                                    |
| ------------------------------------ | ----------------------------- | ---------------------------- | -------------------------------------- |
| 数字だけの回答に画面内テンキーを出す | 利用者、Refero forms/touch    | 教科・学年を問わず同じ入力UI | PCキーの知識なしで完結させる           |
| 入力中の欄を黄で明示する             | 既存NQ配色                    | 黄は現在値・注目             | 複数欄でも次に入る場所を見失わない     |
| 10のまとまりと1のばらを視覚化する    | GDD「文字より絵」、現行時計UI | 具体物は問題の主役           | `+10` の抽象操作を数の構造へ結びつける |
| 数直線へ刻み目を描く                 | 小1算数の内容、既存range      | 位置は線と目盛りで示す       | 0と10だけでは8の位置を推測しづらい     |
| 正誤・採点契約は変えない             | Architecture §3               | `QuestionResult`契約維持     | UI改善をゲーム進行から分離する         |

## Tech Stack

- TypeScript strict
- Preact
- 既存 `src/questions/renderers/` と共通CSS
- Vitest（純粋ロジック）
- Playwright（実画面・タッチサイズ・レスポンシブ）
- 新規依存なし

## Commands

```bash
pnpm test:related src/questions/renderers/text-input/TextInputView.tsx src/questions/renderers/number-build/NumberBuildView.tsx
pnpm check:fast
VITE_NQ_DEV_TOOLS=1 pnpm build
pnpm exec playwright test tests/e2e/questions.spec.ts tests/e2e/question-mobile.spec.ts tests/e2e/question-viewport.spec.ts
VITE_NQ_DEV_TOOLS=1 pnpm exec vite preview --host 127.0.0.1 --port 4175 --strictPort
```

## Project Structure

- `src/questions/renderers/text-input/TextInputView.tsx`: 数字回答時だけ画面内テンキーを表示し、複数欄の選択状態を管理する。
- `src/questions/renderers/number-build/NumberBuildView.tsx`: blocksの具体物表示とnumberlineの目盛りを描く。
- `src/questions/renderers/shared/questions.css`: 既存トークン内でテンキー、まとまり、目盛り、フォーカスを配置する。
- `content/i18n/ja.json`: 必要な短い操作文言だけを追加する。
- `tests/unit/`: 数字回答判定または数直線目盛りの純粋ロジックを検査する。
- `tests/e2e/`: 小1代表問題を実ブラウザで検査する。
- `tasks/`: 承認後のPlan、Todo、Walkthrough、スクリーンショットを置く。

## Code Style

既存のレンダラー内へ小さな純粋関数を置き、問題タイプや学年をゲーム本体へ漏らさない。

```ts
const numeric = payload.answers.every((answer) => /^-?\d+(?:\.\d+)?$/.test(normalizeInput(answer)));
```

条件を満たすときだけ補助UIを出し、通常の文字入力、貼り付け、物理キーボード、採点処理はそのまま残す。新しい抽象化や共通コンポーネントは、2か所以上で実際に再利用しない限り作らない。

## Interaction Requirements

### 1. 数値入力

- 正解候補がすべて通常の10進数なら、教科と学年を問わず画面内テンキーを表示する。
- `0`〜`9`と、全部けすを表す❌を同じ大きさのボタンで提供する。一文字もどすは置かない。
- 複数入力欄では、押した欄を現在欄にし、値を確定したら次の空欄へ移れる。
- 既存inputを残し、物理キーボード、貼り付け、モバイル数値キーボード、Enter回答も維持する。
- 低学年の数値テンキー表示中は、画面に `Enter` キーの説明を常時出さない。
- 現在欄、値、ボタン名をスクリーンリーダーへ伝える。

### 2. 10のまとまり・1のばら

- blocksモードでは現在値を、10のまとまりと1のばらとして同時表示する。
- 現行の `+10` / `+1` / `−` と数値出力は維持し、視覚表示は操作結果として更新する。
- 小1のりんご問題では既存のりんごドット絵を使い、10個箱とばらを区別する。
- 値が大きくても問題枠をスクロールさせず、最大9本の10棒と9個のばらで表す。
- 視覚表示には「10が2こ、1が3こ」のような代替説明を付ける。

### 3. 数直線

- `min`〜`max`のstep数が20以下なら全目盛り、超える場合は主要目盛りだけを描く。
- 現在値の目盛りを黄で強調し、つまみ以外にも選択位置が分かるようにする。
- range本体の操作、矢印キー、採点、部分点は変更しない。
- 0〜10、1刻みでは11本の目盛りが見え、端だけでなく途中位置を数えられる。

### 4. 回答後の結果

- 角なし・太枠・ピクセル影の「けっか」パネルに、正誤、解説、次の操作をまとめる。
- 正解は緑の「○ せいかい！」で、色と文字の両方から判別できるようにする。
- 主操作の「つぎへ」は橙、補助操作の「かいせつ」は青にし、どちらも64px以上のタッチ対象にする。
- 解説本文はクリーム色のメッセージ枠へ表示し、表示後も「つぎへ」を中央に残す。

## Testing Strategy

1. RED: 教科・学年を問わず数値回答に画面内テンキーがあり、文字回答には出ないE2Eを追加する。
2. RED: 0〜10の数直線が11目盛りを持ち、値8で対応目盛りが選択状態になる検査を追加する。
3. RED: blocksで23を作ると10のまとまり2つ・ばら3つになる検査を追加する。
4. GREEN: 既存採点ロジックとデータ契約を変えず、最小の表示・入力状態だけを実装する。
5. 回帰: 時計図、choice、文字入力、高学年、320px、960×540、タッチ、物理キーボードを確認する。
6. 実ブラウザ: `sansu.g1.hikizan.0002`、`legacy.rika.g5.sci-5-8.143d35c53ce7`、`legacy.sansu.g1.math-1-1.1fa82b870bfb`、`sansu.g1.kazu-100.ringo-blocks-0001`、`sansu.g1.kazu-100.ringo-numberline-0001` を確認する。

## Boundaries

### Always

- `QuestionResult`、採点、制限時間、中断、レビュー解説を維持する。
- 画面内テンキーは補助入力とし、ネイティブinputを消さない。
- 既存のNQ配色・ドットフォント・48px以上の操作対象を使う。
- 小1算数の代表問題を960×540と狭幅の両方で確認する。

### Ask first

- 問題文、正解、解説、問題画像の変更。
- `contracts.ts`、schema、manifest形式の変更。
- 新規アセット、新規依存、効果音の追加。
- 不正解後の再挑戦回数やスコア計算の変更。

### Never

- 既存問題データやセーブデータを削除・上書きしない。
- 文字回答へ数字テンキーを出さない。
- タッチ操作のためにキーボード・読み上げ・貼り付けを壊さない。
- 問題タイプ分岐を`src/core/`または`src/scenes/`へ追加しない。

## Success Criteria

1. 小1算数の数字回答を、画面内の数字ボタンだけで入力・修正・送信できる。
2. 数字テンキーの各操作は48px以上で、フォーカスと押下状態が見える。
3. `Enter`を知らない子どもでも、画面上の文言だけで回答方法が分かる。
4. 23を作る問題で、10のまとまり2つと1のばら3つが視覚・音声代替の両方で分かる。
5. 0〜10の数直線で11本の目盛りが見え、現在値8が強調される。
6. 時計問題、choice、非数値のtext-input、高学年問題の表示と採点が変わらない。
7. 960×540、320px相当、タッチ、キーボードで操作でき、問題枠内に不要な縦スクロールが出ない。
8. `pnpm check:fast`、関連Vitest、関連Playwright、開発用buildが成功する。

## Open Questions

- なし。問題内容・採点・スキーマを変えない範囲で実装できる。
