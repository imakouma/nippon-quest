/**
 * マップ生成に使う「実在の地理」の手書きデータ（緯度経度はすべて [経度, 緯度]）。
 *   - 県境・海岸線は gen-terrain.ts が地球地図日本から取り込む。ここには置かない
 *   - ここに書くのは、町（県庁所在地）・名所・島の範囲・湖など、マップ上に何かを置く位置
 * 位置を変えたら `pnpm gen:terrain && pnpm scaffold:maps --force` で反映する。
 */
export type LonLat = [number, number];
/** [西端の経度, 南端の緯度, 東端の経度, 北端の緯度] */
export type BBox = [number, number, number, number];

/** 県庁所在地（出典: dataofjapan/land prefecturalCapital.csv）。フィールドの町の入口と、地方マップの県の入口になる */
export const CAPITALS: Record<string, LonLat> = {
  hokkaido: [141.347449, 43.064359],
  aomori: [140.740054, 40.824294],
  iwate: [141.152667, 39.70353],
  miyagi: [140.872183, 38.268737],
  akita: [140.103356, 39.718175],
  yamagata: [140.362533, 38.240127],
  fukushima: [140.466754, 37.750146],
  ibaraki: [140.446796, 36.341817],
  tochigi: [139.883526, 36.56575],
  gunma: [139.060917, 36.391205],
  saitama: [139.647804, 35.857771],
  chiba: [140.123179, 35.604563],
  tokyo: [139.691648, 35.689185],
  kanagawa: [139.642347, 35.447505],
  niigata: [139.022728, 37.901699],
  toyama: [137.211302, 36.695274],
  ishikawa: [136.62555, 36.594729],
  fukui: [136.221641, 36.06522],
  yamanashi: [138.568985, 35.665102],
  nagano: [138.180972, 36.651282],
  gifu: [136.722204, 35.39116],
  shizuoka: [138.383057, 34.976987],
  aichi: [136.906698, 35.180247],
  mie: [136.50861, 34.730547],
  shiga: [135.868588, 35.004532],
  kyoto: [135.7531135, 35.0209962],
  osaka: [135.518992, 34.686492],
  hyogo: [135.183087, 34.69128],
  nara: [135.832745, 34.685296],
  wakayama: [135.16795, 34.224806],
  tottori: [134.238258, 35.503463],
  shimane: [133.05083, 35.472248],
  okayama: [133.934414, 34.66132],
  hiroshima: [132.459595, 34.396033],
  yamaguchi: [131.470755, 34.185648],
  tokushima: [134.559293, 34.065732],
  kagawa: [134.04297, 34.34014],
  ehime: [132.76585, 33.841649],
  kochi: [133.530887, 33.55969],
  fukuoka: [130.418228, 33.606767],
  saga: [130.298822, 33.249367],
  nagasaki: [129.873037, 32.744542],
  kumamoto: [130.742345, 32.790385],
  oita: [131.612674, 33.2382],
  miyazaki: [131.423855, 31.91109],
  kagoshima: [130.557906, 31.560219],
  okinawa: [127.681115, 26.211538],
};

/**
 * フィールドに写す範囲。省略した県は「いちばん大きい陸地＋そのすぐ近くの島」から自動で決める。
 * 遠い離島（飛地マップで行く島）がある県だけ、本土の範囲をここで決めておく。
 */
export const FIELD_BBOX: Record<string, BBox> = {
  hokkaido: [139.3, 41.35, 145.9, 45.56],
  tokyo: [138.93, 35.49, 139.93, 35.9],
  niigata: [137.6, 36.72, 139.92, 38.56],
  ishikawa: [136.23, 36.06, 137.37, 37.55],
  shimane: [131.65, 34.3, 133.4, 35.62],
  nagasaki: [129.5, 32.55, 130.4, 33.45],
  kagoshima: [130.05, 30.95, 131.25, 32.32],
  okinawa: [127.6, 26.05, 128.35, 26.9],
};

/**
 * ダンジョンの入口にする名所。省略した県は、そのフィールドの山（高い山があれば高い山）のうち、
 * 町からほどよく離れた場所に置く。東北6県は Overworld のラベルに名前が出ているので、その場所に合わせる。
 */
export const DUNGEON_SPOTS: Record<string, LonLat> = {
  hokkaido: [140.839, 42.541], // 有珠山（洞爺湖の 火山）
  aomori: [141.09, 41.325], // 恐山
  iwate: [141.1, 38.99], // 中尊寺金色堂
  miyagi: [141.065, 38.37], // 松島
  akita: [140.664, 39.722], // 田沢湖
  yamagata: [140.44, 38.14], // 蔵王
  fukushima: [139.93, 37.488], // 鶴ヶ城
  ibaraki: [140.42, 36.7], // 竜神峡（竜神大吊橋）
  tochigi: [139.816, 36.612], // 大谷石の 地下採掘場あと（大谷資料館）
  gunma: [138.79, 36.03], // 不二洞（上野村の 鍾乳洞）
  saitama: [139.06, 35.95], // 橋立鍾乳洞（秩父）
  chiba: [139.826, 35.16], // 鋸山の 石切場あと
  tokyo: [139.045, 35.855], // 日原鍾乳洞（奥多摩）
  kanagawa: [139.02, 35.244], // 大涌谷（箱根）
  niigata: [138.783, 37.005], // 清津峡
  toyama: [137.63, 36.82], // 黒部峡谷
  ishikawa: [136.52, 36.35], // 尾小屋鉱山（小松）
  fukui: [136.13, 36.238], // 東尋坊
  yamanashi: [138.688, 35.47], // 鳴沢氷穴
  nagano: [137.638, 36.251], // 上高地（河童橋）
  gifu: [136.99, 35.79], // 大滝鍾乳洞（郡上）
  shizuoka: [138.9, 34.66], // 龍宮窟（伊豆・下田）
  aichi: [136.939, 35.378], // 犬山城
  mie: [136.13, 34.55], // 赤目四十八滝
  shiga: [136.32, 35.21], // 河内風穴（多賀）
  kyoto: [135.671, 35.017], // 嵯峨野の 竹林
  osaka: [135.471, 34.855], // 箕面の滝
  hyogo: [134.8, 35.17], // 生野銀山
  nara: [135.88, 34.25], // 面不動鍾乳洞（天川・洞川）
  wakayama: [135.89, 33.67], // 那智の滝
  tottori: [134.36, 35.585], // 浦富海岸の 海食洞
  shimane: [132.43, 35.11], // 石見銀山
  okayama: [133.53, 34.95], // 満奇洞（新見）
  hiroshima: [132.2, 34.63], // 三段峡
  yamaguchi: [131.303, 34.229], // 秋芳洞
  tokushima: [133.79, 33.9], // 大歩危峡
  kagawa: [134.1, 34.36], // 屋島
  ehime: [133.33, 33.89], // 別子銅山
  kochi: [133.75, 33.6], // 龍河洞
  fukuoka: [130.9, 33.74], // 平尾台の 千仏鍾乳洞
  saga: [129.885, 33.548], // 七ツ釜（唐津の 海食洞）
  nagasaki: [130.257, 32.735], // 雲仙地獄
  kumamoto: [131.084, 32.884], // 阿蘇 中岳の 火口
  oita: [131.157, 33.499], // 青の洞門（耶馬渓）
  miyazaki: [131.305, 32.712], // 高千穂峡
  kagoshima: [130.528, 31.18], // 開聞岳
  okinawa: [127.744, 26.139], // 玉泉洞
};

