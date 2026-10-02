# 東北コンテンツ・進行台帳

最終更新: 2026-10-03

## 判定対象

青森・岩手・宮城・秋田・山形・福島について、入口から町／ダンジョン、中ボス、県ボス、県のしるし、東北地方ボス、北海道の結界までをデータと自動検査で追跡する。

この台帳は進行データの整合性を扱う。教材内容の学術承認、素材の権利確認、画面品質、リリース全体の Go/No-Go は各担当台帳を正とする。

## 正式な進行契約

1. 新規ゲームは `tohoku` / `aomori` / `aomori-field` から始まる。
2. 東北の県順は青森 → 岩手 → 宮城 → 秋田 → 山形 → 福島である。
3. 各県のフィールドから町とダンジョンへ入り、各マップからフィールドへ戻れる。
4. 各県のフィールドには中ボスが1体、ダンジョンには県ボスが1体いる。
5. 中ボス撃破後のワープは同じ地方の次県へ進む。福島から北海道へ直接は進まない。
6. 県ボス撃破で `boss.<県>` と県のしるしを1回だけ得る。
7. 6県すべてのしるしが揃った場合だけ `tohoku-boss-rokufuyu` に挑戦できる。
8. 地方ボス撃破で `islandsCleared` に `tohoku` が1回だけ記録される。
9. 北海道は `stub` のままで、東北章終了時点では上陸できない。

## 6県のデータ台帳

| 順 | 県 | フィールド | 町 | ダンジョン | 中ボス | 県ボス | 県ボス報酬 | 次のワープ |
|---:|---|---|---|---|---|---|---|---|
| 1 | 青森 | `aomori-field` | `aomori-town` | `aomori-dungeon` | `aomori-midboss-nebuta-taisho` | `aomori-boss-tsugaru-no-nushi` | `boss.aomori` + `aomori`のしるし | 岩手 |
| 2 | 岩手 | `iwate-field` | `iwate-town` | `iwate-dungeon` | `iwate-midboss-tetsubin-game` | `iwate-boss-konjiki-no-tora` | `boss.iwate` + `iwate`のしるし | 宮城 |
| 3 | 宮城 | `miyagi-field` | `miyagi-town` | `miyagi-dungeon` | `miyagi-midboss-tanabata-dori` | `miyagi-boss-mikazuki-shogun` | `boss.miyagi` + `miyagi`のしるし | 秋田 |
| 4 | 秋田 | `akita-field` | `akita-town` | `akita-dungeon` | `akita-midboss-kanto-man` | `akita-boss-namahage-ou` | `boss.akita` + `akita`のしるし | 山形 |
| 5 | 山形 | `yamagata-field` | `yamagata-town` | `yamagata-dungeon` | `yamagata-midboss-juhyon` | `yamagata-boss-juhyo-no-kami` | `boss.yamagata` + `yamagata`のしるし | 福島 |
| 6 | 福島 | `fukushima-field` | `fukushima-town` | `fukushima-dungeon` | `fukushima-midboss-goshiki-slime` | `fukushima-boss-tsurugajo-no-nushi` | `boss.fukushima` + `fukushima`のしるし | なし（地方ボスが結界を管理） |

地方ボスは `tohoku-boss-rokufuyu`。撃破後の記録は `islandsCleared: ["tohoku"]`。次地方の北海道は `status: "stub"` のため、本リリースでは結界表示を維持する。

## 自動検査の証拠

`tests/unit/tohokuProgression.test.ts` が以下を専用検査する。

- 県順、公開状態、新規ゲーム入口
- フィールド／町／ダンジョンの往復遷移
- マップ内の中ボス・県ボス配置数と重複名
- ボスID、`isBoss`、県所属の参照整合性
- 中ボス後のワープ順と福島での停止
- しるし不足時の地方ボス封鎖
- しるしと地方クリア記録の重複防止
- 東北クリア後も北海道が `stub` であること

補助検査として既存の `tests/unit/maps.test.ts` が全物体への到達可能性、遷移先スポーン、`maps/` と `public/maps/` の一致を確認し、`tests/unit/content.test.ts` が参照切れ、所属漏れ、県・島の重複を確認する。

## 既知の境界・残課題

- この台帳のテストは進行データの再現性を保証するもので、6県を人間が最初から順番に操作する完全E2Eの代わりではない。
- 既存の地方ボスE2Eは6県のしるしをセーブへ注入して地方ボス以降を確認する。県ごとの実操作E2EはQA担当の範囲。
- 学術的事実や教材問題の正しさは承認していない。未確認教材は教材・学術レビュー台帳に従う。
- 歴史人物を含む裏ステージは県ボス後の追加要素で、東北地方ボス解放の必須条件ではない。

## 再検証コマンド

```bash
pnpm vitest run tests/unit/tohokuProgression.test.ts tests/unit/progression.test.ts tests/unit/areaBoss.test.ts tests/unit/maps.test.ts tests/unit/content.test.ts
pnpm validate:content
pnpm build
```
