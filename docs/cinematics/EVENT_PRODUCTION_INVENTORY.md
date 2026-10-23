# 全国イベント台帳（計画書の付録）

2026-10-17の `content/world/japan.json`、`content/prefectures/*.json` を読み取ったスナップショット。データに存在することは、プレイ検証済み・動画完成を意味しない。

## 47都道府県の節目

各行に到着A、中ボス前後M、県ボス前後B、歴史の番人前後Hを割り当てる。県ボス47体のしるしは地方ボス挑戦の前提。中ボスは県内進行の節目、Hは裏ステージの条件付き。A/M/B/Hを一本の動画と数えない。

|章|県ID|県|中ボスM|県ボスB|歴史の番人H|
|---|---|---|---|---|---|
|1|aomori|青森県|aomori-midboss-nebuta-taisho|aomori-boss-tsugaru-no-nushi|aomori-lastboss-tsugaru-tamenobu|
|1|iwate|岩手県|iwate-midboss-tetsubin-game|iwate-boss-konjiki-no-tora|iwate-lastboss-minamoto-yoshitsune|
|1|miyagi|宮城県|miyagi-midboss-tanabata-dori|miyagi-boss-mikazuki-shogun|miyagi-lastboss-date-masamune|
|1|akita|秋田県|akita-midboss-kanto-man|akita-boss-namahage-ou|akita-lastboss-satake-yoshinobu|
|1|yamagata|山形県|yamagata-midboss-juhyon|yamagata-boss-juhyo-no-kami|yamagata-lastboss-matsuo-basho|
|1|fukushima|福島県|fukushima-midboss-goshiki-slime|fukushima-boss-tsurugajo-no-nushi|fukushima-lastboss-gamo-ujisato|
|2|hokkaido|北海道|hokkaido-midboss-setsuzo-golem|hokkaido-boss-higuma-daio|hokkaido-lastboss-clark|
|3|ibaraki|茨城県|ibaraki-midboss-harutsuge-dori|ibaraki-boss-tsukuba-gama-o|ibaraki-lastboss-tokugawa-nariaki|
|3|tochigi|栃木県|tochigi-midboss-oyaishi-don|tochigi-boss-kegon-ryuo|tochigi-lastboss-nasu-no-yoichi|
|3|gunma|群馬県|gunma-midboss-yumomi-daisho|gunma-boss-gankake-daruma|gunma-lastboss-nitta-yoshisada|
|3|saitama|埼玉県|saitama-midboss-gon-yagura|saitama-boss-yomatsuri-daio|saitama-lastboss-shibusawa-eiichi|
|3|chiba|千葉県|chiba-midboss-inubouken|chiba-boss-shoyu-ryu|chiba-lastboss-ino-tadataka|
|3|tokyo|東京都|tokyo-midboss-denpa-oh|tokyo-boss-mihara-no-nushi|tokyo-lastboss-katsushika-hokusai|
|3|kanagawa|神奈川県|kanagawa-midboss-kurotamagon|kanagawa-boss-yokohama-shishi-oh|kanagawa-lastboss-minamoto-yoritomo|
|4|niigata|新潟県|niigata-midboss-sanjaku-don|niigata-boss-shinanogawa-no-nushi|niigata-lastboss-uesugi-kenshin|
|4|toyama|富山県|toyama-midboss-gabujishi|toyama-boss-tateyama-ou|toyama-lastboss-sassa-narimasa|
|4|ishikawa|石川県|ishikawa-midboss-kiriko-taisho|ishikawa-boss-yukitsuri-oomatsu|ishikawa-lastboss-maeda-toshiie|
|4|fukui|福井県|fukui-midboss-kasumi-maru|fukui-boss-echizen-gani-ou|fukui-lastboss-matsudaira-shungaku|
|5|yamanashi|山梨県|yamanashi-midboss-sakasa-fujin|yamanashi-boss-suisho-ryu|yamanashi-lastboss-takeda-shingen|
|5|nagano|長野県|nagano-midboss-karasu-jo|nagano-boss-inazuma-raicho|nagano-lastboss-sanada-yukimura|
|6|gifu|岐阜県|gifu-midboss-karankoron|gifu-boss-gassho-daiou|gifu-lastboss-saito-dosan|
|6|shizuoka|静岡県|shizuoka-midboss-yogan-gani|shizuoka-boss-fujimine-ou|shizuoka-lastboss-tokugawa-ieyasu|
|6|aichi|愛知県|aichi-midboss-tokoname-neko|aichi-boss-kinshachi-ou|aichi-lastboss-oda-nobunaga|
|6|mie|三重県|mie-midboss-oosansho-ou|mie-boss-iseebi-taisho|mie-lastboss-todo-takatora|
|7|shiga|滋賀県|shiga-midboss-ponpoko-oyabun|shiga-boss-dainamazu|shiga-lastboss-ii-naosuke|
|7|kyoto|京都府|kyoto-midboss-kayabuki-monban|kyoto-boss-amano-hiryu|kyoto-lastboss-murasaki-shikibu|
|7|osaka|大阪府|osaka-midboss-abare-danjiri|osaka-boss-takoishi-daio|osaka-lastboss-toyotomi-hideyoshi|
|7|hyogo|兵庫県|hyogo-midboss-tajima-mogyu|hyogo-boss-shirasagi-tenshu|hyogo-lastboss-ikeda-terumasa|
|7|nara|奈良県|nara-midboss-hitome-senbon|nara-boss-shika-daio|nara-lastboss-shotoku-taishi|
|7|wakayama|和歌山県|wakayama-midboss-umeboshi-yokozuna|wakayama-boss-kuroshio-ryu|wakayama-lastboss-tokugawa-yoshimune|
|8|tottori|鳥取県|tottori-midboss-dosshiri-dozo|tottori-boss-sakyu-majin|tottori-lastboss-otomo-no-yakamochi|
|8|shimane|島根県|shimane-midboss-shirogane-mogura|shimane-boss-kagura-orochi|shimane-lastboss-koizumi-yakumo|
|8|okayama|岡山県|okayama-midboss-mouretsu-jersey|okayama-boss-kibi-no-onio|okayama-lastboss-ikeda-mitsumasa|
|8|hiroshima|広島県|hiroshima-midboss-fude-daisho|hiroshima-boss-momiji-ryu|hiroshima-lastboss-mouri-motonari|
|8|yamaguchi|山口県|yamaguchi-midboss-kintai-shirohebi|yamaguchi-boss-akiyoshi-daiou|yamaguchi-lastboss-yoshida-shoin|
|9|tokushima|徳島県|tokushima-midboss-uzushion|tokushima-boss-awaodori-ou|tokushima-lastboss-hachisuka-iemasa|
|9|kagawa|香川県|kagawa-midboss-ritsurin-no-nushi|kagawa-boss-oudon-ryu|kagawa-lastboss-hiraga-gennai|
|9|ehime|愛媛県|ehime-midboss-yuamisagi|ehime-boss-ishizuchi-ou|ehime-lastboss-murakami-takeyoshi|
|9|kochi|高知県|kochi-midboss-narukomai|kochi-boss-kuroshio-kujira|kochi-lastboss-sakamoto-ryoma|
|10|fukuoka|福岡県|fukuoka-midboss-banana-taisho|fukuoka-boss-hiraodaio|fukuoka-lastboss-kuroda-kanbei|
|10|saga|佐賀県|saga-midboss-toumeika|saga-boss-akajishi-oh|saga-lastboss-nabeshima-naomasa|
|10|nagasaki|長崎県|nagasaki-midboss-megane-golem|nagasaki-boss-unzen-ryu|nagasaki-lastboss-siebold|
|10|kumamoto|熊本県|kumamoto-midboss-kindouro|kumamoto-boss-mushagaeshi|kumamoto-lastboss-kato-kiyomasa|
|10|oita|大分県|oita-midboss-yabakeiwa|oita-boss-yukemuryu|oita-lastboss-fukuzawa-yukichi|
|10|miyazaki|宮崎県|miyazaki-midboss-sentaku-oni|miyazaki-boss-takachiho-no-nushi|miyazaki-lastboss-komura-jutaro|
|10|kagoshima|鹿児島県|kagoshima-midboss-tsubo-musha|kagoshima-boss-sakurajimaguma|kagoshima-lastboss-saigo-takamori|
|10|okinawa|沖縄県|okinawa-midboss-eisa-daiko|okinawa-boss-dairyuchu|okinawa-lastboss-sho-hashi|

