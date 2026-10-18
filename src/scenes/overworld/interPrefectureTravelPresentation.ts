import type {
  InterPrefectureInfrastructure,
  InterPrefectureLink,
  InterPrefectureTravelMode,
} from './interPrefectureLink';

type Translate = (key: string, values?: Record<string, string | number>) => string;
type TransportInfrastructure = Exclude<InterPrefectureInfrastructure, 'landBorder'>;

export type InterPrefectureTravelIcon =
  | 'travel-bridge-road'
  | 'travel-bridge-rail'
  | 'travel-bridge-bicycle'
  | 'travel-tunnel-rail'
  | 'travel-tunnel-walk'
  | 'travel-ferry';

export interface InterPrefectureTravelPresentation {
  icon: InterPrefectureTravelIcon;
  title: string;
  infrastructureLabel: string;
  travelModeLabel: string;
  routeLabel: string;
  departureLabel: string;
  destinationLabel: string;
  confirm: string;
  depart: string;
  arrive: string;
  skip: string;
}

const ICONS: Readonly<
  Record<TransportInfrastructure, Partial<Record<InterPrefectureTravelMode, InterPrefectureTravelIcon>>>
> = {
  bridge: {
    roadVehicle: 'travel-bridge-road',
    rail: 'travel-bridge-rail',
    bicycle: 'travel-bridge-bicycle',
  },
  tunnel: {
    rail: 'travel-tunnel-rail',
    walk: 'travel-tunnel-walk',
  },
  seaRoute: { ferry: 'travel-ferry' },
};

/**
 * 実在交通の確認画面と短い移動演出に渡す文言を組み立てる。
 * 描画方式や時間には触れず、低スペック向けの静止表示にも同じモデルを使える。
 */
export function interPrefectureTravelPresentation(
  link: InterPrefectureLink,
  translate: Translate,
): InterPrefectureTravelPresentation | null {
  if (link.infrastructure === 'landBorder') return null;

  const infrastructure = link.infrastructure;
  const icon = ICONS[infrastructure][link.travelMode];
  if (!icon)
    throw new Error(`${link.id}: ${link.infrastructure} / ${link.travelMode} の移動表示は未定義です`);

  const routeKey = link.labelKey ?? `field.interPrefecture.links.${link.id}.label`;
  const departureKey = link.endpointNameKey ?? `field.interPrefecture.links.${link.id}.${link.currentArea}`;
  const destinationKey = `field.interPrefecture.links.${link.id}.${link.targetArea}`;
  const infrastructureLabel = translate(`field.interPrefecture.infrastructure.${infrastructure}`);
  const travelModeLabel = translate(`field.interPrefecture.travelMode.${link.travelMode}`);
  const routeLabel = translate(routeKey);
  const departureLabel = translate(departureKey);
  const destinationLabel = translate(destinationKey);

  return {
    icon,
    title: translate(`field.interPrefecture.title.${infrastructure}`, { mode: travelModeLabel }),
    infrastructureLabel,
    travelModeLabel,
    routeLabel,
    departureLabel,
    destinationLabel,
    confirm: translate('field.interPrefecture.confirm', {
      route: routeLabel,
      to: destinationLabel,
    }),
    depart: translate('field.interPrefecture.depart', {
      from: departureLabel,
      mode: travelModeLabel,
    }),
    arrive: translate('field.interPrefecture.arrive', { to: destinationLabel }),
    skip: translate('field.interPrefecture.skip'),
  };
}
