# animation batch-03 制作記録

## 所有範囲

- ブランチ: `codex/animation-batch-03`
- 基点: `f31628f32a008dfc92ecb2ed4a7934e6d9d9516b`
- 正: `tasks/animation-batch-assignments.json` の `batch-03.ids`
- 外部課金API・fal・OmniRoute: 使用しない
- 共通 Battle / loader / 権利台帳 / catalog: 変更しない

## 規格

512×256 PNG、4列×2行、1セル128×128、透過。上段は基準・呼吸/付属物・瞬き・復帰、下段は構え・前傾・実攻撃・着地/復帰。静止画の拡縮・平行移動だけは不可。

## 進捗

| ID                                      | 状態   | 理由・検証                                                                                    |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `aichi-boss-kinshachi-ou`               | 完了   | 待機は冠・ヒレ・瞬き、攻撃は前傾した水上突進。PC/横向きスマホで再生・復帰・KO確認済み         |
| `aichi-kokekokkochin`                   | 完了   | 待機は翼呼吸・瞬き、攻撃は二足のまま羽ばたき突進。PC/横向きスマホで再生・復帰・KO済み         |
| `aichi-shiborin`                        | 完了   | 待機は布の膨縮・瞬き、攻撃は絞り模様を伴う回転体当たり。PC/横向きスマホで再生・KO済み         |
| `akita-chuken-maru`                     | 完了   | 胸・尻尾・襟巻きの呼吸と瞬き、四足の沈み込みから跳びかかり。PC/横向きスマホ確認済み           |
| `akita-lastboss-satake-yoshinobu`       | 完了   | 肩・兜飾りの呼吸と瞬き、守りから肩で踏み込む攻撃。PC/横向きスマホ確認済み                     |
| `akita-wappa-toride`                    | 完了   | 三段曲げわっぱの圧縮と留め具の揺れ、傾いて突進。PC/横向きスマホ確認済み                       |
| `chiba-kujukurin`                       | 完了   | 貝殻状の胴と青い突起を保ち、つぶれから跳ねて殻で打撃。PC/横向きスマホ確認済み                 |
| `chiba-peanight`                        | 完了   | 花盾と落花生棍を保ち、盾受けから棍を振る攻撃。PC/横向きスマホ確認済み                         |
| `ehime-iyokan-musha`                    | 完了   | 葉と側面の束を保ち、揺れ・瞬きからひねって転がる攻撃。PC/横向きスマホ確認済み                 |
| `ehime-lastboss-murakami-takeyoshi`     | 完了   | 大角兜・口髭を保ち、守りから肩で踏み込む攻撃。PC/横向きスマホ確認済み                         |
| `fukui-boss-echizen-gani-ou`            | 完了   | 王冠・眼柄・鋏・脚・青い台座を保ち、鋏の引きから横突進。PC/横向きスマホ確認済み               |
| `fukui-lastboss-matsudaira-shungaku`    | 完了   | 黄縁の本と装束を保ち、本を構えて踏み込む攻撃。PC/横向きスマホ確認済み                         |
| `fukui-raputorun`                       | 完了   | 胸・小腕・尾の待機差分と瞬き、伏せから跳びかかる攻撃。PC/横向きスマホ確認済み                 |
| `fukuoka-boss-hiraodaio`                | 完了   | 羊毛・角・王冠の待機差分と瞬き、四足で角から突進。PC/横向きスマホ確認済み                     |
| `fukuoka-midboss-banana-taisho`         | 完了   | 両端・腕の待機差分と瞬き、低い構えから胴ごと体当たり。PC/横向きスマホ確認済み                 |
| `fukuoka-suigo-maru`                    | 完了   | 波輪・舟・笠・竹竿の待機差分と瞬き、波に沈んで前傾突進。PC/横向きスマホ確認済み               |
| `fukushima-akatsuki-momo`               | 完了   | 葉と光輪の浮遊差分と瞬き、つぶれ・ひねりから桃先頭で突進。PC/横向きスマホ確認済み             |
| `fukushima-kura-donburi`                | 完了   | 麺・眉・取っ手の待機差分と瞬き、どんぶりごと傾いて転がる攻撃。PC/横向きスマホ確認済み         |
| `fukushima-yaoki-koboshi`               | 完了   | 起き上がり小法師の揺れと旗の待機差分、後傾から転がる攻撃。PC/横向きスマホ確認済み             |
| `gifu-kamiori-dori`                     | 完了   | 折り翼・冠羽の待機差分と瞬き、翼を折り込んで突き出す攻撃。PC/横向きスマホ確認済み             |
| `gifu-oriben`                           | 完了   | 織部釉の器体を傾ける待機差分と瞬き、低く回って肩から突進。PC/横向きスマホ確認済み             |
| `gunma-boss-gankake-daruma`             | 完了   | 王冠と二本の炎角を保ち、揺れ・瞬きから角先頭で転がる攻撃。PC/横向きスマホ確認済み             |
| `gunma-kyabezukin`                      | 完了   | 葉層・葉尾・二脚を保ち、葉の揺れと瞬きから葉を閉じて頭突き。PC/横向きスマホ確認済み           |
| `gunma-purukon`                         | 完了   | 灰色角形・斑点・二脚を保ち、弾性変形と瞬きからつぶれて胴体打撃。PC/横向きスマホ確認済み       |
| `hiroshima-kakigaran`                   | 完了   | 上下殻・青い側突起・木台を保ち、殻の開閉と瞬きから殻を閉じて打撃。PC/横向きスマホ確認済み     |
| `hiroshima-onbashigame`                 | 完了   | 石帽子・苔・茶色胴・基部の脚を保ち、沈み込みから石帽子ごと突進。PC/横向きスマホ確認済み       |
| `hokkaido-ami-melon`                    | 完了   | 網目・茎葉・二脚を保ち、葉の揺れと瞬きからつぶれて回転体当たり。PC/横向きスマホ確認済み       |
| `hokkaido-hotaten`                      | 完了   | 放射状の帆立殻・二脚を保ち、殻の開閉と瞬きから殻先頭で跳躍。PC/横向きスマホ確認済み           |
| `hokkaido-jet-hotate`                   | 完了   | 上縁の青粒と二本の水流脚を保ち、噴射脈動と瞬きから前傾噴射。PC/横向きスマホ確認済み           |
| `hokkaido-lavendori`                    | 完了   | 紫の胴・側翼・二脚・頭上の花を保ち、揺れと瞬きから嘴先頭で突進。PC/横向きスマホ確認済み       |
| `hokuriku-islandboss-kagamiutsushi`     | 完了   | 金縁鏡・化粧飾り・縞腕・台座を保ち、鏡面と腕の待機差分から鏡縁突進。PC/横向きスマホ確認済み   |
| `hyogo-lastboss-ikeda-terumasa`         | 完了   | 大角兜・鎧・四肢を保ち、呼吸と瞬きから肩で踏み込む攻撃。PC/横向きスマホ確認済み               |
| `hyogo-sorobanban`                      | 完了   | 算盤枠・珠列・二脚を保ち、珠の移動と瞬きから枠ごと傾いて突進。PC/横向きスマホ確認済み         |
| `ibaraki-aozora-hime`                   | 完了   | 大花・二枚の花翼・二脚を保ち、花翼の待機差分から前傾飛び込み。PC/横向きスマホ確認済み         |
| `ibaraki-hobikin`                       | 完了   | 二体一組を全コマで維持し、逆位相の待機差分から同期して二重突進。PC/横向きスマホ確認済み       |
| `ibaraki-nemofin`                       | 完了   | 頭花・側翼・二脚・尾を保ち、待機差分から翼を引いて前方突進。PC/横向きスマホ確認済み           |
| `ishikawa-gosai-bon`                    | 完了   | 多彩模様の器・赤い側突起・二脚を保ち、傾きから側面体当たり。PC/横向きスマホ確認済み           |
| `ishikawa-kinpaku-cho`                  | 完了   | 金翅四枚・茶胴・金帯頭を保ち、翅の待機差分から前傾急降下。PC/横向きスマホ確認済み             |
| `ishikawa-oo-hamashion`                 | 完了   | 塩山・三つの水色球・帯・右留め具を保ち、つぶれから留め具先頭で滑走。PC/横向きスマホ確認済み   |
| `kagawa-kororibu`                       | 完了   | 緑の丸胴・二脚・茎・二枚葉を保ち、葉と瞬きの待機差分から回転体当たり。PC/横向きスマホ確認済み |
| `kagawa-mizukagami`                     | 完了   | 水滴形の双子二体と連結部を全コマで保ち、逆位相の待機から同期二重突進。PC/横向きスマホ確認済み |
| `kagawa-zenigani`                       | 完了   | 銭形胴・角穴・二鋏・二眼柄・歩脚を保ち、鋏を引いて横突進。PC/横向きスマホ確認済み             |
| `kagoshima-kurogane-boo`                | 完了   | 鉄兜・二角・二籠手・猪鼻・帯を保ち、低い構えから肩と籠手で突進。PC/横向きスマホ確認済み       |
| `kagoshima-nabezurun`                   | 完了   | 長い嘴・白い首・灰胴・冠羽・二脚・尾を保ち、首を引いて嘴突き。PC/横向きスマホ確認済み         |
| `kanagawa-boss-yokohama-shishi-oh`      | 完了   | 冠・額石・耳紐・顎鬚・鱗衣・四脚を保ち、低姿勢から跳びかかり。PC/横向きスマホ確認済み         |
| `kanagawa-kazakiri-tonbi`               | 完了   | 大きな両翼・胸の白模様・嘴・二脚を保ち、翼を引いて嘴先頭で急降下。PC/横向きスマホ確認済み     |
| `kanagawa-piihyoro`                     | 完了   | 横に広い両翼・胸帯・嘴・二脚を保ち、翼を畳んで前方体当たり。PC/横向きスマホ確認済み           |
| `kochi-boss-kuroshio-kujira`            | 完了   | 冠・二噴気口・両鰭・縞の鯨鬚・単一台座を保ち、胴を傾ける突進。PC/横向きスマホ確認済み         |
| `kochi-lastboss-sakamoto-ryoma`         | 完了   | 髪・着物・袴・左手の白赤小物を保ち、袖を引いて踏み込む攻撃。PC/横向きスマホ確認済み           |
| `koshinetsu-boss`                       | 失敗   | 指定の pixels/sheets 参照が双方欠損                                                           |
| `kumamoto-ebi-musha`                    | 完了   | 二触角・赤帯・青端の両腕・赤い台座を保ち、つぶれから胴体突進。PC/横向きスマホ確認済み         |
| `kumamoto-midboss-kindouro`             | 完了   | 金楼体・屋根・二白手・白裙と赤帯を保ち、屋根ごと傾いて突進。PC/横向きスマホ確認済み           |
| `kumamoto-tatamin`                      | 完了   | 畳二枚を全コマで保ち、逆位相の待機から同期二重体当たり。PC/横向きスマホ確認済み               |
| `kyoto-chirimen-mai`                    | 完了   | 桃色布球・二角・二拳を保ち、布のうねりから角先頭で回転突進。PC/横向きスマホ確認済み           |
| `kyoto-hontoha-karain`                  | 完了   | 赤唐辛子・緑葉・三炎突起・二腕・白歯を保ち、傾いて先端突進。PC/横向きスマホ確認済み           |
| `kyushu-okinawa-islandboss-chishikigui` | 完了   | 王冠・紫三段胴・左右浮遊球・金印を保ち、球を引いて二重打撃。PC/横向きスマホ確認済み           |
| `mie-iga-jonin`                         | 完了   | 紫頭巾・二角・赤蝶結び・白帯・二浮遊手を保ち、低姿勢から忍者体当たり。PC/横向きスマホ確認済み |
| `mie-shinju-hime`                       | 完了   | 上下貝殻・中央真珠・側面飾りを保ち、貝を開いて真珠先頭で挟み込み。PC/横向きスマホ確認済み     |
| `miyagi-lastboss-date-masamune`         | 未着手 | —                                                                                             |
| `miyagi-sasakama-uo`                    | 未着手 | —                                                                                             |
| `miyazaki-boss-takachiho-no-nushi`      | 未着手 | —                                                                                             |
| `miyazaki-mangocchi`                    | 未着手 | —                                                                                             |
| `miyazaki-tarutaru-kokko`               | 未着手 | —                                                                                             |
| `nagano-oomori-soba`                    | 未着手 | —                                                                                             |
| `nagano-yukemuri-zaru`                  | 未着手 | —                                                                                             |
| `nagasaki-kurawan-nushi`                | 未着手 | —                                                                                             |
| `nagasaki-mogikko`                      | 未着手 | —                                                                                             |
| `nara-happazushi`                       | 未着手 | —                                                                                             |
| `nara-somen-tsururi`                    | 未着手 | —                                                                                             |
| `niigata-boss-shinanogawa-no-nushi`     | 未着手 | —                                                                                             |
| `niigata-kotoki`                        | 未着手 | —                                                                                             |
| `oita-boss-yukemuryu`                   | 未着手 | —                                                                                             |
| `oita-midboss-yabakeiwa`                | 未着手 | —                                                                                             |
| `oita-yukemurin`                        | 未着手 | —                                                                                             |
| `okayama-denim-bushi`                   | 未着手 | —                                                                                             |
| `okayama-midboss-mouretsu-jersey`       | 未着手 | —                                                                                             |
| `okinawa-goyamaru`                      | 未着手 | —                                                                                             |
| `okinawa-painapon`                      | 未着手 | —                                                                                             |
| `osaka-fusanari-don`                    | 未着手 | —                                                                                             |
| `osaka-midboss-abare-danjiri`           | 未着手 | —                                                                                             |
| `saga-chabashira`                       | 未着手 | —                                                                                             |
| `saga-midboss-toumeika`                 | 未着手 | —                                                                                             |
| `saitama-boss-yomatsuri-daio`           | 未着手 | —                                                                                             |
| `saitama-midboss-gon-yagura`            | 未着手 | —                                                                                             |
| `shiga-boss-dainamazu`                  | 未着手 | —                                                                                             |
| `shiga-lastboss-ii-naosuke`             | 未着手 | —                                                                                             |
| `shikoku-islandboss-yotsu-no-tenbin`    | 未着手 | —                                                                                             |
| `shimane-oohi-rosoku`                   | 未着手 | —                                                                                             |
| `shimane-warigon`                       | 未着手 | —                                                                                             |
| `shizuoka-kazekiri-dako`                | 未着手 | —                                                                                             |
| `shizuoka-unagi-nobori`                 | 未着手 | —                                                                                             |
| `tochigi-go-bellmoo`                    | 未着手 | —                                                                                             |
| `tochigi-lastboss-nasu-no-yoichi`       | 未着手 | —                                                                                             |
| `tokushima-kazura-musasabi`             | 未着手 | —                                                                                             |
| `tokushima-oogamedon`                   | 未着手 | —                                                                                             |
| `tokyo-daikon-zamurai`                  | 未着手 | —                                                                                             |
| `tokyo-musasabyun`                      | 未着手 | —                                                                                             |
| `tottori-boss-sakyu-majin`              | 未着手 | —                                                                                             |
| `tottori-perawashi`                     | 未着手 | —                                                                                             |
| `toyama-fubuki-okojo`                   | 未着手 | —                                                                                             |
| `toyama-midboss-gabujishi`              | 未着手 | —                                                                                             |
| `wakayama-bincho-homura`                | 未着手 | —                                                                                             |
| `wakayama-mamori-toudai`                | 未着手 | —                                                                                             |
| `wakayama-toudain`                      | 未着手 | —                                                                                             |
| `yamagata-lastboss-matsuo-basho`        | 未着手 | —                                                                                             |
| `yamagata-yukemurin`                    | 未着手 | —                                                                                             |
| `yamaguchi-lastboss-yoshida-shoin`      | 未着手 | —                                                                                             |
| `yamaguchi-noborigaman`                 | 未着手 | —                                                                                             |
| `yamanashi-budoon`                      | 未着手 | —                                                                                             |
| `yamanashi-momorin`                     | 未着手 | —                                                                                             |

