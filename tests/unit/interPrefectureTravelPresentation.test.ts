import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type {
  InterPrefectureInfrastructure,
  InterPrefectureLink,
  InterPrefectureTravelMode,
} from '../../src/scenes/overworld/interPrefectureLink';
import { interPrefectureTravelPresentation } from '../../src/scenes/overworld/interPrefectureTravelPresentation';
import { format, lookup, type I18nDict, type I18nVars } from '../../src/ui/i18n';

const ja = JSON.parse(
  readFileSync(new URL('../../content/i18n/ja.json', import.meta.url), 'utf8'),
) as I18nDict;
const translate = (key: string, values?: I18nVars): string => format(lookup(ja, key) ?? key, values);

function link(
  infrastructure: InterPrefectureInfrastructure,
  travelMode: InterPrefectureTravelMode,
): InterPrefectureLink {
  return {
    id: 'aomori-hokkaido-seikan',
    currentArea: 'aomori',
    targetArea: 'hokkaido',
    areas: ['aomori', 'hokkaido'],
    targetMap: 'hokkaido-field',
    targetSpawn: 'from_aomori-hokkaido-seikan',
    firstTargetSpawn: 'spawn',
    infrastructure,
    travelMode,
    labelKey: 'field.interPrefecture.links.aomori-hokkaido-seikan.label',
    endpointNameKey: 'field.interPrefecture.links.aomori-hokkaido-seikan.aomori',
  };
}

describe('実在交通リンクの表示モデル', () => {
  it.each([
    ['bridge', 'roadVehicle', 'travel-bridge-road', '車[くるま]で 橋[はし]を わたる'],
    ['bridge', 'rail', 'travel-bridge-rail', '列車[れっしゃ]で 橋[はし]を わたる'],
    ['bridge', 'bicycle', 'travel-bridge-bicycle', '自転車[じてんしゃ]で 橋[はし]を わたる'],
    ['tunnel', 'rail', 'travel-tunnel-rail', '列車[れっしゃ]で トンネルを すすむ'],
    ['tunnel', 'walk', 'travel-tunnel-walk', '徒歩[とほ]で トンネルを すすむ'],
    ['seaRoute', 'ferry', 'travel-ferry', 'フェリーで 海[うみ]を わたる'],
  ] as const)('%s / %s を種類別のアイコンと短いタイトルにする', (infrastructure, mode, icon, title) => {
    expect(interPrefectureTravelPresentation(link(infrastructure, mode), translate)).toMatchObject({
      icon,
      title,
    });
  });

  it('路線名と両端名を使って、確認・出発・到着・スキップ文言を作る', () => {
    expect(interPrefectureTravelPresentation(link('tunnel', 'rail'), translate)).toEqual({
      icon: 'travel-tunnel-rail',
      title: '列車[れっしゃ]で トンネルを すすむ',
      infrastructureLabel: 'トンネル',
      travelModeLabel: '列車[れっしゃ]',
      routeLabel: '北海道新幹線[ほっかいどうしんかんせん]・青函[せいかん]トンネル',
      departureLabel: '新青森駅[しんあおもりえき]',
      destinationLabel: '新函館北斗駅[しんはこだてほくとえき]',
      confirm:
        '北海道新幹線[ほっかいどうしんかんせん]・青函[せいかん]トンネルで 新函館北斗駅[しんはこだてほくとえき]へ 行[い]きますか？',
      depart: '新青森駅[しんあおもりえき]から 列車[れっしゃ]で 出発[しゅっぱつ]！',
      arrive: '新函館北斗駅[しんはこだてほくとえき]に 到着[とうちゃく]！',
      skip: '移動[いどう]を スキップ',
    });
  });

  it('9交通リンクの路線名・両端名がすべて辞書にあり、料金や時刻を表示しない', () => {
    const routes = [
      ['aomori-hokkaido-seikan', 'aomori', 'hokkaido'],
      ['hokkaido-ibaraki-ferry', 'hokkaido', 'ibaraki'],
      ['hyogo-tokushima-bridge', 'hyogo', 'tokushima'],
      ['okayama-kagawa-bridge', 'okayama', 'kagawa'],
      ['hiroshima-ehime-bridge', 'hiroshima', 'ehime'],
      ['ehime-oita-ferry', 'ehime', 'oita'],
      ['yamaguchi-fukuoka-kanmon', 'yamaguchi', 'fukuoka'],
      ['nagasaki-kumamoto-ferry', 'nagasaki', 'kumamoto'],
      ['kagoshima-okinawa-ferry', 'kagoshima', 'okinawa'],
    ] as const;
    for (const [id, first, second] of routes) {
      const values = [
        lookup(ja, `field.interPrefecture.links.${id}.label`),
        lookup(ja, `field.interPrefecture.links.${id}.${first}`),
        lookup(ja, `field.interPrefecture.links.${id}.${second}`),
      ];
      expect(values.every(Boolean), id).toBe(true);
      expect(values.join(' '), id).not.toMatch(/料金|運賃|時刻|ダイヤ|\d+円/);
    }
  });

  it('陸続きの県境門は実在交通の演出モデルにしない', () => {
    expect(interPrefectureTravelPresentation(link('landBorder', 'walk'), translate)).toBeNull();
  });
});