/** content/prefectures/*.json の events[].trigger.objectName → 実際の場所 */
/**
 * 名所エリアの たね（content/prefectures/<県>.json の regions の id → 緯度経度。1 つ目の 場所の そばに エリアの ぬしが 立つ）。
 * scaffold-maps が この たねから 陸を 歩いて ちかい じゅんに エリアを わけ、さかいを 山なみで かこむ
 */
export const REGION_SEEDS: Record<string, Record<string, LonLat[]>> = {
  aomori: {
    sannai: [
      [140.697, 40.811], // 三内丸山遺跡
      [140.738, 40.831], // 青森市（ねぶたの家）
    ],
    hirosaki: [
      [140.4645, 40.6075], // 弘前城
      [140.44, 40.59], // りんご公園
    ],
    shirakami: [[140.15, 40.47]], // 白神山地
    towada: [
      [140.9, 40.5], // 十和田湖
      [141.03, 40.56], // 奥入瀬
    ],
    hachinohe: [[141.49, 40.51]], // 八戸
    shimokita: [
      [140.95, 41.5], // 大間
      [141.09, 41.325], // 恐山
    ],
  },
};

/**
 * 名所エリアの 見た目（scaffold-maps が 地面の タイルを かえる）：
 *   forest＝草原・たはたを 森に（白神山地の ブナの 森）／sakura＝草原に さくらの 木（弘前城）／
 *   ash＝たねの seed 番目の まわり radius マスを はいいろの 砂地と ゆけむりに（恐山）
 */
export const REGION_LOOKS: Record<
  string,
  Record<string, { kind: 'forest' | 'sakura' | 'ash'; seed?: number; radius?: number }>
> = {
  aomori: {
    shirakami: { kind: 'forest' },
    hirosaki: { kind: 'sakura' },
    shimokita: { kind: 'ash', seed: 1, radius: 9 },
  },
};

export const EVENT_SPOTS: Record<string, LonLat> = {
  ev_ringoen: [140.44, 40.59], // 弘前のりんご公園
  ev_sannai: [140.697, 40.811], // 三内丸山遺跡
  ev_kaikyo: [140.91, 41.535], // 津軽海峡（大間の港）
  ev_towada: [140.9, 40.5], // 十和田湖
  event_iwate_chusonji: [141.1, 38.99],
  event_miyagi_matsushima: [141.065, 38.37],
  event_akita_tazawako: [140.664, 39.722],
  event_yamagata_zao: [140.44, 38.14],
  event_fukushima_tsurugajo: [139.93, 37.488],
  'event_tottori_tottori-sakyu': [134.235, 35.54], // 鳥取市
  'event_shimane_matsue-jo': [133.05, 35.475], // 松江市
  'event_okayama_seto-ohashi': [133.8, 34.46], // 倉敷市児島
  'event_hokkaido_kushiro-shitsugen': [144.4, 43.1], // 釧路市・釧路町・標茶町・鶴居村
  'event_ibaraki_fukuroda-no-taki': [140.406, 36.765], // 大子町
  'event_tochigi_nikko-toshogu': [139.599, 36.758], // 日光市
  event_chiba_kujukurihama: [140.5, 35.55], // 九十九里町
  event_tokyo_takaosan: [139.244, 35.625], // 八王子市
  event_niigata_shinanogawa: [138.75, 37.13], // 十日町市
  'event_yamanashi_oshino-hakkai': [138.838, 35.46], // 忍野村
  event_nagano_suwako: [138.085, 36.048], // 諏訪市・岡谷市・下諏訪町
  event_gifu_shirakawago: [136.906, 36.257], // 白川村
  event_shizuoka_fujisan: [138.73, 35.36], // 富士宮市・御殿場市
  event_shiga_biwako: [136.08, 35.25], // 琵琶湖（湖）
  event_kyoto_amanohashidate: [135.19, 35.57], // 宮津市
  'event_hyogo_takeda-jo': [134.83, 35.3], // 朝来市
  event_nara_ishibutai: [135.827, 34.466], // 明日香村
  event_fukuoka_hiraodai: [130.9, 33.77], // 北九州市小倉南区
  event_saga_yoshinogari: [130.385, 33.325], // 吉野ヶ里町・神埼市
  'event_oita_beppu-onsen': [131.49, 33.315], // 別府市
  'event_miyazaki_ebino-kogen': [130.83, 31.94], // えびの市
  'event_wakayama_nachi-no-taki': [135.888, 33.675], // 那智勝浦町
  event_kanagawa_owakudani: [139.02, 35.243], // 箱根町
  'event_osaka_daisen-kofun': [135.487, 34.564], // 堺市
  'event_aichi_nagoya-jo': [136.9, 35.185], // 名古屋市
  event_hiroshima_itsukushima: [132.32, 34.296], // 廿日市市宮島町
  event_yamaguchi_akiyoshidai: [131.3, 34.235], // 美祢市
  'event_kagoshima_izumi-tsuru': [130.3, 32.1], // 出水市
  'event_mie_iga-ninja': [136.13, 34.77], // 伊賀市
  event_okinawa_yanbaru: [128.2, 26.75], // 国頭村
  'event_gunma_tomioka-seishijo': [138.888, 36.255], // 富岡市
  event_toyama_gokayama: [136.87, 36.42], // 南砺市
  event_ishikawa_kenrokuen: [136.662, 36.562], // 金沢市
  'event_tokushima_naruto-uzushio': [134.66, 34.235], // 鳴門市
  event_kagawa_chichibugahama: [133.62, 34.2], // 三豊市
  event_nagasaki_kujukushima: [129.68, 33.2], // 佐世保市
  'event_fukui_katsuyama-kyoryu': [136.51, 36.08], // 勝山市
  event_ehime_uchiko: [132.66, 33.54], // 内子町
  event_kumamoto_tsujunkyo: [131, 32.66], // 山都町
  'event_saitama_sakitama-kofun': [139.478, 36.128], // 行田市
  event_kochi_shimantogawa: [132.93, 33.05], // 四万十市
};