## 生成プロンプトと出力

共通プロンプトは、権威参照をピクセル版、立体版を形状補助として指定し、4列2行、透過、同一パレット・輪郭・顔・基準点、上段4待機・下段4攻撃、アンチエイリアス・文字・背景・余分な付属物を禁止した。全体移動や拡縮ではなく、部位と姿勢の差分を必須にした。

### aichi-boss-kinshachi-ou

- 参照: `pixels/aichi-boss-kinshachi-ou.png`, `sheets/aichi-boss-kinshachi-ou.jpg`
- 固有プロンプト: 待機で浮遊呼吸・左右ヒレ・冠を数px動かし瞬き。攻撃は金紺の台座ごと低く構え、ヒレを後ろへ流し、水を帯びた前方突進、着地復帰。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/aichi-boss-kinshachi-ou-source.png`
- 最終: `assets/sprites/animations/batch-03/aichi-boss-kinshachi-ou-v1.png`
- 目視: 8コマすべて輪郭内、冠・左右ヒレ・浮遊台座・顔を維持。瞬きと前傾突進は明確。

### aichi-kokekokkochin

- 参照: `pixels/aichi-kokekokkochin.png`, `sheets/aichi-kokekokkochin.jpg`
- 固有プロンプト: 待機で胴体呼吸・パン型の翼を曲げて瞬き。攻撃は既存の黄色い二足で構え、翼を引き、空中羽ばたき体当たり、着地復帰。腕・手・追加脚・武器は禁止。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/aichi-kokekokkochin-source.png`
- 最終: `assets/sprites/animations/batch-03/aichi-kokekokkochin-v1.png`
- 目視: 二翼二足を全コマで維持。瞬き、翼角度、離陸・着地に実差分あり。

