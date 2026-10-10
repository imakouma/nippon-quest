# 東北版 教材・学術レビュー台帳

確認日: 2026-10-03（日本時間）
対象: 問題JSONの `tags` に青森・岩手・宮城・秋田・山形・福島の `prefecture:*` を持つ問題
公開判定: **全18問、人間の学術責任者による承認待ち（この台帳だけでは公開承認しない）**

## 判定ルール

- 本文に県名が偶然含まれるだけの旧版問題は母集団に含めない。公開範囲は構造化された県タグで再現する。
- 「根拠確認済み」は、担当者が下記の公的機関資料で主張を照合したという意味であり、「承認済み」ではない。
- 生産量、人口、順位など変化し得る事実は、公開直前に資料年次も含めて再確認する。
- 根拠が主張全体を覆わない問題は「一部確認」、適切な一次資料を特定できない問題は「保留」とする。
- 算数・理科の青森タグは出題の舞台設定である。学習内容は確認対象だが、県の地理知識を教える問題として扱わない。

## 母集団の固定値

| ファイル | SHA-256 |
|---|---|
| `questions/rika/g4/mizu-experiment.json` | `d803cdec84f39c5064e3fee34f53800c11f1e9d28fa1888b0f435690c652f139` |
| `questions/sansu/g1/ringo-number-build.json` | `d228c03711c81016e2b58b7e87e80403161896b95d7b187e767637be63fbb956` |
| `questions/sansu/g1/tashizan.json` | `e9bd4b8a952489c7f2da25d5f03ce18833df2a68de5f0824fc353392bb27977d` |
| `questions/shakai/g4/todofuken.json` | `dbca6eb3b92ad1c778dd940da3f2066f100527fd6df4ed4187db1e2df3f8c2bc` |
| `questions/shakai/g4/tohoku.json` | `78d29fd8752b970bf7b8dd88462cb0260673ae67a32e6cfdc3e4ba14228bc4e7` |

## 問題別レビュー

| 問題ID | 県 | 機械監査時点の状態 | 根拠 | 人間承認 |
|---|---|---|---|---|
| `rika.g4.mizu-no-sugata.experiment-0001` | 青森 | 学習内容の形式確認のみ | MEXT | 人間承認待ち |
| `sansu.g1.kazu-100.ringo-blocks-0001` | 青森 | 学習内容の形式確認のみ | MEXT | 人間承認待ち |
| `sansu.g1.kazu-100.ringo-keypad-0001` | 青森 | 学習内容の形式確認のみ | MEXT | 人間承認待ち |
| `sansu.g1.kazu-100.ringo-numberline-0001` | 青森 | 学習内容の形式確認のみ | MEXT | 人間承認待ち |
| `sansu.g1.tashizan.0001` | 青森 | 学習内容の形式確認のみ | MEXT | 人間承認待ち |
| `shakai.g4.todofuken.0001` | 青森 | 根拠確認済み・統計年次の再確認対象 | MAFF-APPLE | 人間承認待ち |
| `shakai.g4.todofuken.0002` | 青森 | 一部確認（海峡位置の直接資料を追加要） | GSI-SEIKAN | 人間承認待ち |
| `shakai.g4.todofuken.0003` | 青森 | 根拠確認済み | SANNAI | 人間承認待ち |
| `shakai.g4.todofuken.0101` | 岩手 | 根拠確認済み | BUNKA-HIRAIZUMI | 人間承認待ち |
| `shakai.g4.todofuken.0102` | 岩手 | 一部確認（提供方法の説明を追加要） | IWATE-WANKO | 人間承認待ち |
| `shakai.g4.todofuken.0103` | 宮城 | 一部確認（人口比較は公開時再確認） | MIYAGI-PROFILE | 人間承認待ち |
| `shakai.g4.todofuken.0104` | 宮城 | 根拠確認済み | MIYAGI-MATSUSHIMA | 人間承認待ち |
| `shakai.g4.todofuken.0105` | 秋田 | 根拠確認済み | GSI-LAKES | 人間承認待ち |
| `shakai.g4.todofuken.0106` | 秋田 | 根拠確認済み | BUNKA-NAMAHAGE | 人間承認待ち |
| `shakai.g4.todofuken.0107` | 山形 | 根拠確認済み・統計年次の再確認対象 | MAFF-YAMAGATA | 人間承認待ち |
| `shakai.g4.todofuken.0108` | 山形 | 根拠確認済み | MLIT-MOGAMI | 人間承認待ち |
| `shakai.g4.todofuken.0109` | 福島 | 保留（説明全文を覆う公的一次資料が未特定） | — | 人間承認待ち |
| `shakai.g4.todofuken.0110` | 福島 | 一部確認（面積順位は確認、愛称・水質表現は要修正判断） | GSI-INAWASHIRO, FUKUSHIMA-LAKE | 人間承認待ち |