/**
 * 名所スタンプの場所（イベントの無い名所・特産品）。県 id → content/prefectures/<県>.json の motifs[].id → 実際の場所。
 * フィールドに ★ の看板が立ち、近づくと名所のカットインと説明が出てスタンプがもらえる（Overworld）。
 * 特産品は、とれる・作られる産地に置く。目安は 1 県 8〜12 か所（北海道は 18）。
 * 湖の中心など歩けない場所を書いても、いちばん近い歩けるマス（岸）に立つ。
 * 離島（ENCLAVE_GEO の範囲）に入る場所は離島マップに立つ。どのマップの範囲にも入らない場所は置かれない（scaffold:maps が警告）。
 */
export const LANDMARK_SPOTS: Record<string, Record<string, LonLat>> = {
  hokkaido: {
    shiretoko: [145.122, 44.076], // 斜里町・羅臼町（羅臼岳）
    mashuko: [144.535, 43.574], // 弟子屈町
    ryuhyo: [144.27, 44.02], // 網走市
    asahidake: [142.854, 43.664], // 東川町
    'furano-lavender': [142.43, 43.41], // 中富良野町・富良野市
    toyako: [140.85, 42.6], // 洞爺湖町・壮瞥町
    goryokaku: [140.757, 41.797], // 函館市
    'yuki-matsuri': [141.35, 43.06], // 札幌市（大通公園）
    'soya-misaki': [141.936, 45.522], // 稚内市
    upopoy: [141.355, 42.557], // 白老町（ポロト湖のほとり）
    'yubari-melon': [141.974, 43.057], // 夕張市
    'tokachi-jagaimo': [143.05, 42.91], // 芽室町・帯広市
    'konsen-gyunyu': [145.118, 43.394], // 別海町
    'sarufutsu-hotate': [142.111, 45.331], // 猿払村
    'hidaka-konbu': [143.152, 42.017], // えりも町・様似町
    'kibori-guma': [140.274, 42.255], // 八雲町
    'kitami-tamanegi': [143.896, 43.804], // 北見市
  },
  aomori: {
    shirakami: [140.15, 40.47], // 白神山地（青森県側）
    'hirosaki-jo': [140.4645, 40.6075], // 弘前城
    nebuta: [140.738, 40.831], // 青森市（ねぶたの家）
    'oma-maguro': [140.95, 41.5], // 大間町
    'tsugaru-nuri': [140.48, 40.58], // 弘前市
    oirase: [141.03, 40.56], // 十和田市（焼山）
    senbeijiru: [141.49, 40.51], // 八戸市
  },
  iwate: {
    ryusendo: [141.803, 39.857], // 龍泉洞
    'iwate-san': [141.001, 39.853], // 岩手山
    jodogahama: [141.983, 39.647], // 浄土ヶ浜（宮古）
    wanko: [141.117, 39.389], // 花巻市
    'nanbu-tekki': [141.14, 39.144], // 奥州市水沢
    tono: [141.533, 39.328], // 遠野市
    'morioka-reimen': [141.15, 39.7], // 盛岡市
    'sanriku-wakame': [141.72, 39.07], // 大船渡市
    hachimantai: [140.9, 39.93], // 八幡平市
    geibikei: [141.288, 38.99], // 一関市
    kitayamazaki: [141.93, 40.08], // 田野畑村
  },
  miyagi: {
    'naruko-kyo': [140.689, 38.742], // 鳴子峡
    kesennuma: [141.573, 38.905], // 気仙沼の港
    gyutan: [140.88, 38.26], // 仙台市
    'sendai-tanabata': [140.87, 38.262], // 仙台市（一番町）
    'sendai-jo': [140.856, 38.253], // 仙台市（青葉山）
    zunda: [140.9, 38.24], // 仙台市
    sasakama: [141.02, 38.314], // 塩竈市
    'naruko-kokeshi': [140.718, 38.743], // 大崎市鳴子温泉
    izunuma: [141.1, 38.72], // 栗原市・登米市
    'miyagi-kaki': [141.37, 38.37], // 石巻市（牡鹿半島）
  },
  akita: {
    namahage: [139.787, 39.93], // 男鹿（なまはげ）
    kakunodate: [140.563, 39.595], // 角館
    'kanto-matsuri': [140.12, 39.72], // 秋田市
    kiritanpo: [140.79, 40.215], // 鹿角市
    magewappa: [140.54, 40.27], // 大館市
    'akita-inu': [140.59, 40.28], // 大館市
    'inaniwa-udon': [140.515, 39.08], // 湯沢市稲庭町
    'omagari-hanabi': [140.476, 39.453], // 大仙市大曲
    'ogata-okome': [139.97, 40], // 大潟村
    chokaisan: [140, 39.13], // にかほ市・由利本荘市
  },
  yamagata: {
    yamadera: [140.437, 38.313], // 山寺（立石寺）
    mogamigawa: [140.12, 38.775], // 最上峡（最上川くだり）
    sakuranbo: [140.276, 38.381], // 寒河江市
    'shogi-koma': [140.378, 38.362], // 天童市
    imoni: [140.36, 38.26], // 山形市（馬見ヶ崎川）
    'ginzan-onsen': [140.53, 38.57], // 尾花沢市
    'sankyo-soko': [139.843, 38.912], // 酒田市
    'haguro-gojunoto': [139.981, 38.702], // 鶴岡市羽黒町
    'yonezawa-gyu': [140.116, 37.922], // 米沢市
    dadachamame: [139.83, 38.73], // 鶴岡市
  },
  fukushima: {
    inawashiroko: [140.09, 37.48], // 猪苗代湖（湖の中心 → 岸に立つ）
    goshikinuma: [140.083, 37.655], // 五色沼
    ouchijuku: [139.862, 37.338], // 大内宿
    akabeko: [139.72, 37.53], // 柳津町
    momo: [140.52, 37.85], // 桑折町・伊達市
    'okiagari-koboshi': [139.922, 37.5], // 会津若松市（七日町）
    'kitakata-ramen': [139.874, 37.651], // 喜多方市
    shioyasaki: [140.979, 36.996], // いわき市
    'soma-nomaoi': [140.957, 37.635], // 南相馬市（雲雀ヶ原）
    'shirakawa-daruma': [140.211, 37.126], // 白河市
    'miharu-takizakura': [140.494, 37.402], // 三春町
  },
  ibaraki: {
    kairakuen: [140.452, 36.373], // 水戸市
    kasumigaura: [140.35, 36.06], // 霞ヶ浦（湖）
    tsukubasan: [140.106, 36.225], // つくば市
    nemophila: [140.6, 36.405], // ひたちなか市
    natto: [140.47, 36.37], // 水戸市
    hoshiimo: [140.57, 36.475], // 東海村・ひたちなか市
    'ibaraki-melon': [140.52, 36.16], // 鉾田市
    kasamayaki: [140.26, 36.385], // 笠間市
    renkon: [140.2, 36.07], // 土浦市
  },
  tochigi: {
    'kegon-no-taki': [139.503, 36.738], // 日光市
    'nasu-kogen': [140.02, 37.1], // 那須町
    'ashikaga-gakko': [139.452, 36.337], // 足利市
    'kinugawa-onsen': [139.72, 36.82], // 日光市鬼怒川
    oyaishi: [139.82, 36.6], // 宇都宮市大谷町
    'tochigi-ichigo': [140.013, 36.44], // 真岡市
    kanpyo: [139.8, 36.43], // 壬生町・下野市
    'utsunomiya-gyoza': [139.89, 36.56], // 宇都宮市
    mashikoyaki: [140.1, 36.467], // 益子町
  },
  gunma: {
    'kusatsu-onsen': [138.596, 36.623], // 草津町
    oze: [139.24, 36.92], // 片品村
    tanigawadake: [138.93, 36.837], // みなかみ町
    'fukiware-no-taki': [139.23, 36.7], // 沼田市
    'ikaho-onsen': [138.92, 36.495], // 渋川市
    'takasaki-daruma': [138.95, 36.33], // 高崎市
    konnyaku: [138.79, 36.21], // 下仁田町
    'tsumagoi-kyabetsu': [138.53, 36.5], // 嬬恋村
    yakimanju: [139.07, 36.39], // 前橋市
  },
  saitama: {
    kawagoe: [139.483, 35.925], // 川越市
    nagatoro: [139.11, 36.1], // 長瀞町
    'chichibu-yomatsuri': [139.085, 35.99], // 秩父市
    'gaikaku-hosuiro': [139.8, 36], // 春日部市
    'soka-senbei': [139.81, 35.826], // 草加市
    'fukaya-negi': [139.28, 36.197], // 深谷市
    sayamacha: [139.41, 35.85], // 狭山市・入間市
    'iwatsuki-hina': [139.69, 35.95], // さいたま市岩槻区
    'ogawa-washi': [139.26, 36.056], // 小川町
  },
  chiba: {
    naritasan: [140.318, 35.787], // 成田市
    nokogiriyama: [139.84, 35.16], // 富津市・鋸南町
    inubosaki: [140.86, 35.71], // 銚子市
    'oyama-senmaida': [140.09, 35.1], // 鴨川市
    sawara: [140.5, 35.89], // 香取市佐原
    'noda-shoyu': [139.86, 35.955], // 野田市
    rakkasei: [140.32, 35.665], // 八街市
    'chiba-nashi': [140.06, 35.79], // 白井市
    'boshu-uchiwa': [139.87, 34.99], // 館山市・南房総市
  },
  tokyo: {
    kaminarimon: [139.797, 35.711], // 台東区浅草
    'tokyo-tower': [139.745, 35.659], // 港区
    okutamako: [139.05, 35.79], // 奥多摩町
    mitakesan: [139.15, 35.78], // 青梅市
    'nerima-daikon': [139.62, 35.745], // 練馬区
    'tokyo-udo': [139.41, 35.7], // 立川市
    'jindaiji-soba': [139.556, 35.67], // 調布市
    'edo-kiriko': [139.83, 35.67], // 江東区
    miharayama: [139.395, 34.725], // 大島町（伊豆大島）
    'oshima-tsubaki': [139.36, 34.76], // 大島町（伊豆大島）
  },
  kanagawa: {
    'kamakura-daibutsu': [139.536, 35.317], // 鎌倉市
    enoshima: [139.48, 35.3], // 藤沢市
    'yokohama-chukagai': [139.646, 35.443], // 横浜市中区
    tanzawa: [139.16, 35.47], // 丹沢山地
    'misaki-maguro': [139.62, 35.14], // 三浦市
    'odawara-kamaboko': [139.155, 35.25], // 小田原市
    'shonan-shirasu': [139.4, 35.32], // 茅ヶ崎市
    'yosegi-zaiku': [139.07, 35.22], // 箱根町畑宿
  },
  niigata: {
    'uonuma-okome': [138.94, 37.23], // 魚沼市・南魚沼市
    'nagaoka-hanabi': [138.85, 37.45], // 長岡市
    'tsubame-sanjo': [138.93, 37.66], // 燕市・三条市
    'ojiya-chijimi': [138.79, 37.31], // 小千谷市
    'sasagawa-nagare': [139.46, 38.35], // 村上市
    'shiobiki-zake': [139.48, 38.22], // 村上市
    oyashirazu: [137.72, 36.97], // 糸魚川市
    'itoigawa-hisui': [137.86, 37.04], // 糸魚川市
    'takada-yozakura': [138.25, 37.1], // 上越市（高田城址公園）
    myokosan: [138.11, 36.89], // 妙高市
    hyoko: [139.2, 37.84], // 阿賀野市
    'sado-kinzan': [138.24, 38.04], // 佐渡市相川
    taraibune: [138.28, 37.82], // 佐渡市小木
    'sado-toki': [138.42, 38.07], // 佐渡市新穂
  },
  toyama: {
    tateyama: [137.6, 36.57], // 立山町
    'kurobe-kyokoku': [137.63, 36.82], // 黒部市宇奈月
    shomyodaki: [137.5, 36.58], // 立山町
    'tonami-tulip': [136.97, 36.63], // 砺波市
    'takaoka-doki': [137, 36.75], // 高岡市
    hotaruika: [137.4, 36.8], // 滑川市
    'himi-buri': [136.99, 36.86], // 氷見市
    masuzushi: [137.21, 36.7], // 富山市
    'inami-chokoku': [136.97, 36.56], // 南砺市井波
  },
  ishikawa: {
    'shiroyone-senmaida': [137, 37.39], // 輪島市
    chirihama: [136.75, 36.87], // 羽咋市・宝達志水町
    hakusan: [136.77, 36.155], // 白山市
    'kiriko-matsuri': [137.15, 37.3], // 能登町
    wajimanuri: [136.9, 37.39], // 輪島市
    'suzu-shio': [137.21, 37.46], // 珠洲市
    kutaniyaki: [136.5, 36.44], // 能美市
    'kanazawa-kinpaku': [136.65, 36.57], // 金沢市
    'kano-gani': [136.32, 36.33], // 加賀市橋立
  },
  fukui: {
    'echizen-suisen': [135.97, 35.93], // 越前町
    eiheiji: [136.355, 36.056], // 永平寺町
    'maruoka-jo': [136.272, 36.152], // 坂井市
    mikatagoko: [135.88, 35.57], // 若狭町・美浜町
    'echizen-gani': [136.15, 36.22], // 坂井市三国
    'echizen-washi': [136.23, 35.9], // 越前市今立
    'sabae-megane': [136.185, 35.955], // 鯖江市
    wakasanuri: [135.75, 35.495], // 小浜市
    oroshisoba: [136.22, 36.06], // 福井市
  },
  yamanashi: {
    fujigoko: [138.76, 35.515], // 富士河口湖町（河口湖）
    shosenkyo: [138.57, 35.74], // 甲府市
    kitadake: [138.239, 35.674], // 南アルプス市
    yatsugatake: [138.4, 35.93], // 北杜市（八ヶ岳の南ろく）
    saruhashi: [138.985, 35.617], // 大月市
    budou: [138.73, 35.66], // 甲州市勝沼
    momo: [138.64, 35.647], // 笛吹市
    houtou: [138.569, 35.665], // 甲府市
    'amahata-suzuri': [138.337, 35.43], // 早川町雨畑
  },
  nagano: {
    zenkoji: [138.188, 36.662], // 長野市
    'matsumoto-jo': [137.969, 36.239], // 松本市
    kamikochi: [137.638, 36.251], // 松本市安曇（河童橋）
    'onsen-zaru': [138.462, 36.733], // 山ノ内町（地獄谷野猿公苑）
    karuizawa: [138.6, 36.345], // 軽井沢町
    tsumago: [137.595, 35.577], // 南木曽町
    'togakushi-soba': [138.083, 36.745], // 長野市戸隠
    nozawana: [138.443, 36.923], // 野沢温泉村
    'kawakami-retasu': [138.58, 35.94], // 川上村
    'kiso-shikki': [137.832, 35.986], // 塩尻市木曽平沢
    'shinshu-ringo': [137.826, 35.515], // 飯田市
  },
  gifu: {
    takayama: [137.26, 36.14], // 高山市
    'nagaragawa-ukai': [136.76, 35.435], // 岐阜市
    'gero-onsen': [137.245, 35.806], // 下呂市
    'gujo-odori': [136.96, 35.75], // 郡上市八幡町
    magomejuku: [137.57, 35.525], // 中津川市
    'mino-washi': [136.91, 35.54], // 美濃市
    hidagyu: [137.19, 36.24], // 飛騨市
    fuyugaki: [136.62, 35.49], // 本巣市
    minoyaki: [137.13, 35.33], // 多治見市
  },
  shizuoka: {
    'miho-matsubara': [138.52, 35], // 静岡市清水区
    jogasaki: [139.13, 34.9], // 伊東市
    'toro-iseki': [138.408, 34.955], // 静岡市駿河区
    'hamamatsu-tako': [137.73, 34.7], // 浜松市（中田島）
    kawazuzakura: [138.99, 34.75], // 河津町
    'shizuoka-cha': [138.13, 34.8], // 牧之原市
    'hamanako-unagi': [137.6, 34.73], // 浜松市・湖西市
    'amagi-wasabi': [138.94, 34.86], // 伊豆市
    'yaizu-katsuo': [138.32, 34.87], // 焼津市
  },
  aichi: {
    'inuyama-jo': [136.94, 35.388], // 犬山市
    denshogiku: [137.18, 34.63], // 田原市
    takeshima: [137.225, 34.815], // 蒲郡市
    korankei: [137.31, 35.125], // 豊田市足助
    tokonameyaki: [136.835, 34.886], // 常滑市
    'arimatsu-shibori': [136.97, 35.07], // 名古屋市緑区有松
    setoyaki: [137.08, 35.225], // 瀬戸市
    'hatcho-miso': [137.16, 34.955], // 岡崎市
    tebasaki: [136.92, 35.17], // 名古屋市
  },
  mie: {
    'ise-jingu': [136.726, 34.455], // 伊勢市
    onigajo: [136.12, 33.88], // 熊野市
    'akame-48taki': [136.1, 34.56], // 名張市
    gozaishodake: [136.42, 35.02], // 菰野町
    'ago-shinju': [136.83, 34.29], // 志摩市
    iseebi: [136.845, 34.48], // 鳥羽市
    matsusakaushi: [136.53, 34.58], // 松阪市
    bankoyaki: [136.62, 34.97], // 四日市市
    'kuwana-hamaguri': [136.7, 35.07], // 桑名市
  },
  shiga: {
    'hikone-jo': [136.252, 35.276], // 彦根市
    enryakuji: [135.84, 35.07], // 大津市
    omihachiman: [136.09, 35.14], // 近江八幡市
    'nagahama-hikiyama': [136.27, 35.38], // 長浜市
    ibukiyama: [136.415, 35.418], // 米原市
    shigarakiyaki: [136.07, 34.88], // 甲賀市信楽町
    omiushi: [136.22, 35.11], // 東近江市
    funazushi: [136.03, 35.35], // 高島市
    'omi-jofu': [136.2, 35.17], // 愛荘町
  },
  kyoto: {
    kinkaku: [135.729, 35.039], // 京都市北区
    kiyomizu: [135.785, 34.995], // 京都市東山区
    'ine-funaya': [135.27, 35.68], // 伊根町
    byodoin: [135.808, 34.889], // 宇治市
    'miyama-kayabuki': [135.63, 35.32], // 南丹市美山町
    ujicha: [135.91, 34.8], // 和束町
    'tango-chirimen': [135.06, 35.62], // 京丹後市
    manganji: [135.35, 35.45], // 舞鶴市
    'taiza-gani': [135.1, 35.72], // 京丹後市丹後町
  },
  osaka: {
    'osaka-jo': [135.526, 34.687], // 大阪市中央区
    'minoo-no-taki': [135.47, 34.855], // 箕面市
    'kishiwada-danjiri': [135.37, 34.46], // 岸和田市
    'banpaku-koen': [135.532, 34.809], // 吹田市
    takoyaki: [135.5, 34.668], // 大阪市中央区（道頓堀）
    mizunasu: [135.31, 34.4], // 泉佐野市
    'kawachi-budo': [135.63, 34.58], // 柏原市
  },
  hyogo: {
    'himeji-jo': [134.694, 34.839], // 姫路市
    'kobe-ko': [135.19, 34.683], // 神戸市中央区
    'arima-onsen': [135.247, 34.797], // 神戸市北区
    'kinosaki-onsen': [134.81, 35.625], // 豊岡市
    'akashi-tako': [134.99, 34.65], // 明石市
    'tanba-kuromame': [135.22, 35.07], // 丹波篠山市
    tajimaushi: [134.65, 35.45], // 香美町
    'banshu-soroban': [134.95, 34.88], // 小野市
    'izushi-soba': [134.87, 35.46], // 豊岡市出石町
    'awaji-tamanegi': [134.8, 34.3], // 南あわじ市
    'awaji-ningyo': [134.75, 34.26], // 南あわじ市
    'awaji-senko': [134.84, 34.48], // 淡路市一宮
  },
  nara: {
    'todaiji-daibutsu': [135.84, 34.689], // 奈良市
    'nara-shika': [135.843, 34.685], // 奈良市
    horyuji: [135.734, 34.614], // 斑鳩町
    yoshinoyama: [135.86, 34.36], // 吉野町
    odaigahara: [136.1, 34.18], // 上北山村
    'nara-zumi': [135.82, 34.68], // 奈良市
    'takayama-chasen': [135.735, 34.745], // 生駒市高山町
    kakinohazushi: [135.78, 34.36], // 五條市・吉野町
    'miwa-somen': [135.85, 34.53], // 桜井市
  },
  wakayama: {
    'kumano-kodo': [135.64, 33.84], // 田辺市本宮町
    koyasan: [135.585, 34.213], // 高野町
    shirarahama: [135.345, 33.68], // 白浜町
    shionomisaki: [135.76, 33.44], // 串本町
    'wakayama-jo': [135.171, 34.228], // 和歌山市
    'arida-mikan': [135.2, 34.08], // 有田市
    'nanko-ume': [135.37, 33.8], // みなべ町
    binchotan: [135.45, 33.83], // 田辺市
    'kishu-shikki': [135.21, 34.155], // 海南市黒江
  },
  tottori: {
    daisen: [133.54, 35.37], // 大山町
    nageiredo: [133.94, 35.4], // 三朝町
    'kurayoshi-shirakabe': [133.825, 35.43], // 倉吉市
    'kaike-onsen': [133.36, 35.45], // 米子市
    uradome: [134.36, 35.585], // 岩美町
    'beni-zuwai': [133.23, 35.54], // 境港市
    'nijisseiki-nashi': [133.87, 35.49], // 湯梨浜町
    rakkyo: [134.3, 35.54], // 鳥取市福部町
    'inshu-washi': [133.99, 35.51], // 鳥取市青谷町
  },
  shimane: {
    'izumo-taisha': [132.685, 35.402], // 出雲市
    'iwami-ginzan': [132.43, 35.11], // 大田市
    'iwami-kagura': [132.08, 34.9], // 浜田市
    tsuwano: [131.77, 34.465], // 津和野町
    sanbesan: [132.62, 35.14], // 大田市
    'shinjiko-shijimi': [132.95, 35.43], // 宍道湖（湖）
    'warigo-soba': [133, 35.2], // 奥出雲町
    'sekishu-washi': [132.2, 34.88], // 浜田市三隅町
    'oki-iwagaki': [133.3, 36.25], // 隠岐の島町
    rosokujima: [133.23, 36.29], // 隠岐の島町
  },
  okayama: {
    korakuen: [133.935, 34.667], // 岡山市
    kurashiki: [133.772, 34.596], // 倉敷市
    hiruzen: [133.68, 35.3], // 真庭市
    'bitchu-matsuyama-jo': [133.62, 34.81], // 高梁市
    bizenyaki: [134.19, 34.73], // 備前市
    'okayama-hakuto': [134.02, 34.76], // 赤磐市
    'okayama-muscat': [133.87, 34.78], // 岡山市北区
    'okayama-denim': [133.46, 34.6], // 井原市
  },
  hiroshima: {
    onomichi: [133.2, 34.41], // 尾道市
    tomonoura: [133.38, 34.38], // 福山市
    taishakukyo: [133.23, 34.84], // 庄原市
    sandankyo: [132.2, 34.63], // 安芸太田町
    takehara: [132.91, 34.34], // 竹原市
    'hiroshima-kaki': [132.45, 34.3], // 広島湾
    okonomiyaki: [132.46, 34.39], // 広島市
    'kumano-fude': [132.585, 34.335], // 熊野町
    'setoda-lemon': [133.08, 34.3], // 尾道市瀬戸田（生口島）
  },
  yamaguchi: {
    kintaikyo: [132.178, 34.168], // 岩国市
    'tsunoshima-ohashi': [130.89, 34.35], // 下関市豊北町
    hagi: [131.4, 34.41], // 萩市
    rurikoji: [131.47, 34.19], // 山口市
    motonosumi: [131.03, 34.43], // 長門市
    'shimonoseki-fugu': [130.945, 33.957], // 下関市
    hagiyaki: [131.17, 34.34], // 長門市深川
    'oshima-mikan': [132.25, 33.93], // 周防大島町
  },
  tokushima: {
    'awa-odori': [134.55, 34.07], // 徳島市
    'iya-kazurabashi': [133.8, 33.875], // 三好市西祖谷
    tsurugisan: [134.094, 33.853], // 三好市・那賀町
    'hiwasa-umigame': [134.54, 33.73], // 美波町
    udatsu: [134.15, 34.07], // 美馬市脇町
    sudachi: [134.35, 33.95], // 神山町
    aizome: [134.48, 34.12], // 藍住町
    'naruto-kintoki': [134.57, 34.18], // 鳴門市
  },
  kagawa: {
    kotohiragu: [133.81, 34.184], // 琴平町
    ritsurin: [134.046, 34.33], // 高松市
    yashima: [134.1, 34.36], // 高松市
    zenigata: [133.645, 34.13], // 観音寺市
    'sanuki-udon': [133.86, 34.31], // 坂出市
    'shodoshima-olive': [134.28, 34.48], // 小豆島町
    'marugame-uchiwa': [133.8, 34.29], // 丸亀市
    ajiishi: [134.16, 34.36], // 高松市庵治町
  },
  ehime: {
    'dogo-onsen': [132.786, 33.852], // 松山市
    shimanami: [133.03, 34.14], // 今治市
    ishizuchisan: [133.115, 33.768], // 西条市・久万高原町
    sadamisaki: [132.03, 33.345], // 伊方町
    'besshi-dozan': [133.33, 33.89], // 新居浜市
    'imabari-towel': [133, 34.06], // 今治市
    'ehime-mikan': [132.43, 33.46], // 八幡浜市
    jakoten: [132.56, 33.22], // 宇和島市
    tobeyaki: [132.79, 33.75], // 砥部町
  },
  kochi: {
    katsurahama: [133.575, 33.497], // 高知市
    murotomisaki: [134.176, 33.245], // 室戸市
    ashizurimisaki: [133.02, 32.72], // 土佐清水市
    yosakoi: [133.53, 33.56], // 高知市
    ryugado: [133.75, 33.6], // 香美市
    niyodogawa: [133.3, 33.55], // いの町・仁淀川町
    'katsuo-tataki': [133.23, 33.33], // 中土佐町
    'kochi-yuzu': [134.05, 33.56], // 馬路村
    'tosa-washi': [133.42, 33.6], // いの町
  },
  fukuoka: {
    dazaifu: [130.535, 33.521], // 太宰府市
    mojiko: [130.965, 33.945], // 北九州市門司区
    yanagawa: [130.4, 33.163], // 柳川市
    akizuki: [130.69, 33.46], // 朝倉市
    'hakata-ramen': [130.42, 33.59], // 福岡市博多区
    yamecha: [130.56, 33.21], // 八女市
    'fukuoka-ichigo': [130.51, 33.32], // 久留米市
    koishiwarayaki: [130.84, 33.43], // 東峰村
  },
  saga: {
    'karatsu-kunchi': [129.97, 33.45], // 唐津市
    mutsugoro: [130.18, 33.15], // 鹿島市・白石町
    okawachiyama: [129.85, 33.24], // 伊万里市大川内山
    'takeo-onsen': [130.02, 33.195], // 武雄市
    aritayaki: [129.88, 33.19], // 有田町
    'yobuko-ika': [129.89, 33.545], // 唐津市呼子町
    'saga-nori': [130.25, 33.17], // 佐賀市・小城市
    ureshinocha: [130.06, 33.1], // 嬉野市
  },
  nagasaki: {
    meganebashi: [129.884, 32.749], // 長崎市
    unzen: [130.26, 32.74], // 雲仙市
    hirado: [129.555, 33.37], // 平戸市
    'shimabara-yusui': [130.37, 32.79], // 島原市
    castella: [129.87, 32.74], // 長崎市
    hasamiyaki: [129.9, 33.14], // 波佐見町
    'nagasaki-biwa': [129.76, 32.59], // 長崎市野母崎
    'goto-kyokai': [128.87, 32.73], // 五島市（福江島）
    'goto-takahama': [128.64, 32.64], // 五島市三井楽
    onidake: [128.84, 32.66], // 五島市
  },
  kumamoto: {
    'kumamoto-jo': [130.706, 32.806], // 熊本市
    asosan: [131.085, 32.884], // 阿蘇市
    'kurokawa-onsen': [131.14, 33.08], // 南小国町
    'kikuchi-keikoku': [130.93, 33.03], // 菊池市
    'yamaga-toro': [130.69, 33.015], // 山鹿市
    'yatsushiro-igusa': [130.6, 32.51], // 八代市
    'kumamoto-suika': [130.69, 32.89], // 熊本市北区植木
    sakitsu: [130.03, 32.32], // 天草市河浦町
    'amakusa-iruka': [130.17, 32.52], // 天草市五和町
    'amakusa-kurumaebi': [130.1, 32.4], // 上天草市・天草市
  },
  oita: {
    yufuin: [131.37, 33.265], // 由布市
    yabakei: [131.15, 33.47], // 中津市
    'usuki-sekibutsu': [131.77, 33.1], // 臼杵市
    kunisaki: [131.6, 33.57], // 国東市
    kuju: [131.24, 33.08], // 九重町・竹田市
    'seki-aji': [131.87, 33.26], // 大分市佐賀関
    kabosu: [131.4, 32.97], // 竹田市
    'oita-shiitake': [131.58, 32.98], // 豊後大野市
    ontayaki: [130.96, 33.39], // 日田市
  },
  miyazaki: {
    takachiho: [131.3, 32.7], // 高千穂町
    aoshima: [131.47, 31.8], // 宮崎市青島
    'udo-jingu': [131.475, 31.65], // 日南市
    toimisaki: [131.34, 31.37], // 串間市
    obi: [131.35, 31.63], // 日南市飫肥
    'miyazaki-mango': [131.4, 32.11], // 西都市
    'chicken-nanban': [131.42, 31.91], // 宮崎市・延岡市
    hyuganatsu: [131.62, 32.42], // 日向市
    'miyakonojo-daikyu': [131.06, 31.72], // 都城市
  },
  kagoshima: {
    'kirishima-jingu': [130.87, 31.86], // 霧島市
    'ibusuki-sunamushi': [130.65, 31.22], // 指宿市
    kaimondake: [130.53, 31.18], // 指宿市
    karukan: [130.54, 31.575], // 鹿児島市
    'sogi-no-taki': [130.5, 32.08], // 伊佐市
    satsumayaki: [130.38, 31.62], // 日置市美山
    satsumaimo: [130.4, 31.35], // 南九州市
    kurobuta: [130.85, 31.38], // 鹿屋市
    'kagoshima-cha': [131.1, 31.48], // 志布志市
    sakurajima: [130.66, 31.58], // 鹿児島市桜島
    'sakurajima-daikon': [130.6, 31.6], // 鹿児島市桜島
    jomonsugi: [130.53, 30.36], // 屋久島町
  },
  okinawa: {
    shurijo: [127.719, 26.217], // 那覇市首里
    manzamo: [127.795, 26.505], // 恩納村
    kourijima: [128.02, 26.7], // 今帰仁村
    'sefa-utaki': [127.827, 26.172], // 南城市
    eisa: [127.8, 26.33], // 沖縄市
    goya: [127.98, 26.59], // 名護市
    'okinawa-pineapple': [128.15, 26.63], // 東村
    bingata: [127.7, 26.22], // 那覇市
    'ryukyu-glass': [127.74, 26.4], // 読谷村
    kabirawan: [124.14, 24.46], // 石垣市
    'ishigaki-gyu': [124.2, 24.4], // 石垣市
    hirakubozaki: [124.31, 24.61], // 石垣市
  },
};