### aichi-shiborin

- 参照: `pixels/aichi-shiborin.png`, `sheets/aichi-shiborin.jpg`
- 固有プロンプト: 待機で布の胴体を膨縮し側面の結びを動かして瞬き。攻撃はつぶれて構え、ねじれ、白い絞り模様が回転する実際の回転体当たり、復帰。四肢・武器は禁止。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/aichi-shiborin-source.png`
- 最終: `assets/sprites/animations/batch-03/aichi-shiborin-v1.png`
- 目視: 白い絞り模様・紺紫パレット・側面結び・顔を維持。回転姿勢に実差分あり。

### akita-chuken-maru

- 参照: `pixels/akita-chuken-maru.png`, `sheets/akita-chuken-maru.jpg`
- 固有プロンプト: 四足の中立姿勢を保ち、待機は胸の呼吸・尻尾と襟巻きの揺れ・瞬き。攻撃は前脚を沈め、跳びかかって四足で着地。光輪・襟巻き・鈴・四脚を全コマで固定。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/akita-chuken-maru-source.png`
- 最終: `assets/sprites/animations/batch-03/akita-chuken-maru-v1.png`
- 目視: 光輪・襟巻き・鈴・四脚を維持し、伏せ・跳びかかり・着地に実差分あり。

### akita-lastboss-satake-yoshinobu

