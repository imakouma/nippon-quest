# ADR-0001: 動画制作素材を Git 履歴とゲーム配信物から分離する

## Status

Proposed

## Date

2026-10-22

## Context

ローカル退避中の動画制作素材は 483 ファイル、1,374,177,689 bytes（約 1.28 GiB）です。内訳の大半は MP4 24件（702,816,257 bytes）と PNG 416件（668,832,098 bytes）で、通常 Git の 100 MiB を超えるファイルが2件あります。

現在のゲーム実装は `assets/cinematics/` を参照していません。一方、Vite のビルドは `assets/` 全体を `dist/` へコピーするため、制作原本をその場所へ戻すと配布物が約 1.28 GiB 増えます。制作原本、レビュー用素材、ゲームで配信する最終成果物を同じ経路で扱うべきではありません。

Git に残す目録は `imports/cinematic-assets-manifest.json` です。相対パス、bytes、MIME type、SHA-256 だけを持ち、ローカル絶対パス、資格情報、署名付き URL、実バイナリは含めません。

## Proposed decision

次の3層に分けます。

1. **制作原本・レビュー素材**: 非公開の外部オブジェクトストレージを正本とする。
2. **採用済み配信素材**: 配信用に最適化したファイルだけを、公開範囲を分けたオブジェクトストレージ/CDNから配信する。
3. **Git**: 決定的な目録、権利・出典・採否・版のメタデータ、ゲーム側の参照だけを管理する。

現時点の第一候補は Cloudflare R2 ですが、契約・資格情報・公開設定はまだ追加しません。GitHub Release はマイルストーン単位の受け渡し・バックアップ候補、Git LFS は少数の最終マスターを Git コミットへ強く結び付ける必要が出た場合だけ再検討します。

採用前に、保管対象、原本と完成物の公開範囲、予算、保持期間、バックアップ、配信用ドメイン、再配布権をユーザーが決定する必要があります。

## Alternatives considered

### Git LFS に483件を置く

Git LFS は Git 内にポインタを置き、実体を別ストレージへ保存します。GitHub Free では1ファイル2 GBまでで、現在の最大ファイルは収まります。また2026-10-22時点の含有枠は storage 10 GB、bandwidth 10 GB/月です。ただし版更新ごとに実体容量と取得帯域を消費し、全員とCIが LFS を扱う必要があります。さらに GitHub Pages は LFS を直接利用できません。制作履歴とゲーム配信経路が混ざるため、全件採用は見送ります。

- [GitHub: About Git Large File Storage](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage)
- [GitHub: Product usage included with each plan](https://docs.github.com/en/billing/reference/product-usage-included)

### GitHub Release に置く

GitHub Release は1リリース最大1,000 assets、各ファイル2 GiB未満で、総サイズと配信帯域に上限がないと公式文書にあります。今回の483件と最大275,194,570 bytesは数値上収まります。しかし Release はタグ付き成果物の配布向けで、日常編集の正本やゲーム内アセット配信のライフサイクル管理には向きません。階層別アーカイブと目録を添えたマイルストーン受け渡しに限定します。

- [GitHub: About releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases#storage-and-bandwidth-quotas)

### 外部オブジェクトストレージ

非公開原本と公開成果物を分離し、immutable key、Range request、cache、CORS、署名付き URL、保持期間を設計できます。Cloudflare R2 の2026-10-22時点の公式料金は Standard storage が $0.015/GB-month、無料枠が10 GB-month、Class A 100万回、Class B 1,000万回、直接配信の egress は無料です。今回の約1.28 GiBは現在の無料ストレージ枠内ですが、料金・規約・無料枠は契約直前に再確認します。

- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)

## Security and operational constraints

- 制作原本は既定で非公開とし、完成物だけを明示的に公開する。
- 公開バケットへレビュー途中のファイルや再配布権未確認素材を置かない。
- API token、署名付き URL、ローカル絶対パスを Git の目録へ保存しない。
- object key は版を含む immutable path とし、同じ URL の上書きでキャッシュ不整合を起こさない。
- upload 前後で `imports/cinematic-assets-manifest.json` の SHA-256 と照合する。
- `assets/cinematics/` へ制作原本を戻さず、将来のランタイム参照は専用 manifest/base URL を介す。

## Consequences

- 通常の clone、PR、Pages build は約1.28 GiBの制作素材を取得・コピーしない。
- ローカル素材を失わないため、外部正本の選定と初回バックアップは別途必要になる。
- ストレージ障害や契約変更に備え、目録で同一性を検証できる。
- 配信用 URL 契約とランタイム loader の実装は、保存先承認後の別変更になる。
