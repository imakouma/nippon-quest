/** 県フィールドとは別マップを持つ、実在する離島・飛び地の正規一覧。 */
export interface EnclaveDef {
  prefId: string;
  enclaveId: string;
  name: string;
  ferryName: string;
  chestItem: string;
  chestItemName: string;
}

export const ENCLAVES: readonly EnclaveDef[] = [
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
    chestItem: 'shimane-oki-iwagaki',
    chestItemName: '隠岐[おき]の 岩[いわ]がき',
  },
  {
    prefId: 'hyogo',
    enclaveId: 'hyogo-enclave',
    name: '淡路島[あわじしま]',
    ferryName: '淡路島フェリー',
    chestItem: 'hyogo-awaji-tamanegi',
    chestItemName: '淡路[あわじ]の たまねぎ',
  },
  {
    prefId: 'nagasaki',
    enclaveId: 'nagasaki-enclave',
    name: '五島列島[ごとうれっとう]',
    ferryName: '五島列島フェリー',
    chestItem: 'nagasaki-goto-udon',
    chestItemName: '五島[ごとう]うどん',
  },
  {
    prefId: 'kumamoto',
    enclaveId: 'kumamoto-enclave',
    name: '天草諸島[あまくさしょとう]',
    ferryName: '天草諸島フェリー',
    chestItem: 'kumamoto-amakusa-kurumaebi',
    chestItemName: '天草[あまくさ]の 車[くるま]えび',
  },
  {
    prefId: 'kagoshima',
    enclaveId: 'kagoshima-enclave',
    name: '桜島[さくらじま]・屋久島[やくしま]',
    ferryName: '桜島・離島フェリー',
    chestItem: 'kagoshima-yakusugi-no-kakera',
    chestItemName: '屋久杉[やくすぎ]の かけら',
  },
  {
    prefId: 'tokyo',
    enclaveId: 'tokyo-enclave',
    name: '伊豆諸島[いずしょとう]',
    ferryName: '伊豆諸島フェリー',
    chestItem: 'tokyo-ashitaba',
    chestItemName: '明日葉[あしたば]',
  },
  {
    prefId: 'okinawa',
    enclaveId: 'okinawa-enclave',
    name: '八重山諸島[やえやましょとう]',
    ferryName: '八重山諸島フェリー',
    chestItem: 'okinawa-okinawa-pineapple',
    chestItemName: '石垣[いしがき]の パイナップル',
  },
];