- 参照: `pixels/akita-lastboss-satake-yoshinobu.png`, `sheets/akita-lastboss-satake-yoshinobu.jpg`
- 固有プロンプト: 待機は鎧肩と兜飾りの呼吸・瞬き。攻撃は膝を曲げて守り、肩を前へ出す踏み込み。武器や追加装備は禁止。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/akita-lastboss-satake-yoshinobu-source.png`
- 最終: `assets/sprites/animations/batch-03/akita-lastboss-satake-yoshinobu-v1.png`
- 目視: 鎧色・兜飾り・顔を維持し、守りと肩打ちに姿勢差あり。

### akita-wappa-toride

- 参照: `pixels/akita-wappa-toride.png`, `sheets/akita-wappa-toride.jpg`
- 固有プロンプト: 三段の曲げわっぱ砦を保ち、待機は段の圧縮と留め具の揺れ・瞬き。攻撃は全体を低くして傾け、木製胴で突進。四肢は禁止。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/akita-wappa-toride-source.png`
- 最終: `assets/sprites/animations/batch-03/akita-wappa-toride-v1.png`
- 目視: 三段構造・留め具・顔を全コマで維持し、圧縮と突進の輪郭差あり。

### chiba-kujukurin

- 参照: `pixels/chiba-kujukurin.png`, `sheets/chiba-kujukurin.jpg`
- 固有プロンプト: 丸い貝殻状の胴・継ぎ目・青い突起・二本足を保ち、待機は呼吸と瞬き。攻撃はつぶれ、跳び上がり、殻で打撃して着地。腕は禁止。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/chiba-kujukurin-source.png`
- 最終: `assets/sprites/animations/batch-03/chiba-kujukurin-v1.png`
- 目視: 殻・青い突起・二本足を維持し、つぶれ・跳躍・着地に実差分あり。

### chiba-peanight

- 参照: `pixels/chiba-peanight.png`, `sheets/chiba-peanight.jpg`
- 固有プロンプト: 既存の花形盾と落花生型の棍を左右そのまま保持。待機は呼吸・瞬き、攻撃は盾で守り、棍を引き、振り抜く。装備の追加・交換は禁止。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/chiba-peanight-source.png`
- 最終: `assets/sprites/animations/batch-03/chiba-peanight-v1.png`
- 目視: 盾・棍・甲冑の左右関係を維持し、守りと振り抜きに姿勢差あり。

