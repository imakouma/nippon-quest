/** 図鑑の地理順。ストーリー攻略順とは分け、北海道から沖縄へ北→南に並べる。 */
export const GEOGRAPHIC_AREA_ORDER = [
  'hokkaido',
  'aomori',
  'iwate',
  'miyagi',
  'akita',
  'yamagata',
  'fukushima',
  'ibaraki',
  'tochigi',
  'gunma',
  'saitama',
  'chiba',
  'tokyo',
  'kanagawa',
  'niigata',
  'toyama',
  'ishikawa',
  'fukui',
  'yamanashi',
  'nagano',
  'gifu',
  'shizuoka',
  'aichi',
  'mie',
  'shiga',
  'kyoto',
  'osaka',
  'hyogo',
  'nara',
  'wakayama',
  'tottori',
  'shimane',
  'okayama',
  'hiroshima',
  'yamaguchi',
  'tokushima',
  'kagawa',
  'ehime',
  'kochi',
  'fukuoka',
  'saga',
  'nagasaki',
  'kumamoto',
  'oita',
  'miyazaki',
  'kagoshima',
  'okinawa',
] as const;

/** 図鑑で使う、一般的な8地方区分。 */
export const DEX_REGIONS = [
  { id: 'hokkaido', nameKey: 'field.mapRegionHokkaido', areas: ['hokkaido'] },
  {
    id: 'tohoku',
    nameKey: 'field.mapRegionTohoku',
    areas: ['aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima'],
  },
  {
    id: 'kanto',
    nameKey: 'field.mapRegionKanto',
    areas: ['ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa'],
  },
  {
    id: 'chubu',
    nameKey: 'field.mapRegionChubu',
    areas: [
      'niigata',
      'toyama',
      'ishikawa',
      'fukui',
      'yamanashi',
      'nagano',
      'gifu',
      'shizuoka',
      'aichi',
      'mie',
    ],
  },
  {
    id: 'kinki',
    nameKey: 'field.mapRegionKinki',
    areas: ['shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama'],
  },
  {
    id: 'chugoku',
    nameKey: 'field.mapRegionChugoku',
    areas: ['tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi'],
  },
  { id: 'shikoku', nameKey: 'field.mapRegionShikoku', areas: ['tokushima', 'kagawa', 'ehime', 'kochi'] },
  {
    id: 'kyushu-okinawa',
    nameKey: 'field.mapRegionKyushuOkinawa',
    areas: ['fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa'],
  },
] as const;

export function dexRegionOf(areaId: string): (typeof DEX_REGIONS)[number] {
  return DEX_REGIONS.find((region) => (region.areas as readonly string[]).includes(areaId)) ?? DEX_REGIONS[0];
}

export type MapKind = 'field' | 'town' | 'dungeon' | 'secret' | 'enclave';

export function mapKind(key: string): MapKind {
  if (key.endsWith('-town')) return 'town';
  if (key.endsWith('-dungeon')) return 'dungeon';
  if (key.endsWith('-secret')) return 'secret';
  if (key.endsWith('-enclave')) return 'enclave';
  return 'field';
}

export function areaIdFromMapKey(key: string): string {
  return key.split('-')[0] ?? '';
}
