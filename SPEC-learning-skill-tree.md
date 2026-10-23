# Spec: 段階的に広がる学習スキルツリー

## Objective

小学1〜6年の学習ロードマップを、単元を順番に並べた一本道から、前提知識の分岐・合流が見えるゲーム風の学習マップへ変更する。

- 子どもは、いま挑戦できる単元、次に開く単元、復習するとよい単元を見分けられる。
- 全単元は同じ地図上に配置するが、未到達の遠い領域は霧で隠し、学習に応じて段階的に見える範囲を増やす。
- 診断と習熟の根拠は既存の概念別学習状態を使い、表示と練習開始は既存の単元契約を維持する。

## Approved Product Decisions

- ノード数に10〜20件の上限を設けない。
- 初期状態では現在地、挑戦可能な単元、その一段先だけを明かす。
- 遠い単元は地図上の霧ノードとして存在だけを示し、名前と詳細を隠す。
- 複数の前提が同じ単元へ入る場合、すべての前提を満たすと解放する。
- 解放済みの道は復習期限が来ても再び隠さない。定着低下は「復習」状態で示す。
- 学年は地図の帯と推奨範囲に使う。`challengeHigher` が有効なら上の学年も表示・挑戦可能にする。
- 学年とおすすめ時期は、`ぜんぶ` と小学1年1学期〜6年3学期を連続して選べる1本のバーへ統合する。
- おすすめ時期が未設定の単元は該当学年のすべての学期で表示し、教材データ整備中でも単元を消さない。
- 教科選択と進捗は同じコンパクトな操作列へ置き、地図へ使える高さを増やす。
- 学習マップは60〜160%で拡大縮小できる。ピンチ／Ctrl・Command＋トラックパッド、1本指ドラッグ、2本指スクロール、画面上のボタンを同じ表示状態へ反映する。
- 表示を戻す操作は100%へ戻し、現在のおすすめ単元を中央へ再配置する。

## Design Brief and Reference Lock

Designing a browser-based learning map for Japanese elementary-school children in grades 1–6.
Goal: understand current position, prerequisites, next choices, and where to review.
Tone: adventurous, encouraging, legible, and game-like.
Main risk: a complete six-grade graph becomes visually overwhelming.
Constraints: Phaser + Preact, existing pixel-RPG palette, RubyText, keyboard/touch accessibility, no new dependency.

- Primary reference: 添付画像1の中央軸・枝分かれ・光る現在地。
- Secondary reference: 添付画像2の複数ルートの合流と広い探索感。
- Preserve: 暗い地図面、明るい接続線、丸い攻略ノード、選択中の発光、分岐と合流。
- Adapt: 小学生向けに大きい押下領域、文字量を減らしたラベル、状態を色だけに依存しない記号、霧による段階開示。
- Reject: 一画面への全ラベル詰め込み、固定の一本線、他作品の固有アイコン・文言・レイアウトの複製。

### Interaction extension reference lock

- Primary interaction reference: 既存 `AreaMap` のピンチ、トラックパッド移動、ズームボタン。
- Preserve: 48px以上の押下領域、キーボード操作可能なネイティブ部品、現在倍率の数値表示。
- Adapt: 広い学習グラフを見渡せるよう、県地図より低い60%まで縮小可能にする。
- Reject: ノードを隠す固定ビューポート、ブラウザ自体を拡大する操作、ジェスチャーだけに依存する操作。

## Architecture

1. `content/curriculum/` の `prerequisite` を概念単位の教育的な正とする。
2. 純粋関数で概念関係を単元関係へ集約し、循環のない表示グラフを作る。
3. `GameState.learning.mastery` と `conceptStates` から単元の状態と霧の可視範囲を決める。
4. Scene が表示専用モデルをUIへ渡し、UIは保存先や学習ロジックへ依存しない。
5. 接続線はSVG、操作ノードはネイティブ`button`で描画する。

## Node States

- `cleared`: 十分な独力正解または既存の単元習熟条件を満たした。
- `review`: 一度身につけたが復習期限が来た。
- `current`: 挑戦可能な中で現在おすすめ。
- `open`: 前提を満たして挑戦できる。
- `locked`: 前提未達または学年範囲外。

Visibility is independent from learning state:

- `revealed`: 名前・進捗・操作を表示する。
- `frontier`: 一段先として「？」の霧ノードを表示する。
- `hidden`: 遠方の霧として位置だけを表示する。

## Commands

- Focused tests: `pnpm vitest run tests/unit/roadmap.test.ts`
- Lint: `pnpm lint`
- Architecture: `pnpm check:architecture`
- Tests: `pnpm test`
- Content: `pnpm validate:content`
- Build: `pnpm build`
- Preview: `pnpm nrd`

## Testing Strategy

- 単元グラフ集約、AND解放、霧の一段開示、復習状態、フォールバックをVitestで検証する。
- 既存のロードマップ練習開始と保護者画面の契約を維持する。
- 実ブラウザで分岐線、横・縦スクロール、キーボード、狭い画面を確認する。
- 学年・学期バー、ズームボタン、ホイール移動をVitestで検証し、ピンチとドラッグを実ブラウザで確認する。

## Boundaries

- Always: 既存の概念・単元・習熟データを再利用し、UIへ保存ロジックを入れない。
- Ask first: `contracts.ts`、カリキュラムschema、新規依存の変更。
- Never: 教材の前提関係をAI推測だけで確定する、誤答1回で苦手を断定する、別作業の未コミット教材をコピーする。

## Success Criteria

- 前提関係がある教科では一本道ではなく分岐・合流する線が描画される。
- 初期表示で遠いノードの名前は隠れ、学習状態に応じて見える範囲が増える。
- 複数の前提を持つ単元は全前提を満たすまで解放されない。
- 前提関係が未整備の単元も消えず、従来どおり学年設定に基づいて練習できる。
- 既存セーブデータを移行なしで読み込める。
- 標準検査とブラウザ確認が成功する。
- 上部フィルタが1段に収まり、従来より地図表示領域が広い。
- マウス、トラックパッド、タッチ、キーボードのいずれでも拡大縮小へ到達できる。

## Not Doing

- カリキュラム全355概念の教育監修・前提関係追加。
- 自動レイアウト用の外部ライブラリ導入。
- 教科横断関係によるハードロック。
- 保護者画面の全面再設計。