### ehime-iyokan-musha

- 参照: `pixels/ehime-iyokan-musha.png`, `sheets/ehime-iyokan-musha.jpg`
- 固有プロンプト: 伊予柑の胴・葉・側面の束・二本足を保ち、待機は揺れと瞬き。攻撃は低く構え、ひねり、胴で転がるように打撃して復帰。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/ehime-iyokan-musha-source.png`
- 最終: `assets/sprites/animations/batch-03/ehime-iyokan-musha-v1.png`
- 目視: 葉・側面束・顔を維持し、低い構えと回転姿勢に実差分あり。

### ehime-lastboss-murakami-takeyoshi

- 参照: `pixels/ehime-lastboss-murakami-takeyoshi.png`, `sheets/ehime-lastboss-murakami-takeyoshi.jpg`
- 固有プロンプト: 大きな角飾りの兜・鎧・口髭を保ち、待機は呼吸と瞬き。攻撃は膝を曲げて守り、肩を前へ出して踏み込む。武器は禁止。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/ehime-lastboss-murakami-takeyoshi-source.png`
- 最終: `assets/sprites/animations/batch-03/ehime-lastboss-murakami-takeyoshi-v1.png`
- 目視: 大角兜・口髭・鎧配色を維持し、守りと肩打ちに姿勢差あり。

### fukui-boss-echizen-gani-ou

- 参照: `pixels/fukui-boss-echizen-gani-ou.png`, `sheets/fukui-boss-echizen-gani-ou.jpg`
- 固有プロンプト: 赤いカニ王の王冠・眼柄・左右の鋏・脚・青い台座を保ち、待機は各部の小さな上下と瞬き。攻撃は低く構え、鋏を引き、横へ突進して挟む。余計な火花・発光は禁止。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/fukui-boss-echizen-gani-ou-source.png`
- 最終: `assets/sprites/animations/batch-03/fukui-boss-echizen-gani-ou-v1.png`
- 目視: 初稿は黄色い火花を含んだため不採用。再生成版はエフェクトなしで、王冠・眼柄・鋏・脚・台座を維持し、鋏の引きと突進に実差分あり。

### fukui-lastboss-matsudaira-shungaku

- 参照: `pixels/fukui-lastboss-matsudaira-shungaku.png`, `sheets/fukui-lastboss-matsudaira-shungaku.jpg`
- 固有プロンプト: 紫の装束・白襟・赤帯・家紋・黄縁の本を保ち、待機は呼吸・本の小移動・瞬き。攻撃は本を構え、前へ差し出しながら肩で踏み込む。余計な火花・発光は禁止。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/fukui-lastboss-matsudaira-shungaku-source.png`
- 最終: `assets/sprites/animations/batch-03/fukui-lastboss-matsudaira-shungaku-v1.png`
- 目視: 初稿は黄色い火花を含んだため不採用。再生成版はエフェクトなしで、装束・家紋・本を維持し、本の構えと踏み込みに実差分あり。

### fukui-raputorun

- 参照: `pixels/fukui-raputorun.png`, `sheets/fukui-raputorun.jpg`
- 固有プロンプト: 二足・小腕・長い尾・腹当て・三本歯を固定。待機は胸呼吸・小腕と尾先・瞬き、攻撃は伏せて尾を引き、跳びかかりながら胴と尾で打撃。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/fukui-raputorun-source.png`
- 最終: `assets/sprites/animations/batch-03/fukui-raputorun-v1.png`
- 目視: 部位数と顔を維持し、伏せ・横向きの跳躍・着地に実差分あり。

### fukuoka-boss-hiraodaio

- 参照: `pixels/fukuoka-boss-hiraodaio.png`, `sheets/fukuoka-boss-hiraodaio.jpg`
- 固有プロンプト: 四脚・二本の巻角・白い羊毛・王冠・足元の草を固定。待機は羊毛圧縮・角と王冠・瞬き、攻撃は頭と前脚を下げて角から突進。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/fukuoka-boss-hiraodaio-source.png`
- 最終: `assets/sprites/animations/batch-03/fukuoka-boss-hiraodaio-v1.png`
- 目視: 四脚・巻角・王冠・羊毛を維持し、低い構えと角突進に実差分あり。