## 名所学習イベント全51件

分類はすべて「既存学習イベント・個別必須性は要確認」。onceは再演可否でありクリア必須条件ではない。問題操作を動画へ置き換えず、導入・解決後の変化をP/Hで演出する。

|県|イベントID|題材|発火マップ／オブジェクト|繰り返し|
|---|---|---|---|---|
|青森県|aomori-ev-ringoen|りんご|aomori-field / ev_ringoen|再実行可|
|青森県|aomori-ev-sannai|三内丸山遺跡|aomori-field / ev_sannai|初回のみ|
|青森県|aomori-ev-kaikyo|津軽海峡|aomori-field / ev_kaikyo|初回のみ|
|青森県|aomori-ev-towada|十和田湖|aomori-field / ev_towada|初回のみ|
|青森県|aomori-ev-osorezan|恐山|aomori-dungeon / ev_osorezan|初回のみ|
|岩手県|ev-iwate-chusonji|中尊寺金色堂|iwate-field / event_iwate_chusonji|初回のみ|
|宮城県|ev-miyagi-matsushima|松島|miyagi-field / event_miyagi_matsushima|初回のみ|
|秋田県|ev-akita-tazawako|田沢湖|akita-field / event_akita_tazawako|初回のみ|
|山形県|ev-yamagata-zao|蔵王の 樹氷|yamagata-field / event_yamagata_zao|初回のみ|
|福島県|ev-fukushima-tsurugajo|鶴ヶ城|fukushima-field / event_fukushima_tsurugajo|初回のみ|
|北海道|ev-hokkaido-kushiro-shitsugen|釧路湿原|hokkaido-field / event_hokkaido_kushiro-shitsugen|初回のみ|
|茨城県|ev-ibaraki-fukuroda-no-taki|袋田の 滝|ibaraki-field / event_ibaraki_fukuroda-no-taki|初回のみ|
|栃木県|ev-tochigi-nikko-toshogu|日光東照宮|tochigi-field / event_tochigi_nikko-toshogu|初回のみ|
|群馬県|ev-gunma-tomioka-seishijo|富岡製糸場|gunma-field / event_gunma_tomioka-seishijo|初回のみ|
|埼玉県|ev-saitama-sakitama-kofun|さきたま古墳群|saitama-field / event_saitama_sakitama-kofun|初回のみ|
|千葉県|ev-chiba-kujukurihama|九十九里浜|chiba-field / event_chiba_kujukurihama|初回のみ|
|東京都|ev-tokyo-takaosan|高尾山|tokyo-field / event_tokyo_takaosan|初回のみ|
|神奈川県|ev-kanagawa-owakudani|箱根の 大涌谷|kanagawa-field / event_kanagawa_owakudani|初回のみ|
|新潟県|ev-niigata-shinanogawa|信濃川|niigata-field / event_niigata_shinanogawa|初回のみ|
|富山県|ev-toyama-gokayama|五箇山|toyama-field / event_toyama_gokayama|初回のみ|
|石川県|ev-ishikawa-kenrokuen|兼六園|ishikawa-field / event_ishikawa_kenrokuen|初回のみ|
|福井県|ev-fukui-katsuyama-kyoryu|勝山の 恐竜|fukui-field / event_fukui_katsuyama-kyoryu|初回のみ|
|山梨県|ev-yamanashi-oshino-hakkai|忍野八海|yamanashi-field / event_yamanashi_oshino-hakkai|初回のみ|
|長野県|ev-nagano-suwako|諏訪湖|nagano-field / event_nagano_suwako|初回のみ|
|岐阜県|ev-gifu-shirakawago|白川郷|gifu-field / event_gifu_shirakawago|初回のみ|
|静岡県|ev-shizuoka-fujisan|富士山|shizuoka-field / event_shizuoka_fujisan|初回のみ|
|愛知県|ev-aichi-nagoya-jo|名古屋城|aichi-field / event_aichi_nagoya-jo|初回のみ|
|三重県|ev-mie-iga-ninja|伊賀の 忍者|mie-field / event_mie_iga-ninja|初回のみ|
|滋賀県|ev-shiga-biwako|琵琶湖|shiga-field / event_shiga_biwako|初回のみ|
|京都府|ev-kyoto-amanohashidate|天橋立|kyoto-field / event_kyoto_amanohashidate|初回のみ|
|大阪府|ev-osaka-daisen-kofun|大仙古墳|osaka-field / event_osaka_daisen-kofun|初回のみ|
|兵庫県|ev-hyogo-takeda-jo|竹田城跡|hyogo-field / event_hyogo_takeda-jo|初回のみ|
|奈良県|ev-nara-ishibutai|石舞台古墳|nara-field / event_nara_ishibutai|初回のみ|
|和歌山県|ev-wakayama-nachi-no-taki|那智の 滝|wakayama-field / event_wakayama_nachi-no-taki|初回のみ|
|鳥取県|ev-tottori-tottori-sakyu|鳥取砂丘|tottori-field / event_tottori_tottori-sakyu|初回のみ|
|島根県|ev-shimane-matsue-jo|松江城|shimane-field / event_shimane_matsue-jo|初回のみ|
|岡山県|ev-okayama-seto-ohashi|瀬戸大橋|okayama-field / event_okayama_seto-ohashi|初回のみ|
|広島県|ev-hiroshima-itsukushima|厳島神社|hiroshima-field / event_hiroshima_itsukushima|初回のみ|
|山口県|ev-yamaguchi-akiyoshidai|秋吉台|yamaguchi-field / event_yamaguchi_akiyoshidai|初回のみ|
|徳島県|ev-tokushima-naruto-uzushio|鳴門の うず潮|tokushima-field / event_tokushima_naruto-uzushio|初回のみ|
|香川県|ev-kagawa-chichibugahama|父母ヶ浜|kagawa-field / event_kagawa_chichibugahama|初回のみ|
|愛媛県|ev-ehime-uchiko|内子の 町なみ|ehime-field / event_ehime_uchiko|初回のみ|
|高知県|ev-kochi-shimantogawa|四万十川|kochi-field / event_kochi_shimantogawa|初回のみ|
|福岡県|ev-fukuoka-hiraodai|平尾台|fukuoka-field / event_fukuoka_hiraodai|初回のみ|
|佐賀県|ev-saga-yoshinogari|吉野ヶ里遺跡|saga-field / event_saga_yoshinogari|初回のみ|
|長崎県|ev-nagasaki-kujukushima|九十九島|nagasaki-field / event_nagasaki_kujukushima|初回のみ|
|熊本県|ev-kumamoto-tsujunkyo|通潤橋|kumamoto-field / event_kumamoto_tsujunkyo|初回のみ|
|大分県|ev-oita-beppu-onsen|別府温泉|oita-field / event_oita_beppu-onsen|初回のみ|
|宮崎県|ev-miyazaki-ebino-kogen|えびの高原|miyazaki-field / event_miyazaki_ebino-kogen|初回のみ|
|鹿児島県|ev-kagoshima-izumi-tsuru|出水の ツル|kagoshima-field / event_kagoshima_izumi-tsuru|初回のみ|
|沖縄県|ev-okinawa-yanbaru|やんばるの 森|okinawa-field / event_okinawa_yanbaru|初回のみ|

## 名所エリアのぬし全10エリア分

県境の中ボスとは別枠。関所解除は既存のregionGates/openedByを正とする。全ぬしを専用ムービーにせず、遭遇・浄化・関所開放の共通P演出を使う。

|県|エリアID|名前|ぬしID|
|---|---|---|---|
|aomori|nebuta|ねぶた祭エリア|aomori-nebuta-musha|
|aomori|sannai|三内丸山遺跡エリア|aomori-dogu-jin|
|aomori|tsugaru|津軽海峡エリア|aomori-umineko-taicho|
|aomori|hirosaki|弘前城エリア|aomori-oka-musha|
|aomori|shirakami|白神山地エリア|aomori-buna-taiju|
|aomori|towada|十和田湖エリア|aomori-hachiro-ryu|
|aomori|oirase|奥入瀬渓流エリア|aomori-oirase-kokejin|
|aomori|hachinohe|八戸エリア|aomori-nabe-shogun|
|aomori|osorezan|恐山エリア|aomori-kaza-mimizuku|
|aomori|oma|大間エリア|aomori-kuro-magurodo|
