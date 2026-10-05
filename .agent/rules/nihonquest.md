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
