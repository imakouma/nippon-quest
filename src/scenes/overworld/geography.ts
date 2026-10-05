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
