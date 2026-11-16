# 小4算数の教材整備

ユーザー承認済みの小1同等工程を小4に適用。365問のIDと単元を維持し、原資料の式から欠落を復元する。正答からの推測復元は禁止。公式学習指導要領・東京書籍/啓林館2024年間計画を比較し、学習順を別JSONにする。既存解説の誤りを修復し、未記入解説には根拠と手順を追加する。未収録のそろばん、表とグラフの比較、概数の使い分け等はオリジナル図で補強する。

工程: 全問原資料対応・内容監査 → 式と入力契約修復 → 不足問題追加 → 学習順・全件台帳 → focused unitと実ブラウザ検査 → commit。

変更範囲は小4content/assets/order/visual ledger/学年固有tests/このtasksのみ。manifest/catalog/共有UI/権利台帳は統合担当。図はコードで独自制作し原図を複製しない。正答hashは原資料・独立計算で説明できる変更のみ更新。教員承認は付与しない。

検証: pnpm exec vitest run tests/unit/sansuG4Visuals.test.ts tests/unit/sansuG4Review.test.ts、pnpm exec prettier --check 対象ファイル、4187のViteでPlaywright。全体check:fullは統合担当一回のみ。
