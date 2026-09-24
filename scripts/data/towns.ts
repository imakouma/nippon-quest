/**
 * 町の見た目（県ごとの特ちょう）。scripts/scaffold-maps.ts の townMap が使う。
 * 名所・特産品・気候（雪・南の島）から、地面・木・屋根・広場のまん中・畑・海ぞい・小物 を えらぶ。
 * note は「なぜ その見た目か」（実在の名所・特産品）。タイルは src/scenes/overworld/townTiles.ts。
 */

export type TownGround = 'grass' | 'snow' | 'sand';
export type TownTree = 'round' | 'pine' | 'snowPine' | 'palm' | 'sakura' | 'bamboo';
export type TownRoof = 'red' | 'blue' | 'green' | 'brown' | 'kawara' | 'ryukyu' | 'snow' | 'thatch';
/** 広場の まん中に 立つ もの */
export type TownPlaza =
  | 'fountain'
  | 'castle'
  | 'redCastle'
  | 'pagoda'
  | 'shrine'
  | 'onsen'
  | 'lighthouse'
  | 'tower'
  | 'clock'
  | 'float'
  | 'dino';
/** 南の 畑（左と右の 2 か所） */
export type TownField =
  | 'apple'
  | 'mikan'
  | 'peach'
  | 'pear'
  | 'grape'
  | 'rice'
  | 'tea'
  | 'lavender'
  | 'tulip'
  | 'cabbage'
  | 'pineapple'
  | 'nemophila'
  | 'strawberry'
  | 'wheat'
  | 'watermelon';
/** 町に ちらばる 小物 */
export type TownExtra = 'snowmen' | 'shisa' | 'deer' | 'steam' | 'seaTorii';
/** 街灯の かわり */
export type TownLamp = 'street' | 'stone' | 'paper';

/** 町の 形。'town' は むら（広場と 畑と 家）、'city' は 都会（駅・大通り・ビル街） */
export type TownStyle = 'town' | 'city';

export interface TownTheme {
  ground: TownGround;
  tree: TownTree;
  roofs: TownRoof[];
  plaza: TownPlaza;
  fields: [TownField, TownField];
  lamp: TownLamp;
  /** 北が 海（みなと。船と 桟橋） */
  coast: boolean;
  extras: TownExtra[];
  note: string;
  /** 省略は 'town'。'city' の 県は 都会の 町（駅・大通り・ビル街。CITY_LOOKS も 見る） */
  style?: TownStyle;
}

const t = (
  ground: TownGround,
  tree: TownTree,
  roofs: TownRoof[],
  plaza: TownPlaza,
  fields: [TownField, TownField],
  lamp: TownLamp,
  coast: boolean,
  extras: TownExtra[],
  note: string,
  style?: TownStyle,
): TownTheme => ({
  ground,
  tree,
  roofs,
  plaza,
  fields,
  lamp,
  coast,
  extras,
  note,
  ...(style ? { style } : {}),
});

/** 都会の ビルの 色（townTiles.ts の 184〜207。glass=ガラス・brick=れんが・white=白・steel=銀） */
export type CityBuilding = 'glass' | 'brick' | 'white' | 'steel';
/** 電光の 看板の 色（townTiles.ts の 176〜178） */
export type CitySign = 'red' | 'blue' | 'green';

export interface CityLook {
  /** 町に ならぶ ビルの しゅるい（県ごとに ちがう くみあわせ） */
  buildings: CityBuilding[];
  sign: CitySign;
}

/** 都会の 10 県（style: 'city'）の ビルと 看板。県ごとに 見た目を 変える */
export const CITY_LOOKS: Record<string, CityLook> = {
  hokkaido: { buildings: ['glass', 'white'], sign: 'blue' },
  miyagi: { buildings: ['brick', 'white'], sign: 'green' },
  saitama: { buildings: ['brick', 'steel'], sign: 'red' },
  chiba: { buildings: ['glass', 'steel'], sign: 'blue' },
  tokyo: { buildings: ['glass', 'steel', 'white'], sign: 'red' },
  kanagawa: { buildings: ['glass', 'brick'], sign: 'blue' },
  aichi: { buildings: ['steel', 'white'], sign: 'green' },
  osaka: { buildings: ['brick', 'glass'], sign: 'red' },
  hyogo: { buildings: ['white', 'glass'], sign: 'green' },
  fukuoka: { buildings: ['brick', 'white'], sign: 'red' },
};