export interface EnclaveGeo {
  /** 1枚のマップに並べる範囲。2つ以上なら左から順に並べ、島どうしは船でつなぐ */
  panels: BBox[];
  /** panels が2つ以上のとき、船の行き先の名前（RubyText。フィールドの看板に出る） */
  panelNames?: string[];
  /** フェリーが着く港 */
  port: LonLat;
  chest?: LonLat;
  event?: LonLat;
}

export const ENCLAVE_GEO: Record<string, EnclaveGeo> = {
  'niigata-enclave': {
    panels: [[138.18, 37.78, 138.6, 38.35]],
    port: [138.435, 38.08],
    chest: [138.26, 38.04],
  },
  'shimane-enclave': { panels: [[132.92, 35.95, 133.43, 36.36]], port: [133.33, 36.2] },
  'hyogo-enclave': { panels: [[134.7, 34.14, 135.06, 34.62]], port: [135.02, 34.585] },
  'nagasaki-enclave': { panels: [[128.6, 32.55, 129.1, 33.0]], port: [128.845, 32.695] },
  'kumamoto-enclave': { panels: [[129.93, 32.1, 130.55, 32.65]], port: [130.195, 32.455] },
  'kagoshima-enclave': {
    panels: [
      [130.55, 31.52, 130.78, 31.67], // 桜島
      [130.36, 30.22, 130.7, 30.47], // 屋久島
    ],
    panelNames: ['桜島[さくらじま]', '屋久島[やくしま]'],
    port: [130.6, 31.59],
    chest: [130.53, 30.36], // 縄文杉
    event: [130.66, 31.58], // 桜島の火口
  },
  'tokyo-enclave': {
    panels: [[139.22, 34.49, 139.48, 34.81]],
    port: [139.36, 34.75],
    event: [139.395, 34.725],
  },
  'okinawa-enclave': { panels: [[123.65, 24.18, 124.36, 24.62]], port: [124.16, 24.34] },
};

