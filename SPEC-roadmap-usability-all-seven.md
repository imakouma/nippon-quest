# Spec: 学習ロードマップの7項目改善

## Objective

小学生が学習ロードマップで迷わず「次に何を学ぶか」を選べるようにし、地図を探索するときの現在位置を保ちながら、ロック条件と操作方法を理解できる画面へ改善する。

## Approved Requirements

1. 単元選択のたびに地図を中央へ寄せず、選択先が表示範囲外のときだけ必要最小限パンする。
2. 19段階の学年・学期スライダーを廃止し、学年と学期の明示的な選択ボタンへ分ける。
3. 教科タブは一文字略称をやめ、全学年で教科名を全文表示する。
4. 霧の先の単元名は地図と詳細の両方で伏せ、前提単元は詳細から選択して移動できるようにする。
5. 全教科の概要に「つぎのおすすめ」を目立つ主要行動として表示する。
6. 永続的なズーム操作ボタンは戻さず、地図を初めて開いたときだけジェスチャー説明を表示し、操作後に消す。
7. 時期説明の情報ボタンをタッチ・キーボード対応にし、単元選択をチェックボックスではなくボタンとして読み上げる。

## Design Brief and Reference Lock

- Screen job: 子どもが次の学習を見つけ、教科・学年・学期を理解して絞り込み、地図上の単元へ進む。
- Tone: 既存の濃紺、硬いピクセル枠、黄色の主要行動、教科色を保つゲーム内冒険マップ。
- Preserve: 左の選択詳細＋右の地図、48px以上の操作対象、RubyText、パン・ピンチ・トラックパッド操作。
- Improve: フィルタの意味、教科名、目的行動、ロック情報、操作の発見性、キーボード・読み上げ。
- Reject: 汎用SaaS風カード、グラデーション主体の現代UI、丸いピルの多用、常設ズームツール、新規画像・新規依存。
- Primary reference: 現行NIHON QUESTのロードマップ本番画面。補助原則として、意味のあるボタン、`focus-visible`、一度きりの説明、動きの抑制を採用する。

## Architecture

- Preact / TypeScript: `src/ui/field/RoadmapView.tsx`, `src/ui/field/RoadmapGraph.tsx`
- Styling: `src/ui/field/menu.css`
- Text: `content/i18n/ja.json`
- Unit contract: `tests/unit/roadmapMenu.test.ts`
- Browser journey: `tests/e2e/progress.spec.ts`
- 保存形式、カリキュラム、問題契約、外部依存は変更しない。

## Acceptance Criteria

- 学年は「ぜんぶ・1〜6年」、学期は「ぜんぶ・1〜3学期」をボタンで選べ、スライダーは存在しない。
- 全教科・各教科のタブに、略称ではなく全文が表示される。
- 全教科概要に、現在または開放済み単元を示す「つぎのおすすめ」があり、押すと該当教科へ移動する。
- 表示中の単元を選び替えても地図位置は変わらない。表示範囲外の単元を選んだ場合だけ、単元全体が見える最小距離だけ移動する。
- 前線ノードの実名は詳細にも出ず、前提単元ボタンでその単元を選択できる。
- 操作ヒントはアプリ起動中の初回地図表示だけ出て、パンまたはズーム操作開始後に消える。
- 時期の情報ボタンは48px以上で、Enter/Space・タッチで説明を開閉し、状態を `aria-expanded` で伝える。
- 地図単元ボタンに `aria-pressed` を使わず、選択状態はラベルと視覚状態で伝える。
- 既存のズーム・パン・ピンチ、20%俯瞰、開始の二段階操作、ロック中の開始不可を維持する。

## Verification

- `pnpm vitest run tests/unit/roadmapMenu.test.ts`
- `pnpm exec playwright test tests/e2e/progress.spec.ts`
- `pnpm lint`
- `pnpm check:architecture`
- `pnpm test`
- `pnpm validate:content`
- `pnpm build`
- 960×540と640×540の実ブラウザで、重なり・切れ・操作不能・Reference lock違反がないことを確認する。

## Rollback

変更は `codex/roadmap-usability-all-seven` の独立コミットにまとめ、コミット単位で取り消せるようにする。

## Open Questions

なし。上記7項目はユーザー承認済み。
