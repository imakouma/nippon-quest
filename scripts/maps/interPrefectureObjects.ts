import type { LonLat } from '../data/geo.js';
import type { TransportLink } from '../data/interPrefectureLinks.js';
import type { LandBorderLink } from '../terrain/prefectureBorders.js';

type Pt = [number, number];

interface Property {
  name: string;
  type: 'string';
  value: string;
}

export interface InterPrefectureObjectDefinition {
  name: string;
  type: string;
  at: Pt;
  properties?: Property[];
}

interface LandPlacement {
  w: number;
  cells: string;
  tile(position: LonLat): Pt;
  idx(position: Pt): number;
  coastal(index: number): boolean;
}

interface ObjectPlacer {
  gate(target: Pt, allowed: (index: number) => boolean): Pt;
  hasImmediateArrival(index: number): boolean;
  besideImmediate(at: Pt, preferred?: readonly number[]): Pt;
}

const stringProperty = (name: string, value: string): Property => ({ name, type: 'string', value });

/** 正規カタログから、県境・実在交通の入口と隣接する相互到着点を生成する。 */
export function interPrefectureObjectDefinitions(input: {
  prefId: string;
  land: LandPlacement;
  place: ObjectPlacer;
  inMain(index: number): boolean;
  borders: readonly LandBorderLink[];
  transports: readonly TransportLink[];
}): InterPrefectureObjectDefinition[] {
  const { prefId, land, place, inMain } = input;
  const definitions: InterPrefectureObjectDefinition[] = [];
  const adjacent = (index: number) => {
    const x = index % land.w;
    return [index + land.w, x < land.w - 1 ? index + 1 : -1, x > 0 ? index - 1 : -1, index - land.w].filter(
      (candidate) => candidate >= 0 && candidate < land.cells.length,
    );
  };
  const add = (
    link: LandBorderLink | TransportLink,
    target: LonLat,
    allowed: (index: number) => boolean,
    extra: Property[] = [],
  ) => {
    const targetArea = link.areas.find((areaId) => areaId !== prefId);
    if (!targetArea) throw new Error(`${link.id}: ${prefId} の相手県がありません`);
    try {
      const entry = place.gate(land.tile(target), (index) =>
        Boolean(inMain(index) && allowed(index) && place.hasImmediateArrival(index)),
      );
      const entryIndex = land.idx(entry);
      const outside =
        link.infrastructure === 'landBorder'
          ? adjacent(entryIndex).filter((candidate) => land.cells[candidate] === 'x')
          : [];
      const arrival = place.besideImmediate(
        entry,
        outside.map((candidate) => entryIndex * 2 - candidate),
      );
      definitions.push(
        {
          name: `interpref_${link.id}`,
          type: 'interPrefectureLink',
          at: entry,
          properties: [
            stringProperty('linkId', link.id),
            stringProperty('targetArea', targetArea),
            stringProperty('targetMap', `${targetArea}-field`),
            stringProperty('targetSpawn', `from_${link.id}`),
            stringProperty('firstTargetSpawn', 'spawn'),
            stringProperty('infrastructure', link.infrastructure),
            stringProperty('travelMode', link.travelMode),
            ...extra,
          ],
        },
        { name: `from_${link.id}`, type: 'spawn', at: arrival },
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`${link.id} (${link.areas.join(' ↔ ')}): ${detail}`);
    }
  };

  for (const link of input.borders) {
    if (!link.areas.includes(prefId)) continue;
    add(link, link.anchor, (index) => adjacent(index).some((candidate) => land.cells[candidate] === 'x'));
  }
  for (const link of input.transports) {
    const endpoint = link.endpoints.find((candidate) => candidate.areaId === prefId);
    if (!endpoint) continue;
    add(link, endpoint.at, (index) => endpoint.placement === 'land' || land.coastal(index), [
      stringProperty('unlockRole', link.unlockRole),
      stringProperty('labelKey', link.labelKey),
      stringProperty('placeId', endpoint.placeId),
      stringProperty('endpointNameKey', endpoint.nameKey),
    ]);
  }
  return definitions;
}