/** 地方マップで、本土から離れているので左下に小さく入れて船でつなぐ県 */
export interface RegionInset {
  areas: string[];
  /** 船の行き先の名前（行き / 帰り。RubyText） */
  name: string;
  mainName: string;
}

export const REGION_INSETS: Record<string, RegionInset> = {
  'kyushu-okinawa': { areas: ['okinawa'], name: '沖縄[おきなわ]', mainName: '九州[きゅうしゅう]' },
};

/**
 * 湖。地球地図日本の県境データは湖を陸として含むので、ここで水にする。
 * 琵琶湖だけは Natural Earth の形を使う（gen-terrain.ts）。
 *   ellipse: 中心と半径 [東西km, 南北km]、rot は東から反時計回りの角度
 */
export type Lake =
  { name: string; center: LonLat; r: [number, number]; rot?: number } | { name: string; ring: LonLat[] };

export const LAKES: Lake[] = [
  { name: '十和田湖', center: [140.885, 40.468], r: [5, 4.2] },
  { name: '田沢湖', center: [140.664, 39.722], r: [3, 3] },
  { name: '小川原湖', center: [141.325, 40.785], r: [2.5, 8] },
  { name: '十三湖', center: [140.345, 41.02], r: [2.8, 2.5] },
  { name: '猪苗代湖', center: [140.09, 37.48], r: [5, 7] },
  {
    name: '霞ヶ浦',
    ring: [
      [140.195, 36.075],
      [140.25, 36.1],
      [140.29, 36.135],
      [140.31, 36.165],
      [140.335, 36.15],
      [140.33, 36.11],
      [140.37, 36.075],
      [140.43, 36.045],
      [140.49, 36.01],
      [140.54, 35.975],
      [140.555, 35.955],
      [140.53, 35.945],
      [140.47, 35.965],
      [140.41, 35.985],
      [140.34, 36.01],
      [140.27, 36.035],
      [140.22, 36.05],
    ],
  },
  {
    name: '北浦',
    ring: [
      [140.5, 36.135],
      [140.525, 36.13],
      [140.55, 36.07],
      [140.585, 36.0],
      [140.6, 35.955],
      [140.585, 35.945],
      [140.565, 35.99],
      [140.53, 36.05],
      [140.5, 36.1],
    ],
  },
  { name: '印旛沼', center: [140.215, 35.775], r: [2, 2.5] },
  { name: '中禅寺湖', center: [139.47, 36.735], r: [3.2, 1.5] },
  { name: '芦ノ湖', center: [139.02, 35.215], r: [1.1, 3.2] },
  { name: '河口湖', center: [138.76, 35.515], r: [2.6, 0.8] },
  { name: '山中湖', center: [138.875, 35.415], r: [2.6, 1.1] },
  { name: '西湖', center: [138.68, 35.5], r: [1.8, 0.5] },
  { name: '本栖湖', center: [138.585, 35.46], r: [1.3, 1.1] },
  { name: '諏訪湖', center: [138.085, 36.05], r: [2, 1.5] },
  { name: '浜名湖', center: [137.57, 34.75], r: [5, 6.5] },
  { name: '三方五湖', center: [135.89, 35.565], r: [1.8, 3] },
  { name: '湖山池', center: [134.17, 35.51], r: [1.8, 1.2] },
  { name: '宍道湖', center: [132.96, 35.45], r: [8.5, 3] },
  { name: '中海', center: [133.2, 35.48], r: [6, 4.5] },
  { name: '池田湖', center: [130.565, 31.235], r: [2, 2] },
  { name: 'サロマ湖', center: [143.93, 44.13], r: [12, 3.5], rot: -29 },
  { name: '屈斜路湖', center: [144.34, 43.625], r: [6, 4] },
  { name: '摩周湖', center: [144.535, 43.58], r: [2.8, 2.3] },
  { name: '阿寒湖', center: [144.1, 43.45], r: [2.5, 2] },
  { name: '支笏湖', center: [141.33, 42.765], r: [6, 4.5] },
  { name: '洞爺湖', center: [140.855, 42.605], r: [5, 4.5] },
];
