/**
 * 47都道府県のマスタ。コードは JIS X 0401 の順（01 北海道 … 47 沖縄）。
 * island は docs/00 §2.1 の島区分。scaffold-area.ts が content/prefectures/<id>.json の雛形を生成するのに使う。
 */
export interface PrefectureMaster {
  code: string; // "01"〜"47"
  id: string; // ローマ字 id（content の area id）
  name: string; // RubyText
  capital: string; // RubyText
  island: string;
}

export interface IslandMaster {
  id: string;
  name: string;
  order: number;
  recommendedGrade: [1 | 2 | 3 | 4 | 5 | 6, 1 | 2 | 3 | 4 | 5 | 6];
}

export const ISLANDS: IslandMaster[] = [
  { id: 'tohoku', name: '東北[とうほく]の島[しま]', order: 1, recommendedGrade: [1, 6] },
  { id: 'hokkaido', name: '北海道[ほっかいどう]の島[しま]', order: 2, recommendedGrade: [1, 6] },
  { id: 'kanto', name: '関東[かんとう]の島[しま]', order: 3, recommendedGrade: [2, 6] },
  { id: 'hokuriku', name: '北陸[ほくりく]の島[しま]', order: 4, recommendedGrade: [2, 6] },
  { id: 'koshinetsu', name: '甲信[こうしん]の島[しま]', order: 5, recommendedGrade: [3, 6] },
  { id: 'tokai', name: '東海[とうかい]の島[しま]', order: 6, recommendedGrade: [3, 6] },
  { id: 'kinki', name: '近畿[きんき]の島[しま]', order: 7, recommendedGrade: [4, 6] },
  { id: 'chugoku', name: '中国[ちゅうごく]の島[しま]', order: 8, recommendedGrade: [4, 6] },
  { id: 'shikoku', name: '四国[しこく]の島[しま]', order: 9, recommendedGrade: [5, 6] },
  {
    id: 'kyushu-okinawa',
    name: '九州[きゅうしゅう]・沖縄[おきなわ]の島[しま]',
    order: 10,
    recommendedGrade: [5, 6],
  },
];

export interface EnclaveDef {
  prefId: string;
  enclaveId: string;
  name: string;
  ferryName: string;
  chestItem: string;
  chestItemName: string;
}

export const ENCLAVES: EnclaveDef[] = [
  {
    prefId: 'niigata',
    enclaveId: 'niigata-enclave',
    name: '佐渡島[さどがしま]',
    ferryName: '佐渡島フェリー',
    chestItem: 'common-tetsu',
    chestItemName: '佐渡の金鉱石',
  },
  {
    prefId: 'shimane',
    enclaveId: 'shimane-enclave',
    name: '隠岐諸島[おきしょとう]',
    ferryName: '隠岐諸島フェリー',
    chestItem: 'herb',
    chestItemName: '隠岐の薬草',
  },
  {
    prefId: 'hyogo',
    enclaveId: 'hyogo-enclave',
    name: '淡路島[あわじしま]',
    ferryName: '淡路島フェリー',
    chestItem: 'herb',
    chestItemName: '淡路のたまねぎ',
  },
  {
    prefId: 'nagasaki',
    enclaveId: 'nagasaki-enclave',
    name: '五島列島[ごとうれっとう]',
    ferryName: '五島列島フェリー',
    chestItem: 'herb',
    chestItemName: '五島うどん',
  },
  {
    prefId: 'kumamoto',
    enclaveId: 'kumamoto-enclave',
    name: '天草諸島[あまくさしょとう]',
    ferryName: '天草諸島フェリー',
    chestItem: 'herb',
    chestItemName: '天草の塩',
  },
  {
    prefId: 'kagoshima',
    enclaveId: 'kagoshima-enclave',
    name: '桜島[さくらじま]・屋久島[やくしま]',
    ferryName: '桜島・離島フェリー',
    chestItem: 'herb',
    chestItemName: '屋久杉のかけら',
  },
  {
    prefId: 'tokyo',
    enclaveId: 'tokyo-enclave',
    name: '伊豆諸島[いずしょとう]',
    ferryName: '伊豆諸島フェリー',
    chestItem: 'herb',
    chestItemName: '明日葉',
  },
  {
    prefId: 'okinawa',
    enclaveId: 'okinawa-enclave',
    name: '八重山諸島[やえやましょとう]',
    ferryName: '八重山諸島フェリー',
    chestItem: 'herb',
    chestItemName: '石垣のパイナップル',
  },
];