const MIX: TownRoof[] = ['red', 'blue', 'green', 'brown'];

export const TOWN_THEMES: Record<string, TownTheme> = {
  hokkaido: t(
    'snow',
    'snowPine',
    ['snow', 'blue', 'red'],
    'clock',
    ['lavender', 'wheat'],
    'street',
    true,
    ['snowmen'],
    '札幌の 都会：時計台の 駅前広場・ビルの 大通り・地下鉄の 入口',
    'city',
  ),
  aomori: t(
    'grass',
    'round',
    ['red', 'brown', 'blue'],
    'float',
    ['apple', 'apple'],
    'paper',
    true,
    [],
    'りんご畑・ねぶたの山車と ちょうちん・津軽海峡の港',
  ),
  iwate: t(
    'grass',
    'pine',
    ['kawara', 'brown'],
    'shrine',
    ['rice', 'rice'],
    'stone',
    false,
    [],
    '中尊寺・石どうろう・田んぼ',
  ),
  miyagi: t(
    'grass',
    'pine',
    ['blue', 'kawara', 'red'],
    'castle',
    ['rice', 'cabbage'],
    'paper',
    true,
    [],
    '仙台の 都会：仙台城の 駅前広場・けやきの 街路樹と ビル・新幹線の 駅',
    'city',
  ),
  akita: t(
    'snow',
    'snowPine',
    ['snow', 'kawara'],
    'float',
    ['rice', 'rice'],
    'paper',
    true,
    ['snowmen'],
    '雪の町・竿燈まつりの ちょうちん・秋田の お米',
  ),
  yamagata: t(
    'grass',
    'sakura',
    ['kawara', 'red'],
    'pagoda',
    ['apple', 'peach'],
    'stone',
    false,
    ['steam'],
    '羽黒山の五重塔・さくらんぼと もも・銀山温泉の湯けむり',
  ),
  fukushima: t(
    'grass',
    'round',
    ['kawara', 'red'],
    'castle',
    ['peach', 'peach'],
    'stone',
    false,
    [],
    '鶴ヶ城・もも畑',
  ),
  ibaraki: t(
    'grass',
    'sakura',
    MIX,
    'fountain',
    ['nemophila', 'nemophila'],
    'street',
    true,
    [],
    'ひたち海浜公園の ネモフィラ・偕楽園の うめ・海',
  ),
  tochigi: t(
    'grass',
    'pine',
    ['kawara', 'brown'],
    'shrine',
    ['strawberry', 'strawberry'],
    'stone',
    false,
    [],
    '日光東照宮・いちご畑',
  ),
  gunma: t(
    'grass',
    'pine',
    ['kawara', 'brown'],
    'onsen',
    ['cabbage', 'cabbage'],
    'stone',
    false,
    ['steam'],
    '草津温泉の湯畑・嬬恋の キャベツ',
  ),
  saitama: t(
    'grass',
    'round',
    ['kawara', 'brown'],
    'float',
    ['tea', 'cabbage'],
    'paper',
    false,
    [],
    '大宮の 都会：鉄道の まちの 大きな 駅・秩父夜祭の 山車・ビルの 大通り',
    'city',
  ),
  chiba: t(
    'grass',
    'pine',
    ['red', 'blue'],
    'lighthouse',
    ['cabbage', 'pear'],
    'street',
    true,
    [],
    '千葉の 都会：駅前の ビル街・犬吠埼の 灯台・海ぞいの 大通り',
    'city',
  ),
  tokyo: t(
    'grass',
    'round',
    ['blue', 'red', 'green', 'kawara'],
    'tower',
    ['tulip', 'cabbage'],
    'paper',
    false,
    [],
    '東京の 都会：東京タワーと 高い ビル・大きな 駅・横断歩道',
    'city',
  ),
  kanagawa: t(
    'grass',
    'pine',
    ['kawara', 'red'],
    'shrine',
    ['mikan', 'mikan'],
    'paper',
    true,
    [],
    '横浜の 都会：みなとみらいの ビル街・中華街の 看板・鎌倉の お寺',
    'city',
  ),
  niigata: t(
    'snow',
    'snowPine',
    ['snow', 'kawara'],
    'fountain',
    ['rice', 'rice'],
    'street',
    true,
    ['snowmen'],
    '雪の町・魚沼の お米・日本海の港',
  ),
  toyama: t(
    'grass',
    'pine',
    ['thatch', 'kawara'],
    'fountain',
    ['tulip', 'tulip'],
    'stone',
    true,
    [],
    '砺波の チューリップ・五箇山の かやぶき屋根・氷見の港',
  ),
  ishikawa: t(
    'grass',
    'pine',
    ['kawara'],
    'castle',
    ['rice', 'rice'],
    'stone',
    true,
    [],
    '金沢城・兼六園の 石どうろう・白米千枚田',
  ),
  fukui: t(
    'grass',
    'round',
    ['kawara', 'blue'],
    'dino',
    ['rice', 'tulip'],
    'street',
    true,
    [],
    '勝山の 恐竜・越前水仙・越前の海',
  ),
  yamanashi: t(
    'grass',
    'round',
    ['red', 'brown'],
    'fountain',
    ['grape', 'peach'],
    'street',
    false,
    [],
    '忍野八海の わき水・ぶどうと もも',
  ),
  nagano: t(
    'grass',
    'pine',
    ['kawara', 'brown'],
    'castle',
    ['apple', 'cabbage'],
    'stone',
    false,
    ['steam'],
    '松本城・りんご・高原レタス・温泉',
  ),
  gifu: t(
    'grass',
    'pine',
    ['thatch', 'kawara'],
    'float',
    ['rice', 'rice'],
    'paper',
    false,
    [],
    '白川郷の かやぶき屋根・高山祭の 屋台',
  ),
  shizuoka: t(
    'grass',
    'pine',
    ['blue', 'kawara', 'red'],
    'fountain',
    ['tea', 'tea'],
    'street',
    true,
    [],
    '静岡の お茶畑・焼津の港',
  ),
  aichi: t(
    'grass',
    'round',
    ['kawara', 'red', 'blue'],
    'castle',
    ['cabbage', 'cabbage'],
    'street',
    false,
    [],
    '名古屋の 都会：名古屋城の 駅前広場・広い 大通りと ビル・地下鉄',
    'city',
  ),
  mie: t(
    'grass',
    'pine',
    ['kawara'],
    'shrine',
    ['tea', 'tea'],
    'stone',
    true,
    [],
    '伊勢神宮・伊勢茶・英虞湾の港',
  ),
  shiga: t(
    'grass',
    'round',
    ['kawara', 'brown'],
    'castle',
    ['rice', 'rice'],
    'stone',
    true,
    [],
    '彦根城・近江の 田んぼ・琵琶湖（北が 湖）',
  ),
  kyoto: t(
    'grass',
    'bamboo',
    ['kawara'],
    'pagoda',
    ['tea', 'tea'],
    'stone',
    false,
    [],
    '五重塔・竹林・宇治茶・石どうろう',
  ),
  osaka: t(
    'grass',
    'round',
    ['kawara', 'red', 'blue'],
    'castle',
    ['grape', 'cabbage'],
    'paper',
    false,
    [],
    '大阪の 都会：大阪城の 駅前広場・道頓堀の 電光の 看板・ビルの 谷間',
    'city',
  ),
  hyogo: t(
    'grass',
    'pine',
    ['kawara', 'red'],
    'castle',
    ['cabbage', 'rice'],
    'street',
    true,
    ['steam'],
    '神戸の 都会：姫路城の 駅前広場・港の ビル街・元町の 大通り',
    'city',
  ),
  nara: t(
    'grass',
    'sakura',
    ['kawara'],
    'pagoda',
    ['mikan', 'mikan'],
    'stone',
    false,
    ['deer'],
    '五重塔・奈良公園の シカ・吉野の さくら・柿',
  ),
  wakayama: t(
    'grass',
    'round',
    ['kawara', 'red'],
    'pagoda',
    ['mikan', 'mikan'],
    'stone',
    true,
    [],
    '高野山・有田みかん・白良浜',
  ),
  tottori: t(
    'sand',
    'pine',
    ['kawara', 'red'],
    'fountain',
    ['pear', 'pear'],
    'street',
    true,
    [],
    '鳥取砂丘・二十世紀梨・日本海',
  ),
  shimane: t('grass', 'pine', ['kawara'], 'shrine', ['rice', 'rice'], 'stone', true, [], '出雲大社・宍道湖'),
  okayama: t(
    'grass',
    'round',
    ['kawara', 'red'],
    'castle',
    ['peach', 'grape'],
    'stone',
    false,
    [],
    '岡山城・白桃・マスカット',
  ),
  hiroshima: t(
    'grass',
    'pine',
    ['kawara', 'red'],
    'shrine',
    ['mikan', 'mikan'],
    'stone',
    true,
    ['seaTorii'],
    '厳島神社の 海の鳥居・瀬戸田の レモン',
  ),
  yamaguchi: t(
    'grass',
    'pine',
    ['kawara', 'red'],
    'pagoda',
    ['mikan', 'mikan'],
    'stone',
    true,
    [],
    '瑠璃光寺の五重塔・周防大島の みかん・下関の港',
  ),
  tokushima: t(
    'grass',
    'round',
    ['kawara', 'blue'],
    'fountain',
    ['mikan', 'rice'],
    'paper',
    true,
    [],
    '阿波おどりの ちょうちん・すだち・鳴門の海',
  ),
  kagawa: t(
    'grass',
    'round',
    ['kawara', 'brown'],
    'shrine',
    ['wheat', 'wheat'],
    'stone',
    true,
    [],
    '金刀比羅宮・うどんの 小麦・瀬戸内の海',
  ),
  ehime: t(
    'grass',
    'round',
    ['kawara', 'red'],
    'onsen',
    ['mikan', 'mikan'],
    'stone',
    true,
    ['steam'],
    '道後温泉・愛媛の みかん・瀬戸内の海',
  ),
  kochi: t(
    'grass',
    'palm',
    ['red', 'blue'],
    'lighthouse',
    ['mikan', 'mikan'],
    'street',
    true,
    [],
    '室戸岬の 灯台・ゆず・桂浜',
  ),
  fukuoka: t(
    'grass',
    'sakura',
    ['red', 'blue', 'kawara'],
    'shrine',
    ['strawberry', 'tea'],
    'paper',
    true,
    [],
    '博多の 都会：太宰府天満宮の 駅前広場・博多駅の ビル街・屋台',
    'city',
  ),
  saga: t(
    'grass',
    'round',
    ['kawara', 'brown'],
    'float',
    ['tea', 'rice'],
    'paper',
    true,
    [],
    '唐津くんちの 曳山・嬉野茶・有明海',
  ),
  nagasaki: t(
    'grass',
    'round',
    ['red', 'blue', 'kawara'],
    'fountain',
    ['mikan', 'mikan'],
    'paper',
    true,
    [],
    'ランタンフェスティバルの ちょうちん・びわ・長崎港',
  ),
  kumamoto: t(
    'grass',
    'round',
    ['kawara', 'brown'],
    'castle',
    ['watermelon', 'watermelon'],
    'stone',
    false,
    ['steam'],
    '熊本城・スイカ畑・黒川温泉',
  ),
  oita: t(
    'grass',
    'round',
    ['kawara', 'red'],
    'onsen',
    ['cabbage', 'mikan'],
    'stone',
    true,
    ['steam'],
    '別府温泉の 湯けむり・かぼす',
  ),
  miyazaki: t(
    'grass',
    'palm',
    ['red', 'blue'],
    'shrine',
    ['pineapple', 'pineapple'],
    'street',
    true,
    [],
    '鵜戸神宮・ヤシの木・マンゴー',
  ),
  kagoshima: t(
    'grass',
    'palm',
    ['kawara', 'red'],
    'onsen',
    ['tea', 'cabbage'],
    'stone',
    true,
    ['steam'],
    '指宿の 砂むし温泉・鹿児島の お茶・さつまいも',
  ),
  okinawa: t(
    'grass',
    'palm',
    ['ryukyu'],
    'redCastle',
    ['pineapple', 'pineapple'],
    'street',
    true,
    ['shisa'],
    '首里城・赤がわらの 屋根と シーサー・パイナップル・海',
  ),
};
