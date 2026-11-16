# Walkthrough: 小学1年生の算数 UI 改善

## 実装結果

- 小1〜小3算数の数値回答へ、0〜9・❌（全部消す）の画面内テンキーを追加した。
- 複数欄では押した入力欄が黄色い枠で分かり、テンキーからその欄へ入力できる。
- `number-build` のblocksへ、10個箱と1個のばらを既存りんご画像で表示した。
- 数直線へ最大21本の目盛りを追加し、現在値を黄色で強調した。
- 文字回答、高学年、物理キーボード、貼り付け、Enter、採点契約は維持した。

## 検証

- `pnpm test:related src/questions/renderers/text-input/TextInputView.tsx src/questions/renderers/number-build/NumberBuildView.tsx`: 20 files / 178 tests passed
- `E2E_PORT=4183 E2E_REUSE_SERVER=1 pnpm exec playwright test tests/e2e/questions.spec.ts`: 23 tests passed
- `pnpm check:fast`: lint / architecture / typecheck passed
- `VITE_NQ_DEV_TOOLS=1 pnpm build`: content validation and production build passed
- 実ブラウザ: 数字ボタンだけで5を回答、23のまとまり表示、数直線の8、390×844で問題枠内スクロールなし、console errorなしを確認

## 確認URL

`http://127.0.0.1:4183/playground.html?q=sansu.g1.hikizan.0002`

## 2026-11-14 追補

- 入力欄の外側outlineを外し、黄色い1つの箱として見えるようにした。
- 「もどす」を削除し、「ぜんぶけす」を❌表示へ変更した。
- 数字と❌をすべて96×56pxに統一した。
- 1を左上に置き、上から1〜9へ進む並びにした。
- 正解表示を、緑の大きな「○ せいかい！」へ変更した。
- 回答後をRPG風の「けっか」パネルにまとめ、主操作の「つぎへ」と補助操作の「かいせつ」を見分けやすくした。
- 数字を記入する問題は、教科と学年によらず同じテンキーを表示するようにした。
- 旧問題データの小さい`□`は入力位置へ変換し、実際の入力欄だけを表示するようにした。
- 記述式は全教科・全学年で、誤答時を含めて同じ「けっか」画面へ進むようにした。
- 長文の記述問題は、問題文の下に入力欄と単位をまとめて中央配置するようにした。