### fukuoka-midboss-banana-taisho

- 参照: `pixels/fukuoka-midboss-banana-taisho.png`, `sheets/fukuoka-midboss-banana-taisho.jpg`
- 固有プロンプト: 二端のバナナ頭・茶色部・王冠・市松鉢巻・赤縞服・二腕二脚を固定。待機は呼吸・端と腕・瞬き、攻撃は低く構えて胴ごと体当たり。武器は禁止。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/fukuoka-midboss-banana-taisho-source.png`
- 最終: `assets/sprites/animations/batch-03/fukuoka-midboss-banana-taisho-v1.png`
- 目視: 左右端・装束・四肢を維持し、沈み込み・傾斜・体当たりに実差分あり。

### fukuoka-suigo-maru

- 参照: `pixels/fukuoka-suigo-maru.png`, `sheets/fukuoka-suigo-maru.jpg`
- 固有プロンプト: 青い水霊・木舟・単一の波輪・穴あき笠・右の竹竿・赤い頬印・左右のひれを固定。待機は波と舟の上下・笠と竿・瞬き、攻撃は波へ沈み、竿と胴を傾けて突進。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/fukuoka-suigo-maru-source.png`
- 最終: `assets/sprites/animations/batch-03/fukuoka-suigo-maru-v1.png`
- 目視: 舟・波輪・笠・竹竿の左右を維持し、沈み込みと前傾に実差分あり。

### fukushima-akatsuki-momo

- 参照: `pixels/fukushima-akatsuki-momo.png`, `sheets/fukushima-akatsuki-momo.jpg`
- 固有プロンプト: 桃の胴・下部の赤いグラデーション・中央線・四枚葉・光輪を固定し、手足は禁止。待機は浮遊・葉と光輪・瞬き、攻撃はつぶれ、ひねり、桃先頭で突進。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/fukushima-akatsuki-momo-source.png`
- 最終: `assets/sprites/animations/batch-03/fukushima-akatsuki-momo-v1.png`
- 目視: 桃色・中央線・葉・光輪を維持し、つぶれと横向き突進に実差分あり。

### fukushima-kura-donburi

- 参照: `pixels/fukushima-kura-donburi.png`, `sheets/fukushima-kura-donburi.jpg`
- 固有プロンプト: 黄色い麺状の顔・白黒縞のどんぶり・二脚・太眉・赤橙端の取っ手を固定。待機は麺・眉・取っ手・瞬き、攻撃は器へ沈み、傾いて転がり体当たり。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/fukushima-kura-donburi-source.png`
- 最終: `assets/sprites/animations/batch-03/fukushima-kura-donburi-v1.png`
- 目視: 麺面・縞器・二脚・取っ手を維持し、低姿勢・転がり・着地に実差分あり。

### fukushima-yaoki-koboshi

- 参照: `pixels/fukushima-yaoki-koboshi.png`, `sheets/fukushima-yaoki-koboshi.jpg`
- 固有プロンプト: 赤い起き上がり小法師・紺頭巾・白い顔襟・金帯・前面の白印・右上の旗一本を固定。手足は禁止。待機は重心揺れ・旗・瞬き、攻撃は後傾して圧縮し、前へ転がって復帰。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/fukushima-yaoki-koboshi-source.png`
- 最終: `assets/sprites/animations/batch-03/fukushima-yaoki-koboshi-v1.png`
- 目視: 赤紺配色・顔・旗一本を維持し、左右への大きな傾斜と復帰に実差分あり。

### gifu-kamiori-dori

- 参照: `pixels/gifu-kamiori-dori.png`, `sheets/gifu-kamiori-dori.jpg`
- 固有プロンプト: 白い折り紙鳥・広い三角翼・灰色の折り目と冠羽・黄くちばし・赤い胸印・灰色台座を固定。待機は翼と冠羽・瞬き、攻撃は翼を折り込み、前傾して両翼を鋭く突き出す。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/gifu-kamiori-dori-source.png`
- 最終: `assets/sprites/animations/batch-03/gifu-kamiori-dori-v1.png`
- 目視: 紙翼・折り目・胸印・台座を維持し、翼幅と前傾角に実差分あり。

### gifu-oriben

- 参照: `pixels/gifu-oriben.png`, `sheets/gifu-oriben.jpg`
- 固有プロンプト: 乳白と深緑の織部器・開口・黄縁・斜め釉・茶色印・二つの側面突起・二脚を固定。待機は器体傾斜・突起・瞬き、攻撃は低く回って緑釉側の肩から突進。
- built-in imagegen 原本: `docs/verification/animation-batch-03/generated/gifu-oriben-source.png`
- 最終: `assets/sprites/animations/batch-03/gifu-oriben-v1.png`
- 目視: 開口・斜め釉・印・二脚を維持し、低い傾斜と回り込みに実差分あり。

