# 小3算数：内容と学習順レビュー

現行統合版から分離した専用worktreeで、固定340問と生成5問を対象とする。教科書本文の複製はせず、公式2024年間指導計画で範囲と配列を比較する。東書の配列を基本に、啓林館の前提関係を照合する。学習指導要領は年間の唯一の順番を指定しない。

1. [x] 原資料対応を保存し、欠落した式・条件を復元（元のID・unit・正答を保持、矛盾は個別記録）。
2. [x] 筆算の崩れ・答えだけの解説を、位分けや逆算による理由に差し替える。
3. [x] 円と球、そろばんなど薄い領域を独自図付きで補う。
4. [x] 全ID一回の学ぶ順JSON、全件レビュー表と回帰検査を整える。
5. [x] 学年unit検査、ブラウザ4186で図・正答・解説・見切れを検証してコミット。

共通UI・manifest・catalog・権利台帳は統合担当が更新。全件テスト/buildは統合担当に集約。

出典：

- https://www.mext.go.jp/content/20211102-mxt_kyoiku02-100002607_04.pdf （平成29年告示解説）
- https://ten.tokyo-shoseki.co.jp/text/shou/sansu/data/sansu_keikaku_ryakuan_3_20240131.pdf
- https://www.shinko-keirin.co.jp/keirinkan/sho_r6/sansu/file/sansu_guidance_plan03.pdf
