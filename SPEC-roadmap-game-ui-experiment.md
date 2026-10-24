# Spec: ゲームらしい学習マップ試作

## Objective

学習ロードマップを管理画面のグラフではなく、次の目的地を選ぶRPGの冒険マップとして読める画面へ試作する。現在地、選択中の単元、進める道を最優先で見せ、単元の開始は意図的な二段階操作にする。

## Approved Product Decisions

- 現在の安定版 `b49be5c1` は残し、試作専用ブランチで実装する。
- 単元を押すと選択状態と詳細を表示し、`ここを 学[まな]ぶ` で問題を開始する。
- 現在地は通常ノードより強く、選択中は現在地とは別の形で判別できる。
- 50%未満は俯瞰表示とし、細かいラベル・学年タグ・習熟ゲージを隠して道筋と重要地点を残す。
- 既存の20〜160%ズーム、パン、ピンチ、現在地中央寄せは維持する。
- 上部フィルタは機能を維持しつつ、地図より弱い見た目にする。

## Design Brief and Reference Lock

- Screen job: 子どもが「いま何を学ぶか」を見つけ、道を眺め、選んで開始する。
- Tone: 冒険、発見、手触りのあるドットRPG。SaaSや管理ダッシュボードにはしない。
- Preserve: 濃紺の世界、教科色、黄色のフォーカス、RubyText、48px以上の操作対象。
- Primary move: 現在の単元を光るクエスト拠点にし、選択した単元のクエストパネルを地図下部に重ねる。
- Color roles: 黄色は現在・選択・主要行動だけ、教科色は進行ルート、灰色は霧とロック。
- Reject: 同じ強さの枠を並べる、全情報を一律縮小する、ネイティブ部品だけが浮く、文字だけで状態を伝える。
- Media: 既存のSVG経路、CSS、文字記号だけを使い、新規画像や依存を追加しない。

## Tech Stack and Structure

- Preact / TypeScript: `src/ui/field/RoadmapGraph.tsx`
- UI styling: `src/ui/field/menu.css`
- Text: `content/i18n/ja.json`
- Unit tests: `tests/unit/roadmapMenu.test.ts`
- Browser verification: `tests/e2e/progress.spec.ts`

## Commands

- Focused test: `pnpm vitest run tests/unit/roadmapMenu.test.ts`
- Focused E2E: `pnpm exec playwright test tests/e2e/progress.spec.ts`
- Required gates: `pnpm lint`, `pnpm check:architecture`, `pnpm test`, `pnpm validate:content`, `pnpm build`
- Preview: `pnpm exec vite preview --host 127.0.0.1 --port 4174 --strictPort`

## Testing Strategy

- Vitestで「選択だけでは開始しない」「主要ボタンで開始」「低倍率で俯瞰モード」を固定する。
- Playwrightで選択パネル、20%俯瞰表示、ズーム・パン・中央寄せの既存契約を確認する。
- 960×540と640×540で、地図、パネル、操作ボタンの重なりを実画面確認する。

## Boundaries

- Always: UIは表示モデルとcallbackだけを使い、保存や学習判定へ直接依存しない。
- Ask first: `contracts.ts`、schema、カリキュラムデータ、新規依存の変更。
- Never: 安定版ブランチを上書きする、ロック単元の名前を公開する、既存ジェスチャーを削る。

## Success Criteria

- 開いた直後に現在単元が選択され、名称・学年・習熟度・開始行動が見える。
- 開いている別単元を押すと選択だけが変わり、開始callbackはまだ呼ばれない。
- `ここを 学[まな]ぶ` を押したときだけ、その単元の問題開始callbackが呼ばれる。
- 50%未満では `overview` 状態になり、細かい文字情報を隠して主要マーカーと経路を残す。
- 現在地と選択中は色だけでなく輪郭・記号・文言でも識別できる。
- 標準検査と実ブラウザ検証が通る。

## Rollback

正規プレビューを安定版worktree `/private/tmp/education-2d-RPG-roadmap-pan-fix` の `b49be5c1` から再起動すれば、試作前へ即時に戻せる。試作は独立コミットとして残す。

## Open Questions

なし。視覚の好みは試作画面を見てから調整する。