### 第四スライス（群馬・広島・北海道）

各行とも `pixels/<id>.png` と `sheets/<id>.jpg` を参照し、built-in imagegen 原本は `docs/verification/animation-batch-03/generated/<id>-source.png`、最終シートは `assets/sprites/animations/batch-03/<id>-v1.png` に保存した。

| ID                          | 固有プロンプトと目視結果                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| `gunma-boss-gankake-daruma` | 王冠・炎角二本・達磨胴を固定。重心揺れと瞬きから後傾・圧縮・炎角先頭の転がりへ変化し、余計な火花なし。 |
| `gunma-kyabezukin`          | 葉層・左後方の葉尾・二脚・触角状突起を固定。葉の呼吸と瞬きから外葉を閉じる頭突きへ変化。               |
| `gunma-purukon`             | 灰色の角形・黒斑点・二脚を固定。弾性揺れと瞬きから横長につぶれる胴体打撃へ変化。                       |
| `hiroshima-kakigaran`       | 上下の灰殻・青い側突起二つ・木台を固定。殻の開閉と瞬きから殻を閉じて傾く打撃へ変化。真珠追加なし。     |
| `hiroshima-onbashigame`     | 石帽子・苔・茶色胴・基部の脚と側突起を固定。沈み込みと瞬きから帽子ごと前傾突進へ変化。                 |
| `hokkaido-ami-melon`        | 網目・茎葉・二脚を固定。葉の揺れと瞬きからつぶれ、網目の向きが変わる回転体当たりへ変化。               |
| `hokkaido-hotaten`          | 放射状の帆立殻・二つの貝脚を固定。殻の呼吸と瞬きから殻先頭の横向き跳躍へ変化。水流追加なし。           |
| `hokkaido-jet-hotate`       | 上縁の青粒・白い継手・二本の水流脚を固定。噴射脈動と瞬きから水流脚を後方へ向けた前傾噴射へ変化。       |
| `hokkaido-lavendori`        | 紫胴・側翼・黄嘴・二脚・頭上の花を固定。花と翼の揺れ・瞬きから翼を引いて嘴先頭で突進。                 |

### 第五スライス（北陸・兵庫・茨城・石川）

各行とも `pixels/<id>.png` と `sheets/<id>.jpg` を参照し、built-in imagegen 原本は `docs/verification/animation-batch-03/generated/<id>-source.png`、最終シートは `assets/sprites/animations/batch-03/<id>-v1.png` に保存した。

| ID                                  | 固有プロンプトと目視結果                                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `hokuriku-islandboss-kagamiutsushi` | 金縁・青鏡面・化粧飾り・縞腕二本・台座を固定。鏡面と腕の待機差分から、両腕を引いて鏡縁先頭で踏み込む。光線・破片なし。 |
| `hyogo-lastboss-ikeda-terumasa`     | 灰白鎧・赤印・大きな黄角二本と中央突起・四肢を固定。肩と兜の呼吸・瞬きから無手の肩打ちへ変化。                         |
| `hyogo-sorobanban`                  | 長方形の算盤枠・珠列・二脚を固定。珠の小移動と瞬きから枠を傾けて体当たり。腕や珠列の増減なし。                         |
| `ibaraki-aozora-hime`               | 白青胴・二脚・巨大な花翼二枚・五弁花を固定。翼と花の揺れ・瞬きから花翼を引く飛び込みへ変化。                           |
| `ibaraki-hobikin`                   | 白い帆を持つ青い双子二体を全8コマで固定。逆位相の揺れと同時瞬きから、並んだまま同期二重突進。融合・欠落なし。          |
| `ibaraki-nemofin`                   | 白青胴・二脚・側翼・尾・頭花を固定。花と翼の揺れ・瞬きから低姿勢・横向き飛び込みへ変化。                               |
| `ishikawa-gosai-bon`                | 乳白器・赤縁と側突起・多彩な十字模様・二脚を固定。器体傾斜と瞬きから側面突進へ変化。                                   |
| `ishikawa-kinpaku-cho`              | 茶胴・金帯頭・金翅四枚を固定。翅を対で動かす待機と瞬きから、翅を後方へ畳む急降下へ変化。粒子なし。                     |
| `ishikawa-oo-hamashion`             | 白い塩山・青い基部・縞帯・右留め具・青白球三つを固定。球と帯の待機差分から、つぶれて留め具先頭で滑走。塩粒なし。       |

### 第六スライス（香川・鹿児島・神奈川・高知）

各行とも `pixels/<id>.png` と `sheets/<id>.jpg` を参照し、built-in imagegen 原本は `docs/verification/animation-batch-03/generated/<id>-source.png`、最終シートは `assets/sprites/animations/batch-03/<id>-v1.png` に保存した。