## 確認資料

| ID | 資料名・機関 | URL | 確認日 |
|---|---|---|---|
| MEXT | 小学校学習指導要領（平成29年告示）・文部科学省 | https://www.mext.go.jp/a_menu/shotou/new-cs/1384661.htm | 2026-10-03 |
| MAFF-APPLE | りんご・農林水産省東北農政局 | https://www.maff.go.jp/tohoku/monosiritai/syokutaku/ringo.html | 2026-10-03 |
| GSI-SEIKAN | 青函トンネルにおける一等水準測量・国土地理院 | https://www.gsi.go.jp/common/000024813.pdf | 2026-10-03 |
| SANNAI | 特別史跡 三内丸山遺跡・青森県 | https://sannaimaruyama.pref.aomori.jp/about/ | 2026-10-03 |
| BUNKA-HIRAIZUMI | 平泉―仏国土を表す建築・庭園及び考古学的遺跡群 推薦書・文化庁 | https://bunka.nii.ac.jp/suisensyo/hiraizumi/hiraizumi_2A.pdf | 2026-10-03 |
| IWATE-WANKO | 岩手県のPRキャラクター「わんこきょうだい」・岩手県 | https://www.pref.iwate.jp/sangyoukoyou/kankou/kyougikai/index.html | 2026-10-03 |
| MIYAGI-PROFILE | 仙台都市圏域の概要・宮城県 | https://www.pref.miyagi.jp/soshiki/sdsgsin-e/titoshikengaiyou.html | 2026-10-03 |
| MIYAGI-MATSUSHIMA | 特別名勝松島・宮城県 | https://www.pref.miyagi.jp/soshiki/bunkazai/matusima.html | 2026-10-03 |
| GSI-LAKES | 調査実施湖沼一覧・国土地理院 | https://www.gsi.go.jp/kankyochiri/koshouchousa-list.html | 2026-10-03 |
| BUNKA-NAMAHAGE | 来訪神：仮面・仮装の神々・文化遺産オンライン | https://bunka.nii.ac.jp/special_content/intangible/147195 | 2026-10-03 |
| MAFF-YAMAGATA | 山形県の農林水産業の概要・農林水産省 | https://www.maff.go.jp/j/kanbo/tiho/15sonota/2026PDF/todouhuken_gaiyou2026-06.pdf | 2026-10-03 |
| MLIT-MOGAMI | 日本の川―東北―最上川・国土交通省 | https://www.mlit.go.jp/river/toukei_chousa/kasen/jiten/nihon_kawa/0211_mogami/0211_mogami_00.html | 2026-10-03 |
| GSI-INAWASHIRO | 湖沼面積20傑・国土地理院 | https://www.gsi.go.jp/KOKUJYOHO/MENCHO/backnumber/GSI-menseki20250101.pdf | 2026-10-03 |
| FUKUSHIMA-LAKE | 猪苗代湖調査・福島県 | https://www.pref.fukushima.lg.jp/sec/298/inawashiro-chousa.html | 2026-10-03 |

## 未完了・公開ブロッカー

1. 18問すべてについて、学術責任者の氏名・承認日・対象ハッシュを記録する。
2. `0002` は津軽海峡の位置を直接示す国土地理院等の資料を追加する。
3. `0102` は「食べ終わるとすぐ次を入れる」という説明を公的資料で直接確認する。
4. `0103` の「東北でいちばん人口が多い」は公開日の最新公的統計で確認するか、変動しにくい説明へ変更する。
5. `0109` は赤べこの由来・語義を覆う公的一次資料が特定できるまで保留する。
6. `0110` の「水がきれい」は福島県資料が水質悪化への懸念を示すため、そのまま承認せず表現を見直す。

## 再現方法

```bash
pnpm exec tsx scripts/audit-tohoku-academic.ts
pnpm vitest run tests/unit/tohokuAcademicAudit.test.ts
```

監査スクリプトは県タグから母集団を再生成し、問題数、ファイル数、全ID、各ファイルのSHA-256、および全件が人間承認待ちであることを検査する。
