# Animation batch-01 制作記録

## 境界

- 対象の正: `tasks/animation-batch-assignments.json` の `batch-01.ids`（111件）。
- ランタイム登録: 制作・目視・ゲーム再生を確認した通常モンスターだけ。
- `aomori-ringoron` は既存完成品なので再生成・batch manifest登録をしない。
- `protagonist` / `michiru` / `shiori` は人物専用APIで扱い、既存の外見カスタマイズと4方向歩行を維持する。
- `-stage-2` / `-stage-3` の6件は資料室素材のみ。monster manifestや進化定義には登録しない。
- 共通 Battle / Overworld / 権利台帳 / カタログはこのブランチで編集しない。

## 進捗

- 制作・登録・PC/横向きスマホE2E済み: 12
- 人物素材・専用API・unit済み（共通Scene未組込み）: 3
- 進化資料室素材・unit済み（ゲーム未組込み）: 6
- 既存完成・担当manifest対象外: 1
- 未着手: 89
- 失敗: 0

| ID                                   | 状態                               |
| ------------------------------------ | ---------------------------------- |
| `aomori-boss-tsugaru-no-nushi`       | 未着手                             |
| `aomori-buna-taiju`                  | 未着手                             |
| `aomori-bunakko`                     | 制作・登録・PC/横向きスマホE2E済み |
| `aomori-dogu-jin`                    | 未着手                             |
| `aomori-doguukun`                    | 制作・登録・PC/横向きスマホE2E済み |
| `aomori-hachiro-ryu`                 | 未着手                             |
| `aomori-hanaikada`                   | 未着手                             |
| `aomori-himemassu`                   | 制作・登録・PC/横向きスマホE2E済み |
| `aomori-himemasu-lord`               | 未着手                             |
| `aomori-itakodori`                   | 未着手                             |
| `aomori-kaza-mimizuku`               | 未着手                             |
| `aomori-kokeppi`                     | 制作・登録・PC/横向きスマホE2E済み |
| `aomori-kuro-magurodo`               | 未着手                             |
| `aomori-lastboss-tsugaru-tamenobu`   | 未着手                             |
| `aomori-magurodo`                    | 制作・登録・PC/横向きスマホE2E済み |
| `aomori-midboss-nebuta-taisho`       | 未着手                             |
| `aomori-nabe-shogun`                 | 未着手                             |
| `aomori-nebuta-musha`                | 未着手                             |
| `aomori-nebuta-taisho`               | 未着手                             |
| `aomori-nebutan`                     | 制作・登録・PC/横向きスマホE2E済み |
| `aomori-nuri-kagayaki`               | 未着手                             |
| `aomori-oirase-kokejin`              | 未着手                             |
| `aomori-oka-musha`                   | 未着手                             |
| `aomori-ringo-knight`                | 未着手                             |
| `aomori-ringoron`                    | 既存完成・担当manifest対象外       |
| `aomori-sakurapon`                   | 制作・登録・PC/横向きスマホE2E済み |
| `aomori-senbein`                     | 制作・登録・PC/横向きスマホE2E済み |
| `aomori-tsugaru-nurin`               | 制作・登録・PC/横向きスマホE2E済み |
| `aomori-umi-nyan`                    | 未着手                             |
| `aomori-umineko-taicho`              | 未着手                             |
| `iwate-boss-konjiki-no-tora`         | 未着手                             |
| `iwate-dragon-blue`                  | 未着手                             |
| `iwate-hayate-kamoshika`             | 未着手                             |
| `iwate-iwa-kamoshika`                | 未着手                             |
| `iwate-izumiko`                      | 制作・登録・PC/横向きスマホE2E済み |
| `iwate-kagurabi`                     | 制作・登録・PC/横向きスマホE2E済み |
| `iwate-kodamaru`                     | 制作・登録・PC/横向きスマホE2E済み |
| `iwate-lastboss-minamoto-yoshitsune` | 未着手                             |
| `iwate-midboss-tetsubin-game`        | 未着手                             |
| `iwate-okawari-bat`                  | 未着手                             |
| `iwate-oo-kappa`                     | 未着手                             |
| `iwate-ryusen-uo`                    | 未着手                             |
| `iwate-tono-kappa`                   | 未着手                             |
| `iwate-wakame-ryu`                   | 未着手                             |
| `iwate-wakamekko`                    | 未着手                             |
| `iwate-wankosobat`                   | 未着手                             |
| `tohoku-boss-rokufuyu`               | 未着手                             |
| `protagonist`                        | 人物素材・API済み（未組込み）      |
| `michiru`                            | 人物素材・API済み（未組込み）      |
| `shiori`                             | 人物素材・API済み（未組込み）      |
| `iwate-kagurabi-stage-2`             | 資料室素材済み（ゲーム未組込み）   |
| `iwate-kagurabi-stage-3`             | 資料室素材済み（ゲーム未組込み）   |
| `iwate-izumiko-stage-2`              | 資料室素材済み（ゲーム未組込み）   |
| `iwate-izumiko-stage-3`              | 資料室素材済み（ゲーム未組込み）   |
| `iwate-kodamaru-stage-2`             | 資料室素材済み（ゲーム未組込み）   |
| `iwate-kodamaru-stage-3`             | 資料室素材済み（ゲーム未組込み）   |
| `mie-donabee`                        | 未着手                             |
| `mie-lastboss-todo-takatora`         | 未着手                             |
| `miyagi-kokeshi-hime`                | 未着手                             |
| `miyagi-oohakucho`                   | 未着手                             |
| `miyagi-zundagon`                    | 未着手                             |
| `miyazaki-kanjuku-mango`             | 未着手                             |
| `miyazaki-misaki-tenba`              | 未着手                             |
| `nagano-lastboss-sanada-yukimura`    | 未着手                             |
| `nagano-wakasagin`                   | 未着手                             |
| `nagasaki-castel-knight`             | 未着手                             |
| `nagasaki-midboss-megane-golem`      | 未着手                             |
| `nara-boss-shika-daio`               | 未着手                             |
| `nara-matcha-arashi`                 | 未着手                             |
| `nara-uzumaki-somen`                 | 未着手                             |
| `niigata-inahon`                     | 未着手                             |
| `niigata-minori-maru`                | 未着手                             |
| `oita-kabosuppa`                     | 未着手                             |
| `oita-shiitaken`                     | 未着手                             |
| `okayama-bizentsubon`                | 未着手                             |
| `okayama-hakuto-hime`                | 未着手                             |
| `okinawa-garasu-kurage`              | 未着手                             |
| `okinawa-niji-kurage`                | 未着手                             |
| `osaka-boss-takoishi-daio`           | 未着手                             |
| `osaka-juwanasu-zamurai`             | 未着手                             |
| `osaka-takoyaki-sencho`              | 未着手                             |
| `saga-kinran-tsubo`                  | 未着手                             |
| `saga-yumon-douji`                   | 未着手                             |
| `saitama-haniwaltz`                  | 未着手                             |
| `saitama-parissen`                   | 未着手                             |
| `shiga-ibukikko`                     | 未着手                             |
| `shiga-nigoron`                      | 未着手                             |
| `shimane-lastboss-koizumi-yakumo`    | 未着手                             |
| `shimane-tenshu-chidori`             | 未着手                             |
| `shizuoka-chabashira`                | 未着手                             |
| `shizuoka-soradako`                  | 未着手                             |
| `tochigi-bellmoo`                    | 未着手                             |
| `tochigi-ichigo-ouji`                | 未着手                             |
| `tokushima-boss-awaodori-ou`         | 未着手                             |
| `tokushima-midboss-uzushion`         | 未着手                             |
| `tokushima-sudachibi`                | 未着手                             |
| `tokyo-lastboss-katsushika-hokusai`  | 未着手                             |
| `tottori-beniganin`                  | 未着手                             |
| `tottori-nashikoron`                 | 未着手                             |
| `tottori-sumiewashi`                 | 未着手                             |
| `toyama-mankai-churi`                | 未着手                             |
| `toyama-pikka-ika`                   | 未着手                             |
| `wakayama-koromikan`                 | 未着手                             |
| `wakayama-ootakimaru`                | 未着手                             |
| `yamagata-imoni-nabe`                | 未着手                             |
| `yamagata-sakuranboy`                | 未着手                             |
| `yamaguchi-hashiwatari`              | 未着手                             |
| `yamaguchi-nanabaken`                | 未着手                             |
| `yamanashi-atsuatsu-houtou`          | 未着手                             |
| `yamanashi-lastboss-takeda-shingen`  | 未着手                             |
| `yamanashi-tawawa-budou`             | 未着手                             |

## 統合提案

- 通常モンスターは既存の `src/rendering/monsterAnimation.ts` によりmanifestから自動集約されるため、共通コード変更は不要。
- 人物素材は `src/rendering/characterAnimation.ts` の専用APIから参照できる。親チャットが共通Sceneへ接続する。
- 主人公の固定素材は `customizable-reference` とし、自動適用しない。既存 `characters.ts` の外見カスタマイズと4方向歩行が正。
- 進化資料6件は `evolution-references.json` だけで管理し、未組込みとして維持する。

## 検証記録

- 関連unit: 4ファイル・10件成功。
- 専用E2E: 24件成功（960×540 / 640×360、12体）。
- 各E2Eで待機3フレーム超、通常攻撃、攻撃わざ、待機復帰、KO停止、透過、表示サイズ96px以下を確認。自己強化わざしか持たない個体はE2E内で攻撃わざへフォールバックする。
- 進化資料6件は512×256 RGBAとランタイムmanifest非登録をunitで確認。
- `pnpm nrd -- --port 4177 --host 127.0.0.1` の最新ビルドをアプリ内ブラウザで目視。
- PC/横向きスマホ画像は `docs/verification/animation-batch-01/` に保存。