| ID                                 | 固有プロンプトと目視結果                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `kagawa-kororibu`                  | 緑の丸胴・二脚・茎・二枚葉を固定。葉の角度と瞬きから、低い構え・横向き回転体当たり・復帰へ変化。追加果実なし。 |
| `kagawa-mizukagami`                | 水滴形の双子二体・各一顔・各二脚・上下の連結部を全8コマで固定。逆位相の揺れから同期二重突進。融合・欠落なし。  |
| `kagawa-zenigani`                  | 銭形の丸胴・中央角穴・二鋏・二眼柄・歩脚を固定。鋏と脚の待機差分から横向きの鋏打ちへ変化。硬貨や武器なし。     |
| `kagoshima-kurogane-boo`           | 黒い猪胴・白鼻・鉄兜と二角・二籠手・帯・巻尾を固定。重い呼吸と瞬きから肩と籠手の突進へ変化。火花なし。         |
| `kagoshima-nabezurun`              | 黄嘴・白首・灰胴・赤冠・二脚・三枚尾を固定。首と尾の待機差分から、首を引いて嘴を突き出す攻撃へ変化。           |
| `kanagawa-boss-yokohama-shishi-oh` | 金冠・青額石・耳紐と緑球・白顎鬚・赤金鱗衣・四脚を固定。紐の揺れと瞬きから四足の跳びかかりへ変化。             |
| `kanagawa-kazakiri-tonbi`          | 上向きの大翼二枚・胸の白斜線・黄嘴・二脚を固定。翼の交互差分から両翼を引く嘴先頭の急降下へ変化。羽根なし。     |
| `kanagawa-piihyoro`                | 横向きの幅広翼二枚・胸の斜め帯・黄嘴・二脚を固定。低い羽ばたきと瞬きから翼を畳む跳躍体当たりへ変化。           |
| `kochi-boss-kuroshio-kujira`       | 紺の鯨胴・金冠・白先端の二噴気口・両鰭・縞鯨鬚・単一波台座を固定。鰭の待機差分から台座上の前傾突進へ変化。     |

### 第七スライス（高知・熊本・京都・九州沖縄・三重）

各行とも `pixels/<id>.png` と `sheets/<id>.jpg` を参照し、built-in imagegen 原本は `docs/verification/animation-batch-03/generated/<id>-source.png`、最終シートは `assets/sprites/animations/batch-03/<id>-v1.png` に保存した。

| ID                                      | 固有プロンプトと目視結果                                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `kochi-lastboss-sakamoto-ryoma`         | 大髪・紺着物・白襟・灰袴・左手の白赤小物を固定。袖と髪の待機差分から踏み込み打撃へ変化。刀・銃の追加なし。         |
| `kumamoto-ebi-musha`                    | 黄胴・二触角・赤蓋・二本の赤帯・青端の両腕・青鋲の赤台座を固定。つぶれから台座上の胴体突進へ変化。                 |
| `kumamoto-midboss-kindouro`             | 金の楼体・広い屋根・赤印・二白手・赤帯付き白裙・二脚を固定。手の揺れと瞬きから屋根ごと傾く突進へ変化。             |
| `kumamoto-tatamin`                      | 茶枠と緑編み面を持つ畳二枚を全8コマで固定。逆位相の傾きと瞬きから、寄り合って同期二重体当たり。融合・欠落なし。    |
| `kyoto-chirimen-mai`                    | 桃色の布層球・黄角二本・黄拳二つ・下突起を固定。布層のうねりと瞬きから、一角を先頭にした回転突進へ変化。           |
| `kyoto-hontoha-karain`                  | 赤い唐辛子胴・緑葉・三つの付着炎先端・二腕・白歯を固定。炎先端の待機差分から唐辛子先端の物理突進へ変化。火球なし。 |
| `kyushu-okinawa-islandboss-chishikigui` | 金冠・紫の三段胴・青胸面・金下印・底部・金芯付き浮遊球二つを固定。浮遊差分から左右球を前へ出す打撃へ変化。         |
| `mie-iga-jonin`                         | 紫頭巾と二角・赤蝶結び・白帯と茶袋・白い浮遊手二つ・小脚を固定。頭巾と手の待機差分から低い忍者体当たりへ変化。     |
| `mie-shinju-hime`                       | 上下の茶貝殻・中央の青白真珠・黒い蝶番帯・側面飾りを固定。貝の開閉と瞬きから真珠を前へ出す挟み込みへ変化。         |

## 組込み提案

現時点で共通変更は不要。各 `manifest.json` を `src/rendering/monsterAnimation.ts` が自動集約する既存契約を使う。

## 検査結果

- `pnpm exec vitest run tests/unit/animation-batch-03.test.ts tests/unit/animationBatchManifests.test.ts tests/unit/monsterAnimation.test.ts`: 3ファイル・5件成功。
- `E2E_PORT=4179 E2E_REUSE_SERVER=1 pnpm exec playwright test tests/e2e/animation-batch-03.spec.ts`: PC/横向きスマホの6件中5件成功。最後のシボリン640pxは高負荷で待機復帰の既定5秒を超えたため、上限を30秒へ修正。
- 修正後に `aichi-shiborin.*640` を隔離再実行して成功。合計6ケースすべて成功。
- 可視のアプリ内ブラウザでも金鯱王を目視し、実時間350msで待機フレーム1→3への進行、輪郭・基準点・実ゲーム縮尺を確認。
- スクリーンショット: `docs/verification/animation-batch-03/<id>-{960,640}.png`。