export const PREFECTURES: PrefectureMaster[] = [
  {
    code: '01',
    id: 'hokkaido',
    name: '北海道[ほっかいどう]',
    capital: '札幌市[さっぽろし]',
    island: 'hokkaido',
  },
  { code: '02', id: 'aomori', name: '青森県[あおもりけん]', capital: '青森市[あおもりし]', island: 'tohoku' },
  { code: '03', id: 'iwate', name: '岩手県[いわてけん]', capital: '盛岡市[もりおかし]', island: 'tohoku' },
  { code: '04', id: 'miyagi', name: '宮城県[みやぎけん]', capital: '仙台市[せんだいし]', island: 'tohoku' },
  { code: '05', id: 'akita', name: '秋田県[あきたけん]', capital: '秋田市[あきたし]', island: 'tohoku' },
  {
    code: '06',
    id: 'yamagata',
    name: '山形県[やまがたけん]',
    capital: '山形市[やまがたし]',
    island: 'tohoku',
  },
  {
    code: '07',
    id: 'fukushima',
    name: '福島県[ふくしまけん]',
    capital: '福島市[ふくしまし]',
    island: 'tohoku',
  },
  { code: '08', id: 'ibaraki', name: '茨城県[いばらきけん]', capital: '水戸市[みとし]', island: 'kanto' },
  {
    code: '09',
    id: 'tochigi',
    name: '栃木県[とちぎけん]',
    capital: '宇都宮市[うつのみやし]',
    island: 'kanto',
  },
  { code: '10', id: 'gunma', name: '群馬県[ぐんまけん]', capital: '前橋市[まえばしし]', island: 'kanto' },
  { code: '11', id: 'saitama', name: '埼玉県[さいたまけん]', capital: 'さいたま市[し]', island: 'kanto' },
  { code: '12', id: 'chiba', name: '千葉県[ちばけん]', capital: '千葉市[ちばし]', island: 'kanto' },
  { code: '13', id: 'tokyo', name: '東京都[とうきょうと]', capital: '東京[とうきょう]', island: 'kanto' },
  {
    code: '14',
    id: 'kanagawa',
    name: '神奈川県[かながわけん]',
    capital: '横浜市[よこはまし]',
    island: 'kanto',
  },
  {
    code: '15',
    id: 'niigata',
    name: '新潟県[にいがたけん]',
    capital: '新潟市[にいがたし]',
    island: 'hokuriku',
  },
  { code: '16', id: 'toyama', name: '富山県[とやまけん]', capital: '富山市[とやまし]', island: 'hokuriku' },
  {
    code: '17',
    id: 'ishikawa',
    name: '石川県[いしかわけん]',
    capital: '金沢市[かなざわし]',
    island: 'hokuriku',
  },
  { code: '18', id: 'fukui', name: '福井県[ふくいけん]', capital: '福井市[ふくいし]', island: 'hokuriku' },
  {
    code: '19',
    id: 'yamanashi',
    name: '山梨県[やまなしけん]',
    capital: '甲府市[こうふし]',
    island: 'koshinetsu',
  },
  { code: '20', id: 'nagano', name: '長野県[ながのけん]', capital: '長野市[ながのし]', island: 'koshinetsu' },
  { code: '21', id: 'gifu', name: '岐阜県[ぎふけん]', capital: '岐阜市[ぎふし]', island: 'tokai' },
  {
    code: '22',
    id: 'shizuoka',
    name: '静岡県[しずおかけん]',
    capital: '静岡市[しずおかし]',
    island: 'tokai',
  },
  { code: '23', id: 'aichi', name: '愛知県[あいちけん]', capital: '名古屋市[なごやし]', island: 'tokai' },
  { code: '24', id: 'mie', name: '三重県[みえけん]', capital: '津市[つし]', island: 'tokai' },
  { code: '25', id: 'shiga', name: '滋賀県[しがけん]', capital: '大津市[おおつし]', island: 'kinki' },
  { code: '26', id: 'kyoto', name: '京都府[きょうとふ]', capital: '京都市[きょうとし]', island: 'kinki' },
  { code: '27', id: 'osaka', name: '大阪府[おおさかふ]', capital: '大阪市[おおさかし]', island: 'kinki' },
  { code: '28', id: 'hyogo', name: '兵庫県[ひょうごけん]', capital: '神戸市[こうべし]', island: 'kinki' },
  { code: '29', id: 'nara', name: '奈良県[ならけん]', capital: '奈良市[ならし]', island: 'kinki' },
  {
    code: '30',
    id: 'wakayama',
    name: '和歌山県[わかやまけん]',
    capital: '和歌山市[わかやまし]',
    island: 'kinki',
  },
  {
    code: '31',
    id: 'tottori',
    name: '鳥取県[とっとりけん]',
    capital: '鳥取市[とっとりし]',
    island: 'chugoku',
  },
  { code: '32', id: 'shimane', name: '島根県[しまねけん]', capital: '松江市[まつえし]', island: 'chugoku' },
  {
    code: '33',
    id: 'okayama',
    name: '岡山県[おかやまけん]',
    capital: '岡山市[おかやまし]',
    island: 'chugoku',
  },
  {
    code: '34',
    id: 'hiroshima',
    name: '広島県[ひろしまけん]',
    capital: '広島市[ひろしまし]',
    island: 'chugoku',
  },
  {
    code: '35',
    id: 'yamaguchi',
    name: '山口県[やまぐちけん]',
    capital: '山口市[やまぐちし]',
    island: 'chugoku',
  },
  {
    code: '36',
    id: 'tokushima',
    name: '徳島県[とくしまけん]',
    capital: '徳島市[とくしまし]',
    island: 'shikoku',
  },
  { code: '37', id: 'kagawa', name: '香川県[かがわけん]', capital: '高松市[たかまつし]', island: 'shikoku' },
  { code: '38', id: 'ehime', name: '愛媛県[えひめけん]', capital: '松山市[まつやまし]', island: 'shikoku' },
  { code: '39', id: 'kochi', name: '高知県[こうちけん]', capital: '高知市[こうちし]', island: 'shikoku' },
  {
    code: '40',
    id: 'fukuoka',
    name: '福岡県[ふくおかけん]',
    capital: '福岡市[ふくおかし]',
    island: 'kyushu-okinawa',
  },
  { code: '41', id: 'saga', name: '佐賀県[さがけん]', capital: '佐賀市[さがし]', island: 'kyushu-okinawa' },
  {
    code: '42',
    id: 'nagasaki',
    name: '長崎県[ながさきけん]',
    capital: '長崎市[ながさきし]',
    island: 'kyushu-okinawa',
  },
  {
    code: '43',
    id: 'kumamoto',
    name: '熊本県[くまもとけん]',
    capital: '熊本市[くまもとし]',
    island: 'kyushu-okinawa',
  },
  {
    code: '44',
    id: 'oita',
    name: '大分県[おおいたけん]',
    capital: '大分市[おおいたし]',
    island: 'kyushu-okinawa',
  },
  {
    code: '45',
    id: 'miyazaki',
    name: '宮崎県[みやざきけん]',
    capital: '宮崎市[みやざきし]',
    island: 'kyushu-okinawa',
  },
  {
    code: '46',
    id: 'kagoshima',
    name: '鹿児島県[かごしまけん]',
    capital: '鹿児島市[かごしまし]',
    island: 'kyushu-okinawa',
  },
  {
    code: '47',
    id: 'okinawa',
    name: '沖縄県[おきなわけん]',
    capital: '那覇市[なはし]',
    island: 'kyushu-okinawa',
  },
];
