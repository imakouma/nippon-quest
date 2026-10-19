import type { LonLat } from './geo.js';

export type InterPrefectureInfrastructure = 'landBorder' | 'bridge' | 'tunnel' | 'seaRoute';
export type InterPrefectureTravelMode = 'walk' | 'bicycle' | 'roadVehicle' | 'rail' | 'ferry';
export type TransportUnlockRole = 'chapter' | 'story' | 'shortcut' | 'special';

export interface TransportEndpoint {
  areaId: string;
  at: LonLat;
  placement: 'land' | 'coast';
  placeId: string;
  nameKey: string;
}

export interface TransportLink {
  id: string;
  areas: [string, string];
  infrastructure: Exclude<InterPrefectureInfrastructure, 'landBorder'>;
  travelMode: InterPrefectureTravelMode;
  unlockRole: TransportUnlockRole;
  labelKey: string;
  endpoints: [TransportEndpoint, TransportEndpoint];
}

function transportLink(
  id: string,
  areas: [string, string],
  infrastructure: TransportLink['infrastructure'],
  travelMode: TransportLink['travelMode'],
  unlockRole: TransportUnlockRole,
  endpoints: [
    { at: LonLat; placement: TransportEndpoint['placement']; placeId: string },
    { at: LonLat; placement: TransportEndpoint['placement']; placeId: string },
  ],
): TransportLink {
  return {
    id,
    areas,
    infrastructure,
    travelMode,
    unlockRole,
    labelKey: `field.interPrefecture.links.${id}.label`,
    endpoints: endpoints.map((endpoint, index) => ({
      areaId: areas[index]!,
      ...endpoint,
      nameKey: `field.interPrefecture.links.${id}.${areas[index]}`,
    })) as [TransportEndpoint, TransportEndpoint],
  };
}

/** 2026-10-18に正規一次情報で現行性を固定した9つの実在交通。 */
export const TRANSPORT_LINKS: readonly TransportLink[] = [
  transportLink('aomori-hokkaido-seikan', ['aomori', 'hokkaido'], 'tunnel', 'rail', 'chapter', [
    { at: [140.693365, 40.827555], placement: 'land', placeId: 'shin-aomori-station' },
    { at: [140.648361, 41.904694], placement: 'land', placeId: 'shin-hakodate-hokuto-station' },
  ]),
  transportLink('hokkaido-ibaraki-ferry', ['hokkaido', 'ibaraki'], 'seaRoute', 'ferry', 'chapter', [
    { at: [141.6349943, 42.6383137], placement: 'coast', placeId: 'tomakomai-west-port' },
    { at: [140.573477, 36.309282], placement: 'coast', placeId: 'oarai-port' },
  ]),
  transportLink('hyogo-tokushima-bridge', ['hyogo', 'tokushima'], 'bridge', 'roadVehicle', 'shortcut', [
    { at: [135.06823886065, 34.665034258653], placement: 'coast', placeId: 'tarumi-ic' },
    { at: [134.630137, 34.217246], placement: 'coast', placeId: 'naruto-kita-ic' },
  ]),
  transportLink('okayama-kagawa-bridge', ['okayama', 'kagawa'], 'bridge', 'rail', 'chapter', [
    { at: [133.91827, 34.66675], placement: 'land', placeId: 'okayama-station' },
    { at: [134.0466705, 34.3507249], placement: 'land', placeId: 'takamatsu-station' },
  ]),
  transportLink('hiroshima-ehime-bridge', ['hiroshima', 'ehime'], 'bridge', 'bicycle', 'chapter', [
    { at: [133.193667, 34.404833], placement: 'coast', placeId: 'onomichi-station' },
    { at: [132.974444, 34.111667], placement: 'coast', placeId: 'sunrise-itoyama' },
  ]),
  transportLink('ehime-oita-ferry', ['ehime', 'oita'], 'seaRoute', 'ferry', 'special', [
    { at: [132.11757, 33.39039], placement: 'coast', placeId: 'misaki-port' },
    { at: [131.8649353, 33.2499369], placement: 'coast', placeId: 'saganoseki-port' },
  ]),
  transportLink('yamaguchi-fukuoka-kanmon', ['yamaguchi', 'fukuoka'], 'tunnel', 'walk', 'chapter', [
    {
      at: [130.9560572, 33.9653136],
      placement: 'coast',
      placeId: 'kanmon-pedestrian-shimonoseki',
    },
    { at: [130.962944, 33.961346], placement: 'coast', placeId: 'kanmon-pedestrian-moji' },
  ]),
  transportLink('nagasaki-kumamoto-ferry', ['nagasaki', 'kumamoto'], 'seaRoute', 'ferry', 'story', [
    { at: [130.372712, 32.766964], placement: 'coast', placeId: 'shimabara-port' },
    { at: [130.5900397, 32.763555], placement: 'coast', placeId: 'kumamoto-port' },
  ]),
  transportLink('kagoshima-okinawa-ferry', ['kagoshima', 'okinawa'], 'seaRoute', 'ferry', 'story', [
    { at: [130.568714, 31.5804424], placement: 'coast', placeId: 'kagoshima-shinko' },
    {
      at: [127.6760697, 26.240637],
      placement: 'coast',
      placeId: 'naha-shinko-a-line-terminal',
    },
  ]),
];
